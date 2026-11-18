// Porta (interface) do provedor de pagamento. Nenhum código de negócio deve
// depender diretamente do SDK do Mercado Pago — sempre desta interface, para
// que o gateway possa ser trocado sem tocar em `pedidos`/`ingressos`.
//
// Importante: o adapter real (Mercado Pago) usa Checkout Pro (redirect
// hospedado) — dados de cartão nunca devem passar pelo nosso servidor.

import type { FormaPagamento } from "./formas";

export type StatusPagamento = "pendente" | "pago" | "cancelado" | "reembolsado";

// Situação do pagamento no gateway, com a forma escolhida pelo comprador
// (quando o gateway informa).
export interface SituacaoPagamento {
  status: StatusPagamento;
  forma?: FormaPagamento | null;
  parcelas?: number | null;
}

export interface CriarPreferenciaInput {
  pedidoId: string;
  descricao: string;
  valorCentavos: number;
  compradorEmail: string;
  // Até quando o checkout aceita pagamento (fim da reserva da vaga).
  expiraEm: Date;
}

// Identificação do pagamento no gateway: a preferência criada e o nosso
// pedido (enviado ao gateway como referência externa).
export interface ReferenciaPagamento {
  preferenceId: string;
  pedidoId: string;
}

export interface CriarPreferenciaResultado {
  preferenceId: string;
  checkoutUrl: string;
}

export interface PaymentProvider {
  criarPreferencia(input: CriarPreferenciaInput): Promise<CriarPreferenciaResultado>;

  // Sempre consulta a API do gateway — nunca confia apenas no payload do
  // webhook, que pode chegar duplicado, fora de ordem ou ser forjado.
  consultarPagamento(ref: ReferenciaPagamento): Promise<SituacaoPagamento>;
}
