"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { cronogramaItens } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";

// Aulas adicionadas/editadas direto na página pública do cronograma (só
// organização). A ordem na tela é sempre pelo horário de início.
const VOLTAR = "/cronograma?editar=1";
const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

const aulaSchema = z
  .object({
    dia: z.iso.date(),
    horarioInicio: z.string().regex(/^\d{2}:\d{2}$/),
    horarioFim: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    titulo: z.string().min(1).max(120),
    descricao: z.string().max(1000).nullable(),
    local: z.string().max(100).nullable(),
    professorId: z.uuid().nullable(),
  })
  .refine((a) => !a.horarioFim || a.horarioFim > a.horarioInicio, "O fim precisa ser depois do início.");

function atualizar() {
  revalidatePath("/cronograma");
  revalidatePath("/administradores/cronograma");
}

export async function salvarAulaPublicaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const dados = aulaSchema.safeParse({
    dia: texto(form, "dia"),
    horarioInicio: texto(form, "horarioInicio"),
    horarioFim: opcional(form, "horarioFim"),
    titulo: texto(form, "titulo"),
    descricao: opcional(form, "descricao"),
    local: opcional(form, "local"),
    professorId: opcional(form, "professorId"),
  });
  if (!dados.success) redirect(`${VOLTAR}&erro=aula#cronograma`);

  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) {
    await db.update(cronogramaItens).set(dados.data).where(eq(cronogramaItens.id, id.data));
  } else {
    await db.insert(cronogramaItens).values(dados.data);
  }
  atualizar();
  redirect(`${VOLTAR}&ok=aula#cronograma`);
}

export async function removerAulaPublicaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirmo") !== "on") redirect(`${VOLTAR}&erro=confirmar#cronograma`);
  await db.delete(cronogramaItens).where(eq(cronogramaItens.id, id.data));
  atualizar();
  redirect(`${VOLTAR}&ok=removida#cronograma`);
}
