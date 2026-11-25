"use client";

import { createContext, useContext } from "react";
import { IDIOMA_PADRAO, type Idioma } from ".";

// Leva o idioma (lido no servidor, no layout) até os componentes de cliente.
const ContextoIdioma = createContext<Idioma>(IDIOMA_PADRAO);

export function ProvedorIdioma({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  return <ContextoIdioma.Provider value={idioma}>{children}</ContextoIdioma.Provider>;
}

export function useIdioma(): Idioma {
  return useContext(ContextoIdioma);
}
