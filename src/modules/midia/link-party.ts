import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";

// Link do botão "LPZ Party" da página inicial (site externo da organização),
// editado pela organização na própria página inicial.
export const CHAVE_LINK_PARTY = "link_lpz_party";

export async function obterLinkParty(): Promise<string | null> {
  const [linha] = await db.select().from(configuracoes).where(eq(configuracoes.chave, CHAVE_LINK_PARTY)).limit(1);
  return linha?.valor || null;
}
