import { tx } from "@/i18n";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, GOOGLE_ATIVO } from "@/modules/auth/auth";
import { mensagemErroGoogle } from "@/modules/auth/erros-google";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { AcessoProfissional } from "./_components/acesso-profissional";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Profissionais — LPZ Training", "Professionals — LPZ Training", "Profesionales — LPZ Training") };
}

const AVISOS: Record<string, string> = {
  restrito: "Esta área é exclusiva para professores e DJs convidados pela organização.",
};
const AVISOS_ES: Record<string, string> = {
  restrito: "Esta área es exclusiva para profesores y DJs invitados por la organización.",
};
const AVISOS_EN: Record<string, string> = {
  restrito: "This area is only for teachers and DJs invited by the organizers.",
};

export default async function Page(props: PageProps<"/profissionais">) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (sessao?.user.papel === "profissional") redirect("/profissionais/minha-area");

  const { erro, error } = await props.searchParams;
  const idioma = await obterIdioma();
  const en = idioma === "en";
  const avisoInicial =
    (typeof erro === "string" ? tx(idioma, AVISOS, AVISOS_EN, AVISOS_ES)[erro] : undefined) ??
    mensagemErroGoogle(typeof error === "string" ? error : undefined, "profissionais", idioma);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            {tx(idioma, "Profissionais", "Professionals", "Profesionales")}
          </h1>
          <p className="mt-4 text-mist/90">{tx(idioma, "Área de professores e DJs do LPZ Training.", "LPZ Training teachers and DJs area.", "Área de profesores y DJs de LPZ Training.")}</p>
        </div>
        <div className="mt-10">
          <AcessoProfissional avisoInicial={avisoInicial} googleAtivo={GOOGLE_ATIVO} />
        </div>
      </main>
    </>
  );
}
