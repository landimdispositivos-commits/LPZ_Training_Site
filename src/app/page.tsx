import { asc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { formatarDiaCronograma, formatarPreco } from "@/lib/formatar";
import { vitrine } from "@/modules/ingressos";
import { SiteHeader } from "./_components/site-header";

// Conteúdo vem do admin e o volume de acesso é baixo — renderizar por
// requisição evita ter que acessar o banco durante `next build`.
export const dynamic = "force-dynamic";

async function getDadosLanding() {
  const [cronograma, listaProfessores, produtos] = await Promise.all([
    db
      .select({
        id: cronogramaItens.id,
        dia: cronogramaItens.dia,
        horarioInicio: cronogramaItens.horarioInicio,
        horarioFim: cronogramaItens.horarioFim,
        titulo: cronogramaItens.titulo,
        local: cronogramaItens.local,
        professorNome: professores.nome,
      })
      .from(cronogramaItens)
      .leftJoin(professores, eq(cronogramaItens.professorId, professores.id))
      .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio), asc(cronogramaItens.ordem)),
    db.select().from(professores).orderBy(asc(professores.ordem), asc(professores.nome)),
    vitrine(),
  ]);

  return { cronograma, listaProfessores, produtos };
}

// Agrupa o cronograma por dia, mantendo a ordem.
function agruparPorDia<T extends { dia: string }>(itens: T[]) {
  const dias = new Map<string, T[]>();
  for (const item of itens) dias.set(item.dia, [...(dias.get(item.dia) ?? []), item]);
  return [...dias.entries()];
}

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

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
      {children}
    </h2>
  );
}

export default async function Home() {
  const { cronograma, listaProfessores, produtos } = await getDadosLanding();

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold-300 focus:px-4 focus:py-2 focus:text-gold-ink focus:shadow"
      >
        Pular para o conteúdo
      </a>

      <SiteHeader />

      <main id="conteudo">
        <section className="bg-city-glow relative overflow-hidden px-4 py-24 text-center sm:py-32">
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
              É um <strong className="font-semibold text-white">congresso de zouk</strong> que
              tem como foco uma linha de{" "}
              <strong className="font-semibold text-white">treinamento e prática continuada</strong>.
            </p>
            <Link
              href="/quem-somos"
              className="bg-gold-metal mt-10 inline-block rounded-full px-8 py-3 font-semibold text-gold-ink shadow-[0_0_30px_rgb(230_181_74/0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
            >
              Quem somos
            </Link>
          </div>
        </section>

        <section id="cronograma" className="bg-petrol-900 px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <TituloSecao>Cronograma</TituloSecao>
            {cronograma.length === 0 ? (
              <p className="mt-4 text-mist/70">Cronograma em breve.</p>
            ) : (
              <div className="mt-6 space-y-8">
                {agruparPorDia(cronograma).map(([dia, itens]) => (
                  <div key={dia}>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-300 first-letter:uppercase">
                      {formatarDiaCronograma(dia)}
                    </h3>
                    <ol className="mt-3 space-y-3">
                      {itens.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-lg border border-white/10 border-l-gold-400 border-l-2 bg-petrol-950/60 p-4"
                        >
                          <p className="text-sm font-medium text-teal-300">
                            {item.horarioInicio}
                            {item.horarioFim ? ` – ${item.horarioFim}` : ""}
                          </p>
                          <p className="mt-1 font-semibold text-white">{item.titulo}</p>
                          <p className="text-sm text-mist/70">
                            {[item.professorNome, item.local].filter(Boolean).join(" · ")}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="professores" className="px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <TituloSecao>Professores</TituloSecao>
            {listaProfessores.length === 0 ? (
              <p className="mt-4 text-mist/70">Professores em breve.</p>
            ) : (
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {listaProfessores.map((professor) => (
                  <li
                    key={professor.id}
                    className="flex gap-4 rounded-lg border border-white/10 bg-petrol-900 p-4"
                  >
                    {professor.fotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={professor.fotoUrl}
                        alt={`Foto de ${professor.nome}`}
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-white">{professor.nome}</p>
                      {professor.bio && <p className="mt-1 text-sm text-mist/70">{professor.bio}</p>}
                      {professor.instagram && <p className="mt-2 text-sm text-teal-300">{professor.instagram}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section
          id="ingressos"
          className="bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgb(242_107_29/0.25),transparent_70%)] bg-petrol-900 px-4 py-16"
        >
          <div className="mx-auto max-w-md text-center">
            <TituloSecao>Ingressos</TituloSecao>
            {produtos.length > 0 ? (
              <div className="mt-6 rounded-lg border border-gold-500/40 bg-petrol-950/70 p-6">
                <ul className="space-y-2 text-left">
                  {produtos.map((p) => (
                    <li key={p.tipo} className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2">
                      <span className="text-sm font-medium text-white">{p.produto.nome}</span>
                      <span className="font-semibold text-gold-300">
                        {p.lote ? formatarPreco(p.lote.precoCentavos) : "Esgotado"}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/ingressos"
                  className="bg-gold-metal mt-6 inline-block rounded-full px-8 py-3 font-semibold text-gold-ink transition hover:brightness-110"
                >
                  Comprar ingresso
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-mist/70">Vendas ainda não abertas. Volte em breve.</p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-mist/60">
        <span className="font-display tracking-[0.25em]">LPZ TRAINING</span>
        <p className="mt-3">
          <Link href="/privacidade" className="hover:text-gold-300 hover:underline">Política de Privacidade</Link>
        </p>
      </footer>
    </>
  );
}
