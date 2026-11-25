import { eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingressos, lotes, pedidos } from "@/db/schema";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

// ---------------------------------------------------------------------------
// Check-in na portaria. O QR/código só serve para ACHAR a compra: a presença
// só é registrada depois de conferir no banco (ver modules/presencas).
// Busca por compra (pedido), para incluir serviços sem ingresso de entrada
// (paparazzi, Jack and Jill).
// ---------------------------------------------------------------------------

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REGEX_CODIGO = /^[0-9a-f]{8}$/i;

function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// Aceita: endereço do QR (…/ingresso/<id>), id completo do ingresso ou do
// pedido, código curto de 8 caracteres, ou parte do nome/e-mail (mín. 3).
export async function buscarCompras(termoBruto: string) {
  await carregarCatalogo();
  const doEndereco = /\/ingresso\/([0-9a-f-]{36})/i.exec(termoBruto);
  const termo = (doEndereco?.[1] ?? termoBruto).trim();
  let filtro;
  if (REGEX_UUID.test(termo)) {
    const id = termo.toLowerCase();
    filtro = or(eq(ingressos.id, id), eq(pedidos.id, id));
  } else if (REGEX_CODIGO.test(termo)) {
    const prefixo = `${termo.toLowerCase()}%`;
    filtro = or(sql`${ingressos.id}::text like ${prefixo}`, sql`${pedidos.id}::text like ${prefixo}`);
  } else if (termo.length >= 3) {
    const padrao = `%${escaparLike(termo)}%`;
    filtro = or(ilike(pedidos.nome, padrao), ilike(pedidos.email, padrao));
  } else {
    return [];
  }

  return db
    .select({
      pedidoId: pedidos.id,
      ingressoId: ingressos.id,
      ingressoStatus: ingressos.status,
      nome: pedidos.nome,
      email: pedidos.email,
      pedidoStatus: pedidos.status,
      tipo: lotes.tipo,
      loteNome: lotes.nome,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
    .where(filtro)
    .orderBy(pedidos.nome)
    .limit(20);
}

export type CompraEncontrada = Awaited<ReturnType<typeof buscarCompras>>[number];
