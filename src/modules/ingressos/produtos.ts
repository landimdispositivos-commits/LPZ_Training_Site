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
  massagem_pri: { nome: "Massagem — Pri", nomeEn: "Massage — Pri", nomeEs: "Masaje — Pri", entrada: false },
  massagem_jessica: { nome: "Massagem — Jéssica", nomeEn: "Massage — Jéssica", nomeEs: "Masaje — Jéssica", entrada: false },
} as const;
export type TipoProduto = keyof typeof PRODUTOS;
export const TIPOS_PRODUTO = Object.keys(PRODUTOS) as TipoProduto[];

// Nome do produto no idioma do visitante (telas públicas).
export function nomeDoProduto(tipo: TipoProduto, idioma: Idioma = "pt") {
  const p = PRODUTOS[tipo];
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
  if (/^lote [uú]nico$/i.test(nome.trim())) return idioma === "en" ? "Single batch" : "Lote único";
  return nome;
}
