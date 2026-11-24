import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { itensDaGaleria } from "@/modules/midia/galeria";
import { Aviso, Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { removerMidiaAction } from "./actions";

export const metadata: Metadata = { title: "Fotos — LPZ Training" };

const OK: Record<string, string> = { foto: "Foto publicada.", removida: "Foto removida." };
const ERROS: Record<string, string> = {
  foto: "Foto não aceita. Use JPG, PNG ou WebP de até 8 MB.",
  falha: "Não foi possível salvar. Tente de novo.",
};

export default async function Page(props: PageProps<"/administradores/galeria">) {
  await exigirAdmin(["organizador", "midias"]);
  const { ok, erro } = await props.searchParams;
  const itens = (await itensDaGaleria()).filter((i) => i.tipo === "foto");

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Fotos</h1>
            <div className="flex gap-4 text-sm">
              <Link href="/galeria" className="text-teal-300 hover:underline">Ver galeria</Link>
              <Link href="/administradores/painel" className="text-teal-300 hover:underline">Painel</Link>
            </div>
          </div>

          {typeof ok === "string" && OK[ok] && <Aviso tipo="ok">{OK[ok]}</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Enviar foto</h2>
              <form method="post" action="/administradores/galeria/enviar" encType="multipart/form-data" className="mt-4 space-y-4">
                <Campo id="foto" label="Foto" dica="JPG, PNG ou WebP, até 8 MB. Publique só fotos com autorização de quem aparece.">
                  <input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm text-mist" />
                </Campo>
                <Campo id="foto-titulo" label="Legenda (opcional)">
                  <input id="foto-titulo" name="titulo" maxLength={120} className={classeInput} />
                </Campo>
                <button type="submit" className={classeBotao}>Publicar foto</button>
              </form>
            </section>

            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Vídeos e músicas</h2>
              <p className="mt-3 text-sm text-mist/70">Vídeos do YouTube e áudios ficam no menu Áudio e vídeo.</p>
              <Link href="/administradores/audio-video" className="mt-3 inline-block text-sm font-medium text-teal-300 hover:underline">
                Ir para Áudio e vídeo
              </Link>
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Publicados ({itens.length})</h2>
            {itens.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nada publicado ainda.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {itens.map((item) => (
                  <li key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-petrol-950/60">
                    {item.tipo === "foto" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.titulo ?? ""} className="aspect-square w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://i.ytimg.com/vi/${item.referencia}/hqdefault.jpg`}
                        alt={item.titulo ?? "Vídeo do YouTube"}
                        className="aspect-square w-full object-cover"
                      />
                    )}
                    <div className="p-2">
                      <p className="truncate text-xs text-mist/80">{item.tipo === "foto" ? "Foto" : "Vídeo"}{item.titulo ? ` · ${item.titulo}` : ""}</p>
                      <form action={removerMidiaAction} className="mt-1">
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className="text-xs font-semibold text-ember-400 hover:underline">Remover</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
