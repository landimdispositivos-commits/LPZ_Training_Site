import { comoChamar } from "@/modules/perfil/apelido";
import { CampoApelido } from "@/app/_components/campo-apelido";
import { CampoNascimento } from "@/app/_components/campo-nascimento";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { contas, professores, usuarios } from "@/db/schema";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import { ehGestor } from "@/modules/auth/papeis";
import { exigirAdmin } from "@/modules/auth/sessao";
import { BotaoSair } from "../../_components/botao-sair";
import { SiteHeader } from "../../_components/site-header";
import { FormConvidarProfissional } from "./form-convidar-profissional";

export const metadata: Metadata = { title: "Painel — LPZ Training" };


const ATALHOS = [
  { href: "/administradores/checkin", titulo: "Check-in", descricao: "Validar ingressos na entrada do evento.", portaria: true },
  { href: "/administradores/usuarios", titulo: "Usuários", descricao: "Todos os cadastrados e seus dados.", portaria: false },
  { href: "/administradores/permissoes", titulo: "Permissões", descricao: "Dar ou tirar acesso de cada pessoa.", portaria: false },
  { href: "/administradores/auditoria", titulo: "Auditoria", descricao: "Quem alterou o quê, em quem e quando.", portaria: false },
  { href: "/financeiro", titulo: "Financeiro", descricao: "Vendas, lotes, pedidos e exportação.", portaria: false },
  { href: "/administradores/cronograma", titulo: "Cronograma", descricao: "Aulas e atividades por dia.", portaria: false },
  { href: "/administradores/professores", titulo: "Professores", descricao: "Professores e DJs, com foto.", portaria: false },
  { href: "/administradores/fornecedores", titulo: "Fornecedores", descricao: "Contatos, valores e situação.", portaria: false },
  { href: "/administradores/galeria", titulo: "Fotos", descricao: "Fotos da galeria pública.", portaria: false, midias: true },
  { href: "/administradores/audio-video", titulo: "Áudio e vídeo", descricao: "Vídeos do YouTube e músicas/playlists.", portaria: false, midias: true },
  { href: "/administradores/dj", titulo: "DJ", descricao: "Área dos DJs do evento.", portaria: false },
  { href: "/administradores/mc", titulo: "MC", descricao: "Área dos MCs do evento.", portaria: false },
  { href: "/administradores/jack-and-jill", titulo: "Jack and Jill", descricao: "Competição Jack and Jill.", portaria: false },
].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR", { sensitivity: "base" }));

async function dadosOrganizador() {
  const [totais, profissionais, professoresLivres] = await Promise.all([
    db.select({ papel: usuarios.papel, total: count() }).from(usuarios).groupBy(usuarios.papel),
    db
      .select({
        id: usuarios.id,
        nome: usuarios.name,
        email: usuarios.email,
        perfil: professores.nome,
        senhaDefinida: contas.id,
      })
      .from(usuarios)
      .leftJoin(professores, eq(professores.id, usuarios.professorId))
      .leftJoin(contas, and(eq(contas.userId, usuarios.id), eq(contas.providerId, "credential")))
      .where(eq(usuarios.papel, "profissional"))
      .orderBy(asc(usuarios.name)),
    // Professores do site ainda sem conta ligada — opções do convite.
    db
      .select({ id: professores.id, nome: professores.nome })
      .from(professores)
      .leftJoin(usuarios, eq(usuarios.professorId, professores.id))
      .where(isNull(usuarios.id))
      .orderBy(asc(professores.nome)),
  ]);

  const total = (papel: string) => totais.find((t) => t.papel === papel)?.total ?? 0;
  return {
    congressistas: total("congressista"),
    profissionais,
    professoresLivres,
  };
}

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function Page(props: PageProps<"/administradores/painel">) {
  const { user } = await exigirAdmin();
  const { erro } = await props.searchParams;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">Painel</h1>
            <p className="mt-3 text-mist/90">
              Olá, {comoChamar(user)}! · <span className="text-teal-300">{ROTULO_PAPEL[user.papel]}</span>
            </p>
          </div>

          {erro === "sem-permissao" && (
            <p role="alert" className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm">
              Seu perfil não tem permissão para aquela área.
            </p>
          )}

          <nav aria-label="Áreas do painel" className="grid gap-3 sm:grid-cols-2">
            {ATALHOS.filter(
              (a) =>
                ehGestor(user.papel) ||
                (a.portaria && user.perfis.includes("portaria")) ||
                ("midias" in a && a.midias && user.perfis.includes("midias")),
            ).map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-2xl border border-gold-500/40 bg-petrol-900/80 p-5 hover:border-gold-400 hover:bg-petrol-800/80"
              >
                <p className="font-semibold text-gold-300">{a.titulo}</p>
                <p className="mt-1 text-sm text-mist/70">{a.descricao}</p>
              </Link>
            ))}
          </nav>

          <CampoApelido apelido={user.apelido ?? null} primeiroNome={user.name.split(" ")[0]} />
          <CampoNascimento dataNascimento={user.dataNascimento ?? null} />

          {ehGestor(user.papel) && <PainelOrganizador />}

          <BotaoSair destino="/administradores" />
        </div>
      </main>
    </>
  );
}

async function PainelOrganizador() {
  const { congressistas, profissionais, professoresLivres } = await dadosOrganizador();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { rotulo: "Congressistas cadastrados", valor: congressistas },
          { rotulo: "Profissionais", valor: profissionais.length },
        ].map((n) => (
          <div key={n.rotulo} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
            <p className="text-sm text-mist/70">{n.rotulo}</p>
            <p className="text-gold-metal mt-1 text-4xl font-extrabold">{n.valor}</p>
          </div>
        ))}
      </div>

      <Cartao titulo="Profissionais">
        {profissionais.length === 0 ? (
          <p className="text-sm text-mist/70">Nenhum profissional convidado ainda.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {profissionais.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{p.nome}</p>
                  <p className="text-mist/60">{p.email}{p.perfil ? ` · perfil: ${p.perfil}` : ""}</p>
                </div>
                <span
                  className={
                    p.senhaDefinida
                      ? "rounded-full bg-teal-400/15 px-3 py-1 text-xs text-teal-300"
                      : "rounded-full bg-ember-500/15 px-3 py-1 text-xs text-ember-400"
                  }
                >
                  {p.senhaDefinida ? "Ativo" : "Convite pendente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <Cartao titulo="Convidar profissional">
        <FormConvidarProfissional professoresDisponiveis={professoresLivres} />
      </Cartao>
    </>
  );
}
