import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { obterIdioma } from "@/i18n/servidor";
import { obterPerfil } from "@/modules/perfis";
import { DetalhePerfil, podeEditar } from "../../_components/perfis";
import { RodapeSite } from "../../_components/rodape-site";
import { SiteHeader } from "../../_components/site-header";

const CATEGORIA = "dj" as const;

async function carregar(id: string) {
  const valido = z.uuid().safeParse(id);
  return valido.success ? obterPerfil(CATEGORIA, valido.data) : undefined;
}

export async function generateMetadata(props: PageProps<"/djs/[id]">): Promise<Metadata> {
  const perfil = await carregar((await props.params).id);
  return { title: perfil ? `${perfil.nome} — LPZ Training` : "LPZ Training" };
}

export const dynamic = "force-dynamic";

export default async function Page(props: PageProps<"/djs/[id]">) {
  const [{ id }, busca] = await Promise.all([props.params, props.searchParams]);
  const perfil = await carregar(id);
  if (!perfil) notFound();
  const [idioma, editavel] = await Promise.all([obterIdioma(), podeEditar()]);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <DetalhePerfil
          perfil={perfil}
          categoria={CATEGORIA}
          idioma={idioma}
          editavel={editavel}
          editar={busca.editar === "1"}
          ok={busca.ok === "1"}
          erro={busca.erro === "1"}
        />
      </main>
      <RodapeSite />
    </>
  );
}
