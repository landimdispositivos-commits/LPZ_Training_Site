"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useIdioma } from "@/i18n/cliente";
import { tx } from "@/i18n";
import { formatarPreco } from "@/lib/formatar";
import { criarPedidoOnlineAction, type ResultadoPedido } from "./pedido/actions";

type Item = { id: string; nome: string; precoCentavos: number; categoria: string | null; esgotado: boolean };

// Cardápio com sacola: o cliente escolhe a quantidade, vê a sacola e paga pelo
// celular. A sacola fica salva só neste aparelho (localStorage) até o pagamento.
export function CardapioCompra({ itens, eventoId, semCategoria, logado }: { itens: Item[]; eventoId: string; semCategoria: string; logado: boolean }) {
  const idioma = useIdioma();
  const chave = `lpz-bar-sacola-${eventoId}`;
  const [sacola, setSacola] = useState<Record<string, number>>({});
  const [aberta, setAberta] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [estado, acao, pendente] = useActionState<ResultadoPedido, FormData>(criarPedidoOnlineAction, {});

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(chave) ?? "{}") as Record<string, number>;
      const validos = Object.fromEntries(Object.entries(salvo).filter(([id, q]) => itens.some((i) => i.id === id && !i.esgotado) && Number.isInteger(q) && q > 0));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSacola(validos);
    } catch {
      // sem armazenamento: a sacola vale só nesta visita
    }
    setPronto(true);
  }, [chave, itens]);

  useEffect(() => {
    if (!pronto) return;
    try {
      localStorage.setItem(chave, JSON.stringify(sacola));
    } catch {
      // ignora
    }
  }, [sacola, chave, pronto]);

  const linhas = useMemo(() => itens.filter((i) => sacola[i.id]).map((i) => ({ ...i, qtd: sacola[i.id] })), [itens, sacola]);
  const total = linhas.reduce((s, l) => s + l.qtd * l.precoCentavos, 0);
  const qtdTotal = linhas.reduce((s, l) => s + l.qtd, 0);
  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of itens) m.set(i.categoria ?? semCategoria, [...(m.get(i.categoria ?? semCategoria) ?? []), i]);
    return [...m.entries()];
  }, [itens, semCategoria]);

  function mudar(id: string, delta: number) {
    setSacola((s) => {
      const novo = Math.max(0, Math.min((s[id] ?? 0) + delta, 50));
      const resto = { ...s };
      if (novo > 0) resto[id] = novo;
      else delete resto[id];
      return resto;
    });
  }

  const T = {
    sacola: tx(idioma, "Sacola", "Bag", "Bolsa"),
    itens: (n: number) => tx(idioma, n === 1 ? "item" : "itens", n === 1 ? "item" : "items", n === 1 ? "artículo" : "artículos"),
    add: tx(idioma, "Adicionar", "Add", "Agregar"),
    esgotado: tx(idioma, "Esgotado", "Sold out", "Agotado"),
    ver: tx(idioma, "Ver sacola e pagar", "View bag and pay", "Ver bolsa y pagar"),
    pagar: tx(idioma, "Pagar com Pix ou cartão", "Pay with Pix or card", "Pagar con Pix o tarjeta"),
    limpar: tx(idioma, "Esvaziar sacola", "Empty bag", "Vaciar bolsa"),
    fechar: tx(idioma, "Fechar", "Close", "Cerrar"),
    total: tx(idioma, "Total", "Total", "Total"),
    entrar: tx(idioma, "Entrar para pagar", "Sign in to pay", "Iniciar sesión para pagar"),
    entrarTexto: tx(idioma, "Para finalizar o pedido você precisa entrar ou criar sua conta. Sua sacola fica guardada.", "To place your order you need to sign in or create an account. Your bag is saved.", "Para finalizar el pedido debes iniciar sesión o crear tu cuenta. Tu bolsa queda guardada."),
    reserva: tx(idioma, "Ao pagar, você recebe um QR code para retirar no balcão do bar. Os itens ficam reservados por 15 minutos.", "After paying you get a QR code to pick up at the bar counter. Items are held for 15 minutes.", "Al pagar recibes un código QR para retirar en el mostrador del bar. Los artículos quedan reservados 15 minutos."),
    processando: tx(idioma, "Reservando…", "Reserving…", "Reservando…"),
  };

  return (
    <div className="pb-28">
      {grupos.map(([cat, lista]) => (
        <section key={cat} className="mb-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{cat}</h2>
          <ul className="mt-3 divide-y divide-white/10">
            {lista.map((i) => {
              const qtd = sacola[i.id] ?? 0;
              return (
                <li key={i.id} className={`flex items-center justify-between gap-3 py-3 ${i.esgotado ? "opacity-50" : ""}`}>
                  <span className="min-w-0">
                    <span className="block text-white">{i.nome}</span>
                    <span className="block text-sm font-semibold text-gold-300">{formatarPreco(i.precoCentavos, idioma)}</span>
                  </span>
                  {i.esgotado ? (
                    <span className="rounded-full bg-ember-500/15 px-3 py-1 text-xs font-semibold text-ember-400">{T.esgotado}</span>
                  ) : qtd === 0 ? (
                    <button type="button" onClick={() => mudar(i.id, 1)} className="bg-gold-metal h-10 rounded-full px-5 text-sm font-semibold text-gold-ink hover:brightness-110">
                      {T.add}
                    </button>
                  ) : (
                    <span className="flex items-center gap-2">
                      <button type="button" onClick={() => mudar(i.id, -1)} aria-label={`−1 ${i.nome}`} className="h-10 w-10 rounded-full border border-white/25 text-lg text-white">−</button>
                      <span className="w-6 text-center font-semibold text-white" aria-live="polite">{qtd}</span>
                      <button type="button" onClick={() => mudar(i.id, 1)} aria-label={`+1 ${i.nome}`} className="h-10 w-10 rounded-full border border-white/25 text-lg text-white">+</button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {qtdTotal > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/40 bg-petrol-950/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="text-sm text-mist">
              {T.sacola}: <strong className="text-white">{qtdTotal} {T.itens(qtdTotal)}</strong> · <strong className="text-gold-300">{formatarPreco(total, idioma)}</strong>
            </p>
            <button type="button" onClick={() => setAberta(true)} className="bg-gold-metal h-11 rounded-full px-5 text-sm font-semibold text-gold-ink hover:brightness-110">
              {T.ver}
            </button>
          </div>
        </div>
      )}

      {aberta && qtdTotal > 0 && (
        <div role="dialog" aria-modal="true" aria-label={T.sacola} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <form action={acao} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl border border-gold-500/40 bg-petrol-900 p-5 sm:rounded-2xl">
            <input type="hidden" name="carrinho" value={JSON.stringify(linhas.map((l) => ({ produtoId: l.id, quantidade: l.qtd })))} />
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{T.sacola}</h2>
              <button type="button" onClick={() => setAberta(false)} className="text-sm text-mist/70 hover:text-white">{T.fechar}</button>
            </div>
            <ul className="divide-y divide-white/10 text-sm">
              {linhas.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate text-white">{l.nome}</span>
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={() => mudar(l.id, -1)} aria-label={`−1 ${l.nome}`} className="h-9 w-9 rounded-full border border-white/25 text-white">−</button>
                    <span className="w-6 text-center font-semibold text-white">{l.qtd}</span>
                    <button type="button" onClick={() => mudar(l.id, 1)} aria-label={`+1 ${l.nome}`} className="h-9 w-9 rounded-full border border-white/25 text-white">+</button>
                  </span>
                  <span className="w-20 text-right text-mist">{formatarPreco(l.qtd * l.precoCentavos, idioma)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-white/10 pt-3 text-lg font-extrabold text-white"><span>{T.total}</span><span className="text-gold-300">{formatarPreco(total, idioma)}</span></p>
            <p className="text-xs text-mist/60">{T.reserva}</p>
            {estado.erro && <p role="alert" className="text-sm text-ember-400">{estado.erro}</p>}
            {logado ? (
              <button type="submit" disabled={pendente} className="bg-gold-metal h-12 w-full rounded-full font-semibold text-gold-ink hover:brightness-110 disabled:opacity-60">
                {pendente ? T.processando : T.pagar}
              </button>
            ) : (
              <>
                <p className="text-sm text-mist">{T.entrarTexto}</p>
                <a href="/congressistas?proximo=%2Fbar" className="bg-gold-metal flex h-12 w-full items-center justify-center rounded-full font-semibold text-gold-ink hover:brightness-110">{T.entrar}</a>
              </>
            )}
            <button type="button" onClick={() => { setSacola({}); setAberta(false); }} className="w-full text-center text-xs text-mist/60 hover:text-white">{T.limpar}</button>
          </form>
        </div>
      )}
    </div>
  );
}
