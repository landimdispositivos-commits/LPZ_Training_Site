import type { Metadata } from "next";
import Link from "next/link";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { buscarNoSite } from "@/modules/busca";
import { classeInput } from "../_components/form-ui";
import { PaginaPublica } from "../_components/pagina-publica";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Busca — LPZ Training", "Search — LPZ Training", "Búsqueda — LPZ Training") };
}
export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Busca",
    rotulo: "O que você procura?",
    exemplo: "Ex.: massagem, cronograma, reembolso, DJ",
    buscar: "Buscar",
    nada: (q: string) => `Nada encontrado para “${q}”. Tente outra palavra.`,
    achados: (n: number, q: string) => `${n} ${n === 1 ? "resultado" : "resultados"} para “${q}”`,
  },
  {
    titulo: "Search",
    rotulo: "What are you looking for?",
    exemplo: "E.g. massage, schedule, refund, DJ",
    buscar: "Search",
    nada: (q: string) => `Nothing found for “${q}”. Try another word.`,
    achados: (n: number, q: string) => `${n} ${n === 1 ? "result" : "results"} for “${q}”`,
  },
  {
    titulo: "Búsqueda",
    rotulo: "¿Qué estás buscando?",
    exemplo: "Ej.: masaje, cronograma, reembolso, DJ",
    buscar: "Buscar",
    nada: (q: string) => `No encontramos nada para “${q}”. Prueba otra palabra.`,
    achados: (n: number, q: string) => `${n} ${n === 1 ? "resultado" : "resultados"} para “${q}”`,
  },
);

export default async function Page(props: PageProps<"/busca">) {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const { q } = await props.searchParams;
  const consulta = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const resultados = consulta ? await buscarNoSite(consulta, idioma) : [];

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} largura="max-w-2xl">
        <form method="get" role="search" className="flex gap-2">
          <label htmlFor="busca-pagina" className="sr-only">{t.rotulo}</label>
          <input id="busca-pagina" name="q" type="search" defaultValue={consulta} placeholder={t.exemplo} autoFocus={!consulta} className={classeInput} />
          <button type="submit" className="rounded-lg bg-teal-400 px-4 font-semibold text-petrol-950 hover:brightness-110">{t.buscar}</button>
        </form>
        {consulta && (
          <section className="mt-6 space-y-3">
            <p className="text-sm text-mist/70">{resultados.length ? t.achados(resultados.length, consulta) : t.nada(consulta)}</p>
            <ul className="space-y-3">
              {resultados.map((r, i) => (
                <li key={`${r.href}-${i}`}>
                  <Link href={r.href} className="block rounded-2xl border border-gold-500/30 bg-petrol-950/70 p-4 hover:border-gold-300">
                    <p className="text-xs uppercase tracking-wider text-teal-300">{r.tipo}</p>
                    <p className="font-semibold text-white">{r.titulo}</p>
                    {r.resumo && <p className="mt-1 line-clamp-2 text-sm text-mist/70">{r.resumo}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
