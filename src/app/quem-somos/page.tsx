import type { Metadata } from "next";
import Link from "next/link";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await obterIdioma()) === "en";
  return en
    ? {
        title: "About us — LPZ Training",
        description: "Meet the team behind LPZ Training, a zouk congress focused on training and continuous practice.",
      }
    : {
        title: "Quem somos — LPZ Training",
        description: "Conheça a organização do LPZ Training, congresso de zouk focado em treinamento e prática continuada.",
      };
}

// Estrutura pronta para os dados da organização. Trechos entre [colchetes]
// são conteúdo a preencher (nos dois idiomas).
const TEXTOS = traducoes(
  {
    titulo: "Quem somos",
    subtitulo: "Conheça quem faz o LPZ Training acontecer.",
    voltar: "Voltar para o início",
    secoes: [
      { titulo: "Nossa história", texto: "[Como e quando o LPZ começou, quem idealizou e o que motivou a criação do evento.]" },
      {
        titulo: "Nossa proposta",
        texto:
          "O LPZ Training é um congresso de zouk que tem como foco uma linha de treinamento e prática continuada. [Detalhar a metodologia, o público e o que diferencia o evento.]",
      },
      { titulo: "Organização", texto: "[Nomes e papéis das pessoas da organização. Fotos só com autorização de cada pessoa.]" },
      { titulo: "Contato", texto: "[E-mail, Instagram e WhatsApp oficiais do evento.]" },
    ],
  },
  {
    titulo: "About us",
    subtitulo: "Meet the people who make LPZ Training happen.",
    voltar: "Back to home",
    secoes: [
      { titulo: "Our story", texto: "[How and when LPZ started, who created it and what motivated the event.]" },
      {
        titulo: "Our approach",
        texto:
          "LPZ Training is a zouk congress focused on training and continuous practice. [Describe the method, the audience and what makes the event different.]",
      },
      { titulo: "Team", texto: "[Names and roles of the organizers. Photos only with each person's permission.]" },
      { titulo: "Contact", texto: "[Official email, Instagram and WhatsApp of the event.]" },
    ],
  },
);

export default async function Page() {
  const t = TEXTOS[await obterIdioma()];
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
          {t.secoes.map((secao) => (
            <section key={secao.titulo} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{secao.titulo}</h2>
              <p className="mt-3 text-mist/90">{secao.texto}</p>
            </section>
          ))}

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
