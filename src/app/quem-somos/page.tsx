import type { Metadata } from "next";
import Link from "next/link";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { CaixasEditaveis } from "../_components/caixas/caixas-editaveis";
import { obterSessao } from "@/modules/auth/sessao";
import { ehGestor } from "@/modules/auth/papeis";
import { caixasDaPagina } from "@/modules/caixas";

export async function generateMetadata(): Promise<Metadata> {
  return tx(
    await obterIdioma(),
    {
      title: "Quem somos — LPZ Training",
      description: "Conheça a organização do LPZ Training, congresso de zouk focado em treinamento e prática continuada.",
    },
    {
      title: "About us — LPZ Training",
      description: "Meet the team behind LPZ Training, a zouk congress focused on training and continuous practice.",
    },
    {
      title: "Quiénes somos — LPZ Training",
      description: "Conoce a la organización de LPZ Training, congreso de zouk enfocado en el entrenamiento y la práctica continua.",
    },
  );
}

export const dynamic = "force-dynamic";

// O conteúdo das caixas (Nossa história, Nossa proposta, Organização, Contato…)
// fica no banco e a organização edita na própria página (botão Editar).
const TEXTOS = traducoes(
  {
    titulo: "Quem somos",
    subtitulo: "Conheça quem faz o LPZ Training acontecer.",
    voltar: "Voltar para o início",
    vazio: "Em breve.",
    editar: "Editar Quem somos",
    adicionar: "+ Adicionar caixa",
  },
  {
    titulo: "About us",
    subtitulo: "Meet the people who make LPZ Training happen.",
    voltar: "Back to home",
    vazio: "Coming soon.",
    editar: "Edit About us",
    adicionar: "+ Add box",
  },
  {
    titulo: "Quiénes somos",
    subtitulo: "Conoce a quienes hacen posible LPZ Training.",
    voltar: "Volver al inicio",
    vazio: "Próximamente.",
    editar: "Editar Quiénes somos",
    adicionar: "+ Añadir caja",
  },
);

export default async function Page(props: PageProps<"/quem-somos">) {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const [busca, caixas, sessao] = await Promise.all([
    props.searchParams,
    caixasDaPagina("quem_somos"),
    obterSessao().catch(() => null),
  ]);
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-city-glow px-4 py-20 text-center">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            {t.titulo}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-mist/90">
            {t.subtitulo}
          </p>
        </section>

        <div className="mx-auto max-w-3xl space-y-6 px-4 py-16">
          <CaixasEditaveis
            pagina="quem_somos"
            caixas={caixas}
            idioma={idioma}
            editavel={!!sessao && ehGestor(sessao.user.papel)}
            busca={busca}
            rotuloEditar={t.editar}
            rotuloAdicionar={t.adicionar}
            vazio={t.vazio}
            layout="lista"
          />

          <div className="pt-4 text-center">
            <Link
              href="/"
              className="inline-block rounded-full border border-gold-500/60 px-6 py-2.5 text-sm font-semibold text-gold-300 hover:bg-gold-500/10"
            >
              {t.voltar}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
