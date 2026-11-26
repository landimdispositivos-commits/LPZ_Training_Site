"use server";

import { asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { caixasTexto } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { moverNaLista } from "@/lib/ordem";
import { caixaDaPagina, ehPaginaCaixas, PAGINAS_CAIXAS, type PaginaCaixas } from "@/modules/caixas";

// Caixas de texto (Serviços, Quem somos), editadas na própria página. Só a
// organização — conferido aqui, no servidor, a cada envio.
const opcional = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const caixaSchema = z.object({
  titulo: z.string().trim().min(1).max(80),
  tituloEn: opcional(80),
  tituloEs: opcional(80),
  texto: z.string().trim().max(5000),
  textoEn: opcional(5000),
  textoEs: opcional(5000),
  oculta: z.boolean(),
  temPagina: z.boolean(),
  detalhe: opcional(20000),
  detalheEn: opcional(20000),
  detalheEs: opcional(20000),
});

function lerPagina(form: FormData): PaginaCaixas {
  const pagina = form.get("pagina");
  return ehPaginaCaixas(pagina) ? pagina : "servicos";
}
const voltar = (pagina: PaginaCaixas) => `${PAGINAS_CAIXAS[pagina]}?editar=1`;

function ler(form: FormData) {
  const campo = (n: string) => String(form.get(n) ?? "");
  return caixaSchema.safeParse({
    titulo: campo("titulo"),
    tituloEn: campo("tituloEn"),
    tituloEs: campo("tituloEs"),
    texto: campo("texto"),
    textoEn: campo("textoEn"),
    textoEs: campo("textoEs"),
    oculta: form.get("oculta") === "on",
    // Página própria só existe em Serviços.
    temPagina: form.get("temPagina") === "on" && form.get("pagina") === "servicos",
    detalhe: campo("detalhe"),
    detalheEn: campo("detalheEn"),
    detalheEs: campo("detalheEs"),
  });
}

export async function criarCaixaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const pagina = lerPagina(form);
  const dados = ler(form);
  if (!dados.success) redirect(`${voltar(pagina)}&erro=1#nova-caixa`);
  const [{ maior }] = await db.select({ maior: max(caixasTexto.ordem) }).from(caixasTexto).where(eq(caixasTexto.pagina, pagina));
  const [nova] = await db
    .insert(caixasTexto)
    .values({ ...dados.data, pagina, ordem: (maior ?? 0) + 1 })
    .returning({ id: caixasTexto.id });
  revalidatePath(PAGINAS_CAIXAS[pagina]);
  redirect(`${voltar(pagina)}&ok=criado#caixa-${nova!.id}`);
}

export async function salvarCaixaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const pagina = lerPagina(form);
  const id = z.uuid().safeParse(form.get("id"));
  const dados = ler(form);
  if (!id.success) redirect(voltar(pagina));
  if (!dados.success) redirect(`${voltar(pagina)}&erro=1#caixa-${id.data}`);
  await db
    .update(caixasTexto)
    .set({ ...dados.data, atualizadoEm: new Date() })
    .where(caixaDaPagina(pagina, id.data));
  revalidatePath(PAGINAS_CAIXAS[pagina]);
  revalidatePath(`${PAGINAS_CAIXAS[pagina]}/${id.data}`);
  redirect(`${voltar(pagina)}&ok=salvo#caixa-${id.data}`);
}

// Remover é irreversível: só com a caixinha de confirmação marcada.
export async function removerCaixaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const pagina = lerPagina(form);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) redirect(voltar(pagina));
  if (form.get("confirmo") !== "on") redirect(`${voltar(pagina)}&erro=confirmar#caixa-${id.data}`);
  await db.delete(caixasTexto).where(caixaDaPagina(pagina, id.data));
  revalidatePath(PAGINAS_CAIXAS[pagina]);
  redirect(`${voltar(pagina)}&ok=removido`);
}

// Setinhas: troca a posição com a vizinha. Sem redirect (a tela não pula).
export async function moverCaixaAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const pagina = lerPagina(form);
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return;
  const direcao = form.get("direcao") === "cima" ? "cima" : "baixo";
  const atuais = await db
    .select({ id: caixasTexto.id })
    .from(caixasTexto)
    .where(eq(caixasTexto.pagina, pagina))
    .orderBy(asc(caixasTexto.ordem), asc(caixasTexto.criadoEm));
  const nova = moverNaLista(
    atuais.map((c) => c.id),
    id.data,
    direcao,
  );
  await db.transaction(async (tx) => {
    for (const [posicao, cid] of nova.entries()) {
      await tx.update(caixasTexto).set({ ordem: posicao + 1 }).where(eq(caixasTexto.id, cid));
    }
  });
  revalidatePath(PAGINAS_CAIXAS[pagina]);
}
