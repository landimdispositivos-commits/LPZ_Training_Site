import type { Metadata } from "next";
import Link from "next/link";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { obterSessao } from "@/modules/auth/sessao";
import { ehGestor } from "@/modules/auth/papeis";
import { caixasDaPagina } from "@/modules/caixas";
import { SiteHeader } from "../_components/site-header";
import { RodapeSite } from "../_components/rodape-site";
import { PaginaPublica } from "../_components/pagina-publica";
import { CaixasEditaveis } from "../_components/caixas/caixas-editaveis";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Serviços — LPZ Training", "Services — LPZ Training", "Servicios — LPZ Training") };
}

export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Serviços",
    subtitulo: "O que o LPZ Training oferece para marcas, escolas e parceiros durante o evento.",
    vazio: "Serviços em breve.",
    contato: "Quer contratar ou saber mais?",
    faleConosco: "Fale conosco",
    editar: "Editar serviços",
    adicionar: "+ Adicionar serviço",
  },
  {
    titulo: "Services",
    subtitulo: "What LPZ Training offers brands, schools and partners during the event.",
    vazio: "Services coming soon.",
    contato: "Want to book or learn more?",
    faleConosco: "Contact us",
    editar: "Edit services",
    adicionar: "+ Add service",
  },
  {
    titulo: "Servicios",
    subtitulo: "Lo que LPZ Training ofrece a marcas, escuelas y aliados durante el evento.",
    vazio: "Servicios próximamente.",
    contato: "¿Quieres contratar o saber más?",
    faleConosco: "Contáctanos",
    editar: "Editar servicios",
    adicionar: "+ Añadir servicio",
  },
);

export default async function Page(props: PageProps<"/servicos">) {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const [busca, caixas, sessao] = await Promise.all([
    props.searchParams,
    caixasDaPagina("servicos"),
    obterSessao().catch(() => null),
  ]);
  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} subtitulo={t.subtitulo} largura="max-w-5xl">
        <CaixasEditaveis
          pagina="servicos"
          caixas={caixas}
          idioma={idioma}
          editavel={!!sessao && ehGestor(sessao.user.papel)}
          busca={busca}
          rotuloEditar={t.editar}
          rotuloAdicionar={t.adicionar}
          vazio={t.vazio}
          comSubpagina
        />
        <p className="text-center text-sm text-mist/80">
          {t.contato}{" "}
          <Link href="/fale-conosco" className="font-semibold text-teal-300 hover:underline">
            {t.faleConosco}
          </Link>
        </p>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
