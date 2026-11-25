import { tx } from "@/i18n";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, GOOGLE_ATIVO } from "@/modules/auth/auth";
import { mensagemErroGoogle } from "@/modules/auth/erros-google";
import { areaDoPapel } from "@/modules/auth/papeis";
import { proximoSeguro } from "@/modules/auth/proximo";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { AcessoCongressista } from "./_components/acesso-congressista";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Entrar ou cadastrar — LPZ Training", "Sign in or sign up — LPZ Training", "Entrar o registrarse — LPZ Training") };
}

const AVISOS: Record<string, string> = {
  link: "O link de confirmação é inválido ou expirou. Entre com seu e-mail e senha para receber um novo.",
};
const AVISOS_ES: Record<string, string> = {
  link: "El enlace de confirmación es inválido o venció. Entra con tu correo y contraseña para recibir uno nuevo.",
};
const AVISOS_EN: Record<string, string> = {
  link: "The confirmation link is invalid or has expired. Sign in with your email and password to receive a new one.",
};

export default async function Page(props: PageProps<"/congressistas">) {
  const { erro, error, proximo: proximoBruto } = await props.searchParams;
  const proximo = proximoSeguro(proximoBruto);
  const sessao = await auth.api.getSession({ headers: await headers() });
  if (sessao) {
    redirect(sessao.user.papel === "congressista" && proximo ? proximo : areaDoPapel(sessao.user.papel));
  }

  const idioma = await obterIdioma();
  const en = idioma === "en";
  const avisoInicial =
    (typeof erro === "string" ? tx(idioma, AVISOS, AVISOS_EN, AVISOS_ES)[erro] : undefined) ??
    mensagemErroGoogle(typeof error === "string" ? error : undefined, "congressistas", idioma);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            {tx(idioma, "Entre ou cadastre-se", "Sign in or sign up", "Entra o regístrate")}
          </h1>
          <p className="mt-4 text-mist/90">
            {tx(
              idioma,
              "Entre na sua conta ou faça um cadastro rápido para comprar ingressos e acompanhar o evento.",
              "Sign in to your account or create one quickly to buy tickets and follow the event.",
              "Entra en tu cuenta o regístrate rápidamente para comprar entradas y seguir el evento.",
            )}
          </p>
        </div>
        <div className="mt-10">
          <AcessoCongressista avisoInicial={avisoInicial} googleAtivo={GOOGLE_ATIVO} proximo={proximo} />
        </div>
      </main>
    </>
  );
}
