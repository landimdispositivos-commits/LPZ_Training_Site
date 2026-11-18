import { tx } from "@/i18n";
import type { Metadata } from "next";
import { obterIdioma } from "@/i18n/servidor";
import { listarPerfis } from "@/modules/perfis";
import { PaginaPublica } from "../_components/pagina-publica";
import { GradePerfis, podeEditar } from "../_components/perfis";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await obterIdioma();
  return {
    title: tx(idioma, "Professores — LPZ Training", "Teachers — LPZ Training", "Profesores — LPZ Training"),
    description: tx(idioma, "Conheça os casais de professores do LPZ Training.", "Meet the LPZ Training teaching couples.", "Conoce las parejas de profesores de LPZ Training."),
  };
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const idioma = await obterIdioma();
  const [lista, editavel] = await Promise.all([listarPerfis("professor"), podeEditar()]);

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={tx(idioma, "Professores", "Teachers", "Profesores")} subtitulo={tx(idioma, "Os casais de professores do congresso. Clique na caixinha para ver a bio.", "The teaching couples of the congress. Click a card to read their bio.", "Las parejas de profesores del congreso. Haz clic en la tarjeta para ver la bio.")} largura="max-w-5xl">
        {lista.length === 0 ? (
          <p className="text-center text-mist/70">{tx(idioma, "Professores em breve.", "Teachers coming soon.", "Profesores próximamente.")}</p>
        ) : (
          <GradePerfis perfis={lista} categoria="professor" idioma={idioma} editavel={editavel} />
        )}
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
