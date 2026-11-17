"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { storageAdapter } from "@/modules/midia";
import { caminhoDaUrl } from "@/modules/midia/imagem";

// Cronograma e professores — só organizadores. Autorização refeita em cada
// action (server actions aceitam POST direto).

const VOLTAR = "/administradores/conteudo";
const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

function atualizarSite() {
  revalidatePath("/");
  revalidatePath(VOLTAR);
}

// ---------------------------------------------------------------- professores

const professorSchema = z.object({
  nome: z.string().min(1).max(100),
  bio: z.string().max(1000).nullable(),
  instagram: z
    .string()
    .max(60)
    .regex(/^@?[A-Za-z0-9._]+$/)
    .transform((v) => (v.startsWith("@") ? v : `@${v}`))
    .nullable(),
  ordem: z.number().int().min(0).max(999),
});

function lerProfessor(form: FormData) {
  return professorSchema.safeParse({
    nome: texto(form, "nome"),
    bio: opcional(form, "bio"),
    instagram: opcional(form, "instagram"),
    ordem: Number.parseInt(texto(form, "ordem") || "0", 10),
  });
}

export async function salvarProfessorAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const dados = lerProfessor(form);
  if (!dados.success) redirect(`${VOLTAR}?erro=professor`);

  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) {
    await db.update(professores).set(dados.data).where(eq(professores.id, id.data));
  } else {
    await db.insert(professores).values(dados.data);
  }
  atualizarSite();
  redirect(`${VOLTAR}?ok=professor`);
}

export async function removerProfessorAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirmo") !== "on") redirect(`${VOLTAR}?erro=confirmar`);

  // FKs com "set null": aulas e conta do profissional ficam sem vínculo.
  const [removido] = await db.delete(professores).where(eq(professores.id, id.data)).returning({ fotoUrl: professores.fotoUrl });
  const foto = caminhoDaUrl(removido?.fotoUrl);
  if (foto) await storageAdapter.remover(foto);
  atualizarSite();
  redirect(`${VOLTAR}?ok=removido`);
}

// ----------------------------------------------------------------- cronograma

const aulaSchema = z
  .object({
    dia: z.iso.date(),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    titulo: z.string().min(1).max(120),
    descricao: z.string().max(1000).nullable(),
    local: z.string().max(100).nullable(),
    professorId: z.uuid().nullable(),
    ordem: z.number().int().min(0).max(999),
  })
  .refine((a) => !a.horarioFim || a.horarioFim > a.horarioInicio, "O fim precisa ser depois do início.");

export async function salvarAulaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const dados = aulaSchema.safeParse({
    dia: texto(form, "dia"),
    horarioInicio: texto(form, "horarioInicio"),
    horarioFim: opcional(form, "horarioFim"),
    titulo: texto(form, "titulo"),
    descricao: opcional(form, "descricao"),
    local: opcional(form, "local"),
    professorId: opcional(form, "professorId"),
    ordem: Number.parseInt(texto(form, "ordem") || "0", 10),
  });
  if (!dados.success) redirect(`${VOLTAR}?erro=aula#cronograma`);

  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) {
    await db.update(cronogramaItens).set(dados.data).where(eq(cronogramaItens.id, id.data));
  } else {
    await db.insert(cronogramaItens).values(dados.data);
  }
  atualizarSite();
  redirect(`${VOLTAR}?ok=aula#cronograma`);
}

export async function removerAulaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirmo") !== "on") redirect(`${VOLTAR}?erro=confirmar#cronograma`);
  await db.delete(cronogramaItens).where(eq(cronogramaItens.id, id.data));
  atualizarSite();
  redirect(`${VOLTAR}?ok=removido#cronograma`);
}
