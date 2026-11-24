import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { ingressos, lotes, pedidos, presencas } from "@/db/schema";
import type { Idioma } from "@/i18n";
import { paymentProvider } from "@/modules/pagamentos";
import { enviarEmailCancelamento, enviarEmailEstorno, enviarEmailsDaCompra } from "./emails";
import { PRODUTOS, temOpcoes, TIPOS_PRODUTO, type TipoProduto } from "./produtos";
export { nomeDoLote, nomeDoProduto, PRODUTOS, temOpcoes, TIPOS_PRODUTO, type TipoProduto } from "./produtos";

// ---------------------------------------------------------------------------
// Regras de venda de ingressos.
//
// Reserva: ao criar o pedido, uma vaga do lote é reservada na hora
// (`lotes.quantidade_vendida` + 1, com UPDATE condicional — dois compradores
// nunca pegam a última vaga ao mesmo tempo). Pedido não pago em
// MINUTOS_RESERVA é cancelado e a vaga volta para o lote.
//
// Confirmação: o status do pagamento vem SEMPRE da consulta ao gateway
// (`paymentProvider.consultarPagamento`), nunca de parâmetro de URL ou payload.
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
  "sacola-vazia": "Sua sacola está vazia (ou a reserva venceu). Escolha os produtos de novo.",
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
    const opcoes = doTipo.filter((l) => l.quantidadeVendida < l.quantidadeTotal);
    const comVaga = opcoes[0] ?? null;
    return {
      tipo,
      produto: PRODUTOS[tipo],
      lote: comVaga,
      // Produtos com opções (massagens) mostram todos os lotes com vaga para escolher.
      opcoes: temOpcoes(tipo) ? opcoes : [],
      esgotado: doTipo.length > 0 && !comVaga,
      emBreve: doTipo.length === 0,
    };
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
export async function criarPedido(comprador: Comprador, tipo: TipoProduto, idioma: Idioma = "pt", loteEscolhido?: string) {
  const situacao = (await situacaoDoComprador(comprador.email))[tipo];
  if (situacao.pago) throw new ErroCompra("ja-tem-ingresso");
  if (situacao.pendente) return situacao.pendente;

  // Produto com opções: o lote escolhido precisa ser deste produto e estar vigente.
  const lote =
    temOpcoes(tipo) && loteEscolhido
      ? await db.query.lotes.findFirst({
          where: and(...filtrosVigencia(new Date()), eq(lotes.tipo, tipo), eq(lotes.id, loteEscolhido), lt(lotes.quantidadeVendida, lotes.quantidadeTotal)),
        })
      : await loteVigente(tipo);
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
        idioma,
      })
      .returning({ id: pedidos.id });
    return pedido.id;
  });
}

// Itens da sacola: os pedidos pendentes (vaga reservada) do comprador.
export async function sacolaDoComprador(email: string) {
  await liberarReservasVencidas();
  return db
    .select({
      pedidoId: pedidos.id,
      valorCentavos: pedidos.valorCentavos,
      criadoEm: pedidos.criadoEm,
      tipo: lotes.tipo,
      loteNome: lotes.nome,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(eq(pedidos.email, email), eq(pedidos.status, "pendente")))
    .orderBy(asc(pedidos.criadoEm));
}

// Quantidade na sacola para o ícone do topo (sem escrever no banco).
export async function contarSacola(email: string) {
  const limite = new Date(Date.now() - MINUTOS_RESERVA * 60 * 1000);
  const [linha] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(pedidos)
    .where(and(eq(pedidos.email, email), eq(pedidos.status, "pendente"), gte(pedidos.criadoEm, limite)));
  return linha?.total ?? 0;
}

// Abre o checkout do gateway para um ou mais pedidos pendentes do comprador.
// Vários pedidos = uma compra (sacola): recebem o mesmo compra_id, que vai ao
// gateway como referência — um único pagamento para todos.
async function abrirCheckout(pedidoIds: string[], email: string) {
  // Antes de reagrupar, confere se algum checkout anterior já foi pago.
  await atualizarPendentesDoComprador(email);
  const lista = await db
    .select({
      id: pedidos.id,
      status: pedidos.status,
      valorCentavos: pedidos.valorCentavos,
      criadoEm: pedidos.criadoEm,
      loteNome: lotes.nome,
      tipo: lotes.tipo,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(inArray(pedidos.id, pedidoIds), eq(pedidos.email, email), eq(pedidos.status, "pendente")))
    .orderBy(asc(pedidos.criadoEm));
  if (lista.length === 0 || lista.length !== pedidoIds.length) throw new ErroCompra("pedido-invalido");

  const referencia = lista.length === 1 ? lista[0].id : randomUUID();
  // O checkout expira com a reserva mais antiga da sacola.
  const expiraEm = new Date(Math.min(...lista.map((p) => p.criadoEm.getTime())) + MINUTOS_RESERVA * 60 * 1000);

  let resultado;
  try {
    resultado = await paymentProvider.criarPreferencia({
      referencia,
      itens: lista.map((p) => ({
        id: p.id,
        descricao: `LPZ Training — ${PRODUTOS[p.tipo].nome} (${p.loteNome})`,
        valorCentavos: p.valorCentavos,
      })),
      compradorEmail: email,
      expiraEm,
    });
  } catch (erro) {
    console.error("Falha ao criar preferência de pagamento", { referencia, erro: (erro as Error).message });
    throw new ErroCompra("pagamento");
  }

  await db
    .update(pedidos)
    .set({
      gatewayPreferenceId: resultado.preferenceId,
      compraId: lista.length === 1 ? null : referencia,
      atualizadoEm: new Date(),
    })
    .where(inArray(pedidos.id, lista.map((p) => p.id)));
  return resultado.checkoutUrl;
}

// Compra de um item só ("Comprar agora" / "Continuar pagamento").
export async function iniciarPagamento(pedidoId: string, email: string) {
  return abrirCheckout([pedidoId], email);
}

// Paga tudo o que está na sacola de uma vez.
export async function pagarSacola(email: string) {
  const itens = await sacolaDoComprador(email);
  if (itens.length === 0) throw new ErroCompra("sacola-vazia");
  return abrirCheckout(itens.map((i) => i.pedidoId), email);
}

// Referência no gateway de um pedido: a compra (sacola) ou o próprio pedido.
function referenciaDo(p: { id: string; compraId: string | null }) {
  return p.compraId ?? p.id;
}

// Consulta o gateway e, se pago, marca o pedido (e os demais da mesma compra)
// e emite os ingressos. Idempotente: pode ser chamado várias vezes (retorno do
// checkout, webhook, reprocessamento) sem emitir ingresso duplicado.
export async function confirmarPagamento(pedidoId: string) {
  const pedido = await db.query.pedidos.findFirst({ where: eq(pedidos.id, pedidoId) });
  if (!pedido) return null;
  await confirmarCompra(referenciaDo(pedido));
  const atual = await db.query.pedidos.findFirst({ where: eq(pedidos.id, pedidoId) });
  return atual?.status ?? null;
}

// Confirma todos os pedidos de uma referência (compra da sacola ou pedido único).
export async function confirmarCompra(referencia: string) {
  const daCompra = await db
    .select()
    .from(pedidos)
    .where(or(eq(pedidos.compraId, referencia), and(eq(pedidos.id, referencia), isNull(pedidos.compraId))));
  const preferenceId = daCompra.find((p) => p.gatewayPreferenceId)?.gatewayPreferenceId;
  if (!preferenceId) return;

  const situacao = await paymentProvider.consultarPagamento({ preferenceId, referencia });
  if (situacao.status !== "pago") return;

  // Só os confirmados agora recebem e-mail (uma vez, mesmo que o retorno do
  // checkout e o webhook cheguem juntos).
  const confirmadosAgora: string[] = [];
  await db.transaction(async (tx) => {
    for (const { id } of daCompra) {
      const [atual] = await tx.select().from(pedidos).where(eq(pedidos.id, id)).for("update");
      if (!atual || atual.status === "pago" || atual.status === "reembolsado") continue;
      // Pedido que saiu desta compra para outra (reagrupado na sacola) não entra.
      if (referenciaDo(atual) !== referencia) continue;
      confirmadosAgora.push(id);
      const lote = await tx.query.lotes.findFirst({ where: eq(lotes.id, atual.loteId) });

      // Pagamento aprovado depois de a reserva vencer: o dinheiro entrou, então
      // o ingresso é emitido e a vaga volta a ser contada.
      if (atual.status === "cancelado") {
        await tx
          .update(lotes)
          .set({ quantidadeVendida: sql`${lotes.quantidadeVendida} + 1` })
          .where(eq(lotes.id, atual.loteId));
      }
      await tx
        .update(pedidos)
        .set({
          status: "pago",
          formaPagamento: situacao.forma ?? null,
          parcelas: situacao.parcelas ?? null,
          pagoEm: new Date(),
          gatewayPagamentoId: situacao.pagamentoId ?? null,
          atualizadoEm: new Date(),
        })
        .where(eq(pedidos.id, id));
      // Só produtos de entrada geram ingresso de entrada (serviços usam o QR do pedido).
      if (!lote || PRODUTOS[lote.tipo].entrada) await tx.insert(ingressos).values({ pedidoId: id });
    }
  });
  if (confirmadosAgora.length > 0) enviarEmailsDaCompra(confirmadosAgora);
}

// Reconsulta no gateway os pedidos pendentes do comprador (ex: Pix pago
// depois de fechar o checkout, sem webhook em ambiente local).
export async function atualizarPendentesDoComprador(email: string) {
  const pendentes = await db
    .select({ id: pedidos.id })
    .from(pedidos)
    .where(and(eq(pedidos.email, email), eq(pedidos.status, "pendente"), isNotNull(pedidos.gatewayPreferenceId)));
  for (const p of pendentes) {
    try {
      await confirmarPagamento(p.id);
    } catch (erro) {
      console.error("Falha ao reconsultar pagamento pendente", { pedidoId: p.id, erro: (erro as Error).message });
    }
  }
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
      formaPagamento: pedidos.formaPagamento,
      parcelas: pedidos.parcelas,
      loteNome: lotes.nome,
      tipo: lotes.tipo,
      ingressoId: ingressos.id,
      ingressoStatus: ingressos.status,
      checkinEm: ingressos.checkinEm,
      pagoEm: pedidos.pagoEm,
      atualizadoEm: pedidos.atualizadoEm,
      canceladoPeloClienteEm: pedidos.canceladoPeloClienteEm,
      estornadoEm: pedidos.estornadoEm,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
    .where(
      and(
        eq(pedidos.email, email),
        or(inArray(pedidos.status, ["pago", "pendente"]), isNotNull(pedidos.canceladoPeloClienteEm)),
      ),
    )
    .orderBy(desc(pedidos.criadoEm));
}

// Código curto impresso abaixo do QR, para digitar na portaria se a câmera
// falhar. É só um atalho de busca: a validação usa sempre o ingresso no banco.
export function codigoCurto(ingressoId: string) {
  return ingressoId.slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Cancelamento pelo cliente (direito de arrependimento — CDC, art. 49) e
// estorno aprovado pela organização.
// ---------------------------------------------------------------------------

export const PRAZO_ARREPENDIMENTO_DIAS = 7;

// Até quando o cliente pode cancelar sozinho (7 dias depois do pagamento).
export function prazoParaCancelar(p: { pagoEm: Date | null; atualizadoEm: Date }) {
  const base = p.pagoEm ?? p.atualizadoEm;
  return new Date(base.getTime() + PRAZO_ARREPENDIMENTO_DIAS * 24 * 60 * 60 * 1000);
}

export class ErroCancelamento extends Error {
  constructor(public codigo: "nao-encontrado" | "nao-pago" | "prazo" | "usado" | "ja-cancelado") {
    super(codigo);
  }
}

// O cliente cancela um item pago (os outros itens continuam valendo). O
// ingresso deixa de valer na hora, a vaga volta ao lote e o estorno fica
// aguardando a aprovação da organização no Financeiro.
export async function cancelarCompraDoCliente(pedidoId: string, email: string) {
  await db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(pedidos)
      .where(and(eq(pedidos.id, pedidoId), eq(pedidos.email, email)))
      .for("update");
    if (!p) throw new ErroCancelamento("nao-encontrado");
    if (p.canceladoPeloClienteEm) throw new ErroCancelamento("ja-cancelado");
    if (p.status !== "pago") throw new ErroCancelamento("nao-pago");
    if (Date.now() > prazoParaCancelar(p).getTime()) throw new ErroCancelamento("prazo");
    const usado = await tx.query.presencas.findFirst({ where: eq(presencas.pedidoId, pedidoId) });
    if (usado) throw new ErroCancelamento("usado");

    const agora = new Date();
    await tx
      .update(pedidos)
      .set({ status: "cancelado", canceladoPeloClienteEm: agora, atualizadoEm: agora })
      .where(eq(pedidos.id, pedidoId));
    await tx.update(ingressos).set({ status: "cancelado" }).where(eq(ingressos.pedidoId, pedidoId));
    await devolverVagas(tx, [p.loteId]);
  });
  enviarEmailEmSegundoPlanoCancelamento(pedidoId);
}

function enviarEmailEmSegundoPlanoCancelamento(pedidoId: string) {
  enviarEmailCancelamento(pedidoId).catch((erro: unknown) =>
    console.error("[email] Falha no e-mail de cancelamento", { pedidoId, erro: (erro as Error)?.message }),
  );
}

// Estornos aguardando aprovação (Financeiro).
export async function estornosPendentes() {
  return db
    .select({
      pedidoId: pedidos.id,
      nome: pedidos.nome,
      email: pedidos.email,
      valorCentavos: pedidos.valorCentavos,
      canceladoEm: pedidos.canceladoPeloClienteEm,
      formaPagamento: pedidos.formaPagamento,
      tipo: lotes.tipo,
      loteNome: lotes.nome,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(isNotNull(pedidos.canceladoPeloClienteEm), isNull(pedidos.estornadoEm), eq(pedidos.status, "cancelado")))
    .orderBy(asc(pedidos.canceladoPeloClienteEm));
}

// A organização aprova: devolve o valor pelo gateway e registra quem aprovou.
export async function estornarPedido(pedidoId: string, autor: { id: string }) {
  const p = await db.query.pedidos.findFirst({ where: eq(pedidos.id, pedidoId) });
  if (!p || !p.canceladoPeloClienteEm || p.estornadoEm || p.status !== "cancelado") throw new ErroCancelamento("nao-encontrado");

  let pagamentoId = p.gatewayPagamentoId;
  if (!pagamentoId && p.gatewayPreferenceId) {
    const situacao = await paymentProvider.consultarPagamento({
      preferenceId: p.gatewayPreferenceId,
      referencia: referenciaDo(p),
    });
    pagamentoId = situacao.pagamentoId ?? null;
  }
  // Modo de teste: compras antigas simuladas não têm id de pagamento.
  if (!pagamentoId && process.env.MERCADOPAGO_ACCESS_TOKEN) throw new Error("Pagamento não encontrado no gateway para estornar");
  await paymentProvider.estornar({ pagamentoId: pagamentoId ?? "teste-sem-id", valorCentavos: p.valorCentavos, chave: p.id });

  const agora = new Date();
  await db
    .update(pedidos)
    .set({ status: "reembolsado", estornadoEm: agora, estornadoPor: autor.id, atualizadoEm: agora })
    .where(and(eq(pedidos.id, pedidoId), isNull(pedidos.estornadoEm)));
  enviarEmailEstorno(pedidoId).catch((erro: unknown) =>
    console.error("[email] Falha no e-mail de estorno", { pedidoId, erro: (erro as Error)?.message }),
  );
  return p;
}
