"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { CHAVE_DRIVE, linkValido, SECOES_DRIVE, type SecaoDrive } from "@/modules/midia/links-drive";

// Canetinha da galeria: salva (ou apaga, se vazio) o link do Google Drive.
export async function salvarLinkDriveAction(form: FormData) {
  await exigirAdmin(["organizador", "midias"]);
  const secao = SECOES_DRIVE.find((s) => s === form.get("secao")) as SecaoDrive | undefined;
  if (!secao) return redirect("/galeria");
  const link = String(form.get("link") ?? "").trim();
  if (link && !linkValido(link)) redirect(`/galeria/${secao}?editar=1&erro=1#editar-drive`);

  const agora = new Date();
  await db
    .insert(configuracoes)
    .values({ chave: CHAVE_DRIVE[secao], valor: link, atualizadoEm: agora })
    .onConflictDoUpdate({ target: configuracoes.chave, set: { valor: link, atualizadoEm: agora } });
  revalidatePath(`/galeria/${secao}`);
  redirect(`/galeria/${secao}?salvo=1`);
}
