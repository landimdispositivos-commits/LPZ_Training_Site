import type {
  CriarPreferenciaInput,
  CriarPreferenciaResultado,
  PaymentProvider,
  ReferenciaPagamento,
  StatusPagamento,
} from "./payment-provider";

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

type PagamentoMP = { id: number; status: string; external_reference: string | null };

export class MercadoPagoProvider implements PaymentProvider {
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
      headers: { "X-Idempotency-Key": `pref-${input.pedidoId}-${input.expiraEm.getTime()}` },
      body: JSON.stringify({
        items: [
          {
            id: input.pedidoId,
            title: input.descricao,
            quantity: 1,
            currency_id: "BRL",
            unit_price: input.valorCentavos / 100,
          },
        ],
        payer: { email: input.compradorEmail },
        external_reference: input.pedidoId,
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

  // Status pelo nosso pedido (external_reference): pode haver várias
  // tentativas (ex: cartão recusado e depois Pix aprovado).
  async consultarStatus({ pedidoId }: ReferenciaPagamento): Promise<StatusPagamento> {
    const busca = await this.chamar<{ results: PagamentoMP[] }>(
      `/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc`,
    );
    const status = busca.results.map((p) => p.status);
    if (status.includes("approved")) return "pago";
    if (status.some((s) => s === "refunded" || s === "charged_back")) return "reembolsado";
    return "pendente";
  }

  // Webhook: o aviso traz só o id do pagamento; descobrimos o pedido aqui.
  async pedidoDoPagamento(pagamentoId: string): Promise<string | null> {
    if (!/^\d+$/.test(pagamentoId)) return null;
    const pagamento = await this.chamar<PagamentoMP>(`/v1/payments/${pagamentoId}`);
    return pagamento.external_reference;
  }
}
