// Produtos vendidos (um lote sempre é de um destes tipos — ver lotes.tipo).
// `entrada`: gera ingresso com QR para a portaria; paparazzi é serviço, sem QR.
// Arquivo sem dependências, para ser usado em qualquer tela (usuários, financeiro…).
export const PRODUTOS = {
  full_pass: { nome: "Full pass", entrada: true },
  pacote_baile: { nome: "Pacote de bailes", entrada: true },
  baile_avulso: { nome: "Baile avulso", entrada: true },
  paparazzi_video: { nome: "Paparazzi — vídeo", entrada: false },
  paparazzi_foto: { nome: "Paparazzi — fotos", entrada: false },
} as const;
export type TipoProduto = keyof typeof PRODUTOS;
export const TIPOS_PRODUTO = Object.keys(PRODUTOS) as TipoProduto[];
