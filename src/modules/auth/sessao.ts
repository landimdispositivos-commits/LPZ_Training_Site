import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { ehAdmin, PAPEIS_ADMIN, type PapelAdmin } from "./papeis";

// Lê a sessão uma vez por requisição. O apelido é lido direto do banco para
// refletir na hora uma alteração feita em "Como prefere ser chamado(a)?".
export const obterSessao = cache(async () => {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return sessao;
  const [linha] = await db
    .select({ apelido: usuarios.apelido })
    .from(usuarios)
    .where(eq(usuarios.id, sessao.user.id))
    .limit(1);
  return { ...sessao, user: { ...sessao.user, apelido: linha?.apelido ?? null } };
});

// Porta de entrada de toda página e server action de /administradores.
// Exige: sessão válida + papel de administrador + duas etapas já ativada
// (+ papel específico, quando informado). Consulta o banco a cada chamada
// (sem cache de sessão em cookie), então remover um papel vale na hora.
export async function exigirAdmin(papeisPermitidos: readonly PapelAdmin[] = PAPEIS_ADMIN) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/administradores");
  const { papel, twoFactorEnabled } = sessao.user;
  if (!ehAdmin(papel)) redirect("/administradores?erro=restrito");
  if (!twoFactorEnabled) redirect("/administradores/ativar-duas-etapas");
  // "Acesso total" entra em qualquer área administrativa.
  if (papel !== "acesso_total" && !papeisPermitidos.includes(papel)) redirect("/administradores/painel?erro=sem-permissao");
  return { ...sessao, user: { ...sessao.user, papel } };
}
