import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { formatarDiaCronograma } from "@/lib/formatar";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { RodapeSite } from "../_components/rodape-site";
import { CabecalhoPagina } from "../_components/cabecalho-pagina";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await obterIdioma()) === "en";
  return {
    title: en ? "Schedule — LPZ Training" : "Cronograma — LPZ Training",
    description: en ? "LPZ Training classes and activities, day by day." : "Aulas e atividades do LPZ Training, dia a dia.",
  };
}

export const dynamic = "force-dynamic";

function agruparPorDia<T extends { dia: string }>(itens: T[]) {
  const dias = new Map<string, T[]>();
  for (const item of itens) dias.set(item.dia, [...(dias.get(item.dia) ?? []), item]);
  return [...dias.entries()];
}

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
      <main>
        <CabecalhoPagina
          titulo={en ? "Schedule" : "Cronograma"}
          subtitulo={en ? "Congress classes and activities, day by day." : "Aulas e atividades do congresso, dia a dia."}
        />
        <div className="mx-auto max-w-3xl px-4 py-16">
          {cronograma.length === 0 ? (
            <p className="text-center text-mist/70">{en ? "Schedule coming soon." : "Cronograma em breve."}</p>
          ) : (
            <div className="space-y-8">
              {agruparPorDia(cronograma).map(([dia, itens]) => (
                <div key={dia}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-300 first-letter:uppercase">
                    {formatarDiaCronograma(dia, idioma)}
                  </h2>
                  <ol className="mt-3 space-y-3">
                    {itens.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-white/10 border-l-gold-400 border-l-2 bg-petrol-950/60 p-4"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
