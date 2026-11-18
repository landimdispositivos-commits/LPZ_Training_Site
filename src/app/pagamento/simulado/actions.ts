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

  const preferencia = z.string().regex(/^fake-[0-9a-f-]{36}$/).safeParse(form.get("preferencia"));
  if (!preferencia.success) notFound();

  // Todos os pedidos deste checkout (um item ou a sacola inteira), do próprio comprador.
  const daCompra = await db.query.pedidos.findMany({
    where: and(eq(pedidos.gatewayPreferenceId, preferencia.data), eq(pedidos.email, sessao.user.email)),
  });
  if (daCompra.length === 0) notFound();

  if (form.get("decisao") === "aprovar") {
    // Forma escolhida na tela de teste (no real, quem informa é o Mercado Pago).
    const forma = z.enum(["pix", "credito", "debito"]).catch("pix").parse(form.get("forma"));
    const parcelas = forma === "credito" ? z.coerce.number().int().min(1).max(MAX_PARCELAS).catch(1).parse(form.get("parcelas")) : 1;
    simulador.aprovarManualmente(preferencia.data, forma, parcelas);
    await confirmarPagamento(daCompra[0].id);
    redirect("/congressistas/minha-area?pago=1");
  }

  simulador.recusarManualmente(preferencia.data);
  for (const p of daCompra) await cancelarPedidoPendente(p.id, sessao.user.email);
  redirect("/ingressos?cancelado=1");
}
