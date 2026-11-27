import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { acessoBar, ehAdmin, ehGestor, PAPEIS_ADMIN, perfisDo, type PapelAdmin } from "./papeis";

// Sessão de verdade (quem fez login). O apelido e os perfis extras são lidos
// do banco para refletirem na hora qualquer alteração.
const obterSessaoReal = cache(async () => {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) return sessao;
  const [linha] = await db
    .select({ imagem: usuarios.image, apelido: usuarios.apelido, perfisExtras: usuarios.perfisExtras, dataNascimento: usuarios.dataNascimento })
    .from(usuarios)
    .where(eq(usuarios.id, sessao.user.id))
    .limit(1);
  return {
    ...sessao,
    user: {
      ...sessao.user,
      image: linha ? linha.imagem : sessao.user.image,
      apelido: linha?.apelido ?? null,
      perfisExtras: linha?.perfisExtras ?? ([] as string[]),
      dataNascimento: linha?.dataNascimento ?? null,
    },
    impersonador: null as null | { id: string; name: string; email: string },
  };
});

// ---------------------------------------------------------------------------
// "Ver o site como esta pessoa" (organização). O login do admin continua
// aberto; um cookie assinado diz qual usuário está sendo visto. Só vale para
// Organizador/Acesso total com duas etapas, só para contas sem perfil de
// administração, por no máximo 1 hora, e em modo só visualização.
// ---------------------------------------------------------------------------

export const COOKIE_VER_COMO = "lpz_ver_como";
export const DURACAO_VER_COMO_MS = 60 * 60 * 1000;

function assinar(valor: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "").update(`ver-como:${valor}`).digest("base64url");
}

export function valorCookieVerComo(adminId: string, alvoId: string) {
  const expira = Date.now() + DURACAO_VER_COMO_MS;
  const base = `${adminId}.${alvoId}.${expira}`;
  return `${base}.${assinar(base)}`;
}

function lerCookieVerComo(valor: string | undefined) {
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length !== 4) return null;
  const [adminId, alvoId, expira, assinatura] = partes;
  const esperado = assinar(`${adminId}.${alvoId}.${expira}`);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expira) < Date.now()) return null;
  return { adminId, alvoId };
}

// Lê a sessão uma vez por requisição. No modo "ver como", devolve o usuário
// visto (com `impersonador` preenchido com o admin de verdade).
export const obterSessao = cache(async () => {
  const real = await obterSessaoReal();
  if (!real) return real;
  const verComo = lerCookieVerComo((await cookies()).get(COOKIE_VER_COMO)?.value);
  if (!verComo || verComo.adminId !== real.user.id) return real;
  if (!ehGestor(real.user.papel) || !real.user.twoFactorEnabled) return real;

  const alvo = await db.query.usuarios.findFirst({ where: eq(usuarios.id, verComo.alvoId) });
  if (!alvo || alvo.id === real.user.id || perfisDo(alvo).some((p) => ehAdmin(p))) return real;
  return {
    session: real.session,
    user: { ...real.user, ...alvo, twoFactorEnabled: alvo.twoFactorEnabled ?? false } as typeof real.user,
    impersonador: { id: real.user.id, name: real.user.name, email: real.user.email },
  };
});

// Ações que mudam dados (compra, cancelamento, cadastro) ficam bloqueadas no
// modo "ver como": a organização só visualiza.
export function emModoVerComo(sessao: { impersonador?: unknown } | null | undefined) {
  return !!sessao?.impersonador;
}

// Porta de entrada de toda página e server action de /administradores.
// Exige: sessão válida + papel de administrador + duas etapas já ativada
// (+ papel específico, quando informado). Consulta o banco a cada chamada
// (sem cache de sessão em cookie), então remover um papel vale na hora.
// Usa sempre o login de verdade (o modo "ver como" não muda o acesso admin).
export async function exigirAdmin(papeisPermitidos: readonly PapelAdmin[] = PAPEIS_ADMIN) {
  const sessao = await obterSessaoReal();
  if (!sessao) redirect("/administradores");
  const { papel, twoFactorEnabled } = sessao.user;
  // O principal é sempre o perfil de maior nível: se ele não é de
  // administração, nenhum dos outros é.
  if (!ehAdmin(papel)) redirect("/administradores?erro=restrito");
  if (!twoFactorEnabled) redirect("/administradores/ativar-duas-etapas");
  const perfis = perfisDo(sessao.user);
  // "Acesso total" entra em qualquer área administrativa; os demais entram se
  // QUALQUER perfil da pessoa for permitido na área.
  if (!perfis.includes("acesso_total") && !perfis.some((p) => (papeisPermitidos as readonly string[]).includes(p))) {
    redirect("/administradores/painel?erro=sem-permissao");
  }
  return { ...sessao, user: { ...sessao.user, papel, perfis } };
}

// Áreas do Bar: "gestao" (tudo), "caixa" (vendas) ou "balcao" (entrega de tickets).
// Usa o login de verdade. Quem tem perfil de administração precisa ter as duas etapas.
export type NivelBar = "gestao" | "admin" | "caixa" | "balcao";
export async function exigirBar(nivel: NivelBar | NivelBar[]) {
  const sessao = await obterSessaoReal();
  if (!sessao) redirect("/congressistas");
  const acesso = acessoBar(sessao.user);
  if (!(Array.isArray(nivel) ? nivel : [nivel]).some((n) => acesso[n])) redirect("/bar");
  if (ehAdmin(sessao.user.papel) && !sessao.user.twoFactorEnabled) redirect("/administradores/ativar-duas-etapas");
  return sessao;
}

// Sessão de verdade (sem o modo "ver como"): usada para decidir o que a pessoa pode ver nas áreas do Bar.
export const sessaoDeVerdade = obterSessaoReal;
