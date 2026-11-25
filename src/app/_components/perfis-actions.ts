"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { CATEGORIAS, ROTA_CATEGORIA } from "@/modules/perfis";
import { moverNaLista } from "@/lib/ordem";
import { storageAdapter } from "@/modules/midia";
import { caminhoDaUrl, ErroImagem, salvarFotoDoFormulario } from "@/modules/midia/imagem";

// Edição pela "canetinha" nas páginas públicas de Professores e DJs.
// Só organização (Organizador/Acesso total, com duas etapas) — conferido aqui,
// no servidor, a cada envio.
const perfilSchema = z.object({
  id: z.uuid(),
  categoria: z.enum(CATEGORIAS),
  nome: z.string().trim().min(1, "Informe o nome.").max(100),
  bio: z.string().trim().max(2000).transform((v) => v || null),
  bioEn: z.string().trim().max(2000).transform((v) => v || null),
  instagram: z
    .string()
    .trim()
    .max(31)
    .regex(/^@?[A-Za-z0-9._]*$/)
    .transform((v) => (v ? (v.startsWith("@") ? v : `@${v}`) : null)),
});

export async function salvarPerfilAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const texto = (campo: string) => String(form.get(campo) ?? "");
  const dados = perfilSchema.safeParse({
    id: texto("id"),
    categoria: texto("categoria"),
    nome: texto("nome"),
    bio: texto("bio"),
    bioEn: texto("bioEn"),
    instagram: texto("instagram"),
  });
  const categoria = CATEGORIAS.find((c) => c === texto("categoria")) ?? "professor";
  const base = ROTA_CATEGORIA[categoria];
  if (!dados.success) redirect(`${base}/${encodeURIComponent(texto("id"))}?editar=1&erro=1`);

  const { id, nome, bio, bioEn, instagram } = dados.data;
  const atual = await db.query.professores.findFirst({
    where: and(eq(professores.id, id), eq(professores.categoria, dados.data.categoria)),
  });
  if (!atual) redirect(`${base}?erro=1`);

  // Foto nova (opcional): validada pelo conteúdo do arquivo, não pela extensão.
  let fotoUrl = atual.fotoUrl;
  const arquivo = form.get("foto");
  if (arquivo instanceof File && arquivo.size > 0) {
    try {
      fotoUrl = storageAdapter.obterUrl(await salvarFotoDoFormulario(arquivo));
    } catch (erro) {
      if (erro instanceof ErroImagem) redirect(`${base}/${id}?editar=1&erro=foto`);
      throw erro;
    }
  } else if (form.get("removerFoto") === "on") {
    fotoUrl = null;
  }
  // Apaga o arquivo antigo quando a foto muda (não deixa lixo no disco).
  const antiga = caminhoDaUrl(atual.fotoUrl);
  if (antiga && fotoUrl !== atual.fotoUrl) await storageAdapter.remover(antiga).catch(() => undefined);

  await db
    .update(professores)
    .set({ nome, bio, bioEn, instagram, fotoUrl })
    .where(and(eq(professores.id, id), eq(professores.categoria, dados.data.categoria)));
  revalidatePath(base);
  revalidatePath(`${base}/${id}`);
  redirect(`${base}/${id}?ok=1`);
}

// Setinhas ▲ ▼ nas caixas (só organização): troca a posição com a vizinha e
// renumera a ordem de toda a categoria.
export async function moverPerfilAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  const categoria = CATEGORIAS.find((c) => c === form.get("categoria")) ?? "professor";
  const direcao = form.get("direcao") === "cima" ? "cima" : "baixo";
  const base = ROTA_CATEGORIA[categoria];
  if (!id.success) redirect(base);

  const atuais = await db
    .select({ id: professores.id })
    .from(professores)
    .where(eq(professores.categoria, categoria))
    .orderBy(asc(professores.ordem), asc(professores.nome));
  const nova = moverNaLista(
    atuais.map((p) => p.id),
    id.data,
    direcao,
  );
  await db.transaction(async (tx) => {
    for (const [posicao, pid] of nova.entries()) {
      await tx.update(professores).set({ ordem: posicao + 1 }).where(eq(professores.id, pid));
    }
  });
  revalidatePath(base);
  redirect(`${base}?editar=1#perfil-${id.data}`);
}

// "+ Adicionar professor/DJ" no modo edição da lista: entra no fim da ordem.
export async function criarPerfilAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const texto = (campo: string) => String(form.get(campo) ?? "");
  const categoria = CATEGORIAS.find((c) => c === texto("categoria")) ?? "professor";
  const base = ROTA_CATEGORIA[categoria];
  const dados = perfilSchema.omit({ id: true }).safeParse({
    categoria,
    nome: texto("nome"),
    bio: texto("bio"),
    bioEn: texto("bioEn"),
    instagram: texto("instagram"),
  });
  if (!dados.success) redirect(`${base}?editar=1&erro=1`);

  let fotoUrl: string | null = null;
  const arquivo = form.get("foto");
  if (arquivo instanceof File && arquivo.size > 0) {
    try {
      fotoUrl = storageAdapter.obterUrl(await salvarFotoDoFormulario(arquivo));
    } catch (erro) {
      if (erro instanceof ErroImagem) redirect(`${base}?editar=1&erro=foto`);
      throw erro;
    }
  }

  const [{ maior }] = await db
    .select({ maior: max(professores.ordem) })
    .from(professores)
    .where(eq(professores.categoria, categoria));
  const { nome, bio, bioEn, instagram } = dados.data;
  const [novo] = await db
    .insert(professores)
    .values({ nome, bio, bioEn, instagram, fotoUrl, categoria, ordem: (maior ?? 0) + 1 })
    .returning({ id: professores.id });
  revalidatePath(base);
  redirect(`${base}?editar=1&ok=criado#perfil-${novo!.id}`);
}

// Remover um perfil (irreversível): exige a caixinha de confirmação marcada.
// As aulas do cronograma e o login ligados a ele ficam sem vínculo (FK "set null").
export async function removerPerfilAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const id = z.uuid().safeParse(form.get("id"));
  const categoria = CATEGORIAS.find((c) => c === form.get("categoria")) ?? "professor";
  const base = ROTA_CATEGORIA[categoria];
  if (!id.success) redirect(base);
  if (form.get("confirmar") !== "on") redirect(`${base}/${id.data}?editar=1&erro=confirmar#editar`);

  const [removido] = await db
    .delete(professores)
    .where(and(eq(professores.id, id.data), eq(professores.categoria, categoria)))
    .returning({ fotoUrl: professores.fotoUrl });
  const foto = caminhoDaUrl(removido?.fotoUrl ?? null);
  if (foto) await storageAdapter.remover(foto).catch(() => undefined);
  revalidatePath(base);
  revalidatePath("/cronograma");
  redirect(`${base}?editar=1&ok=removido`);
}
