"use client";

import { useActionState, useMemo, useState } from "react";
import { formatarPreco } from "@/lib/formatar";
import { lancarNaComandaAction, type ResultadoLancamento } from "../comanda/actions";
import { registrarVendaAction, type ResultadoVenda } from "./actions";

type Produto = { id: string; nome: string; precoCentavos: number; categoria: string | null; saldo: number };

const FORMAS = [
  { v: "debito", r: "Débito" },
  { v: "credito", r: "Crédito" },
  { v: "pix", r: "Pix" },
  { v: "dinheiro", r: "Dinheiro" },
];

// Caixa (PDV): toque nos produtos para montar o pedido, escolha a forma de
// pagamento e confirme. O servidor confere o estoque e o preço de verdade.
export function Pdv({ produtos, comandaAtiva }: { produtos: Produto[]; comandaAtiva: boolean }) {
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [forma, setForma] = useState("debito");
  const [recebido, setRecebido] = useState("");
  const [numeroComanda, setNumeroComanda] = useState("");
  const [estado, acao, pendenteVenda] = useActionState<ResultadoVenda, FormData>(registrarVendaAction, {});
  const [estadoCmd, acaoCmd, pendenteCmd] = useActionState<ResultadoLancamento, FormData>(lancarNaComandaAction, {});
  const naComanda = forma === "comanda";
  const pendente = pendenteVenda || pendenteCmd;
  const formas = comandaAtiva ? [...FORMAS, { v: "comanda", r: "Comanda" }] : FORMAS;

  const linhas = useMemo(
    () => produtos.filter((p) => carrinho[p.id]).map((p) => ({ ...p, qtd: carrinho[p.id] })),
    [produtos, carrinho],
  );
  const total = linhas.reduce((s, l) => s + l.qtd * l.precoCentavos, 0);
  const recebidoCentavos = Math.round(Number(recebido.replace(",", ".")) * 100);
  const troco = forma === "dinheiro" && recebido && Number.isFinite(recebidoCentavos) ? recebidoCentavos - total : null;

  const grupos = useMemo(() => {
    const m = new Map<string, Produto[]>();
    for (const p of produtos) m.set(p.categoria ?? "Outros", [...(m.get(p.categoria ?? "Outros") ?? []), p]);
    return [...m.entries()];
  }, [produtos]);

  function mudar(p: Produto, delta: number) {
    setCarrinho((c) => {
      const novo = Math.max(0, Math.min((c[p.id] ?? 0) + delta, p.saldo));
      const resto = { ...c };
      if (novo > 0) resto[p.id] = novo;
      else delete resto[p.id];
      return resto;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-5">
        {grupos.map(([cat, lista]) => (
          <section key={cat}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-300">{cat}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {lista.map((p) => {
                const qtd = carrinho[p.id] ?? 0;
                const esgotado = p.saldo <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={esgotado || qtd >= p.saldo}
                    onClick={() => mudar(p, 1)}
                    className={`relative min-h-20 rounded-xl border p-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed ${
                      qtd > 0 ? "border-gold-400 bg-gold-400/10" : "border-white/10 bg-petrol-900/80 hover:border-gold-500/60"
                    } ${esgotado ? "opacity-40" : ""}`}
                  >
                    <span className="block text-sm font-semibold text-white">{p.nome}</span>
                    <span className="block text-sm text-gold-300">{formatarPreco(p.precoCentavos)}</span>
                    <span className="block text-xs text-mist/60">{esgotado ? "Esgotado" : `${p.saldo} em estoque`}</span>
                    {qtd > 0 && (
                      <span className="bg-gold-metal absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-gold-ink">
                        {qtd}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <form action={naComanda ? acaoCmd : acao} className="h-fit space-y-4 rounded-2xl border border-gold-500/40 bg-petrol-900/90 p-5 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-300">Pedido</h2>
        <input type="hidden" name="carrinho" value={JSON.stringify(linhas.map((l) => ({ produtoId: l.id, quantidade: l.qtd })))} />
        <input type="hidden" name="forma" value={forma} />
        <input type="hidden" name="voltar" value="caixa" />
        <input type="hidden" name="numero" value={numeroComanda} />
        {linhas.length === 0 ? (
          <p className="text-sm text-mist/60">Toque nos produtos para adicionar.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {linhas.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-white">{l.nome}</span>
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => mudar(l, -1)} aria-label={`Tirar um ${l.nome}`} className="h-8 w-8 rounded-full border border-white/20 text-white">−</button>
                  <span className="w-6 text-center font-semibold text-white">{l.qtd}</span>
                  <button type="button" onClick={() => mudar(l, 1)} disabled={l.qtd >= l.saldo} aria-label={`Adicionar um ${l.nome}`} className="h-8 w-8 rounded-full border border-white/20 text-white disabled:opacity-30">+</button>
                </span>
                <span className="w-20 text-right text-mist">{formatarPreco(l.qtd * l.precoCentavos)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
          <span className="text-sm text-mist/70">Total</span>
          <span className="text-gold-metal text-2xl font-extrabold">{formatarPreco(total)}</span>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs text-mist/70">Forma de pagamento</legend>
          <div className="grid grid-cols-2 gap-2">
            {formas.map((f) => (
              <button
                key={f.v}
                type="button"
                aria-pressed={forma === f.v}
                onClick={() => setForma(f.v)}
                className={`h-11 rounded-full border text-sm font-semibold ${forma === f.v ? "bg-gold-metal border-transparent text-gold-ink" : "border-white/20 text-mist hover:border-gold-500/60"}`}
              >
                {f.r}
              </button>
            ))}
          </div>
        </fieldset>

        {naComanda && (
          <div>
            <label htmlFor="numero-comanda" className="mb-1 block text-xs text-mist/70">Número da comanda (pulseira ou cartão)</label>
            <input
              id="numero-comanda"
              value={numeroComanda}
              onChange={(e) => setNumeroComanda(e.target.value)}
              autoComplete="off"
              maxLength={20}
              placeholder="Ex.: A12"
              className="w-full rounded-lg border border-white/15 bg-petrol-950/70 px-3 py-2.5 font-mono uppercase tracking-widest text-white focus:border-gold-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-mist/60">O consumo fica na comanda e é cobrado depois, em Comandas. O estoque já abate agora.</p>
          </div>
        )}
        {forma === "dinheiro" && (
          <div>
            <label htmlFor="recebido" className="mb-1 block text-xs text-mist/70">Valor recebido (R$)</label>
            <input
              id="recebido"
              name="recebido"
              inputMode="decimal"
              value={recebido}
              onChange={(e) => setRecebido(e.target.value)}
              placeholder={formatarPreco(total).replace("R$", "").trim()}
              className="w-full rounded-lg border border-white/15 bg-petrol-950/70 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
            />
            {troco !== null && (
              <p className={`mt-1 text-sm font-semibold ${troco < 0 ? "text-ember-400" : "text-teal-300"}`}>
                {troco < 0 ? `Faltam ${formatarPreco(-troco)}` : `Troco: ${formatarPreco(troco)}`}
              </p>
            )}
          </div>
        )}
        {!naComanda && forma !== "dinheiro" && linhas.length > 0 && (
          <p className="text-xs text-mist/60">Cobre {formatarPreco(total)} na maquininha (ou no Pix) e depois confirme.</p>
        )}

        {(naComanda ? estadoCmd.erro : estado.erro) && (
          <p role="alert" className="text-sm text-ember-400">{naComanda ? estadoCmd.erro : estado.erro}</p>
        )}
        <button
          type="submit"
          disabled={pendente || linhas.length === 0 || (naComanda && numeroComanda.trim() === "")}
          className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendente ? "Registrando…" : naComanda ? "Lançar na comanda" : "Recebido — registrar venda e gerar ticket"}
        </button>
        {linhas.length > 0 && (
          <button type="button" onClick={() => setCarrinho({})} className="w-full text-center text-xs text-mist/60 hover:text-white">
            Limpar pedido
          </button>
        )}
      </form>
    </div>
  );
}
