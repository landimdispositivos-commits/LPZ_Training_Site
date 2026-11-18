"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { obterSessao } from "@/modules/auth/sessao";
import { normalizarApelido } from "@/modules/perfil/apelido";

export type ResultadoApelido = { ok?: boolean; erro?: "tamanho" | "sessao" };

// Server action pública: confere a sessão e só altera o próprio usuário.
export async function salvarApelidoAction(_: ResultadoApelido, form: FormData): Promise<ResultadoApelido> {
  const sessao = await obterSessao();
  if (!sessao) return { erro: "sessao" };
  const r = normalizarApelido(form.get("apelido"));
  if (!r.ok) return { erro: "tamanho" };
  await db.update(usuarios).set({ apelido: r.apelido }).where(eq(usuarios.id, sessao.user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}
