"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { classeInput } from "../../_components/form-ui";
import { salvarCartaoAction, type ResultadoCartao } from "./actions";
import { iniciarMercadoPago, type CampoMP, type MercadoPagoSDK } from "./mercadopago";

const campoMP = "h-11 rounded-lg border border-white/15 bg-petrol-950/70 px-3";

// Cadastro de cartão. No Mercado Pago de verdade, os campos são iframes do
// Mercado Pago (o cartão não passa pelo nosso site). No modo de teste, nenhum
// dado de cartão é digitado: escolhe-se uma bandeira e um final de mentira.
export function AdicionarCartao({ chavePublica, simulado }: { chavePublica: string | null; simulado: boolean }) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<ResultadoCartao, FormData>(salvarCartaoAction, {});
  const [, iniciar] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const sdk = useRef<MercadoPagoSDK | null>(null);
  const [erroMP, setErroMP] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (estado.ok) {
      form.current?.reset();
      router.refresh();
    }
  }, [estado, router]);

  useEffect(() => {
    if (simulado || !chavePublica) return;
    let campos: CampoMP[] = [];
    let ativo = true;
    iniciarMercadoPago(chavePublica)
      .then((mp) => {
        if (!ativo) return;
        sdk.current = mp;
        campos = [
          mp.fields.create("cardNumber", { placeholder: "Número do cartão" }).mount("mp-numero"),
          mp.fields.create("expirationDate", { placeholder: "MM/AA" }).mount("mp-validade"),
          mp.fields.create("securityCode", { placeholder: "Código de segurança" }).mount("mp-cvv"),
        ];
      })
      .catch(() => setErroMP("Não foi possível carregar o formulário seguro do Mercado Pago."));
    return () => {
      ativo = false;
      campos.forEach((c) => c.unmount());
    };
  }, [simulado, chavePublica]);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    setErroMP(null);
    if (!simulado) {
      if (!sdk.current) return setErroMP("O formulário seguro ainda está carregando. Aguarde um instante.");
      setGerando(true);
      try {
        const token = await sdk.current.fields.createCardToken({
          cardholderName: String(dados.get("titular") ?? ""),
          identificationType: "CPF",
          identificationNumber: String(dados.get("documento") ?? "").replace(/\D/g, ""),
        });
        dados.set("token", token.id);
      } catch {
        setGerando(false);
        return setErroMP("Confira os dados do cartão e tente de novo.");
      }
      setGerando(false);
    } else {
      dados.set("token", `${dados.get("bandeira")}:${dados.get("final")}`);
    }
    // Nome e CPF do titular ficam só no navegador (vão para o Mercado Pago, não para nós).
    dados.delete("titular");
    dados.delete("documento");
    iniciar(() => acao(dados));
  }

  return (
    <form ref={form} onSubmit={enviar} className="space-y-4">
      {simulado ? (
        <div className="space-y-3 rounded-xl border border-ember-500/50 bg-ember-500/10 p-4 text-sm text-mist">
          <p><strong>Modo de teste.</strong> Nenhum dado de cartão é digitado nem guardado: escolha um cartão de mentira.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="bandeira" className="mb-1 block text-xs text-mist/70">Bandeira</label>
              <select id="bandeira" name="bandeira" defaultValue="visa" className={classeInput}>
                <option value="visa">Visa</option>
                <option value="master">Mastercard</option>
                <option value="elo">Elo</option>
              </select>
            </div>
            <div>
              <label htmlFor="final" className="mb-1 block text-xs text-mist/70">Final</label>
              <select id="final" name="final" defaultValue="4242" className={classeInput}>
                <option value="4242">•••• 4242 (aprova)</option>
                <option value="1111">•••• 1111 (aprova)</option>
                <option value="0000">•••• 0000 (recusa)</option>
              </select>
            </div>
          </div>
        </div>
      ) : !chavePublica ? (
        <p role="alert" className="text-sm text-ember-400">O cartão salvo não está configurado (falta a chave pública do Mercado Pago).</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-mist/60">Os dados do cartão são digitados nos campos seguros do Mercado Pago e nunca passam pelo nosso site.</p>
          <div id="mp-numero" className={campoMP} />
          <div className="grid grid-cols-2 gap-3">
            <div id="mp-validade" className={campoMP} />
            <div id="mp-cvv" className={campoMP} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="titular" className="mb-1 block text-xs text-mist/70">Nome impresso no cartão</label>
              <input id="titular" name="titular" required autoComplete="cc-name" className={classeInput} />
            </div>
            <div>
              <label htmlFor="documento" className="mb-1 block text-xs text-mist/70">CPF do titular</label>
              <input id="documento" name="documento" required inputMode="numeric" autoComplete="off" className={classeInput} />
            </div>
          </div>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-mist">
        <input type="checkbox" name="consentimento" required className="mt-1 h-4 w-4 accent-gold-400" />
        <span>
          Autorizo guardar este cartão no <strong>Mercado Pago</strong> para as minhas próximas compras no Bar. O LPZ Training guarda só a bandeira e
          os 4 últimos dígitos, e eu posso remover o cartão quando quiser.
        </span>
      </label>

      {(estado.erro || erroMP) && <p role="alert" className="text-sm text-ember-400">{erroMP ?? estado.erro}</p>}
      {estado.ok && <p role="status" className="text-sm text-teal-300">Cartão guardado!</p>}
      <button type="submit" disabled={pendente || gerando} className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110 disabled:opacity-60">
        {pendente || gerando ? "Guardando…" : "Guardar cartão"}
      </button>
    </form>
  );
}
