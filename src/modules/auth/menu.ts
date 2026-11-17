// Menu de cada perfil (papel). É só navegação: quem protege cada página é a
// checagem de papel no servidor (exigirAdmin etc.), nunca o menu.
import { LOCALE, type Idioma } from "@/i18n";

export type ItemMenu = { href: string; label: string };
type ItemBilingue = { href: string; pt: string; en: string };

export const ROTULO_PAPEL: Record<string, string> = {
  congressista: "Congressista",
  profissional: "Professor(a)/DJ",
  organizador: "Organizador(a)",
  portaria: "Portaria",
  acesso_total: "Acesso total",
};

const ROTULO_PAPEL_EN: Record<string, string> = {
  congressista: "Attendee",
  profissional: "Teacher/DJ",
  organizador: "Organizer",
  portaria: "Door staff",
  acesso_total: "Full access",
};

export function rotuloPapel(papel: string | null | undefined, idioma: Idioma = "pt") {
  const tabela = idioma === "en" ? ROTULO_PAPEL_EN : ROTULO_PAPEL;
  return tabela[papel ?? ""] ?? tabela.congressista;
}

// Áreas de gestão (Organizador e Acesso total).
const MENU_GESTAO: ItemBilingue[] = [
  { href: "/administradores/painel", pt: "Painel", en: "Dashboard" },
  { href: "/administradores/usuarios", pt: "Usuários", en: "Users" },
  { href: "/administradores/permissoes", pt: "Permissões", en: "Permissions" },
  { href: "/administradores/auditoria", pt: "Auditoria", en: "Audit log" },
  { href: "/administradores/checkin", pt: "Check-in", en: "Check-in" },
  { href: "/financeiro", pt: "Financeiro", en: "Finance" },
  { href: "/administradores/cronograma", pt: "Cronograma", en: "Schedule" },
  { href: "/administradores/professores", pt: "Professores", en: "Teachers" },
  { href: "/administradores/dj", pt: "DJ", en: "DJ" },
  { href: "/administradores/mc", pt: "MC", en: "MC" },
  { href: "/administradores/jack-and-jill", pt: "Jack and Jill", en: "Jack and Jill" },
  { href: "/administradores/fornecedores", pt: "Fornecedores", en: "Suppliers" },
  { href: "/administradores/galeria", pt: "Fotos", en: "Photos" },
  { href: "/administradores/audio-video", pt: "Áudio e vídeo", en: "Audio and video" },
];

const MENU_PORTARIA: ItemBilingue[] = [
  { href: "/administradores/painel", pt: "Painel", en: "Dashboard" },
  { href: "/administradores/checkin", pt: "Check-in", en: "Check-in" },
];

const MENU_PROFISSIONAL: ItemBilingue[] = [{ href: "/profissionais/minha-area", pt: "Minha área", en: "My area" }];

const MENU_CONGRESSISTA: ItemBilingue[] = [
  { href: "/congressistas/minha-area", pt: "Minha área e ingressos", en: "My area and tickets" },
  { href: "/ingressos", pt: "Comprar ingresso", en: "Buy a ticket" },
];

// Ordem alfabética no idioma escolhido (ignorando acentos e maiúsculas).
function emOrdem(itens: ItemBilingue[], idioma: Idioma): ItemMenu[] {
  return itens
    .map((i) => ({ href: i.href, label: i[idioma] }))
    .sort((a, b) => a.label.localeCompare(b.label, LOCALE[idioma], { sensitivity: "base" }));
}

export function menuDoPapel(papel: string | null | undefined, idioma: Idioma = "pt"): ItemMenu[] {
  switch (papel) {
    case "acesso_total":
    case "organizador":
      return emOrdem(MENU_GESTAO, idioma);
    case "portaria":
      return emOrdem(MENU_PORTARIA, idioma);
    case "profissional":
      return emOrdem(MENU_PROFISSIONAL, idioma);
    default:
      return emOrdem(MENU_CONGRESSISTA, idioma);
  }
}
