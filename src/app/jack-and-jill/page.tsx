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
  return { title: tx(await obterIdioma(), "Jack and Jill — LPZ Training", "Jack and Jill — LPZ Training", "Jack and Jill — LPZ Training") };
}

export const dynamic = "force-dynamic";

// Página pública do Jack and Jill: caixas de texto que a organização edita
// na própria página (regras, inscrição, premiação...).
const TEXTOS = traducoes(
  {
    titulo: "Jack and Jill",
    subtitulo: "A competição de zouk do LPZ Training.",
    vazio: "Informações em breve.",
    editar: "Editar Jack and Jill",
    adicionar: "+ Adicionar caixa",
    inscricao: "Quer participar?",
    loja: "Inscreva-se na Loja",
  },
  {
    titulo: "Jack and Jill",
    subtitulo: "The LPZ Training zouk competition.",
    vazio: "Information coming soon.",
    editar: "Edit Jack and Jill",
    adicionar: "+ Add box",
    inscricao: "Want to take part?",
    loja: "Sign up in the Shop",
  },
  {
    titulo: "Jack and Jill",
    subtitulo: "La competencia de zouk de LPZ Training.",
    vazio: "Información próximamente.",
    editar: "Editar Jack and Jill",
    adicionar: "+ Añadir caja",
    inscricao: "¿Quieres participar?",
    loja: "Inscríbete en la Tienda",
  },
);

export default async function Page(props: PageProps<"/jack-and-jill">) {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const [busca, caixas, sessao] = await Promise.all([
    props.searchParams,
    caixasDaPagina("jack_and_jill"),
    obterSessao().catch(() => null),
  ]);
  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} subtitulo={t.subtitulo} largura="max-w-3xl">
        <CaixasEditaveis
          pagina="jack_and_jill"
          caixas={caixas}
          idioma={idioma}
          editavel={!!sessao && ehGestor(sessao.user.papel)}
          busca={busca}
          rotuloEditar={t.editar}
          rotuloAdicionar={t.adicionar}
          vazio={t.vazio}
          layout="lista"
        />
        <p className="text-center text-sm text-mist/80">
          {t.inscricao}{" "}
          <Link href="/ingressos#produto-jack_and_jill" className="font-semibold text-teal-300 hover:underline">
            {t.loja}
          </Link>
        </p>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
