"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { CATEGORIAS, ROTA_CATEGORIA } from "@/modules/perfis";

// Edição pela "canetinha" nas páginas públicas de Professores e DJs.
// Só organização (Organizador/Acesso total, com duas etapas) — conferido aqui,
// no servidor, a cada envio.
const perfilSchema = z.object({
  id: z.uuid(),
  categoria: z.enum(CATEGORIAS),
  nome: z.string().trim().min(1, "Informe o nome.").max(100),
  bio: z.string().trim().max(2000).transform((v) => v || null),
  bioEn: z.string().trim().max(2000).transform((v) => v || null),
  instagram: z
    .string()
    .trim()
    .max(31)
    .regex(/^@?[A-Za-z0-9._]*$/)
    .transform((v) => (v ? (v.startsWith("@") ? v : `@${v}`) : null)),
});

export async function salvarPerfilAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const texto = (campo: string) => String(form.get(campo) ?? "");
  const dados = perfilSchema.safeParse({
    id: texto("id"),
    categoria: texto("categoria"),
    nome: texto("nome"),
    bio: texto("bio"),
    bioEn: texto("bioEn"),
    instagram: texto("instagram"),
  });
  const categoria = CATEGORIAS.find((c) => c === texto("categoria")) ?? "professor";
  const base = ROTA_CATEGORIA[categoria];
  if (!dados.success) redirect(`${base}/${encodeURIComponent(texto("id"))}?editar=1&erro=1`);

  const { id, nome, bio, bioEn, instagram } = dados.data;
  await db
    .update(professores)
    .set({ nome, bio, bioEn, instagram })
    .where(and(eq(professores.id, id), eq(professores.categoria, dados.data.categoria)));
  revalidatePath(base);
  revalidatePath(`${base}/${id}`);
  redirect(`${base}/${id}?ok=1`);
}
