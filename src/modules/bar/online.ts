import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { barEstoqueMovimentos, barPedidosOnline, barPedidosOnlineItens, barRetiradas, barTickets, barVendas, barVendasItens } from "@/db/schema";
import { paymentProvider } from "@/modules/pagamentos";
import { gerarCodigoTicket, ticketPorCodigo } from "./caixa";
import { prepararConsumo } from "./consumo";

// Pedido online do Bar: o cliente paga por Pix ou cartão pelo site. O estoque
// fica reservado por alguns minutos; pago, vira uma venda (origem "online") com
// ticket/QR para retirar no balcão.

export const MINUTOS_RESERVA_BAR = 15;
export const MAX_PEDIDOS_PENDENTES = 3;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Devolve ao estoque a reserva de um pedido que não foi pago.
async function liberarReserva(tx: Tx, pedidoId: string, novoStatus: "expirado" | "cancelado") {
  const [pedido] = await tx.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, pedidoId)).for("update");
  if (!pedido || pedido.status !== "pendente") return false;
  const reservas = await tx
    .select()
    .from(barEstoqueMovimentos)
    .where(and(eq(barEstoqueMovimentos.pedidoOnlineId, pedido.id), eq(barEstoqueMovimentos.tipo, "reserva")));
  for (const m of reservas) {
    await tx.insert(barEstoqueMovimentos).values({
      eventoId: m.eventoId,
      produtoId: m.produtoId,
      tipo: "liberacao",
      quantidade: -m.quantidade,
      custoUnitCentavos: m.custoUnitCentavos,
      motivo: novoStatus === "expirado" ? "Reserva do pedido online vencida" : "Pedido online cancelado",
      pedidoOnlineId: pedido.id,
    });
  }
  await tx.update(barPedidosOnline).set({ status: novoStatus, encerradoEm: new Date() }).where(eq(barPedidosOnline.id, pedido.id));
  return true;
}

// Libera as reservas vencidas (chamado ao abrir telas e antes de vender).
export async function liberarReservasVencidas() {
  const vencidos = await db
    .select({ id: barPedidosOnline.id })
    .from(barPedidosOnline)
    .where(and(eq(barPedidosOnline.status, "pendente"), lt(barPedidosOnline.expiraEm, new Date())));
  for (const v of vencidos) await db.transaction((tx) => liberarReserva(tx, v.id, "expirado"));
}

export async function cancelarPedidoPendente(pedidoId: string, usuarioId: string) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, pedidoId));
    if (!p || p.usuarioId !== usuarioId) return false;
    return liberarReserva(tx, pedidoId, "cancelado");
  });
}

// Reserva o estoque e cria o pedido pendente. Retorna o id ou uma mensagem de erro.
export async function reservarPedido(params: {
  eventoId: string;
  usuario: { id: string; name: string; email: string };
  pedido: Map<string, number>;
}): Promise<{ erro: string } | { id: string; total: number; itens: { id: string; descricao: string; valorCentavos: number }[]; expiraEm: Date }> {
  const { eventoId, usuario, pedido } = params;
  return db.transaction(async (tx) => {
    // Evita um cliente prender o estoque com vários pedidos sem pagar.
    const [{ pendentes }] = await tx
      .select({ pendentes: sql<number>`count(*)::int` })
      .from(barPedidosOnline)
      .where(and(eq(barPedidosOnline.usuarioId, usuario.id), eq(barPedidosOnline.status, "pendente")));
    if (pendentes >= MAX_PEDIDOS_PENDENTES) return { erro: "Você já tem pedidos aguardando pagamento. Pague ou cancele um deles." };

    const c = await prepararConsumo(tx, eventoId, pedido);
    if ("erro" in c) return { erro: c.erro };
    const expiraEm = new Date(Date.now() + MINUTOS_RESERVA_BAR * 60 * 1000);
    const [novo] = await tx
      .insert(barPedidosOnline)
      .values({ eventoId, usuarioId: usuario.id, nome: usuario.name, email: usuario.email, totalCentavos: c.total, expiraEm })
      .returning({ id: barPedidosOnline.id });

    const itens: { id: string; descricao: string; valorCentavos: number }[] = [];
    for (const p of c.produtos) {
      const qtd = pedido.get(p.id)!;
      const [item] = await tx
        .insert(barPedidosOnlineItens)
        .values({ pedidoId: novo.id, produtoId: p.id, nome: p.nome, quantidade: qtd, precoUnitCentavos: p.precoCentavos, custoUnitCentavos: c.custoUnit.get(p.id)! })
        .returning({ id: barPedidosOnlineItens.id });
      itens.push({ id: item.id, descricao: `${qtd}× ${p.nome}`, valorCentavos: qtd * p.precoCentavos });
    }
    for (const t of c.travados) {
      await tx.insert(barEstoqueMovimentos).values({
        eventoId,
        produtoId: t.id,
        tipo: "reserva",
        quantidade: -c.consumo.get(t.id)!,
        custoUnitCentavos: t.custoCentavos,
        motivo: "Reserva de pedido online",
        pedidoOnlineId: novo.id,
        autorId: usuario.id,
        autorNome: usuario.name,
      });
    }
    return { id: novo.id, total: c.total, itens, expiraEm };
  });
}

// Cria a cobrança no gateway (Mercado Pago ou simulador) para o pedido reservado.
export async function abrirCobranca(pedido: { id: string; email: string; itens: { id: string; descricao: string; valorCentavos: number }[]; expiraEm: Date }) {
  const pref = await paymentProvider.criarPreferencia({
    referencia: pedido.id,
    itens: pedido.itens,
    compradorEmail: pedido.email,
    expiraEm: pedido.expiraEm,
  });
  await db.update(barPedidosOnline).set({ preferenceId: pref.preferenceId, checkoutUrl: pref.checkoutUrl }).where(eq(barPedidosOnline.id, pedido.id));
  return pref;
}

// Confirma o pagamento de um pedido online: consulta o gateway (nunca confia no
// que veio na URL ou no webhook) e, se pago, gera a venda com ticket.
// Retorna false se a referência não for de um pedido do Bar.
export async function confirmarPedidoOnline(referencia: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(referencia)) return false;
  const [pedido] = await db.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, referencia));
  if (!pedido) return false;
  if (["pago", "estornado", "precisa_estorno"].includes(pedido.status) || !pedido.preferenceId) return true;

  const situacao = await paymentProvider.consultarPagamento({ preferenceId: pedido.preferenceId, referencia });
  if (situacao.status !== "pago") return true;

  await db.transaction(async (tx) => {
    const [atual] = await tx.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, pedido.id)).for("update");
    if (!atual || ["pago", "estornado", "precisa_estorno"].includes(atual.status)) return;
    const itens = await tx.select().from(barPedidosOnlineItens).where(eq(barPedidosOnlineItens.pedidoId, atual.id));

    // Pagou depois de a reserva vencer: o dinheiro entrou, então tenta reservar de novo.
    if (atual.status !== "pendente") {
      const c = await prepararConsumo(tx, atual.eventoId, new Map(itens.map((i) => [i.produtoId, i.quantidade])));
      if ("erro" in c) {
        await tx
          .update(barPedidosOnline)
          .set({ status: "precisa_estorno", gatewayPagamentoId: situacao.pagamentoId ?? null, formaPagamento: situacao.forma ?? null, pagoEm: new Date() })
          .where(eq(barPedidosOnline.id, atual.id));
        return;
      }
      for (const t of c.travados) {
        await tx.insert(barEstoqueMovimentos).values({
          eventoId: atual.eventoId,
          produtoId: t.id,
          tipo: "reserva",
          quantidade: -c.consumo.get(t.id)!,
          custoUnitCentavos: t.custoCentavos,
          motivo: "Reserva de pedido online (pago após vencer)",
          pedidoOnlineId: atual.id,
        });
      }
    }

    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${atual.eventoId}))`);
    const [{ proximo }] = await tx
      .select({ proximo: sql<number>`coalesce(max(${barVendas.numero}), 0)::int + 1` })
      .from(barVendas)
      .where(eq(barVendas.eventoId, atual.eventoId));
    const custo = itens.reduce((s, i) => s + i.quantidade * i.custoUnitCentavos, 0);
    const [venda] = await tx
      .insert(barVendas)
      .values({
        eventoId: atual.eventoId,
        caixaId: null,
        numero: proximo,
        origem: "online",
        formaPagamento: situacao.forma ?? "pix",
        totalCentavos: atual.totalCentavos,
        custoTotalCentavos: custo,
        operadorId: atual.usuarioId,
        operadorNome: `Online: ${atual.nome}`,
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
    await tx.insert(barTickets).values({ vendaId: venda.id, codigo: gerarCodigoTicket() });
    // A reserva vira a baixa definitiva da venda (o estorno devolve por aqui).
    await tx
      .update(barEstoqueMovimentos)
      .set({ tipo: "venda", vendaId: venda.id, motivo: `Venda online nº ${proximo}` })
      .where(and(eq(barEstoqueMovimentos.pedidoOnlineId, atual.id), eq(barEstoqueMovimentos.tipo, "reserva")));
    await tx
      .update(barPedidosOnline)
      .set({
        status: "pago",
        vendaId: venda.id,
        pagoEm: new Date(),
        gatewayPagamentoId: situacao.pagamentoId ?? null,
        formaPagamento: situacao.forma ?? null,
        parcelas: situacao.parcelas ?? null,
        encerradoEm: new Date(),
      })
      .where(eq(barPedidosOnline.id, atual.id));
  });
  return true;
}

export async function pedidoDoCliente(id: string, usuarioId: string) {
  const [pedido] = await db.select().from(barPedidosOnline).where(and(eq(barPedidosOnline.id, id), eq(barPedidosOnline.usuarioId, usuarioId)));
  if (!pedido) return null;
  const itens = await db.select().from(barPedidosOnlineItens).where(eq(barPedidosOnlineItens.pedidoId, pedido.id)).orderBy(asc(barPedidosOnlineItens.nome));
  const [ticket] = pedido.vendaId ? await db.select().from(barTickets).where(eq(barTickets.vendaId, pedido.vendaId)) : [];
  // Saldo de retirada por item (QR inteligente): quanto já foi entregue de cada um.
  const entrega = ticket ? ((await ticketPorCodigo(ticket.codigo))?.itens ?? []) : [];
  return { ...pedido, itens, ticket: ticket ?? null, entrega };
}

// Situação de entrega de um pedido pago: quanto já foi retirado no balcão.
export type EntregaPedido = { total: number; retirados: number; ticket: string };

// Pedidos do cliente com a situação de entrega (para a lista "Meus pedidos").
export async function pedidosDoClienteComEntrega(usuarioId: string, limite = 30) {
  const pedidos = await pedidosDoCliente(usuarioId, limite);
  const ids = pedidos.map((p) => p.vendaId).filter((v): v is string => Boolean(v));
  const entrega = new Map<string, EntregaPedido>();
  if (ids.length > 0) {
    const [itens, retiradas, tickets] = await Promise.all([
      db
        .select({ vendaId: barVendasItens.vendaId, total: sql<number>`sum(${barVendasItens.quantidade})::int` })
        .from(barVendasItens)
        .where(inArray(barVendasItens.vendaId, ids))
        .groupBy(barVendasItens.vendaId),
      db
        .select({ vendaId: barTickets.vendaId, total: sql<number>`sum(${barRetiradas.quantidade})::int` })
        .from(barRetiradas)
        .innerJoin(barTickets, eq(barTickets.id, barRetiradas.ticketId))
        .where(inArray(barTickets.vendaId, ids))
        .groupBy(barTickets.vendaId),
      db.select({ vendaId: barTickets.vendaId, status: barTickets.status }).from(barTickets).where(inArray(barTickets.vendaId, ids)),
    ]);
    for (const id of ids) {
      entrega.set(id, {
        total: itens.find((i) => i.vendaId === id)?.total ?? 0,
        retirados: retiradas.find((r) => r.vendaId === id)?.total ?? 0,
        ticket: tickets.find((t) => t.vendaId === id)?.status ?? "pendente",
      });
    }
  }
  return pedidos.map((p) => ({ ...p, entrega: p.vendaId ? (entrega.get(p.vendaId) ?? null) : null }));
}

export async function pedidosDoCliente(usuarioId: string, limite = 30) {
  return db.select().from(barPedidosOnline).where(eq(barPedidosOnline.usuarioId, usuarioId)).orderBy(desc(barPedidosOnline.criadoEm)).limit(limite);
}

// Pedidos online que a gestão precisa tratar (pagou sem estoque).
export async function pedidosComProblema(eventoId: string) {
  return db
    .select()
    .from(barPedidosOnline)
    .where(and(eq(barPedidosOnline.eventoId, eventoId), inArray(barPedidosOnline.status, ["precisa_estorno"])));
}
