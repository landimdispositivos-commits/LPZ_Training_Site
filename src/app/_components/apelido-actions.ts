"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { emModoVerComo, obterSessao } from "@/modules/auth/sessao";
import { normalizarApelido } from "@/modules/perfil/apelido";
import { diferencas, registrarAuditoria } from "@/modules/auditoria";
import { enviarEmailCadastroAlterado, nomesDosCampos } from "@/modules/ingressos/emails";
import { obterIdioma } from "@/i18n/servidor";

export type ResultadoApelido = { ok?: boolean; erro?: "tamanho" | "sessao" };

// Server action pública: confere a sessão e só altera o próprio usuário.
export async function salvarApelidoAction(_: ResultadoApelido, form: FormData): Promise<ResultadoApelido> {
  const sessao = await obterSessao();
  if (!sessao || emModoVerComo(sessao)) return { erro: "sessao" };
  const r = normalizarApelido(form.get("apelido"));
  if (!r.ok) return { erro: "tamanho" };
  const { user } = sessao;
  const { campos, mudancas } = diferencas({ apelido: user.apelido ?? null }, { apelido: r.apelido });
  if (campos.length === 0) return { ok: true };
  await db.update(usuarios).set({ apelido: r.apelido, updatedAt: new Date() }).where(eq(usuarios.id, user.id));
  await registrarAuditoria({ acao: "ficha_atualizada", autor: user, alvo: user, detalhes: { campos, mudancas } });
  const idioma = await obterIdioma();
  enviarEmailCadastroAlterado({ nome: user.name, email: user.email, campos: nomesDosCampos(campos, idioma), porOrganizacao: false, idioma }).catch(
    (erro: unknown) => console.error("[email] Falha no aviso de cadastro", (erro as Error)?.message),
  );
  revalidatePath("/", "layout");
  return { ok: true };
}
