// Menu de cada perfil (papel). É só navegação: quem protege cada página é a
// checagem de papel no servidor (exigirAdmin etc.), nunca o menu.

export type ItemMenu = { href: string; label: string };

export const ROTULO_PAPEL: Record<string, string> = {
  congressista: "Congressista",
  profissional: "Professor(a)/DJ",
  organizador: "Organizador(a)",
  portaria: "Portaria",
  acesso_total: "Acesso total",
};

// Áreas de gestão (Organizador e Acesso total).
const MENU_GESTAO: ItemMenu[] = [
  { href: "/administradores/painel", label: "Painel" },
  { href: "/administradores/usuarios", label: "Usuários" },
  { href: "/administradores/permissoes", label: "Permissões" },
  { href: "/administradores/auditoria", label: "Auditoria" },
  { href: "/administradores/checkin", label: "Check-in" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/administradores/cronograma", label: "Cronograma" },
  { href: "/administradores/professores", label: "Professores" },
  { href: "/administradores/dj", label: "DJ" },
  { href: "/administradores/mc", label: "MC" },
  { href: "/administradores/jack-and-jill", label: "Jack and Jill" },
  { href: "/administradores/fornecedores", label: "Fornecedores" },
  { href: "/administradores/galeria", label: "Fotos" },
  { href: "/administradores/audio-video", label: "Áudio e vídeo" },
];

// Ordem alfabética (português, ignorando acentos e maiúsculas).
function emOrdem(itens: ItemMenu[]) {
  return [...itens].sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));
}

export function menuDoPapel(papel: string | null | undefined): ItemMenu[] {
  switch (papel) {
    case "acesso_total":
    case "organizador":
      return emOrdem(MENU_GESTAO);
    case "portaria":
      return emOrdem([
        { href: "/administradores/painel", label: "Painel" },
        { href: "/administradores/checkin", label: "Check-in" },
      ]);
    case "profissional":
      return [{ href: "/profissionais/minha-area", label: "Minha área" }];
    default:
      return emOrdem([
        { href: "/congressistas/minha-area", label: "Minha área e ingressos" },
        { href: "/ingressos", label: "Comprar ingresso" },
      ]);
  }
}
