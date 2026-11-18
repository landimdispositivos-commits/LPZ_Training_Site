// Como chamar a pessoa no site: o apelido escolhido ou, sem ele, o primeiro nome.
export const MAX_APELIDO = 30;

export function comoChamar(user: { name: string; apelido?: string | null }): string {
  const apelido = user.apelido?.trim();
  return apelido || user.name.split(" ")[0];
}

// Normaliza o que veio do formulário: sem espaços sobrando, sem caracteres de
// controle e com tamanho limitado. Vazio = sem apelido (volta ao primeiro nome).
export function normalizarApelido(valor: unknown): { ok: true; apelido: string | null } | { ok: false } {
  if (typeof valor !== "string") return { ok: true, apelido: null };
  // eslint-disable-next-line no-control-regex
  const limpo = valor.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (!limpo) return { ok: true, apelido: null };
  if (limpo.length > MAX_APELIDO) return { ok: false };
  return { ok: true, apelido: limpo };
}
