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
    title: "DJs — LPZ Training",
    description: tx(idioma, "Conheça os DJs do LPZ Training.", "Meet the LPZ Training DJs.", "Conoce a los DJs de LPZ Training."),
  };
}

export const dynamic = "force-dynamic";

export default async function Page() {
  const idioma = await obterIdioma();
  const [lista, editavel] = await Promise.all([listarPerfis("dj"), podeEditar()]);

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={"DJs"} subtitulo={tx(idioma, "Os DJs do congresso. Clique na caixinha para ver a bio.", "The DJs of the congress. Click a card to read their bio.", "Los DJs del congreso. Haz clic en la tarjeta para ver la bio.")} largura="max-w-5xl">
        {lista.length === 0 ? (
          <p className="text-center text-mist/70">{tx(idioma, "DJs em breve.", "DJs coming soon.", "DJs próximamente.")}</p>
        ) : (
          <GradePerfis perfis={lista} categoria="dj" idioma={idioma} editavel={editavel} />
        )}
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
