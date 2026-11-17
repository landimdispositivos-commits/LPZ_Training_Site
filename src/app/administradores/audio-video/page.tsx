import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ehSpotify } from "@/modules/midia/audio";
import { itensDaGaleria } from "@/modules/midia/galeria";
import { Aviso, Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { adicionarAudioAction, adicionarVideoAction, removerMidiaAction } from "../galeria/actions";

export const metadata: Metadata = { title: "Áudio e vídeo — LPZ Training" };

const OK: Record<string, string> = { video: "Vídeo adicionado.", audio: "Áudio adicionado.", removida: "Item removido." };
const ERROS: Record<string, string> = {
  video: "Link do YouTube inválido. Cole o endereço do vídeo (ex.: https://youtu.be/...).",
  audio: "Link de áudio inválido. Use um link do Spotify (música, álbum ou playlist) ou do SoundCloud.",
};

export default async function Page(props: PageProps<"/administradores/audio-video">) {
  await exigirAdmin(["organizador"]);
  const { ok, erro } = await props.searchParams;
  const itens = (await itensDaGaleria()).filter((i) => i.tipo !== "foto");
  const videos = itens.filter((i) => i.tipo === "video");
  const audios = itens.filter((i) => i.tipo === "audio");

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Áudio e vídeo</h1>
            <div className="flex gap-4 text-sm">
              <Link href="/galeria" className="text-teal-300 hover:underline">Ver galeria</Link>
              <Link href="/administradores/painel" className="text-teal-300 hover:underline">Painel</Link>
            </div>
          </div>

          {typeof ok === "string" && OK[ok] && <Aviso tipo="ok">{OK[ok]}</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Adicionar vídeo</h2>
              <form action={adicionarVideoAction} className="mt-4 space-y-4">
                <Campo id="video-url" label="Link do YouTube">
                  <input id="video-url" name="url" required placeholder="https://youtu.be/..." className={classeInput} />
                </Campo>
                <Campo id="video-titulo" label="Título (opcional)">
                  <input id="video-titulo" name="titulo" maxLength={120} className={classeInput} />
                </Campo>
                <button type="submit" className={classeBotao}>Adicionar vídeo</button>
              </form>
            </section>

            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Adicionar áudio</h2>
              <form action={adicionarAudioAction} className="mt-4 space-y-4">
                <Campo id="audio-url" label="Link do Spotify ou SoundCloud" dica="Música, álbum, playlist ou set de DJ.">
                  <input id="audio-url" name="url" required placeholder="https://open.spotify.com/playlist/..." className={classeInput} />
                </Campo>
                <Campo id="audio-titulo" label="Título (opcional)">
                  <input id="audio-titulo" name="titulo" maxLength={120} className={classeInput} />
                </Campo>
                <button type="submit" className={classeBotao}>Adicionar áudio</button>
              </form>
            </section>
          </div>

          <ListaMidia titulo={`Vídeos (${videos.length})`} itens={videos} />
          <ListaMidia titulo={`Áudios (${audios.length})`} itens={audios} />
        </div>
      </main>
    </>
  );
}

function ListaMidia({
  titulo,
  itens,
}: {
  titulo: string;
  itens: Awaited<ReturnType<typeof itensDaGaleria>>;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{titulo}</h2>
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-mist/70">Nada publicado ainda.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {itens.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-petrol-950/60">
              <iframe
                src={item.url}
                title={item.titulo ?? (item.tipo === "video" ? "Vídeo" : "Áudio")}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                className={item.tipo === "video" ? "aspect-video w-full" : ehSpotify(item.url) ? "h-[152px] w-full" : "h-[166px] w-full"}
              />
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs text-mist/80">{item.titulo ?? (item.tipo === "video" ? "Vídeo" : "Áudio")}</p>
                <form action={removerMidiaAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="voltar" value="/administradores/audio-video" />
                  <button type="submit" className="text-xs font-semibold text-ember-400 hover:underline">Remover</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
