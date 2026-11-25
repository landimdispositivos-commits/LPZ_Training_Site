"use client";

import { tx } from "@/i18n";

import QRCode from "react-qr-code";
import { useIdioma } from "@/i18n/cliente";

// QR do ingresso: contém o endereço /ingresso/<id> do site. Na portaria o
// ingresso é sempre conferido no banco — o QR sozinho não vale como prova de
// pagamento; e só a organização logada vê os dados da pessoa nesse endereço.
export function QrIngresso({ valor }: { valor: string }) {
  const idioma = useIdioma();
  return (
    <div className="inline-block rounded-xl bg-white p-3">
      <QRCode value={valor} size={192} aria-label={tx(idioma, "QR code do seu ingresso", "Your ticket QR code", "Código QR de tu entrada")} />
    </div>
  );
}
