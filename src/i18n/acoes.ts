"use server";

import { cookies } from "next/headers";
import { COOKIE_IDIOMA, ehIdioma } from ".";

// Grava a escolha de idioma por 1 ano. Não é dado pessoal: só "pt" ou "en".
export async function trocarIdiomaAction(idioma: string) {
  if (!ehIdioma(idioma)) return;
  (await cookies()).set(COOKIE_IDIOMA, idioma, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
