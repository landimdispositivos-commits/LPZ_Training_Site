import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingressos, lotes, pedidos, presencas } from "@/db/schema";
import { regraPresenca, type DiaPresenca } from "./regras";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";
import { infoProduto, tiposDoCatalogo } from "@/modules/ingressos/produtos";

export * from "./regras";

export type ResultadoPresenca =
  | { ok: true }
  | {
      ok: false;
      motivo: "nao-encontrado" | "nao-pago" | "cancelado" | "dia-invalido" | "ja-registrado";
      registro?: { registradoEm: Date; registradoPorNome: string | null };
    };

// Registra a presença de um pedido num dia (ou serviço único). Confere no
// banco: pedido pago, ingresso não cancelado, dia permitido para o produto.
// O índice único (pedido+dia) garante que dois cliques simultâneos não
// gerem dois registros.
export async function registrarPresenca(
  pedidoId: string,
  dia: DiaPresenca,
  autor: { id: string; name: string },
): Promise<ResultadoPresenca> {
  const [p] = await db
    .select({ status: pedidos.status, tipo: lotes.tipo, ingressoId: ingressos.id, ingressoStatus: ingressos.status })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
    .where(eq(pedidos.id, pedidoId))
    .limit(1);
  if (!p) return { ok: false, motivo: "nao-encontrado" };
  if (p.status !== "pago") return { ok: false, motivo: "nao-pago" };
  if (p.ingressoStatus === "cancelado") return { ok: false, motivo: "cancelado" };
  const regra = regraPresenca(p.tipo);
  if (!regra.dias.includes(dia)) return { ok: false, motivo: "dia-invalido" };

  const agora = new Date();
  const inseridos = await db
    .insert(presencas)
    .values({ pedidoId, tipo: regra.tipo, dia, registradoEm: agora, registradoPor: autor.id, registradoPorNome: autor.name })
    .onConflictDoNothing()
    .returning({ id: presencas.id });

  if (inseridos.length === 0) {
    const existente = await db.query.presencas.findFirst({
      where: and(eq(presencas.pedidoId, pedidoId), eq(presencas.dia, dia)),
    });
    return {
      ok: false,
      motivo: "ja-registrado",
      registro: existente ? { registradoEm: existente.registradoEm, registradoPorNome: existente.registradoPorNome } : undefined,
    };
  }

  // Primeira entrada: marca o ingresso como usado (mantém os totais antigos).
  if (regra.tipo === "entrada" && p.ingressoId) {
    await db
      .update(ingressos)
      .set({ status: "usado", checkinEm: agora, checkinPor: autor.id })
      .where(and(eq(ingressos.id, p.ingressoId), isNull(ingressos.checkinEm)));
  }
  return { ok: true };
}

// Presenças de vários pedidos (para telas e Excel), da mais antiga à mais nova.
export async function presencasDosPedidos(pedidoIds: string[]) {
  if (pedidoIds.length === 0) return [];
  return db
    .select()
    .from(presencas)
    .where(inArray(presencas.pedidoId, pedidoIds))
    .orderBy(asc(presencas.registradoEm));
}

export type Presenca = Awaited<ReturnType<typeof presencasDosPedidos>>[number];

export function agruparPorPedido(lista: Presenca[]) {
  const mapa = new Map<string, Presenca[]>();
  for (const p of lista) mapa.set(p.pedidoId, [...(mapa.get(p.pedidoId) ?? []), p]);
  return mapa;
}

export async function ultimasPresencas(limite = 10) {
  return db
    .select({
      id: presencas.id,
      dia: presencas.dia,
      registradoEm: presencas.registradoEm,
      registradoPorNome: presencas.registradoPorNome,
      nome: pedidos.nome,
      tipo: lotes.tipo,
    })
    .from(presencas)
    .innerJoin(pedidos, eq(pedidos.id, presencas.pedidoId))
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .orderBy(desc(presencas.registradoEm))
    .limit(limite);
}

// Totais para a portaria: pessoas (pedidos de entrada pagos) com ao menos uma
// entrada, e entradas registradas hoje.
export async function resumoPresencas() {
  await carregarCatalogo();
  const deEntrada = tiposDoCatalogo().filter((t) => infoProduto(t).entrada);
  const [linha] = await db
    .select({
      total: sql<number>`count(distinct ${pedidos.id})`.mapWith(Number),
      presentes: sql<number>`count(distinct ${presencas.pedidoId}) filter (where ${presencas.tipo} = 'entrada')`.mapWith(Number),
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(presencas, eq(presencas.pedidoId, pedidos.id))
    .where(and(eq(pedidos.status, "pago"), inArray(lotes.tipo, deEntrada)));
  return linha ?? { total: 0, presentes: 0 };
}
