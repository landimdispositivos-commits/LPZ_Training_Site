// Os três dias do congresso (sexta, sábado e domingo). Cada atividade do
// cronograma entra no dia pelo dia da semana da sua data.
export const DIAS_EVENTO = [
  { semana: 5, pt: "Sexta-feira", en: "Friday" },
  { semana: 6, pt: "Sábado", en: "Saturday" },
  { semana: 0, pt: "Domingo", en: "Sunday" },
] as const;

export function diaDaSemana(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

export function dataCurta(dia: string, en: boolean) {
  const [, m, d] = dia.split("-");
  return en ? `${m}/${d}` : `${d}/${m}`;
}
