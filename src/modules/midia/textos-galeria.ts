import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import type { Idioma } from "@/i18n";

// Título e descrição das caixas da Galeria (Vídeos, Fotos, Paparazzi),
// editados pela organização/Mídias na própria página. Guardados como JSON em
// configuracoes; o que não foi editado usa o texto padrão abaixo.
export const SECOES_GALERIA = ["videos", "fotos", "paparazzi"] as const;
export type SecaoGaleria = (typeof SECOES_GALERIA)[number];
export const CHAVE_TEXTOS_GALERIA = "galeria_caixas";

export interface TextoCaixaGaleria {
  titulo: string;
  tituloEn: string | null;
  tituloEs: string | null;
  texto: string;
  textoEn: string | null;
  textoEs: string | null;
}

export const PADRAO_GALERIA: Record<SecaoGaleria, TextoCaixaGaleria> = {
  videos: { titulo: "Vídeos", tituloEn: "Videos", tituloEs: "Videos", texto: "Vídeos e músicas do LPZ.", textoEn: "LPZ videos and music.", textoEs: "Videos y música de LPZ." },
  fotos: { titulo: "Fotos", tituloEn: "Photos", tituloEs: "Fotos", texto: "Fotos dos eventos.", textoEn: "Photos from the events.", textoEs: "Fotos de los eventos." },
  paparazzi: {
    titulo: "Paparazzi",
    tituloEn: "Paparazzi",
    tituloEs: "Paparazzi",
    texto: "Seus melhores momentos dançando, em vídeo e foto.",
    textoEn: "Your best dancing moments, on video and in photos.",
    textoEs: "Tus mejores momentos bailando, en video y en fotos.",
  },
};

export async function obterTextosGaleria(): Promise<Record<SecaoGaleria, TextoCaixaGaleria>> {
  const [linha] = await db.select().from(configuracoes).where(eq(configuracoes.chave, CHAVE_TEXTOS_GALERIA)).limit(1);
  let salvos: Partial<Record<SecaoGaleria, Partial<TextoCaixaGaleria>>> = {};
  try {
    salvos = linha ? JSON.parse(linha.valor) : {};
  } catch {
    salvos = {};
  }
  const resultado = {} as Record<SecaoGaleria, TextoCaixaGaleria>;
  for (const secao of SECOES_GALERIA) resultado[secao] = { ...PADRAO_GALERIA[secao], ...(salvos[secao] ?? {}) };
  return resultado;
}

export async function salvarTextosGaleria(textos: Record<SecaoGaleria, TextoCaixaGaleria>) {
  const agora = new Date();
  const valor = JSON.stringify(textos);
  await db
    .insert(configuracoes)
    .values({ chave: CHAVE_TEXTOS_GALERIA, valor, atualizadoEm: agora })
    .onConflictDoUpdate({ target: configuracoes.chave, set: { valor, atualizadoEm: agora } });
}

// No idioma do visitante; sem tradução, usa o português.
export function textoGaleriaNoIdioma(c: TextoCaixaGaleria, idioma: Idioma) {
  if (idioma === "en") return { titulo: c.tituloEn || c.titulo, texto: c.textoEn || c.texto };
  if (idioma === "es") return { titulo: c.tituloEs || c.titulo, texto: c.textoEs || c.texto };
  return { titulo: c.titulo, texto: c.texto };
}
