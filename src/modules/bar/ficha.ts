import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { barEstoqueMovimentos, barProdutos, barReceitasItens } from "@/db/schema";

// Ficha técnica (receita): um produto "com ficha" (ex.: caipirinha) consome
// insumos (ex.: 50 ml de cachaça, 1 limão) em vez de ter estoque próprio.

type Executor = Pick<typeof db, "select">;

export type ItemFicha = { insumoId: string; quantidade: number };

// Saldo por produto = soma do livro-razão; para produto com ficha, é quantas
// unidades dá para preparar com os insumos que sobraram (o insumo que acaba primeiro manda).
export async function saldosEfetivos(eventoId: string, executor: Executor = db) {
  const produtos = await executor
    .select({ id: barProdutos.id, usaFicha: barProdutos.usaFicha })
    .from(barProdutos)
    .where(eq(barProdutos.eventoId, eventoId));
  const somas = await executor
    .select({ produtoId: barEstoqueMovimentos.produtoId, saldo: sql<number>`sum(${barEstoqueMovimentos.quantidade})::int` })
    .from(barEstoqueMovimentos)
    .where(eq(barEstoqueMovimentos.eventoId, eventoId))
    .groupBy(barEstoqueMovimentos.produtoId);
  const bruto = new Map(somas.map((s) => [s.produtoId, s.saldo]));

  const comFicha = produtos.filter((p) => p.usaFicha).map((p) => p.id);
  const receitas = comFicha.length
    ? await executor.select().from(barReceitasItens).where(inArray(barReceitasItens.produtoId, comFicha))
    : [];

  const saldos = new Map<string, number>();
  for (const p of produtos) {
    if (!p.usaFicha) {
      saldos.set(p.id, bruto.get(p.id) ?? 0);
      continue;
    }
    const itens = receitas.filter((r) => r.produtoId === p.id);
    saldos.set(p.id, itens.length === 0 ? 0 : Math.max(0, Math.min(...itens.map((i) => Math.floor((bruto.get(i.insumoId) ?? 0) / i.quantidade)))));
  }
  return saldos;
}

export async function fichaDoProduto(produtoId: string) {
  return db
    .select({
      insumoId: barReceitasItens.insumoId,
      quantidade: barReceitasItens.quantidade,
      nome: barProdutos.nome,
      unidade: barProdutos.unidade,
      custoCentavos: barProdutos.custoCentavos,
    })
    .from(barReceitasItens)
    .innerJoin(barProdutos, eq(barProdutos.id, barReceitasItens.insumoId))
    .where(eq(barReceitasItens.produtoId, produtoId))
    .orderBy(asc(barProdutos.nome));
}

// Todas as fichas do evento de uma vez (para as telas de produtos).
export async function fichasDoEvento(eventoId: string) {
  const linhas = await db
    .select({
      produtoId: barReceitasItens.produtoId,
      insumoId: barReceitasItens.insumoId,
      quantidade: barReceitasItens.quantidade,
      nome: barProdutos.nome,
      unidade: barProdutos.unidade,
    })
    .from(barReceitasItens)
    .innerJoin(barProdutos, eq(barProdutos.id, barReceitasItens.insumoId))
    .where(eq(barProdutos.eventoId, eventoId));
  const mapa = new Map<string, typeof linhas>();
  for (const l of linhas) mapa.set(l.produtoId, [...(mapa.get(l.produtoId) ?? []), l]);
  return mapa;
}

// Recalcula o custo dos produtos com ficha = soma (quantidade × custo do insumo).
export async function recalcularCustosFicha(eventoId: string, executor: Pick<typeof db, "execute"> = db) {
  await executor.execute(sql`
    update bar_produtos p set custo_centavos = s.custo
    from (
      select r.produto_id, sum(r.quantidade * i.custo_centavos)::int as custo
      from bar_receitas_itens r join bar_produtos i on i.id = r.insumo_id
      group by r.produto_id
    ) s
    where p.id = s.produto_id and p.evento_id = ${eventoId}`);
}
