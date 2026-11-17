import type { PaymentProvider } from "./payment-provider";
import { FakePaymentProvider } from "./fake-payment-provider";
import { MercadoPagoProvider } from "./mercado-pago-provider";

// Seleção do adapter em um único lugar:
// 1. MERCADOPAGO_ACCESS_TOKEN preenchido → Mercado Pago de verdade (com a
//    credencial de teste em dev, nenhuma cobrança real acontece).
// 2. Sem token e TEST_MODE=true → simulador local (/pagamento/simulado).
// 3. Nenhum dos dois → erro: produção nunca roda sem gateway configurado.
function criarPaymentProvider(): PaymentProvider {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (token) {
    return new MercadoPagoProvider(token, (process.env.APP_URL ?? "http://localhost:3005").replace(/\/$/, ""));
  }
  if (process.env.TEST_MODE === "true") {
    return new FakePaymentProvider();
  }
  throw new Error(
    "Pagamento não configurado: preencha MERCADOPAGO_ACCESS_TOKEN no .env (ou use TEST_MODE=true em desenvolvimento).",
  );
}

export const paymentProvider = criarPaymentProvider();
export { MercadoPagoProvider };
export type {
  PaymentProvider,
  StatusPagamento,
  CriarPreferenciaInput,
  CriarPreferenciaResultado,
  ReferenciaPagamento,
} from "./payment-provider";
