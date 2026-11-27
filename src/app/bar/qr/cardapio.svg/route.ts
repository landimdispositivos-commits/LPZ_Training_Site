import qrcode from "qrcode-generator";
import { origemPublica } from "@/modules/bar/origem";

// QR do cardápio do Bar em SVG (vetorial: imprime em qualquer tamanho sem perder
// qualidade). É público de propósito: só aponta para o cardápio aberto.
export async function GET() {
  const url = `${await origemPublica()}/bar`;
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
