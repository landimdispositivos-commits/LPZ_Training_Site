import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { RodapeSite } from "../_components/rodape-site";
import { dataCurta, DIAS_EVENTO, diaDaSemana } from "@/lib/dias-evento";
import { PaginaPublica } from "../_components/pagina-publica";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await obterIdioma()) === "en";
  return {
    title: en ? "Schedule — LPZ Training" : "Cronograma — LPZ Training",
    description: en ? "LPZ Training classes and activities, day by day." : "Aulas e atividades do LPZ Training, dia a dia.",
  };
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const idioma = await obterIdioma();
  const en = idioma === "en";
  const cronograma = await db
    .select({
      id: cronogramaItens.id,
      dia: cronogramaItens.dia,
      horarioInicio: cronogramaItens.horarioInicio,
      horarioFim: cronogramaItens.horarioFim,
      titulo: cronogramaItens.titulo,
      local: cronogramaItens.local,
      professorNome: professores.nome,
    })
    .from(cronogramaItens)
    .leftJoin(professores, eq(cronogramaItens.professorId, professores.id))
    .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio), asc(cronogramaItens.ordem));

  return (
    <>
      <SiteHeader />
      <PaginaPublica
        titulo={en ? "Schedule" : "Cronograma"}
        subtitulo={en ? "Congress classes and activities, day by day." : "Aulas e atividades do congresso, dia a dia."}
        largura="max-w-3xl"
      >
        <div className="space-y-6">
          {DIAS_EVENTO.map((d) => {
            const itens = cronograma.filter((i) => diaDaSemana(i.dia) === d.semana);
            const datas = [...new Set(itens.map((i) => dataCurta(i.dia, en)))];
            return (
              <section key={d.semana} className="rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6">
                <h2 className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">
                  {en ? d.en : d.pt}
                  {datas.length > 0 && <span className="ml-2 text-teal-300">{datas.join(" · ")}</span>}
                </h2>
                {itens.length === 0 ? (
                  <p className="mt-3 text-sm text-mist/70">{en ? "Times coming soon." : "Horários em breve."}</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {itens.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-white/10 border-l-2 border-l-gold-400 bg-petrol-900/60 p-4"
                      >
                        <p className="text-sm font-medium text-teal-300">
                          {item.horarioInicio}
                          {item.horarioFim ? ` – ${item.horarioFim}` : ""}
                        </p>
                        <p className="mt-1 font-semibold text-white">{item.titulo}</p>
                        <p className="text-sm text-mist/70">
                          {[item.professorNome, item.local].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
