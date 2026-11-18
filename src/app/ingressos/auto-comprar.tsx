"use client";

import { useEffect, useRef } from "react";

// Depois do login (vindo de uma caixinha), segue sozinho para o pagamento do
// produto escolhido. Envia o formulário de compra uma única vez por produto
// nesta aba — se a pessoa voltar ou desistir, não dispara de novo.
export function AutoComprar({ formId, tipo }: { formId: string; tipo: string }) {
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current) return;
    const chave = `lpz-auto-comprar-${tipo}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      // Sem sessionStorage: segue sem a trava.
    }
    enviado.current = true;
    (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
  }, [formId, tipo]);
  return null;
}
