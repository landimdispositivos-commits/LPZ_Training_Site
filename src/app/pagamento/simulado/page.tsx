import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { lotes, pedidos } from "@/db/schema";
import { formatarPreco } from "@/lib/formatar";
import { obterSessao } from "@/modules/auth/sessao";
import { classeBotao } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { decidirPagamentoSimuladoAction } from "./actions";

export const metadata: Metadata = { title: "Pagamento simulado — LPZ Training" };

// Página de desenvolvimento (TEST_MODE): faz o papel da tela do Mercado Pago.
export default async function Page(props: PageProps<"/pagamento/simulado">) {
  if (process.env.TEST_MODE !== "true") notFound();

  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");

  const { preference } = await props.searchParams;
  if (typeof preference !== "string") notFound();

  const pedido = await db
    .select({ id: pedidos.id, status: pedidos.status, valorCentavos: pedidos.valorCentavos, loteNome: lotes.nome })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(eq(pedidos.gatewayPreferenceId, preference), eq(pedidos.email, sessao.user.email)))
    .then((r) => r[0]);
  if (!pedido) notFound();
  if (pedido.status !== "pendente") redirect("/ingressos");

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <p className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm">
            <strong>Modo de teste.</strong> Esta tela substitui o Mercado Pago enquanto a integração real não está
            ligada. Nenhum dinheiro é cobrado.
          </p>
          <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal">Pagamento simulado</h1>
          <div className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <p className="text-sm text-teal-300">{pedido.loteNome}</p>
            <p className="text-gold-metal mt-1 text-3xl font-extrabold">{formatarPreco(pedido.valorCentavos)}</p>
          </div>
          <form action={decidirPagamentoSimuladoAction} className="space-y-3">
            <input type="hidden" name="pedidoId" value={pedido.id} />
            <button type="submit" name="decisao" value="aprovar" className={classeBotao}>
              Aprovar pagamento
            </button>
            <button
              type="submit"
              name="decisao"
              value="recusar"
              className="w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10"
            >
              Recusar / desistir
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
