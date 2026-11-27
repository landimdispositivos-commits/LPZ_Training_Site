import { headers } from "next/headers";

// Endereço público do site, para o QR do cardápio. Em produção usa o APP_URL.
// Em desenvolvimento (APP_URL = localhost) usa o endereço pelo qual o site foi
// aberto: assim, abrindo pelo IP do computador (ex.: http://192.168.0.10:3005),
// o QR funciona no celular da mesma rede Wi-Fi.
export async function origemPublica() {
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  let local = true;
  try {
    const h = new URL(base).hostname;
    local = h === "localhost" || h === "127.0.0.1";
  } catch {
    local = true;
  }
  if (base && !local) return base;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  // Só aceita um host de aparência normal (evita endereço forjado no cabeçalho).
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return base || "http://localhost:3005";
  const proto = h.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
