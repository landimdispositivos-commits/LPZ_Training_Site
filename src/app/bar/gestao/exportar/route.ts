import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { barCompras, barTickets, barVendas, barVendasItens } from "@/db/schema";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao, listarProdutosComSaldo } from "@/modules/bar";
import { ROTULO_FORMA } from "@/modules/bar/caixa";

// Exporta vendas, estoque ou compras do evento em CSV (abre direto no Excel pt-BR:
// separador ";", valores em reais com vírgula, acentos preservados com BOM).
const reais = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const data = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

// Evita "injeção de fórmula" no Excel: texto que começa com = + - @ vira texto.
function celula(v: string | number | null | undefined) {
  let t = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(t) && typeof v === "string") t = `'${t}`;
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}
const linha = (cols: (string | number | null | undefined)[]) => cols.map(celula).join(";");

export async function GET(request: Request) {
  await exigirBar("gestao");
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");
  const { evento } = await eventoDaGestao(url.searchParams.get("evento"));
  if (!evento || !["vendas", "estoque", "compras"].includes(tipo ?? "")) return new Response("Pedido inválido", { status: 400 });

  const linhas: string[] = [];
  if (tipo === "vendas") {
    linhas.push(linha(["Nº", "Data/hora", "Operador", "Forma de pagamento", "Total (R$)", "Custo (R$)", "Lucro (R$)", "Situação", "Itens"]));
    const vendas = await db
      .select({
        id: barVendas.id, numero: barVendas.numero, criadoEm: barVendas.criadoEm, operador: barVendas.operadorNome, forma: barVendas.formaPagamento,
        total: barVendas.totalCentavos, custo: barVendas.custoTotalCentavos, status: barVendas.status, ticket: barTickets.status,
      })
      .from(barVendas)
      .innerJoin(barTickets, eq(barTickets.vendaId, barVendas.id))
      .where(eq(barVendas.eventoId, evento.id))
      .orderBy(desc(barVendas.numero));
    const itens = await db
      .select({ vendaId: barVendasItens.vendaId, nome: barVendasItens.nome, qtd: barVendasItens.quantidade })
      .from(barVendasItens)
      .innerJoin(barVendas, eq(barVendas.id, barVendasItens.vendaId))
      .where(eq(barVendas.eventoId, evento.id));
    for (const v of vendas) {
      const lista = itens.filter((i) => i.vendaId === v.id).map((i) => `${i.qtd}x ${i.nome}`).join(", ");
      const situacao = v.status === "estornada" ? "estornada" : v.ticket === "entregue" ? "entregue" : v.ticket === "parcial" ? "retirada parcial" : "aguardando retirada";
      linhas.push(linha([v.numero, data(v.criadoEm), v.operador, ROTULO_FORMA[v.forma] ?? v.forma, reais(v.total), reais(v.custo), reais(v.total - v.custo), situacao, lista]));
    }
  } else if (tipo === "estoque") {
    linhas.push(linha(["Produto", "Categoria", "Unidade", "Custo (R$)", "Venda (R$)", "Saldo", "Mínimo", "Com ficha técnica", "Vendido no caixa"]));
    for (const p of await listarProdutosComSaldo(evento.id)) {
      linhas.push(linha([p.nome, p.categoria, p.unidade, reais(p.custoCentavos), reais(p.precoCentavos), p.saldo, p.estoqueMinimo, p.usaFicha ? "sim" : "não", p.aVenda ? "sim" : "não"]));
    }
  } else {
    linhas.push(linha(["Data", "Fornecedor", "Total (R$)", "Registrado por", "Observação"]));
    const compras = await db.select().from(barCompras).where(eq(barCompras.eventoId, evento.id)).orderBy(desc(barCompras.dataCompra));
    for (const c of compras) linhas.push(linha([c.dataCompra.split("-").reverse().join("/"), c.fornecedor, reais(c.totalCentavos), c.autorNome, c.observacao]));
  }

  const nome = `bar-${tipo}-${evento.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.csv`;
  return new Response("\uFEFF" + linhas.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
