import { tx } from "@/i18n";
import type { Metadata } from "next";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../../_components/site-header";
import { FormRedefinirSenha } from "../../_components/form-redefinir-senha";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Redefinir senha — LPZ Training", "Reset password — LPZ Training", "Restablecer contraseña — LPZ Training") };
}

export default async function Page(props: PageProps<"/congressistas/redefinir-senha">) {
  const { token, error } = await props.searchParams;
  const idioma = await obterIdioma();

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-md">
          <h1 className="text-center font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
            {tx(idioma, "Redefinir senha", "Reset password", "Restablecer contraseña")}
          </h1>
          <div className="mt-8 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <FormRedefinirSenha
              token={typeof token === "string" && !error ? token : undefined}
              urlEntrar="/congressistas"
            />
          </div>
        </div>
      </main>
    </>
  );
}
