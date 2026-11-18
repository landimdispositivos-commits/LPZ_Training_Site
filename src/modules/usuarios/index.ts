import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { contas, ingressos, lotes, pedidos, professores, sessoes, usuarios } from "@/db/schema";
import { TIPOS_PRODUTO, type TipoProduto } from "@/modules/ingressos/produtos";

export const PAPEIS = ["congressista", "profissional", "portaria", "organizador", "acesso_total"] as const;
export type Papel = (typeof PAPEIS)[number];

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  congressista: "Usuário comum: compra ingresso e vê a própria área.",
  profissional: "Professor(a)/DJ: vê a área do profissional e as próprias aulas.",
  portaria: "Faz check-in na entrada. Exige verificação em duas etapas.",
  organizador: "Gestão do evento: painel, usuários, financeiro, check-in e conteúdo. Exige duas etapas.",
  acesso_total: "Acesso total a todas as áreas do site, inclusive as que forem criadas. Exige duas etapas.",
};

function escaparLike(texto: string) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listarUsuarios({ busca, papel }: { busca?: string; papel?: Papel }) {
  const filtros = [];
  if (busca && busca.trim().length >= 2) {
    const padrao = `%${escaparLike(busca.trim())}%`;
    filtros.push(or(ilike(usuarios.name, padrao), ilike(usuarios.email, padrao)));
  }
  if (papel) filtros.push(eq(usuarios.papel, papel));

  return db
    .select({
      id: usuarios.id,
      nome: usuarios.name,
      email: usuarios.email,
      papel: usuarios.papel,
      duasEtapas: usuarios.twoFactorEnabled,
      criadoEm: usuarios.createdAt,
      professorNome: professores.nome,
      // Tem senha própria? (contas só do Google não têm — e o Better Auth
      // pede a senha para ativar as duas etapas.)
      temSenha: sql<boolean>`exists (select 1 from ${contas} where ${contas.userId} = ${usuarios.id} and ${contas.providerId} = 'credential')`,
    })
    .from(usuarios)
    .leftJoin(professores, eq(professores.id, usuarios.professorId))
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(asc(usuarios.name))
    .limit(200);
}

export async function contarPorPapel() {
  const linhas = await db
    .select({ papel: usuarios.papel, total: sql<number>`count(*)`.mapWith(Number) })
    .from(usuarios)
    .groupBy(usuarios.papel);
  return Object.fromEntries(linhas.map((l) => [l.papel, l.total])) as Partial<Record<Papel, number>>;
}

// Troca o perfil e encerra as sessões abertas da pessoa, para o novo acesso
// valer já no próximo login (as páginas também conferem o papel no banco).
export async function alterarPapel(usuarioId: string, papel: Papel) {
  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ papel, updatedAt: new Date() }).where(eq(usuarios.id, usuarioId));
    await tx.delete(sessoes).where(eq(sessoes.userId, usuarioId));
  });
}

// Cadastro completo de cada pessoa + forma de cadastro + compras, para a
// tela "Usuários" e a exportação para Excel (só organizador).
export async function listarCadastros({ busca, papel, limite = 500 }: { busca?: string; papel?: Papel; limite?: number }) {
  const filtros = [];
  if (busca && busca.trim().length >= 2) {
    const padrao = `%${escaparLike(busca.trim())}%`;
    filtros.push(or(ilike(usuarios.name, padrao), ilike(usuarios.email, padrao), ilike(usuarios.cidade, padrao)));
  }
  if (papel) filtros.push(eq(usuarios.papel, papel));

  const lista = await db
    .select({
      id: usuarios.id,
      nome: usuarios.name,
      apelido: usuarios.apelido,
      email: usuarios.email,
      emailVerificado: usuarios.emailVerified,
      papel: usuarios.papel,
      celular: usuarios.celular,
      cpf: usuarios.cpf,
      dataNascimento: usuarios.dataNascimento,
      pais: usuarios.pais,
      uf: usuarios.uf,
      cidade: usuarios.cidade,
      cep: usuarios.cep,
      logradouro: usuarios.logradouro,
      numero: usuarios.numero,
      complemento: usuarios.complemento,
      bairro: usuarios.bairro,
      comoConheceu: usuarios.comoConheceu,
      cadastroCompletoEm: usuarios.cadastroCompletoEm,
      criadoEm: usuarios.createdAt,
    })
    .from(usuarios)
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(desc(usuarios.createdAt))
    .limit(limite);

  if (lista.length === 0) return [];

  const [provedores, compras] = await Promise.all([
    db
      .select({ usuarioId: contas.userId, provedor: contas.providerId })
      .from(contas)
      .where(inArray(contas.userId, lista.map((u) => u.id))),
    db
      .select({
        email: pedidos.email,
        status: pedidos.status,
        valorCentavos: pedidos.valorCentavos,
        criadoEm: pedidos.criadoEm,
        tipo: lotes.tipo,
        loteNome: lotes.nome,
        checkinEm: ingressos.checkinEm,
      })
      .from(pedidos)
      .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
      .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
      .where(inArray(pedidos.email, lista.map((u) => u.email)))
      .orderBy(desc(pedidos.criadoEm)),
  ]);

  return lista.map((u) => {
    const meus = provedores.filter((p) => p.usuarioId === u.id).map((p) => p.provedor);
    const formaCadastro = [meus.includes("credential") && "E-mail e senha", meus.includes("google") && "Google"]
      .filter(Boolean)
      .join(" + ") || "Convite pendente";
    const comprasDele = compras.filter((c) => c.email === u.email);
    const pagos = new Set(comprasDele.filter((c) => c.status === "pago").map((c) => c.tipo));
    return {
      ...u,
      formaCadastro,
      compras: comprasDele,
      comprou: Object.fromEntries(TIPOS_PRODUTO.map((t) => [t, pagos.has(t)])) as Record<TipoProduto, boolean>,
      totalPagoCentavos: comprasDele.filter((c) => c.status === "pago").reduce((t, c) => t + c.valorCentavos, 0),
    };
  });
}

export type Cadastro = Awaited<ReturnType<typeof listarCadastros>>[number];
