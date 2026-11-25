import type { Metadata } from "next";
import Link from "next/link";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { PaginaPublica } from "../_components/pagina-publica";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Galeria — LPZ Training", "Gallery — LPZ Training", "Galería — LPZ Training") };
}

const TEXTOS = traducoes(
  {
    titulo: "Galeria",
    subtitulo: "Escolha o que você quer ver.",
    caixas: [
      { href: "/galeria/videos", titulo: "Vídeos", texto: "Vídeos e músicas do LPZ." },
      { href: "/galeria/fotos", titulo: "Fotos", texto: "Fotos dos eventos." },
      { href: "/galeria/paparazzi", titulo: "Paparazzi", texto: "Seus melhores momentos dançando, em vídeo e foto." },
    ],
    abrir: "Abrir",
  },
  {
    titulo: "Gallery",
    subtitulo: "Choose what you want to see.",
    caixas: [
      { href: "/galeria/videos", titulo: "Videos", texto: "LPZ videos and music." },
      { href: "/galeria/fotos", titulo: "Photos", texto: "Photos from the events." },
      { href: "/galeria/paparazzi", titulo: "Paparazzi", texto: "Your best dancing moments, on video and in photos." },
    ],
    abrir: "Open",
  },
  {
    titulo: "Galería",
    subtitulo: "Elige lo que quieres ver.",
    caixas: [
      { href: "/galeria/videos", titulo: "Videos", texto: "Videos y música de LPZ." },
      { href: "/galeria/fotos", titulo: "Fotos", texto: "Fotos de los eventos." },
      { href: "/galeria/paparazzi", titulo: "Paparazzi", texto: "Tus mejores momentos bailando, en video y en fotos." },
    ],
    abrir: "Abrir",
  },
);

// Três caixinhas no mesmo estilo das de Ingressos; cada uma abre sua seção.
export default async function Page() {
  const t = TEXTOS[await obterIdioma()];
  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} subtitulo={t.subtitulo}>
        <ul className="grid gap-4 pt-4 sm:grid-cols-3">
          {t.caixas.map((c) => (
            <li
              key={c.href}
              className="relative flex flex-col rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 text-center transition hover:border-gold-300 hover:shadow-[0_0_24px_rgb(230_181_74/0.25)]"
            >
              <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{c.titulo}</p>
              <p className="mt-3 text-sm text-mist/80">{c.texto}</p>
              <div className="mt-auto pt-5">
                <Link
                  href={c.href}
                  className="bg-gold-metal inline-block w-full rounded-full px-6 py-3 font-semibold text-gold-ink transition hover:brightness-110 after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                >
                  {t.abrir}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
