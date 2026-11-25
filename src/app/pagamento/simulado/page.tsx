import { and, asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { lotes, pedidos } from "@/db/schema";
import { formatarPreco } from "@/lib/formatar";
import { obterSessao } from "@/modules/auth/sessao";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../../_components/site-header";
import { CheckoutSimulado } from "./checkout";
import { RodapeSite } from "../../_components/rodape-site";
import { LOCALE, tx } from "@/i18n";
import { MINUTOS_RESERVA, nomeDoLote, nomeDoProduto } from "@/modules/ingressos";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Pagamento — LPZ Training", "Payment — LPZ Training", "Pago — LPZ Training") };
}

// Página de desenvolvimento (TEST_MODE): faz o papel da tela do Mercado Pago.
export default async function Page(props: PageProps<"/pagamento/simulado">) {
  await carregarCatalogo();
  if (process.env.TEST_MODE !== "true") notFound();

  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");

  const { preference } = await props.searchParams;
  if (typeof preference !== "string") notFound();

  const itens = (
    await db
      .select({
        id: pedidos.id,
        status: pedidos.status,
        valorCentavos: pedidos.valorCentavos,
        criadoEm: pedidos.criadoEm,
        nome: pedidos.nome,
        email: pedidos.email,
        loteNome: lotes.nome,
        tipo: lotes.tipo,
      })
      .from(pedidos)
      .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
      .where(and(eq(pedidos.gatewayPreferenceId, preference), eq(pedidos.email, sessao.user.email)))
      .orderBy(asc(pedidos.criadoEm))
  ).filter((p) => p.status === "pendente");
  if (itens.length === 0) redirect("/ingressos");
  const pedido = itens[0];
  const totalCentavos = itens.reduce((s, i) => s + i.valorCentavos, 0);
  const idioma = await obterIdioma();
  const reservaAte = new Date(pedido.criadoEm.getTime() + MINUTOS_RESERVA * 60 * 1000).toLocaleTimeString(LOCALE[idioma], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-lg space-y-6">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">
            {tx(idioma, "Pagamento", "Payment", "Pago")}
          </h1>
          <p className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-center text-sm">
            {idioma === "en" ? (
              <>
                <strong>Test mode.</strong> This screen shows how checkout will work. Mercado Pago is not connected yet:
                no money is charged.
              </>
            ) : idioma === "es" ? (
              <>
                <strong>Modo de prueba.</strong> Esta pantalla muestra cómo será el pago. Mercado Pago aún no está
                conectado: no se cobra dinero.
              </>
            ) : (
              <>
                <strong>Modo de teste.</strong> Esta tela mostra como vai ser o pagamento. O Mercado Pago ainda não está
                conectado: nenhum dinheiro é cobrado.
              </>
            )}
          </p>

          <section className="rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-5">
            <h2 className="font-display text-xs uppercase tracking-[0.15em] text-teal-300">{tx(idioma, "Resumo do pedido", "Order summary", "Resumen del pedido")}</h2>
            <ul className="mt-3 space-y-3">
              {itens.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{nomeDoProduto(i.tipo, idioma)}</p>
                    <p className="text-sm text-mist/70">{nomeDoLote(i.loteNome, idioma)}</p>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-gold-300">{formatarPreco(i.valorCentavos, idioma)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-end justify-between gap-4 border-t border-white/10 pt-3">
              <p className="text-xs text-mist/60">{pedido.nome} · {pedido.email}</p>
              <p className="text-gold-metal whitespace-nowrap text-2xl font-extrabold">{formatarPreco(totalCentavos, idioma)}</p>
            </div>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-mist/60">
              {tx(idioma, `Sua vaga fica reservada até ${reservaAte}.`, `Your spot is held until ${reservaAte}.`, `Tu lugar queda reservado hasta las ${reservaAte}.`)}
            </p>
          </section>

          <CheckoutSimulado preferencia={preference} valorCentavos={totalCentavos} />

          <p className="text-center text-xs text-mist/50">
            {tx(
              idioma,
              "Pagamento processado pelo Mercado Pago. Os dados do cartão são digitados na página do Mercado Pago e nunca passam pelo nosso site.",
              "Payment processed by Mercado Pago. Card details are entered on Mercado Pago's page and never pass through our site.",
              "Pago procesado por Mercado Pago. Los datos de la tarjeta se ingresan en la página de Mercado Pago y nunca pasan por nuestro sitio.",
            )}
          </p>
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
