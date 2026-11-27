"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { tx } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { formatarPreco } from "@/lib/formatar";
import { classeInput } from "../../_components/form-ui";
import { pagarComCartaoSalvoAction, type ResultadoCartao } from "../cartoes/actions";
import { iniciarMercadoPago, type CampoMP, type MercadoPagoSDK } from "../cartoes/mercadopago";

type Cartao = { id: string; rotulo: string; bandeira: string; ultimos4: string; padrao: boolean; vencido: boolean; gatewayCartaoId: string };

// Pagamento com o cartão salvo: o cliente escolhe o cartão (o padrão já vem
// marcado), as parcelas e digita só o código de segurança. No Mercado Pago real
// o código é digitado num campo seguro do próprio Mercado Pago.
export function PagarCartaoSalvo({
  pedidoId,
  cartoes,
  totalCentavos,
  chavePublica,
  simulado,
  maxParcelas,
}: {
  pedidoId: string;
  cartoes: Cartao[];
  totalCentavos: number;
  chavePublica: string | null;
  simulado: boolean;
  maxParcelas: number;
}) {
  const idioma = useIdioma();
  const [estado, acao, pendente] = useActionState<ResultadoCartao, FormData>(pagarComCartaoSalvoAction, {});
  const [, iniciar] = useTransition();
  const usaveis = cartoes.filter((c) => !c.vencido);
  const [cartaoId, setCartaoId] = useState((usaveis.find((c) => c.padrao) ?? usaveis[0])?.id ?? "");
  const [parcelas, setParcelas] = useState(1);
  const [erro, setErro] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const sdk = useRef<MercadoPagoSDK | null>(null);

  useEffect(() => {
    if (simulado || !chavePublica || !cartaoId) return;
    let campo: CampoMP | null = null;
    let ativo = true;
    iniciarMercadoPago(chavePublica)
      .then((mp) => {
        if (!ativo) return;
        sdk.current = mp;
        campo = mp.fields.create("securityCode", { placeholder: tx(idioma, "Código de segurança", "Security code", "Código de seguridad") }).mount("mp-cvv-salvo");
      })
      .catch(() => setErro(tx(idioma, "Não foi possível carregar o campo seguro do Mercado Pago.", "Could not load Mercado Pago's secure field.", "No se pudo cargar el campo seguro de Mercado Pago.")));
    return () => {
      ativo = false;
      campo?.unmount();
    };
  }, [simulado, chavePublica, cartaoId, idioma]);

  const cartao = usaveis.find((c) => c.id === cartaoId);
  if (usaveis.length === 0 || !cartao) return null;

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    if (!cartao) return;
    setErro(null);
    let token: string;
    if (simulado) {
      token = `${cartao.bandeira}:${cartao.ultimos4}`;
    } else {
      if (!sdk.current) return setErro(tx(idioma, "O campo seguro ainda está carregando.", "The secure field is still loading.", "El campo seguro aún está cargando."));
      setGerando(true);
      try {
        token = (await sdk.current.fields.createCardToken({ cardId: cartao.gatewayCartaoId })).id;
      } catch {
        setGerando(false);
        return setErro(tx(idioma, "Confira o código de segurança.", "Check the security code.", "Revisa el código de seguridad."));
      }
      setGerando(false);
    }
    const dados = new FormData();
    dados.set("pedidoId", pedidoId);
    dados.set("cartaoId", cartao.id);
    dados.set("token", token);
    dados.set("parcelas", String(parcelas));
    iniciar(() => acao(dados));
  }

  return (
    <form onSubmit={pagar} className="space-y-3 rounded-2xl border border-gold-500/40 bg-petrol-900/90 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-300">{tx(idioma, "Pagar com cartão salvo", "Pay with saved card", "Pagar con tarjeta guardada")}</h2>
      <div>
        <label htmlFor="cartao-salvo" className="mb-1 block text-xs text-mist/70">{tx(idioma, "Cartão", "Card", "Tarjeta")}</label>
        <select id="cartao-salvo" value={cartaoId} onChange={(e) => setCartaoId(e.target.value)} className={classeInput}>
          {usaveis.map((c) => (
            <option key={c.id} value={c.id}>{c.rotulo} •••• {c.ultimos4}{c.padrao ? ` (${tx(idioma, "padrão", "default", "predeterminada")})` : ""}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="parcelas-salvo" className="mb-1 block text-xs text-mist/70">{tx(idioma, "Parcelas", "Installments", "Cuotas")}</label>
          <select id="parcelas-salvo" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))} className={classeInput}>
            {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}x {formatarPreco(Math.round(totalCentavos / n), idioma)}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-xs text-mist/70">{tx(idioma, "Código de segurança", "Security code", "Código de seguridad")}</span>
          {simulado ? (
            <p className="flex h-11 items-center rounded-lg border border-white/15 px-3 text-xs text-mist/60">{tx(idioma, "não necessário no teste", "not needed in test", "no necesario en prueba")}</p>
          ) : (
            <div id="mp-cvv-salvo" className="h-11 rounded-lg border border-white/15 bg-petrol-950/70 px-3" />
          )}
        </div>
      </div>
      {(estado.erro || erro) && <p role="alert" className="text-sm text-ember-400">{erro ?? estado.erro}</p>}
      <button type="submit" disabled={pendente || gerando} className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110 disabled:opacity-60">
        {pendente || gerando ? tx(idioma, "Processando…", "Processing…", "Procesando…") : tx(idioma, `Pagar ${formatarPreco(totalCentavos, idioma)}`, `Pay ${formatarPreco(totalCentavos, idioma)}`, `Pagar ${formatarPreco(totalCentavos, idioma)}`)}
      </button>
    </form>
  );
}
