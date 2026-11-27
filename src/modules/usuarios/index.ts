import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { agruparPorPedido, presencasDosPedidos } from "@/modules/presencas";
import { db } from "@/db";
import { contas, ingressos, lotes, pedidos, professores, sessoes, usuarios } from "@/db/schema";
import { type TipoProduto, tiposDoCatalogo } from "@/modules/ingressos/produtos";
import { PERFIS_BAR, perfilPrincipal, type PerfilBar } from "@/modules/auth/papeis";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

export const PAPEIS = ["congressista", "profissional", "portaria", "midias", "organizador", "acesso_total", ...PERFIS_BAR] as const;
export type Papel = (typeof PAPEIS)[number];
// Os perfis do Bar vivem só em perfis_extras; o enum do banco (papel principal) não os tem.
export type PapelPrincipal = Exclude<Papel, PerfilBar>;
export function ehPerfilBar(p: string): p is PerfilBar {
  return (PERFIS_BAR as readonly string[]).includes(p);
}

export const DESCRICAO_PAPEL: Record<Papel, string> = {
  congressista: "Usuário comum: compra ingresso e vê a própria área.",
  profissional: "Professor(a)/DJ: vê a área do profissional e as próprias aulas.",
  portaria: "Faz check-in na entrada. Exige verificação em duas etapas.",
  midias: "Cuida das fotos, vídeos e músicas da galeria. Exige duas etapas.",
  organizador: "Gestão do evento: painel, usuários, financeiro, check-in e conteúdo. Exige duas etapas.",
  acesso_total: "Acesso total a todas as áreas do site, inclusive as que forem criadas. Exige duas etapas.",
  bar_gestao: "Gestão do Bar: vê tudo — eventos, produtos, custos, estoque, compras, caixa, dashboard e estornos.",
  bar_admin: "Admin Caixa do Bar: cadastra eventos e produtos e lança estoque e compras. Não vê dashboard nem faz estornos.",
  bar_caixa: "Caixa do Bar: vende (caixa e comandas) e consulta produtos e vendas. Não vê custos nem lucro.",
  bar_balcao: "Balcão do Bar: lê o ticket e marca o pedido como entregue.",
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
  if (papel) filtros.push(ehPerfilBar(papel) ? sql`${papel} = any(${usuarios.perfisExtras})` : or(eq(usuarios.papel, papel), sql`${papel} = any(${usuarios.perfisExtras})`));

  return db
    .select({
      id: usuarios.id,
      nome: usuarios.name,
      email: usuarios.email,
      papel: usuarios.papel,
      perfisExtras: usuarios.perfisExtras,
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

// Pessoas por perfil (conta o principal e os extras: quem tem dois perfis
// aparece nos dois).
export async function contarPorPapel() {
  const resultado = await db.execute<{ perfil: string; total: number }>(
    sql`select p as perfil, count(*)::int as total
        from ${usuarios}, unnest(array[${usuarios.papel}::text] || ${usuarios.perfisExtras}) as p
        group by p`,
  );
  return Object.fromEntries(resultado.rows.map((l) => [l.perfil, Number(l.total)])) as Partial<Record<Papel, number>>;
}

// Define TODOS os perfis da pessoa: o de maior nível vira o principal e os
// outros ficam como extras. Encerra as sessões para valer no próximo login.
export async function alterarPerfis(usuarioId: string, perfis: Papel[]) {
  const principal = perfilPrincipal(perfis) as PapelPrincipal;
  const extras = perfis.filter((p) => p !== principal);
  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ papel: principal, perfisExtras: extras, updatedAt: new Date() }).where(eq(usuarios.id, usuarioId));
    await tx.delete(sessoes).where(eq(sessoes.userId, usuarioId));
  });
}

// Troca o perfil e encerra as sessões abertas da pessoa, para o novo acesso
// valer já no próximo login (as páginas também conferem o papel no banco).
export async function alterarPapel(usuarioId: string, papel: PapelPrincipal) {
  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ papel, updatedAt: new Date() }).where(eq(usuarios.id, usuarioId));
    await tx.delete(sessoes).where(eq(sessoes.userId, usuarioId));
  });
}

// Cadastro completo de cada pessoa + forma de cadastro + compras, para a
// tela "Usuários" e a exportação para Excel (só organizador).
export async function listarCadastros({ busca, papel, limite = 500 }: { busca?: string; papel?: Papel; limite?: number }) {
  await carregarCatalogo();
  const filtros = [];
  if (busca && busca.trim().length >= 2) {
    const padrao = `%${escaparLike(busca.trim())}%`;
    filtros.push(or(ilike(usuarios.name, padrao), ilike(usuarios.email, padrao), ilike(usuarios.cidade, padrao)));
  }
  if (papel) filtros.push(ehPerfilBar(papel) ? sql`${papel} = any(${usuarios.perfisExtras})` : or(eq(usuarios.papel, papel), sql`${papel} = any(${usuarios.perfisExtras})`));

  const lista = await db
    .select({
      id: usuarios.id,
      nome: usuarios.name,
      apelido: usuarios.apelido,
      email: usuarios.email,
      emailVerificado: usuarios.emailVerified,
      papel: usuarios.papel,
      perfisExtras: usuarios.perfisExtras,
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
        pedidoId: pedidos.id,
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

  const presencasPorPedido = agruparPorPedido(await presencasDosPedidos(compras.map((c) => c.pedidoId)));

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
      compras: comprasDele.map((c) => ({ ...c, presencas: presencasPorPedido.get(c.pedidoId) ?? [] })),
      comprou: Object.fromEntries(tiposDoCatalogo().map((t) => [t, pagos.has(t)])) as Record<TipoProduto, boolean>,
      totalPagoCentavos: comprasDele.filter((c) => c.status === "pago").reduce((t, c) => t + c.valorCentavos, 0),
    };
  });
}

export type Cadastro = Awaited<ReturnType<typeof listarCadastros>>[number];
