import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import { contarPorPapel, DESCRICAO_PAPEL, listarUsuarios, PAPEIS, type Papel } from "@/modules/usuarios";
import { formatarDataHora } from "@/lib/formatar";
import { Aviso, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { alterarPapelAction } from "./actions";

export const metadata: Metadata = { title: "Permissões — LPZ Training" };

const ERROS: Record<string, string> = {
  dados: "Não foi possível alterar. Atualize a página e tente de novo.",
  proprio: "Você não pode mudar o seu próprio perfil. Peça a outro organizador.",
  confirmar: "Para dar acesso de Portaria ou Organizador, marque a caixa de confirmação.",
};

const COR_PAPEL: Record<string, string> = {
  organizador: "bg-gold-400/20 text-gold-300",
  portaria: "bg-ember-500/15 text-ember-400",
  profissional: "bg-teal-400/15 text-teal-300",
  congressista: "bg-white/10 text-mist/80",
};

export default async function Page(props: PageProps<"/administradores/permissoes">) {
  const { user } = await exigirAdmin(["organizador"]);
  const { q, papel, ok, erro } = await props.searchParams;
  const busca = typeof q === "string" ? q.slice(0, 100) : "";
  const filtro = PAPEIS.find((p) => p === papel);

  const [lista, totais] = await Promise.all([listarUsuarios({ busca, papel: filtro }), contarPorPapel()]);

  const params = new URLSearchParams();
  if (busca) params.set("q", busca);
  if (filtro) params.set("papel", filtro);
  const voltar = `/administradores/permissoes${params.size ? `?${params}` : ""}`;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
              Permissões
            </h1>
            <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
          </div>

          {ok && <Aviso tipo="ok">Perfil alterado. A pessoa precisa entrar de novo para o novo acesso valer.</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Perfis de acesso</h2>
            <p className="mt-2 text-sm text-mist/70">
              Todo mundo que se cadastra pelo site entra como <strong className="text-white">Congressista</strong> (usuário
              comum). Aqui você dá mais acesso a quem precisa.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {PAPEIS.map((p) => (
                <li key={p} className="rounded-xl border border-white/10 bg-petrol-950/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR_PAPEL[p]}`}>{ROTULO_PAPEL[p]}</span>
                    <span className="text-sm text-mist/70">{totais[p] ?? 0} pessoas</span>
                  </div>
                  <p className="mt-2 text-xs text-mist/70">{DESCRICAO_PAPEL[p]}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <form method="get" className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
              <label htmlFor="busca" className="sr-only">Buscar por nome ou e-mail</label>
              <input id="busca" name="q" defaultValue={busca} placeholder="Buscar por nome ou e-mail" className={classeInput} />
              <label htmlFor="filtro-papel" className="sr-only">Perfil</label>
              <select id="filtro-papel" name="papel" defaultValue={filtro ?? ""} className={classeInput}>
                <option value="">Todos os perfis</option>
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>{ROTULO_PAPEL[p]}</option>
                ))}
              </select>
              <button type="submit" className="rounded-lg bg-teal-400 px-4 py-2.5 font-semibold text-petrol-950 hover:brightness-110">
                Buscar
              </button>
            </form>

            {lista.length === 0 ? (
              <p className="mt-4 text-sm text-mist/70">Nenhum usuário encontrado.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {lista.map((u) => {
                  const euMesmo = u.id === user.id;
                  return (
                    <li key={u.id} className="rounded-xl border border-white/10 bg-petrol-950/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {u.nome} {euMesmo && <span className="text-xs font-normal text-mist/60">(você)</span>}
                          </p>
                          <p className="truncate text-sm text-mist/60">{u.email}</p>
                          <p className="text-xs text-mist/50">
                            Cadastro em {formatarDataHora(u.criadoEm)}
                            {u.professorNome ? ` · perfil de professor: ${u.professorNome}` : ""}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR_PAPEL[u.papel]}`}>
                          {ROTULO_PAPEL[u.papel]}
                        </span>
                      </div>

                      {(u.papel === "organizador" || u.papel === "portaria") && !u.duasEtapas && (
                        <p className="mt-2 text-xs text-ember-400">
                          Ainda não ativou a verificação em duas etapas — será pedida no próximo acesso.
                        </p>
                      )}

                      {!euMesmo && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-teal-300">Mudar perfil</summary>
                          <form action={alterarPapelAction} className="mt-3 space-y-3">
                            <input type="hidden" name="usuarioId" value={u.id} />
                            <input type="hidden" name="voltar" value={voltar} />
                            <fieldset className="grid gap-2 sm:grid-cols-2">
                              <legend className="sr-only">Novo perfil</legend>
                              {PAPEIS.map((p: Papel) => (
                                <label key={p} className="flex items-start gap-2 rounded-lg border border-white/10 p-2 text-sm text-mist has-[:checked]:border-gold-400">
                                  <input type="radio" name="papel" value={p} defaultChecked={u.papel === p} className="mt-1 accent-gold-400" />
                                  <span>
                                    <span className="font-medium text-white">{ROTULO_PAPEL[p]}</span>
                                    <span className="block text-xs text-mist/60">{DESCRICAO_PAPEL[p]}</span>
                                  </span>
                                </label>
                              ))}
                            </fieldset>
                            {!u.temSenha && (
                              <p className="text-xs text-ember-400">
                                Esta conta entra só pelo Google. Para Portaria/Organizador, a pessoa precisa criar uma senha
                                (em “Esqueci a senha”), porque a verificação em duas etapas pede a senha.
                              </p>
                            )}
                            <label className="flex items-center gap-2 text-xs text-mist/80">
                              <input type="checkbox" name="confirmo" className="h-4 w-4 accent-gold-400" />
                              Confirmo (obrigatório para dar acesso de Portaria ou Organizador)
                            </label>
                            <button
                              type="submit"
                              className="bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110"
                            >
                              Salvar perfil
                            </button>
                          </form>
                        </details>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {lista.length === 200 && <p className="mt-3 text-xs text-mist/60">Mostrando os 200 primeiros. Use a busca.</p>}
          </section>
        </div>
      </main>
    </>
  );
}
