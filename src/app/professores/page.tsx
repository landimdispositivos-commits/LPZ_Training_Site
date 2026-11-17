import type { Metadata } from "next";
import { obterIdioma } from "@/i18n/servidor";
import { listarPerfis } from "@/modules/perfis";
import { CabecalhoPagina } from "../_components/cabecalho-pagina";
import { GradePerfis, podeEditar } from "../_components/perfis";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await obterIdioma()) === "en";
  return {
    title: en ? "Teachers — LPZ Training" : "Professores — LPZ Training",
    description: en ? "Meet the LPZ Training teaching couples." : "Conheça os casais de professores do LPZ Training.",
  };
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const idioma = await obterIdioma();
  const en = idioma === "en";
  const [lista, editavel] = await Promise.all([listarPerfis("professor"), podeEditar()]);

  return (
    <>
      <SiteHeader />
      <main>
        <CabecalhoPagina
          titulo={en ? "Teachers" : "Professores"}
          subtitulo={en ? "The teaching couples of the congress. Click a card to read their bio." : "Os casais de professores do congresso. Clique na caixinha para ver a bio."}
        />
        <div className="mx-auto max-w-5xl px-4 py-16">
          {lista.length === 0 ? (
            <p className="text-center text-mist/70">{en ? "Teachers coming soon." : "Professores em breve."}</p>
          ) : (
            <GradePerfis perfis={lista} categoria="professor" idioma={idioma} editavel={editavel} />
          )}
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
