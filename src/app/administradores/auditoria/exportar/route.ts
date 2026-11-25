import type { NextRequest } from "next/server";
import { gerarXlsx } from "@/lib/xlsx";
import { formatarDataHora } from "@/lib/formatar";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import { ACOES, descreverEvento, listarAuditoria, type Acao } from "@/modules/auditoria";

// Excel da trilha de auditoria (respeita busca e filtro da tela). Só organizador.
export async function GET(request: NextRequest) {
  await exigirAdmin(["organizador"]);
  const params = request.nextUrl.searchParams;
  const acao = (Object.keys(ACOES) as Acao[]).find((a) => a === params.get("acao"));
  const registros = await listarAuditoria({ busca: params.get("q") ?? undefined, acao, limite: 50_000 });

  const arquivo = gerarXlsx(
    "Auditoria",
    ["Quando", "Ação", "Usuário afetado", "E-mail afetado", "Quem fez", "Login de quem fez", "Detalhe", "IP", "Navegador"],
    registros.map((r) => [
      formatarDataHora(r.criadoEm),
      ACOES[r.acao as Acao] ?? r.acao,
      r.alvoNome,
      r.alvoEmail,
      r.autorNome ?? "Sistema",
      r.autorEmail,
      descreverEvento(r, (p) => ROTULO_PAPEL[p] ?? p),
      r.ip,
      r.navegador,
    ]),
  );
  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(arquivo), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="auditoria-lpz-${hoje}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
