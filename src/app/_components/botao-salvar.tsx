"use client";

import { useFormStatus } from "react-dom";

// Botão de envio que mostra "Salvando..." enquanto o servidor processa.
export function BotaoSalvar({ children = "Salvar", className }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      }
    >
      {pending ? "Salvando..." : children}
    </button>
  );
}
