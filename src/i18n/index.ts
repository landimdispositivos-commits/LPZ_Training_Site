// Idiomas do site (português, inglês e espanhol). Sem dependência externa:
// cada tela guarda seus textos nos três idiomas, e o idioma escolhido fica
// num cookie. Este arquivo não usa nada de servidor (serve para qualquer
// componente).

export const IDIOMAS = ["pt", "en", "es"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PADRAO: Idioma = "pt";
export const COOKIE_IDIOMA = "lpz_idioma";

// Locale usado em datas, números e no atributo lang da página.
export const LOCALE: Record<Idioma, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

export function ehIdioma(valor: unknown): valor is Idioma {
  return valor === "pt" || valor === "en" || valor === "es";
}

// Textos de uma tela nos três idiomas. Inglês e espanhol precisam ter
// exatamente as mesmas chaves do português — se faltar alguma, o TypeScript avisa.
export function traducoes<T>(pt: T, en: NoInfer<T>, es: NoInfer<T>): Record<Idioma, T> {
  return { pt, en, es };
}

// Escolhe o texto do idioma: tx(idioma, "português", "english", "español").
export function tx<T>(idioma: Idioma, pt: T, en: T, es: T): T {
  return idioma === "en" ? en : idioma === "es" ? es : pt;
}
