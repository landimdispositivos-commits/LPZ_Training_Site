"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { midia } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { storageAdapter } from "@/modules/midia";
import { extrairIdYoutube } from "@/modules/midia/youtube";

const VOLTAR = "/administradores/galeria";

export async function adicionarVideoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = extrairIdYoutube(String(form.get("url") ?? ""));
  if (!id) redirect(`${VOLTAR}?erro=video`);
  const titulo = String(form.get("titulo") ?? "").trim().slice(0, 120) || null;
  await db.insert(midia).values({ tipo: "video", referencia: id, titulo });
  revalidatePath("/galeria");
  redirect(`${VOLTAR}?ok=video`);
}

export async function removerMidiaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect(VOLTAR);
  const [removida] = await db.delete(midia).where(eq(midia.id, id.data)).returning();
  if (removida?.tipo === "foto") await storageAdapter.remover(removida.referencia);
  revalidatePath("/galeria");
  redirect(`${VOLTAR}?ok=removida`);
}
