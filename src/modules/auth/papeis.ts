// Papéis (perfis) de acesso. A checagem de verdade é sempre no servidor, a
// partir da sessão — nunca confiar em papel vindo do cliente.
//
// Uma pessoa pode ter VÁRIOS perfis (ex: Portaria + Mídias): o principal fica
// em usuarios.papel (o de maior nível, que decide a área inicial depois do
// login) e os demais em usuarios.perfis_extras. O acesso a uma área vale se
// QUALQUER um dos perfis permitir.

export const PAPEIS_ADMIN = ["organizador", "portaria", "midias", "acesso_total"] as const;
export type PapelAdmin = (typeof PAPEIS_ADMIN)[number];

// Do maior para o menor nível.
export const ORDEM_PERFIS = ["acesso_total", "organizador", "portaria", "midias", "profissional", "congressista"] as const;
export type Perfil = (typeof ORDEM_PERFIS)[number];

// Perfis de uma pessoa: o principal + os extras, sem repetição.
export function perfisDo(user: { papel?: string | null; perfisExtras?: readonly string[] | null }): string[] {
  return [...new Set([user.papel ?? "congressista", ...(user.perfisExtras ?? [])])];
}

export function temPerfil(user: { papel?: string | null; perfisExtras?: readonly string[] | null }, perfil: Perfil) {
  return perfisDo(user).includes(perfil);
}

// Perfis do Bar (vendas e estoque do evento). Ficam só em perfis_extras (não
// são o perfil principal nem dão acesso à área de administração). Quem é
// Organizador ou Acesso total tem a gestão do Bar automaticamente.
export const PERFIS_BAR = ["bar_gestao", "bar_admin", "bar_caixa", "bar_balcao"] as const;
export type PerfilBar = (typeof PERFIS_BAR)[number];

export function acessoBar(user: { papel?: string | null; perfisExtras?: readonly string[] | null }) {
  const perfis = perfisDo(user);
  const gestao = perfis.some((p) => p === "acesso_total" || p === "organizador" || p === "bar_gestao");
  // gestao: vê tudo. admin: cadastra eventos, produtos, estoque e compras.
  // caixa: vende (caixa e comandas) e consulta produtos e vendas, sem custos.
  return {
    gestao,
    admin: gestao || perfis.includes("bar_admin"),
    caixa: gestao || perfis.includes("bar_caixa"),
    balcao: gestao || perfis.includes("bar_balcao"),
  };
}

// Perfil principal de uma lista (o de maior nível).
export function perfilPrincipal(perfis: readonly string[]): Perfil {
  return ORDEM_PERFIS.find((p) => perfis.includes(p)) ?? "congressista";
}

// Organizador ou Acesso total: as áreas de gestão do site.
export function ehGestor(papel: string | null | undefined) {
  return papel === "organizador" || papel === "acesso_total";
}

export function ehAdmin(papel: string | null | undefined): papel is PapelAdmin {
  return (PAPEIS_ADMIN as readonly string[]).includes(papel ?? "");
}

// Quem pode ver dados pessoais de participantes (QR, check-in).
export function vePessoas(user: { papel?: string | null; perfisExtras?: readonly string[] | null }) {
  return perfisDo(user).some((p) => p === "organizador" || p === "portaria" || p === "acesso_total");
}

// Área inicial de cada papel depois do login.
export function areaDoPapel(papel: string | null | undefined) {
  if (ehAdmin(papel)) return "/administradores/painel";
  if (papel === "profissional") return "/profissionais/minha-area";
  return "/congressistas/minha-area";
}
