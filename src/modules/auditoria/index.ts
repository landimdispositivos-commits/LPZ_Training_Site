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
  cadastro_editado: "Cadastro editado pela organização",
  usuario_excluido: "Usuário excluído",
  compra_cancelada: "Compra cancelada pelo cliente",
  estorno_aprovado: "Estorno aprovado",
  problema_reportado: "Problema reportado",
  bar_evento_salvo: "Bar: evento criado ou alterado",
  bar_produto_salvo: "Bar: produto criado ou alterado",
  bar_estoque_ajustado: "Bar: estoque ajustado",
  bar_compra_registrada: "Bar: compra de insumos registrada",
  bar_comanda_item_cancelado: "Bar: item de comanda cancelado",
  bar_retirada: "Bar: retirada de itens de um ticket",
  bar_venda_estornada: "Bar: venda estornada",
  ver_como_iniciado: "Organização passou a ver o site como o usuário",
  ver_como_encerrado: "Organização voltou para a própria conta",
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
  email: "E-mail",
  apelido: "Apelido",
};

// Campos com dado pessoal sensível: a auditoria registra que mudou, mas guarda
// o valor mascarado (LGPD — minimização). Os demais guardam antes → depois.
const MASCARAR: Record<string, (v: string) => string> = {
  cpf: (v) => (v.length >= 2 ? `***.***.**${v.slice(-2, -1)}-${v.slice(-1)}` : "***"),
  celular: (v) => (v.length > 4 ? `•••• ${v.slice(-4)}` : "••••"),
  dataNascimento: () => "••/••/••••",
  cep: () => "•••••-•••",
  logradouro: () => "(oculto)",
  numero: () => "(oculto)",
  complemento: () => "(oculto)",
  bairro: () => "(oculto)",
};

export type Mudanca = { de: string | null; para: string | null };

// Compara antes x depois e devolve os campos alterados com os valores (ou
// mascarados, nos campos sensíveis). "name" vira "nome" para o histórico.
export function diferencas(antes: Record<string, unknown>, depois: Record<string, unknown>) {
  const mudancas: Record<string, Mudanca> = {};
  for (const [campoOriginal, valorNovo] of Object.entries(depois)) {
    const velho = antes[campoOriginal] ?? null;
    const novo = valorNovo ?? null;
    if (velho === novo) continue;
    const campo = campoOriginal === "name" ? "nome" : campoOriginal;
    const mascara = MASCARAR[campo];
    const mostrar = (v: unknown) => (v === null || v === "" ? null : mascara ? mascara(String(v)) : String(v));
    mudancas[campo] = { de: mostrar(velho), para: mostrar(novo) };
  }
  return { campos: Object.keys(mudancas), mudancas };
}

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
      if (Array.isArray(d.antes) || Array.isArray(d.depois)) {
        const lista = (v: unknown) => (Array.isArray(v) ? v.map((p) => rotuloPapel(String(p))).join(" + ") : rotuloPapel(String(v)));
        return `Perfis: ${lista(d.antes)} → ${lista(d.depois)}`;
      }
      return `Perfil: ${rotuloPapel(String(d.antes))} → ${rotuloPapel(String(d.depois))}`;
    case "compra_cancelada":
    case "estorno_aprovado":
      return [d.produto, d.valor].filter(Boolean).join(" · ") || `Pedido ${String(d.pedidoId ?? "").slice(0, 8).toUpperCase()}`;
    case "problema_reportado":
      return String(d.pagina ?? "");
    case "convite_enviado":
      return `Convite como ${rotuloPapel(String(d.papel))}${d.reenvio ? " (reenvio)" : ""}`;
    case "usuario_excluido":
      return `Perfil era ${rotuloPapel(String(d.papel))}${d.pedidos ? ` · ${d.pedidos} pedido(s) mantidos no financeiro` : ""}`;
    case "ficha_atualizada":
    case "cadastro_editado":
    case "cadastro_concluido": {
      const mudancas = d.mudancas as Record<string, Mudanca> | undefined;
      if (mudancas && Object.keys(mudancas).length) {
        return Object.entries(mudancas)
          .map(([c, m]) => `${NOME_CAMPO[c] ?? c}: ${m.de ?? "(vazio)"} → ${m.para ?? "(vazio)"}`)
          .join(" · ");
      }
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
