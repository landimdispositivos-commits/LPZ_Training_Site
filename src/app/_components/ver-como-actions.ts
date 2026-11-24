"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { registrarAuditoria } from "@/modules/auditoria";
import { ehAdmin, perfisDo } from "@/modules/auth/papeis";
import { COOKIE_VER_COMO, DURACAO_VER_COMO_MS, exigirAdmin, obterSessao, valorCookieVerComo } from "@/modules/auth/sessao";

// Organização passa a ver o site como outra pessoa (sem sair do próprio login).
export async function iniciarVerComoAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador"]);
  const alvoId = z.string().min(1).max(100).safeParse(form.get("usuarioId"));
  if (!alvoId.success || alvoId.data === user.id) redirect("/administradores/usuarios");
  const alvo = await db.query.usuarios.findFirst({ where: eq(usuarios.id, alvoId.data) });
  // Nunca para contas de administração (evita ganhar acesso de outro admin).
  if (!alvo || perfisDo(alvo).some((p) => ehAdmin(p))) redirect("/administradores/usuarios");

  (await cookies()).set(COOKIE_VER_COMO, valorCookieVerComo(user.id, alvo.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_VER_COMO_MS / 1000,
  });
  await registrarAuditoria({ acao: "ver_como_iniciado", autor: user, alvo: { id: alvo.id, name: alvo.name, email: alvo.email } });
  redirect(alvo.papel === "profissional" ? "/profissionais/minha-area" : "/congressistas/minha-area");
}

// Volta para a própria conta de organização.
export async function pararVerComoAction() {
  const sessao = await obterSessao();
  (await cookies()).delete(COOKIE_VER_COMO);
  if (sessao?.impersonador) {
    await registrarAuditoria({
      acao: "ver_como_encerrado",
      autor: sessao.impersonador,
      alvo: { id: sessao.user.id, name: sessao.user.name, email: sessao.user.email },
    });
  }
  redirect("/administradores/usuarios");
}
