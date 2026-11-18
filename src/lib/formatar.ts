// Formatação compartilhada (horário de Brasília). Português por padrão; as
// telas públicas passam o idioma do visitante.
import { LOCALE, type Idioma } from "@/i18n";

const FUSO = "America/Sao_Paulo";

export function formatarPreco(centavos: number, idioma: Idioma = "pt") {
  // Espanhol usa o formato brasileiro do real ("R$ 199,99"); o es-ES poria o símbolo no fim.
  return (centavos / 100).toLocaleString(LOCALE[idioma === "es" ? "pt" : idioma], { style: "currency", currency: "BRL" });
}

export function formatarDataHora(data: Date, idioma: Idioma = "pt") {
  return data.toLocaleString(LOCALE[idioma], {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "AAAA-MM-DD" → "sexta-feira, 24/09" ou "Friday, Sep 24" (sem fuso: a data é só texto).
export function formatarDiaCronograma(dia: string, idioma: Idioma = "pt") {
  const [a, m, d] = dia.split("-").map(Number);
  if (!a || !m || !d) return dia;
  const data = new Date(Date.UTC(a, m - 1, d));
  if (idioma === "en") {
    return data.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  }
  if (idioma === "es") {
    const semanaEs = data.toLocaleDateString("es-ES", { weekday: "long", timeZone: "UTC" });
    return `${semanaEs}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
  }
  const semana = data.toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
  return `${semana}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

// Valor de <input type="datetime-local"> ("AAAA-MM-DDTHH:mm"), digitado no
// horário de Brasília (UTC-3, sem horário de verão desde 2019) → Date.
export function dataHoraLocalParaDate(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const data = new Date(`${valor}:00-03:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

// Date → valor para <input type="datetime-local"> no horário de Brasília.
export function dateParaDataHoraLocal(data: Date | null) {
  if (!data) return "";
  const brasilia = new Date(data.getTime() - 3 * 60 * 60 * 1000);
  return brasilia.toISOString().slice(0, 16);
}

// "R$ 350,00" / "350" / "350,5" → centavos. Inválido → null.
export function reaisParaCentavos(valor: string): number | null {
  const limpo = valor.replace(/[R$\s.]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  return Math.round(Number(limpo) * 100);
}
