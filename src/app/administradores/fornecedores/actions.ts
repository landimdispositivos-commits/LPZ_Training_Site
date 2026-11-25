"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { fornecedores } from "@/db/schema";
import { reaisParaCentavos } from "@/lib/formatar";
import { exigirAdmin } from "@/modules/auth/sessao";
import { CATEGORIAS, LISTA_STATUS } from "@/modules/fornecedores";

const VOLTAR = "/administradores/fornecedores";
const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

const fornecedorSchema = z.object({
  nome: z.string().min(1).max(120),
  categoria: z.enum(CATEGORIAS),
  status: z.enum(LISTA_STATUS as [string, ...string[]]),
  contato: z.string().max(120).nullable(),
  telefone: z.string().max(40).nullable(),
  email: z.email().max(200).nullable(),
  site: z.string().max(300).nullable(),
  valorCentavos: z.number().int().min(0).max(100_000_000).nullable(),
  observacoes: z.string().max(2000).nullable(),
});

export async function salvarFornecedorAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const valor = opcional(form, "valor");
  const dados = fornecedorSchema.safeParse({
    nome: texto(form, "nome"),
    categoria: texto(form, "categoria"),
    status: texto(form, "status") || "cotacao",
    contato: opcional(form, "contato"),
    telefone: opcional(form, "telefone"),
    email: opcional(form, "email"),
    site: opcional(form, "site"),
    valorCentavos: valor === null ? null : (reaisParaCentavos(valor) ?? Number.NaN),
    observacoes: opcional(form, "observacoes"),
  });
  if (!dados.success) redirect(`${VOLTAR}?erro=dados`);

  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) {
    await db.update(fornecedores).set({ ...dados.data, atualizadoEm: new Date() }).where(eq(fornecedores.id, id.data));
  } else {
    await db.insert(fornecedores).values(dados.data);
  }
  revalidatePath(VOLTAR);
  redirect(`${VOLTAR}?ok=salvo`);
}

export async function removerFornecedorAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirmo") !== "on") redirect(`${VOLTAR}?erro=confirmar`);
  await db.delete(fornecedores).where(eq(fornecedores.id, id.data));
  revalidatePath(VOLTAR);
  redirect(`${VOLTAR}?ok=removido`);
}
