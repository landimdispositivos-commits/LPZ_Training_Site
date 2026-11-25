// Formas de pagamento (sem dependência de servidor: usado também na tela).
import { tx, type Idioma } from "@/i18n";
import { formatarPreco } from "@/lib/formatar";

export const FORMAS_PAGAMENTO = ["pix", "credito", "debito", "saldo", "boleto"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const MAX_PARCELAS = 12;

const NOMES: Record<FormaPagamento, Record<Idioma, string>> = {
  pix: { pt: "Pix", en: "Pix", es: "Pix" },
  credito: { pt: "Cartão de crédito", en: "Credit card", es: "Tarjeta de crédito" },
  debito: { pt: "Cartão de débito", en: "Debit card", es: "Tarjeta de débito" },
  saldo: { pt: "Saldo do Mercado Pago", en: "Mercado Pago balance", es: "Saldo de Mercado Pago" },
  boleto: { pt: "Boleto", en: "Bank slip", es: "Boleto bancario" },
};

export function ehFormaPagamento(v: unknown): v is FormaPagamento {
  return typeof v === "string" && (FORMAS_PAGAMENTO as readonly string[]).includes(v);
}

// Ex.: "Cartão de crédito em 3x de R$ 116,66" / "Pix (à vista)".
export function descreverPagamento(
  forma: string | null | undefined,
  parcelas: number | null | undefined,
  valorCentavos: number,
  idioma: Idioma = "pt",
) {
  if (!ehFormaPagamento(forma)) return tx(idioma, "Não informada", "Not informed", "No informada");
  const nome = NOMES[forma][idioma];
  if (forma === "credito" && parcelas && parcelas > 1) {
    const parcela = formatarPreco(Math.ceil(valorCentavos / parcelas), idioma);
    return tx(idioma, `${nome} em ${parcelas}x de ${parcela}`, `${nome} in ${parcelas} installments of ${parcela}`, `${nome} en ${parcelas} cuotas de ${parcela}`);
  }
  return tx(idioma, `${nome} (à vista)`, `${nome} (single payment)`, `${nome} (en un pago)`);
}
