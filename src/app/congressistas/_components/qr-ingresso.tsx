"use client";

import QRCode from "react-qr-code";

// QR do ingresso: contém só o ID do ingresso. Na portaria o ID é sempre
// conferido no banco — o QR sozinho não vale como prova de pagamento.
export function QrIngresso({ ingressoId }: { ingressoId: string }) {
  return (
    <div className="inline-block rounded-xl bg-white p-3">
      <QRCode value={ingressoId} size={192} aria-label="QR code do seu ingresso" />
    </div>
  );
}
