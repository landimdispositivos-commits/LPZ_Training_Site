import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatarPreco } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { caixaAbertoDo, totaisPorForma, ROTULO_FORMA } from "@/modules/bar/caixa";
import { Aviso, classeInput } from "../../../_components/form-ui";
import { BotaoSalvar } from "../../../_components/botao-salvar";
import { SiteHeader } from "../../../_components/site-header";
import { fecharCaixaAction } from "../actions";

export const metadata: Metadata = { title: "Bar — Fechar caixa — LPZ Training" };

export default async function Page(props: PageProps<"/bar/caixa/fechar">) {
  const { user } = await exigirBar("caixa");
  const { erro } = await props.searchParams;
  const evento = await eventoEmAndamento();
  const caixa = evento ? await caixaAbertoDo(evento.id, user.id) : null;
  if (!caixa) redirect("/bar/caixa");
  const totais = await totaisPorForma({ caixaId: caixa.id });
  const dinheiro = totais.find((t) => t.forma === "dinheiro")?.total ?? 0;
  const esperado = caixa.valorInicialCentavos + dinheiro;
  const geral = totais.reduce((s, t) => s + t.total, 0);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Fechar caixa</h1>
            <Link href="/bar/caixa" className="text-sm text-teal-300 hover:underline">Voltar</Link>
          </div>
          {erro === "dados" && <Aviso tipo="erro">Confira o valor contado.</Aviso>}

          <section className="space-y-2 rounded-2xl border border-white/10 bg-petrol-900/80 p-6 text-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Resumo do seu turno</h2>
            {totais.length === 0 && <p className="text-mist/70">Nenhuma venda neste caixa.</p>}
            {totais.map((t) => (
              <p key={t.forma} className="flex justify-between text-mist">
                <span>{ROTULO_FORMA[t.forma] ?? t.forma} ({t.vendas})</span>
                <span className="text-white">{formatarPreco(t.total)}</span>
              </p>
            ))}
            <p className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white"><span>Total vendido</span><span>{formatarPreco(geral)}</span></p>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <p className="text-sm text-mist/80">
              Dinheiro esperado na gaveta: troco inicial {formatarPreco(caixa.valorInicialCentavos)} + vendas em dinheiro {formatarPreco(dinheiro)} ={" "}
              <strong className="text-white">{formatarPreco(esperado)}</strong>.
            </p>
            <form action={fecharCaixaAction} className="space-y-4">
              <div>
                <label htmlFor="contado" className="mb-1 block text-sm text-mist">Dinheiro contado na gaveta (R$)</label>
                <input id="contado" name="contado" inputMode="decimal" required className={classeInput} />
              </div>
              <BotaoSalvar>Fechar caixa</BotaoSalvar>
            </form>
            <p className="text-xs text-mist/60">A diferença entre o contado e o esperado fica registrada para a gestão.</p>
          </section>
        </div>
      </main>
    </>
  );
}
