import type { Metadata } from "next";
import Link from "next/link";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { caixaAbertoDo, produtosParaVenda, totaisPorForma, ultimasVendasDoCaixa, ROTULO_FORMA } from "@/modules/bar/caixa";
import { Aviso, classeInput } from "../../_components/form-ui";
import { BotaoSalvar } from "../../_components/botao-salvar";
import { SiteHeader } from "../../_components/site-header";
import { abrirCaixaAction } from "./actions";
import { Pdv } from "./pdv";

export const metadata: Metadata = { title: "Bar — Caixa — LPZ Training" };

export default async function Page(props: PageProps<"/bar/caixa">) {
  const { user } = await exigirBar("caixa");
  const { ok, erro, n, c } = await props.searchParams;
  const evento = await eventoEmAndamento();
  const caixa = evento ? await caixaAbertoDo(evento.id, user.id) : null;
  const [produtos, totais, ultimas] =
    evento && caixa
      ? await Promise.all([produtosParaVenda(evento.id), totaisPorForma({ caixaId: caixa.id }), ultimasVendasDoCaixa(caixa.id)])
      : [[], [], []];
  const totalCaixa = totais.reduce((s, t) => s + t.total, 0);
  const qtdVendas = totais.reduce((s, t) => s + t.vendas, 0);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Bar — Caixa</h1>
            <Link href="/bar" className="text-sm text-teal-300 hover:underline">Voltar ao Bar</Link>
          </div>

          {ok === "fechado" && <Aviso tipo="ok">Caixa fechado. Bom descanso!</Aviso>}
          {ok === "comanda" && <Aviso tipo="ok">Consumo lançado na comanda <strong className="font-mono text-xl font-extrabold">{typeof c === "string" ? c : ""}</strong>. Ele será cobrado em Comandas.</Aviso>}
          {erro === "dados" && <Aviso tipo="erro">Confira o valor informado.</Aviso>}

          {!evento ? (
            <p className="text-sm text-mist/70">Não há evento do bar em andamento. Peça à gestão para definir um.</p>
          ) : !caixa ? (
            <section className="max-w-md space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <p className="text-sm text-mist/80">
                Evento: <strong className="text-white">{evento.nome}</strong>. Abra o seu caixa para começar a vender.
              </p>
              <form action={abrirCaixaAction} className="space-y-4">
                <div>
                  <label htmlFor="inicial" className="mb-1 block text-sm text-mist">Troco inicial no caixa (R$)</label>
                  <input id="inicial" name="inicial" inputMode="decimal" defaultValue="0" className={classeInput} />
                </div>
                <BotaoSalvar>Abrir caixa</BotaoSalvar>
              </form>
            </section>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-mist/80">
                <p>
                  <strong className="text-white">{evento.nome}</strong> · caixa aberto às {formatarDataHora(caixa.abertoEm)} ·{" "}
                  {qtdVendas} {qtdVendas === 1 ? "venda" : "vendas"} · <strong className="text-white">{formatarPreco(totalCaixa)}</strong>
                </p>
                <Link href="/bar/caixa/fechar" className="rounded-full border border-gold-500/60 px-4 py-2 font-semibold text-gold-300 hover:bg-gold-500/10">
                  Fechar caixa
                </Link>
              </div>

              {!evento.usaCaixa ? (
                <p className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5 text-sm text-mist/80">
                  A venda direta no caixa está desligada neste evento. Para cobrar uma comanda, use{" "}
                  <Link href="/bar/comanda" className="text-teal-300 underline">Comandas</Link>.
                </p>
              ) : produtos.length === 0 ? (
                <p className="text-sm text-mist/70">Nenhum produto ativo neste evento. Peça à gestão para cadastrar.</p>
              ) : (
                <Pdv key={typeof n === "string" ? n : "pdv"} produtos={produtos} comandaAtiva={evento.usaComanda} />
              )}

              {ultimas.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Minhas últimas vendas</h2>
                  <ul className="mt-3 divide-y divide-white/10 text-sm">
                    {ultimas.map((v) => (
                      <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="text-mist">
                          <Link href={`/bar/ticket/${v.codigo}`} className="font-semibold text-teal-300 underline">Nº {v.numero}</Link> ·{" "}
                          {ROTULO_FORMA[v.forma] ?? v.forma} · {formatarDataHora(v.criadoEm)}
                          {v.status === "estornada" && <span className="text-ember-400"> · estornada</span>}
                          {v.status !== "estornada" && v.ticket === "entregue" && <span className="text-teal-300"> · entregue</span>}
                        </span>
                        <span className="font-semibold text-white">{formatarPreco(v.total)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
