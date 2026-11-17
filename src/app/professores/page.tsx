import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { professores } from "@/db/schema";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { RodapeSite } from "../_components/rodape-site";
import { CabecalhoPagina } from "../_components/cabecalho-pagina";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await obterIdioma()) === "en";
  return {
    title: en ? "Teachers — LPZ Training" : "Professores — LPZ Training",
    description: en ? "Meet the LPZ Training teachers." : "Conheça os professores do LPZ Training.",
  };
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const en = (await obterIdioma()) === "en";
  const lista = await db.select().from(professores).orderBy(asc(professores.ordem), asc(professores.nome));

  return (
    <>
      <SiteHeader />
      <main>
        <CabecalhoPagina
          titulo={en ? "Teachers" : "Professores"}
          subtitulo={en ? "Who is teaching at the congress." : "Quem vai dar aula no congresso."}
        />
        <div className="mx-auto max-w-3xl px-4 py-16">
          {lista.length === 0 ? (
            <p className="text-center text-mist/70">{en ? "Teachers coming soon." : "Professores em breve."}</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {lista.map((professor) => (
                <li key={professor.id} className="flex gap-4 rounded-lg border border-white/10 bg-petrol-900 p-4">
                  {professor.fotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={professor.fotoUrl}
                      alt={en ? `Photo of ${professor.nome}` : `Foto de ${professor.nome}`}
                      loading="lazy"
                      className="h-20 w-20 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h2 className="font-semibold text-white">{professor.nome}</h2>
                    {professor.bio && <p className="mt-1 text-sm text-mist/70">{professor.bio}</p>}
                    {professor.instagram && <p className="mt-2 text-sm text-teal-300">{professor.instagram}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
