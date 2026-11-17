import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import { contarPorPapel, listarCadastros, PAPEIS } from "@/modules/usuarios";
import { formatarDataHora } from "@/lib/formatar";
import { classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Usuários — LPZ Training" };

const COR_PAPEL: Record<string, string> = {
  organizador: "bg-gold-400/20 text-gold-300",
  portaria: "bg-ember-500/15 text-ember-400",
  profissional: "bg-teal-400/15 text-teal-300",
  congressista: "bg-white/10 text-mist/80",
};

// A tela pode estar à vista de outras pessoas: CPF só com os 3 primeiros dígitos.
function mascararCpf(cpf: string) {
  return `${cpf.slice(0, 3)}.***.***-**`;
}

function formatarData(data: string) {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

export default async function Page(props: PageProps<"/administradores/usuarios">) {
  await exigirAdmin(["organizador"]);
  const { q, papel } = await props.searchParams;
  const busca = typeof q === "string" ? q.slice(0, 100) : "";
  const filtro = PAPEIS.find((p) => p === papel);

  const [lista, totais] = await Promise.all([listarCadastros({ busca, papel: filtro }), contarPorPapel()]);
  const total = PAPEIS.reduce((soma, p) => soma + (totais[p] ?? 0), 0);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Usuários</h1>
            <div className="flex gap-4 text-sm">
              <Link href="/administradores/permissoes" className="text-teal-300 hover:underline">Permissões</Link>
              <Link href="/administradores/painel" className="text-teal-300 hover:underline">Painel</Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-petrol-900/80 p-4">
              <p className="text-xs text-mist/70">Total</p>
              <p className="text-gold-metal text-3xl font-extrabold">{total}</p>
            </div>
            {PAPEIS.map((p) => (
              <div key={p} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-4">
                <p className="text-xs text-mist/70">{ROTULO_PAPEL[p]}</p>
                <p className="text-3xl font-extrabold text-white">{totais[p] ?? 0}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <form method="get" className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
              <label htmlFor="busca" className="sr-only">Buscar por nome, e-mail ou cidade</label>
              <input id="busca" name="q" defaultValue={busca} placeholder="Buscar por nome, e-mail ou cidade" className={classeInput} />
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
                  const local = [u.cidade, u.uf ?? (u.pais && u.pais !== "Brasil" ? u.pais : null)].filter(Boolean).join(" — ");
                  const endereco = u.logradouro
                    ? [`${u.logradouro}, ${u.numero ?? "s/n"}`, u.complemento, u.bairro, u.cep].filter(Boolean).join(" · ")
                    : null;
                  const detalhes = [
                    { rotulo: "Celular", valor: u.celular },
                    { rotulo: "Nascimento", valor: u.dataNascimento ? formatarData(u.dataNascimento) : null },
                    { rotulo: "CPF", valor: u.cpf ? mascararCpf(u.cpf) : null },
                    { rotulo: "Mora em", valor: local || null },
                    { rotulo: "Endereço", valor: endereco },
                    { rotulo: "Como conheceu", valor: u.comoConheceu },
                    { rotulo: "Cadastro", valor: formatarDataHora(u.criadoEm) },
                    { rotulo: "E-mail confirmado", valor: u.emailVerificado ? "Sim" : "Não" },
                  ];
                  return (
                    <li key={u.id} className="rounded-xl border border-white/10 bg-petrol-950/60">
                      <details>
                        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{u.nome}</p>
                            <p className="truncate text-sm text-mist/60">
                              {u.email}
                              {local ? ` · ${local}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {u.ingresso === "pago" && (
                              <span className="rounded-full bg-teal-400/15 px-3 py-1 text-xs text-teal-300">Ingresso pago</span>
                            )}
                            {u.ingresso === "pendente" && (
                              <span className="rounded-full bg-ember-500/15 px-3 py-1 text-xs text-ember-400">Pagamento pendente</span>
                            )}
                            {u.papel === "congressista" && !u.cadastroCompletoEm && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-mist/70">Ficha incompleta</span>
                            )}
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR_PAPEL[u.papel]}`}>
                              {ROTULO_PAPEL[u.papel]}
                            </span>
                          </div>
                        </summary>
                        <dl className="grid gap-x-6 gap-y-2 border-t border-white/10 p-4 text-sm sm:grid-cols-2">
                          {detalhes.map((d) => (
                            <div key={d.rotulo} className="flex justify-between gap-4 border-b border-white/5 pb-1">
                              <dt className="text-mist/60">{d.rotulo}</dt>
                              <dd className="text-right text-white">{d.valor ?? "—"}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="px-4 pb-4">
                          <Link
                            href={`/administradores/permissoes?q=${encodeURIComponent(u.email)}`}
                            className="text-sm font-medium text-teal-300 hover:underline"
                          >
                            Mudar permissão desta pessoa
                          </Link>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
            {lista.length === 300 && <p className="mt-3 text-xs text-mist/60">Mostrando os 300 mais recentes. Use a busca.</p>}
          </section>
        </div>
      </main>
    </>
  );
}
