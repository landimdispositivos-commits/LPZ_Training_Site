import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { obterSessao } from "@/modules/auth/sessao";
import { liberarReservasVencidas, pedidosDoClienteComEntrega } from "@/modules/bar/online";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Meus pedidos do Bar — LPZ Training" };

const T = traducoes(
  {
    titulo: "Meus pedidos do Bar",
    vazio: "Você ainda não fez pedidos no Bar.",
    voltar: "Voltar ao cardápio",
    pagamento: { pendente: "Aguardando pagamento", pago: "Pago", expirado: "Expirado", cancelado: "Cancelado", estornado: "Estornado", precisa_estorno: "Pago — será devolvido" } as Record<string, string>,
    entregue: "Entregue",
    parcial: (r: number, t: number) => `Retirada parcial: ${r} de ${t} retirados. Ainda há produtos disponíveis`,
    disponivel: (t: number) => `Aguardando retirada: ${t} ${t === 1 ? "produto disponível" : "produtos disponíveis"} no balcão`,
  },
  {
    titulo: "My Bar orders",
    vazio: "You haven't placed any Bar orders yet.",
    voltar: "Back to the menu",
    pagamento: { pendente: "Awaiting payment", pago: "Paid", expirado: "Expired", cancelado: "Cancelled", estornado: "Refunded", precisa_estorno: "Paid — will be refunded" } as Record<string, string>,
    entregue: "Delivered",
    parcial: (r: number, t: number) => `Partially picked up: ${r} of ${t}. Items still available`,
    disponivel: (t: number) => `Ready for pickup: ${t} ${t === 1 ? "item" : "items"} at the counter`,
  },
  {
    titulo: "Mis pedidos del Bar",
    vazio: "Aún no hiciste pedidos en el Bar.",
    voltar: "Volver a la carta",
    pagamento: { pendente: "Esperando pago", pago: "Pagado", expirado: "Vencido", cancelado: "Cancelado", estornado: "Reembolsado", precisa_estorno: "Pagado — será devuelto" } as Record<string, string>,
    entregue: "Entregado",
    parcial: (r: number, t: number) => `Retiro parcial: ${r} de ${t} retirados. Aún hay productos disponibles`,
    disponivel: (t: number) => `Listo para retirar: ${t} ${t === 1 ? "producto disponible" : "productos disponibles"} en el mostrador`,
  },
);

const verde = "bg-teal-400/20 text-teal-200";
const dourado = "bg-gold-400/20 text-gold-300";
const laranja = "bg-ember-500/15 text-ember-400";
const neutro = "bg-white/10 text-mist/80";

export default async function Page() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const idioma = await obterIdioma();
  const t = T[idioma];
  await liberarReservasVencidas();
  const pedidos = await pedidosDoClienteComEntrega(sessao.user.id);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal">{t.titulo}</h1>
            <Link href="/bar" className="text-sm text-teal-300 hover:underline">{t.voltar}</Link>
          </div>
          {pedidos.length === 0 ? (
            <p className="text-sm text-mist/70">{t.vazio}</p>
          ) : (
            <ul className="space-y-3">
              {pedidos.map((p) => {
                const e = p.entrega;
                const pagoOk = p.status === "pago";
                const entregue = pagoOk && e && (e.ticket === "entregue" || (e.total > 0 && e.retirados >= e.total));
                const parcial = pagoOk && e && !entregue && e.retirados > 0;
                const disponivel = pagoOk && e && !entregue && !parcial;
                return (
                  <li key={p.id}>
                    <Link href={`/bar/pedido/${p.id}`} className="block space-y-2 rounded-2xl border border-white/10 bg-petrol-900/80 p-4 hover:border-gold-500/60">
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pagoOk ? verde : p.status === "pendente" ? dourado : p.status === "precisa_estorno" ? laranja : neutro}`}>
                            {t.pagamento[p.status] ?? p.status}
                          </span>
                          {entregue && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verde}`}>✓ {t.entregue}</span>}
                        </span>
                        <span className="font-semibold text-gold-300">{formatarPreco(p.totalCentavos, idioma)}</span>
                      </span>
                      {parcial && e && <span className={`block rounded-lg px-3 py-2 text-xs font-semibold ${dourado}`}>{t.parcial(e.retirados, e.total)}</span>}
                      {disponivel && e && <span className={`block rounded-lg px-3 py-2 text-xs font-semibold ${dourado}`}>{t.disponivel(e.total)}</span>}
                      <span className="block text-xs text-mist/60">{formatarDataHora(p.criadoEm, idioma)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
