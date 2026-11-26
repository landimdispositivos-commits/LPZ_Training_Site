import { tx } from "@/i18n";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./_components/site-header";
import { RodapeSite } from "./_components/rodape-site";
import { obterIdioma } from "@/i18n/servidor";
import { obterSessao } from "@/modules/auth/sessao";
import { ehGestor } from "@/modules/auth/papeis";
import { obterLinkParty } from "@/modules/midia/link-party";
import { salvarLinkPartyAction } from "./_components/inicio/actions";
import { classeInput } from "./_components/form-ui";

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

export const dynamic = "force-dynamic";

const classeBotaoInicio =
  "bg-gold-metal inline-block rounded-full px-8 py-3 font-semibold text-gold-ink shadow-[0_0_30px_rgb(230_181_74/0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300";

export default async function Home(props: PageProps<"/">) {
  const idioma = await obterIdioma();
  const [busca, linkParty, sessao] = await Promise.all([props.searchParams, obterLinkParty(), obterSessao().catch(() => null)]);
  // Organização edita o link do LPZ Party aqui mesmo (canetinha embaixo do botão).
  const gestor = !!sessao && ehGestor(sessao.user.papel);
  const editandoParty = gestor && busca.editar === "party";
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
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/quem-somos" className={classeBotaoInicio}>
                {tx(idioma, "Quem somos", "About us", "Quiénes somos")}
              </Link>
              {/* LPZ Party: site externo da organização. Para o público o botão
                  só aparece depois que a organização cadastrar o link. */}
              <div id="lpz-party" className="flex scroll-mt-24 flex-col items-center gap-2">
                {linkParty ? (
                  <a href={linkParty} target="_blank" rel="noopener noreferrer" className={classeBotaoInicio}>
                    LPZ Party <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  gestor && (
                    <span className={`${classeBotaoInicio} cursor-not-allowed opacity-50`} title="Cadastre o link para o botão aparecer para o público">
                      LPZ Party
                    </span>
                  )
                )}
                {gestor && busca.salvo === "party" && (
                  <p role="status" className="text-sm text-teal-300">Link salvo.</p>
                )}
                {gestor && !editandoParty && (
                  <Link href="/?editar=party#lpz-party" className="text-xs font-semibold text-gold-300 hover:underline">
                    ✎ {linkParty ? "Editar link do LPZ Party" : "Cadastrar link do LPZ Party (só a organização vê este botão)"}
                  </Link>
                )}
                {editandoParty && (
                  <form action={salvarLinkPartyAction} className="mt-2 w-[min(90vw,28rem)] space-y-3 rounded-2xl border border-white/10 bg-petrol-900/90 p-4 text-left">
                    <label htmlFor="link-party" className="block text-sm text-mist">
                      Link do LPZ Party
                      <input
                        id="link-party"
                        name="link"
                        type="url"
                        inputMode="url"
                        maxLength={500}
                        defaultValue={linkParty ?? ""}
                        placeholder="https://..."
                        className={`${classeInput} mt-1`}
                      />
                    </label>
                    <p className="text-xs text-mist/60">Endereço completo, começando com https://. Deixe em branco para tirar o botão do site.</p>
                    {busca.erro && <p role="alert" className="text-sm text-ember-400">Link inválido: use um endereço que comece com https://</p>}
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="submit" className="bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                        Salvar
                      </button>
                      <Link href="/#lpz-party" className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-mist/80 hover:bg-white/10">
                        Cancelar
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>

      <RodapeSite />
    </>
  );
}
