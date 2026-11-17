"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { midia } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { storageAdapter } from "@/modules/midia";
import { urlEmbedAudio } from "@/modules/midia/audio";
import { extrairIdYoutube } from "@/modules/midia/youtube";

const FOTOS = "/administradores/galeria";
const AUDIO_VIDEO = "/administradores/audio-video";

export async function adicionarVideoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = extrairIdYoutube(String(form.get("url") ?? ""));
  if (!id) redirect(`${AUDIO_VIDEO}?erro=video`);
  const titulo = String(form.get("titulo") ?? "").trim().slice(0, 120) || null;
  await db.insert(midia).values({ tipo: "video", referencia: id, titulo });
  revalidatePath("/galeria");
  redirect(`${AUDIO_VIDEO}?ok=video`);
}

export async function adicionarAudioAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const embed = urlEmbedAudio(String(form.get("url") ?? ""));
  if (!embed) redirect(`${AUDIO_VIDEO}?erro=audio`);
  const titulo = String(form.get("titulo") ?? "").trim().slice(0, 120) || null;
  await db.insert(midia).values({ tipo: "audio", referencia: embed, titulo });
  revalidatePath("/galeria");
  redirect(`${AUDIO_VIDEO}?ok=audio`);
}

export async function removerMidiaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const voltar = form.get("voltar") === AUDIO_VIDEO ? AUDIO_VIDEO : FOTOS;
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect(voltar);
  const [removida] = await db.delete(midia).where(eq(midia.id, id.data)).returning();
  if (removida?.tipo === "foto") await storageAdapter.remover(removida.referencia);
  revalidatePath("/galeria");
  redirect(`${voltar}?ok=removida`);
}
