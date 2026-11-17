import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { urlCompra } from "@/modules/auth/proximo";
import { ehSpotify } from "@/modules/midia/audio";
import { itensDaGaleria } from "@/modules/midia/galeria";
import { classeBotao } from "../../_components/form-ui";
import { RodapeSite } from "../../_components/rodape-site";
import { SiteHeader } from "../../_components/site-header";

const SECOES = ["videos", "fotos", "paparazzi"] as const;
type Secao = (typeof SECOES)[number];

const TEXTOS = traducoes(
  {
    titulo: { videos: "Vídeos", fotos: "Fotos", paparazzi: "Paparazzi" } as Record<Secao, string>,
    vazio: { videos: "Vídeos em breve.", fotos: "Fotos em breve.", paparazzi: "" } as Record<Secao, string>,
    voltar: "Voltar para a galeria",
    paparazzi:
      "O Paparazzi do LPZ registra você dançando durante o evento, em vídeo ou em fotos profissionais. O material de cada pessoa é entregue depois do congresso para quem contratou.",
    comprarVideo: "Contratar Paparazzi — vídeo",
    comprarFoto: "Contratar Paparazzi — fotos",
    videosTitulo: "Vídeos",
    audiosTitulo: "Áudios",
  },
  {
    titulo: { videos: "Videos", fotos: "Photos", paparazzi: "Paparazzi" } as Record<Secao, string>,
    vazio: { videos: "Videos coming soon.", fotos: "Photos coming soon.", paparazzi: "" } as Record<Secao, string>,
    voltar: "Back to the gallery",
    paparazzi:
      "The LPZ Paparazzi captures you dancing during the event, on video or in professional photos. Each person's material is delivered after the congress to those who booked it.",
    comprarVideo: "Book Paparazzi — video",
    comprarFoto: "Book Paparazzi — photos",
    videosTitulo: "Videos",
    audiosTitulo: "Audio",
  },
);

function secaoValida(valor: string): Secao | null {
  return (SECOES as readonly string[]).includes(valor) ? (valor as Secao) : null;
}

export async function generateMetadata(props: PageProps<"/galeria/[secao]">): Promise<Metadata> {
  const secao = secaoValida((await props.params).secao);
  const t = TEXTOS[await obterIdioma()];
  return { title: secao ? `${t.titulo[secao]} — LPZ Training` : "LPZ Training" };
}

export const dynamic = "force-dynamic";

export default async function Page(props: PageProps<"/galeria/[secao]">) {
  const secao = secaoValida((await props.params).secao);
  if (!secao) notFound();
  const idioma = await obterIdioma();
  const en = idioma === "en";
  const t = TEXTOS[idioma];

  const itens = secao === "paparazzi" ? [] : await itensDaGaleria();
  const fotos = secao === "fotos" ? itens.filter((i) => i.tipo === "foto") : [];
  const videos = secao === "videos" ? itens.filter((i) => i.tipo === "video") : [];
  const audios = secao === "videos" ? itens.filter((i) => i.tipo === "audio") : [];
  const vazio = secao !== "paparazzi" && fotos.length + videos.length + audios.length === 0;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-12">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">{t.titulo[secao]}</h1>

          {vazio && <p className="text-center text-mist/70">{t.vazio[secao]}</p>}

          {secao === "paparazzi" && (
            <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-8 text-center">
              <p className="text-mist/90">{t.paparazzi}</p>
              <div className="space-y-3">
                <Link href={urlCompra("paparazzi_video")} className={`${classeBotao} inline-block`}>{t.comprarVideo}</Link>
                <Link href={urlCompra("paparazzi_foto")} className={`${classeBotao} inline-block`}>{t.comprarFoto}</Link>
              </div>
            </div>
          )}

          {videos.length > 0 && (
            <section aria-labelledby="titulo-videos">
              <h2 id="titulo-videos" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">{t.videosTitulo}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {videos.map((v) => (
                  <li key={v.id}>
                    <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
                      <iframe
                        src={v.url}
                        title={v.titulo ?? (en ? "LPZ video" : "Vídeo do LPZ")}
                        loading="lazy"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                    {v.titulo && <p className="mt-2 text-sm text-mist/80">{v.titulo}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {audios.length > 0 && (
            <section aria-labelledby="titulo-audios">
              <h2 id="titulo-audios" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">{t.audiosTitulo}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {audios.map((a) => (
                  <li key={a.id}>
                    <iframe
                      src={a.url}
                      title={a.titulo ?? (en ? "LPZ audio" : "Áudio do LPZ")}
                      loading="lazy"
                      allow="encrypted-media"
                      className={`w-full rounded-xl ${ehSpotify(a.url) ? "h-[152px]" : "h-[166px]"}`}
                    />
                    {a.titulo && <p className="mt-2 text-sm text-mist/80">{a.titulo}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {fotos.length > 0 && (
            <section aria-labelledby="titulo-fotos">
              <h2 id="titulo-fotos" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">{t.titulo.fotos}</h2>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {fotos.map((f) => (
                  <li key={f.id}>
                    <a href={f.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt={f.titulo ?? (en ? "LPZ event photo" : "Foto do evento LPZ")}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition hover:scale-105"
                      />
                    </a>
                    {f.titulo && <p className="mt-1 truncate text-xs text-mist/70">{f.titulo}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-center">
            <Link href="/galeria" className="text-sm text-teal-300 hover:underline">← {t.voltar}</Link>
          </p>
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
