import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";

// Link da pasta do Google Drive (ou outro álbum) de cada seção da galeria,
// editado pela organização na própria página (canetinha).
export const SECOES_DRIVE = ["videos", "fotos"] as const;
export type SecaoDrive = (typeof SECOES_DRIVE)[number];
export const CHAVE_DRIVE: Record<SecaoDrive, string> = { videos: "galeria_drive_videos", fotos: "galeria_drive_fotos" };

export async function obterLinksDrive(): Promise<Record<SecaoDrive, string | null>> {
  const linhas = await db
    .select()
    .from(configuracoes)
    .where(inArray(configuracoes.chave, Object.values(CHAVE_DRIVE)));
  const valor = (chave: string) => linhas.find((l) => l.chave === chave)?.valor || null;
  return { videos: valor(CHAVE_DRIVE.videos), fotos: valor(CHAVE_DRIVE.fotos) };
}

// Aceita só endereço https (evita links "javascript:" e afins).
export function linkValido(valor: string) {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && valor.length <= 500;
  } catch {
    return false;
  }
}
