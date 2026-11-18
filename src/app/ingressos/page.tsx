import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { urlLoginParaComprar } from "@/modules/auth/proximo";
import { obterSessao } from "@/modules/auth/sessao";
import { nomeDoLote, TIPOS_PRODUTO, type TipoProduto } from "@/modules/ingressos/produtos";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { MENSAGENS_ERRO_COMPRA, MINUTOS_RESERVA, nomeDoProduto, sacolaDoComprador, situacaoDoComprador, vitrine } from "@/modules/ingressos";
import { formatarPreco } from "@/lib/formatar";
import { Aviso, classeBotao } from "../_components/form-ui";
import { RodapeSite } from "../_components/rodape-site";
import { POLITICA_COMPRA } from "@/modules/ingressos/politica";
import { mensagemErroCompra } from "./erros";
import { AutoComprar } from "./auto-comprar";
import { SiteHeader } from "../_components/site-header";
import { adicionarSacolaAction, comprarAction, removerDaSacolaAction, retomarPagamentoAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Ingressos — LPZ Training", "Tickets — LPZ Training", "Entradas — LPZ Training") };
}

const TEXTOS = traducoes(
  {
    titulo: "Ingressos",
    cancelado: "Pedido cancelado. A vaga voltou para o lote.",
    paraComprar: "Para comprar, entre na sua conta ou faça um cadastro rápido.",
    cadastreLogin: "Cadastre-se ou faça login",
    soCongressista: "A compra é feita pela conta de congressista.",
    naoAbertas: "Vendas ainda não abertas. Volte em breve.",
    esgotado: "Esgotado. O próximo lote abre em breve.",
    emBreve: "Valor e vendas em breve.",
    comprado: "Comprado — ver na minha área",
    continuar: "Continuar pagamento",
    desistir: "Desistir",
    comprar: "Ir para o pagamento",
    comprarVisitante: "Comprar",
    novidade: "Novidade em breve",
    naSacola: "✓ Na sacola",
    adicionar: "Adicionar à sacola",
    comprarAgora: "Comprar só este agora",
    pagarItem: "Pagar só este agora",
    remover: "Remover da sacola",
    adicionado: (nome: string) => `${nome} foi para a sacola. Continue escolhendo ou vá para o pagamento.`,
    sacola: (n: number, total: string) => `Sacola: ${n} ${n === 1 ? "item" : "itens"} · ${total}`,
    verSacola: "Ver sacola e pagar",
    escolheu: (nome: string) => `Você escolheu ${nome}. Levando você para o pagamento…`,
    aguardando: "Recebemos seu pedido e o pagamento está em processamento (o Pix pode levar alguns minutos). Assim que for aprovado, você recebe um e-mail de confirmação.",
    meios: "Pix, cartão de crédito, cartão de débito virtual Caixa ou saldo do Mercado Pago.",
    rodape: (min: number) =>
      `Pagamento processado pelo Mercado Pago — os dados do seu cartão não passam pelo nosso site. A vaga fica reservada por ${min} minutos enquanto você paga.`,
  },
  {
    titulo: "Tickets",
    cancelado: "Order cancelled. The spot went back to the batch.",
    paraComprar: "To buy, sign in to your account or create one quickly.",
    cadastreLogin: "Sign up or log in",
    soCongressista: "Purchases are made with an attendee account.",
    naoAbertas: "Sales are not open yet. Come back soon.",
    esgotado: "Sold out. The next batch opens soon.",
    emBreve: "Price and sales coming soon.",
    comprado: "Purchased — see it in my area",
    continuar: "Continue payment",
    desistir: "Cancel",
    comprar: "Go to payment",
    comprarVisitante: "Buy",
    novidade: "Coming soon",
    naSacola: "✓ In your cart",
    adicionar: "Add to cart",
    comprarAgora: "Buy just this one now",
    pagarItem: "Pay just this one now",
    remover: "Remove from cart",
    adicionado: (nome: string) => `${nome} was added to your cart. Keep choosing or go to payment.`,
    sacola: (n: number, total: string) => `Cart: ${n} ${n === 1 ? "item" : "items"} · ${total}`,
    verSacola: "View cart and pay",
    escolheu: (nome: string) => `You chose ${nome}. Taking you to payment…`,
    aguardando: "We received your order and the payment is being processed (Pix may take a few minutes). As soon as it is approved, you will receive a confirmation email.",
    meios: "Pix, credit card, Caixa virtual debit card or Mercado Pago balance.",
    rodape: (min: number) =>
      `Payment processed by Mercado Pago — your card details never pass through our site. Your spot is held for ${min} minutes while you pay.`,
  },
  {
    titulo: "Entradas",
    cancelado: "Pedido cancelado. El lugar volvió al lote.",
    paraComprar: "Para comprar, entra en tu cuenta o regístrate rápidamente.",
    cadastreLogin: "Regístrate o inicia sesión",
    soCongressista: "La compra se hace con una cuenta de participante.",
    naoAbertas: "Las ventas aún no están abiertas. Vuelve pronto.",
    esgotado: "Agotado. El próximo lote abre pronto.",
    emBreve: "Precio y ventas próximamente.",
    comprado: "Comprado — ver en mi área",
    continuar: "Continuar el pago",
    desistir: "Desistir",
    comprar: "Ir al pago",
    comprarVisitante: "Comprar",
    novidade: "Próximamente",
    naSacola: "✓ En tu bolsa",
    adicionar: "Agregar a la bolsa",
    comprarAgora: "Comprar solo este ahora",
    pagarItem: "Pagar solo este ahora",
    remover: "Quitar de la bolsa",
    adicionado: (nome: string) => `${nome} se agregó a tu bolsa. Sigue eligiendo o ve al pago.`,
    sacola: (n: number, total: string) => `Bolsa: ${n} ${n === 1 ? "artículo" : "artículos"} · ${total}`,
    verSacola: "Ver bolsa y pagar",
    escolheu: (nome: string) => `Elegiste ${nome}. Llevándote al pago…`,
    aguardando: "Recibimos tu pedido y el pago se está procesando (el Pix puede tardar unos minutos). En cuanto se apruebe, recibirás un correo de confirmación.",
    meios: "Pix, tarjeta de crédito, tarjeta de débito virtual Caixa o saldo de Mercado Pago.",
    rodape: (min: number) =>
      `Pago procesado por Mercado Pago — los datos de tu tarjeta nunca pasan por nuestro sitio. Tu lugar queda reservado ${min} minutos mientras pagas.`,
  },
);
export const dynamic = "force-dynamic";

const classeBotaoSecundario =
  "w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10";

export default async function Page(props: PageProps<"/ingressos">) {
  const { erro, cancelado, comprar, aguardando, adicionado } = await props.searchParams;
  const tipoAdicionado = TIPOS_PRODUTO.includes(adicionado as TipoProduto) ? (adicionado as TipoProduto) : null;
  const escolhido = TIPOS_PRODUTO.includes(comprar as TipoProduto) ? (comprar as TipoProduto) : null;
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const sessao = await obterSessao();
  const user = sessao?.user;
  const congressista = user?.papel === "congressista";

  const [itens, situacao, sacola] = await Promise.all([
    vitrine(),
    congressista && user ? situacaoDoComprador(user.email) : Promise.resolve(null),
    congressista && user ? sacolaDoComprador(user.email) : Promise.resolve([]),
  ]);
  const mensagemErro =
    typeof erro === "string" && erro in MENSAGENS_ERRO_COMPRA
      ? mensagemErroCompra(erro as keyof typeof MENSAGENS_ERRO_COMPRA, idioma)
      : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            {t.titulo}
          </h1>

          {mensagemErro && <Aviso tipo="erro">{mensagemErro}</Aviso>}
          {cancelado && <Aviso tipo="ok">{t.cancelado}</Aviso>}
          {aguardando && <Aviso tipo="ok">{t.aguardando}</Aviso>}
          {tipoAdicionado && <Aviso tipo="ok">{t.adicionado(nomeDoProduto(tipoAdicionado, idioma))}</Aviso>}
          {sacola.length > 0 && (
            <div className="sticky top-2 z-20 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-400/60 bg-petrol-900/95 px-5 py-3 shadow-lg backdrop-blur">
              <p className="font-semibold text-white">
                {t.sacola(sacola.length, formatarPreco(sacola.reduce((s, i) => s + i.valorCentavos, 0), idioma))}
              </p>
              <Link href="/sacola" className="bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                {t.verSacola}
              </Link>
            </div>
          )}
          {escolhido && congressista && user?.cadastroCompletoEm && !situacao?.[escolhido]?.pago && (
            <Aviso tipo="ok">{t.escolheu(nomeDoProduto(escolhido, idioma))}</Aviso>
          )}

          {!user && (
            <div className="mx-auto max-w-md space-y-3 text-center">
              <p className="text-sm text-mist/80">{t.paraComprar}</p>
              <Link href="/congressistas" className={`${classeBotao} inline-block`}>
                {t.cadastreLogin}
              </Link>
            </div>
          )}
          {user && !congressista && <Aviso tipo="erro">{t.soCongressista}</Aviso>}

          {itens.every((i) => i.emBreve) ? (
            <p className="text-center text-mist/80">{t.naoAbertas}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((item) => {
                const minha = situacao?.[item.tipo];
                return (
                  <Fragment key={item.tipo}>
                  <li
                    className={`relative flex flex-col rounded-2xl border bg-petrol-950/70 p-6 text-center transition ${
                      escolhido === item.tipo
                        ? "border-gold-300 shadow-[0_0_30px_rgb(230_181_74/0.35)] ring-2 ring-gold-400"
                        : "border-gold-500/40"
                    } ${!user && item.lote ? "hover:border-gold-300 hover:shadow-[0_0_24px_rgb(230_181_74/0.25)]" : ""}`}
                  >
                    <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{nomeDoProduto(item.tipo, idioma)}</p>
                    {item.lote ? (
                      <>
                        <p className="mt-1 text-sm text-teal-300">{nomeDoLote(item.lote.nome, idioma)}</p>
                        <p className="text-gold-metal mt-1 text-3xl font-extrabold">{formatarPreco(item.lote.precoCentavos, idioma)}</p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-mist/80">{item.emBreve ? t.emBreve : t.esgotado}</p>
                    )}

                    <div className="mt-auto space-y-2 pt-5">
                      {congressista && minha?.pago ? (
                        <Link href="/congressistas/minha-area" className={`${classeBotao} inline-block`}>
                          {t.comprado}
                        </Link>
                      ) : congressista && minha?.pendente ? (
                        <>
                          <p className="font-semibold text-teal-300">{t.naSacola}</p>
                          <form action={retomarPagamentoAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className={classeBotaoSecundario}>{t.pagarItem}</button>
                          </form>
                          <form action={removerDaSacolaAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className="text-sm text-mist/70 underline-offset-2 hover:text-ember-400 hover:underline">
                              {t.remover}
                            </button>
                          </form>
                        </>
                      ) : congressista && item.lote ? (
                        <>
                          <form action={adicionarSacolaAction}>
                            <input type="hidden" name="tipo" value={item.tipo} />
                            <button type="submit" className={classeBotao}>{t.adicionar}</button>
                          </form>
                          <form id={`comprar-${item.tipo}`} action={comprarAction}>
                            <input type="hidden" name="tipo" value={item.tipo} />
                            {escolhido === item.tipo && user?.cadastroCompletoEm && (
                              <AutoComprar formId={`comprar-${item.tipo}`} tipo={item.tipo} />
                            )}
                            <button type="submit" className={classeBotaoSecundario}>{t.comprarAgora}</button>
                          </form>
                        </>
                      ) : !user && item.lote ? (
                        // A caixinha inteira é clicável: leva ao login e volta para esta compra.
                        <Link
                          href={urlLoginParaComprar(item.tipo)}
                          className={`${classeBotao} inline-block after:absolute after:inset-0 after:rounded-2xl after:content-['']`}
                        >
                          {t.comprarVisitante}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                  {item.tipo === "camiseta" && (
                    // Espaço reservado para o próximo produto (ainda sem definição).
                    <li
                      aria-label={t.novidade}
                      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/40 bg-petrol-950/40 p-6 text-center"
                    >
                      <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300/70">{t.novidade}</p>
                    </li>
                  )}
                  </Fragment>
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs text-mist/60">
            {t.meios} {t.rodape(MINUTOS_RESERVA)}
          </p>
          <p className="mx-auto max-w-2xl rounded-lg border border-gold-500/30 bg-petrol-900/60 px-4 py-3 text-center text-xs text-mist/80">
            {POLITICA_COMPRA[idioma]}
          </p>
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
