import type { Metadata } from "next";
import Link from "next/link";
import { tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";
import { POLITICA, type Secao } from "./conteudo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Política de Privacidade — LPZ Training", "Privacy Policy — LPZ Training", "Política de Privacidad — LPZ Training") };
}

const classeArtigo =
  "mx-auto max-w-2xl space-y-5 text-mist/90 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gold-300 [&_li]:ml-5 [&_li]:list-disc";

function BlocoSecao({ s }: { s: Secao }) {
  return (
    <section>
      <h2>{s.h}</h2>
      {s.p?.map((t, i) => (
        <p key={i} className="mt-3">{t}</p>
      ))}
      {s.li && (
        <ul className="mt-3 space-y-2">
          {s.li.map(([titulo, texto]) => (
            <li key={titulo}>
              <strong className="text-white">{titulo}</strong> — {texto}
            </li>
          ))}
        </ul>
      )}
      {s.depois?.map((t, i) => (
        <p key={i} className="mt-3">{t}</p>
      ))}
    </section>
  );
}

export default async function Page() {
  const idioma = await obterIdioma();
  const c = POLITICA[idioma];
  return (
    <>
      <SiteHeader />
      <main className="px-4 py-16">
        <article className={classeArtigo}>
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">{c.titulo}</h1>
          <p className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm">{c.aviso}</p>
          {c.intro.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          {c.secoes.map((s) => (
            <BlocoSecao key={s.h} s={s} />
          ))}
          <p className="pt-6 text-sm">
            <Link href="/seguranca" className="text-teal-300 underline">
              {tx(idioma, "Ver a Política de Segurança", "See the Security Policy", "Ver la Política de Seguridad")}
            </Link>
          </p>
        </article>
      </main>
      <RodapeSite />
    </>
  );
}
