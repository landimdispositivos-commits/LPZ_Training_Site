"use server";

import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { obterSessao } from "@/modules/auth/sessao";
import { cancelarPedidoPendente, confirmarPagamento } from "@/modules/ingressos";
import { paymentProvider } from "@/modules/pagamentos";
import { FakePaymentProvider } from "@/modules/pagamentos/fake-payment-provider";
import { MAX_PARCELAS } from "@/modules/pagamentos/formas";

// Só existe em TEST_MODE: simula o que o Mercado Pago faria. Em produção o
// provider real não é o FakePaymentProvider e estas ações viram 404.
export async function decidirPagamentoSimuladoAction(form: FormData) {
  const simulador = paymentProvider instanceof FakePaymentProvider ? paymentProvider : null;
  if (process.env.TEST_MODE !== "true" || !simulador) return notFound();

  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");

  const pedidoId = z.uuid().safeParse(form.get("pedidoId"));
  if (!pedidoId.success) notFound();

  const pedido = await db.query.pedidos.findFirst({
    where: and(eq(pedidos.id, pedidoId.data), eq(pedidos.email, sessao.user.email)),
  });
  if (!pedido?.gatewayPreferenceId) notFound();

  if (form.get("decisao") === "aprovar") {
    // Forma escolhida na tela de teste (no real, quem informa é o Mercado Pago).
    const forma = z.enum(["pix", "credito", "debito"]).catch("pix").parse(form.get("forma"));
    const parcelas = forma === "credito" ? z.coerce.number().int().min(1).max(MAX_PARCELAS).catch(1).parse(form.get("parcelas")) : 1;
    simulador.aprovarManualmente(pedido.gatewayPreferenceId, forma, parcelas);
    await confirmarPagamento(pedido.id);
    redirect("/congressistas/minha-area?pago=1");
  }

  simulador.recusarManualmente(pedido.gatewayPreferenceId);
  await cancelarPedidoPendente(pedido.id, sessao.user.email);
  redirect("/ingressos?cancelado=1");
}
