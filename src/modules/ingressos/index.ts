import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingressos, lotes, pedidos } from "@/db/schema";
import { paymentProvider } from "@/modules/pagamentos";
import { PRODUTOS, TIPOS_PRODUTO, type TipoProduto } from "./produtos";
export { nomeDoProduto, PRODUTOS, TIPOS_PRODUTO, type TipoProduto } from "./produtos";

// ---------------------------------------------------------------------------
// Regras de venda de ingressos.
//
// Reserva: ao criar o pedido, uma vaga do lote é reservada na hora
// (`lotes.quantidade_vendida` + 1, com UPDATE condicional — dois compradores
// nunca pegam a última vaga ao mesmo tempo). Pedido não pago em
// MINUTOS_RESERVA é cancelado e a vaga volta para o lote.
//
// Confirmação: o status do pagamento vem SEMPRE da consulta ao gateway
// (`paymentProvider.consultarStatus`), nunca de parâmetro de URL ou payload.
// ---------------------------------------------------------------------------

export const MINUTOS_RESERVA = 30;


export class ErroCompra extends Error {
  constructor(public readonly codigo: CodigoErroCompra) {
    super(MENSAGENS_ERRO_COMPRA[codigo]);
  }
}

export const MENSAGENS_ERRO_COMPRA = {
  "sem-lote": "Não há lote à venda neste momento.",
  esgotado: "As vagas deste lote acabaram. Atualize a página para ver se abriu outro lote.",
  "ja-tem-ingresso": "Você já comprou este produto. Ele está na sua área.",
  "pedido-invalido": "Pedido não encontrado.",
  pagamento: "Não foi possível abrir o pagamento agora. Tente de novo em alguns minutos.",
} as const;
export type CodigoErroCompra = keyof typeof MENSAGENS_ERRO_COMPRA;

function filtrosVigencia(agora: Date) {
  return [
    eq(lotes.ativo, true),
    or(isNull(lotes.dataInicio), lte(lotes.dataInicio, agora)),
    or(isNull(lotes.dataFim), gte(lotes.dataFim, agora)),
  ];
}

// Lote à venda agora de um produto: ativo, dentro do período e com vaga.
// Havendo mais de um, o mais barato (ordem natural de 1º, 2º, 3º lote).
export async function loteVigente(tipo: TipoProduto) {
  return db.query.lotes.findFirst({
    where: and(...filtrosVigencia(new Date()), eq(lotes.tipo, tipo), lt(lotes.quantidadeVendida, lotes.quantidadeTotal)),
    orderBy: [asc(lotes.precoCentavos), asc(lotes.criadoEm)],
  });
}

// Vitrine: todos os produtos, cada um com o lote vigente, a indicação de
// esgotado ou, se ainda não tem lote aberto, "valor em breve" (emBreve).
export async function vitrine() {
  const agora = new Date();
  const ativos = await db
    .select()
    .from(lotes)
    .where(and(...filtrosVigencia(agora)))
    .orderBy(asc(lotes.precoCentavos), asc(lotes.criadoEm));
  return TIPOS_PRODUTO.map((tipo) => {
    const doTipo = ativos.filter((l) => l.tipo === tipo);
    const comVaga = doTipo.find((l) => l.quantidadeVendida < l.quantidadeTotal) ?? null;
    return { tipo, produto: PRODUTOS[tipo], lote: comVaga, esgotado: doTipo.length > 0 && !comVaga, emBreve: doTipo.length === 0 };
  });
}

// Devolve ao lote as vagas de pedidos pendentes vencidos.
export async function liberarReservasVencidas() {
  const limite = new Date(Date.now() - MINUTOS_RESERVA * 60 * 1000);
  await db.transaction(async (tx) => {
    const vencidos = await tx
      .update(pedidos)
      .set({ status: "cancelado", atualizadoEm: new Date() })
      .where(and(eq(pedidos.status, "pendente"), lt(pedidos.criadoEm, limite)))
      .returning({ loteId: pedidos.loteId });
    await devolverVagas(tx, vencidos.map((v) => v.loteId));
  });
}

type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function devolverVagas(tx: Transacao, loteIds: string[]) {
  const porLote = new Map<string, number>();
  for (const id of loteIds) porLote.set(id, (porLote.get(id) ?? 0) + 1);
  for (const [loteId, quantidade] of porLote) {
    await tx
      .update(lotes)
      .set({ quantidadeVendida: sql`greatest(${lotes.quantidadeVendida} - ${quantidade}, 0)` })
      .where(eq(lotes.id, loteId));
  }
}

export interface Comprador {
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
}

// Situação do comprador por produto: pago e/ou pedido pendente em aberto.
export async function situacaoDoComprador(email: string) {
  await liberarReservasVencidas();
  const lista = await db
    .select({ id: pedidos.id, status: pedidos.status, tipo: lotes.tipo })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(eq(pedidos.email, email), inArray(pedidos.status, ["pago", "pendente"])))
    .orderBy(desc(pedidos.criadoEm));
  const porTipo = {} as Record<TipoProduto, { pago: string | null; pendente: string | null }>;
  for (const tipo of TIPOS_PRODUTO) {
    porTipo[tipo] = {
      pago: lista.find((p) => p.tipo === tipo && p.status === "pago")?.id ?? null,
      pendente: lista.find((p) => p.tipo === tipo && p.status === "pendente")?.id ?? null,
    };
  }
  return porTipo;
}

// Cria o pedido de um produto reservando uma vaga do lote vigente dele.
// Um de cada produto por pessoa: se já pagou aquele produto, recusa; se há um
// pedido pendente dele, reaproveita.
export async function criarPedido(comprador: Comprador, tipo: TipoProduto) {
  const situacao = (await situacaoDoComprador(comprador.email))[tipo];
  if (situacao.pago) throw new ErroCompra("ja-tem-ingresso");
  if (situacao.pendente) return situacao.pendente;

  const lote = await loteVigente(tipo);
  if (!lote) {
    const item = (await vitrine()).find((v) => v.tipo === tipo);
    throw new ErroCompra(item?.esgotado ? "esgotado" : "sem-lote");
  }

  return db.transaction(async (tx) => {
    const [reservado] = await tx
      .update(lotes)
      .set({ quantidadeVendida: sql`${lotes.quantidadeVendida} + 1` })
      .where(
        and(
          eq(lotes.id, lote.id),
          eq(lotes.ativo, true),
          lt(lotes.quantidadeVendida, lotes.quantidadeTotal),
        ),
      )
      .returning({ id: lotes.id });
    if (!reservado) throw new ErroCompra("esgotado");

    const [pedido] = await tx
      .insert(pedidos)
      .values({
        nome: comprador.nome,
        email: comprador.email,
        telefone: comprador.telefone,
        cpf: comprador.cpf,
        loteId: lote.id,
        valorCentavos: lote.precoCentavos,
      })
      .returning({ id: pedidos.id });
    return pedido.id;
  });
}

// Abre (ou reabre) o checkout do gateway para um pedido pendente do comprador.
export async function iniciarPagamento(pedidoId: string, email: string) {
  const pedido = await db
    .select({
      id: pedidos.id,
      status: pedidos.status,
      valorCentavos: pedidos.valorCentavos,
      loteNome: lotes.nome,
      tipo: lotes.tipo,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(eq(pedidos.id, pedidoId), eq(pedidos.email, email)))
    .then((r) => r[0]);
  if (!pedido || pedido.status !== "pendente") throw new ErroCompra("pedido-invalido");

  let resultado;
  try {
    resultado = await paymentProvider.criarPreferencia({
      pedidoId: pedido.id,
      descricao: `LPZ Training — ${PRODUTOS[pedido.tipo].nome} (${pedido.loteNome})`,
      valorCentavos: pedido.valorCentavos,
      compradorEmail: email,
    });
  } catch (erro) {
    console.error("Falha ao criar preferência de pagamento", { pedidoId, erro: (erro as Error).message });
    throw new ErroCompra("pagamento");
  }

  await db
    .update(pedidos)
    .set({ gatewayPreferenceId: resultado.preferenceId, atualizadoEm: new Date() })
    .where(eq(pedidos.id, pedido.id));
  return resultado.checkoutUrl;
}

// Consulta o gateway e, se pago, marca o pedido e emite o ingresso.
// Idempotente: pode ser chamado várias vezes (retorno do checkout, webhook,
// reprocessamento) sem emitir ingresso duplicado.
export async function confirmarPagamento(pedidoId: string) {
  const pedido = await db.query.pedidos.findFirst({ where: eq(pedidos.id, pedidoId) });
  if (!pedido?.gatewayPreferenceId) return pedido?.status ?? null;

  const status = await paymentProvider.consultarStatus(pedido.gatewayPreferenceId);
  if (status !== "pago") return pedido.status;

  await db.transaction(async (tx) => {
    const [atual] = await tx.select().from(pedidos).where(eq(pedidos.id, pedidoId)).for("update");
    if (!atual || atual.status === "pago" || atual.status === "reembolsado") return;
    const lote = await tx.query.lotes.findFirst({ where: eq(lotes.id, atual.loteId) });

    // Pagamento aprovado depois de a reserva vencer: o dinheiro entrou, então
    // o ingresso é emitido e a vaga volta a ser contada.
    if (atual.status === "cancelado") {
      await tx
        .update(lotes)
        .set({ quantidadeVendida: sql`${lotes.quantidadeVendida} + 1` })
        .where(eq(lotes.id, atual.loteId));
    }
    await tx.update(pedidos).set({ status: "pago", atualizadoEm: new Date() }).where(eq(pedidos.id, pedidoId));
    // Só produtos de entrada geram ingresso com QR (paparazzi não).
    if (!lote || PRODUTOS[lote.tipo].entrada) await tx.insert(ingressos).values({ pedidoId });
  });
  return "pago" as const;
}

// Cancela um pedido ainda pendente (desistência) e devolve a vaga.
export async function cancelarPedidoPendente(pedidoId: string, email: string) {
  await db.transaction(async (tx) => {
    const cancelados = await tx
      .update(pedidos)
      .set({ status: "cancelado", atualizadoEm: new Date() })
      .where(and(eq(pedidos.id, pedidoId), eq(pedidos.email, email), eq(pedidos.status, "pendente")))
      .returning({ loteId: pedidos.loteId });
    await devolverVagas(tx, cancelados.map((c) => c.loteId));
  });
}

// Pedidos e ingressos de um comprador, para a "Minha área".
export async function pedidosDoComprador(email: string) {
  return db
    .select({
      pedidoId: pedidos.id,
      status: pedidos.status,
      valorCentavos: pedidos.valorCentavos,
      criadoEm: pedidos.criadoEm,
      loteNome: lotes.nome,
      tipo: lotes.tipo,
      ingressoId: ingressos.id,
      ingressoStatus: ingressos.status,
      checkinEm: ingressos.checkinEm,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
    .where(and(eq(pedidos.email, email), inArray(pedidos.status, ["pago", "pendente"])))
    .orderBy(desc(pedidos.criadoEm));
}

// Código curto impresso abaixo do QR, para digitar na portaria se a câmera
// falhar. É só um atalho de busca: a validação usa sempre o ingresso no banco.
export function codigoCurto(ingressoId: string) {
  return ingressoId.slice(0, 8).toUpperCase();
}
