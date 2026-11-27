"use client";

import { useActionState, useMemo, useState } from "react";
import { formatarPreco } from "@/lib/formatar";
import { lancarNaComandaAction, type ResultadoLancamento } from "../actions";

type Produto = { id: string; nome: string; precoCentavos: number; categoria: string | null; saldo: number };

// Lançamento de consumo na comanda: toque nos produtos e confirme.
export function Lancador({ numero, produtos }: { numero: string; produtos: Produto[] }) {
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [estado, acao, pendente] = useActionState<ResultadoLancamento, FormData>(lancarNaComandaAction, {});

  const linhas = useMemo(() => produtos.filter((p) => carrinho[p.id]).map((p) => ({ ...p, qtd: carrinho[p.id] })), [produtos, carrinho]);
  const total = linhas.reduce((s, l) => s + l.qtd * l.precoCentavos, 0);
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
    <form action={acao} className="space-y-4">
      <input type="hidden" name="numero" value={numero} />
      <input type="hidden" name="carrinho" value={JSON.stringify(linhas.map((l) => ({ produtoId: l.id, quantidade: l.qtd })))} />
      {grupos.map(([cat, lista]) => (
        <section key={cat}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-300">{cat}</h3>
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
                  className={`relative min-h-16 rounded-xl border p-3 text-left active:scale-[0.98] disabled:cursor-not-allowed ${
                    qtd > 0 ? "border-gold-400 bg-gold-400/10" : "border-white/10 bg-petrol-900/80 hover:border-gold-500/60"
                  } ${esgotado ? "opacity-40" : ""}`}
                >
                  <span className="block text-sm font-semibold text-white">{p.nome}</span>
                  <span className="block text-sm text-gold-300">{formatarPreco(p.precoCentavos)}</span>
                  {esgotado && <span className="block text-xs text-mist/60">Esgotado</span>}
                  {qtd > 0 && (
                    <span className="bg-gold-metal absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-gold-ink">{qtd}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {linhas.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-gold-500/40 bg-petrol-900/90 p-4">
          <ul className="space-y-1 text-sm">
            {linhas.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-white">{l.qtd}× {l.nome}</span>
                <button type="button" onClick={() => mudar(l, -1)} aria-label={`Tirar um ${l.nome}`} className="h-8 w-8 rounded-full border border-white/20 text-white">−</button>
                <span className="w-20 text-right text-mist">{formatarPreco(l.qtd * l.precoCentavos)}</span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-white/10 pt-2 font-semibold text-white"><span>Neste lançamento</span><span>{formatarPreco(total)}</span></p>
          {estado.erro && <p role="alert" className="text-sm text-ember-400">{estado.erro}</p>}
          <button type="submit" disabled={pendente} className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110 disabled:opacity-50">
            {pendente ? "Lançando…" : `Lançar na comanda ${numero}`}
          </button>
        </div>
      )}
      {linhas.length === 0 && estado.erro && <p role="alert" className="text-sm text-ember-400">{estado.erro}</p>}
    </form>
  );
}
