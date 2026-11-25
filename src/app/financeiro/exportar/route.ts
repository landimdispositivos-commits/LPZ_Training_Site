import { exigirAdmin } from "@/modules/auth/sessao";
import { listarPedidos } from "@/modules/financeiro";
import { formatarDataHora } from "@/lib/formatar";
import { nomeDoProduto } from "@/modules/ingressos";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

// CSV de pedidos para o Excel (separador ";" e BOM UTF-8 para acentos).
// Só organizadores. CPF fica de fora de propósito (LGPD: só o necessário).
export async function GET() {
  await carregarCatalogo();
  await exigirAdmin(["organizador"]);
  const lista = await listarPedidos({});

  const cabecalho = ["Data", "Nome", "E-mail", "Telefone", "Produto", "Lote", "Valor (R$)", "Situação", "Check-in"];
  const linhas = lista.map((p) => [
    formatarDataHora(p.criadoEm),
    p.nome,
    p.email,
    p.telefone ?? "",
    nomeDoProduto(p.tipo),
    p.loteNome,
    (p.valorCentavos / 100).toFixed(2).replace(".", ","),
    p.status,
    p.checkinEm ? formatarDataHora(p.checkinEm) : "",
  ]);

  const csv = [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-lpz-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

// Aspas sempre; neutraliza fórmulas (=, +, -, @) para evitar CSV injection.
function celula(valor: string) {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
