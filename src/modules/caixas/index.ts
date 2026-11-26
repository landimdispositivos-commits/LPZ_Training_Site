import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { caixasTexto } from "@/db/schema";
import type { Idioma } from "@/i18n";

// Páginas com caixas de texto editáveis pela organização e o endereço de cada uma.
export const PAGINAS_CAIXAS = { servicos: "/servicos", quem_somos: "/quem-somos", jack_and_jill: "/jack-and-jill" } as const;
export type PaginaCaixas = keyof typeof PAGINAS_CAIXAS;
export type Caixa = typeof caixasTexto.$inferSelect;

export function ehPaginaCaixas(v: unknown): v is PaginaCaixas {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(PAGINAS_CAIXAS, v);
}

export function caixasDaPagina(pagina: PaginaCaixas) {
  return db
    .select()
    .from(caixasTexto)
    .where(eq(caixasTexto.pagina, pagina))
    .orderBy(asc(caixasTexto.ordem), asc(caixasTexto.criadoEm));
}

export function caixaDaPagina(pagina: PaginaCaixas, id: string) {
  return and(eq(caixasTexto.pagina, pagina), eq(caixasTexto.id, id));
}

// Título e texto no idioma do visitante (sem tradução, usa o português).
export function caixaNoIdioma(c: Caixa, idioma: Idioma) {
  if (idioma === "en") return { titulo: c.tituloEn || c.titulo, texto: c.textoEn || c.texto };
  if (idioma === "es") return { titulo: c.tituloEs || c.titulo, texto: c.textoEs || c.texto };
  return { titulo: c.titulo, texto: c.texto };
}

// Conteúdo da página própria da caixa (sem texto próprio, usa o da caixa).
export function detalheNoIdioma(c: Caixa, idioma: Idioma) {
  const { texto } = caixaNoIdioma(c, idioma);
  if (idioma === "en") return c.detalheEn || c.detalhe || texto;
  if (idioma === "es") return c.detalheEs || c.detalhe || texto;
  return c.detalhe || texto;
}

export async function caixaPorId(pagina: PaginaCaixas, id: string) {
  const [caixa] = await db.select().from(caixasTexto).where(caixaDaPagina(pagina, id)).limit(1);
  return caixa ?? null;
}
