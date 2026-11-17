import Link from "next/link";
import { traducoes, type Idioma } from "@/i18n";
import { codigoCurto, nomeDoProduto, pedidosDoComprador, PRODUTOS } from "@/modules/ingressos";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { QrIngresso } from "./qr-ingresso";

const TEXTOS = traducoes(
  {
    semIngresso: "Você ainda não tem ingresso.",
    comprar: "Comprar ingresso ou pacote",
    pedidoEm: "pedido em",
    aguardando: "Aguardando pagamento.",
    continuar: "Continuar pagamento",
    servico: "Compra confirmada. A equipe entra em contato sobre o serviço.",
    codigo: "Código do ingresso",
    mostre: "Mostre o QR code (ou o código) na entrada do evento.",
    entrada: (quando: string) => `Entrada registrada${quando ? ` em ${quando}` : ""}. Bom evento!`,
    cancelado: "Ingresso cancelado. Fale com a organização.",
  },
  {
    semIngresso: "You don't have a ticket yet.",
    comprar: "Buy a ticket or package",
    pedidoEm: "ordered on",
    aguardando: "Awaiting payment.",
    continuar: "Continue payment",
    servico: "Purchase confirmed. The team will contact you about the service.",
    codigo: "Ticket code",
    mostre: "Show the QR code (or the code) at the event entrance.",
    entrada: (quando: string) => `Entry recorded${quando ? ` on ${quando}` : ""}. Enjoy the event!`,
    cancelado: "Ticket cancelled. Please contact the organizers.",
  },
);

export async function MeusIngressos({ email, idioma = "pt" }: { email: string; idioma?: Idioma }) {
  const lista = await pedidosDoComprador(email);
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
          <p className="text-sm font-medium text-teal-300">{p.loteNome}</p>
          <p className="text-sm text-mist/70">
            {formatarPreco(p.valorCentavos, idioma)} · {t.pedidoEm} {formatarDataHora(p.criadoEm, idioma)}
          </p>

          {p.status === "pendente" && (
            <div className="mt-3">
              <p className="text-sm text-ember-400">{t.aguardando}</p>
              <Link href="/ingressos" className="mt-2 inline-block text-sm font-medium text-teal-300 hover:underline">
                {t.continuar}
              </Link>
            </div>
          )}

          {p.status === "pago" && !PRODUTOS[p.tipo].entrada && (
            <p className="mt-3 text-sm text-teal-300">{t.servico}</p>
          )}

          {p.status === "pago" && p.ingressoId && (
            <div className="mt-4">
              {p.ingressoStatus === "valido" ? (
                <>
                  <QrIngresso ingressoId={p.ingressoId} />
                  <p className="mt-3 text-xs text-mist/60">{t.codigo}</p>
                  <p className="font-mono text-2xl tracking-[0.3em] text-white">{codigoCurto(p.ingressoId)}</p>
                  <p className="mt-2 text-xs text-mist/60">{t.mostre}</p>
                </>
              ) : p.ingressoStatus === "usado" ? (
                <p className="text-sm text-teal-300">
                  {t.entrada(p.checkinEm ? formatarDataHora(p.checkinEm, idioma) : "")}
                </p>
              ) : (
                <p className="text-sm text-ember-400">{t.cancelado}</p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
