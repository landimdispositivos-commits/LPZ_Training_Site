import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingressos, lotes, pedidos } from "@/db/schema";
import { liberarReservasVencidas } from "@/modules/ingressos";

export const STATUS_PEDIDO = ["pendente", "pago", "cancelado", "reembolsado"] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export async function resumoFinanceiro() {
  await liberarReservasVencidas();
  const [linha] = await db
    .select({
      arrecadadoCentavos: sql<number>`coalesce(sum(${pedidos.valorCentavos}) filter (where ${pedidos.status} = 'pago'), 0)`.mapWith(Number),
      pagos: sql<number>`count(*) filter (where ${pedidos.status} = 'pago')`.mapWith(Number),
      pendentes: sql<number>`count(*) filter (where ${pedidos.status} = 'pendente')`.mapWith(Number),
      cancelados: sql<number>`count(*) filter (where ${pedidos.status} = 'cancelado')`.mapWith(Number),
      reembolsados: sql<number>`count(*) filter (where ${pedidos.status} = 'reembolsado')`.mapWith(Number),
    })
    .from(pedidos);

  const [entradas] = await db
    .select({ presentes: sql<number>`count(*)`.mapWith(Number) })
    .from(ingressos)
    .where(eq(ingressos.status, "usado"));

  return { ...linha, presentes: entradas?.presentes ?? 0 };
}

// Lotes com números de venda. `quantidadeVendida` do lote conta também as
// reservas pendentes; aqui separamos pagos de reservados.
export async function lotesComVendas() {
  return db
    .select({
      id: lotes.id,
      nome: lotes.nome,
      precoCentavos: lotes.precoCentavos,
      quantidadeTotal: lotes.quantidadeTotal,
      quantidadeVendida: lotes.quantidadeVendida,
      ativo: lotes.ativo,
      dataInicio: lotes.dataInicio,
      dataFim: lotes.dataFim,
      pagos: sql<number>`count(${pedidos.id}) filter (where ${pedidos.status} = 'pago')`.mapWith(Number),
      reservados: sql<number>`count(${pedidos.id}) filter (where ${pedidos.status} = 'pendente')`.mapWith(Number),
      receitaCentavos: sql<number>`coalesce(sum(${pedidos.valorCentavos}) filter (where ${pedidos.status} = 'pago'), 0)`.mapWith(Number),
    })
    .from(lotes)
    .leftJoin(pedidos, eq(pedidos.loteId, lotes.id))
    .groupBy(lotes.id)
    .orderBy(asc(lotes.precoCentavos), asc(lotes.criadoEm));
}

export async function listarPedidos({ status, limite }: { status?: StatusPedido; limite?: number }) {
  const consulta = db
    .select({
      id: pedidos.id,
      nome: pedidos.nome,
      email: pedidos.email,
      telefone: pedidos.telefone,
      valorCentavos: pedidos.valorCentavos,
      status: pedidos.status,
      criadoEm: pedidos.criadoEm,
      loteNome: lotes.nome,
      checkinEm: ingressos.checkinEm,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
    .where(status ? eq(pedidos.status, status) : undefined)
    .orderBy(desc(pedidos.criadoEm));
  return limite ? consulta.limit(limite) : consulta;
}
