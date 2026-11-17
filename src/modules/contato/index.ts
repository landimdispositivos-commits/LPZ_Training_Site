import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";

// Contatos públicos do evento (Fale conosco), editados pela organização na
// própria página (canetinha). Vazio = ainda não preenchido (não aparece).
export const CHAVES_CONTATO = ["contato_email", "contato_whatsapp", "contato_instagram"] as const;

export type Contatos = { email: string | null; whatsapp: string | null; instagram: string | null };

export async function obterContatos(): Promise<Contatos> {
  const linhas = await db
    .select()
    .from(configuracoes)
    .where(inArray(configuracoes.chave, [...CHAVES_CONTATO]));
  const valor = (chave: string) => linhas.find((l) => l.chave === chave)?.valor || null;
  return {
    email: valor("contato_email"),
    whatsapp: valor("contato_whatsapp"),
    instagram: valor("contato_instagram"),
  };
}

// Link do WhatsApp: só os dígitos, com DDI (55 para Brasil se vier sem).
export function linkWhatsapp(numero: string | null) {
  const digitos = numero?.replace(/\D/g, "") ?? "";
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos.length <= 11 ? `55${digitos}` : digitos}`;
}

export { ASSUNTOS, LISTA_ASSUNTOS, type Assunto } from "./assuntos";
