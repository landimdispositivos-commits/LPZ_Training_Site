import type { Metadata } from "next";
import { obterIdioma } from "@/i18n/servidor";
import { listarPerfis } from "@/modules/perfis";
import { PaginaPublica } from "../_components/pagina-publica";
import { GradePerfis, podeEditar } from "../_components/perfis";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await obterIdioma()) === "en";
  return {
    title: en ? "DJs — LPZ Training" : "DJs — LPZ Training",
    description: en ? "Meet the LPZ Training DJs." : "Conheça os DJs do LPZ Training.",
  };
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const idioma = await obterIdioma();
  const en = idioma === "en";
  const [lista, editavel] = await Promise.all([listarPerfis("dj"), podeEditar()]);

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={"DJs"} subtitulo={en ? "The DJs of the congress. Click a card to read their bio." : "Os DJs do congresso. Clique na caixinha para ver a bio."} largura="max-w-5xl">
        {lista.length === 0 ? (
          <p className="text-center text-mist/70">{en ? "DJs coming soon." : "DJs em breve."}</p>
        ) : (
          <GradePerfis perfis={lista} categoria="dj" idioma={idioma} editavel={editavel} />
        )}
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
