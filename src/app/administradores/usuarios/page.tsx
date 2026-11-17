import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import { PRODUTOS, TIPOS_PRODUTO } from "@/modules/ingressos/produtos";
import { contarPorPapel, listarCadastros, PAPEIS, type Cadastro } from "@/modules/usuarios";
import { COLUNAS } from "@/modules/usuarios/colunas";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { MarcarColunas } from "./marcar-colunas";

export const metadata: Metadata = { title: "Usuários — LPZ Training" };

const COR_PAPEL: Record<string, string> = {
  organizador: "bg-gold-400/20 text-gold-300",
  portaria: "bg-ember-500/15 text-ember-400",
  profissional: "bg-teal-400/15 text-teal-300",
  congressista: "bg-white/10 text-mist/80",
};

const SIGLA_PRODUTO: Record<string, string> = {
  full_pass: "Full pass",
  pacote_baile: "Pac. baile",
  baile_avulso: "Baile avulso",
  paparazzi_video: "Pap. vídeo",
  paparazzi_foto: "Pap. fotos",
};

const STATUS_PEDIDO: Record<string, string> = {
  pago: "Pago",
  pendente: "Aguardando pagamento",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

// Colunas da grade (telas largas). No celular cada linha vira um cartão.
const GRADE = "lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.6fr)_2.5rem] lg:items-center lg:gap-3";

function mascararCpf(cpf: string) {
  return `${cpf.slice(0, 3)}.***.***-**`;
}

function dataBr(data: string) {
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
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Usuários</h1>
            <div className="flex gap-4 text-sm">
              <Link href="/administradores/permissoes" className="text-teal-300 hover:underline">Permissões</Link>
              <Link href="/administradores/painel" className="text-teal-300 hover:underline">Painel</Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            <Contador rotulo="Total" valor={total} destaque />
            {PAPEIS.map((p) => (
              <Contador key={p} rotulo={ROTULO_PAPEL[p]} valor={totais[p] ?? 0} />
            ))}
          </div>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
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

            {/* Exportação para Excel com escolha de colunas */}
            <details className="rounded-xl border border-gold-500/30 bg-petrol-950/50">
              <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-semibold text-gold-300 [&::-webkit-details-marker]:hidden">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Exportar para Excel
                <span className="font-normal text-mist/60">— {lista.length} usuários (com a busca e o filtro atuais)</span>
              </summary>
              <form method="get" action="/administradores/usuarios/exportar" className="space-y-3 border-t border-white/10 p-4">
                {busca && <input type="hidden" name="q" value={busca} />}
                {filtro && <input type="hidden" name="papel" value={filtro} />}
                <MarcarColunas />
                <fieldset>
                  <legend className="mb-2 text-xs text-mist/60">Colunas da planilha</legend>
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {COLUNAS.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-mist">
                        <input
                          type="checkbox"
                          name="col"
                          value={c.id}
                          defaultChecked
                          data-basica={c.basica ? "1" : "0"}
                          className="h-4 w-4 accent-gold-400"
                        />
                        {c.titulo}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button type="submit" className="bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                  Baixar planilha (.xlsx)
                </button>
              </form>
            </details>

            {lista.length === 0 ? (
              <p className="text-sm text-mist/70">Nenhum usuário encontrado.</p>
            ) : (
              <div>
                <div className={`hidden border-b border-white/10 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-mist/60 ${GRADE}`}>
                  <span>Nome / e-mail</span>
                  <span>Celular</span>
                  <span>Cidade</span>
                  <span>Perfil</span>
                  <span>Cadastro via</span>
                  <span>Comprou</span>
                  <span className="sr-only">Detalhes</span>
                </div>
                <ul className="divide-y divide-white/5">
                  {lista.map((u) => (
                    <LinhaUsuario key={u.id} u={u} />
                  ))}
                </ul>
              </div>
            )}
            {lista.length === 500 && <p className="text-xs text-mist/60">Mostrando os 500 mais recentes. Use a busca ou exporte.</p>}
          </section>
        </div>
      </main>
    </>
  );
}

function Contador({ rotulo, valor, destaque }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-petrol-900/80 p-4">
      <p className="text-xs text-mist/70">{rotulo}</p>
      <p className={destaque ? "text-gold-metal text-3xl font-extrabold" : "text-3xl font-extrabold text-white"}>{valor}</p>
    </div>
  );
}

function LinhaUsuario({ u }: { u: Cadastro }) {
  const local = [u.cidade, u.uf ?? (u.pais && u.pais !== "Brasil" ? u.pais : null)].filter(Boolean).join(" — ");
  const produtos = TIPOS_PRODUTO.filter((t) => u.comprou[t]);
  const pendente = u.compras.some((c) => c.status === "pendente");
  const endereco = u.logradouro
    ? [`${u.logradouro}, ${u.numero ?? "s/n"}`, u.complemento, u.bairro, u.cep].filter(Boolean).join(" · ")
    : null;

  const ficha = [
    { rotulo: "Cadastro via", valor: u.formaCadastro },
    { rotulo: "Cadastrado em", valor: formatarDataHora(u.criadoEm) },
    { rotulo: "E-mail confirmado", valor: u.emailVerificado ? "Sim" : "Não" },
    { rotulo: "Ficha completa", valor: u.cadastroCompletoEm ? "Sim" : "Não" },
    { rotulo: "Celular", valor: u.celular },
    { rotulo: "Nascimento", valor: u.dataNascimento ? dataBr(u.dataNascimento) : null },
    { rotulo: "CPF", valor: u.cpf ? mascararCpf(u.cpf) : null },
    { rotulo: "Mora em", valor: local || null },
    { rotulo: "Endereço", valor: endereco },
    { rotulo: "Como conheceu", valor: u.comoConheceu },
  ];

  return (
    <li>
      <details className="group">
        <summary className={`cursor-pointer list-none rounded-lg px-3 py-3 hover:bg-white/5 [&::-webkit-details-marker]:hidden ${GRADE}`}>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{u.nome}</p>
            <p className="truncate text-xs text-mist/60">{u.email}</p>
          </div>
          <p className="truncate text-sm text-mist/80">{u.celular ?? "—"}</p>
          <p className="truncate text-sm text-mist/80">{local || "—"}</p>
          <div>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COR_PAPEL[u.papel]}`}>
              {ROTULO_PAPEL[u.papel]}
            </span>
          </div>
          <p className="truncate text-sm text-mist/80">{u.formaCadastro}</p>
          <div className="flex flex-wrap gap-1">
            {produtos.length === 0 && !pendente && <span className="text-xs text-mist/50">Nada ainda</span>}
            {produtos.map((t) => (
              <span key={t} className="rounded-full bg-teal-400/15 px-2 py-0.5 text-xs text-teal-300">{SIGLA_PRODUTO[t]}</span>
            ))}
            {pendente && <span className="rounded-full bg-ember-500/15 px-2 py-0.5 text-xs text-ember-400">Pendente</span>}
          </div>
          <span className="flex justify-end text-gold-300" title="Ver detalhes">
            <span className="sr-only">Ver detalhes de {u.nome}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden h-5 w-5 group-open:block" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </span>
        </summary>

        <div className="mb-3 grid gap-4 rounded-xl border border-white/10 bg-petrol-950/70 p-4 lg:grid-cols-2">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Ficha</h3>
            <dl className="mt-2 space-y-1.5 text-sm">
              {ficha.map((d) => (
                <div key={d.rotulo} className="flex justify-between gap-4 border-b border-white/5 pb-1">
                  <dt className="text-mist/60">{d.rotulo}</dt>
                  <dd className="text-right text-white">{d.valor ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/administradores/permissoes?q=${encodeURIComponent(u.email)}`}
              className="mt-3 inline-block text-sm font-medium text-teal-300 hover:underline"
            >
              Mudar permissão desta pessoa
            </Link>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Compras</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIPOS_PRODUTO.map((t) => (
                <li
                  key={t}
                  className={
                    u.comprou[t]
                      ? "rounded-lg border border-teal-400/40 bg-teal-400/10 px-2 py-1.5 text-xs text-teal-300"
                      : "rounded-lg border border-white/10 px-2 py-1.5 text-xs text-mist/50"
                  }
                >
                  {u.comprou[t] ? "✓ " : "— "}
                  {PRODUTOS[t].nome}
                </li>
              ))}
            </ul>
            {u.compras.length === 0 ? (
              <p className="mt-3 text-sm text-mist/60">Nenhum pedido.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {u.compras.map((c, i) => (
                  <li key={i} className="flex flex-wrap justify-between gap-2 border-b border-white/5 pb-1.5 text-sm">
                    <span className="text-white">
                      {PRODUTOS[c.tipo].nome} <span className="text-mist/60">· {c.loteNome}</span>
                    </span>
                    <span className="text-mist/80">
                      {formatarPreco(c.valorCentavos)} · {STATUS_PEDIDO[c.status] ?? c.status} · {formatarDataHora(c.criadoEm)}
                      {c.checkinEm ? " · entrou" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-mist/80">
              Total pago: <strong className="text-gold-300">{formatarPreco(u.totalPagoCentavos)}</strong>
            </p>
          </section>
        </div>
      </details>
    </li>
  );
}
