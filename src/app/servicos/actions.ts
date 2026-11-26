"use server";

import { asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { servicos } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { moverNaLista } from "@/lib/ordem";

// Caixas da página Serviços, editadas na própria página (só organização).
const VOLTAR = "/servicos?editar=1";
const opcional = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const servicoSchema = z.object({
  titulo: z.string().trim().min(1).max(80),
  tituloEn: opcional(80),
  tituloEs: opcional(80),
  texto: z.string().trim().max(3000),
  textoEn: opcional(3000),
  textoEs: opcional(3000),
});

function ler(form: FormData) {
  const campo = (n: string) => String(form.get(n) ?? "");
  return servicoSchema.safeParse({
    titulo: campo("titulo"),
    tituloEn: campo("tituloEn"),
    tituloEs: campo("tituloEs"),
    texto: campo("texto"),
    textoEn: campo("textoEn"),
    textoEs: campo("textoEs"),
  });
}

export async function criarServicoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const dados = ler(form);
  if (!dados.success) redirect(`${VOLTAR}&erro=1#novo-servico`);
  const [{ maior }] = await db.select({ maior: max(servicos.ordem) }).from(servicos);
  const [novo] = await db
    .insert(servicos)
    .values({ ...dados.data, ordem: (maior ?? 0) + 1 })
    .returning({ id: servicos.id });
  revalidatePath("/servicos");
  redirect(`${VOLTAR}&ok=criado#servico-${novo!.id}`);
}

export async function salvarServicoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  const dados = ler(form);
  if (!id.success) redirect(VOLTAR);
  if (!dados.success) redirect(`${VOLTAR}&erro=1#servico-${id.data}`);
  await db.update(servicos).set({ ...dados.data, atualizadoEm: new Date() }).where(eq(servicos.id, id.data));
  revalidatePath("/servicos");
  redirect(`${VOLTAR}&ok=salvo#servico-${id.data}`);
}

// Remover é irreversível: só com a caixinha de confirmação marcada.
export async function removerServicoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect(VOLTAR);
  if (form.get("confirmo") !== "on") redirect(`${VOLTAR}&erro=confirmar#servico-${id.data}`);
  await db.delete(servicos).where(eq(servicos.id, id.data));
  revalidatePath("/servicos");
  redirect(`${VOLTAR}&ok=removido`);
}

// Setinhas ◀ ▶: troca a posição com a vizinha. Sem redirect (a tela não pula).
export async function moverServicoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  const direcao = form.get("direcao") === "cima" ? "cima" : "baixo";
  const atuais = await db.select({ id: servicos.id }).from(servicos).orderBy(asc(servicos.ordem), asc(servicos.criadoEm));
  const nova = moverNaLista(
    atuais.map((s) => s.id),
    id.data,
    direcao,
  );
  await db.transaction(async (tx) => {
    for (const [posicao, sid] of nova.entries()) {
      await tx.update(servicos).set({ ordem: posicao + 1 }).where(eq(servicos.id, sid));
    }
  });
  revalidatePath("/servicos");
}
