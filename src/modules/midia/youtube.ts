// Aceita link do YouTube (watch, youtu.be, shorts, embed) ou o ID puro.
export function extrairIdYoutube(entrada: string) {
  const valor = entrada.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(valor)) return valor;
  try {
    const url = new URL(valor);
    const host = url.hostname.replace(/^(www\.|m\.)/, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
