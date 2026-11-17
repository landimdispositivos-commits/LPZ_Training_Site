// Papéis de acesso. A checagem de verdade é sempre no servidor, a partir da
// sessão — nunca confiar em papel vindo do cliente.

export const PAPEIS_ADMIN = ["organizador", "portaria", "acesso_total"] as const;
export type PapelAdmin = (typeof PAPEIS_ADMIN)[number];

// Organizador ou Acesso total: as áreas de gestão do site.
export function ehGestor(papel: string | null | undefined) {
  return papel === "organizador" || papel === "acesso_total";
}

export function ehAdmin(papel: string | null | undefined): papel is PapelAdmin {
  return (PAPEIS_ADMIN as readonly string[]).includes(papel ?? "");
}

// Área inicial de cada papel depois do login.
export function areaDoPapel(papel: string | null | undefined) {
  if (ehAdmin(papel)) return "/administradores/painel";
  if (papel === "profissional") return "/profissionais/minha-area";
  return "/congressistas/minha-area";
}
