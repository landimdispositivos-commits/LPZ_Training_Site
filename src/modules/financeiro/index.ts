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
      tipo: lotes.tipo,
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
    .orderBy(asc(lotes.tipo), asc(lotes.precoCentavos), asc(lotes.criadoEm));
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
      tipo: lotes.tipo,
      checkinEm: ingressos.checkinEm,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
    .where(status ? eq(pedidos.status, status) : undefined)
    .orderBy(desc(pedidos.criadoEm));
  return limite ? consulta.limit(limite) : consulta;
}

// ---------------------------------------------------------------------------
// Aba "Gráficos" do Financeiro: números consolidados para os gráficos.
// Valores em centavos. "Recebido" = pedidos pagos (estornos ficam à parte).
// ---------------------------------------------------------------------------
const MES_DO_EVENTO = "2027-09"; // LPZ Training 2027: 24 a 26 de setembro

function chaveMes(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function proximoMes(chave: string) {
  const [a, m] = chave.split("-").map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
}
function diasNoMes(chave: string) {
  const [a, m] = chave.split("-").map(Number);
  return new Date(a, m, 0).getDate();
}

export async function painelFinanceiro(agora = new Date()) {
  await liberarReservasVencidas();
  const linhas = await db
    .select({
      valor: pedidos.valorCentavos,
      status: pedidos.status,
      tipo: lotes.tipo,
      pagoEm: pedidos.pagoEm,
      criadoEm: pedidos.criadoEm,
      atualizadoEm: pedidos.atualizadoEm,
      canceladoPeloCliente: pedidos.canceladoPeloClienteEm,
      email: pedidos.email,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId));

  const soma = (lista: typeof linhas) => lista.reduce((t, l) => t + l.valor, 0);
  const pagos = linhas.filter((l) => l.status === "pago");
  const provisionados = linhas.filter((l) => l.status === "pendente");
  const estornados = linhas.filter((l) => l.status === "reembolsado");
  const estornosPendentes = linhas.filter((l) => l.status === "cancelado" && l.canceladoPeloCliente);
  // Reserva que venceu sem pagamento (cancelada pelo sistema, não pelo cliente).
  const naoPagos = linhas.filter((l) => l.status === "cancelado" && !l.canceladoPeloCliente);

  // Recebido por produto (maior primeiro).
  const porProduto = new Map<string, { centavos: number; quantidade: number }>();
  for (const p of pagos) {
    const atual = porProduto.get(p.tipo) ?? { centavos: 0, quantidade: 0 };
    porProduto.set(p.tipo, { centavos: atual.centavos + p.valor, quantidade: atual.quantidade + 1 });
  }

  // Recebido por mês (data do pagamento).
  const porMes = new Map<string, number>();
  for (const p of pagos) {
    const chave = chaveMes(p.pagoEm ?? p.atualizadoEm);
    porMes.set(chave, (porMes.get(chave) ?? 0) + p.valor);
  }

  // Potencial restante: vagas ainda livres nos lotes ativos × preço do lote.
  const listaLotes = await db
    .select({ preco: lotes.precoCentavos, total: lotes.quantidadeTotal, vendida: lotes.quantidadeVendida, ativo: lotes.ativo })
    .from(lotes);
  const potencialRestante = listaLotes
    .filter((l) => l.ativo)
    .reduce((t, l) => t + Math.max(l.total - l.vendida, 0) * l.preco, 0);

  // Projeção: ritmo médio diário dos últimos 30 dias, mês a mês até o mês do
  // evento, sem passar do potencial restante. As compras em andamento
  // (sacola/aguardando pagamento) entram no mês atual.
  const trintaDias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recebido30 = soma(pagos.filter((p) => (p.pagoEm ?? p.atualizadoEm) >= trintaDias));
  const ritmoDiario = recebido30 / 30;
  const mesAtual = chaveMes(agora);
  const projecao: { mes: string; centavos: number }[] = [];
  let saldo = Math.max(potencialRestante - soma(provisionados), 0);
  for (let mes = mesAtual; mes <= MES_DO_EVENTO; mes = proximoMes(mes)) {
    const dias = mes === mesAtual ? diasNoMes(mes) - agora.getDate() : diasNoMes(mes);
    let valor = Math.min(Math.round(ritmoDiario * Math.max(dias, 0)), saldo);
    saldo -= valor;
    if (mes === mesAtual) valor += soma(provisionados);
    projecao.push({ mes, centavos: valor });
  }

  // Meses do gráfico: do primeiro pagamento (ou mês atual) até o mês do evento.
  const primeiro = [...porMes.keys()].sort()[0] ?? mesAtual;
  const meses: { mes: string; recebido: number; projetado: number }[] = [];
  for (let mes = primeiro < mesAtual ? primeiro : mesAtual; mes <= MES_DO_EVENTO; mes = proximoMes(mes)) {
    meses.push({ mes, recebido: porMes.get(mes) ?? 0, projetado: projecao.find((p) => p.mes === mes)?.centavos ?? 0 });
  }

  return {
    recebido: { centavos: soma(pagos), quantidade: pagos.length, compradores: new Set(pagos.map((p) => p.email)).size },
    provisionado: { centavos: soma(provisionados), quantidade: provisionados.length },
    estornado: { centavos: soma(estornados), quantidade: estornados.length },
    estornoPendente: { centavos: soma(estornosPendentes), quantidade: estornosPendentes.length },
    naoPago: { centavos: soma(naoPagos), quantidade: naoPagos.length },
    potencialRestante,
    projetadoAteEvento: projecao.reduce((t, p) => t + p.centavos, 0),
    ritmoDiario: Math.round(ritmoDiario),
    porProduto: [...porProduto.entries()]
      .map(([tipo, v]) => ({ tipo, ...v }))
      .sort((a, b) => b.centavos - a.centavos),
    meses,
    mesAtual,
  };
}
