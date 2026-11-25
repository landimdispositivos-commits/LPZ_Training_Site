// Proteção CSRF para route handlers que recebem POST de formulário (server
// actions já fazem essa checagem sozinhas): o Origin precisa ser o próprio site.
export function origemDoProprioSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Redirect relativo (303 = "veja outra página" após POST). Relativo para não
// depender do host interno quando o site roda atrás do Nginx/Cloudflare.
export function redirecionar(caminho: string) {
  return new Response(null, { status: 303, headers: { Location: caminho } });
}
