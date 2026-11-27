"use client";

export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full border border-gold-500/60 px-4 py-2 font-semibold text-gold-300 hover:bg-gold-500/10">
      Imprimir ticket
    </button>
  );
}
