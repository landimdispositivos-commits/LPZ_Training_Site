import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { lotes, pedidos, presencas } from "@/db/schema";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { obterSessao } from "@/modules/auth/sessao";
import { nomeDoLote, nomeDoProduto, prazoParaCancelar } from "@/modules/ingressos";
import { Aviso } from "../../../_components/form-ui";
import { PaginaPublica } from "../../../_components/pagina-publica";
import { SiteHeader } from "../../../_components/site-header";
import { cancelarCompraAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Cancelar compra — LPZ Training", "Cancel purchase — LPZ Training", "Cancelar compra — LPZ Training") };
}

const TEXTOS = traducoes(
  {
    titulo: "Cancelar compra",
    vaiCancelar: "Você vai cancelar:",
    efeitos: [
      "O ingresso/QR deste item deixa de valer na hora.",
      "Seus outros itens continuam válidos.",
      "O estorno é feito pela mesma forma de pagamento, depois da conferência da organização. Você recebe e-mails de confirmação.",
    ],
    confirmo: "Entendi e quero cancelar este item.",
    cancelar: "Confirmar cancelamento",
    voltar: "Voltar sem cancelar",
    prazo: (d: string) => `Prazo para cancelar: até ${d}.`,
    erros: {
      confirmar: "Marque a caixa de confirmação para cancelar.",
      prazo: "O prazo de 7 dias para cancelar terminou. Fale com a organização pelo Fale conosco.",
      usado: "Este item já foi usado no evento e não pode ser cancelado.",
      "ja-cancelado": "Este item já foi cancelado.",
      "nao-pago": "Só é possível cancelar compras pagas.",
      "nao-encontrado": "Compra não encontrada.",
      falha: "Não foi possível cancelar agora. Tente de novo em alguns minutos.",
    } as Record<string, string>,
    naoPode: "Este item não pode mais ser cancelado por aqui. Fale com a organização pelo Fale conosco.",
  },
  {
    titulo: "Cancel purchase",
    vaiCancelar: "You are about to cancel:",
    efeitos: [
      "The ticket/QR code for this item stops working immediately.",
      "Your other items remain valid.",
      "The refund goes back to the same payment method after the organizers review it. You will get confirmation emails.",
    ],
    confirmo: "I understand and want to cancel this item.",
    cancelar: "Confirm cancellation",
    voltar: "Go back without cancelling",
    prazo: (d: string) => `Deadline to cancel: ${d}.`,
    erros: {
      confirmar: "Tick the confirmation box to cancel.",
      prazo: "The 7-day cancellation period is over. Please use Contact us.",
      usado: "This item was already used at the event and cannot be cancelled.",
      "ja-cancelado": "This item was already cancelled.",
      "nao-pago": "Only paid purchases can be cancelled.",
      "nao-encontrado": "Purchase not found.",
      falha: "We could not cancel right now. Please try again in a few minutes.",
    } as Record<string, string>,
    naoPode: "This item can no longer be cancelled here. Please use Contact us.",
  },
  {
    titulo: "Cancelar compra",
    vaiCancelar: "Vas a cancelar:",
    efeitos: [
      "La entrada/QR de este artículo deja de valer de inmediato.",
      "Tus otros artículos siguen válidos.",
      "El reembolso se hace por el mismo medio de pago, después de la revisión de la organización. Recibirás correos de confirmación.",
    ],
    confirmo: "Entiendo y quiero cancelar este artículo.",
    cancelar: "Confirmar cancelación",
    voltar: "Volver sin cancelar",
    prazo: (d: string) => `Plazo para cancelar: hasta el ${d}.`,
    erros: {
      confirmar: "Marca la casilla de confirmación para cancelar.",
      prazo: "El plazo de 7 días para cancelar terminó. Usa Contáctanos.",
      usado: "Este artículo ya se usó en el evento y no se puede cancelar.",
      "ja-cancelado": "Este artículo ya fue cancelado.",
      "nao-pago": "Solo se pueden cancelar compras pagadas.",
      "nao-encontrado": "Compra no encontrada.",
      falha: "No pudimos cancelar ahora. Inténtalo de nuevo en unos minutos.",
    } as Record<string, string>,
    naoPode: "Este artículo ya no se puede cancelar por aquí. Usa Contáctanos.",
  },
);

export default async function Page(props: PageProps<"/congressistas/cancelar/[id]">) {
  const sessao = await obterSessao();
  const { id } = await props.params;
  if (!sessao) redirect(`/congressistas?proximo=${encodeURIComponent(`/congressistas/cancelar/${id}`)}`);
  const pedidoId = z.uuid().safeParse(id);
  if (!pedidoId.success) notFound();

  // Só o dono vê a própria compra.
  const [p] = await db
    .select({
      id: pedidos.id,
      status: pedidos.status,
      valorCentavos: pedidos.valorCentavos,
      pagoEm: pedidos.pagoEm,
      atualizadoEm: pedidos.atualizadoEm,
      tipo: lotes.tipo,
      loteNome: lotes.nome,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(and(eq(pedidos.id, pedidoId.data), eq(pedidos.email, sessao.user.email)))
    .limit(1);
  if (!p) notFound();

  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const { erro } = await props.searchParams;
  const usado = await db.query.presencas.findFirst({ where: eq(presencas.pedidoId, p.id) });
  const prazo = prazoParaCancelar(p);
  const pode = p.status === "pago" && !usado && Date.now() <= prazo.getTime();

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} largura="max-w-lg">
        {typeof erro === "string" && t.erros[erro] && <Aviso tipo="erro">{t.erros[erro]}</Aviso>}
        <section className="space-y-4 rounded-2xl border border-ember-500/40 bg-petrol-950/70 p-6">
          <p className="text-sm text-mist/80">{t.vaiCancelar}</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{nomeDoProduto(p.tipo, idioma)}</p>
              <p className="text-sm text-teal-300">{nomeDoLote(p.loteNome, idioma)}</p>
            </div>
            <p className="whitespace-nowrap font-semibold text-gold-300">{formatarPreco(p.valorCentavos, idioma)}</p>
          </div>
          {pode ? (
            <>
              <ul className="list-disc space-y-1 pl-5 text-sm text-mist/80">
                {t.efeitos.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="text-xs text-mist/60">{t.prazo(formatarDataHora(prazo, idioma))}</p>
              <form action={cancelarCompraAction} className="space-y-4">
                <input type="hidden" name="pedidoId" value={p.id} />
                <label className="flex items-start gap-2 text-sm text-white">
                  <input type="checkbox" name="confirmo" required className="mt-1 h-4 w-4 accent-ember-500" />
                  {t.confirmo}
                </label>
                <button
                  type="submit"
                  className="w-full rounded-full bg-ember-500 px-6 py-3 font-semibold text-white hover:brightness-110"
                >
                  {t.cancelar}
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-ember-400">{t.naoPode}</p>
          )}
        </section>
        <p className="mt-6 text-center">
          <Link href="/congressistas/minha-area" className="inline-block rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">{t.voltar}</Link>
        </p>
      </PaginaPublica>
    </>
  );
}
