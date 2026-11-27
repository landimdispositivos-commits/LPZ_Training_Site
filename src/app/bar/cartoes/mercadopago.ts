"use client";

// Carrega o MP.js (SDK oficial do Mercado Pago) uma única vez. Os campos de
// cartão e código de segurança são iframes do próprio Mercado Pago: o que o
// cliente digita NUNCA passa pelo nosso site nem pelo nosso servidor.

export type CampoMP = { mount(id: string): CampoMP; unmount(): void };
export type MercadoPagoSDK = {
  fields: {
    create(tipo: "cardNumber" | "expirationDate" | "securityCode", opcoes?: { placeholder?: string }): CampoMP;
    createCardToken(dados: Record<string, string>): Promise<{ id: string }>;
  };
};

declare global {
  interface Window {
    MercadoPago?: new (chavePublica: string, opcoes?: { locale: string }) => MercadoPagoSDK;
  }
}

let carregando: Promise<void> | null = null;

function carregarScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("sem janela"));
  if (window.MercadoPago) return Promise.resolve();
  carregando ??= new Promise<void>((ok, erro) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => {
      carregando = null;
      erro(new Error("Não foi possível carregar o Mercado Pago."));
    };
    document.head.appendChild(s);
  });
  return carregando;
}

export async function iniciarMercadoPago(chavePublica: string): Promise<MercadoPagoSDK> {
  await carregarScript();
  return new window.MercadoPago!(chavePublica, { locale: "pt-BR" });
}
