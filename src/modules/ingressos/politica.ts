import type { Idioma } from "@/i18n";

// Regras de compra exibidas na página de Ingressos e no e-mail de confirmação.
// Base legal do reembolso: direito de arrependimento (CDC, art. 49) — 7 dias
// para compras feitas fora do estabelecimento (internet).
export const POLITICA_COMPRA: Record<Idioma, string> = {
  pt: "Os pacotes são pessoais e intransferíveis. O reembolso só é possível se você desistir em até 7 dias após a compra, conforme o direito de arrependimento do Código de Defesa do Consumidor (art. 49). Em caso de não comparecimento, o pacote não pode ser transferido para a edição do ano seguinte.",
  en: "Packages are personal and non-transferable. Refunds are only available if you cancel within 7 days of purchase, under the right of withdrawal in the Brazilian Consumer Protection Code (art. 49). If you do not attend, the package cannot be carried over to next year's edition.",
  es: "Los paquetes son personales e intransferibles. El reembolso solo es posible si desistes dentro de los 7 días posteriores a la compra, conforme al derecho de arrepentimiento del Código de Defensa del Consumidor de Brasil (art. 49). Si no asistes, el paquete no puede transferirse a la edición del año siguiente.",
};
