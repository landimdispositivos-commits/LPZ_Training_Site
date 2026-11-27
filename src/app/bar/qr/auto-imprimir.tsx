"use client";

import { useEffect } from "react";

// Abre a janela de impressão (onde também dá para "Salvar como PDF") ao entrar na página.
export function AutoImprimir() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 600);
    return () => clearTimeout(id);
  }, []);
  return null;
}
