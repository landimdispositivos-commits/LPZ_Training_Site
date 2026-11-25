import { tx } from "@/i18n";
import type { Metadata } from "next";
import { obterIdioma } from "@/i18n/servidor";
import { listarPerfis } from "@/modules/perfis";
import { PaginaPublica } from "../_components/pagina-publica";
import { ListaPerfis, podeEditar } from "../_components/perfis";
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

export default async function Page(props: PageProps<"/djs">) {
  const idioma = await obterIdioma();
  const busca = await props.searchParams;
  const [lista, editavel] = await Promise.all([listarPerfis("dj"), podeEditar()]);

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={"DJs"} subtitulo={tx(idioma, "Os DJs do congresso. Clique na caixinha para ver a bio.", "The DJs of the congress. Click a card to read their bio.", "Los DJs del congreso. Haz clic en la tarjeta para ver la bio.")} largura="max-w-5xl">
        <ListaPerfis
          perfis={lista}
          categoria="dj"
          idioma={idioma}
          editavel={editavel}
          editando={editavel && busca.editar === "1"}
          ok={typeof busca.ok === "string" ? busca.ok : undefined}
          erro={typeof busca.erro === "string" ? busca.erro : undefined}
        />
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
