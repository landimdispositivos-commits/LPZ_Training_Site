// Sem dependência de banco: usado também no formulário (navegador).
// Assuntos do formulário (o valor gravado/enviado é o código).
export const ASSUNTOS = {
  cronograma: { pt: "Cronograma", en: "Schedule", es: "Cronograma" },
  professores: { pt: "Professores", en: "Teachers", es: "Profesores" },
  djs: { pt: "DJs", en: "DJs", es: "DJs" },
  ingressos: { pt: "Ingressos e pagamento", en: "Tickets and payment", es: "Entradas y pago" },
  galeria: { pt: "Galeria / Paparazzi", en: "Gallery / Paparazzi", es: "Galería / Paparazzi" },
  cadastro: { pt: "Meu cadastro / login", en: "My account / login", es: "Mi registro / inicio de sesión" },
  site: { pt: "Problema no site", en: "Website problem", es: "Problema en el sitio" },
  outro: { pt: "Outro assunto", en: "Other", es: "Otro asunto" },
} as const;
export type Assunto = keyof typeof ASSUNTOS;
export const LISTA_ASSUNTOS = Object.keys(ASSUNTOS) as Assunto[];
