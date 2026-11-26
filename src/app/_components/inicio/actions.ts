"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { linkValido } from "@/modules/midia/links-drive";
import { CHAVE_LINK_PARTY } from "@/modules/midia/link-party";

// Salva (ou apaga, se vazio) o link do botão "LPZ Party". Só https.
export async function salvarLinkPartyAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const link = String(form.get("link") ?? "").trim();
  if (link && !linkValido(link)) redirect("/?editar=party&erro=1#lpz-party");
  const agora = new Date();
  await db
    .insert(configuracoes)
    .values({ chave: CHAVE_LINK_PARTY, valor: link, atualizadoEm: agora })
    .onConflictDoUpdate({ target: configuracoes.chave, set: { valor: link, atualizadoEm: agora } });
  revalidatePath("/");
  redirect("/?salvo=party#lpz-party");
}
