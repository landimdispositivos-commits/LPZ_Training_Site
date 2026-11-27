"use client";

import { useState } from "react";
import { retirarItensAction } from "../../caixa/actions";

type Item = { id: string; nome: string; quantidade: number; retirados: number };

// Retirada parcial: o balcão escolhe quantos de cada item entrega agora. O mesmo
// QR serve até acabar o saldo; tudo fica registrado (quem, quando, quanto).
export function Retirada({ codigo, itens }: { codigo: string; itens: Item[] }) {
  const [qtd, setQtd] = useState<Record<string, number>>({});
  const total = Object.values(qtd).reduce((s, n) => s + n, 0);

  function mudar(i: Item, delta: number) {
    const saldo = i.quantidade - i.retirados;
    setQtd((q) => ({ ...q, [i.id]: Math.max(0, Math.min((q[i.id] ?? 0) + delta, saldo)) }));
  }

  return (
    <form action={retirarItensAction} className="space-y-3 rounded-2xl border border-gold-500/40 bg-petrol-900/90 p-4 text-left">
      <input type="hidden" name="codigo" value={codigo} />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-300">Entregar agora</h2>
      <ul className="space-y-2">
        {itens.map((i) => {
          const saldo = i.quantidade - i.retirados;
          return (
            <li key={i.id} className={`flex items-center justify-between gap-2 ${saldo === 0 ? "opacity-50" : ""}`}>
              <span className="min-w-0 flex-1 text-sm text-white">
                {i.nome}
                <span className="block text-xs text-mist/60">retirados {i.retirados} de {i.quantidade} · restam {saldo}</span>
              </span>
              {saldo > 0 && (
                <span className="flex items-center gap-1">
                  <input type="hidden" name={`q-${i.id}`} value={qtd[i.id] ?? 0} />
                  <button type="button" onClick={() => mudar(i, -1)} aria-label={`Menos ${i.nome}`} className="h-10 w-10 rounded-full border border-white/25 text-lg text-white">−</button>
                  <span className="w-8 text-center text-lg font-bold text-white" aria-live="polite">{qtd[i.id] ?? 0}</span>
                  <button type="button" onClick={() => mudar(i, 1)} aria-label={`Mais ${i.nome}`} className="h-10 w-10 rounded-full border border-white/25 text-lg text-white">+</button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <button type="submit" disabled={total === 0} className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
        {total === 0 ? "Escolha quantos entregar" : `Confirmar entrega de ${total} ${total === 1 ? "item" : "itens"}`}
      </button>
      <button type="submit" name="tudo" value="1" className="w-full rounded-full border border-gold-500/60 py-2.5 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">
        Entregar tudo o que falta
      </button>
    </form>
  );
}
