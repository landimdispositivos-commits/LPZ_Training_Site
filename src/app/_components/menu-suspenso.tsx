"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// <details> que fecha sozinho: ao clicar fora, ao apertar Esc, ao escolher
// um item e ao mudar de página. Sem JavaScript continua abrindo/fechando
// pelo próprio <details>.
export function MenuSuspenso({
  resumo,
  resumoClassName,
  children,
  className = "group relative",
}: {
  resumo: React.ReactNode;
  resumoClassName: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const caminho = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [caminho]);

  useEffect(() => {
    function fecharSeFora(e: PointerEvent) {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    }
    function fecharNoEsc(e: KeyboardEvent) {
      const el = ref.current;
      if (e.key === "Escape" && el?.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", fecharSeFora);
    document.addEventListener("keydown", fecharNoEsc);
    return () => {
      document.removeEventListener("pointerdown", fecharSeFora);
      document.removeEventListener("keydown", fecharNoEsc);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      <summary className={resumoClassName}>{resumo}</summary>
      <div
        onClick={(e) => {
          // Clicou num link do menu: fecha.
          if ((e.target as HTMLElement).closest("a") && ref.current) ref.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
