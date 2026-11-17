import Link from "next/link";
import { codigoCurto, pedidosDoComprador } from "@/modules/ingressos";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { QrIngresso } from "./qr-ingresso";

export async function MeusIngressos({ email }: { email: string }) {
  const lista = await pedidosDoComprador(email);

  if (lista.length === 0) {
    return (
      <>
        <p className="mt-3 text-sm text-mist/70">Você ainda não tem ingresso.</p>
        <Link href="/ingressos" className="mt-4 inline-block text-sm font-medium text-teal-300 hover:underline">
          Comprar ingresso
        </Link>
      </>
    );
  }

  return (
    <ul className="mt-4 space-y-6">
      {lista.map((p) => (
        <li key={p.pedidoId} className="rounded-xl border border-white/10 bg-petrol-950/60 p-4 text-center">
          <p className="text-sm font-medium text-teal-300">{p.loteNome}</p>
          <p className="text-sm text-mist/70">
            {formatarPreco(p.valorCentavos)} · pedido em {formatarDataHora(p.criadoEm)}
          </p>

          {p.status === "pendente" && (
            <div className="mt-3">
              <p className="text-sm text-ember-400">Aguardando pagamento.</p>
              <Link href="/ingressos" className="mt-2 inline-block text-sm font-medium text-teal-300 hover:underline">
                Continuar pagamento
              </Link>
            </div>
          )}

          {p.status === "pago" && p.ingressoId && (
            <div className="mt-4">
              {p.ingressoStatus === "valido" ? (
                <>
                  <QrIngresso ingressoId={p.ingressoId} />
                  <p className="mt-3 text-xs text-mist/60">Código do ingresso</p>
                  <p className="font-mono text-2xl tracking-[0.3em] text-white">{codigoCurto(p.ingressoId)}</p>
                  <p className="mt-2 text-xs text-mist/60">Mostre o QR code (ou o código) na entrada do evento.</p>
                </>
              ) : p.ingressoStatus === "usado" ? (
                <p className="text-sm text-teal-300">
                  Entrada registrada{p.checkinEm ? ` em ${formatarDataHora(p.checkinEm)}` : ""}. Bom evento!
                </p>
              ) : (
                <p className="text-sm text-ember-400">Ingresso cancelado. Fale com a organização.</p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
