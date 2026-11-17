import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { formatarDiaCronograma } from "@/lib/formatar";
import { FormAula, FormRemover } from "../conteudo/forms";
import { removerAulaAction } from "../conteudo/actions";
import { Aviso } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";

export const metadata: Metadata = { title: "Cronograma — LPZ Training" };

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

export default async function Page(props: PageProps<"/administradores/cronograma">) {
  await exigirAdmin(["organizador"]);
  const { ok, erro } = await props.searchParams;

  const [listaProfessores, aulas] = await Promise.all([
    db.select({ id: professores.id, nome: professores.nome }).from(professores).orderBy(asc(professores.nome)),
    db
      .select({ aula: cronogramaItens, professorNome: professores.nome })
      .from(cronogramaItens)
      .leftJoin(professores, eq(professores.id, cronogramaItens.professorId))
      .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio), asc(cronogramaItens.ordem)),
  ]);
  const opcoesProfessor = listaProfessores;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
              Cronograma
            </h1>
            <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
          </div>

          {typeof ok === "string" && MENSAGENS[ok] && <Aviso tipo="ok">{MENSAGENS[ok].texto}</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          {/* ------------------------------------------------- cronograma */}
          <section id="cronograma" className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Cronograma</h2>
            {aulas.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhuma atividade cadastrada.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {aulas.map(({ aula, professorNome }) => (
                  <li key={aula.id} className="rounded-xl border border-white/10 border-l-2 border-l-gold-400 bg-petrol-950/60 p-4">
                    <p className="text-sm font-medium capitalize text-teal-300">
                      {formatarDiaCronograma(aula.dia)} · {aula.horarioInicio}
                      {aula.horarioFim ? ` – ${aula.horarioFim}` : ""}
                    </p>
                    <p className="mt-1 font-semibold text-white">{aula.titulo}</p>
                    <p className="text-sm text-mist/70">{[professorNome, aula.local].filter(Boolean).join(" · ")}</p>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-teal-300">Editar</summary>
                      <FormAula aula={aula} professores={opcoesProfessor} />
                      <FormRemover action={removerAulaAction} id={aula.id} texto="Remover do cronograma" />
                    </details>
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-gold-300">+ Nova atividade</summary>
              <FormAula professores={opcoesProfessor} />
            </details>
          </section>
        </div>
      </main>
    </>
  );
}
