"use client";

import { useEffect } from "react";

// Depois de criar o pedido, a sacola deste aparelho já foi para o pagamento: esvazia.
export function LimparSacola({ eventoId }: { eventoId: string }) {
  useEffect(() => {
    try {
      localStorage.removeItem(`lpz-bar-sacola-${eventoId}`);
    } catch {
      // sem armazenamento: nada a limpar
    }
  }, [eventoId]);
  return null;
}
