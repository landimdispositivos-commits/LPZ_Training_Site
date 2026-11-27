import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { barCategorias, barCompras, barEstoqueMovimentos, barEventos, barProdutos } from "@/db/schema";
import { saldosEfetivos } from "./ficha";

// Módulo do Bar (vendas, estoque e financeiro). Valores em centavos.

export const TIPOS_AJUSTE = {
  perda: { rotulo: "Perda", sinal: -1 },
  quebra: { rotulo: "Quebra", sinal: -1 },
  cortesia: { rotulo: "Cortesia", sinal: -1 },
  consumo_equipe: { rotulo: "Consumo da equipe", sinal: -1 },
  ajuste_menos: { rotulo: "Ajuste de contagem (tirar)", sinal: -1 },
  ajuste_mais: { rotulo: "Ajuste de contagem (somar)", sinal: 1 },
} as const;
export type TipoAjuste = keyof typeof TIPOS_AJUSTE;

export const ROTULO_MOVIMENTO: Record<string, string> = {
  entrada: "Entrada (compra)",
  inicial: "Estoque inicial",
  perda: "Perda",
  quebra: "Quebra",
  cortesia: "Cortesia",
  consumo_equipe: "Consumo da equipe",
  ajuste: "Ajuste de contagem",
  venda: "Venda",
  comanda: "Consumo em comanda",
  reserva: "Reserva de pedido online",
  liberacao: "Reserva liberada (pedido não pago)",
  estorno: "Estorno de venda",
};

export const LINHAS_COMPRA = 10;

export async function listarEventos() {
  return db.select().from(barEventos).orderBy(desc(barEventos.emAndamento), desc(barEventos.criadoEm));
}

export async function eventoEmAndamento() {
  const [e] = await db.select().from(barEventos).where(eq(barEventos.emAndamento, true)).limit(1);
  return e ?? null;
}

// Evento que a gestão está vendo: o pedido na URL, senão o em andamento, senão o mais recente.
export async function eventoDaGestao(pedido: unknown) {
  const eventos = await listarEventos();
  const id = typeof pedido === "string" ? pedido : "";
  const evento = eventos.find((e) => e.id === id) ?? eventos.find((e) => e.emAndamento) ?? eventos[0] ?? null;
  return { eventos, evento };
}

export async function listarCategorias() {
  return db.select().from(barCategorias).orderBy(asc(barCategorias.ordem), asc(barCategorias.nome));
}

// Saldo de estoque por produto do evento (livro-razão; para produto com ficha,
// quantas unidades dá para preparar com os insumos).
export async function listarProdutosComSaldo(eventoId: string) {
  const [linhas, saldos] = await Promise.all([
    db
      .select({
        id: barProdutos.id,
        nome: barProdutos.nome,
        unidade: barProdutos.unidade,
        custoCentavos: barProdutos.custoCentavos,
        precoCentavos: barProdutos.precoCentavos,
        estoqueMinimo: barProdutos.estoqueMinimo,
        visivelCardapio: barProdutos.visivelCardapio,
        aVenda: barProdutos.aVenda,
        usaFicha: barProdutos.usaFicha,
        ativo: barProdutos.ativo,
        categoriaId: barProdutos.categoriaId,
        categoria: barCategorias.nome,
      })
      .from(barProdutos)
      .leftJoin(barCategorias, eq(barCategorias.id, barProdutos.categoriaId))
      .where(eq(barProdutos.eventoId, eventoId))
      .orderBy(asc(barCategorias.ordem), asc(barCategorias.nome), asc(barProdutos.nome)),
    saldosEfetivos(eventoId),
  ]);
  return linhas.map((l) => ({ ...l, saldo: saldos.get(l.id) ?? 0 }));
}

// Cardápio público para o cliente logado: SÓ nome, categoria, unidade e preço de
// venda (nunca custo nem quantidade em estoque — apenas se está esgotado).
export async function cardapioDoEvento(eventoId: string) {
  const [linhas, saldos] = await Promise.all([
    db
      .select({
        id: barProdutos.id,
        nome: barProdutos.nome,
        unidade: barProdutos.unidade,
        precoCentavos: barProdutos.precoCentavos,
        categoria: barCategorias.nome,
      })
      .from(barProdutos)
      .leftJoin(barCategorias, eq(barCategorias.id, barProdutos.categoriaId))
      .where(and(eq(barProdutos.eventoId, eventoId), eq(barProdutos.ativo, true), eq(barProdutos.aVenda, true), eq(barProdutos.visivelCardapio, true)))
      .orderBy(asc(barCategorias.ordem), asc(barCategorias.nome), asc(barProdutos.nome)),
    saldosEfetivos(eventoId),
  ]);
  return linhas.map((l) => ({ ...l, esgotado: (saldos.get(l.id) ?? 0) <= 0 }));
}

export async function ultimosMovimentos(eventoId: string, limite = 30) {
  return db
    .select({
      id: barEstoqueMovimentos.id,
      criadoEm: barEstoqueMovimentos.criadoEm,
      tipo: barEstoqueMovimentos.tipo,
      quantidade: barEstoqueMovimentos.quantidade,
      motivo: barEstoqueMovimentos.motivo,
      autorNome: barEstoqueMovimentos.autorNome,
      produto: barProdutos.nome,
    })
    .from(barEstoqueMovimentos)
    .innerJoin(barProdutos, eq(barProdutos.id, barEstoqueMovimentos.produtoId))
    .where(eq(barEstoqueMovimentos.eventoId, eventoId))
    .orderBy(desc(barEstoqueMovimentos.criadoEm))
    .limit(limite);
}

export async function listarCompras(eventoId: string, limite = 30) {
  return db.select().from(barCompras).where(eq(barCompras.eventoId, eventoId)).orderBy(desc(barCompras.dataCompra), desc(barCompras.criadoEm)).limit(limite);
}

export function margemPercentual(custo: number, preco: number) {
  return preco > 0 ? Math.round(((preco - custo) / preco) * 100) : 0;
}
