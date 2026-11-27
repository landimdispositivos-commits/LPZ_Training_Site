import type { Metadata } from "next";
import Link from "next/link";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { caixaAbertoDo, FORMAS_PAGAMENTO, produtosParaVenda } from "@/modules/bar/caixa";
import { comandaAberta, normalizarNumeroComanda, totalDaComanda } from "@/modules/bar/comanda";
import { Aviso, classeInput } from "../../../_components/form-ui";
import { SiteHeader } from "../../../_components/site-header";
import { cancelarItemComandaAction, cobrarComandaAction } from "../actions";
import { Lancador } from "./lancador";

export const metadata: Metadata = { title: "Bar — Comanda — LPZ Training" };

const ERROS: Record<string, string> = {
  motivo: "Informe o motivo do cancelamento (mínimo 3 letras).",
  item: "Este item não pode mais ser cancelado.",
  forma: "Escolha a forma de pagamento.",
  caixa: "Abra o seu caixa antes de cobrar (menu Caixa).",
  vazia: "A comanda está sem itens para cobrar.",
  recebido: "O valor recebido é menor que o total.",
  comanda: "Esta comanda não está mais aberta.",
};

export default async function Page(props: PageProps<"/bar/comanda/[numero]">) {
  const { user } = await exigirBar(["balcao", "caixa"]);
  const { numero: bruto } = await props.params;
  const { ok, erro } = await props.searchParams;
  const numero = normalizarNumeroComanda(bruto);
  const acesso = acessoBar(user);
  const evento = await eventoEmAndamento();

  if (!evento || !evento.usaComanda || !numero) {
    return (
      <>
        <SiteHeader />
        <main className="bg-city-glow min-h-[80vh] px-4 py-10">
          <p className="mx-auto max-w-xl text-sm text-mist/80">
            {!evento ? "Não há evento do bar em andamento." : "A comanda está desligada neste evento."}{" "}
            <Link href="/bar" className="text-teal-300 underline">Voltar ao Bar</Link>
          </p>
        </main>
      </>
    );
  }

  const [comanda, produtos, caixa] = await Promise.all([
    comandaAberta(evento.id, numero),
    produtosParaVenda(evento.id),
    acesso.caixa ? caixaAbertoDo(evento.id, user.id) : Promise.resolve(null),
  ]);
  const ativos = comanda?.itens.filter((i) => i.status === "ativo") ?? [];
  const total = comanda ? totalDaComanda(comanda.itens) : 0;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Comanda {numero}</h1>
            <Link href="/bar/comanda" className="text-sm text-teal-300 hover:underline">Outra comanda</Link>
          </div>
          {ok === "lancado" && <Aviso tipo="ok">Consumo lançado na comanda.</Aviso>}
          {ok === "cancelado" && <Aviso tipo="ok">Item cancelado e estoque devolvido.</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Consumo da comanda</h2>
              <p className="text-2xl font-extrabold text-gold-300">{formatarPreco(total)}</p>
            </div>
            {!comanda || comanda.itens.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Comanda nova. Lance o primeiro consumo abaixo.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10 text-sm">
                {comanda.itens.map((i) => (
                  <li key={i.id} className={`py-2 ${i.status === "cancelado" ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white">
                        {i.quantidade}× {i.nome} {i.status === "cancelado" && <span className="text-xs text-ember-400">(cancelado)</span>}
                      </span>
                      <span className={i.status === "cancelado" ? "text-mist/60 line-through" : "text-mist"}>{formatarPreco(i.quantidade * i.precoUnitCentavos)}</span>
                    </div>
                    <p className="text-xs text-mist/50">
                      {formatarDataHora(i.lancadoEm)}{i.lancadoPorNome ? ` · ${i.lancadoPorNome}` : ""}
                      {i.motivoCancelamento ? ` · cancelado: ${i.motivoCancelamento}` : ""}
                    </p>
                    {i.status === "ativo" && acesso.caixa && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs font-medium text-ember-400">Cancelar item</summary>
                        <form action={cancelarItemComandaAction} className="mt-2 flex flex-wrap items-end gap-2">
                          <input type="hidden" name="itemId" value={i.id} />
                          <input type="hidden" name="numero" value={numero} />
                          <label htmlFor={`mot-${i.id}`} className="sr-only">Motivo</label>
                          <input id={`mot-${i.id}`} name="motivo" required minLength={3} maxLength={300} placeholder="Motivo" className={`${classeInput} max-w-xs`} />
                          <button type="submit" className="rounded-full border border-ember-500/60 px-4 py-2 text-xs font-semibold text-ember-400 hover:bg-ember-500/10">Confirmar</button>
                        </form>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {acesso.caixa && ativos.length > 0 && (
            <section className="space-y-4 rounded-2xl border border-gold-500/40 bg-petrol-900/90 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-300">Cobrar e fechar a comanda</h2>
              {!caixa ? (
                <p className="text-sm text-mist/80">
                  Para cobrar, abra o seu caixa em <Link href="/bar/caixa" className="text-teal-300 underline">Caixa</Link>.
                </p>
              ) : (
                <form action={cobrarComandaAction} className="space-y-4">
                  <input type="hidden" name="numero" value={numero} />
                  <fieldset>
                    <legend className="mb-2 text-xs text-mist/70">Forma de pagamento</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(Object.entries(FORMAS_PAGAMENTO) as [string, string][]).map(([v, r], idx) => (
                        <label key={v} className="flex h-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-mist has-[:checked]:border-transparent has-[:checked]:bg-gold-400 has-[:checked]:text-gold-ink">
                          <input type="radio" name="forma" value={v} defaultChecked={idx === 0} className="sr-only" />
                          {r.replace(" (maquininha)", "")}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label htmlFor="recebido" className="mb-1 block text-xs text-mist/70">Valor recebido, só se for dinheiro (R$)</label>
                    <input id="recebido" name="recebido" inputMode="decimal" placeholder={formatarPreco(total).replace("R$", "").trim()} className={classeInput} />
                  </div>
                  <p className="text-xs text-mist/60">Cobre {formatarPreco(total)} e confirme. A comanda fecha e entra nas vendas.</p>
                  <button type="submit" className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110">
                    Cobrar {formatarPreco(total)} e fechar comanda
                  </button>
                </form>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal-300">Lançar consumo</h2>
            {produtos.length === 0 ? (
              <p className="text-sm text-mist/70">Nenhum produto ativo neste evento.</p>
            ) : (
              <Lancador numero={numero} produtos={produtos} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
