import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { FormProfessor, FormRemover } from "../conteudo/forms";
import { removerProfessorAction } from "../conteudo/actions";
import { Aviso, Campo } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Professores — LPZ Training" };

const MENSAGENS: Record<string, { tipo: "ok" | "erro"; texto: string }> = {
  professor: { tipo: "ok", texto: "Professor salvo." },
  aula: { tipo: "ok", texto: "Cronograma salvo." },
  foto: { tipo: "ok", texto: "Foto atualizada." },
  removido: { tipo: "ok", texto: "Removido." },
};
const ERROS: Record<string, string> = {
  professor: "Confira os dados do professor (nome obrigatório; Instagram só com letras, números, ponto e _).",
  aula: "Confira os dados da aula: dia, horário de início (e fim depois do início) e título.",
  foto: "Foto não aceita. Use JPG, PNG ou WebP de até 8 MB.",
  confirmar: "Marque a caixa de confirmação para remover.",
  dados: "Não foi possível salvar. Tente de novo.",
};

export default async function Page(props: PageProps<"/administradores/professores">) {
  await exigirAdmin(["organizador"]);
  const { ok, erro } = await props.searchParams;

  const listaProfessores = await db.select().from(professores).orderBy(asc(professores.ordem), asc(professores.nome));

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
              Professores
            </h1>
            <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
          </div>

          {typeof ok === "string" && MENSAGENS[ok] && <Aviso tipo="ok">{MENSAGENS[ok].texto}</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          {/* ------------------------------------------------ professores */}
          <section id="professores" className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Professores e DJs</h2>
            <ul className="mt-4 space-y-3">
              {listaProfessores.map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-petrol-950/60 p-4">
                  <div className="flex items-center gap-4">
                    {p.fotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.fotoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-petrol-800 text-lg text-gold-300">
                        {p.nome.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{p.nome}</p>
                      <p className="text-sm text-mist/60">{p.instagram ?? "sem Instagram"} · ordem {p.ordem}</p>
                    </div>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-teal-300">Editar</summary>
                    <FormProfessor professor={p} />
                    <form
                      method="post"
                      action="/administradores/conteudo/foto-professor"
                      encType="multipart/form-data"
                      className="mt-4 space-y-3 border-t border-white/10 pt-4"
                    >
                      <input type="hidden" name="professorId" value={p.id} />
                      <Campo id={`foto-${p.id}`} label={p.fotoUrl ? "Trocar foto" : "Enviar foto"} dica="JPG, PNG ou WebP, até 8 MB. Use só fotos com autorização.">
                        <input id={`foto-${p.id}`} name="foto" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm text-mist" />
                      </Campo>
                      <button type="submit" className="rounded-full bg-teal-400 px-5 py-2 text-sm font-semibold text-petrol-950">Enviar foto</button>
                    </form>
                    <FormRemover action={removerProfessorAction} id={p.id} texto="Remover professor (as aulas dele ficam sem professor)" />
                  </details>
                </li>
              ))}
            </ul>
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-gold-300">+ Novo professor</summary>
              <FormProfessor />
              <p className="mt-2 text-xs text-mist/60">A foto é enviada depois de salvar, em “Editar”.</p>
            </details>
          </section>

        </div>
      </main>
    </>
  );
}
