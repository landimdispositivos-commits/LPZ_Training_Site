import type { Idioma } from "@/i18n";
// Produtos vendidos (um lote sempre é de um destes tipos — ver lotes.tipo).
// `entrada`: gera ingresso com QR para a portaria. Jack and Jill (inscrição na
// competição) e paparazzi (serviço) não geram QR.
// Arquivo sem dependências, para ser usado em qualquer tela (usuários, financeiro…).
export const PRODUTOS = {
  full_pass: { nome: "Full pass", nomeEn: "Full pass", nomeEs: "Full pass", entrada: true },
  pacote_baile: { nome: "Pacote de bailes", nomeEn: "Party package", nomeEs: "Paquete de bailes", entrada: true },
  baile_avulso: { nome: "Baile avulso", nomeEn: "Single party", nomeEs: "Baile suelto", entrada: true },
  jack_and_jill: { nome: "Jack and Jill", nomeEn: "Jack and Jill", nomeEs: "Jack and Jill", entrada: false },
  paparazzi_video: { nome: "Paparazzi — vídeo", nomeEn: "Paparazzi — video", nomeEs: "Paparazzi — video", entrada: false },
  paparazzi_foto: { nome: "Paparazzi — fotos", nomeEn: "Paparazzi — photos", nomeEs: "Paparazzi — fotos", entrada: false },
  camiseta: { nome: "Camiseta", nomeEn: "T-shirt", nomeEs: "Camiseta", entrada: false },
  // Massagens: cada lote ativo é uma opção de duração (15 min, 30 min, 1 hora).
  massagem_pri: { nome: "Massagem — Pri Pastel", nomeEn: "Massage — Pri Pastel", nomeEs: "Masaje — Pri Pastel", entrada: false, opcoes: true },
  massagem_jessica: { nome: "Massagem — Jéssica", nomeEn: "Massage — Jéssica", nomeEs: "Masaje — Jéssica", entrada: false, opcoes: true },
} as const;
export type TipoFixo = keyof typeof PRODUTOS;
// Chave do produto: um dos fixos acima ou um pacote criado pela organização
// na tela de Ingressos (tabela produtos_personalizados, chave "extra_...").
export type TipoProduto = string;

export type ModoPresenca = "entrada" | "servico";
export interface InfoProduto {
  nome: string;
  nomeEn: string;
  nomeEs: string;
  entrada: boolean; // gera ingresso com QR para a portaria
  opcoes: boolean; // cliente escolhe entre os lotes ativos (ex.: duração)
  personalizado: boolean;
  ativo: boolean;
}

export interface ProdutoPersonalizado {
  chave: string;
  nome: string;
  nomeEn: string | null;
  nomeEs: string | null;
  presenca: string;
  opcoes: boolean;
  ativo: boolean;
}

// Catálogo dos pacotes criados pela organização, em memória do servidor
// (globalThis: compartilhado entre páginas, ações e rotas do mesmo processo).
// Quem carrega/atualiza é catalogo.ts (acesso ao banco); aqui só a leitura.
const chaveGlobal = "__lpzProdutosPersonalizados" as const;
type Global = typeof globalThis & { [chaveGlobal]?: { lista: ProdutoPersonalizado[]; carregadoEm: number } };

export function definirProdutosPersonalizados(lista: ProdutoPersonalizado[]) {
  (globalThis as Global)[chaveGlobal] = { lista, carregadoEm: Date.now() };
}
export function catalogoCarregadoEm() {
  return (globalThis as Global)[chaveGlobal]?.carregadoEm ?? 0;
}
export function produtosPersonalizados(): ProdutoPersonalizado[] {
  return (globalThis as Global)[chaveGlobal]?.lista ?? [];
}

export const TIPOS_FIXOS = Object.keys(PRODUTOS) as TipoFixo[];

export function ehTipoFixo(tipo: string): tipo is TipoFixo {
  return Object.prototype.hasOwnProperty.call(PRODUTOS, tipo);
}

// Todos os produtos conhecidos (fixos + personalizados, inclusive os desativados,
// para relatórios de vendas antigas). `soAtivos` para a vitrine.
export function tiposDoCatalogo({ soAtivos = false } = {}): TipoProduto[] {
  const extras = produtosPersonalizados().filter((p) => !soAtivos || p.ativo);
  return [...TIPOS_FIXOS, ...extras.map((p) => p.chave)];
}

export function ehTipoProduto(v: unknown): v is TipoProduto {
  return typeof v === "string" && (ehTipoFixo(v) || produtosPersonalizados().some((p) => p.chave === v));
}

export function infoProduto(tipo: TipoProduto): InfoProduto {
  if (ehTipoFixo(tipo)) {
    const p = PRODUTOS[tipo];
    return { nome: p.nome, nomeEn: p.nomeEn, nomeEs: p.nomeEs, entrada: p.entrada, opcoes: "opcoes" in p && p.opcoes === true, personalizado: false, ativo: true };
  }
  const extra = produtosPersonalizados().find((p) => p.chave === tipo);
  if (!extra) return { nome: tipo, nomeEn: tipo, nomeEs: tipo, entrada: false, opcoes: false, personalizado: true, ativo: false };
  return {
    nome: extra.nome,
    nomeEn: extra.nomeEn || extra.nome,
    nomeEs: extra.nomeEs || extra.nome,
    entrada: extra.presenca === "entrada",
    opcoes: extra.opcoes,
    personalizado: true,
    ativo: extra.ativo,
  };
}

// Produto vendido em opções (o cliente escolhe o lote: ex. duração da massagem).
export function temOpcoes(tipo: TipoProduto) {
  return infoProduto(tipo).opcoes;
}

// Nome do produto no idioma do visitante (telas públicas).
export function nomeDoProduto(tipo: TipoProduto, idioma: Idioma = "pt") {
  const p = infoProduto(tipo);
  return idioma === "en" ? p.nomeEn : idioma === "es" ? p.nomeEs : p.nome;
}

// Nomes de lote vêm do banco em português ("1º lote", "Inscrição"); traduz os
// formatos conhecidos para exibição e deixa nomes personalizados como estão.
export function nomeDoLote(nome: string, idioma: Idioma): string {
  if (idioma === "pt") return nome;
  const m = /^(\d+)º lote$/i.exec(nome.trim());
  if (m) {
    const n = Number(m[1]);
    if (idioma === "es") return `${n}º lote`;
    const suf = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
    return `${n}${suf} batch`;
  }
  if (/^inscri[cç][aã]o$/i.test(nome.trim())) return idioma === "en" ? "Registration" : "Inscripción";
  const min = /^(\d+) minutos$/i.exec(nome.trim());
  if (min) return idioma === "en" ? `${min[1]} minutes` : `${min[1]} minutos`;
  const h = /^(\d+) horas?$/i.exec(nome.trim());
  if (h) return idioma === "en" ? `${h[1]} ${h[1] === "1" ? "hour" : "hours"}` : `${h[1]} ${h[1] === "1" ? "hora" : "horas"}`;
  if (/^lote [uú]nico$/i.test(nome.trim())) return idioma === "en" ? "Single batch" : "Lote único";
  return nome;
}
