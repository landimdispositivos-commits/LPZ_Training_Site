"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { barPedidosOnline, barCategorias, barCompras, barComprasItens, barEstoqueMovimentos, barEventos, barProdutos, barReceitasItens } from "@/db/schema";
import { reaisParaCentavos } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { registrarAuditoria } from "@/modules/auditoria";
import { LINHAS_COMPRA, TIPOS_AJUSTE } from "@/modules/bar";
import { recalcularCustosFicha } from "@/modules/bar/ficha";
import { paymentProvider } from "@/modules/pagamentos";

const BASE = "/bar/gestao";
const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;
const dataOpcional = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function ir(pagina: string, eventoId: string | null, aviso: string): never {
  const params = new URLSearchParams();
  if (eventoId) params.set("evento", eventoId);
  const [chave, valor] = aviso.split("=");
  params.set(chave, valor);
  redirect(`${BASE}/${pagina}?${params}`);
}

async function autor(nivel: "gestao" | "admin" = "admin") {
  const { user } = await exigirBar(nivel);
  return { user, pessoa: { id: user.id, name: user.name, email: user.email } };
}

// ---------------------------------------------------------------- eventos
export async function salvarEventoAction(form: FormData) {
  const { pessoa } = await autor();
  const dados = z
    .object({ nome: z.string().min(1).max(120), inicio: z.string().nullable(), fim: z.string().nullable() })
    .safeParse({ nome: texto(form, "nome"), inicio: dataOpcional(opcional(form, "inicio")), fim: dataOpcional(opcional(form, "fim")) });
  if (!dados.success) ir("eventos", null, "erro=dados");
  // Formas de venda ligadas neste evento.
  const formas = { usaCaixa: form.get("usaCaixa") === "on", usaComanda: form.get("usaComanda") === "on", usaOnline: form.get("usaOnline") === "on" };
  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) {
    await db.update(barEventos).set({ ...dados.data, ...formas }).where(eq(barEventos.id, id.data));
  } else {
    const [novo] = await db.insert(barEventos).values({ ...dados.data, ...formas }).returning({ id: barEventos.id });
    // O primeiro evento já nasce em andamento.
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(barEventos);
    if (total === 1) await db.update(barEventos).set({ emAndamento: true }).where(eq(barEventos.id, novo.id));
  }
  await registrarAuditoria({ acao: "bar_evento_salvo", autor: pessoa, alvo: null, detalhes: { nome: dados.data.nome } });
  revalidatePath(BASE, "layout");
  revalidatePath("/bar");
  ir("eventos", id.success ? id.data : null, "ok=salvo");
}

export async function definirEmAndamentoAction(form: FormData) {
  const { pessoa } = await autor();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) ir("eventos", null, "erro=dados");
  await db.transaction(async (tx) => {
    await tx.update(barEventos).set({ emAndamento: false }).where(eq(barEventos.emAndamento, true));
    await tx.update(barEventos).set({ emAndamento: true }).where(eq(barEventos.id, id.data));
  });
  await registrarAuditoria({ acao: "bar_evento_salvo", autor: pessoa, alvo: null, detalhes: { emAndamento: id.data } });
  revalidatePath(BASE, "layout");
  revalidatePath("/bar");
  ir("eventos", id.data, "ok=andamento");
}

// ---------------------------------------------------------------- produtos
async function categoriaPorNome(nome: string | null) {
  if (!nome) return null;
  const limpo = nome.slice(0, 60);
  const [existente] = await db.select().from(barCategorias).where(sql`lower(${barCategorias.nome}) = lower(${limpo})`).limit(1);
  if (existente) return existente.id;
  const [nova] = await db.insert(barCategorias).values({ nome: limpo }).returning({ id: barCategorias.id });
  return nova.id;
}

export async function salvarProdutoAction(form: FormData) {
  const { user, pessoa } = await autor();
  const eventoId = z.uuid().safeParse(form.get("eventoId"));
  if (!eventoId.success) ir("produtos", null, "erro=dados");
  const custo = reaisParaCentavos(texto(form, "custo") || "0");
  const preco = reaisParaCentavos(texto(form, "preco"));
  const dados = z
    .object({
      nome: z.string().min(1).max(120),
      unidade: z.string().min(1).max(20),
      custoCentavos: z.number().int().min(0).max(10_000_000),
      precoCentavos: z.number().int().min(0).max(10_000_000),
      estoqueMinimo: z.number().int().min(0).max(100000),
    })
    .safeParse({
      nome: texto(form, "nome"),
      unidade: texto(form, "unidade") || "un",
      custoCentavos: custo ?? Number.NaN,
      precoCentavos: preco ?? Number.NaN,
      estoqueMinimo: Number(texto(form, "estoqueMinimo") || 0),
    });
  if (!dados.success) ir("produtos", eventoId.data, "erro=dados");

  const categoriaId = await categoriaPorNome(opcional(form, "categoria"));
  const valores = {
    ...dados.data,
    categoriaId,
    visivelCardapio: form.get("visivelCardapio") === "on",
    aVenda: form.get("aVenda") === "on",
    usaFicha: form.get("usaFicha") === "on",
    ativo: form.get("ativo") === "on",
    atualizadoEm: new Date(),
  };
  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) {
    await db.update(barProdutos).set(valores).where(and(eq(barProdutos.id, id.data), eq(barProdutos.eventoId, eventoId.data)));
  } else {
    // Produto com ficha não tem estoque próprio (usa o dos insumos).
    const inicial = valores.usaFicha ? 0 : Math.max(0, Math.floor(Number(texto(form, "estoqueInicial") || 0)));
    await db.transaction(async (tx) => {
      const [novo] = await tx.insert(barProdutos).values({ ...valores, eventoId: eventoId.data }).returning({ id: barProdutos.id });
      if (inicial > 0) {
        await tx.insert(barEstoqueMovimentos).values({
          eventoId: eventoId.data,
          produtoId: novo.id,
          tipo: "inicial",
          quantidade: inicial,
          custoUnitCentavos: dados.data.custoCentavos,
          motivo: "Estoque inicial",
          autorId: user.id,
          autorNome: user.name,
        });
      }
    });
  }
  await recalcularCustosFicha(eventoId.data);
  await registrarAuditoria({
    acao: "bar_produto_salvo",
    autor: pessoa,
    alvo: null,
    detalhes: { nome: dados.data.nome, custo: dados.data.custoCentavos, preco: dados.data.precoCentavos, ficha: valores.usaFicha },
  });
  revalidatePath(BASE, "layout");
  revalidatePath("/bar");
  ir("produtos", eventoId.data, "ok=salvo");
}

// Copia o cadastro (sem estoque) de outro evento — útil para o próximo Baile.
export async function copiarProdutosAction(form: FormData) {
  const { pessoa } = await autor();
  const origem = z.uuid().safeParse(form.get("origem"));
  const destino = z.uuid().safeParse(form.get("destino"));
  if (!origem.success || !destino.success || origem.data === destino.data) ir("produtos", null, "erro=dados");
  const produtos = await db.select().from(barProdutos).where(eq(barProdutos.eventoId, origem.data));
  if (produtos.length === 0) ir("produtos", destino.data, "erro=vazio");
  await db.transaction(async (tx) => {
    const novoId = new Map<string, string>();
    for (const p of produtos) {
      const [novo] = await tx
        .insert(barProdutos)
        .values({
          eventoId: destino.data,
          categoriaId: p.categoriaId,
          nome: p.nome,
          unidade: p.unidade,
          custoCentavos: p.custoCentavos,
          precoCentavos: p.precoCentavos,
          estoqueMinimo: p.estoqueMinimo,
          visivelCardapio: p.visivelCardapio,
          aVenda: p.aVenda,
          usaFicha: p.usaFicha,
          ativo: p.ativo,
        })
        .returning({ id: barProdutos.id });
      novoId.set(p.id, novo.id);
    }
    const fichas = await tx.select().from(barReceitasItens).where(inArray(barReceitasItens.produtoId, [...novoId.keys()]));
    for (const f of fichas) {
      const prod = novoId.get(f.produtoId);
      const insumo = novoId.get(f.insumoId);
      if (prod && insumo) await tx.insert(barReceitasItens).values({ produtoId: prod, insumoId: insumo, quantidade: f.quantidade });
    }
  });
  await registrarAuditoria({ acao: "bar_produto_salvo", autor: pessoa, alvo: null, detalhes: { copiados: produtos.length } });
  revalidatePath(BASE, "layout");
  ir("produtos", destino.data, "ok=copiado");
}

// ---------------------------------------------------------------- estoque
export async function ajustarEstoqueAction(form: FormData) {
  const { user, pessoa } = await autor();
  const dados = z
    .object({
      eventoId: z.uuid(),
      produtoId: z.uuid(),
      tipo: z.enum(Object.keys(TIPOS_AJUSTE) as [keyof typeof TIPOS_AJUSTE, ...(keyof typeof TIPOS_AJUSTE)[]]),
      quantidade: z.number().int().min(1).max(100000),
      motivo: z.string().max(300).nullable(),
    })
    .safeParse({
      eventoId: form.get("eventoId"),
      produtoId: form.get("produtoId"),
      tipo: form.get("tipo"),
      quantidade: Number(texto(form, "quantidade")),
      motivo: opcional(form, "motivo"),
    });
  if (!dados.success) ir("estoque", null, "erro=dados");
  const d = dados.data;
  const sinal = TIPOS_AJUSTE[d.tipo].sinal;
  const resultado = await db.transaction(async (tx) => {
    const [produto] = await tx
      .select()
      .from(barProdutos)
      .where(and(eq(barProdutos.id, d.produtoId), eq(barProdutos.eventoId, d.eventoId)));
    if (!produto) return "dados";
    // Produto com ficha: a baixa (cortesia, perda...) sai dos insumos da receita.
    let consumo: { id: string; qtd: number }[] = [{ id: produto.id, qtd: d.quantidade }];
    if (produto.usaFicha) {
      if (sinal > 0) return "ficha";
      const itens = await tx.select().from(barReceitasItens).where(eq(barReceitasItens.produtoId, produto.id));
      if (itens.length === 0) return "ficha";
      consumo = itens.map((i) => ({ id: i.insumoId, qtd: i.quantidade * d.quantidade }));
    }
    // Trava as linhas dos produtos/insumos para dois ajustes ao mesmo tempo não furarem o saldo.
    const linhas = await tx
      .select()
      .from(barProdutos)
      .where(inArray(barProdutos.id, consumo.map((c) => c.id)))
      .for("update");
    for (const c of consumo) {
      const [{ saldo }] = await tx
        .select({ saldo: sql<number>`coalesce(sum(${barEstoqueMovimentos.quantidade}), 0)::int` })
        .from(barEstoqueMovimentos)
        .where(eq(barEstoqueMovimentos.produtoId, c.id));
      if (sinal < 0 && c.qtd > saldo) return "saldo";
    }
    for (const c of consumo) {
      const alvo = linhas.find((l) => l.id === c.id)!;
      await tx.insert(barEstoqueMovimentos).values({
        eventoId: d.eventoId,
        produtoId: alvo.id,
        tipo: d.tipo === "ajuste_mais" || d.tipo === "ajuste_menos" ? "ajuste" : d.tipo,
        quantidade: sinal * c.qtd,
        custoUnitCentavos: alvo.custoCentavos,
        motivo: produto.usaFicha ? `${d.motivo ? `${d.motivo} · ` : ""}${produto.nome} ×${d.quantidade}` : d.motivo,
        autorId: user.id,
        autorNome: user.name,
      });
    }
    return null;
  });
  if (resultado) ir("estoque", d.eventoId, `erro=${resultado}`);
  await registrarAuditoria({
    acao: "bar_estoque_ajustado",
    autor: pessoa,
    alvo: null,
    detalhes: { produtoId: d.produtoId, tipo: d.tipo, quantidade: d.quantidade, motivo: d.motivo },
  });
  revalidatePath(BASE, "layout");
  revalidatePath("/bar");
  ir("estoque", d.eventoId, "ok=ajustado");
}

// ---------------------------------------------------------------- compras
export async function registrarCompraAction(form: FormData) {
  const { user, pessoa } = await autor();
  const eventoId = z.uuid().safeParse(form.get("eventoId"));
  if (!eventoId.success) ir("compras", null, "erro=dados");
  const dataCompra = dataOpcional(opcional(form, "data")) ?? new Date().toISOString().slice(0, 10);

  const itens: { produtoId: string; quantidade: number; custoUnit: number }[] = [];
  for (let i = 0; i < LINHAS_COMPRA; i++) {
    const produtoId = texto(form, `produto-${i}`);
    const qtdTexto = texto(form, `qtd-${i}`);
    const custoTexto = texto(form, `custo-${i}`);
    if (!produtoId && !qtdTexto && !custoTexto) continue; // linha em branco
    const dados = z
      .object({ produtoId: z.uuid(), quantidade: z.number().int().min(1).max(100000), custoUnit: z.number().int().min(0).max(10_000_000) })
      .safeParse({ produtoId, quantidade: Number(qtdTexto), custoUnit: reaisParaCentavos(custoTexto || "0") ?? Number.NaN });
    if (!dados.success) ir("compras", eventoId.data, "erro=dados");
    itens.push(dados.data);
  }
  if (itens.length === 0) ir("compras", eventoId.data, "erro=vazio");

  const erro = await db.transaction(async (tx) => {
    const ids = [...new Set(itens.map((i) => i.produtoId))];
    // Trava os produtos da compra (e confere que são do evento).
    const produtos = await tx
      .select()
      .from(barProdutos)
      .where(and(eq(barProdutos.eventoId, eventoId.data), inArray(barProdutos.id, ids)))
      .for("update");
    if (produtos.length !== ids.length || produtos.some((p) => p.usaFicha)) return "dados";
    const total = itens.reduce((s, i) => s + i.quantidade * i.custoUnit, 0);
    const [compra] = await tx
      .insert(barCompras)
      .values({
        eventoId: eventoId.data,
        fornecedor: opcional(form, "fornecedor")?.slice(0, 120) ?? null,
        observacao: opcional(form, "observacao")?.slice(0, 500) ?? null,
        dataCompra,
        totalCentavos: total,
        autorId: user.id,
        autorNome: user.name,
      })
      .returning({ id: barCompras.id });
    for (const item of itens) {
      const produto = produtos.find((p) => p.id === item.produtoId)!;
      const [{ saldo }] = await tx
        .select({ saldo: sql<number>`coalesce(sum(${barEstoqueMovimentos.quantidade}), 0)::int` })
        .from(barEstoqueMovimentos)
        .where(eq(barEstoqueMovimentos.produtoId, produto.id));
      await tx.insert(barComprasItens).values({ compraId: compra.id, produtoId: produto.id, quantidade: item.quantidade, custoUnitCentavos: item.custoUnit });
      await tx.insert(barEstoqueMovimentos).values({
        eventoId: eventoId.data,
        produtoId: produto.id,
        tipo: "entrada",
        quantidade: item.quantidade,
        custoUnitCentavos: item.custoUnit,
        motivo: "Compra de insumos",
        compraId: compra.id,
        autorId: user.id,
        autorNome: user.name,
      });
      // Custo médio ponderado: (saldo × custo atual + compra) ÷ (saldo + compra).
      const base = Math.max(saldo, 0);
      const novoCusto = Math.round((base * produto.custoCentavos + item.quantidade * item.custoUnit) / (base + item.quantidade));
      await tx.update(barProdutos).set({ custoCentavos: novoCusto, atualizadoEm: new Date() }).where(eq(barProdutos.id, produto.id));
      produto.custoCentavos = novoCusto;
    }
    // O custo mudou: atualiza o custo das receitas que usam esses insumos.
    await recalcularCustosFicha(eventoId.data, tx);
    return null;
  });
  if (erro) ir("compras", eventoId.data, `erro=${erro}`);
  await registrarAuditoria({ acao: "bar_compra_registrada", autor: pessoa, alvo: null, detalhes: { itens: itens.length } });
  revalidatePath(BASE, "layout");
  ir("compras", eventoId.data, "ok=registrada");
}

// ---------------------------------------------------------------- ficha técnica
export async function salvarFichaAction(form: FormData) {
  const { pessoa } = await autor();
  const dados = z.object({ eventoId: z.uuid(), produtoId: z.uuid() }).safeParse({ eventoId: form.get("eventoId"), produtoId: form.get("produtoId") });
  if (!dados.success) ir("produtos", null, "erro=dados");
  const { eventoId, produtoId } = dados.data;

  const itens = new Map<string, number>();
  for (let i = 0; i < LINHAS_COMPRA; i++) {
    const insumo = texto(form, `insumo-${i}`);
    const qtdTexto = texto(form, `qtd-${i}`);
    if (!insumo && !qtdTexto) continue;
    const item = z.object({ insumoId: z.uuid(), quantidade: z.number().int().min(1).max(100000) }).safeParse({ insumoId: insumo, quantidade: Number(qtdTexto) });
    if (!item.success || item.data.insumoId === produtoId) ir("produtos", eventoId, "erro=dados");
    itens.set(item.data.insumoId, (itens.get(item.data.insumoId) ?? 0) + item.data.quantidade);
  }
  if (itens.size === 0) ir("produtos", eventoId, "erro=vazio");

  const erro = await db.transaction(async (tx) => {
    const [produto] = await tx.select().from(barProdutos).where(and(eq(barProdutos.id, produtoId), eq(barProdutos.eventoId, eventoId)));
    if (!produto || !produto.usaFicha) return "dados";
    // Os insumos precisam ser do evento e não podem ter ficha (sem receita dentro de receita).
    const insumos = await tx.select().from(barProdutos).where(and(eq(barProdutos.eventoId, eventoId), inArray(barProdutos.id, [...itens.keys()])));
    if (insumos.length !== itens.size || insumos.some((i) => i.usaFicha)) return "dados";
    await tx.delete(barReceitasItens).where(eq(barReceitasItens.produtoId, produtoId));
    for (const [insumoId, quantidade] of itens) await tx.insert(barReceitasItens).values({ produtoId, insumoId, quantidade });
    await recalcularCustosFicha(eventoId, tx);
    return null;
  });
  if (erro) ir("produtos", eventoId, `erro=${erro}`);
  await registrarAuditoria({ acao: "bar_produto_salvo", autor: pessoa, alvo: null, detalhes: { fichaTecnica: produtoId, insumos: itens.size } });
  revalidatePath(BASE, "layout");
  revalidatePath("/bar");
  ir("produtos", eventoId, "ok=ficha");
}

// ---------------------------------------------------------------- pedido online pago sem estoque
export async function devolverPedidoOnlineAction(form: FormData) {
  const { pessoa } = await autor("gestao");
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) ir("vendas", null, "erro=dados");
  const [p] = await db.select().from(barPedidosOnline).where(eq(barPedidosOnline.id, id.data));
  if (!p || p.status !== "precisa_estorno" || !p.gatewayPagamentoId) ir("vendas", p?.eventoId ?? null, "erro=dados");
  try {
    await paymentProvider.estornar({ pagamentoId: p.gatewayPagamentoId, valorCentavos: p.totalCentavos, chave: `bar-${p.id}` });
  } catch (erro) {
    console.error("Falha ao devolver pagamento de pedido online", (erro as Error).message);
    ir("vendas", p.eventoId, "erro=gateway");
  }
  await db.update(barPedidosOnline).set({ status: "estornado", encerradoEm: new Date() }).where(eq(barPedidosOnline.id, p.id));
  await registrarAuditoria({ acao: "bar_venda_estornada", autor: pessoa, alvo: null, detalhes: { pedidoOnlineId: p.id, semEstoque: true } });
  revalidatePath(BASE, "layout");
  ir("vendas", p.eventoId, "ok=devolvido");
}
