import type { NextRequest } from "next/server";
import { gerarXlsx } from "@/lib/xlsx";
import { exigirAdmin } from "@/modules/auth/sessao";
import { listarCadastros, PAPEIS } from "@/modules/usuarios";
import { COLUNAS } from "@/modules/usuarios/colunas";

// Excel (.xlsx) da grade de usuários, com as colunas escolhidas na tela.
// Só organizadores. Respeita a busca e o filtro de perfil da tela.
export async function GET(request: NextRequest) {
  await exigirAdmin(["organizador"]);
  const params = request.nextUrl.searchParams;

  const escolhidas = new Set(params.getAll("col"));
  const colunas = escolhidas.size ? COLUNAS.filter((c) => escolhidas.has(c.id)) : COLUNAS;
  const papel = PAPEIS.find((p) => p === params.get("papel"));
  const lista = await listarCadastros({ busca: params.get("q") ?? undefined, papel, limite: 10_000 });

  const arquivo = gerarXlsx(
    "Usuários",
    colunas.map((c) => c.titulo),
    lista.map((u) => colunas.map((c) => c.valor(u))),
  );
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="usuarios-lpz-${hoje}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
