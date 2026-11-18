import type { Metadata } from "next";
import Link from "next/link";
import { urlLoginParaComprar } from "@/modules/auth/proximo";
import { obterSessao } from "@/modules/auth/sessao";
import { nomeDoLote, TIPOS_PRODUTO, type TipoProduto } from "@/modules/ingressos/produtos";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { MENSAGENS_ERRO_COMPRA, MINUTOS_RESERVA, nomeDoProduto, situacaoDoComprador, vitrine } from "@/modules/ingressos";
import { formatarPreco } from "@/lib/formatar";
import { Aviso, classeBotao } from "../_components/form-ui";
import { RodapeSite } from "../_components/rodape-site";
import { AutoComprar } from "./auto-comprar";
import { SiteHeader } from "../_components/site-header";
import { comprarAction, desistirAction, retomarPagamentoAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Ingressos — LPZ Training", "Tickets — LPZ Training", "Entradas — LPZ Training") };
}

const ERROS_EN: Record<keyof typeof MENSAGENS_ERRO_COMPRA, string> = {
  "sem-lote": "There is no ticket batch on sale right now.",
  esgotado: "This batch is sold out. Refresh the page to see if a new batch has opened.",
  "ja-tem-ingresso": "You have already bought this product. It is in your area.",
  "pedido-invalido": "Order not found.",
  pagamento: "We could not open the payment right now. Please try again in a few minutes.",
};

const ERROS_ES: Record<keyof typeof MENSAGENS_ERRO_COMPRA, string> = {
  "sem-lote": "No hay ningún lote a la venta en este momento.",
  esgotado: "Este lote se agotó. Recarga la página para ver si abrió un nuevo lote.",
  "ja-tem-ingresso": "Ya compraste este producto. Está en tu área.",
  "pedido-invalido": "Pedido no encontrado.",
  pagamento: "No pudimos abrir el pago ahora. Inténtalo de nuevo en unos minutos.",
};

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
    escolheu: (nome: string) => `Você escolheu ${nome}. Levando você para o pagamento…`,
    aguardando: "Recebemos seu pedido e o pagamento está em processamento (o Pix pode levar alguns minutos). Assim que for aprovado, você recebe um e-mail de confirmação.",
    meios: "Pix, cartão de crédito, cartão de débito virtual Caixa ou saldo do Mercado Pago.",
    rodape: (min: number) =>
      `Pagamento processado pelo Mercado Pago — os dados do seu cartão não passam pelo nosso site. A vaga fica reservada por ${min} minutos enquanto você paga.`,
    politica:
      "Os pacotes são pessoais e intransferíveis. O reembolso só é possível se você desistir em até 7 dias após a compra, conforme o direito de arrependimento do Código de Defesa do Consumidor (art. 49). Em caso de não comparecimento, o pacote não pode ser transferido para a edição do ano seguinte.",
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
    escolheu: (nome: string) => `You chose ${nome}. Taking you to payment…`,
    aguardando: "We received your order and the payment is being processed (Pix may take a few minutes). As soon as it is approved, you will receive a confirmation email.",
    meios: "Pix, credit card, Caixa virtual debit card or Mercado Pago balance.",
    rodape: (min: number) =>
      `Payment processed by Mercado Pago — your card details never pass through our site. Your spot is held for ${min} minutes while you pay.`,
    politica:
      "Packages are personal and non-transferable. Refunds are only available if you cancel within 7 days of purchase, under the right of withdrawal in the Brazilian Consumer Protection Code (art. 49). If you do not attend, the package cannot be carried over to next year's edition.",
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
    escolheu: (nome: string) => `Elegiste ${nome}. Llevándote al pago…`,
    aguardando: "Recibimos tu pedido y el pago se está procesando (el Pix puede tardar unos minutos). En cuanto se apruebe, recibirás un correo de confirmación.",
    meios: "Pix, tarjeta de crédito, tarjeta de débito virtual Caixa o saldo de Mercado Pago.",
    rodape: (min: number) =>
      `Pago procesado por Mercado Pago — los datos de tu tarjeta nunca pasan por nuestro sitio. Tu lugar queda reservado ${min} minutos mientras pagas.`,
    politica:
      "Los paquetes son personales e intransferibles. El reembolso solo es posible si desistes dentro de los 7 días posteriores a la compra, conforme al derecho de arrepentimiento del Código de Defensa del Consumidor de Brasil (art. 49). Si no asistes, el paquete no puede transferirse a la edición del año siguiente.",
  },
);
export const dynamic = "force-dynamic";

const classeBotaoSecundario =
  "w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10";

export default async function Page(props: PageProps<"/ingressos">) {
  const { erro, cancelado, comprar, aguardando } = await props.searchParams;
  const escolhido = TIPOS_PRODUTO.includes(comprar as TipoProduto) ? (comprar as TipoProduto) : null;
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const sessao = await obterSessao();
  const user = sessao?.user;
  const congressista = user?.papel === "congressista";

  const [itens, situacao] = await Promise.all([
    vitrine(),
    congressista && user ? situacaoDoComprador(user.email) : Promise.resolve(null),
  ]);
  const mensagemErro =
    typeof erro === "string" && erro in MENSAGENS_ERRO_COMPRA
      ? tx(idioma, MENSAGENS_ERRO_COMPRA, ERROS_EN, ERROS_ES)[erro as keyof typeof MENSAGENS_ERRO_COMPRA]
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
                  <li
                    key={item.tipo}
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
                          <form action={retomarPagamentoAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className={classeBotao}>{t.continuar}</button>
                          </form>
                          <form action={desistirAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className={classeBotaoSecundario}>{t.desistir}</button>
                          </form>
                        </>
                      ) : congressista && item.lote ? (
                        <form id={`comprar-${item.tipo}`} action={comprarAction}>
                          <input type="hidden" name="tipo" value={item.tipo} />
                          {escolhido === item.tipo && user?.cadastroCompletoEm && (
                            <AutoComprar formId={`comprar-${item.tipo}`} tipo={item.tipo} />
                          )}
                          <button type="submit" className={classeBotao}>{t.comprar}</button>
                        </form>
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
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs text-mist/60">
            {t.meios} {t.rodape(MINUTOS_RESERVA)}
          </p>
          <p className="mx-auto max-w-2xl rounded-lg border border-gold-500/30 bg-petrol-900/60 px-4 py-3 text-center text-xs text-mist/80">
            {t.politica}
          </p>
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
