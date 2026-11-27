import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { barCartoesSalvos } from "@/db/schema";
import { paymentProvider } from "@/modules/pagamentos";

export const MAX_CARTOES = 5;

export async function cartoesDoCliente(usuarioId: string) {
  return db
    .select({
      id: barCartoesSalvos.id,
      bandeira: barCartoesSalvos.bandeira,
      ultimos4: barCartoesSalvos.ultimos4,
      validade: barCartoesSalvos.validade,
      padrao: barCartoesSalvos.padrao,
      gatewayCartaoId: barCartoesSalvos.gatewayCartaoId,
      gatewayClienteId: barCartoesSalvos.gatewayClienteId,
    })
    .from(barCartoesSalvos)
    .where(eq(barCartoesSalvos.usuarioId, usuarioId))
    .orderBy(desc(barCartoesSalvos.padrao), asc(barCartoesSalvos.criadoEm));
}

// "12/30" → vencido? (vale até o fim do mês de validade)
export function cartaoVencido(validade: string, agora = new Date()) {
  const [mes, ano] = validade.split("/").map(Number);
  if (!mes || !ano) return false;
  const fim = new Date(2000 + ano, mes, 1); // 1º dia do mês seguinte
  return agora >= fim;
}

export const ROTULO_BANDEIRA: Record<string, string> = {
  visa: "Visa",
  master: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
  debvisa: "Visa Débito",
  debmaster: "Mastercard Débito",
  debelo: "Elo Débito",
};

export function rotuloBandeira(b: string) {
  return ROTULO_BANDEIRA[b] ?? (b ? b.charAt(0).toUpperCase() + b.slice(1) : "Cartão");
}

// Remove todos os cartões do cliente no gateway e no nosso banco (LGPD: exclusão
// de conta). Falha no gateway não impede a exclusão da conta, mas fica no log.
export async function removerTodosOsCartoes(usuarioId: string) {
  const cartoes = await cartoesDoCliente(usuarioId);
  for (const c of cartoes) {
    try {
      await paymentProvider.removerCartao(c.gatewayClienteId, c.gatewayCartaoId);
    } catch (erro) {
      console.error("Falha ao remover cartão salvo no gateway", (erro as Error).message);
    }
  }
  await db.delete(barCartoesSalvos).where(eq(barCartoesSalvos.usuarioId, usuarioId));
}
