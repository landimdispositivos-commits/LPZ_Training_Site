import { formatarPreco } from "@/lib/formatar";
import { classeInput } from "../../_components/form-ui";
import { cobrarComandaAction } from "../comanda/actions";

// Botão "Recebido" de uma comanda aberta: escolhe Pix, cartão ou dinheiro e fecha
// a comanda. O valor entra como venda no caixa de quem recebeu.
export function ReceberComanda({ numero, total, voltar }: { numero: string; total: number; voltar: "lista" | "gestao" }) {
  const id = `rec-${numero}`;
  return (
    <details className="w-full">
      <summary className="bg-gold-metal inline-flex h-9 cursor-pointer list-none items-center rounded-full px-4 text-sm font-semibold text-gold-ink hover:brightness-110 [&::-webkit-details-marker]:hidden">
        Receber
      </summary>
      <form action={cobrarComandaAction} className="mt-3 space-y-3 rounded-xl border border-gold-500/40 bg-petrol-950/60 p-3">
        <input type="hidden" name="numero" value={numero} />
        <input type="hidden" name="voltar" value={voltar} />
        <fieldset>
          <legend className="mb-2 text-xs text-mist/70">Comanda <strong className="font-mono text-lg font-extrabold text-gold-300">{numero}</strong> — como foi pago? ({formatarPreco(total)})</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["pix", "Pix"],
              ["credito", "Cartão crédito"],
              ["debito", "Cartão débito"],
              ["dinheiro", "Dinheiro"],
            ].map(([v, r], i) => (
              <label key={v} className="flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/20 px-2 text-center text-xs font-semibold text-mist has-[:checked]:border-transparent has-[:checked]:bg-gold-400 has-[:checked]:text-gold-ink">
                <input type="radio" name="forma" value={v} defaultChecked={i === 0} className="sr-only" />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={id} className="mb-1 block text-xs text-mist/70">Valor recebido, só se for dinheiro (R$)</label>
          <input id={id} name="recebido" inputMode="decimal" placeholder={formatarPreco(total).replace("R$", "").trim()} className={classeInput} />
        </div>
        <button type="submit" className="bg-gold-metal h-11 w-full rounded-full text-sm font-semibold text-gold-ink hover:brightness-110">
          Recebido — fechar comanda <span className="font-mono text-base font-extrabold">{numero}</span>
        </button>
      </form>
    </details>
  );
}
