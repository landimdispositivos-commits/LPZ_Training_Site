import Link from "next/link";
import { traducoes, type Idioma } from "@/i18n";
import { codigoCurto, infoProduto, nomeDoLote, nomeDoProduto, pedidosDoComprador, prazoParaCancelar } from "@/modules/ingressos";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { QrIngresso } from "./qr-ingresso";
import { agruparPorPedido, presencasDosPedidos } from "@/modules/presencas";
import { BotoesPresenca } from "@/app/_components/botoes-presenca";
import { urlDoQr } from "@/modules/ingressos/emails";
import { descreverPagamento } from "@/modules/pagamentos/formas";

const TEXTOS = traducoes(
  {
    semIngresso: "Você ainda não tem ingresso.",
    comprar: "Comprar ingresso ou pacote",
    pedidoEm: "pedido em",
    aguardando: "Aguardando pagamento.",
    continuar: "Continuar pagamento",
    camiseta: "Compra confirmada. Retire sua camiseta no evento mostrando o QR code.",
    massagem: "Compra confirmada. Mostre o QR code na hora da massagem.",
    presenca: "Presença registrada",
    servico: "Compra confirmada. A equipe entra em contato sobre o serviço.",
    jackAndJill: "Inscrição no Jack and Jill confirmada. A organização passa os detalhes da competição.",
    codigo: "Código do ingresso",
    mostre: "Mostre o QR code (ou o código) na entrada do evento.",
    entrada: (quando: string) => `Entrada registrada${quando ? ` em ${quando}` : ""}. Bom evento!`,
    cancelado: "Ingresso cancelado. Fale com a organização.",
    cancelarCompra: "Cancelar compra",
    cancelarAte: (d: string) => `Você pode cancelar até ${d} (direito de arrependimento, 7 dias).`,
    prazoEncerrado: (d: string) =>
      `Prazo de cancelamento encerrado em ${d}. Depois de 7 dias da compra não é mais possível cancelar este produto.`,
    canceladoPorVoce: (d: string) => `Cancelado por você em ${d}. O estorno está em análise pela organização.`,
    estornado: (d: string) => `Cancelado. Estorno realizado em ${d}.`,
  },
  {
    semIngresso: "You don't have a ticket yet.",
    comprar: "Buy a ticket or package",
    pedidoEm: "ordered on",
    aguardando: "Awaiting payment.",
    continuar: "Continue payment",
    camiseta: "Purchase confirmed. Pick up your T-shirt at the event by showing the QR code.",
    massagem: "Purchase confirmed. Show the QR code at your massage.",
    presenca: "Attendance recorded",
    servico: "Purchase confirmed. The team will contact you about the service.",
    jackAndJill: "Jack and Jill registration confirmed. The organizers will share the competition details.",
    codigo: "Ticket code",
    mostre: "Show the QR code (or the code) at the event entrance.",
    entrada: (quando: string) => `Entry recorded${quando ? ` on ${quando}` : ""}. Enjoy the event!`,
    cancelado: "Ticket cancelled. Please contact the organizers.",
    cancelarCompra: "Cancel purchase",
    cancelarAte: (d: string) => `You can cancel until ${d} (7-day right of withdrawal).`,
    prazoEncerrado: (d: string) =>
      `Cancellation period ended on ${d}. After 7 days from purchase this product can no longer be cancelled.`,
    canceladoPorVoce: (d: string) => `Cancelled by you on ${d}. The refund is being reviewed by the organizers.`,
    estornado: (d: string) => `Cancelled. Refund processed on ${d}.`,
  },
  {
    semIngresso: "Aún no tienes entrada.",
    comprar: "Comprar entrada o paquete",
    pedidoEm: "pedido el",
    aguardando: "Esperando el pago.",
    continuar: "Continuar el pago",
    camiseta: "Compra confirmada. Retira tu camiseta en el evento mostrando el código QR.",
    massagem: "Compra confirmada. Muestra el código QR en el momento del masaje.",
    presenca: "Asistencia registrada",
    servico: "Compra confirmada. El equipo se pondrá en contacto sobre el servicio.",
    jackAndJill: "Inscripción en el Jack and Jill confirmada. La organización compartirá los detalles de la competencia.",
    codigo: "Código de la entrada",
    mostre: "Muestra el código QR (o el código) en la entrada del evento.",
    entrada: (quando: string) => `Entrada registrada${quando ? ` el ${quando}` : ""}. ¡Buen evento!`,
    cancelado: "Entrada cancelada. Contacta a la organización.",
    cancelarCompra: "Cancelar compra",
    cancelarAte: (d: string) => `Puedes cancelar hasta el ${d} (derecho de arrepentimiento, 7 días).`,
    prazoEncerrado: (d: string) =>
      `El plazo de cancelación terminó el ${d}. Después de 7 días de la compra ya no es posible cancelar este producto.`,
    canceladoPorVoce: (d: string) => `Cancelado por ti el ${d}. El reembolso está en revisión por la organización.`,
    estornado: (d: string) => `Cancelado. Reembolso realizado el ${d}.`,
  },
);

export async function MeusIngressos({ email, idioma = "pt" }: { email: string; idioma?: Idioma }) {
  const lista = await pedidosDoComprador(email);
  const presencas = agruparPorPedido(await presencasDosPedidos(lista.map((p) => p.pedidoId)));
  const t = TEXTOS[idioma];

  if (lista.length === 0) {
    return (
      <>
        <p className="mt-3 text-sm text-mist/70">{t.semIngresso}</p>
        <Link href="/ingressos" className="mt-4 inline-block text-sm font-medium text-teal-300 hover:underline">
          {t.comprar}
        </Link>
      </>
    );
  }

  return (
    <ul className="mt-4 space-y-6">
      {lista.map((p) => (
        <li key={p.pedidoId} className="rounded-xl border border-white/10 bg-petrol-950/60 p-4 text-center">
          <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{nomeDoProduto(p.tipo, idioma)}</p>
          <p className="text-sm font-medium text-teal-300">{nomeDoLote(p.loteNome, idioma)}</p>
          <p className="text-sm text-mist/70">
            {formatarPreco(p.valorCentavos, idioma)} · {t.pedidoEm} {formatarDataHora(p.criadoEm, idioma)}
              {p.status === "pago" && p.formaPagamento ? ` · ${descreverPagamento(p.formaPagamento, p.parcelas, p.valorCentavos, idioma)}` : ""}
          </p>

          {p.status === "pendente" && (
            <div className="mt-3">
              <p className="text-sm text-ember-400">{t.aguardando}</p>
              <Link href="/ingressos" className="mt-2 inline-block text-sm font-medium text-teal-300 hover:underline">
                {t.continuar}
              </Link>
            </div>
          )}

          {p.status === "pago" && !infoProduto(p.tipo).entrada && (
            <p className="mt-3 text-sm text-teal-300">{p.tipo === "jack_and_jill"
                ? t.jackAndJill
                : p.tipo === "camiseta"
                  ? t.camiseta
                  : p.tipo.startsWith("massagem")
                    ? t.massagem
                    : t.servico}</p>
          )}

          {p.status === "pago" && p.ingressoStatus !== "cancelado" && (
            <div className="mt-4">
              <QrIngresso valor={urlDoQr(p.ingressoId ?? p.pedidoId)} />
              <p className="mt-3 text-xs text-mist/60">{t.codigo}</p>
              <p className="font-mono text-2xl tracking-[0.3em] text-white">{codigoCurto(p.ingressoId ?? p.pedidoId)}</p>
              <p className="mt-2 text-xs text-mist/60">{t.mostre}</p>
              {(presencas.get(p.pedidoId)?.length ?? 0) > 0 && (
                <div className="mt-3 border-t border-white/10 pt-3 text-left">
                  <p className="text-xs uppercase tracking-wider text-mist/60">{t.presenca}</p>
                  <BotoesPresenca
                    pedidoId={p.pedidoId}
                    tipo={p.tipo}
                    registros={presencas.get(p.pedidoId) ?? []}
                    podeRegistrar={false}
                    voltar="ingresso"
                    idioma={idioma}
                  />
                </div>
              )}
            </div>
          )}

          {p.status === "pago" && p.ingressoStatus === "cancelado" && (
            <p className="mt-4 text-sm text-ember-400">{t.cancelado}</p>
          )}

          {p.canceladoPeloClienteEm && (
            <p className="mt-3 text-sm text-ember-400">
              {p.estornadoEm
                ? t.estornado(formatarDataHora(p.estornadoEm, idioma))
                : t.canceladoPorVoce(formatarDataHora(p.canceladoPeloClienteEm, idioma))}
            </p>
          )}

          {p.status === "pago" &&
            p.ingressoStatus !== "cancelado" &&
            !presencas.get(p.pedidoId)?.length &&
            Date.now() > prazoParaCancelar(p).getTime() && (
              // Passados 7 dias da compra o botão some e fica só este aviso.
              <p className="mt-4 border-t border-white/10 pt-3 text-xs text-mist/60">
                {t.prazoEncerrado(formatarDataHora(prazoParaCancelar(p), idioma))}
              </p>
            )}

          {p.status === "pago" &&
            p.ingressoStatus !== "cancelado" &&
            !presencas.get(p.pedidoId)?.length &&
            Date.now() <= prazoParaCancelar(p).getTime() && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <Link
                  href={`/congressistas/cancelar/${p.pedidoId}`}
                  className="inline-block rounded-full border border-ember-500/60 px-4 py-2 text-sm font-semibold text-ember-400 hover:bg-ember-500/10"
                >
                  {t.cancelarCompra}
                </Link>
                <p className="mt-2 text-xs text-mist/60">{t.cancelarAte(formatarDataHora(prazoParaCancelar(p), idioma))}</p>
              </div>
            )}
        </li>
      ))}
    </ul>
  );
}
