import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { urlCompra } from "@/modules/auth/proximo";
import { ehSpotify } from "@/modules/midia/audio";
import { itensDaGaleria } from "@/modules/midia/galeria";
import { Aviso, Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { obterSessao } from "@/modules/auth/sessao";
import { perfisDo } from "@/modules/auth/papeis";
import { obterLinksDrive } from "@/modules/midia/links-drive";
import { salvarLinkDriveAction } from "./actions";
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
    drive: { videos: "Ver todos os vídeos no Google Drive", fotos: "Ver todas as fotos no Google Drive" } as Record<"videos" | "fotos", string>,
    editarDrive: "Editar link do Google Drive",
    linkDrive: "Link da pasta no Google Drive",
    dicaDrive: "Cole o link de compartilhamento da pasta (começa com https://). Deixe em branco para tirar o botão.",
    salvar: "Salvar link",
    salvo: "Link salvo.",
    erroLink: "Link inválido: use um endereço que comece com https://",
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
    drive: { videos: "See all videos on Google Drive", fotos: "See all photos on Google Drive" } as Record<"videos" | "fotos", string>,
    editarDrive: "Edit Google Drive link",
    linkDrive: "Google Drive folder link",
    dicaDrive: "Paste the folder sharing link (starting with https://). Leave blank to remove the button.",
    salvar: "Save link",
    salvo: "Link saved.",
    erroLink: "Invalid link: use an address starting with https://",
  },
  {
    titulo: { videos: "Videos", fotos: "Fotos", paparazzi: "Paparazzi" } as Record<Secao, string>,
    vazio: { videos: "Videos próximamente.", fotos: "Fotos próximamente.", paparazzi: "" } as Record<Secao, string>,
    voltar: "Volver a la galería",
    paparazzi:
      "El Paparazzi de LPZ te registra bailando durante el evento, en video o en fotos profesionales. El material de cada persona se entrega después del congreso a quien lo contrató.",
    comprarVideo: "Contratar Paparazzi — video",
    comprarFoto: "Contratar Paparazzi — fotos",
    videosTitulo: "Videos",
    audiosTitulo: "Audios",
    drive: { videos: "Ver todos los videos en Google Drive", fotos: "Ver todas las fotos en Google Drive" } as Record<"videos" | "fotos", string>,
    editarDrive: "Editar enlace de Google Drive",
    linkDrive: "Enlace de la carpeta en Google Drive",
    dicaDrive: "Pega el enlace para compartir la carpeta (empieza con https://). Déjalo en blanco para quitar el botón.",
    salvar: "Guardar enlace",
    salvo: "Enlace guardado.",
    erroLink: "Enlace inválido: usa una dirección que empiece con https://",
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
  const t = TEXTOS[idioma];
  const busca = await props.searchParams;
  const temDrive = secao === "videos" || secao === "fotos";
  const [links, sessao] = await Promise.all([obterLinksDrive(), obterSessao().catch(() => null)]);
  const linkDrive = temDrive ? links[secao] : null;
  // Organização e Mídias editam o link (conferido de novo no servidor ao salvar).
  const editavel =
    temDrive && !!sessao && perfisDo(sessao.user).some((p) => p === "organizador" || p === "acesso_total" || p === "midias");
  const editando = editavel && busca.editar === "1";

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

          {busca.salvo && editavel && <Aviso tipo="ok">{t.salvo}</Aviso>}
          {busca.erro && editavel && <Aviso tipo="erro">{t.erroLink}</Aviso>}

          {temDrive && (linkDrive || editavel) && (
            <div className="flex flex-col items-center gap-3">
              {linkDrive && (
                <a
                  href={linkDrive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gold-metal inline-flex items-center gap-3 rounded-full px-7 py-3 font-semibold text-gold-ink shadow-lg hover:brightness-110"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <path d="M8 3h8l6 10.5-4 7H6l-4-7Z" />
                    <path d="M8 3l6 10.5M16 3 10 13.5M2 13.5h20" />
                  </svg>
                  {t.drive[secao as "videos" | "fotos"]}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {editavel && !editando && (
                <Link
                  href={`/galeria/${secao}?editar=1#editar-drive`}
                  className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
                >
                  <span aria-hidden="true">✎</span> {t.editarDrive}
                </Link>
              )}
              {editando && (
                <form
                  id="editar-drive"
                  action={salvarLinkDriveAction}
                  className="w-full max-w-xl scroll-mt-24 space-y-3 rounded-2xl border border-white/10 bg-petrol-900/80 p-6"
                >
                  <input type="hidden" name="secao" value={secao} />
                  <Campo id="link-drive" label={t.linkDrive} dica={t.dicaDrive}>
                    <input
                      id="link-drive"
                      name="link"
                      type="url"
                      inputMode="url"
                      maxLength={500}
                      defaultValue={linkDrive ?? ""}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className={classeInput}
                    />
                  </Campo>
                  <button type="submit" className={classeBotao}>{t.salvar}</button>
                </form>
              )}
            </div>
          )}

          {vazio && !linkDrive && <p className="text-center text-mist/70">{t.vazio[secao]}</p>}

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
                        title={v.titulo ?? tx(idioma, "Vídeo do LPZ", "LPZ video", "Video de LPZ")}
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
                      title={a.titulo ?? tx(idioma, "Áudio do LPZ", "LPZ audio", "Audio de LPZ")}
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
                        alt={f.titulo ?? tx(idioma, "Foto do evento LPZ", "LPZ event photo", "Foto del evento LPZ")}
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
