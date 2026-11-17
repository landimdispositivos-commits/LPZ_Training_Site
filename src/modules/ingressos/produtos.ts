// Produtos vendidos (um lote sempre é de um destes tipos — ver lotes.tipo).
// `entrada`: gera ingresso com QR para a portaria. Jack and Jill (inscrição na
// competição) e paparazzi (serviço) não geram QR.
// Arquivo sem dependências, para ser usado em qualquer tela (usuários, financeiro…).
export const PRODUTOS = {
  full_pass: { nome: "Full pass", nomeEn: "Full pass", entrada: true },
  pacote_baile: { nome: "Pacote de bailes", nomeEn: "Party package", entrada: true },
  baile_avulso: { nome: "Baile avulso", nomeEn: "Single party", entrada: true },
  jack_and_jill: { nome: "Jack and Jill", nomeEn: "Jack and Jill", entrada: false },
  paparazzi_video: { nome: "Paparazzi — vídeo", nomeEn: "Paparazzi — video", entrada: false },
  paparazzi_foto: { nome: "Paparazzi — fotos", nomeEn: "Paparazzi — photos", entrada: false },
} as const;
export type TipoProduto = keyof typeof PRODUTOS;
export const TIPOS_PRODUTO = Object.keys(PRODUTOS) as TipoProduto[];

// Nome do produto no idioma do visitante (telas públicas).
export function nomeDoProduto(tipo: TipoProduto, idioma: "pt" | "en" = "pt") {
  return idioma === "en" ? PRODUTOS[tipo].nomeEn : PRODUTOS[tipo].nome;
}
