import { tx } from "@/i18n";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./_components/site-header";
import { RodapeSite } from "./_components/rodape-site";
import { obterIdioma } from "@/i18n/servidor";

// Página inicial: só a apresentação. Cronograma, Professores, Ingressos e
// Galeria são subpáginas, abertas pelo menu do topo.

// Linhas finas em curva, como no material de divulgação. Só decoração.
function LinhasDecorativas() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-20 sm:opacity-40"
      viewBox="0 0 400 800"
      preserveAspectRatio="none"
      fill="none"
      stroke="white"
      strokeWidth="1"
    >
      <path d="M-20 520 L120 120 Q140 60 200 60 L420 60" vectorEffect="non-scaling-stroke" />
      <path d="M420 180 L330 180 Q280 180 260 240 L150 560" vectorEffect="non-scaling-stroke" />
      <path d="M420 420 L300 800" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default async function Home() {
  const idioma = await obterIdioma();
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold-300 focus:px-4 focus:py-2 focus:text-gold-ink focus:shadow"
      >
        {tx(idioma, "Pular para o conteúdo", "Skip to content", "Saltar al contenido")}
      </a>

      <SiteHeader />

      <main id="conteudo">
        <section className="bg-city-glow relative flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-hidden px-4 py-24 text-center sm:py-32">
          <LinhasDecorativas />
          <div className="relative mx-auto max-w-3xl">
            <h1 className="flex flex-col items-center">
              {/* Logo oficial (recortado do arquivo enviado pela organização,
                  fundo removido). O texto "Training" segue como texto real. */}
              <Image
                src="/logo-lpz.png"
                alt="LPZ"
                width={710}
                height={548}
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 640px) 288px, 192px"
                className="h-auto w-48 drop-shadow-[0_4px_24px_rgb(230_181_74/0.35)] sm:w-72"
              />
              <span className="mt-4 font-display text-lg uppercase tracking-[0.6em] text-white sm:text-2xl">
                Training
              </span>
            </h1>
            <p className="mx-auto mt-10 max-w-xl text-base text-mist/90 sm:text-lg">
              {idioma === "en" ? (
                <>
                  A <strong className="font-semibold text-white">zouk congress</strong> focused on{" "}
                  <strong className="font-semibold text-white">training and continuous practice</strong>.
                </>
              ) : idioma === "es" ? (
                <>
                  Es un <strong className="font-semibold text-white">congreso de zouk</strong> enfocado en el{" "}
                  <strong className="font-semibold text-white">entrenamiento y la práctica continua</strong>.
                </>
              ) : (
                <>
                  É um <strong className="font-semibold text-white">congresso de zouk</strong> que
                  tem como foco uma linha de{" "}
                  <strong className="font-semibold text-white">treinamento e prática continuada</strong>.
                </>
              )}
            </p>
            <Link
              href="/quem-somos"
              className="bg-gold-metal mt-10 inline-block rounded-full px-8 py-3 font-semibold text-gold-ink shadow-[0_0_30px_rgb(230_181_74/0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
            >
              {tx(idioma, "Quem somos", "About us", "Quiénes somos")}
            </Link>
          </div>
        </section>

      </main>

      <RodapeSite />
    </>
  );
}
