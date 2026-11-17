import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditoria } from "@/db/schema";

// ---------------------------------------------------------------------------
// Trilha de auditoria de usuários e permissões. Regra: só gravar e ler —
// nunca editar nem apagar registros (não existe função para isso de propósito).
// ---------------------------------------------------------------------------

export const ACOES = {
  perfil_alterado: "Perfil de acesso alterado",
  convite_enviado: "Convite enviado",
  cadastro_concluido: "Cadastro concluído",
  ficha_atualizada: "Dados pessoais atualizados",
} as const;
export type Acao = keyof typeof ACOES;

type Pessoa = { id: string; name: string; email: string } | null;

// Nomes dos campos da ficha, para o histórico ficar legível.
export const NOME_CAMPO: Record<string, string> = {
  nome: "Nome",
  dataNascimento: "Nascimento",
  celular: "Celular",
  pais: "País",
  uf: "UF",
  cidade: "Cidade",
  cpf: "CPF",
  cep: "CEP",
  logradouro: "Endereço",
  numero: "Número",
  complemento: "Complemento",
  bairro: "Bairro",
  naturalidadeCidade: "Naturalidade (cidade)",
  naturalidadeEstado: "Naturalidade (estado)",
  comoConheceu: "Como conheceu",
};

async function origemDaRequisicao() {
  try {
    const h = await headers();
    const ip = (h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
    return { ip: ip || null, navegador: h.get("user-agent")?.slice(0, 300) ?? null };
  } catch {
    // Fora de uma requisição (ex.: script de linha de comando).
    return { ip: null, navegador: null };
  }
}

// Grava um evento. Falha de auditoria não pode derrubar a operação principal,
// mas fica registrada no log do servidor.
export async function registrarAuditoria(evento: {
  acao: Acao;
  autor: Pessoa;
  alvo: Pessoa;
  detalhes?: Record<string, unknown>;
}) {
  try {
    const origem = await origemDaRequisicao();
    await db.insert(auditoria).values({
      acao: evento.acao,
      autorId: evento.autor?.id ?? null,
      autorNome: evento.autor?.name ?? null,
      autorEmail: evento.autor?.email ?? null,
      alvoId: evento.alvo?.id ?? null,
      alvoNome: evento.alvo?.name ?? null,
      alvoEmail: evento.alvo?.email ?? null,
      detalhes: evento.detalhes ?? null,
      ...origem,
    });
  } catch (erro) {
    console.error("Falha ao gravar auditoria", { acao: evento.acao, erro: (erro as Error).message });
  }
}

function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listarAuditoria({
  alvoId,
  busca,
  acao,
  limite = 300,
}: {
  alvoId?: string;
  busca?: string;
  acao?: Acao;
  limite?: number;
}) {
  const filtros = [];
  if (alvoId) filtros.push(eq(auditoria.alvoId, alvoId));
  if (acao) filtros.push(eq(auditoria.acao, acao));
  if (busca && busca.trim().length >= 2) {
    const p = `%${escaparLike(busca.trim())}%`;
    filtros.push(
      or(
        ilike(auditoria.alvoNome, p),
        ilike(auditoria.alvoEmail, p),
        ilike(auditoria.autorNome, p),
        ilike(auditoria.autorEmail, p),
      ),
    );
  }
  return db
    .select()
    .from(auditoria)
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(desc(auditoria.criadoEm))
    .limit(limite);
}

export type RegistroAuditoria = Awaited<ReturnType<typeof listarAuditoria>>[number];

// Frase curta descrevendo o evento (usada nas telas).
export function descreverEvento(r: RegistroAuditoria, rotuloPapel: (p: string) => string) {
  const d = (r.detalhes ?? {}) as Record<string, unknown>;
  switch (r.acao) {
    case "perfil_alterado":
      return `Perfil: ${rotuloPapel(String(d.antes))} → ${rotuloPapel(String(d.depois))}`;
    case "convite_enviado":
      return `Convite como ${rotuloPapel(String(d.papel))}${d.reenvio ? " (reenvio)" : ""}`;
    case "ficha_atualizada":
    case "cadastro_concluido": {
      const campos = Array.isArray(d.campos) ? (d.campos as string[]).map((c) => NOME_CAMPO[c] ?? c) : [];
      return campos.length ? `Campos: ${campos.join(", ")}` : "";
    }
    default:
      return "";
  }
}

// Histórico de vários usuários de uma vez (para a grade de Usuários).
export async function historicoDos(alvoIds: string[]) {
  if (alvoIds.length === 0) return [];
  return db
    .select()
    .from(auditoria)
    .where(inArray(auditoria.alvoId, alvoIds))
    .orderBy(desc(auditoria.criadoEm))
    .limit(5000);
}
