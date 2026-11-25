import { comoChamar } from "@/modules/perfil/apelido";
import { temPerfil } from "@/modules/auth/papeis";
import { CampoApelido } from "@/app/_components/campo-apelido";
import { tx } from "@/i18n";
import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { auth } from "@/modules/auth/auth";
import { obterIdioma } from "@/i18n/servidor";
import { formatarDiaCronograma } from "@/lib/formatar";
import { BotaoSair } from "../../_components/botao-sair";
import { SiteHeader } from "../../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Área do profissional — LPZ Training", "Professional area — LPZ Training", "Área del profesional — LPZ Training") };
}

export default async function Page() {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (!sessao) redirect("/profissionais");
  // Checagem de papel no servidor — é ela que protege a área.
  if (!temPerfil(sessao.user, "profissional")) redirect("/profissionais?erro=restrito");

  const { user } = sessao;
  const idioma = await obterIdioma();
  const professorId = user.professorId;

  const [perfil, aulas] = professorId
    ? await Promise.all([
        db.query.professores.findFirst({ where: eq(professores.id, professorId) }),
        db
          .select()
          .from(cronogramaItens)
          .where(eq(cronogramaItens.professorId, professorId))
          .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.ordem)),
      ])
    : [undefined, []];

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">{tx(idioma, "Área do profissional", "Professional area", "Área del profesional")}</h1>
          <p className="mt-4 text-mist/90">{tx(idioma, "Olá", "Hi", "Hola")}, {comoChamar(user)}!</p>

          <section className="mt-8 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{tx(idioma, "Meus dados", "My details", "Mis datos")}</h2>
            <dl className="mt-4 space-y-3">
              {[
                { rotulo: tx(idioma, "Nome", "Name", "Nombre"), valor: user.name },
                { rotulo: tx(idioma, "E-mail", "Email", "Correo"), valor: user.email },
                {
                  rotulo: tx(idioma, "Perfil no site", "Site profile", "Perfil en el sitio"),
                  valor: perfil?.nome ?? tx(idioma, "Ainda não vinculado", "Not linked yet", "Aún no vinculado"),
                },
                ...(perfil?.instagram ? [{ rotulo: "Instagram", valor: perfil.instagram }] : []),
              ].map((d) => (
                <div key={d.rotulo} className="flex justify-between gap-4 border-b border-white/5 pb-2 text-sm">
                  <dt className="text-mist/60">{d.rotulo}</dt>
                  <dd className="text-right text-white">{d.valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <CampoApelido apelido={user.apelido ?? null} primeiroNome={user.name.split(" ")[0]} />

          <section className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{tx(idioma, "Minhas aulas", "My classes", "Mis clases")}</h2>
            {!professorId ? (
              <p className="mt-3 text-sm text-mist/70">
                {tx(
                  idioma,
                  "Sua conta ainda não está ligada a um perfil de professor. Fale com a organização.",
                  "Your account is not linked to a teacher profile yet. Please contact the organizers.",
                  "Tu cuenta aún no está vinculada a un perfil de profesor. Contacta a la organización.",
                )}
              </p>
            ) : aulas.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">{tx(idioma, "Nenhuma aula sua no cronograma por enquanto.", "No classes of yours in the schedule yet.", "Aún no tienes clases en el cronograma.")}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {aulas.map((aula) => (
                  <li key={aula.id} className="rounded-lg border border-white/10 border-l-2 border-l-gold-400 bg-petrol-950/60 p-3">
                    <p className="text-sm font-medium text-teal-300">
                      {formatarDiaCronograma(aula.dia, idioma)} · {aula.horarioInicio}
                      {aula.horarioFim ? ` – ${aula.horarioFim}` : ""}
                    </p>
                    <p className="mt-1 font-semibold text-white">{aula.titulo}</p>
                    {aula.local && <p className="text-sm text-mist/70">{aula.local}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="mt-8">
            <BotaoSair destino="/profissionais" />
          </div>
        </div>
      </main>
    </>
  );
}
