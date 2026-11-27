"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { barCaixas, barComandaItens, barComandas, barEstoqueMovimentos, barTickets, barVendas, barVendasItens } from "@/db/schema";
import { reaisParaCentavos } from "@/lib/formatar";
import { registrarAuditoria } from "@/modules/auditoria";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { caixaAbertoDo, FORMAS_PAGAMENTO, gerarCodigoTicket } from "@/modules/bar/caixa";
import { normalizarNumeroComanda } from "@/modules/bar/comanda";
import { prepararConsumo } from "@/modules/bar/consumo";
import { liberarReservasVencidas } from "@/modules/bar/online";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const pagina = (numero: string, aviso?: string) => `/bar/comanda/${encodeURIComponent(numero)}${aviso ? `?${aviso}` : ""}`;

export type ResultadoLancamento = { erro?: string };

export async function abrirComandaAction(form: FormData) {
  await exigirBar(["balcao", "caixa"]);
  const numero = normalizarNumeroComanda(texto(form, "numero"));
  if (!numero) redirect("/bar/comanda?erro=numero");
  redirect(pagina(numero));
}

// ------------------------------------------------------------ lançar consumo
const itemSchema = z.object({ produtoId: z.uuid(), quantidade: z.number().int().min(1).max(200) });

export async function lancarNaComandaAction(_: ResultadoLancamento, form: FormData): Promise<ResultadoLancamento> {
  const { user } = await exigirBar(["balcao", "caixa"]);
  await liberarReservasVencidas();
  const evento = await eventoEmAndamento();
  if (!evento) return { erro: "Não há evento em andamento." };
  if (!evento.usaComanda) return { erro: "A comanda está desligada neste evento." };
  const numero = normalizarNumeroComanda(texto(form, "numero"));
  if (!numero) return { erro: "Número da comanda inválido." };

  let itens: z.infer<typeof itemSchema>[];
  try {
    itens = z.array(itemSchema).min(1).max(60).parse(JSON.parse(texto(form, "carrinho")));
  } catch {
    return { erro: "Adicione pelo menos um item." };
  }
  const pedido = new Map<string, number>();
  for (const i of itens) pedido.set(i.produtoId, (pedido.get(i.produtoId) ?? 0) + i.quantidade);

  const erro = await db.transaction(async (tx) => {
    // Comanda aberta com esse número (ou cria; o índice único impede duas abertas).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`comanda:${evento.id}:${numero}`}))`);
    let [comanda] = await tx
      .select()
      .from(barComandas)
      .where(and(eq(barComandas.eventoId, evento.id), eq(barComandas.numero, numero), eq(barComandas.status, "aberta")))
      .for("update");
    if (!comanda) {
      [comanda] = await tx.insert(barComandas).values({ eventoId: evento.id, numero, abertaPorNome: user.name }).returning();
    }

    const c = await prepararConsumo(tx, evento.id, pedido);
    if ("erro" in c) return c.erro;

    for (const p of c.produtos) {
      const [item] = await tx
        .insert(barComandaItens)
        .values({
          comandaId: comanda.id,
          produtoId: p.id,
          nome: p.nome,
          quantidade: pedido.get(p.id)!,
          precoUnitCentavos: p.precoCentavos,
          custoUnitCentavos: c.custoUnit.get(p.id)!,
          lancadoPorNome: user.name,
        })
        .returning({ id: barComandaItens.id });
      // Baixa do estoque já no lançamento (o produto sai direto no balcão).
      for (const baixa of c.porProduto.get(p.id)!) {
        const alvo = c.travados.find((t) => t.id === baixa.id)!;
        await tx.insert(barEstoqueMovimentos).values({
          eventoId: evento.id,
          produtoId: alvo.id,
          tipo: "comanda",
          quantidade: -baixa.qtd,
          custoUnitCentavos: alvo.custoCentavos,
          motivo: `Comanda ${numero}`,
          comandaItemId: item.id,
          autorId: user.id,
          autorNome: user.name,
        });
      }
    }
    return null;
  });
  if (erro) return { erro };

  revalidatePath("/bar/comanda");
  revalidatePath("/bar/gestao", "layout");
  // Lançado pelo Caixa: volta para a tela de venda (o carrinho é reiniciado pela chave "n").
  if (String(form.get("voltar") ?? "") === "caixa") redirect(`/bar/caixa?ok=comanda&c=${encodeURIComponent(numero)}&n=${Date.now()}`);
  redirect(pagina(numero, "ok=lancado"));
}

// ------------------------------------------------------------ cancelar item (caixa ou gestão)
export async function cancelarItemComandaAction(form: FormData) {
  const { user } = await exigirBar("caixa");
  const itemId = z.uuid().safeParse(form.get("itemId"));
  const motivo = texto(form, "motivo").slice(0, 300);
  const numero = normalizarNumeroComanda(texto(form, "numero"));
  if (!itemId.success || !numero) redirect("/bar/comanda");
  if (motivo.length < 3) redirect(pagina(numero, "erro=motivo"));

  const resultado = await db.transaction(async (tx) => {
    const [item] = await tx.select().from(barComandaItens).where(eq(barComandaItens.id, itemId.data)).for("update");
    if (!item || item.status !== "ativo") return "item";
    const [comanda] = await tx.select().from(barComandas).where(eq(barComandas.id, item.comandaId)).for("update");
    if (!comanda || comanda.status !== "aberta") return "item";
    // Devolve exatamente o que este lançamento baixou.
    const baixas = await tx.select().from(barEstoqueMovimentos).where(eq(barEstoqueMovimentos.comandaItemId, item.id));
    for (const m of baixas.filter((b) => b.tipo === "comanda")) {
      await tx.insert(barEstoqueMovimentos).values({
        eventoId: m.eventoId,
        produtoId: m.produtoId,
        tipo: "estorno",
        quantidade: -m.quantidade,
        custoUnitCentavos: m.custoUnitCentavos,
        motivo: `Item cancelado da comanda ${comanda.numero}: ${motivo}`,
        comandaItemId: item.id,
        autorId: user.id,
        autorNome: user.name,
      });
    }
    await tx
      .update(barComandaItens)
      .set({ status: "cancelado", canceladoPorNome: user.name, canceladoEm: new Date(), motivoCancelamento: motivo })
      .where(eq(barComandaItens.id, item.id));
    return null;
  });
  if (resultado) redirect(pagina(numero, "erro=item"));
  await registrarAuditoria({ acao: "bar_comanda_item_cancelado", autor: { id: user.id, name: user.name, email: user.email }, alvo: null, detalhes: { itemId: itemId.data, motivo } });
  revalidatePath("/bar/comanda");
  revalidatePath("/bar/gestao", "layout");
  redirect(pagina(numero, "ok=cancelado"));
}

// ------------------------------------------------------------ cobrar no caixa
export async function cobrarComandaAction(form: FormData) {
  const { user } = await exigirBar("caixa");
  const evento = await eventoEmAndamento();
  const numero = normalizarNumeroComanda(texto(form, "numero"));
  if (!evento || !numero) redirect("/bar/comanda");
  const forma = texto(form, "forma") as keyof typeof FORMAS_PAGAMENTO;
  if (!(forma in FORMAS_PAGAMENTO)) redirect(pagina(numero, "erro=forma"));
  // Quem recebe precisa de um caixa aberto para a venda ser contabilizada nele:
  // se ainda não abriu, o caixa é aberto agora (troco inicial zero).
  let caixa = await caixaAbertoDo(evento.id, user.id);
  if (!caixa) {
    await db
      .insert(barCaixas)
      .values({ eventoId: evento.id, operadorId: user.id, operadorNome: user.name, valorInicialCentavos: 0 })
      .onConflictDoNothing();
    caixa = await caixaAbertoDo(evento.id, user.id);
  }
  if (!caixa) redirect(pagina(numero, "erro=caixa"));
  const caixaId = caixa.id;
  const origem = String(form.get("voltar") ?? "");

  const resultado = await db.transaction(async (tx) => {
    const [comanda] = await tx
      .select()
      .from(barComandas)
      .where(and(eq(barComandas.eventoId, evento.id), eq(barComandas.numero, numero), eq(barComandas.status, "aberta")))
      .for("update");
    if (!comanda) return "comanda";
    const itens = await tx.select().from(barComandaItens).where(and(eq(barComandaItens.comandaId, comanda.id), eq(barComandaItens.status, "ativo")));
    if (itens.length === 0) return "vazia";

    const total = itens.reduce((s, i) => s + i.quantidade * i.precoUnitCentavos, 0);
    const custo = itens.reduce((s, i) => s + i.quantidade * i.custoUnitCentavos, 0);
    let recebido: number | null = null;
    if (forma === "dinheiro") {
      const informado = texto(form, "recebido");
      recebido = informado ? reaisParaCentavos(informado) : total;
      if (recebido === null || recebido < total) return "recebido";
    }

    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${evento.id}))`);
    const [{ proximo }] = await tx
      .select({ proximo: sql<number>`coalesce(max(${barVendas.numero}), 0)::int + 1` })
      .from(barVendas)
      .where(eq(barVendas.eventoId, evento.id));
    const [venda] = await tx
      .insert(barVendas)
      .values({
        eventoId: evento.id,
        caixaId,
        numero: proximo,
        origem: "comanda",
        comandaId: comanda.id,
        formaPagamento: forma,
        totalCentavos: total,
        custoTotalCentavos: custo,
        recebidoCentavos: recebido,
        operadorId: user.id,
        operadorNome: user.name,
      })
      .returning({ id: barVendas.id });
    for (const i of itens) {
      await tx.insert(barVendasItens).values({
        vendaId: venda.id,
        produtoId: i.produtoId,
        nome: i.nome,
        quantidade: i.quantidade,
        precoUnitCentavos: i.precoUnitCentavos,
        custoUnitCentavos: i.custoUnitCentavos,
      });
    }
    // O consumo já foi entregue no balcão: o ticket nasce "entregue" (não há retirada).
    await tx.insert(barTickets).values({ vendaId: venda.id, codigo: gerarCodigoTicket(), status: "entregue", entregueEm: new Date(), entreguePorNome: "Comanda" });
    await tx.update(barComandas).set({ status: "paga", pagaEm: new Date(), vendaId: venda.id }).where(eq(barComandas.id, comanda.id));
    return `ok:${proximo}`;
  });

  if (!resultado.startsWith("ok:")) {
    if (origem === "lista") redirect(`/bar/comanda?erro=${resultado}`);
    if (origem === "gestao") redirect(`/bar/gestao/comandas?erro=${resultado}`);
    redirect(pagina(numero, `erro=${resultado}`));
  }
  revalidatePath("/bar/comanda");
  revalidatePath("/bar/caixa");
  revalidatePath("/bar/gestao", "layout");
  if (origem === "gestao") redirect(`/bar/gestao/comandas?ok=recebida`);
  redirect(`/bar/comanda?ok=paga&venda=${resultado.slice(3)}`);
}
