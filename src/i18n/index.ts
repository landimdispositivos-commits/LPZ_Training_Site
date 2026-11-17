// Idiomas do site (português e inglês). Sem dependência externa: cada tela
// guarda seus textos nos dois idiomas, e o idioma escolhido fica num cookie.
// Este arquivo não usa nada de servidor, então serve para qualquer componente.

export const IDIOMAS = ["pt", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PADRAO: Idioma = "pt";
export const COOKIE_IDIOMA = "lpz_idioma";

// Locale usado em datas, números e no atributo lang da página.
export const LOCALE: Record<Idioma, string> = { pt: "pt-BR", en: "en-US" };

export function ehIdioma(valor: unknown): valor is Idioma {
  return valor === "pt" || valor === "en";
}

// Textos de uma tela nos dois idiomas. O inglês precisa ter exatamente as
// mesmas chaves do português — se faltar alguma, o TypeScript avisa.
export function traducoes<T>(pt: T, en: NoInfer<T>): Record<Idioma, T> {
  return { pt, en };
}
