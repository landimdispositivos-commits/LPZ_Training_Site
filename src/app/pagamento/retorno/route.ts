import { and, eq, or } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { barPedidosOnline, pedidos } from "@/db/schema";
import { confirmarPedidoOnline } from "@/modules/bar/online";
import { auth } from "@/modules/auth/auth";
import { confirmarPagamento } from "@/modules/ingressos";

// Volta do Checkout Pro. Os parâmetros da URL (status=approved etc.) NÃO são
// confiáveis: só usamos o id do pedido e perguntamos ao Mercado Pago.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const destino = (caminho: string) => NextResponse.redirect(new URL(caminho, url.origin));

  const sessao = await auth.api.getSession({ headers: request.headers });
  if (!sessao) return destino("/congressistas");

  // external_reference = id da compra (sacola) ou do pedido (item único).
  const referencia = z.uuid().safeParse(url.searchParams.get("external_reference"));
  if (!referencia.success) return destino("/congressistas/minha-area");

  // Pedido online do Bar (só o dono confirma por aqui).
  const [pedidoBar] = await db
    .select({ id: barPedidosOnline.id })
    .from(barPedidosOnline)
    .where(and(eq(barPedidosOnline.id, referencia.data), eq(barPedidosOnline.email, sessao.user.email)));
  if (pedidoBar) {
    try {
      await confirmarPedidoOnline(pedidoBar.id);
    } catch (erro) {
      console.error("Falha ao confirmar pedido do Bar no retorno", { pedidoId: pedidoBar.id, erro: (erro as Error).message });
    }
    return destino(`/bar/pedido/${pedidoBar.id}`);
  }

  // Só o dono do pedido confirma por aqui.
  const pedido = await db.query.pedidos.findFirst({
    where: and(
      or(eq(pedidos.compraId, referencia.data), eq(pedidos.id, referencia.data)),
      eq(pedidos.email, sessao.user.email),
    ),
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
