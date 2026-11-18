"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { traducoes } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { formatarPreco } from "@/lib/formatar";
import { MAX_PARCELAS } from "@/modules/pagamentos/formas";
import { classeBotao, classeInput } from "../../_components/form-ui";
import { decidirPagamentoSimuladoAction } from "./actions";

// Tela de pagamento de TESTE, no formato do checkout real (Pix, crédito
// parcelado, débito à vista). Os campos de cartão são só visuais: não têm
// "name", então NADA do que for digitado é enviado ao servidor. No checkout
// real, os dados do cartão são digitados na página do Mercado Pago.

type Aba = "pix" | "credito" | "debito";

const TEXTOS = traducoes(
  {
    formas: "Como você quer pagar?",
    pix: "Pix",
    credito: "Cartão de crédito",
    debito: "Cartão de débito",
    pixAprovacao: "Aprovação na hora",
    creditoParcelas: (n: number) => `Em até ${n}x`,
    debitoAvista: "À vista",
    pixInstrucao: "Abra o app do seu banco, escolha Pix → Pagar com QR code e aponte a câmera. Ou copie o código abaixo.",
    copiar: "Copiar código Pix",
    copiado: "Copiado!",
    pixPagar: "Simular: já paguei o Pix",
    numero: "Número do cartão",
    nome: "Nome impresso no cartão",
    validade: "Validade (MM/AA)",
    cvv: "Código de segurança",
    parcelas: "Parcelas",
    parcela: (n: number, valor: string) => (n === 1 ? `1x de ${valor} (à vista)` : `${n}x de ${valor}`),
    pagar: (valor: string) => `Pagar ${valor}`,
    testeCartao: "Modo de teste: não digite dados de um cartão de verdade. Nada do que você digitar aqui é enviado.",
    recusar: "Simular pagamento recusado / desistir",
    processando: "Processando...",
  },
  {
    formas: "How do you want to pay?",
    pix: "Pix",
    credito: "Credit card",
    debito: "Debit card",
    pixAprovacao: "Instant approval",
    creditoParcelas: (n: number) => `Up to ${n} installments`,
    debitoAvista: "Single payment",
    pixInstrucao: "Open your bank app, choose Pix → Pay with QR code and point the camera. Or copy the code below.",
    copiar: "Copy Pix code",
    copiado: "Copied!",
    pixPagar: "Simulate: I have paid the Pix",
    numero: "Card number",
    nome: "Name on card",
    validade: "Expiry (MM/YY)",
    cvv: "Security code",
    parcelas: "Installments",
    parcela: (n: number, valor: string) => (n === 1 ? `1x ${valor} (single payment)` : `${n}x ${valor}`),
    pagar: (valor: string) => `Pay ${valor}`,
    testeCartao: "Test mode: do not enter real card details. Nothing you type here is sent.",
    recusar: "Simulate declined payment / cancel",
    processando: "Processing...",
  },
  {
    formas: "¿Cómo quieres pagar?",
    pix: "Pix",
    credito: "Tarjeta de crédito",
    debito: "Tarjeta de débito",
    pixAprovacao: "Aprobación inmediata",
    creditoParcelas: (n: number) => `Hasta ${n} cuotas`,
    debitoAvista: "En un pago",
    pixInstrucao: "Abre la app de tu banco, elige Pix → Pagar con código QR y apunta la cámara. O copia el código de abajo.",
    copiar: "Copiar código Pix",
    copiado: "¡Copiado!",
    pixPagar: "Simular: ya pagué el Pix",
    numero: "Número de la tarjeta",
    nome: "Nombre impreso en la tarjeta",
    validade: "Vencimiento (MM/AA)",
    cvv: "Código de seguridad",
    parcelas: "Cuotas",
    parcela: (n: number, valor: string) => (n === 1 ? `1x ${valor} (en un pago)` : `${n}x ${valor}`),
    pagar: (valor: string) => `Pagar ${valor}`,
    testeCartao: "Modo de prueba: no ingreses datos de una tarjeta real. Nada de lo que escribas aquí se envía.",
    recusar: "Simular pago rechazado / desistir",
    processando: "Procesando...",
  },
);

function IconePix() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12Zm0 4.2L6.7 12l5.3 5.3 5.3-5.3Z" />
    </svg>
  );
}

function IconeCartao() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19M6 15h4" />
    </svg>
  );
}

export function CheckoutSimulado({ pedidoId, valorCentavos }: { pedidoId: string; valorCentavos: number }) {
  const idioma = useIdioma();
  const t = TEXTOS[idioma];
  const [aba, setAba] = useState<Aba>("pix");
  const [parcelas, setParcelas] = useState(1);
  const [copiado, setCopiado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const valor = formatarPreco(valorCentavos, idioma);
  const codigoPix = `00020126LPZTRAINING-TESTE-${pedidoId.slice(0, 8).toUpperCase()}5204000053039865802BR6009SAO PAULO`;

  const opcoes: { id: Aba; titulo: string; detalhe: string; icone: React.ReactNode }[] = [
    { id: "pix", titulo: t.pix, detalhe: t.pixAprovacao, icone: <IconePix /> },
    { id: "credito", titulo: t.credito, detalhe: t.creditoParcelas(MAX_PARCELAS), icone: <IconeCartao /> },
    { id: "debito", titulo: t.debito, detalhe: t.debitoAvista, icone: <IconeCartao /> },
  ];

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigoPix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Navegador sem permissão de área de transferência: o código continua visível.
    }
  }

  const camposCartao = (
    <div className="space-y-3 text-left" aria-describedby="aviso-teste-cartao">
      <p id="aviso-teste-cartao" className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-3 py-2 text-xs">
        {t.testeCartao}
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t.numero}</span>
        <input inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" maxLength={19} className={classeInput} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t.nome}</span>
        <input autoComplete="off" className={classeInput} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.validade}</span>
          <input inputMode="numeric" autoComplete="off" placeholder="MM/AA" maxLength={5} className={classeInput} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.cvv}</span>
          <input inputMode="numeric" autoComplete="off" placeholder="123" maxLength={4} className={classeInput} />
        </label>
      </div>
    </div>
  );

  return (
    <form action={decidirPagamentoSimuladoAction} onSubmit={() => setEnviando(true)} className="space-y-5">
      <input type="hidden" name="pedidoId" value={pedidoId} />
      <input type="hidden" name="forma" value={aba} />
      <input type="hidden" name="parcelas" value={aba === "credito" ? parcelas : 1} />

      <fieldset>
        <legend className="mb-3 text-left font-display text-xs uppercase tracking-[0.15em] text-gold-300">{t.formas}</legend>
        <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
          {opcoes.map((o) => {
            const ativo = aba === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setAba(o.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                  ativo ? "border-gold-300 bg-gold-400/10 text-gold-300 ring-1 ring-gold-400" : "border-white/15 text-mist/80 hover:border-gold-500/60"
                }`}
              >
                {o.icone}
                <span className="text-sm font-semibold">{o.titulo}</span>
                <span className="text-[11px] text-mist/60">{o.detalhe}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
        {aba === "pix" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-fit rounded-xl bg-white p-3">
              <QRCode value={codigoPix} size={168} aria-label="QR code Pix (teste)" />
            </div>
            <p className="text-sm text-mist/80">{t.pixInstrucao}</p>
            <p className="break-all rounded-lg bg-petrol-950 px-3 py-2 font-mono text-[11px] text-mist/70">{codigoPix}</p>
            <button
              type="button"
              onClick={copiar}
              className="w-full rounded-full border border-teal-300/60 px-6 py-2.5 text-sm font-semibold text-teal-300 hover:bg-teal-300/10"
            >
              {copiado ? t.copiado : t.copiar}
            </button>
          </div>
        )}

        {aba === "credito" && (
          <div className="space-y-3">
            {camposCartao}
            <label className="block text-left text-sm">
              <span className="mb-1 block font-medium">{t.parcelas}</span>
              <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className={classeInput}>
                {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t.parcela(n, formatarPreco(Math.ceil(valorCentavos / n), idioma))}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {aba === "debito" && camposCartao}
      </div>

      <button type="submit" name="decisao" value="aprovar" disabled={enviando} className={classeBotao}>
        {enviando ? t.processando : aba === "pix" ? t.pixPagar : t.pagar(valor)}
      </button>
      <button
        type="submit"
        name="decisao"
        value="recusar"
        disabled={enviando}
        className="w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10"
      >
        {t.recusar}
      </button>
    </form>
  );
}
