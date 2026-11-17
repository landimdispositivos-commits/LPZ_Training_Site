import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { ingressos, lotes, pedidos, usuarios } from "@/db/schema";

// ---------------------------------------------------------------------------
// Check-in na portaria. O QR/código só serve para ACHAR o ingresso: a entrada
// só é liberada depois de conferir no banco que o ingresso existe, é de um
// pedido pago e ainda não foi usado (UPDATE condicional — dois porteiros
// lendo o mesmo QR ao mesmo tempo não liberam duas entradas).
// ---------------------------------------------------------------------------

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REGEX_CODIGO = /^[0-9a-f]{8}$/i;

const quemFezCheckin = alias(usuarios, "quem_fez_checkin");

const camposIngresso = {
  id: ingressos.id,
  status: ingressos.status,
  checkinEm: ingressos.checkinEm,
  checkinPorNome: quemFezCheckin.name,
  nome: pedidos.nome,
  email: pedidos.email,
  pedidoStatus: pedidos.status,
  loteNome: lotes.nome,
};

export type IngressoEncontrado = Awaited<ReturnType<typeof buscarIngressos>>[number];

function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Aceita: conteúdo do QR (UUID completo), código curto de 8 caracteres, ou
// parte do nome/e-mail (mín. 3 letras) para quando o celular do participante
// não ajudar.
export async function buscarIngressos(termoBruto: string) {
  const termo = termoBruto.trim();
  let filtro;
  if (REGEX_UUID.test(termo)) {
    filtro = eq(ingressos.id, termo.toLowerCase());
  } else if (REGEX_CODIGO.test(termo)) {
    filtro = sql`${ingressos.id}::text like ${`${termo.toLowerCase()}%`}`;
  } else if (termo.length >= 3) {
    const padrao = `%${escaparLike(termo)}%`;
    filtro = or(ilike(pedidos.nome, padrao), ilike(pedidos.email, padrao));
  } else {
    return [];
  }

  return db
    .select(camposIngresso)
    .from(ingressos)
    .innerJoin(pedidos, eq(pedidos.id, ingressos.pedidoId))
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(quemFezCheckin, eq(quemFezCheckin.id, ingressos.checkinPor))
    .where(filtro)
    .orderBy(pedidos.nome)
    .limit(20);
}

export type ResultadoCheckin =
  | { ok: true; ingresso: IngressoEncontrado }
  | { ok: false; motivo: "nao-encontrado" | "ja-usado" | "cancelado" | "nao-pago"; ingresso?: IngressoEncontrado };

export async function registrarEntrada(ingressoId: string, adminId: string): Promise<ResultadoCheckin> {
  if (!REGEX_UUID.test(ingressoId)) return { ok: false, motivo: "nao-encontrado" };

  const pedidosPagos = db.select({ id: pedidos.id }).from(pedidos).where(eq(pedidos.status, "pago"));
  const atualizados = await db
    .update(ingressos)
    .set({ status: "usado", checkinEm: new Date(), checkinPor: adminId })
    .where(
      and(eq(ingressos.id, ingressoId), eq(ingressos.status, "valido"), inArray(ingressos.pedidoId, pedidosPagos)),
    )
    .returning({ id: ingressos.id });

  const [ingresso] = await buscarIngressos(ingressoId);
  if (!ingresso) return { ok: false, motivo: "nao-encontrado" };
  if (atualizados.length > 0) return { ok: true, ingresso };
  if (ingresso.status === "usado") return { ok: false, motivo: "ja-usado", ingresso };
  if (ingresso.status === "cancelado") return { ok: false, motivo: "cancelado", ingresso };
  return { ok: false, motivo: "nao-pago", ingresso };
}

export async function resumoCheckin() {
  const [linha] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      presentes: sql<number>`count(*) filter (where ${ingressos.status} = 'usado')`.mapWith(Number),
    })
    .from(ingressos)
    .innerJoin(pedidos, eq(pedidos.id, ingressos.pedidoId))
    .where(and(eq(pedidos.status, "pago"), inArray(ingressos.status, ["valido", "usado"])));
  return linha ?? { total: 0, presentes: 0 };
}

export async function ultimasEntradas(limite = 10) {
  return db
    .select(camposIngresso)
    .from(ingressos)
    .innerJoin(pedidos, eq(pedidos.id, ingressos.pedidoId))
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(quemFezCheckin, eq(quemFezCheckin.id, ingressos.checkinPor))
    .where(eq(ingressos.status, "usado"))
    .orderBy(desc(ingressos.checkinEm))
    .limit(limite);
}
