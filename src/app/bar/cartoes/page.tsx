import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Aviso } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { obterSessao } from "@/modules/auth/sessao";
import { cartaoVencido, cartoesDoCliente, MAX_CARTOES, rotuloBandeira } from "@/modules/bar/cartoes";
import { paymentProvider } from "@/modules/pagamentos";
import { FakePaymentProvider } from "@/modules/pagamentos/fake-payment-provider";
import { AdicionarCartao } from "./adicionar-cartao";
import { definirCartaoPadraoAction, removerCartaoAction } from "./actions";

export const metadata: Metadata = { title: "Meus cartões — LPZ Training" };

export default async function Page(props: PageProps<"/bar/cartoes">) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const { ok, erro } = await props.searchParams;
  const cartoes = await cartoesDoCliente(sessao.user.id);
  const simulado = process.env.TEST_MODE === "true" && paymentProvider instanceof FakePaymentProvider;
  const chavePublica = process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || null;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal">Meus cartões</h1>
            <Link href="/bar" className="text-sm text-teal-300 hover:underline">Voltar ao Bar</Link>
          </div>
          {ok === "removido" && <Aviso tipo="ok">Cartão removido.</Aviso>}
          {erro === "remover" && <Aviso tipo="erro">Não foi possível remover o cartão agora. Tente de novo.</Aviso>}

          <p className="text-sm text-mist/80">
            Guarde um cartão para pagar o Bar com poucos toques: você escolhe o cartão padrão e digita só o código de segurança. O cartão fica guardado no
            Mercado Pago, não no nosso site.
          </p>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Cartões guardados ({cartoes.length}/{MAX_CARTOES})</h2>
            {cartoes.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhum cartão guardado.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10">
                {cartoes.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span>
                      <span className="block font-semibold text-white">
                        {rotuloBandeira(c.bandeira)} •••• {c.ultimos4}
                        {c.padrao && <span className="ml-2 rounded-full bg-gold-400/20 px-2 py-0.5 text-xs font-semibold text-gold-300">Padrão</span>}
                      </span>
                      <span className={`block text-xs ${cartaoVencido(c.validade) ? "text-ember-400" : "text-mist/60"}`}>
                        {cartaoVencido(c.validade) ? "Vencido" : "Validade"} {c.validade}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {!c.padrao && (
                        <form action={definirCartaoPadraoAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="rounded-full border border-gold-500/60 px-3 py-1 text-xs font-semibold text-gold-300 hover:bg-gold-500/10">Tornar padrão</button>
                        </form>
                      )}
                      <form action={removerCartaoAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="rounded-full border border-ember-500/60 px-3 py-1 text-xs font-semibold text-ember-400 hover:bg-ember-500/10">Remover</button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {cartoes.length < MAX_CARTOES && paymentProvider.suportaCartaoSalvo && (
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-300">Adicionar cartão</h2>
              <AdicionarCartao chavePublica={chavePublica} simulado={simulado} />
            </section>
          )}
          <p className="text-center text-xs text-mist/50">
            Ao guardar um cartão você autoriza o armazenamento no Mercado Pago. Veja a <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
          </p>
        </div>
      </main>
    </>
  );
}
