import type { Metadata } from "next";
import Link from "next/link";
import { fornecedores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { CATEGORIAS, LISTA_STATUS, listarFornecedores, STATUS_FORNECEDOR, type StatusFornecedor } from "@/modules/fornecedores";
import { formatarPreco } from "@/lib/formatar";
import { Aviso, Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { removerFornecedorAction, salvarFornecedorAction } from "./actions";

export const metadata: Metadata = { title: "Fornecedores — LPZ Training" };

const OK: Record<string, string> = { salvo: "Fornecedor salvo.", removido: "Fornecedor removido." };
const ERROS: Record<string, string> = {
  dados: "Confira os dados: nome e categoria são obrigatórios; valor no formato 1.500,00; e-mail válido.",
  confirmar: "Marque a caixa de confirmação para remover.",
};

const COR_STATUS: Record<string, string> = {
  cotacao: "bg-white/10 text-mist/80",
  contratado: "bg-gold-400/20 text-gold-300",
  pago: "bg-teal-400/15 text-teal-300",
  descartado: "bg-ember-500/15 text-ember-400",
};

type Fornecedor = typeof fornecedores.$inferSelect;

export default async function Page(props: PageProps<"/administradores/fornecedores">) {
  await exigirAdmin(["organizador"]);
  const { ok, erro } = await props.searchParams;
  const lista = await listarFornecedores();

  const somar = (status: StatusFornecedor[]) =>
    lista.filter((f) => status.includes(f.status as StatusFornecedor)).reduce((t, f) => t + (f.valorCentavos ?? 0), 0);
  const porCategoria = CATEGORIAS.map((c) => ({ categoria: c, itens: lista.filter((f) => f.categoria === c) })).filter(
    (g) => g.itens.length > 0,
  );

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Fornecedores</h1>
            <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
          </div>

          {typeof ok === "string" && OK[ok] && <Aviso tipo="ok">{OK[ok]}</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { rotulo: "Fornecedores", valor: String(lista.length) },
              { rotulo: "Contratado (a pagar + pago)", valor: formatarPreco(somar(["contratado", "pago"])) },
              { rotulo: "Já pago", valor: formatarPreco(somar(["pago"])) },
            ].map((n) => (
              <div key={n.rotulo} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
                <p className="text-sm text-mist/70">{n.rotulo}</p>
                <p className="text-gold-metal mt-1 text-3xl font-extrabold">{n.valor}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-gold-300">+ Novo fornecedor</summary>
              <FormFornecedor />
            </details>
          </section>

          {porCategoria.length === 0 ? (
            <p className="text-sm text-mist/70">Nenhum fornecedor cadastrado ainda.</p>
          ) : (
            porCategoria.map((g) => (
              <section key={g.categoria} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{g.categoria}</h2>
                <ul className="mt-4 space-y-3">
                  {g.itens.map((f) => (
                    <li key={f.id} className="rounded-xl border border-white/10 bg-petrol-950/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">{f.nome}</p>
                          <p className="text-sm text-mist/70">
                            {[f.contato, f.telefone, f.email].filter(Boolean).join(" · ") || "Sem contato cadastrado"}
                          </p>
                          {f.site && <p className="truncate text-sm text-teal-300">{f.site}</p>}
                          {f.observacoes && <p className="mt-1 whitespace-pre-line text-sm text-mist/60">{f.observacoes}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR_STATUS[f.status] ?? COR_STATUS.cotacao}`}>
                            {STATUS_FORNECEDOR[f.status as StatusFornecedor] ?? f.status}
                          </span>
                          {f.valorCentavos !== null && (
                            <p className="mt-2 font-semibold text-white">{formatarPreco(f.valorCentavos)}</p>
                          )}
                        </div>
                      </div>
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-teal-300">Editar</summary>
                        <FormFornecedor fornecedor={f} />
                        <form action={removerFornecedorAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                          <input type="hidden" name="id" value={f.id} />
                          <label className="flex items-center gap-2 text-xs text-mist/80">
                            <input type="checkbox" name="confirmo" required className="h-4 w-4 accent-ember-500" />
                            Confirmo
                          </label>
                          <button
                            type="submit"
                            className="rounded-full border border-ember-500/60 px-4 py-2 text-xs font-semibold text-ember-400 hover:bg-ember-500/10"
                          >
                            Remover fornecedor
                          </button>
                        </form>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </main>
    </>
  );
}

function FormFornecedor({ fornecedor }: { fornecedor?: Fornecedor }) {
  const p = fornecedor?.id ?? "novo-forn";
  return (
    <form action={salvarFornecedorAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}
      <Campo id={`${p}-nome`} label="Nome / empresa">
        <input id={`${p}-nome`} name="nome" required maxLength={120} defaultValue={fornecedor?.nome} className={classeInput} />
      </Campo>
      <Campo id={`${p}-cat`} label="Categoria">
        <select id={`${p}-cat`} name="categoria" required defaultValue={fornecedor?.categoria ?? ""} className={classeInput}>
          <option value="" disabled>Escolha…</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`${p}-contato`} label="Pessoa de contato (opcional)">
        <input id={`${p}-contato`} name="contato" maxLength={120} defaultValue={fornecedor?.contato ?? ""} className={classeInput} />
      </Campo>
      <Campo id={`${p}-tel`} label="Telefone / WhatsApp (opcional)">
        <input id={`${p}-tel`} name="telefone" type="tel" maxLength={40} defaultValue={fornecedor?.telefone ?? ""} className={classeInput} />
      </Campo>
      <Campo id={`${p}-email`} label="E-mail (opcional)">
        <input id={`${p}-email`} name="email" type="email" maxLength={200} defaultValue={fornecedor?.email ?? ""} className={classeInput} />
      </Campo>
      <Campo id={`${p}-site`} label="Site ou Instagram (opcional)">
        <input id={`${p}-site`} name="site" maxLength={300} defaultValue={fornecedor?.site ?? ""} className={classeInput} />
      </Campo>
      <Campo id={`${p}-valor`} label="Valor combinado em R$ (opcional)">
        <input
          id={`${p}-valor`}
          name="valor"
          inputMode="decimal"
          placeholder="1.500,00"
          defaultValue={fornecedor?.valorCentavos != null ? (fornecedor.valorCentavos / 100).toFixed(2).replace(".", ",") : ""}
          className={classeInput}
        />
      </Campo>
      <Campo id={`${p}-status`} label="Situação">
        <select id={`${p}-status`} name="status" defaultValue={fornecedor?.status ?? "cotacao"} className={classeInput}>
          {LISTA_STATUS.map((s) => (
            <option key={s} value={s}>{STATUS_FORNECEDOR[s]}</option>
          ))}
        </select>
      </Campo>
      <div className="sm:col-span-2">
        <Campo id={`${p}-obs`} label="Observações (opcional)">
          <textarea id={`${p}-obs`} name="observacoes" rows={3} maxLength={2000} defaultValue={fornecedor?.observacoes ?? ""} className={classeInput} />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className={classeBotao}>{fornecedor ? "Salvar" : "Adicionar fornecedor"}</button>
      </div>
    </form>
  );
}
