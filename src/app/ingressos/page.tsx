import type { Metadata } from "next";
import Link from "next/link";
import { obterSessao } from "@/modules/auth/sessao";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { MENSAGENS_ERRO_COMPRA, MINUTOS_RESERVA, nomeDoProduto, situacaoDoComprador, vitrine } from "@/modules/ingressos";
import { formatarPreco } from "@/lib/formatar";
import { Aviso, classeBotao } from "../_components/form-ui";
import { SiteHeader } from "../_components/site-header";
import { comprarAction, desistirAction, retomarPagamentoAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obterIdioma()) === "en" ? "Tickets — LPZ Training" : "Ingressos — LPZ Training" };
}

const ERROS_EN: Record<keyof typeof MENSAGENS_ERRO_COMPRA, string> = {
  "sem-lote": "There is no ticket batch on sale right now.",
  esgotado: "This batch is sold out. Refresh the page to see if a new batch has opened.",
  "ja-tem-ingresso": "You have already bought this product. It is in your area.",
  "pedido-invalido": "Order not found.",
  pagamento: "We could not open the payment right now. Please try again in a few minutes.",
};

const TEXTOS = traducoes(
  {
    titulo: "Ingressos",
    cancelado: "Pedido cancelado. A vaga voltou para o lote.",
    paraComprar: "Para comprar, entre na sua conta ou faça um cadastro rápido.",
    cadastreLogin: "Cadastre-se ou faça login",
    soCongressista: "A compra é feita pela conta de congressista.",
    naoAbertas: "Vendas ainda não abertas. Volte em breve.",
    restam: (n: number) => `Restam ${n} vagas neste lote.`,
    esgotado: "Esgotado. O próximo lote abre em breve.",
    comprado: "Comprado — ver na minha área",
    continuar: "Continuar pagamento",
    desistir: "Desistir",
    comprar: "Comprar",
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
    restam: (n: number) => `${n} spots left in this batch.`,
    esgotado: "Sold out. The next batch opens soon.",
    comprado: "Purchased — see it in my area",
    continuar: "Continue payment",
    desistir: "Cancel",
    comprar: "Buy",
    rodape: (min: number) =>
      `Payment processed by Mercado Pago — your card details never pass through our site. Your spot is held for ${min} minutes while you pay.`,
  },
);
export const dynamic = "force-dynamic";

const classeBotaoSecundario =
  "w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10";

export default async function Page(props: PageProps<"/ingressos">) {
  const { erro, cancelado } = await props.searchParams;
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
      ? (idioma === "en" ? ERROS_EN : MENSAGENS_ERRO_COMPRA)[erro as keyof typeof MENSAGENS_ERRO_COMPRA]
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

          {!user && (
            <div className="mx-auto max-w-md space-y-3 text-center">
              <p className="text-sm text-mist/80">{t.paraComprar}</p>
              <Link href="/congressistas" className={`${classeBotao} inline-block`}>
                {t.cadastreLogin}
              </Link>
            </div>
          )}
          {user && !congressista && <Aviso tipo="erro">{t.soCongressista}</Aviso>}

          {itens.length === 0 ? (
            <p className="text-center text-mist/80">{t.naoAbertas}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((item) => {
                const minha = situacao?.[item.tipo];
                return (
                  <li key={item.tipo} className="flex flex-col rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 text-center">
                    <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{nomeDoProduto(item.tipo, idioma)}</p>
                    {item.lote ? (
                      <>
                        <p className="mt-1 text-sm text-teal-300">{item.lote.nome}</p>
                        <p className="text-gold-metal mt-1 text-3xl font-extrabold">{formatarPreco(item.lote.precoCentavos, idioma)}</p>
                        <p className="mt-2 text-xs text-mist/60">
                          {t.restam(item.lote.quantidadeTotal - item.lote.quantidadeVendida)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-mist/80">{t.esgotado}</p>
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
                        <form action={comprarAction}>
                          <input type="hidden" name="tipo" value={item.tipo} />
                          <button type="submit" className={classeBotao}>{t.comprar}</button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs text-mist/60">
            {t.rodape(MINUTOS_RESERVA)}
          </p>
        </div>
      </main>
    </>
  );
}
