"use client";

import { useFormStatus } from "react-dom";
import { useIdioma } from "@/i18n/cliente";

// Botão de envio que mostra "Salvando..." enquanto o servidor processa.
export function BotaoSalvar({ children, className }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const en = useIdioma() === "en";
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
      }
    >
      {pending ? (en ? "Saving..." : "Salvando...") : (children ?? (en ? "Save" : "Salvar"))}
    </button>
  );
}
