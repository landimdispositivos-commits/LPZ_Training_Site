import type { Metadata } from "next";
import { FormRedefinirSenha } from "../../_components/form-redefinir-senha";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../../_components/site-header";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obterIdioma()) === "en" ? "Reset password — LPZ Training" : "Redefinir senha — LPZ Training" };
}

export default async function Page(props: PageProps<"/profissionais/redefinir-senha">) {
  const { token, error } = await props.searchParams;
  const en = (await obterIdioma()) === "en";

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md">
          <h1 className="text-center font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
            {en ? "Reset password" : "Redefinir senha"}
          </h1>
          <div className="mt-8 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <FormRedefinirSenha
              token={typeof token === "string" && !error ? token : undefined}
              urlEntrar="/profissionais"
              modo="redefinir"
            />
          </div>
        </div>
      </main>
    </>
  );
}
