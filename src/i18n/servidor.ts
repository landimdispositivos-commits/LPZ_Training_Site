import { cookies } from "next/headers";
import { COOKIE_IDIOMA, ehIdioma, IDIOMA_PADRAO, type Idioma } from ".";

// Idioma escolhido pelo visitante (cookie). Sem escolha → português.
export async function obterIdioma(): Promise<Idioma> {
  const valor = (await cookies()).get(COOKIE_IDIOMA)?.value;
  return ehIdioma(valor) ? valor : IDIOMA_PADRAO;
}
