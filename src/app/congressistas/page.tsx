import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, GOOGLE_ATIVO } from "@/modules/auth/auth";
import { mensagemErroGoogle } from "@/modules/auth/erros-google";
import { areaDoPapel } from "@/modules/auth/papeis";
import { SiteHeader } from "../_components/site-header";
import { AcessoCongressista } from "./_components/acesso-congressista";

export const metadata: Metadata = { title: "Entrar ou cadastrar — LPZ Training" };

const AVISOS: Record<string, string> = {
  link: "O link de confirmação é inválido ou expirou. Entre com seu e-mail e senha para receber um novo.",
};

export default async function Page(props: PageProps<"/congressistas">) {
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (sessao) {
    redirect(areaDoPapel(sessao.user.papel));
  }

  const { erro, error } = await props.searchParams;
  const avisoInicial =
    (typeof erro === "string" ? AVISOS[erro] : undefined) ??
    mensagemErroGoogle(typeof error === "string" ? error : undefined, "congressistas");

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            Entre ou cadastre-se
          </h1>
          <p className="mt-4 text-mist/90">
            Entre na sua conta ou faça um cadastro rápido para comprar ingressos e acompanhar o evento.
          </p>
        </div>
        <div className="mt-10">
          <AcessoCongressista avisoInicial={avisoInicial} googleAtivo={GOOGLE_ATIVO} />
        </div>
        <p className="mx-auto mt-8 max-w-md text-center text-sm text-mist/70">
          É professor(a) ou DJ?{" "}
          <Link href="/profissionais" className="font-medium text-teal-300 hover:underline">Entre aqui</Link>
          {" · "}
          Organização ou portaria?{" "}
          <Link href="/administradores" className="font-medium text-teal-300 hover:underline">Entre aqui</Link>
        </p>
      </main>
    </>
  );
}
