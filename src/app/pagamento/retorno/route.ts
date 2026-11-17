import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pedidos } from "@/db/schema";
import { auth } from "@/modules/auth/auth";
import { confirmarPagamento } from "@/modules/ingressos";

// Volta do Checkout Pro. Os parâmetros da URL (status=approved etc.) NÃO são
// confiáveis: só usamos o id do pedido e perguntamos ao Mercado Pago.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const destino = (caminho: string) => NextResponse.redirect(new URL(caminho, url.origin));

  const sessao = await auth.api.getSession({ headers: request.headers });
  if (!sessao) return destino("/congressistas");

  const pedidoId = z.uuid().safeParse(url.searchParams.get("external_reference"));
  if (!pedidoId.success) return destino("/congressistas/minha-area");

  // Só o dono do pedido confirma por aqui.
  const pedido = await db.query.pedidos.findFirst({
    where: and(eq(pedidos.id, pedidoId.data), eq(pedidos.email, sessao.user.email)),
  });
  if (!pedido) return destino("/congressistas/minha-area");

  try {
    const status = await confirmarPagamento(pedido.id);
    if (status === "pago") return destino("/congressistas/minha-area?pago=1");
  } catch (erro) {
    console.error("Falha ao confirmar pagamento no retorno", { pedidoId: pedido.id, erro: (erro as Error).message });
  }
  return destino("/ingressos?aguardando=1");
}
