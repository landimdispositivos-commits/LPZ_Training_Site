import type {
  CartaoGateway,
  CobrancaCartaoInput,
  ResultadoCobrancaCartao,
  CriarPreferenciaInput,
  CriarPreferenciaResultado,
  PaymentProvider,
  ReferenciaPagamento,
  SituacaoPagamento,
} from "./payment-provider";
import type { FormaPagamento } from "./formas";

// Implementação usada quando TEST_MODE=true sem credencial do Mercado Pago.
// Simula o fluxo do gateway sem nenhuma chamada de rede (tela
// /pagamento/simulado). Nunca usar em produção — ver `./index.ts`.
//
// O mapa fica em globalThis para sobreviver ao hot reload do `next dev`.
// Reiniciar o servidor zera tudo — pedidos simulados voltam a "pendente".
const globalComStatus = globalThis as typeof globalThis & {
  __lpzPagamentosSimulados?: Map<string, SituacaoPagamento>;
};

export class FakePaymentProvider implements PaymentProvider {
  // Cartão salvo simulado: nenhum dado real é digitado nem guardado.
  readonly suportaCartaoSalvo = true;

  async obterOuCriarCliente(email: string): Promise<string> {
    return `fake-cliente-${Buffer.from(email).toString("hex").slice(0, 24)}`;
  }

  // O "token" do simulador é "bandeira:final" (ex.: "visa:4242"), gerado pela tela de teste.
  async salvarCartao(_clienteId: string, token: string): Promise<CartaoGateway> {
    const [bandeira, ultimos4] = token.split(":");
    return {
      cartaoId: `fake-cartao-${Math.random().toString(36).slice(2, 12)}`,
      bandeira: /^[a-z]{3,10}$/.test(bandeira ?? "") ? bandeira : "visa",
      ultimos4: /^\d{4}$/.test(ultimos4 ?? "") ? ultimos4 : "4242",
      validade: "12/30",
    };
  }

  async removerCartao(): Promise<void> {
    // nada a remover fora do nosso banco
  }

  // Cobrança simulada: termina em 0000 = recusada; o resto aprova.
  async cobrarComCartao(input: CobrancaCartaoInput): Promise<ResultadoCobrancaCartao> {
    if (input.token.endsWith(":0000")) return { status: "recusado" };
    if (input.preferenceId) {
      this.situacao.set(input.preferenceId, {
        status: "pago",
        forma: "credito",
        parcelas: input.parcelas,
        pagamentoId: `fake-pay-${input.referencia}`,
      });
    }
    return { status: "aprovado", pagamentoId: `fake-pay-${input.referencia}` };
  }

  private readonly situacao = (globalComStatus.__lpzPagamentosSimulados ??= new Map<string, SituacaoPagamento>());

  async criarPreferencia(input: CriarPreferenciaInput): Promise<CriarPreferenciaResultado> {
    const preferenceId = `fake-${input.referencia}`;
    if (!this.situacao.has(preferenceId)) this.situacao.set(preferenceId, { status: "pendente" });
    return {
      preferenceId,
      checkoutUrl: `/pagamento/simulado?preference=${preferenceId}`,
    };
  }

  async consultarPagamento({ preferenceId }: ReferenciaPagamento): Promise<SituacaoPagamento> {
    return this.situacao.get(preferenceId) ?? { status: "pendente" };
  }

  // Auxiliar exclusivo de teste/dev: aprova o pagamento simulado com a forma
  // escolhida na tela de teste.
  aprovarManualmente(preferenceId: string, forma: FormaPagamento, parcelas: number) {
    this.situacao.set(preferenceId, { status: "pago", forma, parcelas, pagamentoId: `fake-pay-${preferenceId.replace("fake-", "")}` });
  }

  // Modo de teste: o estorno só é registrado no log (nenhum dinheiro envolvido).
  async estornar({ pagamentoId, valorCentavos }: { pagamentoId: string; valorCentavos: number; chave: string }) {
    console.info("[pagamento de teste] Estorno simulado", { pagamentoId, valorCentavos });
  }

  // Auxiliar exclusivo de teste/dev: simula pagamento recusado/desistência.
  recusarManualmente(preferenceId: string) {
    this.situacao.set(preferenceId, { status: "cancelado" });
  }
}
