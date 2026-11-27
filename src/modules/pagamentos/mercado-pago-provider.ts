import type {
  CartaoGateway,
  CobrancaCartaoInput,
  ResultadoCobrancaCartao,
  CriarPreferenciaInput,
  CriarPreferenciaResultado,
  EstornoInput,
  PaymentProvider,
  ReferenciaPagamento,
  SituacaoPagamento,
} from "./payment-provider";
import type { FormaPagamento } from "./formas";

// Mercado Pago — Checkout Pro (o comprador paga na página do Mercado Pago;
// dados de cartão nunca passam pelo nosso servidor).
//
// Chamamos a API REST diretamente com fetch, sem o SDK oficial: são só 3
// chamadas (criar preferência, buscar pagamentos, ler um pagamento) e assim
// não entra dependência nova no projeto. Se um dia usarmos recursos mais
// avançados (Checkout Transparente/Bricks), vale migrar para o SDK.
//
// Credenciais: MERCADOPAGO_ACCESS_TOKEN no .env. Use as credenciais de TESTE
// do painel do Mercado Pago em desenvolvimento.
const API = "https://api.mercadopago.com";

type PagamentoMP = {
  id: number;
  status: string;
  external_reference: string | null;
  payment_type_id?: string;
  payment_method_id?: string;
  installments?: number;
};

// Tipo de pagamento do Mercado Pago → nossa forma de pagamento.
function formaDoMP(p: PagamentoMP): FormaPagamento | null {
  if (p.payment_method_id === "pix" || p.payment_type_id === "bank_transfer") return "pix";
  if (p.payment_type_id === "credit_card") return "credito";
  if (p.payment_type_id === "debit_card" || p.payment_type_id === "prepaid_card") return "debito";
  if (p.payment_type_id === "account_money") return "saldo";
  if (p.payment_type_id === "ticket") return "boleto";
  return null;
}

export class MercadoPagoProvider implements PaymentProvider {
  readonly suportaCartaoSalvo = true;

  // Cliente do Mercado Pago (guarda os cartões do comprador do lado deles).
  async obterOuCriarCliente(email: string): Promise<string> {
    const busca = await this.chamar<{ results: { id: string }[] }>(`/v1/customers/search?email=${encodeURIComponent(email)}`);
    if (busca.results[0]?.id) return busca.results[0].id;
    const novo = await this.chamar<{ id: string }>("/v1/customers", { method: "POST", body: JSON.stringify({ email }) });
    return novo.id;
  }

  // Guarda o cartão no cliente a partir do token gerado no navegador (MP.js).
  async salvarCartao(clienteId: string, token: string): Promise<CartaoGateway> {
    const c = await this.chamar<{
      id: string;
      last_four_digits: string;
      expiration_month: number;
      expiration_year: number;
      payment_method?: { id?: string };
    }>(`/v1/customers/${encodeURIComponent(clienteId)}/cards`, { method: "POST", body: JSON.stringify({ token }) });
    return {
      cartaoId: String(c.id),
      bandeira: c.payment_method?.id ?? "",
      ultimos4: c.last_four_digits,
      validade: `${String(c.expiration_month).padStart(2, "0")}/${String(c.expiration_year).slice(-2)}`,
    };
  }

  async removerCartao(clienteId: string, cartaoId: string): Promise<void> {
    await this.chamar(`/v1/customers/${encodeURIComponent(clienteId)}/cards/${encodeURIComponent(cartaoId)}`, { method: "DELETE" });
  }

  // Cobra o pedido com o cartão salvo. O token (cartão + código de segurança)
  // nasce no navegador e vale uma vez; a chave de idempotência evita cobrança dupla.
  async cobrarComCartao(i: CobrancaCartaoInput): Promise<ResultadoCobrancaCartao> {
    const pagamento = await this.chamar<{ id: number; status: string }>("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": `cartao-${i.referencia}-${i.parcelas}-${i.cartaoId}` },
      body: JSON.stringify({
        transaction_amount: i.valorCentavos / 100,
        token: i.token,
        description: i.descricao,
        installments: i.parcelas,
        payment_method_id: i.bandeira,
        payer: { type: "customer", id: i.clienteId, email: i.compradorEmail },
        external_reference: i.referencia,
        statement_descriptor: "LPZ TRAINING",
        ...(this.appUrl.startsWith("https://") ? { notification_url: `${this.appUrl}/api/pagamentos/webhook` } : {}),
      }),
    });
    const pagamentoId = String(pagamento.id);
    if (pagamento.status === "approved") return { status: "aprovado", pagamentoId };
    if (pagamento.status === "in_process" || pagamento.status === "pending" || pagamento.status === "authorized") return { status: "pendente", pagamentoId };
    return { status: "recusado", pagamentoId };
  }

  constructor(
    private readonly accessToken: string,
    private readonly appUrl: string,
  ) {}

  private async chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
    const resposta = await fetch(`${API}${caminho}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
    if (!resposta.ok) {
      // Não loga o corpo: pode conter dados do comprador.
      throw new Error(`Mercado Pago respondeu ${resposta.status} em ${caminho.split("?")[0]}`);
    }
    return (await resposta.json()) as T;
  }

  async criarPreferencia(input: CriarPreferenciaInput): Promise<CriarPreferenciaResultado> {
    const publico = this.appUrl.startsWith("https://");
    const retorno = `${this.appUrl}/pagamento/retorno`;
    const preferencia = await this.chamar<{ id: string; init_point: string }>("/checkout/preferences", {
      method: "POST",
      // Mesmo pedido = mesma chave: evita preferência duplicada se o clique repetir.
      headers: { "X-Idempotency-Key": `pref-${input.referencia}-${input.expiraEm.getTime()}` },
      body: JSON.stringify({
        items: input.itens.map((item) => ({
          id: item.id,
          title: item.descricao,
          quantity: 1,
          currency_id: "BRL",
          unit_price: item.valorCentavos / 100,
        })),
        payer: { email: input.compradorEmail },
        external_reference: input.referencia,
        back_urls: { success: retorno, pending: retorno, failure: retorno },
        // O Mercado Pago só volta sozinho e só avisa (webhook) para endereço
        // público com https — em localhost o comprador clica em "Voltar".
        ...(publico
          ? { auto_return: "approved", notification_url: `${this.appUrl}/api/pagamentos/webhook` }
          : {}),
        // Boleto fica de fora: leva até 3 dias e a vaga só fica reservada por
        // alguns minutos. Pix, crédito, débito e saldo continuam.
        payment_methods: { excluded_payment_types: [{ id: "ticket" }, { id: "atm" }] },
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: input.expiraEm.toISOString(),
        statement_descriptor: "LPZ TRAINING",
      }),
    });
    return { preferenceId: preferencia.id, checkoutUrl: preferencia.init_point };
  }

  // Status pela nossa referência (external_reference = compra ou pedido):
  // pode haver várias tentativas (ex: cartão recusado e depois Pix aprovado).
  async consultarPagamento({ referencia }: ReferenciaPagamento): Promise<SituacaoPagamento> {
    const busca = await this.chamar<{ results: PagamentoMP[] }>(
      `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&sort=date_created&criteria=desc`,
    );
    const aprovado = busca.results.find((p) => p.status === "approved");
    if (aprovado)
      return { status: "pago", forma: formaDoMP(aprovado), parcelas: aprovado.installments ?? null, pagamentoId: String(aprovado.id) };
    if (busca.results.some((p) => p.status === "refunded" || p.status === "charged_back")) return { status: "reembolsado" };
    return { status: "pendente" };
  }

  // Estorno total ou parcial (um item da sacola) de um pagamento aprovado.
  async estornar({ pagamentoId, valorCentavos, chave }: EstornoInput): Promise<void> {
    if (!/^\d+$/.test(pagamentoId)) throw new Error("Id de pagamento inválido para estorno");
    await this.chamar(`/v1/payments/${pagamentoId}/refunds`, {
      method: "POST",
      headers: { "X-Idempotency-Key": `estorno-${chave}` },
      body: JSON.stringify({ amount: valorCentavos / 100 }),
    });
  }

  // Webhook: o aviso traz só o id do pagamento; descobrimos a referência
  // (compra ou pedido) aqui.
  async referenciaDoPagamento(pagamentoId: string): Promise<string | null> {
    if (!/^\d+$/.test(pagamentoId)) return null;
    const pagamento = await this.chamar<PagamentoMP>(`/v1/payments/${pagamentoId}`);
    return pagamento.external_reference;
  }
}
