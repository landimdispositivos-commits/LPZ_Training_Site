import type { Metadata } from "next";
import { itensDaGaleria } from "@/modules/midia/galeria";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = { title: "Galeria — LPZ Training" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const itens = await itensDaGaleria();
  const fotos = itens.filter((i) => i.tipo === "foto");
  const videos = itens.filter((i) => i.tipo === "video");

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-12">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">Galeria</h1>

          {itens.length === 0 && <p className="text-center text-mist/70">Fotos e vídeos em breve.</p>}

          {videos.length > 0 && (
            <section aria-labelledby="titulo-videos">
              <h2 id="titulo-videos" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">Vídeos</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {videos.map((v) => (
                  <li key={v.id}>
                    <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
                      <iframe
                        src={v.url}
                        title={v.titulo ?? "Vídeo do LPZ"}
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

          {fotos.length > 0 && (
            <section aria-labelledby="titulo-fotos">
              <h2 id="titulo-fotos" className="font-display text-lg uppercase tracking-[0.2em] text-gold-metal">Fotos</h2>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {fotos.map((f) => (
                  <li key={f.id}>
                    <a href={f.url} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt={f.titulo ?? "Foto do evento LPZ"}
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
