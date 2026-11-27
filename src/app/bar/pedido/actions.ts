"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { barPedidosOnline } from "@/db/schema";
import { emModoVerComo, obterSessao } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { abrirCobranca, cancelarPedidoPendente, confirmarPedidoOnline, liberarReservasVencidas, reservarPedido } from "@/modules/bar/online";
import { paymentProvider } from "@/modules/pagamentos";
import { FakePaymentProvider } from "@/modules/pagamentos/fake-payment-provider";
import { MAX_PARCELAS } from "@/modules/pagamentos/formas";

export type ResultadoPedido = { erro?: string };

const itemSchema = z.object({ produtoId: z.uuid(), quantidade: z.number().int().min(1).max(50) });

// Cria o pedido online: reserva o estoque e abre a cobrança (Pix/cartão).
export async function criarPedidoOnlineAction(_: ResultadoPedido, form: FormData): Promise<ResultadoPedido> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  if (emModoVerComo(sessao)) return { erro: "No modo “ver como” não é possível comprar." };
  const evento = await eventoEmAndamento();
  if (!evento || !evento.usaOnline) return { erro: "O pedido online não está disponível agora." };

  let itens: z.infer<typeof itemSchema>[];
  try {
    itens = z.array(itemSchema).min(1).max(40).parse(JSON.parse(String(form.get("carrinho") ?? "")));
  } catch {
    return { erro: "Sua sacola está vazia." };
  }
  const pedido = new Map<string, number>();
  for (const i of itens) pedido.set(i.produtoId, (pedido.get(i.produtoId) ?? 0) + i.quantidade);

  await liberarReservasVencidas();
  const r = await reservarPedido({ eventoId: evento.id, usuario: { id: sessao.user.id, name: sessao.user.name, email: sessao.user.email }, pedido });
  if ("erro" in r) return { erro: r.erro };

  try {
    await abrirCobranca({ id: r.id, email: sessao.user.email, itens: r.itens, expiraEm: r.expiraEm });
  } catch (erro) {
    // Sem cobrança não há pedido: devolve a reserva ao estoque.
    console.error("Falha ao abrir cobrança do pedido online", (erro as Error).message);
    await cancelarPedidoPendente(r.id, sessao.user.id);
    return { erro: "Não foi possível iniciar o pagamento agora. Tente de novo em instantes." };
  }
  redirect(`/bar/pedido/${r.id}`);
}

async function pedidoDoUsuario(form: FormData) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect("/bar/pedidos");
  const [pedido] = await db.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, id.data));
  if (!pedido || pedido.usuarioId !== sessao.user.id) redirect("/bar/pedidos");
  return { sessao, pedido };
}

// Só existe em TEST_MODE (sem Mercado Pago): simula a decisão do gateway.
export async function decidirPagamentoSimuladoBarAction(form: FormData) {
  const simulador = paymentProvider instanceof FakePaymentProvider ? paymentProvider : null;
  if (process.env.TEST_MODE !== "true" || !simulador) redirect("/bar/pedidos");
  const { sessao, pedido } = await pedidoDoUsuario(form);
  if (!pedido.preferenceId) redirect(`/bar/pedido/${pedido.id}`);

  if (form.get("decisao") === "aprovar") {
    const forma = z.enum(["pix", "credito", "debito"]).catch("pix").parse(form.get("forma"));
    const parcelas = forma === "credito" ? z.coerce.number().int().min(1).max(MAX_PARCELAS).catch(1).parse(form.get("parcelas")) : 1;
    simulador.aprovarManualmente(pedido.preferenceId, forma, parcelas);
    await confirmarPedidoOnline(pedido.id);
  } else {
    simulador.recusarManualmente(pedido.preferenceId);
    await cancelarPedidoPendente(pedido.id, sessao.user.id);
  }
  revalidatePath("/bar");
  redirect(`/bar/pedido/${pedido.id}`);
}

// "Já paguei": consulta o gateway agora (útil quando o Pix compensa depois).
export async function atualizarPedidoAction(form: FormData) {
  const { pedido } = await pedidoDoUsuario(form);
  try {
    await confirmarPedidoOnline(pedido.id);
  } catch (erro) {
    console.error("Falha ao confirmar pedido online", { pedidoId: pedido.id, erro: (erro as Error).message });
  }
  redirect(`/bar/pedido/${pedido.id}`);
}

export async function cancelarPedidoOnlineAction(form: FormData) {
  const { sessao, pedido } = await pedidoDoUsuario(form);
  await cancelarPedidoPendente(pedido.id, sessao.user.id);
  revalidatePath("/bar");
  redirect("/bar/pedidos");
}
