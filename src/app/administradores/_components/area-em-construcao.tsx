import Link from "next/link";
import { SiteHeader } from "../../_components/site-header";

// Página de menu já criado, ainda sem conteúdo definido.
export function AreaEmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">{titulo}</h1>
            <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
          </div>
          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-8 text-center">
            <p className="text-mist/90">{descricao}</p>
            <p className="mt-6 font-script text-4xl text-white">em construção</p>
          </section>
        </div>
      </main>
    </>
  );
}
