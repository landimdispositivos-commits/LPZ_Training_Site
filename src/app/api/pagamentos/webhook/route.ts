import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { confirmarPedidoOnline } from "@/modules/bar/online";
import { confirmarCompra } from "@/modules/ingressos";
import { MercadoPagoProvider, paymentProvider } from "@/modules/pagamentos";

// Avisos (webhooks) do Mercado Pago: chegam quando um pagamento muda — é o
// que confirma o Pix pago depois que a pessoa fechou a página.
//
// Segurança: a assinatura (x-signature) é conferida com o segredo do painel
// do Mercado Pago (MERCADOPAGO_WEBHOOK_SECRET). Sem segredo configurado, o
// aviso é recusado. E mesmo com assinatura válida, o status do pagamento é
// sempre lido da API do Mercado Pago, nunca do corpo do aviso.
function assinaturaValida(request: NextRequest, dataId: string, segredo: string) {
  const cabecalho = request.headers.get("x-signature") ?? "";
  const partes = Object.fromEntries(
    cabecalho.split(",").map((p) => p.trim().split("=", 2) as [string, string]),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const requestId = request.headers.get("x-request-id");
  const manifesto = [`id:${dataId.toLowerCase()}`, requestId ? `request-id:${requestId}` : null, `ts:${ts}`]
    .filter(Boolean)
    .join(";") + ";";
  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");
  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!segredo || !(paymentProvider instanceof MercadoPagoProvider)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const corpo = (await request.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const tipo = url.searchParams.get("type") ?? corpo?.type;
  const dataId = String(url.searchParams.get("data.id") ?? corpo?.data?.id ?? "");
  if (!dataId || !assinaturaValida(request, dataId, segredo)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Outros tipos de aviso não interessam aqui.
  if (tipo !== "payment") return NextResponse.json({ ok: true });

  try {
    const referencia = await paymentProvider.referenciaDoPagamento(dataId);
    // Pedido online do Bar tem prioridade; senão é compra de ingresso.
    if (referencia && !(await confirmarPedidoOnline(referencia))) await confirmarCompra(referencia);
  } catch (erro) {
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    console.error("Falha ao processar webhook do Mercado Pago", (erro as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
