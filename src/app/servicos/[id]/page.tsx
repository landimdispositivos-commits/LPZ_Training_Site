import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { obterSessao } from "@/modules/auth/sessao";
import { ehGestor } from "@/modules/auth/papeis";
import { caixaNoIdioma, caixaPorId, detalheNoIdioma } from "@/modules/caixas";
import { SiteHeader } from "../../_components/site-header";
import { RodapeSite } from "../../_components/rodape-site";
import { PaginaPublica } from "../../_components/pagina-publica";

export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    voltar: "Voltar para Serviços",
    contato: "Quer contratar ou saber mais?",
    faleConosco: "Fale conosco",
    oculta: "Página oculta: só a organização está vendo. Para publicar, desmarque “Oculta” em Serviços → Editar.",
    editar: "Editar em Serviços",
  },
  {
    voltar: "Back to Services",
    contato: "Want to book or learn more?",
    faleConosco: "Contact us",
    oculta: "Hidden page: only the organizers can see it. To publish it, untick “Hidden” in Services → Edit.",
    editar: "Edit in Services",
  },
  {
    voltar: "Volver a Servicios",
    contato: "¿Quieres contratar o saber más?",
    faleConosco: "Contáctanos",
    oculta: "Página oculta: solo la organización la está viendo. Para publicarla, desmarca “Oculta” en Servicios → Editar.",
    editar: "Editar en Servicios",
  },
);

// Página própria de uma caixa de Serviços. Se a caixa estiver oculta (ou não
// tiver página), para o público ela simplesmente não existe (404).
async function carregar(idBruto: string) {
  const id = z.uuid().safeParse(idBruto);
  if (!id.success) return null;
  const [caixa, sessao] = await Promise.all([caixaPorId("servicos", id.data), obterSessao().catch(() => null)]);
  const gestor = !!sessao && ehGestor(sessao.user.papel);
  if (!caixa || !caixa.temPagina || (caixa.oculta && !gestor)) return null;
  return { caixa, gestor };
}

export async function generateMetadata(props: PageProps<"/servicos/[id]">): Promise<Metadata> {
  const dados = await carregar((await props.params).id);
  if (!dados) return { title: "LPZ Training" };
  const { titulo } = caixaNoIdioma(dados.caixa, await obterIdioma());
  return { title: `${titulo} — LPZ Training`, robots: dados.caixa.oculta ? { index: false } : undefined };
}

export default async function Page(props: PageProps<"/servicos/[id]">) {
  const dados = await carregar((await props.params).id);
  if (!dados) return notFound();
  const { caixa, gestor } = dados;
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const { titulo } = caixaNoIdioma(caixa, idioma);
  const conteudo = detalheNoIdioma(caixa, idioma);

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={titulo}>
        {caixa.oculta && (
          <p role="status" className="rounded-xl border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm text-ember-400">
            {t.oculta}
          </p>
        )}
        <article className="rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 sm:p-8">
          <p className="whitespace-pre-line leading-relaxed text-mist/90">{conteudo}</p>
        </article>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link href="/servicos" className="text-teal-300 hover:underline">← {t.voltar}</Link>
          {gestor && (
            <Link href={`/servicos?editar=1#caixa-${caixa.id}`} className="font-semibold text-gold-300 hover:underline">
              ✎ {t.editar}
            </Link>
          )}
        </div>
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
