import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { barEstoqueMovimentos, barProdutos, barReceitasItens } from "@/db/schema";

// Regras de consumo de estoque compartilhadas pelas formas de venda (caixa,
// comanda...): produto com ficha técnica baixa os insumos da receita; os
// demais baixam o próprio estoque. Tudo dentro da transação do chamador.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Produto = typeof barProdutos.$inferSelect;

export type Consumo = {
  produtos: Produto[]; // produtos pedidos (vendáveis, ativos)
  travados: Produto[]; // produtos/insumos cujo estoque será baixado (linhas travadas)
  consumo: Map<string, number>; // produto/insumo -> quantidade total a baixar
  porProduto: Map<string, { id: string; qtd: number }[]>; // produto pedido -> baixas dele
  custoUnit: Map<string, number>; // produto pedido -> custo de uma unidade
  total: number;
  custo: number;
};

export async function prepararConsumo(tx: Tx, eventoId: string, pedido: Map<string, number>): Promise<{ erro: string } | Consumo> {
  const ids = [...pedido.keys()];
  const produtos = await tx
    .select()
    .from(barProdutos)
    .where(and(eq(barProdutos.eventoId, eventoId), eq(barProdutos.ativo, true), eq(barProdutos.aVenda, true), inArray(barProdutos.id, ids)));
  if (produtos.length !== ids.length) return { erro: "Algum produto não está mais disponível. Atualize a página." };

  const comFicha = produtos.filter((p) => p.usaFicha).map((p) => p.id);
  const receitas = comFicha.length ? await tx.select().from(barReceitasItens).where(inArray(barReceitasItens.produtoId, comFicha)) : [];

  const consumo = new Map<string, number>();
  const porProduto = new Map<string, { id: string; qtd: number }[]>();
  for (const p of produtos) {
    const qtd = pedido.get(p.id)!;
    let baixas: { id: string; qtd: number }[];
    if (!p.usaFicha) {
      baixas = [{ id: p.id, qtd }];
    } else {
      const itens = receitas.filter((r) => r.produtoId === p.id);
      if (itens.length === 0) return { erro: `${p.nome} está sem ficha técnica. Avise a gestão.` };
      baixas = itens.map((r) => ({ id: r.insumoId, qtd: r.quantidade * qtd }));
    }
    porProduto.set(p.id, baixas);
    for (const b of baixas) consumo.set(b.id, (consumo.get(b.id) ?? 0) + b.qtd);
  }

  // Trava os produtos/insumos para dois lançamentos ao mesmo tempo não passarem do estoque.
  const baixar = [...consumo.keys()];
  const travados = await tx.select().from(barProdutos).where(inArray(barProdutos.id, baixar)).for("update");
  const saldos = await tx
    .select({ produtoId: barEstoqueMovimentos.produtoId, saldo: sql<number>`coalesce(sum(${barEstoqueMovimentos.quantidade}), 0)::int` })
    .from(barEstoqueMovimentos)
    .where(inArray(barEstoqueMovimentos.produtoId, baixar))
    .groupBy(barEstoqueMovimentos.produtoId);
  for (const t of travados) {
    const saldo = saldos.find((s) => s.produtoId === t.id)?.saldo ?? 0;
    if (consumo.get(t.id)! > saldo) return { erro: `Estoque insuficiente de ${t.nome} (restam ${Math.max(saldo, 0)} ${t.unidade}).` };
  }

  const custoUnit = new Map<string, number>();
  let total = 0;
  let custo = 0;
  for (const p of produtos) {
    const unit = p.usaFicha
      ? receitas.filter((r) => r.produtoId === p.id).reduce((s, r) => s + r.quantidade * (travados.find((t) => t.id === r.insumoId)?.custoCentavos ?? 0), 0)
      : p.custoCentavos;
    custoUnit.set(p.id, unit);
    const qtd = pedido.get(p.id)!;
    total += qtd * p.precoCentavos;
    custo += qtd * unit;
  }
  return { produtos, travados, consumo, porProduto, custoUnit, total, custo };
}
