// Os três dias do congresso (sexta, sábado e domingo). Cada atividade do
// cronograma entra no dia pelo dia da semana da sua data.
export const DIAS_EVENTO = [
  { semana: 5, pt: "Sexta-feira", en: "Friday", es: "Viernes" },
  { semana: 6, pt: "Sábado", en: "Saturday", es: "Sábado" },
  { semana: 0, pt: "Domingo", en: "Sunday", es: "Domingo" },
] as const;

export function diaDaSemana(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(Date.UTC(a, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

// Inglês: mês/dia; português e espanhol: dia/mês.
export function dataCurta(dia: string, en: boolean) {
  const [, m, d] = dia.split("-");
  return en ? `${m}/${d}` : `${d}/${m}`;
}

// Datas do LPZ Training 2027 (sexta, sábado e domingo). Usadas ao adicionar
// uma aula pela página do cronograma, quando ainda não há aula no dia.
export const DATA_PADRAO_DO_DIA: Record<number, string> = { 5: "2027-09-24", 6: "2027-09-25", 0: "2027-09-26" };
