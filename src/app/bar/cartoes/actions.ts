"use server";

import { and, desc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { barCartoesSalvos, barPedidosOnline } from "@/db/schema";
import { emModoVerComo, obterSessao } from "@/modules/auth/sessao";
import { cartaoVencido, cartoesDoCliente, MAX_CARTOES } from "@/modules/bar/cartoes";
import { confirmarPedidoOnline } from "@/modules/bar/online";
import { paymentProvider } from "@/modules/pagamentos";
import { MAX_PARCELAS } from "@/modules/pagamentos/formas";

export type ResultadoCartao = { erro?: string; ok?: boolean };

async function sessaoDoCliente() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  return sessao;
}

// Guarda um cartão no gateway. O número e o código de segurança NUNCA chegam
// aqui: só o token de uso único gerado no navegador (MP.js) e o consentimento.
export async function salvarCartaoAction(_: ResultadoCartao, form: FormData): Promise<ResultadoCartao> {
  const sessao = await sessaoDoCliente();
  if (emModoVerComo(sessao)) return { erro: "No modo “ver como” não é possível cadastrar cartão." };
  if (!paymentProvider.suportaCartaoSalvo) return { erro: "O cartão salvo não está disponível agora." };
  if (form.get("consentimento") !== "on") return { erro: "Marque a autorização para guardar o cartão." };
  const token = z.string().min(3).max(300).safeParse(form.get("token"));
  if (!token.success) return { erro: "Não foi possível ler os dados do cartão. Tente de novo." };

  const atuais = await cartoesDoCliente(sessao.user.id);
  if (atuais.length >= MAX_CARTOES) return { erro: `Você pode guardar até ${MAX_CARTOES} cartões. Remova um para adicionar outro.` };

  try {
    const clienteId = await paymentProvider.obterOuCriarCliente(sessao.user.email);
    const cartao = await paymentProvider.salvarCartao(clienteId, token.data);
    await db
      .insert(barCartoesSalvos)
      .values({
        usuarioId: sessao.user.id,
        gatewayClienteId: clienteId,
        gatewayCartaoId: cartao.cartaoId,
        bandeira: cartao.bandeira,
        ultimos4: cartao.ultimos4,
        validade: cartao.validade,
        padrao: atuais.length === 0, // o primeiro cartão já vira o padrão
      })
      .onConflictDoNothing();
  } catch (erro) {
    // Não registra o token nem a resposta: podem conter dados do cartão.
    console.error("Falha ao salvar cartão no gateway", (erro as Error).message);
    return { erro: "Não foi possível guardar o cartão. Confira os dados e tente de novo." };
  }
  revalidatePath("/bar/cartoes");
  return { ok: true };
}

export async function definirCartaoPadraoAction(form: FormData) {
  const sessao = await sessaoDoCliente();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect("/bar/cartoes");
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(barCartoesSalvos).where(and(eq(barCartoesSalvos.id, id.data), eq(barCartoesSalvos.usuarioId, sessao.user.id)));
    if (!c) return;
    await tx.update(barCartoesSalvos).set({ padrao: false }).where(eq(barCartoesSalvos.usuarioId, sessao.user.id));
    await tx.update(barCartoesSalvos).set({ padrao: true }).where(eq(barCartoesSalvos.id, c.id));
  });
  revalidatePath("/bar/cartoes");
  redirect("/bar/cartoes");
}

export async function removerCartaoAction(form: FormData) {
  const sessao = await sessaoDoCliente();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect("/bar/cartoes");
  const [c] = await db.select().from(barCartoesSalvos).where(and(eq(barCartoesSalvos.id, id.data), eq(barCartoesSalvos.usuarioId, sessao.user.id)));
  if (!c) redirect("/bar/cartoes");
  try {
    await paymentProvider.removerCartao(c.gatewayClienteId, c.gatewayCartaoId);
  } catch (erro) {
    console.error("Falha ao remover cartão no gateway", (erro as Error).message);
    redirect("/bar/cartoes?erro=remover");
  }
  await db.delete(barCartoesSalvos).where(eq(barCartoesSalvos.id, c.id));
  // Se era o padrão, o cartão mais recente passa a ser o padrão.
  if (c.padrao) {
    const [outro] = await db
      .select({ id: barCartoesSalvos.id })
      .from(barCartoesSalvos)
      .where(and(eq(barCartoesSalvos.usuarioId, sessao.user.id), ne(barCartoesSalvos.id, c.id)))
      .orderBy(desc(barCartoesSalvos.criadoEm))
      .limit(1);
    if (outro) await db.update(barCartoesSalvos).set({ padrao: true }).where(eq(barCartoesSalvos.id, outro.id));
  }
  revalidatePath("/bar/cartoes");
  redirect("/bar/cartoes?ok=removido");
}

// Paga um pedido online pendente com o cartão salvo (o token traz o código de
// segurança e nasce no navegador; aqui ele só é repassado ao gateway).
export async function pagarComCartaoSalvoAction(_: ResultadoCartao, form: FormData): Promise<ResultadoCartao> {
  const sessao = await sessaoDoCliente();
  if (emModoVerComo(sessao)) return { erro: "No modo “ver como” não é possível comprar." };
  const dados = z
    .object({
      pedidoId: z.uuid(),
      cartaoId: z.uuid(),
      token: z.string().min(3).max(300),
      parcelas: z.coerce.number().int().min(1).max(MAX_PARCELAS),
    })
    .safeParse({ pedidoId: form.get("pedidoId"), cartaoId: form.get("cartaoId"), token: form.get("token"), parcelas: form.get("parcelas") ?? 1 });
  if (!dados.success) return { erro: "Não foi possível ler os dados do cartão. Tente de novo." };

  const [pedido] = await db.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, dados.data.pedidoId));
  if (!pedido || pedido.usuarioId !== sessao.user.id) return { erro: "Pedido não encontrado." };
  if (pedido.status !== "pendente" || pedido.expiraEm < new Date()) return { erro: "O prazo deste pedido acabou. Faça um novo pedido." };
  const cartoes = await cartoesDoCliente(sessao.user.id);
  const cartao = cartoes.find((c) => c.id === dados.data.cartaoId);
  if (!cartao) return { erro: "Cartão não encontrado." };
  if (cartaoVencido(cartao.validade)) return { erro: "Este cartão está vencido. Escolha outro." };

  let resultado;
  try {
    resultado = await paymentProvider.cobrarComCartao({
      referencia: pedido.id,
      preferenceId: pedido.preferenceId,
      valorCentavos: pedido.totalCentavos,
      descricao: "Pedido do Bar LPZ Training",
      parcelas: dados.data.parcelas,
      clienteId: cartao.gatewayClienteId,
      compradorEmail: sessao.user.email,
      cartaoId: cartao.gatewayCartaoId,
      bandeira: cartao.bandeira,
      token: dados.data.token,
    });
  } catch (erro) {
    console.error("Falha ao cobrar com cartão salvo", (erro as Error).message);
    return { erro: "Não foi possível processar o pagamento agora. Tente de novo ou pague por Pix." };
  }
  if (resultado.status === "recusado") return { erro: "O pagamento foi recusado. Confira o código de segurança ou use outro cartão." };

  // Aprovado: confirma já (o gateway é consultado de novo, nunca confiamos só na resposta).
  // Pendente: o webhook ou o botão "Já paguei" confirmam depois.
  try {
    await confirmarPedidoOnline(pedido.id);
  } catch (erro) {
    console.error("Falha ao confirmar pedido pago no cartão", (erro as Error).message);
  }
  revalidatePath("/bar");
  redirect(`/bar/pedido/${pedido.id}`);
}
