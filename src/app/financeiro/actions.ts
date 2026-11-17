"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { lotes } from "@/db/schema";
import { dataHoraLocalParaDate, reaisParaCentavos } from "@/lib/formatar";
import { exigirAdmin } from "@/modules/auth/sessao";
import { TIPOS_PRODUTO, type TipoProduto } from "@/modules/ingressos/produtos";
import { reenviarTodosOsIngressos } from "@/modules/ingressos/emails";

// Só organizadores mexem em lotes. Autorização refeita em cada action.

const loteSchema = z
  .object({
    tipo: z.enum(TIPOS_PRODUTO as [TipoProduto, ...TipoProduto[]]),
    nome: z.string().trim().min(1, "Informe o nome do lote.").max(60),
    precoCentavos: z.number({ error: "Preço inválido." }).int().min(0).max(10_000_000),
    quantidadeTotal: z.number({ error: "Quantidade inválida." }).int().min(1).max(10_000),
    dataInicio: z.date().nullable(),
    dataFim: z.date().nullable(),
    ativo: z.boolean(),
  })
  .refine((l) => !l.dataInicio || !l.dataFim || l.dataInicio < l.dataFim, "O início precisa ser antes do fim.");

function lerLote(form: FormData) {
  const texto = (campo: string) => String(form.get(campo) ?? "");
  return loteSchema.safeParse({
    tipo: texto("tipo") || "full_pass",
    nome: texto("nome"),
    precoCentavos: reaisParaCentavos(texto("preco")) ?? Number.NaN,
    quantidadeTotal: Number.parseInt(texto("quantidadeTotal"), 10),
    dataInicio: dataHoraLocalParaDate(texto("dataInicio")),
    dataFim: dataHoraLocalParaDate(texto("dataFim")),
    ativo: form.get("ativo") === "on",
  });
}

export async function criarLoteAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const lote = lerLote(form);
  if (!lote.success) redirect("/financeiro?erro=lote");
  await db.insert(lotes).values(lote.data);
  revalidatePath("/financeiro");
  redirect("/financeiro?ok=lote-criado");
}

export async function editarLoteAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  const lote = lerLote(form);
  if (!id.success || !lote.success) redirect("/financeiro?erro=lote");

  const atual = await db.query.lotes.findFirst({ where: eq(lotes.id, id.data) });
  if (!atual) redirect("/financeiro?erro=lote");
  // Não deixa o total ficar abaixo do que já foi vendido/reservado.
  if (lote.data.quantidadeTotal < atual.quantidadeVendida) redirect("/financeiro?erro=quantidade");

  await db.update(lotes).set(lote.data).where(eq(lotes.id, id.data));
  revalidatePath("/financeiro");
  redirect("/financeiro?ok=lote-salvo");
}

// Envia de novo, para todos os compradores, o e-mail com o QR do ingresso
// (ex: alguns dias antes do evento). Ação em massa: exige digitar ENVIAR.
export async function reenviarIngressosAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  if (String(form.get("confirmacao") ?? "").trim().toUpperCase() !== "ENVIAR") redirect("/financeiro?erro=confirmar-envio");
  const { enviados } = await reenviarTodosOsIngressos();
  redirect(`/financeiro?ok=ingressos-enviados&qtd=${enviados}`);
}
