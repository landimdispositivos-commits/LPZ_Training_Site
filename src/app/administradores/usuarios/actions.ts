"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { alterarPapel, PAPEIS } from "@/modules/usuarios";

const VOLTAR = "/administradores/usuarios";

// Só organizadores mudam perfis. Regras: ninguém muda o próprio perfil (evita
// a organização ficar sem nenhum organizador) e dar acesso administrativo
// exige marcar a confirmação.
export async function alterarPapelAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador"]);

  const dados = z
    .object({ usuarioId: z.string().min(1).max(100), papel: z.enum(PAPEIS) })
    .safeParse({ usuarioId: form.get("usuarioId"), papel: form.get("papel") });
  const voltar = String(form.get("voltar") ?? "");
  const destino = voltar.startsWith(`${VOLTAR}?`) || voltar === VOLTAR ? voltar : VOLTAR;
  const comAviso = (aviso: string) => `${destino}${destino.includes("?") ? "&" : "?"}${aviso}`;

  if (!dados.success) redirect(comAviso("erro=dados"));
  if (dados.data.usuarioId === user.id) redirect(comAviso("erro=proprio"));

  const alvo = await db.query.usuarios.findFirst({ where: eq(usuarios.id, dados.data.usuarioId) });
  if (!alvo) redirect(comAviso("erro=dados"));
  if (alvo.papel === dados.data.papel) redirect(destino);

  const viraAdmin = dados.data.papel === "organizador" || dados.data.papel === "portaria";
  if (viraAdmin && form.get("confirmo") !== "on") redirect(comAviso("erro=confirmar"));

  await alterarPapel(alvo.id, dados.data.papel);
  revalidatePath(VOLTAR);
  redirect(comAviso("ok=1"));
}
