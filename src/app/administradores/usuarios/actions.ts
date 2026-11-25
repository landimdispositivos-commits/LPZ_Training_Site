"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { pedidos, usuarios } from "@/db/schema";
import { cpfValido, normalizarCelular, PAIS_BRASIL, somenteDigitos } from "@/modules/auth/cadastro";
import { exigirAdmin } from "@/modules/auth/sessao";
import { diferencas, registrarAuditoria } from "@/modules/auditoria";
import { enviarEmailCadastroAlterado, nomesDosCampos } from "@/modules/ingressos/emails";

// Edição e exclusão de cadastro pela organização (só Organizador). Tudo vai
// para a trilha de auditoria. Server actions aceitam POST direto, então a
// autorização é refeita aqui.

const BASE = "/administradores/usuarios";

function voltarPara(form: FormData, aviso: string) {
  const [caminho, consulta = ""] = String(form.get("voltar") ?? "").split("?");
  const params = new URLSearchParams(caminho === BASE ? consulta : "");
  for (const p of ["ok", "erro", "alvo"]) params.delete(p);
  for (const [k, v] of new URLSearchParams(aviso)) params.set(k, v);
  return `${BASE}?${params}`;
}

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();
const opcional = (form: FormData, campo: string) => texto(form, campo) || null;

const edicaoSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.email().max(200).transform((e) => e.toLowerCase()),
  celular: z.string().max(30).nullable(),
  dataNascimento: z.iso.date().nullable(),
  pais: z.string().max(60).nullable(),
  uf: z.string().max(2).nullable(),
  cidade: z.string().max(100).nullable(),
  cpf: z.string().nullable(),
  cep: z.string().max(12).nullable(),
  logradouro: z.string().max(150).nullable(),
  numero: z.string().max(20).nullable(),
  complemento: z.string().max(100).nullable(),
  bairro: z.string().max(100).nullable(),
  comoConheceu: z.string().max(150).nullable(),
});

export async function editarCadastroAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador"]);
  const id = texto(form, "usuarioId");
  const alvo = id ? await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) }) : undefined;
  if (!alvo) redirect(voltarPara(form, "erro=dados"));

  const pais = opcional(form, "pais");
  const brasil = (pais ?? PAIS_BRASIL) === PAIS_BRASIL;
  const dados = edicaoSchema.safeParse({
    name: texto(form, "nome"),
    email: texto(form, "email"),
    celular: opcional(form, "celular"),
    dataNascimento: opcional(form, "dataNascimento"),
    pais,
    uf: brasil ? opcional(form, "uf")?.toUpperCase() ?? null : null,
    cidade: opcional(form, "cidade"),
    cpf: brasil && opcional(form, "cpf") ? somenteDigitos(texto(form, "cpf")) : null,
    cep: opcional(form, "cep"),
    logradouro: opcional(form, "logradouro"),
    numero: opcional(form, "numero"),
    complemento: opcional(form, "complemento"),
    bairro: opcional(form, "bairro"),
    comoConheceu: opcional(form, "comoConheceu"),
  });
  if (!dados.success) redirect(voltarPara(form, `erro=edicao&alvo=${alvo.id}`));
  const novo = dados.data;

  if (novo.cpf && !cpfValido(novo.cpf)) redirect(voltarPara(form, `erro=cpf&alvo=${alvo.id}`));
  if (novo.celular) {
    const normalizado = normalizarCelular(novo.celular, novo.pais ?? PAIS_BRASIL);
    if (!normalizado) redirect(voltarPara(form, `erro=celular&alvo=${alvo.id}`));
    novo.celular = normalizado;
  }

  // E-mail e CPF não podem repetir entre contas.
  const [emailEmUso] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(and(eq(usuarios.email, novo.email), ne(usuarios.id, alvo.id)))
    .limit(1);
  if (emailEmUso) redirect(voltarPara(form, `erro=email-em-uso&alvo=${alvo.id}`));
  if (novo.cpf) {
    const [cpfEmUso] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.cpf, novo.cpf), ne(usuarios.id, alvo.id)))
      .limit(1);
    if (cpfEmUso) redirect(voltarPara(form, `erro=cpf-em-uso&alvo=${alvo.id}`));
  }

  const { campos, mudancas } = diferencas(alvo as unknown as Record<string, unknown>, novo);
  if (campos.length === 0) redirect(voltarPara(form, `ok=sem-mudanca&alvo=${alvo.id}`));

  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ ...novo, updatedAt: new Date() }).where(eq(usuarios.id, alvo.id));
    // Compras são ligadas pelo e-mail: acompanham a troca de e-mail.
    if (novo.email !== alvo.email) {
      await tx.update(pedidos).set({ email: novo.email, atualizadoEm: new Date() }).where(eq(pedidos.email, alvo.email));
    }
  });

  await registrarAuditoria({
    acao: "cadastro_editado",
    autor: user,
    alvo: { id: alvo.id, name: novo.name, email: novo.email },
    // Antes → depois de cada campo (sensíveis mascarados — LGPD).
    detalhes: { campos, mudancas },
  });
  // O titular é avisado por e-mail (no endereço novo, se o e-mail mudou).
  enviarEmailCadastroAlterado({
    nome: novo.name,
    email: novo.email,
    campos: nomesDosCampos(campos, "pt"),
    porOrganizacao: true,
    idioma: "pt",
  }).catch((erro: unknown) => console.error("[email] Falha no aviso de cadastro", (erro as Error)?.message));
  revalidatePath(BASE);
  redirect(voltarPara(form, `ok=editado&alvo=${alvo.id}`));
}

// Exclusão definitiva da conta (login, sessões, duas etapas). Pedidos e
// ingressos ficam no financeiro (registro de venda/obrigação fiscal), sem
// vínculo de login. Exige digitar EXCLUIR — ação irreversível.
export async function excluirUsuarioAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador"]);
  const id = texto(form, "usuarioId");
  if (texto(form, "confirmacao").toUpperCase() !== "EXCLUIR") redirect(voltarPara(form, `erro=confirmar-exclusao&alvo=${id}`));
  if (id === user.id) redirect(voltarPara(form, "erro=excluir-proprio"));

  const alvo = await db.query.usuarios.findFirst({ where: eq(usuarios.id, id) });
  if (!alvo) redirect(voltarPara(form, "erro=dados"));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(pedidos)
    .where(eq(pedidos.email, alvo.email));

  await db.delete(usuarios).where(eq(usuarios.id, alvo.id));
  await registrarAuditoria({
    acao: "usuario_excluido",
    autor: user,
    alvo: { id: alvo.id, name: alvo.name, email: alvo.email },
    detalhes: { papel: alvo.papel, pedidos: total },
  });
  revalidatePath(BASE);
  redirect(voltarPara(form, "ok=excluido"));
}
