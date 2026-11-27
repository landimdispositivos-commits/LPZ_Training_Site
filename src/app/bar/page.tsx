import type { Metadata } from "next";
import Link from "next/link";
import { formatarPreco } from "@/lib/formatar";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { acessoBar } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { cardapioDoEvento, eventoEmAndamento } from "@/modules/bar";
import QRCode from "react-qr-code";
import { origemPublica } from "@/modules/bar/origem";
import { SiteHeader } from "../_components/site-header";
import { liberarReservasVencidas } from "@/modules/bar/online";
import { emModoVerComo } from "@/modules/auth/sessao";
import { CardapioCompra } from "./cardapio-compra";
import { paymentProvider } from "@/modules/pagamentos";

export const metadata: Metadata = { title: "Bar — LPZ Training" };

const TEXTOS = traducoes(
  {
    titulo: "Bar",
    sub: "Cardápio e preços. Peça e pague no caixa do evento.",
    semEvento: "O cardápio ainda não está disponível.",
    vazio: "Nenhum item no cardápio por enquanto.",
    esgotado: "Esgotado",
    semCategoria: "Outros",
    gestao: "Gestão do Bar",
  },
  {
    titulo: "Bar",
    sub: "Menu and prices. Order and pay at the event's cashier.",
    semEvento: "The menu is not available yet.",
    vazio: "No items on the menu for now.",
    esgotado: "Sold out",
    semCategoria: "Other",
    gestao: "Bar management",
  },
  {
    titulo: "Bar",
    sub: "Carta y precios. Pide y paga en la caja del evento.",
    semEvento: "La carta aún no está disponible.",
    vazio: "Por ahora no hay artículos en la carta.",
    esgotado: "Agotado",
    semCategoria: "Otros",
    gestao: "Gestión del Bar",
  },
);

// Cardápio ABERTO para todos (inclusive sem login): só produtos e preço de venda.
// Para comprar é preciso entrar; a sacola fica guardada neste aparelho.
export default async function Page() {
  const sessao = await obterSessao();
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const acesso = sessao ? acessoBar(sessao.user) : { gestao: false, admin: false, caixa: false, balcao: false };
  const urlCardapio = `${await origemPublica()}/bar`;

  await liberarReservasVencidas();
  const evento = await eventoEmAndamento();
  const itens = evento ? await cardapioDoEvento(evento.id) : [];
  // Compra pelo site: ligada por evento; no modo "ver como" a organização só visualiza.
  const compraOnline = Boolean(evento?.usaOnline) && !(sessao && emModoVerComo(sessao));
  const grupos = new Map<string, typeof itens>();
  for (const i of itens) {
    const chave = i.categoria ?? t.semCategoria;
    grupos.set(chave, [...(grupos.get(chave) ?? []), i]);
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_15rem]">
         <div className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">{t.titulo}</h1>
            <div className="flex flex-wrap gap-2">
              {(acesso.balcao || acesso.caixa) && evento?.usaComanda && (
                <Link href="/bar/comanda" className="bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                  Comandas
                </Link>
              )}
              {sessao && evento?.usaOnline && paymentProvider.suportaCartaoSalvo && (
                <Link href="/bar/cartoes" className="rounded-full border border-gold-500/60 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">
                  {idioma === "en" ? "My cards" : idioma === "es" ? "Mis tarjetas" : "Meus cartões"}
                </Link>
              )}
              {sessao && evento?.usaOnline && (
                <Link href="/bar/pedidos" className="rounded-full border border-gold-500/60 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">
                  {idioma === "en" ? "My orders" : idioma === "es" ? "Mis pedidos" : "Meus pedidos"}
                </Link>
              )}
              {acesso.caixa && (
                <Link href="/bar/caixa" className="bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                  Caixa
                </Link>
              )}
              {acesso.balcao && (
                <Link href="/bar/balcao" className="bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                  Balcão
                </Link>
              )}
              {(acesso.gestao || acesso.admin || acesso.caixa) && (
                <Link
                  href={acesso.gestao ? "/bar/gestao" : "/bar/gestao/produtos"}
                  className="bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink hover:brightness-110"
                >
                  {acesso.gestao ? t.gestao : acesso.admin ? "Cadastros do Bar" : "Produtos e vendas"}
                </Link>
              )}
            </div>
          </div>
          <p className="text-sm text-mist/80">
            {evento ? <><strong className="text-white">{evento.nome}</strong> · </> : null}
            {compraOnline
              ? idioma === "en"
                ? "Pick what you want, add to your bag and pay with Pix or card. You get a QR code to pick up at the bar."
                : idioma === "es"
                  ? "Elige lo que quieres, agrégalo a tu bolsa y paga con Pix o tarjeta. Recibes un código QR para retirar en el bar."
                  : "Escolha o que quer, adicione à sacola e pague com Pix ou cartão. Você recebe um QR code para retirar no bar."
              : t.sub}
          </p>

          {!evento ? (
            <p className="text-sm text-mist/70">{t.semEvento}</p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-mist/70">{t.vazio}</p>
          ) : compraOnline ? (
            <CardapioCompra itens={itens} eventoId={evento.id} semCategoria={t.semCategoria} logado={Boolean(sessao)} />
          ) : (
            [...grupos.entries()].map(([categoria, lista]) => (
              <section key={categoria} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{categoria}</h2>
                <ul className="mt-3 divide-y divide-white/10">
                  {lista.map((i) => (
                    <li key={i.id} className={`flex items-center justify-between gap-3 py-3 ${i.esgotado ? "opacity-60" : ""}`}>
                      <span className="min-w-0 text-white">
                        {i.nome}
                        {i.esgotado && <span className="ml-2 rounded-full bg-ember-500/15 px-2 py-0.5 text-xs font-semibold text-ember-400">{t.esgotado}</span>}
                      </span>
                      <span className="shrink-0 font-semibold text-gold-300">{formatarPreco(i.precoCentavos, idioma)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
         </div>

          {/* QR do cardápio: aparece para todos (inclusive sem login) no computador; no celular só a gestão vê. */}
          <aside className={`h-fit space-y-3 rounded-2xl border border-gold-500/40 bg-petrol-900/80 p-4 text-center lg:sticky lg:top-24 ${acesso.gestao ? "" : "hidden lg:block"}`}>
            <h2 className="font-display text-xs uppercase tracking-[0.15em] text-gold-300">
              {idioma === "en" ? "Menu on your phone" : idioma === "es" ? "Carta en tu celular" : "Cardápio no celular"}
            </h2>
            <div className="mx-auto inline-block rounded-xl bg-white p-3">
              <QRCode value={urlCardapio} size={150} aria-label={idioma === "en" ? "QR code for the bar menu" : idioma === "es" ? "Código QR de la carta del bar" : "QR code do cardápio do Bar"} />
            </div>
            <p className="text-xs text-mist/70">
              {idioma === "en"
                ? "Point your phone camera here to open this menu, see the prices and order."
                : idioma === "es"
                  ? "Apunta la cámara de tu celular aquí para abrir esta carta, ver los precios y pedir."
                  : "Aponte a câmera do celular aqui para abrir este cardápio, ver os preços e pedir."}
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/bar/qr?imprimir=1" className="bg-gold-metal rounded-full px-4 py-2 font-semibold text-gold-ink hover:brightness-110">
                {idioma === "en" ? "Print / save as PDF" : idioma === "es" ? "Imprimir / guardar PDF" : "Imprimir / salvar PDF"}
              </Link>
              {acesso.gestao && (
                <a href="/bar/qr/cardapio.svg" download="qr-cardapio-bar.svg" className="rounded-full border border-gold-500/60 px-4 py-2 font-semibold text-gold-300 hover:bg-gold-500/10">Baixar QR (SVG)</a>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
