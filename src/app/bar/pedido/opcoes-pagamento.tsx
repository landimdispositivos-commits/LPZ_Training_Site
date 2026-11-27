"use client";

import { useState } from "react";
import { tx } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { formatarPreco } from "@/lib/formatar";
import { classeInput } from "../../_components/form-ui";
import { atualizarPedidoAction, decidirPagamentoSimuladoBarAction } from "./actions";
import { PagarCartaoSalvo } from "./pagar-cartao-salvo";

type Cartao = { id: string; rotulo: string; bandeira: string; ultimos4: string; padrao: boolean; vencido: boolean; gatewayCartaoId: string };
type Opcao = "salvo" | "novo" | "pix";

// Escolha da forma de pagamento: cartão salvo, outro cartão ou Pix. Cada opção
// tem o seu botão "Pagar". No Mercado Pago real, "outro cartão" e "Pix" abrem a
// página segura do Mercado Pago; no modo de teste, o simulador faz esse papel.
export function OpcoesPagamento({
  pedidoId,
  totalCentavos,
  simulado,
  checkoutUrl,
  cartoes,
  chavePublica,
  maxParcelas,
}: {
  pedidoId: string;
  totalCentavos: number;
  simulado: boolean;
  checkoutUrl: string | null;
  cartoes: Cartao[];
  chavePublica: string | null;
  maxParcelas: number;
}) {
  const idioma = useIdioma();
  const temSalvo = cartoes.some((c) => !c.vencido) && (simulado || Boolean(chavePublica));
  const [opcao, setOpcao] = useState<Opcao>(temSalvo ? "salvo" : "novo");
  const [parcelas, setParcelas] = useState(1);
  const valor = formatarPreco(totalCentavos, idioma);

  const opcoes: { id: Opcao; titulo: string; sub: string }[] = [
    ...(temSalvo
      ? [{ id: "salvo" as const, titulo: tx(idioma, "Cartão salvo", "Saved card", "Tarjeta guardada"), sub: tx(idioma, "Pague com o cartão que você já guardou", "Pay with the card you saved", "Paga con la tarjeta que guardaste") }]
      : []),
    { id: "novo", titulo: tx(idioma, "Cartão de crédito ou débito", "Credit or debit card", "Tarjeta de crédito o débito"), sub: tx(idioma, "Digite os dados de um cartão", "Enter a card's details", "Ingresa los datos de una tarjeta") },
    { id: "pix", titulo: "Pix", sub: tx(idioma, "Aprovação na hora", "Instant approval", "Aprobación inmediata") },
  ];

  return (
    <section className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-300">{tx(idioma, "Como você quer pagar?", "How do you want to pay?", "¿Cómo quieres pagar?")}</legend>
        {opcoes.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${opcao === o.id ? "border-gold-400 bg-gold-400/10" : "border-white/15 bg-petrol-900/80 hover:border-gold-500/50"}`}
          >
            <input type="radio" name="opcao-pagamento" value={o.id} checked={opcao === o.id} onChange={() => setOpcao(o.id)} className="h-4 w-4 accent-gold-400" />
            <span>
              <span className="block text-sm font-semibold text-white">{o.titulo}</span>
              <span className="block text-xs text-mist/60">{o.sub}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {opcao === "salvo" && temSalvo && (
        <PagarCartaoSalvo pedidoId={pedidoId} totalCentavos={totalCentavos} chavePublica={chavePublica} simulado={simulado} maxParcelas={maxParcelas} cartoes={cartoes} />
      )}

      {opcao !== "salvo" &&
        (simulado ? (
          <form action={decidirPagamentoSimuladoBarAction} className="space-y-3 rounded-2xl border border-ember-500/50 bg-ember-500/10 p-5">
            <input type="hidden" name="id" value={pedidoId} />
            <input type="hidden" name="forma" value={opcao === "pix" ? "pix" : "credito"} />
            <p className="text-sm text-mist">
              {tx(idioma, "Modo de teste: o Mercado Pago ainda não está conectado, nenhum dinheiro é cobrado e nenhum dado de cartão é digitado.", "Test mode: Mercado Pago is not connected yet, no money is charged and no card data is entered.", "Modo de prueba: Mercado Pago aún no está conectado, no se cobra dinero ni se ingresan datos de tarjeta.")}
            </p>
            {opcao === "novo" && (
              <div>
                <label htmlFor="parcelas-novo" className="mb-1 block text-xs text-mist/70">{tx(idioma, "Parcelas", "Installments", "Cuotas")}</label>
                <select id="parcelas-novo" name="parcelas" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className={classeInput}>
                  {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}x {formatarPreco(Math.round(totalCentavos / n), idioma)}</option>
                  ))}
                </select>
              </div>
            )}
            <button type="submit" name="decisao" value="aprovar" className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110">
              {tx(idioma, `Pagar ${valor}`, `Pay ${valor}`, `Pagar ${valor}`)}
            </button>
            <button type="submit" name="decisao" value="recusar" className="w-full rounded-full border border-ember-500/60 py-2 text-sm font-semibold text-ember-400 hover:bg-ember-500/10">
              {tx(idioma, "Simular pagamento recusado", "Simulate declined payment", "Simular pago rechazado")}
            </button>
          </form>
        ) : (
          <div className="space-y-3 rounded-2xl border border-gold-500/40 bg-petrol-900/90 p-5">
            <p className="text-sm text-mist">
              {opcao === "pix"
                ? tx(idioma, "Você será levado ao Mercado Pago para pagar com Pix (QR code ou copia e cola).", "You will be taken to Mercado Pago to pay with Pix (QR code or copy and paste).", "Serás llevado a Mercado Pago para pagar con Pix (código QR o copia y pega).")
                : tx(idioma, "Você será levado à página segura do Mercado Pago para digitar os dados do cartão.", "You will be taken to Mercado Pago's secure page to enter your card details.", "Serás llevado a la página segura de Mercado Pago para ingresar los datos de tu tarjeta.")}
            </p>
            {checkoutUrl ? (
              <a href={checkoutUrl} className="bg-gold-metal flex h-12 w-full items-center justify-center rounded-full font-semibold text-gold-ink hover:brightness-110">
                {tx(idioma, `Pagar ${valor}`, `Pay ${valor}`, `Pagar ${valor}`)}
              </a>
            ) : (
              <p role="alert" className="text-sm text-ember-400">{tx(idioma, "Pagamento indisponível agora. Tente de novo em instantes.", "Payment unavailable right now. Please try again shortly.", "Pago no disponible ahora. Inténtalo de nuevo en unos instantes.")}</p>
            )}
            <form action={atualizarPedidoAction}>
              <input type="hidden" name="id" value={pedidoId} />
              <button type="submit" className="w-full rounded-full border border-gold-500/60 py-2.5 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">
                {tx(idioma, "Já paguei: atualizar", "I've paid: refresh", "Ya pagué: actualizar")}
              </button>
            </form>
          </div>
        ))}
    </section>
  );
}
