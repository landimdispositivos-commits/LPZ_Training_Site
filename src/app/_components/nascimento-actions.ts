"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { emModoVerComo, obterSessao } from "@/modules/auth/sessao";
import { idadeEm } from "@/modules/auth/cadastro";
import { diferencas, registrarAuditoria } from "@/modules/auditoria";
import { enviarEmailCadastroAlterado, nomesDosCampos } from "@/modules/ingressos/emails";
import { obterIdioma } from "@/i18n/servidor";

export type ResultadoNascimento = { ok?: boolean; erro?: "data" | "sessao" };

// Data de nascimento de profissionais e da organização (congressistas já
// informam na ficha). Opcional: em branco apaga. Só altera o próprio usuário.
export async function salvarNascimentoAction(_: ResultadoNascimento, form: FormData): Promise<ResultadoNascimento> {
  const sessao = await obterSessao();
  if (!sessao || emModoVerComo(sessao)) return { erro: "sessao" };
  const valor = String(form.get("dataNascimento") ?? "").trim();
  if (valor) {
    const data = new Date(`${valor}T12:00:00`);
    const valida = /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
    const idade = valida ? idadeEm(valor) : -1;
    if (!valida || idade < 0 || idade > 110) return { erro: "data" };
  }
  const { user } = sessao;
  const [atual] = await db.select({ dataNascimento: usuarios.dataNascimento }).from(usuarios).where(eq(usuarios.id, user.id));
  const novo = valor || null;
  const { campos, mudancas } = diferencas({ dataNascimento: atual?.dataNascimento ?? null }, { dataNascimento: novo });
  if (campos.length === 0) return { ok: true };
  await db.update(usuarios).set({ dataNascimento: novo, updatedAt: new Date() }).where(eq(usuarios.id, user.id));
  await registrarAuditoria({ acao: "ficha_atualizada", autor: user, alvo: user, detalhes: { campos, mudancas } });
  const idioma = await obterIdioma();
  enviarEmailCadastroAlterado({ nome: user.name, email: user.email, campos: nomesDosCampos(campos, idioma), porOrganizacao: false, idioma }).catch(
    (erro: unknown) => console.error("[email] Falha no aviso de cadastro", (erro as Error)?.message),
  );
  revalidatePath("/", "layout");
  return { ok: true };
}
