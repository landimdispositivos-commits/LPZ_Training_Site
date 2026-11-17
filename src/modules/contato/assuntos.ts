// Sem dependência de banco: usado também no formulário (navegador).
// Assuntos do formulário (o valor gravado/enviado é o código).
export const ASSUNTOS = {
  cronograma: { pt: "Cronograma", en: "Schedule" },
  professores: { pt: "Professores", en: "Teachers" },
  djs: { pt: "DJs", en: "DJs" },
  ingressos: { pt: "Ingressos e pagamento", en: "Tickets and payment" },
  galeria: { pt: "Galeria / Paparazzi", en: "Gallery / Paparazzi" },
  cadastro: { pt: "Meu cadastro / login", en: "My account / login" },
  site: { pt: "Problema no site", en: "Website problem" },
  outro: { pt: "Outro assunto", en: "Other" },
} as const;
export type Assunto = keyof typeof ASSUNTOS;
export const LISTA_ASSUNTOS = Object.keys(ASSUNTOS) as Assunto[];
