"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { barCaixas, barEstoqueMovimentos, barPedidosOnline, barRetiradas, barTickets, barVendas, barVendasItens } from "@/db/schema";
import { paymentProvider } from "@/modules/pagamentos";
import { liberarReservasVencidas } from "@/modules/bar/online";
import { reaisParaCentavos } from "@/lib/formatar";
import { registrarAuditoria } from "@/modules/auditoria";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { prepararConsumo } from "@/modules/bar/consumo";
import { caixaAbertoDo, extrairCodigo, FORMAS_PAGAMENTO, gerarCodigoTicket, totaisPorForma } from "@/modules/bar/caixa";

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();

export type ResultadoVenda = { erro?: string };

// ------------------------------------------------------------ abrir / fechar caixa
export async function abrirCaixaAction(form: FormData) {
  const { user } = await exigirBar("caixa");
  const evento = await eventoEmAndamento();
  if (!evento) redirect("/bar/caixa");
  const inicial = reaisParaCentavos(texto(form, "inicial") || "0");
  if (inicial === null || inicial > 10_000_000) redirect("/bar/caixa?erro=dados");
  if (!(await caixaAbertoDo(evento.id, user.id))) {
    await db.insert(barCaixas).values({ eventoId: evento.id, operadorId: user.id, operadorNome: user.name, valorInicialCentavos: inicial });
  }
  revalidatePath("/bar/caixa");
  redirect("/bar/caixa");
}

export async function fecharCaixaAction(form: FormData) {
  const { user } = await exigirBar("caixa");
  const evento = await eventoEmAndamento();
  if (!evento) redirect("/bar/caixa");
  const caixa = await caixaAbertoDo(evento.id, user.id);
  if (!caixa) redirect("/bar/caixa");
  const contado = reaisParaCentavos(texto(form, "contado") || "0");
  if (contado === null || contado > 100_000_000) redirect("/bar/caixa/fechar?erro=dados");
  const totais = await totaisPorForma({ caixaId: caixa.id });
  const dinheiro = totais.find((t) => t.forma === "dinheiro")?.total ?? 0;
  const esperado = caixa.valorInicialCentavos + dinheiro;
  await db
    .update(barCaixas)
    .set({ fechadoEm: new Date(), dinheiroEsperadoCentavos: esperado, dinheiroContadoCentavos: contado })
    .where(eq(barCaixas.id, caixa.id));
  revalidatePath("/bar/caixa");
  revalidatePath("/bar/gestao", "layout");
  redirect("/bar/caixa?ok=fechado");
}

// ------------------------------------------------------------ vender
const itemSchema = z.object({ produtoId: z.uuid(), quantidade: z.number().int().min(1).max(500) });

// Registra a venda, abate o estoque e gera o ticket, tudo na mesma transação.
export async function registrarVendaAction(_: ResultadoVenda, form: FormData): Promise<ResultadoVenda> {
  const { user } = await exigirBar("caixa");
  await liberarReservasVencidas();
  const evento = await eventoEmAndamento();
  if (!evento) return { erro: "Não há evento em andamento." };
  if (!evento.usaCaixa) return { erro: "A venda direta no caixa está desligada neste evento." };
  const caixa = await caixaAbertoDo(evento.id, user.id);
  if (!caixa) return { erro: "Abra o caixa antes de vender." };

  let itens: z.infer<typeof itemSchema>[];
  try {
    itens = z.array(itemSchema).min(1).max(60).parse(JSON.parse(texto(form, "carrinho")));
  } catch {
    return { erro: "Adicione pelo menos um item." };
  }
  const forma = texto(form, "forma") as keyof typeof FORMAS_PAGAMENTO;
  if (!(forma in FORMAS_PAGAMENTO)) return { erro: "Escolha a forma de pagamento." };

  // Junta linhas repetidas do mesmo produto.
  const porProduto = new Map<string, number>();
  for (const i of itens) porProduto.set(i.produtoId, (porProduto.get(i.produtoId) ?? 0) + i.quantidade);

  let codigo = "";
  const erro = await db.transaction(async (tx) => {
    const c = await prepararConsumo(tx, evento.id, porProduto);
    if ("erro" in c) return c.erro;
    const { produtos: noCarrinho, travados, consumo, custoUnit, total, custo } = c;

    let recebido: number | null = null;
    if (forma === "dinheiro") {
      const informado = texto(form, "recebido");
      recebido = informado ? reaisParaCentavos(informado) : total;
      if (recebido === null || recebido < total) return "O valor recebido é menor que o total.";
    }

    // Número sequencial por evento (trava para não repetir).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${evento.id}))`);
    const [{ proximo }] = await tx
      .select({ proximo: sql<number>`coalesce(max(${barVendas.numero}), 0)::int + 1` })
      .from(barVendas)
      .where(eq(barVendas.eventoId, evento.id));

    const [venda] = await tx
      .insert(barVendas)
      .values({
        eventoId: evento.id,
        caixaId: caixa.id,
        numero: proximo,
        formaPagamento: forma,
        totalCentavos: total,
        custoTotalCentavos: custo,
        recebidoCentavos: recebido,
        operadorId: user.id,
        operadorNome: user.name,
      })
      .returning({ id: barVendas.id });

    for (const p of noCarrinho) {
      await tx.insert(barVendasItens).values({
        vendaId: venda.id,
        produtoId: p.id,
        nome: p.nome,
        quantidade: porProduto.get(p.id)!,
        precoUnitCentavos: p.precoCentavos,
        custoUnitCentavos: custoUnit.get(p.id)!,
      });
    }
    for (const t of travados) {
      await tx.insert(barEstoqueMovimentos).values({
        eventoId: evento.id,
        produtoId: t.id,
        tipo: "venda",
        quantidade: -consumo.get(t.id)!,
        custoUnitCentavos: t.custoCentavos,
        motivo: `Venda nº ${proximo}`,
        vendaId: venda.id,
        autorId: user.id,
        autorNome: user.name,
      });
    }

    codigo = gerarCodigoTicket();
    await tx.insert(barTickets).values({ vendaId: venda.id, codigo });
    return null;
  });
  if (erro) return { erro };

  revalidatePath("/bar/caixa");
  revalidatePath("/bar/gestao", "layout");
  revalidatePath("/bar");
  redirect(`/bar/ticket/${codigo}?novo=1`);
}

// ------------------------------------------------------------ balcão
export async function buscarTicketAction(form: FormData) {
  await exigirBar(["balcao", "caixa"]);
  const codigo = extrairCodigo(texto(form, "codigo"));
  const [t] = codigo ? await db.select({ id: barTickets.id }).from(barTickets).where(eq(barTickets.codigo, codigo)).limit(1) : [];
  redirect(t ? `/bar/ticket/${codigo}` : "/bar/balcao?erro=naoachou");
}

// QR inteligente: o balcão entrega os itens aos poucos (ex.: 1 de 5 cervejas por
// vez). Cada retirada vira uma linha imutável em bar_retiradas e um registro na
// auditoria, para provar depois quanto foi consumido. O saldo é sempre conferido
// no banco, nunca pelo QR.
export async function retirarItensAction(form: FormData) {
  const { user } = await exigirBar("balcao");
  const codigo = extrairCodigo(texto(form, "codigo"));
  const tudo = form.get("tudo") === "1";

  const resultado = await db.transaction(async (tx) => {
    const [ticket] = await tx.select().from(barTickets).where(eq(barTickets.codigo, codigo)).for("update");
    if (!ticket || (ticket.status !== "pendente" && ticket.status !== "parcial")) return "jaentregue";
    const [venda] = await tx.select().from(barVendas).where(eq(barVendas.id, ticket.vendaId));
    const itens = await tx.select().from(barVendasItens).where(eq(barVendasItens.vendaId, ticket.vendaId));
    const ja = await tx
      .select({ vendaItemId: barRetiradas.vendaItemId, total: sql<number>`sum(${barRetiradas.quantidade})::int` })
      .from(barRetiradas)
      .where(eq(barRetiradas.ticketId, ticket.id))
      .groupBy(barRetiradas.vendaItemId);

    const entrega: { id: string; nome: string; qtd: number }[] = [];
    let restanteDepois = 0;
    for (const i of itens) {
      const saldo = i.quantidade - (ja.find((r) => r.vendaItemId === i.id)?.total ?? 0);
      const pedido = tudo ? saldo : Math.floor(Number(texto(form, `q-${i.id}`) || 0));
      if (!Number.isFinite(pedido) || pedido < 0 || pedido > saldo) return "quantidade";
      if (pedido > 0) entrega.push({ id: i.id, nome: i.nome, qtd: pedido });
      restanteDepois += saldo - pedido;
    }
    if (entrega.length === 0) return "nada";

    for (const e of entrega) {
      await tx.insert(barRetiradas).values({ ticketId: ticket.id, vendaItemId: e.id, quantidade: e.qtd, entreguePorId: user.id, entreguePorNome: user.name });
    }
    await tx
      .update(barTickets)
      .set(restanteDepois === 0 ? { status: "entregue", entregueEm: new Date(), entreguePorNome: user.name } : { status: "parcial" })
      .where(eq(barTickets.id, ticket.id));
    return { codigo, venda: venda.numero, cliente: venda.operadorNome, entrega, restanteDepois };
  });

  if (typeof resultado === "string") redirect(`/bar/ticket/${codigo}?erro=${resultado}`);
  await registrarAuditoria({
    acao: "bar_retirada",
    autor: { id: user.id, name: user.name, email: user.email },
    alvo: null,
    detalhes: {
      ticket: resultado.codigo,
      venda: resultado.venda,
      cliente: resultado.cliente,
      itens: resultado.entrega.map((e) => `${e.qtd}x ${e.nome}`),
      restante: resultado.restanteDepois,
    },
  });
  revalidatePath("/bar/balcao");
  redirect(`/bar/ticket/${codigo}?ok=${resultado.restanteDepois === 0 ? "entregue" : "parcial"}`);
}

// ------------------------------------------------------------ estorno (gestão)
export async function estornarVendaAction(form: FormData) {
  const { user } = await exigirBar("gestao");
  const id = z.uuid().safeParse(form.get("vendaId"));
  const motivo = texto(form, "motivo").slice(0, 300);
  const volta = "/bar/gestao/vendas";
  if (!id.success || motivo.length < 3) redirect(`${volta}?erro=motivo`);

  // Venda online: devolve o dinheiro no gateway antes de devolver o estoque
  // (a chave de idempotência evita estorno duplicado se o clique repetir).
  const [pre] = await db.select().from(barVendas).where(eq(barVendas.id, id.data));
  let pedidoOnlineId: string | null = null;
  if (pre?.origem === "online" && pre.status === "paga") {
    const [tk] = await db.select().from(barTickets).where(eq(barTickets.vendaId, pre.id));
    if (!tk || tk.status !== "pendente") redirect(`${volta}?erro=entregue`);
    const [po] = await db.select().from(barPedidosOnline).where(eq(barPedidosOnline.vendaId, pre.id));
    if (!po?.gatewayPagamentoId) redirect(`${volta}?erro=gateway`);
    try {
      await paymentProvider.estornar({ pagamentoId: po.gatewayPagamentoId, valorCentavos: pre.totalCentavos, chave: `bar-${po.id}` });
    } catch (erro) {
      console.error("Falha ao estornar pedido online no gateway", (erro as Error).message);
      redirect(`${volta}?erro=gateway`);
    }
    pedidoOnlineId = po.id;
  }

  const resultado = await db.transaction(async (tx) => {
    const [venda] = await tx.select().from(barVendas).where(eq(barVendas.id, id.data)).for("update");
    if (!venda || venda.status !== "paga") return "estorno";
    const [ticket] = await tx.select().from(barTickets).where(eq(barTickets.vendaId, venda.id)).for("update");
    // Só dá para estornar enquanto o pedido NÃO foi entregue (o estoque volta).
    if (!ticket || ticket.status !== "pendente") return "entregue";
    // Devolve exatamente o que a venda baixou (produtos ou insumos das fichas).
    const baixas = await tx
      .select()
      .from(barEstoqueMovimentos)
      .where(and(eq(barEstoqueMovimentos.vendaId, venda.id), eq(barEstoqueMovimentos.tipo, "venda")));
    for (const m of baixas) {
      await tx.insert(barEstoqueMovimentos).values({
        eventoId: venda.eventoId,
        produtoId: m.produtoId,
        tipo: "estorno",
        quantidade: -m.quantidade,
        custoUnitCentavos: m.custoUnitCentavos,
        motivo: `Estorno da venda nº ${venda.numero}: ${motivo}`,
        vendaId: venda.id,
        autorId: user.id,
        autorNome: user.name,
      });
    }
    await tx.update(barTickets).set({ status: "cancelado" }).where(eq(barTickets.id, ticket.id));
    await tx
      .update(barVendas)
      .set({ status: "estornada", estornadaEm: new Date(), estornadaPorNome: user.name, motivoEstorno: motivo })
      .where(eq(barVendas.id, venda.id));
    return null;
  });
  if (resultado) redirect(`${volta}?erro=${resultado}`);
  if (pedidoOnlineId) {
    await db.update(barPedidosOnline).set({ status: "estornado", encerradoEm: new Date() }).where(eq(barPedidosOnline.id, pedidoOnlineId));
  }
  await registrarAuditoria({
    acao: "bar_venda_estornada",
    autor: { id: user.id, name: user.name, email: user.email },
    alvo: null,
    detalhes: { vendaId: id.data, motivo },
  });
  revalidatePath("/bar/gestao", "layout");
  redirect(`${volta}?ok=estornada`);
}
