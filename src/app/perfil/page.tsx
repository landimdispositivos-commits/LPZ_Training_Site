import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { areaDoPapel } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { CampoApelido } from "../_components/campo-apelido";
import { CampoFoto } from "../_components/campo-foto";
import { SiteHeader } from "../_components/site-header";

export const metadata: Metadata = { title: "Minha foto — LPZ Training" };

const T = traducoes(
  { titulo: "Minha foto e nome", voltar: "Voltar à minha área" },
  { titulo: "My photo and name", voltar: "Back to my area" },
  { titulo: "Mi foto y nombre", voltar: "Volver a mi área" },
);

// Foto de perfil e apelido para qualquer pessoa logada (inclusive administradores):
// a foto aparece no lugar do "bonequinho" no topo do site.
export default async function Page() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const t = T[await obterIdioma()];
  const { user } = sessao;
  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">{t.titulo}</h1>
            <Link href={areaDoPapel(user.papel)} className="text-sm text-teal-300 hover:underline">{t.voltar}</Link>
          </div>
          <CampoFoto foto={user.image ?? null} nome={user.name} />
          <CampoApelido apelido={user.apelido ?? null} primeiroNome={user.name.split(" ")[0]} />
        </div>
      </main>
    </>
  );
}
