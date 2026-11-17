import type { Metadata } from "next";
import Link from "next/link";
import { obterSessao } from "@/modules/auth/sessao";
import { MENSAGENS_ERRO_COMPRA, MINUTOS_RESERVA, situacaoDoComprador, vitrine } from "@/modules/ingressos";
import { formatarPreco } from "@/lib/formatar";
import { Aviso, classeBotao } from "../_components/form-ui";
import { SiteHeader } from "../_components/site-header";
import { comprarAction, desistirAction, retomarPagamentoAction } from "./actions";

export const metadata: Metadata = { title: "Ingressos — LPZ Training" };
export const dynamic = "force-dynamic";

const classeBotaoSecundario =
  "w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10";

export default async function Page(props: PageProps<"/ingressos">) {
  const { erro, cancelado } = await props.searchParams;
  const sessao = await obterSessao();
  const user = sessao?.user;
  const congressista = user?.papel === "congressista";

  const [itens, situacao] = await Promise.all([
    vitrine(),
    congressista && user ? situacaoDoComprador(user.email) : Promise.resolve(null),
  ]);
  const mensagemErro =
    typeof erro === "string" && erro in MENSAGENS_ERRO_COMPRA
      ? MENSAGENS_ERRO_COMPRA[erro as keyof typeof MENSAGENS_ERRO_COMPRA]
      : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            Ingressos
          </h1>

          {mensagemErro && <Aviso tipo="erro">{mensagemErro}</Aviso>}
          {cancelado && <Aviso tipo="ok">Pedido cancelado. A vaga voltou para o lote.</Aviso>}

          {!user && (
            <div className="mx-auto max-w-md space-y-3 text-center">
              <p className="text-sm text-mist/80">Para comprar, entre na sua conta ou faça um cadastro rápido.</p>
              <Link href="/congressistas" className={`${classeBotao} inline-block`}>
                Cadastre-se ou faça login
              </Link>
            </div>
          )}
          {user && !congressista && <Aviso tipo="erro">A compra é feita pela conta de congressista.</Aviso>}

          {itens.length === 0 ? (
            <p className="text-center text-mist/80">Vendas ainda não abertas. Volte em breve.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((item) => {
                const minha = situacao?.[item.tipo];
                return (
                  <li key={item.tipo} className="flex flex-col rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 text-center">
                    <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{item.produto.nome}</p>
                    {item.lote ? (
                      <>
                        <p className="mt-1 text-sm text-teal-300">{item.lote.nome}</p>
                        <p className="text-gold-metal mt-1 text-3xl font-extrabold">{formatarPreco(item.lote.precoCentavos)}</p>
                        <p className="mt-2 text-xs text-mist/60">
                          Restam {item.lote.quantidadeTotal - item.lote.quantidadeVendida} vagas neste lote.
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-mist/80">Esgotado. O próximo lote abre em breve.</p>
                    )}

                    <div className="mt-auto space-y-2 pt-5">
                      {congressista && minha?.pago ? (
                        <Link href="/congressistas/minha-area" className={`${classeBotao} inline-block`}>
                          Comprado — ver na minha área
                        </Link>
                      ) : congressista && minha?.pendente ? (
                        <>
                          <form action={retomarPagamentoAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className={classeBotao}>Continuar pagamento</button>
                          </form>
                          <form action={desistirAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className={classeBotaoSecundario}>Desistir</button>
                          </form>
                        </>
                      ) : congressista && item.lote ? (
                        <form action={comprarAction}>
                          <input type="hidden" name="tipo" value={item.tipo} />
                          <button type="submit" className={classeBotao}>Comprar</button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs text-mist/60">
            Pagamento processado pelo Mercado Pago — os dados do seu cartão não passam pelo nosso site. A vaga fica
            reservada por {MINUTOS_RESERVA} minutos enquanto você paga.
          </p>
        </div>
      </main>
    </>
  );
}
