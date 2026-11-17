import type { Metadata } from "next";
import Link from "next/link";
import { obterSessao } from "@/modules/auth/sessao";
import {
  haLoteEsgotado,
  loteVigente,
  MENSAGENS_ERRO_COMPRA,
  MINUTOS_RESERVA,
  situacaoDoComprador,
} from "@/modules/ingressos";
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

  const [lote, situacao] = await Promise.all([
    loteVigente(),
    congressista && user ? situacaoDoComprador(user.email) : Promise.resolve(null),
  ]);
  const esgotado = !lote && (await haLoteEsgotado());
  const mensagemErro = typeof erro === "string" && erro in MENSAGENS_ERRO_COMPRA
    ? MENSAGENS_ERRO_COMPRA[erro as keyof typeof MENSAGENS_ERRO_COMPRA]
    : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md space-y-6">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            Ingressos
          </h1>

          {mensagemErro && <Aviso tipo="erro">{mensagemErro}</Aviso>}
          {cancelado && <Aviso tipo="ok">Pedido cancelado. A vaga voltou para o lote.</Aviso>}

          <section className="rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 text-center">
            {lote ? (
              <>
                <p className="text-sm font-medium text-teal-300">{lote.nome}</p>
                <p className="text-gold-metal mt-1 text-4xl font-extrabold">{formatarPreco(lote.precoCentavos)}</p>
                <p className="mt-3 text-sm text-mist/70">
                  Ingresso individual para os três dias do LPZ Training. Restam{" "}
                  {lote.quantidadeTotal - lote.quantidadeVendida} vagas neste lote.
                </p>
              </>
            ) : (
              <p className="text-mist/80">
                {esgotado ? "Lote esgotado! Fique de olho: o próximo lote abre em breve." : "Vendas ainda não abertas. Volte em breve."}
              </p>
            )}
          </section>

          <Acoes
            logado={Boolean(user)}
            congressista={congressista}
            temLote={Boolean(lote)}
            situacao={situacao}
          />

          <p className="text-center text-xs text-mist/60">
            Pagamento processado pelo Mercado Pago — os dados do seu cartão não passam pelo nosso site. A vaga fica
            reservada por {MINUTOS_RESERVA} minutos enquanto você paga.
          </p>
        </div>
      </main>
    </>
  );
}

function Acoes({
  logado,
  congressista,
  temLote,
  situacao,
}: {
  logado: boolean;
  congressista: boolean;
  temLote: boolean;
  situacao: Awaited<ReturnType<typeof situacaoDoComprador>> | null;
}) {
  if (!logado) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-mist/80">Para comprar, entre na sua conta de congressista ou faça um cadastro rápido.</p>
        <Link href="/congressistas" className={`${classeBotao} inline-block`}>
          Entrar ou cadastrar
        </Link>
      </div>
    );
  }
  if (!congressista) {
    return <Aviso tipo="erro">A compra de ingressos é feita pela conta de congressista.</Aviso>;
  }
  if (situacao?.pago) {
    return (
      <div className="space-y-3 text-center">
        <Aviso tipo="ok">Seu ingresso está confirmado!</Aviso>
        <Link href="/congressistas/minha-area" className={`${classeBotao} inline-block`}>
          Ver meu ingresso
        </Link>
      </div>
    );
  }
  if (situacao?.pendente) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm text-mist/80">Você tem um pedido aguardando pagamento.</p>
        <form action={retomarPagamentoAction}>
          <input type="hidden" name="pedidoId" value={situacao.pendente.id} />
          <button type="submit" className={classeBotao}>Continuar pagamento</button>
        </form>
        <form action={desistirAction}>
          <input type="hidden" name="pedidoId" value={situacao.pendente.id} />
          <button type="submit" className={classeBotaoSecundario}>Desistir deste pedido</button>
        </form>
      </div>
    );
  }
  if (!temLote) return null;
  return (
    <form action={comprarAction}>
      <button type="submit" className={classeBotao}>Comprar ingresso</button>
    </form>
  );
}
