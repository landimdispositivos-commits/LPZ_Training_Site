import { tx, type Idioma } from "@/i18n";
import type { TipoProduto } from "@/modules/ingressos/produtos";

// Regras de presença por produto (sem dependência de banco — usado nas telas).
// Full pass e Pacote de bailes: uma entrada por dia do evento.
// Baile avulso: uma entrada. Jack and Jill e Paparazzi: serviço realizado uma vez.
export const DIAS_PRESENCA = ["sexta", "sabado", "domingo", "unico"] as const;
export type DiaPresenca = (typeof DIAS_PRESENCA)[number];
export type TipoPresenca = "entrada" | "servico";

export const REGRAS_PRESENCA: Record<TipoProduto, { tipo: TipoPresenca; dias: DiaPresenca[] }> = {
  full_pass: { tipo: "entrada", dias: ["sexta", "sabado", "domingo"] },
  pacote_baile: { tipo: "entrada", dias: ["sexta", "sabado", "domingo"] },
  baile_avulso: { tipo: "entrada", dias: ["unico"] },
  jack_and_jill: { tipo: "servico", dias: ["unico"] },
  paparazzi_video: { tipo: "servico", dias: ["unico"] },
  paparazzi_foto: { tipo: "servico", dias: ["unico"] },
  camiseta: { tipo: "servico", dias: ["unico"] },
  massagem_pri: { tipo: "servico", dias: ["unico"] },
  massagem_jessica: { tipo: "servico", dias: ["unico"] },
};

export function ehDiaPresenca(v: unknown): v is DiaPresenca {
  return typeof v === "string" && (DIAS_PRESENCA as readonly string[]).includes(v);
}

// Dia do evento correspondente a hoje (horário de Brasília), ou null.
export function diaDeHoje(agora = new Date()): DiaPresenca | null {
  const semana = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" }).format(agora);
  return semana === "Fri" ? "sexta" : semana === "Sat" ? "sabado" : semana === "Sun" ? "domingo" : null;
}

const NOME_DIA: Record<Exclude<DiaPresenca, "unico">, [string, string, string]> = {
  sexta: ["Sexta", "Friday", "Viernes"],
  sabado: ["Sábado", "Saturday", "Sábado"],
  domingo: ["Domingo", "Sunday", "Domingo"],
};

// Texto do que foi registrado ("Entrada — Sexta", "Paparazzi realizado"...).
export function rotuloPresenca(tipoProduto: TipoProduto, dia: DiaPresenca, idioma: Idioma = "pt"): string {
  if (dia !== "unico") {
    const [pt, en, es] = NOME_DIA[dia];
    return tx(idioma, `Entrada — ${pt}`, `Entry — ${en}`, `Entrada — ${es}`);
  }
  if (tipoProduto === "baile_avulso") return tx(idioma, "Entrada no baile", "Party entry", "Entrada al baile");
  if (tipoProduto === "jack_and_jill") return tx(idioma, "Participou do Jack and Jill", "Took part in Jack and Jill", "Participó del Jack and Jill");
  if (tipoProduto === "camiseta") return tx(idioma, "Camiseta retirada", "T-shirt picked up", "Camiseta retirada");
  if (tipoProduto === "massagem_pri" || tipoProduto === "massagem_jessica") return tx(idioma, "Massagem realizada", "Massage done", "Masaje realizado");
  return tx(idioma, "Paparazzi realizado", "Paparazzi done", "Paparazzi realizado");
}

// Texto do botão para registrar.
export function rotuloBotaoPresenca(tipoProduto: TipoProduto, dia: DiaPresenca): string {
  if (dia !== "unico") return `Registrar entrada — ${NOME_DIA[dia][0]}`;
  if (tipoProduto === "baile_avulso") return "Registrar entrada no baile";
  if (tipoProduto === "jack_and_jill") return "Registrar participação no Jack and Jill";
  if (tipoProduto === "camiseta") return "Marcar camiseta como retirada";
  if (tipoProduto === "massagem_pri" || tipoProduto === "massagem_jessica") return "Marcar massagem como realizada";
  return "Marcar paparazzi como realizado";
}
