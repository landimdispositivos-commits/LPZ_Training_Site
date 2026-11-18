import type {
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
  private readonly situacao = (globalComStatus.__lpzPagamentosSimulados ??= new Map<string, SituacaoPagamento>());

  async criarPreferencia(input: CriarPreferenciaInput): Promise<CriarPreferenciaResultado> {
    const preferenceId = `fake-${input.pedidoId}`;
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
    this.situacao.set(preferenceId, { status: "pago", forma, parcelas });
  }

  // Auxiliar exclusivo de teste/dev: simula pagamento recusado/desistência.
  recusarManualmente(preferenceId: string) {
    this.situacao.set(preferenceId, { status: "cancelado" });
  }
}
