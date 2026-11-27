import type { Metadata } from "next";
import Link from "next/link";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { comandasAbertas, comandasPagas } from "@/modules/bar/comanda";
import { ListaComandas, situacaoDe } from "../_components/lista-comandas";
import { Aviso, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { abrirComandaAction } from "./actions";

export const metadata: Metadata = { title: "Bar — Comandas — LPZ Training" };

export default async function Page(props: PageProps<"/bar/comanda">) {
  const { user } = await exigirBar(["balcao", "caixa"]);
  const podeReceber = acessoBar(user).caixa;
  const { ok, venda, erro, situacao } = await props.searchParams;
  const evento = await eventoEmAndamento();
  const [abertas, pagas] = evento?.usaComanda ? await Promise.all([comandasAbertas(evento.id), comandasPagas(evento.id)]) : [[], []];

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Bar — Comandas</h1>
            <Link href="/bar" className="text-sm text-teal-300 hover:underline">Voltar ao Bar</Link>
          </div>
          {ok === "paga" && <Aviso tipo="ok">Comanda paga e fechada{typeof venda === "string" ? ` (venda nº ${venda})` : ""}.</Aviso>}
          {erro === "numero" && <Aviso tipo="erro">Digite o número da pulseira ou cartão.</Aviso>}
          {(erro === "vazia" || erro === "recebido" || erro === "comanda") && <Aviso tipo="erro">{erro === "vazia" ? "A comanda está sem itens para cobrar." : erro === "recebido" ? "O valor recebido é menor que o total." : "Esta comanda não está mais aberta."}</Aviso>}

          {!evento ? (
            <p className="text-sm text-mist/70">Não há evento do bar em andamento.</p>
          ) : !evento.usaComanda ? (
            <p className="text-sm text-mist/70">A comanda está desligada neste evento. A gestão pode ligar em Eventos.</p>
          ) : (
            <>
              <section className="space-y-3 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
                <p className="text-sm text-mist/80">Digite o número da pulseira ou do cartão para lançar consumo ou cobrar.</p>
                <form action={abrirComandaAction} className="flex gap-2">
                  <label htmlFor="numero" className="sr-only">Número da comanda</label>
                  <input id="numero" name="numero" required autoFocus autoComplete="off" maxLength={20} placeholder="Nº da comanda" className={`${classeInput} font-mono text-lg uppercase tracking-widest`} />
                  <button type="submit" className="bg-gold-metal rounded-lg px-5 font-semibold text-gold-ink hover:brightness-110">Abrir</button>
                </form>
              </section>

              <ListaComandas abertas={abertas} pagas={pagas} situacao={situacaoDe(situacao)} base="/bar/comanda" podeReceber={podeReceber} voltar="lista" />
            </>
          )}
        </div>
      </main>
    </>
  );
}
