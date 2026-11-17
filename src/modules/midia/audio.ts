// Áudios (músicas, playlists, sets de DJ) entram como link do Spotify ou do
// SoundCloud e são guardados já como URL de incorporação ("embed"). Só esses
// dois domínios são aceitos — nada de iframe para endereço qualquer.

const TIPOS_SPOTIFY = new Set(["track", "album", "playlist", "episode", "show", "artist"]);

export function urlEmbedAudio(entrada: string): string | null {
  let url: URL;
  try {
    url = new URL(entrada.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  if (host === "open.spotify.com") {
    const partes = url.pathname.split("/").filter(Boolean).filter((p) => !p.startsWith("intl-"));
    const [tipo, id] = partes[0] === "embed" ? partes.slice(1) : partes;
    if (!tipo || !id || !TIPOS_SPOTIFY.has(tipo) || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
    return `https://open.spotify.com/embed/${tipo}/${id}`;
  }

  if (host === "soundcloud.com" || host === "on.soundcloud.com") {
    const caminho = url.pathname.replace(/\/+$/, "");
    if (!/^\/[A-Za-z0-9_\-/]+$/.test(caminho) || caminho.length < 2) return null;
    const original = `https://${host}${caminho}`;
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(original)}&color=%23e6b54a&visual=false`;
  }

  return null;
}

export function ehSpotify(embed: string) {
  return embed.startsWith("https://open.spotify.com/embed/");
}
