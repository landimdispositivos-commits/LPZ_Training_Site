import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import { ACOES, descreverEvento, listarAuditoria, type Acao } from "@/modules/auditoria";
import { formatarDataHora } from "@/lib/formatar";
import { classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Auditoria — LPZ Training" };

const LISTA_ACOES = Object.keys(ACOES) as Acao[];

export default async function Page(props: PageProps<"/administradores/auditoria">) {
  await exigirAdmin(["organizador"]);
  const { q, acao } = await props.searchParams;
  const busca = typeof q === "string" ? q.slice(0, 100) : "";
  const filtro = LISTA_ACOES.find((a) => a === acao);
  const registros = await listarAuditoria({ busca, acao: filtro });

  const params = new URLSearchParams();
  if (busca) params.set("q", busca);
  if (filtro) params.set("acao", filtro);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Auditoria</h1>
            <div className="flex gap-4 text-sm">
              <a href={`/administradores/auditoria/exportar${params.size ? `?${params}` : ""}`} className="font-medium text-teal-300 hover:underline">
                Exportar para Excel
              </a>
              <Link href="/administradores/usuarios" className="text-teal-300 hover:underline">Usuários</Link>
              <Link href="/administradores/painel" className="text-teal-300 hover:underline">Painel</Link>
            </div>
          </div>
          <p className="text-sm text-mist/70">
            Histórico de usuários e permissões: quem fez, em quem, o quê e quando. Os registros não podem ser editados nem
            apagados.
          </p>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <form method="get" className="grid gap-2 sm:grid-cols-[1fr_16rem_auto]">
              <label htmlFor="busca" className="sr-only">Buscar por nome ou e-mail</label>
              <input id="busca" name="q" defaultValue={busca} placeholder="Nome ou e-mail (de quem fez ou de quem foi alterado)" className={classeInput} />
              <label htmlFor="acao" className="sr-only">Ação</label>
              <select id="acao" name="acao" defaultValue={filtro ?? ""} className={classeInput}>
                <option value="">Todas as ações</option>
                {LISTA_ACOES.map((a) => (
                  <option key={a} value={a}>{ACOES[a]}</option>
                ))}
              </select>
              <button type="submit" className="rounded-lg bg-teal-400 px-4 py-2.5 font-semibold text-petrol-950 hover:brightness-110">
                Buscar
              </button>
            </form>

            {registros.length === 0 ? (
              <p className="text-sm text-mist/70">Nenhum registro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-mist/60">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">Quando</th>
                      <th className="py-2 pr-3 font-semibold">Ação</th>
                      <th className="py-2 pr-3 font-semibold">Usuário afetado</th>
                      <th className="py-2 pr-3 font-semibold">Quem fez (login)</th>
                      <th className="py-2 pr-3 font-semibold">Detalhe</th>
                      <th className="py-2 pr-3 font-semibold">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {registros.map((r) => (
                      <tr key={r.id} className="align-top">
                        <td className="whitespace-nowrap py-2 pr-3 text-mist/80">{formatarDataHora(r.criadoEm)}</td>
                        <td className="py-2 pr-3 text-white">{ACOES[r.acao as Acao] ?? r.acao}</td>
                        <td className="py-2 pr-3">
                          <p className="text-white">{r.alvoNome ?? "—"}</p>
                          <p className="text-xs text-mist/60">{r.alvoEmail}</p>
                        </td>
                        <td className="py-2 pr-3">
                          <p className="text-white">{r.autorNome ?? "Sistema"}</p>
                          <p className="text-xs text-mist/60">{r.autorEmail}</p>
                        </td>
                        <td className="py-2 pr-3 text-mist/80">{descreverEvento(r, (p) => ROTULO_PAPEL[p] ?? p) || "—"}</td>
                        <td className="py-2 pr-3 text-xs text-mist/60">{r.ip ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {registros.length === 300 && (
                  <p className="mt-3 text-xs text-mist/60">Mostrando os 300 mais recentes. Use a busca ou exporte.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
