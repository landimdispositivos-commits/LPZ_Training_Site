import { storageAdapter } from "@/modules/midia";

// Serve as fotos enviadas pela organização (ver src/modules/midia). O nome é
// validado pelo adapter (UUID + extensão), então não há como ler outro arquivo.
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...caminho]">) {
  const { caminho } = await ctx.params;
  if (caminho.length !== 1) return new Response("Não encontrado", { status: 404 });

  const arquivo = await storageAdapter.ler(caminho[0]);
  if (!arquivo) return new Response("Não encontrado", { status: 404 });

  return new Response(new Uint8Array(arquivo.conteudo), {
    headers: {
      "Content-Type": arquivo.contentType,
      // Nome do arquivo é único (UUID) e nunca é sobrescrito.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
