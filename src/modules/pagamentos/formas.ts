// Formas de pagamento (sem dependência de servidor: usado também na tela).
import { formatarPreco } from "@/lib/formatar";

export const FORMAS_PAGAMENTO = ["pix", "credito", "debito", "saldo", "boleto"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const MAX_PARCELAS = 12;

const NOMES: Record<FormaPagamento, { pt: string; en: string }> = {
  pix: { pt: "Pix", en: "Pix" },
  credito: { pt: "Cartão de crédito", en: "Credit card" },
  debito: { pt: "Cartão de débito", en: "Debit card" },
  saldo: { pt: "Saldo do Mercado Pago", en: "Mercado Pago balance" },
  boleto: { pt: "Boleto", en: "Bank slip" },
};

export function ehFormaPagamento(v: unknown): v is FormaPagamento {
  return typeof v === "string" && (FORMAS_PAGAMENTO as readonly string[]).includes(v);
}

// Ex.: "Cartão de crédito em 3x de R$ 116,66" / "Pix (à vista)".
export function descreverPagamento(
  forma: string | null | undefined,
  parcelas: number | null | undefined,
  valorCentavos: number,
  idioma: "pt" | "en" = "pt",
) {
  if (!ehFormaPagamento(forma)) return idioma === "en" ? "Not informed" : "Não informada";
  const nome = NOMES[forma][idioma];
  if (forma === "credito" && parcelas && parcelas > 1) {
    const parcela = formatarPreco(Math.ceil(valorCentavos / parcelas), idioma);
    return idioma === "en" ? `${nome} in ${parcelas} installments of ${parcela}` : `${nome} em ${parcelas}x de ${parcela}`;
  }
  return idioma === "en" ? `${nome} (single payment)` : `${nome} (à vista)`;
}
