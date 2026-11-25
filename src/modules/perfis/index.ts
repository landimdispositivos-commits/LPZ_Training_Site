import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { professores } from "@/db/schema";

// Perfis públicos: casais de professores e DJs (mesma tabela, campo categoria).
export const CATEGORIAS = ["professor", "dj"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ROTA_CATEGORIA: Record<Categoria, string> = { professor: "/professores", dj: "/djs" };

export async function listarPerfis(categoria: Categoria) {
  return db
    .select()
    .from(professores)
    .where(eq(professores.categoria, categoria))
    .orderBy(asc(professores.ordem), asc(professores.nome));
}

export async function obterPerfil(categoria: Categoria, id: string) {
  return db.query.professores.findFirst({
    where: and(eq(professores.id, id), eq(professores.categoria, categoria)),
  });
}

// "@perfil" → link do Instagram. Só aceita nomes de usuário válidos.
export function linkInstagram(instagram: string | null | undefined) {
  const usuario = instagram?.replace(/^@/, "").trim();
  if (!usuario || !/^[A-Za-z0-9._]{1,30}$/.test(usuario)) return null;
  return `https://www.instagram.com/${usuario}/`;
}
