import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { db } from "@/db";
import { saldosEfetivos } from "./ficha";
import { barCaixas, barProdutos, barRetiradas, barTickets, barVendas, barVendasItens, barCategorias } from "@/db/schema";

export const FORMAS_PAGAMENTO = {
  debito: "Débito (maquininha)",
  credito: "Crédito (maquininha)",
  pix: "Pix",
  dinheiro: "Dinheiro",
} as const;
export type FormaPagamento = keyof typeof FORMAS_PAGAMENTO;
// Rótulos para exibir (inclui formas que só chegam pelo gateway, como o saldo do Mercado Pago).
export const ROTULO_FORMA: Record<string, string> = { ...FORMAS_PAGAMENTO, saldo: "Saldo Mercado Pago" };

// Sem 0/O/1/I/L para ninguém confundir ao digitar o código do ticket.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function gerarCodigoTicket() {
  return Array.from({ length: 8 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

// O QR contém o endereço do ticket; o balcão também aceita só o código.
export function extrairCodigo(valor: string) {
  const limpo = valor.trim();
  const ultimo = limpo.split(/[/?#]/).filter(Boolean).pop() ?? "";
  return ultimo.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export async function caixaAbertoDo(eventoId: string, operadorId: string) {
  const [c] = await db
    .select()
    .from(barCaixas)
    .where(and(eq(barCaixas.eventoId, eventoId), eq(barCaixas.operadorId, operadorId), sql`${barCaixas.fechadoEm} is null`))
    .limit(1);
  return c ?? null;
}

// Produtos para o caixa: só o necessário para vender (nunca o custo).
export async function produtosParaVenda(eventoId: string) {
  const [linhas, saldos] = await Promise.all([
    db
      .select({
        id: barProdutos.id,
        nome: barProdutos.nome,
        precoCentavos: barProdutos.precoCentavos,
        categoria: barCategorias.nome,
      })
      .from(barProdutos)
      .leftJoin(barCategorias, eq(barCategorias.id, barProdutos.categoriaId))
      .where(and(eq(barProdutos.eventoId, eventoId), eq(barProdutos.ativo, true), eq(barProdutos.aVenda, true)))
      .orderBy(asc(barCategorias.ordem), asc(barCategorias.nome), asc(barProdutos.nome)),
    saldosEfetivos(eventoId),
  ]);
  return linhas.map((l) => ({ ...l, saldo: saldos.get(l.id) ?? 0 }));
}

// Totais de um caixa (ou de várias vendas) por forma de pagamento — só vendas pagas.
export async function totaisPorForma(filtro: { caixaId?: string; eventoId?: string }) {
  const where = filtro.caixaId
    ? and(eq(barVendas.caixaId, filtro.caixaId), eq(barVendas.status, "paga"))
    : and(eq(barVendas.eventoId, filtro.eventoId!), eq(barVendas.status, "paga"));
  const linhas = await db
    .select({
      forma: barVendas.formaPagamento,
      vendas: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int`,
      custo: sql<number>`coalesce(sum(${barVendas.custoTotalCentavos}), 0)::int`,
    })
    .from(barVendas)
    .where(where)
    .groupBy(barVendas.formaPagamento);
  return linhas;
}

// Vendas pagas por origem: caixa (pago na hora), comanda (recebida depois) e online.
export async function totaisPorOrigem(eventoId: string) {
  return db
    .select({
      origem: barVendas.origem,
      vendas: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int`,
    })
    .from(barVendas)
    .where(and(eq(barVendas.eventoId, eventoId), eq(barVendas.status, "paga")))
    .groupBy(barVendas.origem);
}

export async function ultimasVendasDoCaixa(caixaId: string, limite = 8) {
  return db
    .select({ id: barVendas.id, numero: barVendas.numero, total: barVendas.totalCentavos, forma: barVendas.formaPagamento, status: barVendas.status, criadoEm: barVendas.criadoEm, codigo: barTickets.codigo, ticket: barTickets.status })
    .from(barVendas)
    .innerJoin(barTickets, eq(barTickets.vendaId, barVendas.id))
    .where(eq(barVendas.caixaId, caixaId))
    .orderBy(desc(barVendas.criadoEm))
    .limit(limite);
}

export async function ticketPorCodigo(codigo: string) {
  const [t] = await db
    .select({
      ticketId: barTickets.id,
      codigo: barTickets.codigo,
      status: barTickets.status,
      entregueEm: barTickets.entregueEm,
      entreguePorNome: barTickets.entreguePorNome,
      vendaId: barVendas.id,
      numero: barVendas.numero,
      total: barVendas.totalCentavos,
      forma: barVendas.formaPagamento,
      criadoEm: barVendas.criadoEm,
      eventoId: barVendas.eventoId,
    })
    .from(barTickets)
    .innerJoin(barVendas, eq(barVendas.id, barTickets.vendaId))
    .where(eq(barTickets.codigo, codigo))
    .limit(1);
  if (!t) return null;
  const lista = await db.select().from(barVendasItens).where(eq(barVendasItens.vendaId, t.vendaId));
  const retiradas = await db
    .select({ vendaItemId: barRetiradas.vendaItemId, total: sql<number>`sum(${barRetiradas.quantidade})::int` })
    .from(barRetiradas)
    .where(eq(barRetiradas.ticketId, t.ticketId))
    .groupBy(barRetiradas.vendaItemId);
  const itens = lista.map((i) => ({ ...i, retirados: retiradas.find((r) => r.vendaItemId === i.id)?.total ?? 0 }));
  // Histórico completo (prova de quem retirou o quê e quando).
  const historico = await db
    .select({ nome: barVendasItens.nome, quantidade: barRetiradas.quantidade, por: barRetiradas.entreguePorNome, em: barRetiradas.criadoEm })
    .from(barRetiradas)
    .innerJoin(barVendasItens, eq(barVendasItens.id, barRetiradas.vendaItemId))
    .where(eq(barRetiradas.ticketId, t.ticketId))
    .orderBy(asc(barRetiradas.criadoEm));
  return { ...t, itens, historico };
}

export async function ticketsPendentes(eventoId: string, limite = 20) {
  return db
    .select({ codigo: barTickets.codigo, numero: barVendas.numero, criadoEm: barVendas.criadoEm, total: barVendas.totalCentavos })
    .from(barTickets)
    .innerJoin(barVendas, eq(barVendas.id, barTickets.vendaId))
    .where(and(eq(barVendas.eventoId, eventoId), inArray(barTickets.status, ["pendente", "parcial"])))
    .orderBy(asc(barVendas.criadoEm))
    .limit(limite);
}
