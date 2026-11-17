import type { Metadata } from "next";
import { ehSpotify } from "@/modules/midia/audio";
import { itensDaGaleria } from "@/modules/midia/galeria";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obterIdioma()) === "en" ? "Gallery — LPZ Training" : "Galeria — LPZ Training" };
}
export const dynamic = "force-dynamic";

export default async function Page() {
  const itens = await itensDaGaleria();
  const en = (await obterIdioma()) === "en";
  const fotos = itens.filter((i) => i.tipo === "foto");
  const videos = itens.filter((i) => i.tipo === "video");
  const audios = itens.filter((i) => i.tipo === "audio");

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-12">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">{en ? "Gallery" : "Galeria"}</h1>

          {itens.length === 0 && <p className="text-center text-mist/70">{en ? "Photos and videos coming soon." : "Fotos e vídeos em breve."}</p>}

          {videos.length > 0 && (
            <section aria-labelledby="titulo-videos">
              <h2 id="titulo-videos" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">{en ? "Videos" : "Vídeos"}</h2>
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
              <h2 id="titulo-audios" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">{en ? "Audio" : "Áudios"}</h2>
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
              <h2 id="titulo-fotos" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">{en ? "Photos" : "Fotos"}</h2>
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
        </div>
      </main>
    </>
  );
}
