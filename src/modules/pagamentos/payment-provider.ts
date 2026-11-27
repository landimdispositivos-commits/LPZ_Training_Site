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
  // Id do pagamento aprovado no gateway (necessário para estornar).
  pagamentoId?: string | null;
}

export interface EstornoInput {
  pagamentoId: string;
  // Valor a devolver (estorno parcial: um item de uma compra com vários).
  valorCentavos: number;
  // Chave única do estorno (o id do pedido): clique repetido não estorna duas vezes.
  chave: string;
}

export interface ItemPagamento {
  id: string; // id do pedido
  descricao: string;
  valorCentavos: number;
}

export interface CriarPreferenciaInput {
  // Referência externa enviada ao gateway: o id da compra (sacola) ou, numa
  // compra de um item só, o id do pedido.
  referencia: string;
  itens: ItemPagamento[];
  compradorEmail: string;
  // Até quando o checkout aceita pagamento (fim da reserva da vaga).
  expiraEm: Date;
}

// Identificação do pagamento no gateway: a preferência criada e a nossa
// referência (compra ou pedido).
export interface ReferenciaPagamento {
  preferenceId: string;
  referencia: string;
}

export interface CriarPreferenciaResultado {
  preferenceId: string;
  checkoutUrl: string;
}

// Cartão guardado no GATEWAY (nunca no nosso servidor): só bandeira, final e
// validade voltam para a gente, junto com o identificador do cartão.
export interface CartaoGateway {
  cartaoId: string;
  bandeira: string; // ex.: visa, master, elo
  ultimos4: string;
  validade: string; // MM/AA
}

export interface CobrancaCartaoInput {
  referencia: string; // id do pedido (external_reference)
  preferenceId: string | null;
  valorCentavos: number;
  descricao: string;
  parcelas: number;
  clienteId: string;
  compradorEmail: string;
  cartaoId: string;
  bandeira: string;
  // Token de uso único gerado no navegador (cartão salvo + código de segurança).
  // Nunca guardamos nem registramos este valor.
  token: string;
}

export interface ResultadoCobrancaCartao {
  status: "aprovado" | "pendente" | "recusado";
  pagamentoId?: string | null;
}

export interface PaymentProvider {
  // Cartão salvo (Checkout Transparente): o cliente cadastra o cartão direto no
  // gateway, que devolve um identificador. Falso quando o gateway não suporta.
  readonly suportaCartaoSalvo: boolean;
  obterOuCriarCliente(email: string): Promise<string>;
  salvarCartao(clienteId: string, token: string): Promise<CartaoGateway>;
  removerCartao(clienteId: string, cartaoId: string): Promise<void>;
  cobrarComCartao(input: CobrancaCartaoInput): Promise<ResultadoCobrancaCartao>;

  criarPreferencia(input: CriarPreferenciaInput): Promise<CriarPreferenciaResultado>;

  // Sempre consulta a API do gateway — nunca confia apenas no payload do
  // webhook, que pode chegar duplicado, fora de ordem ou ser forjado.
  consultarPagamento(ref: ReferenciaPagamento): Promise<SituacaoPagamento>;

  // Devolve o valor ao comprador. Só é chamado depois da aprovação de uma
  // pessoa da organização (nunca automático).
  estornar(input: EstornoInput): Promise<void>;
}
