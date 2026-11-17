import type {
  CriarPreferenciaInput,
  CriarPreferenciaResultado,
  PaymentProvider,
  ReferenciaPagamento,
  StatusPagamento,
} from "./payment-provider";

// Implementação usada quando TEST_MODE=true. Simula o fluxo do gateway sem
// nenhuma chamada de rede, para desenvolvimento e testes automatizados.
// Nunca usar em produção — ver seleção do provider em `./index.ts`.
//
// O mapa de status fica em globalThis para sobreviver ao hot reload do
// `next dev` (que recarrega os módulos). Reiniciar o servidor zera tudo — os
// pedidos simulados voltam a "pendente", o que é aceitável em dev.
const globalComStatus = globalThis as typeof globalThis & {
  __lpzPagamentosSimulados?: Map<string, StatusPagamento>;
};

export class FakePaymentProvider implements PaymentProvider {
  private readonly status = (globalComStatus.__lpzPagamentosSimulados ??= new Map<string, StatusPagamento>());

  async criarPreferencia(input: CriarPreferenciaInput): Promise<CriarPreferenciaResultado> {
    const preferenceId = `fake-${input.pedidoId}`;
    this.status.set(preferenceId, "pendente");
    return {
      preferenceId,
      checkoutUrl: `/pagamento/simulado?preference=${preferenceId}`,
    };
  }

  async consultarStatus({ preferenceId }: ReferenciaPagamento): Promise<StatusPagamento> {
    return this.status.get(preferenceId) ?? "pendente";
  }

  // Auxiliar exclusivo de teste/dev: aprova manualmente um pagamento simulado.
  aprovarManualmente(preferenceId: string) {
    this.status.set(preferenceId, "pago");
  }

  // Auxiliar exclusivo de teste/dev: simula pagamento recusado/desistência.
  recusarManualmente(preferenceId: string) {
    this.status.set(preferenceId, "cancelado");
  }
}
