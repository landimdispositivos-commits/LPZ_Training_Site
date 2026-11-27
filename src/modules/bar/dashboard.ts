import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { barComandaItens, barComandas, barCompras, barEstoqueMovimentos, barEventos, barProdutos, barVendas, barVendasItens } from "@/db/schema";

// Consultas do dashboard do Bar. Tudo em centavos. Só vendas "paga" contam como receita.

const FUSO = "America/Sao_Paulo";
export const TIPOS_PERDA = ["perda", "quebra", "cortesia", "consumo_equipe"] as const;

export async function resumoDoEvento(eventoId: string) {
  const [vendas] = await db
    .select({
      qtd: sql<number>`count(*)::int`,
      receita: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int`,
      custo: sql<number>`coalesce(sum(${barVendas.custoTotalCentavos}), 0)::int`,
    })
    .from(barVendas)
    .where(and(eq(barVendas.eventoId, eventoId), eq(barVendas.status, "paga")));

  const [estornos] = await db
    .select({ qtd: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int` })
    .from(barVendas)
    .where(and(eq(barVendas.eventoId, eventoId), eq(barVendas.status, "estornada")));

  const [compras] = await db
    .select({ total: sql<number>`coalesce(sum(${barCompras.totalCentavos}), 0)::int` })
    .from(barCompras)
    .where(eq(barCompras.eventoId, eventoId));

  // Perdas controladas valoradas ao custo do momento.
  const perdas = await db
    .select({
      tipo: barEstoqueMovimentos.tipo,
      unidades: sql<number>`coalesce(sum(-${barEstoqueMovimentos.quantidade}), 0)::int`,
      custo: sql<number>`coalesce(sum(-${barEstoqueMovimentos.quantidade} * coalesce(${barEstoqueMovimentos.custoUnitCentavos}, 0)), 0)::int`,
    })
    .from(barEstoqueMovimentos)
    .where(and(eq(barEstoqueMovimentos.eventoId, eventoId), inArray(barEstoqueMovimentos.tipo, [...TIPOS_PERDA])))
    .groupBy(barEstoqueMovimentos.tipo);

  // Estoque restante (saldo × preço e × custo) dos produtos ativos.
  const [estoque] = await db
    .select({
      aVenda: sql<number>`coalesce(sum(case when ${barProdutos.aVenda} then greatest(s.saldo, 0) * ${barProdutos.precoCentavos} else 0 end), 0)::bigint`,
      aCusto: sql<number>`coalesce(sum(greatest(s.saldo, 0) * ${barProdutos.custoCentavos}), 0)::bigint`,
      unidades: sql<number>`coalesce(sum(greatest(s.saldo, 0)), 0)::int`,
    })
    .from(barProdutos)
    .innerJoin(
      sql`(select produto_id, sum(quantidade) as saldo from ${barEstoqueMovimentos} group by produto_id) s`,
      sql`s.produto_id = ${barProdutos.id}`,
    )
    .where(and(eq(barProdutos.eventoId, eventoId), eq(barProdutos.ativo, true)));

  // Consumo lançado em comandas ainda não pagas (já saiu do estoque, ainda não virou receita).
  const [abertas] = await db
    .select({
      comandas: sql<number>`count(distinct ${barComandas.id})::int`,
      total: sql<number>`coalesce(sum(${barComandaItens.quantidade} * ${barComandaItens.precoUnitCentavos}), 0)::int`,
    })
    .from(barComandas)
    .leftJoin(barComandaItens, and(eq(barComandaItens.comandaId, barComandas.id), eq(barComandaItens.status, "ativo")))
    .where(and(eq(barComandas.eventoId, eventoId), eq(barComandas.status, "aberta")));

  const perdasCusto = perdas.reduce((s, p) => s + p.custo, 0);
  const lucroBruto = vendas.receita - vendas.custo;
  const estoqueAVenda = Number(estoque?.aVenda ?? 0);
  const estoqueACusto = Number(estoque?.aCusto ?? 0);
  return {
    vendas: vendas.qtd,
    receita: vendas.receita,
    custoVendas: vendas.custo,
    lucroBruto,
    margem: vendas.receita > 0 ? Math.round((lucroBruto / vendas.receita) * 100) : 0,
    ticketMedio: vendas.qtd > 0 ? Math.round(vendas.receita / vendas.qtd) : 0,
    estornos,
    comandasAbertas: abertas.comandas,
    aReceberComandas: abertas.total,
    compras: compras.total,
    perdas,
    perdasCusto,
    lucroLiquido: lucroBruto - perdasCusto,
    // Caixa do evento: o que entrou menos o que foi gasto em insumos (negativo = ainda no prejuízo).
    resultadoCaixa: vendas.receita - compras.total,
    estoqueUnidades: estoque?.unidades ?? 0,
    estoqueAVenda,
    estoqueACusto,
    // Se vender todo o estoque restante pelo preço de venda.
    projecaoResultado: vendas.receita - compras.total + estoqueAVenda,
    faltaParaCobrirCompras: Math.max(0, compras.total - vendas.receita),
  };
}

export async function vendasPorHora(eventoId: string) {
  const linhas = await db
    .select({
      hora: sql<number>`extract(hour from ${barVendas.criadoEm} at time zone ${FUSO})::int`,
      qtd: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int`,
    })
    .from(barVendas)
    .where(and(eq(barVendas.eventoId, eventoId), eq(barVendas.status, "paga")))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return linhas;
}

export async function vendasPorDia(eventoId: string) {
  return db
    .select({
      dia: sql<string>`to_char(${barVendas.criadoEm} at time zone ${FUSO}, 'YYYY-MM-DD')`,
      qtd: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int`,
      custo: sql<number>`coalesce(sum(${barVendas.custoTotalCentavos}), 0)::int`,
    })
    .from(barVendas)
    .where(and(eq(barVendas.eventoId, eventoId), eq(barVendas.status, "paga")))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
}

export async function maisVendidos(eventoId: string, limite = 10) {
  return db
    .select({
      nome: barVendasItens.nome,
      unidades: sql<number>`sum(${barVendasItens.quantidade})::int`,
      receita: sql<number>`sum(${barVendasItens.quantidade} * ${barVendasItens.precoUnitCentavos})::int`,
      lucro: sql<number>`sum(${barVendasItens.quantidade} * (${barVendasItens.precoUnitCentavos} - ${barVendasItens.custoUnitCentavos}))::int`,
    })
    .from(barVendasItens)
    .innerJoin(barVendas, eq(barVendas.id, barVendasItens.vendaId))
    .where(and(eq(barVendas.eventoId, eventoId), eq(barVendas.status, "paga")))
    .groupBy(barVendasItens.nome)
    .orderBy(desc(sql`sum(${barVendasItens.quantidade})`))
    .limit(limite);
}

// Produtos com preço de venda abaixo do custo (vendem com prejuízo).
export async function produtosNoPrejuizo(eventoId: string) {
  return db
    .select({ nome: barProdutos.nome, custo: barProdutos.custoCentavos, preco: barProdutos.precoCentavos })
    .from(barProdutos)
    .where(and(eq(barProdutos.eventoId, eventoId), eq(barProdutos.ativo, true), sql`${barProdutos.precoCentavos} < ${barProdutos.custoCentavos}`));
}

// Comparativo entre todos os eventos do bar.
export async function comparativoEventos() {
  const eventos = await db.select().from(barEventos).orderBy(desc(barEventos.criadoEm));
  const vendas = await db
    .select({
      eventoId: barVendas.eventoId,
      qtd: sql<number>`count(*)::int`,
      receita: sql<number>`coalesce(sum(${barVendas.totalCentavos}), 0)::int`,
      custo: sql<number>`coalesce(sum(${barVendas.custoTotalCentavos}), 0)::int`,
    })
    .from(barVendas)
    .where(eq(barVendas.status, "paga"))
    .groupBy(barVendas.eventoId);
  const compras = await db
    .select({ eventoId: barCompras.eventoId, total: sql<number>`coalesce(sum(${barCompras.totalCentavos}), 0)::int` })
    .from(barCompras)
    .groupBy(barCompras.eventoId);
  return eventos.map((e) => {
    const v = vendas.find((x) => x.eventoId === e.id);
    const receita = v?.receita ?? 0;
    const custo = v?.custo ?? 0;
    const gasto = compras.find((x) => x.eventoId === e.id)?.total ?? 0;
    return { id: e.id, nome: e.nome, vendas: v?.qtd ?? 0, receita, lucroBruto: receita - custo, compras: gasto, resultadoCaixa: receita - gasto };
  });
}
