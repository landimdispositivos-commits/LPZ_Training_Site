// Menu de cada perfil (papel). É só navegação: quem protege cada página é a
// checagem de papel no servidor (exigirAdmin etc.), nunca o menu.
import { LOCALE, type Idioma } from "@/i18n";

export type ItemMenu = { href: string; label: string };
type ItemBilingue = { href: string; pt: string; en: string; es: string };

export const ROTULO_PAPEL: Record<string, string> = {
  congressista: "Congressista",
  profissional: "Professor(a)/DJ",
  organizador: "Organizador(a)",
  portaria: "Portaria",
  acesso_total: "Acesso total",
  midias: "Mídias",
  bar_gestao: "Bar — Gestão",
  bar_admin: "Bar — Admin Caixa",
  bar_caixa: "Bar — Caixa",
  bar_balcao: "Bar — Balcão",
};

const ROTULO_PAPEL_EN: Record<string, string> = {
  congressista: "Attendee",
  profissional: "Teacher/DJ",
  organizador: "Organizer",
  portaria: "Door staff",
  acesso_total: "Full access",
  midias: "Media",
  bar_gestao: "Bar — Management",
  bar_admin: "Bar — Cashier admin",
  bar_caixa: "Bar — Cashier",
  bar_balcao: "Bar — Pickup counter",
};

const ROTULO_PAPEL_ES: Record<string, string> = {
  congressista: "Participante",
  profissional: "Profesor(a)/DJ",
  organizador: "Organizador(a)",
  portaria: "Portería",
  acesso_total: "Acceso total",
  midias: "Medios",
  bar_gestao: "Bar — Gestión",
  bar_admin: "Bar — Admin de caja",
  bar_caixa: "Bar — Caja",
  bar_balcao: "Bar — Mostrador",
};

export function rotuloPapel(papel: string | null | undefined, idioma: Idioma = "pt") {
  const tabela = idioma === "en" ? ROTULO_PAPEL_EN : idioma === "es" ? ROTULO_PAPEL_ES : ROTULO_PAPEL;
  return tabela[papel ?? ""] ?? tabela.congressista;
}

// Áreas de gestão (Organizador e Acesso total). O que já está no menu principal
// do site (Cronograma, Professores, DJs, Loja, Galeria, Serviços, Jack and Jill)
// não se repete aqui: a edição é feita na própria página (botão Editar).
const MENU_GESTAO: ItemBilingue[] = [
  { href: "/administradores/painel", pt: "Painel", en: "Dashboard", es: "Panel" },
  { href: "/administradores/usuarios", pt: "Usuários", en: "Users", es: "Usuarios" },
  { href: "/administradores/permissoes", pt: "Permissões", en: "Permissions", es: "Permisos" },
  { href: "/administradores/auditoria", pt: "Auditoria", en: "Audit log", es: "Auditoría" },
  { href: "/administradores/checkin", pt: "Check-in", en: "Check-in", es: "Check-in" },
  { href: "/financeiro", pt: "Financeiro", en: "Finance", es: "Finanzas" },
  { href: "/administradores/mc", pt: "MC", en: "MC", es: "MC" },
  { href: "/administradores/fornecedores", pt: "Fornecedores", en: "Suppliers", es: "Proveedores" },
  { href: "/administradores/galeria", pt: "Fotos", en: "Photos", es: "Fotos" },
  { href: "/administradores/audio-video", pt: "Áudio e vídeo", en: "Audio and video", es: "Audio y video" },
  { href: "/bar", pt: "Bar", en: "Bar", es: "Bar" },
];

const MENU_PORTARIA: ItemBilingue[] = [
  { href: "/administradores/painel", pt: "Painel", en: "Dashboard", es: "Panel" },
  { href: "/administradores/checkin", pt: "Check-in", en: "Check-in", es: "Check-in" },
  { href: "/bar", pt: "Bar", en: "Bar", es: "Bar" },
];

const MENU_MIDIAS: ItemBilingue[] = [
  { href: "/administradores/painel", pt: "Painel", en: "Dashboard", es: "Panel" },
  { href: "/administradores/galeria", pt: "Fotos", en: "Photos", es: "Fotos" },
  { href: "/administradores/audio-video", pt: "Áudio e vídeo", en: "Audio and video", es: "Audio y video" },
  { href: "/bar", pt: "Bar", en: "Bar", es: "Bar" },
];

const MENU_PROFISSIONAL: ItemBilingue[] = [
  { href: "/profissionais/minha-area", pt: "Minha área", en: "My area", es: "Mi área" },
];

const MENU_CONGRESSISTA: ItemBilingue[] = [
  { href: "/congressistas/minha-area", pt: "Minha área e ingressos", en: "My area and tickets", es: "Mi área y entradas" },
  { href: "/congressistas/completar-cadastro", pt: "Meu cadastro", en: "My profile", es: "Mi registro" },
];

// Ordem alfabética no idioma escolhido (ignorando acentos e maiúsculas).
function emOrdem(itens: ItemBilingue[], idioma: Idioma): ItemMenu[] {
  return itens
    .map((i) => ({ href: i.href, label: i[idioma] }))
    .sort((a, b) => a.label.localeCompare(b.label, LOCALE[idioma], { sensitivity: "base" }));
}

function itensDoPapel(papel: string | null | undefined): ItemBilingue[] {
  switch (papel) {
    case "acesso_total":
    case "organizador":
      return MENU_GESTAO;
    case "portaria":
      return MENU_PORTARIA;
    case "midias":
      return MENU_MIDIAS;
    case "profissional":
      return MENU_PROFISSIONAL;
    default:
      return MENU_CONGRESSISTA;
  }
}

export function menuDoPapel(papel: string | null | undefined, idioma: Idioma = "pt"): ItemMenu[] {
  return emOrdem(itensDoPapel(papel), idioma);
}

// Menu de quem tem vários perfis: junta os itens de todos (sem repetir).
export function menuDosPerfis(perfis: readonly string[], idioma: Idioma = "pt"): ItemMenu[] {
  const porHref = new Map<string, ItemBilingue>();
  for (const p of perfis) for (const item of itensDoPapel(p)) porHref.set(item.href, item);
  return emOrdem([...porHref.values()], idioma);
}
