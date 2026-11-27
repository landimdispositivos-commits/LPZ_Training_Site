import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { barComandaItens, barComandas, barVendas } from "@/db/schema";

// Número da pulseira/cartão digitado pelo atendente: maiúsculas, sem espaços,
// só letras, números e hífen (até 20 caracteres).
export function normalizarNumeroComanda(valor: string) {
  return decodeURIComponent(valor).toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "").slice(0, 20);
}

export async function comandaAberta(eventoId: string, numero: string) {
  const [c] = await db
    .select()
    .from(barComandas)
    .where(and(eq(barComandas.eventoId, eventoId), eq(barComandas.numero, numero), eq(barComandas.status, "aberta")))
    .limit(1);
  if (!c) return null;
  const itens = await db.select().from(barComandaItens).where(eq(barComandaItens.comandaId, c.id)).orderBy(asc(barComandaItens.lancadoEm));
  return { ...c, itens };
}

// Comandas abertas do evento com o total devido (só itens ativos).
export async function comandasAbertas(eventoId: string) {
  return db
    .select({
      id: barComandas.id,
      numero: barComandas.numero,
      abertaEm: barComandas.abertaEm,
      itens: sql<number>`coalesce(sum(${barComandaItens.quantidade}) filter (where ${barComandaItens.status} = 'ativo'), 0)::int`,
      total: sql<number>`coalesce(sum(${barComandaItens.quantidade} * ${barComandaItens.precoUnitCentavos}) filter (where ${barComandaItens.status} = 'ativo'), 0)::int`,
    })
    .from(barComandas)
    .leftJoin(barComandaItens, eq(barComandaItens.comandaId, barComandas.id))
    .where(and(eq(barComandas.eventoId, eventoId), eq(barComandas.status, "aberta")))
    .groupBy(barComandas.id)
    .orderBy(desc(barComandas.abertaEm));
}

// Comandas já pagas, com a forma de pagamento e quem recebeu.
export async function comandasPagas(eventoId: string, limite = 100) {
  return db
    .select({
      id: barComandas.id,
      numero: barComandas.numero,
      pagaEm: barComandas.pagaEm,
      total: barVendas.totalCentavos,
      forma: barVendas.formaPagamento,
      recebidoPor: barVendas.operadorNome,
    })
    .from(barComandas)
    .innerJoin(barVendas, eq(barVendas.id, barComandas.vendaId))
    .where(and(eq(barComandas.eventoId, eventoId), eq(barComandas.status, "paga")))
    .orderBy(desc(barComandas.pagaEm))
    .limit(limite);
}

export function totalDaComanda(itens: { status: string; quantidade: number; precoUnitCentavos: number }[]) {
  return itens.filter((i) => i.status === "ativo").reduce((s, i) => s + i.quantidade * i.precoUnitCentavos, 0);
}
