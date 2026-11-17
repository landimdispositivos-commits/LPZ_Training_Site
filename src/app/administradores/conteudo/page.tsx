import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { formatarDiaCronograma } from "@/lib/formatar";
import { Aviso, Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { removerAulaAction, removerProfessorAction, salvarAulaAction, salvarProfessorAction } from "./actions";

export const metadata: Metadata = { title: "Cronograma e professores — LPZ Training" };

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

const classeSecundario =
  "rounded-full border border-ember-500/60 px-4 py-2 text-xs font-semibold text-ember-400 hover:bg-ember-500/10";

export default async function Page(props: PageProps<"/administradores/conteudo">) {
  await exigirAdmin(["organizador"]);
  const { ok, erro } = await props.searchParams;

  const [listaProfessores, aulas] = await Promise.all([
    db.select().from(professores).orderBy(asc(professores.ordem), asc(professores.nome)),
    db
      .select({ aula: cronogramaItens, professorNome: professores.nome })
      .from(cronogramaItens)
      .leftJoin(professores, eq(professores.id, cronogramaItens.professorId))
      .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio), asc(cronogramaItens.ordem)),
  ]);
  const opcoesProfessor = listaProfessores.map((p) => ({ id: p.id, nome: p.nome }));

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">
              Cronograma e professores
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

type Professor = typeof professores.$inferSelect;
type Aula = typeof cronogramaItens.$inferSelect;

function FormProfessor({ professor }: { professor?: Professor }) {
  const p = professor?.id ?? "novo-prof";
  return (
    <form action={salvarProfessorAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      {professor && <input type="hidden" name="id" value={professor.id} />}
      <Campo id={`${p}-nome`} label="Nome">
        <input id={`${p}-nome`} name="nome" required maxLength={100} defaultValue={professor?.nome} className={classeInput} />
      </Campo>
      <Campo id={`${p}-insta`} label="Instagram (opcional)">
        <input id={`${p}-insta`} name="instagram" maxLength={60} defaultValue={professor?.instagram ?? ""} placeholder="@perfil" className={classeInput} />
      </Campo>
      <div className="sm:col-span-2">
        <Campo id={`${p}-bio`} label="Bio (opcional)">
          <textarea id={`${p}-bio`} name="bio" rows={3} maxLength={1000} defaultValue={professor?.bio ?? ""} className={classeInput} />
        </Campo>
      </div>
      <Campo id={`${p}-ordem`} label="Ordem no site" dica="Menor aparece primeiro.">
        <input id={`${p}-ordem`} name="ordem" type="number" min={0} max={999} defaultValue={professor?.ordem ?? 0} className={classeInput} />
      </Campo>
      <div className="flex items-end">
        <button type="submit" className={classeBotao}>{professor ? "Salvar" : "Adicionar professor"}</button>
      </div>
    </form>
  );
}

function FormAula({ aula, professores: lista }: { aula?: Aula; professores: { id: string; nome: string }[] }) {
  const p = aula?.id ?? "nova-aula";
  return (
    <form action={salvarAulaAction} className="mt-4 grid gap-4 sm:grid-cols-3">
      {aula && <input type="hidden" name="id" value={aula.id} />}
      <Campo id={`${p}-dia`} label="Dia">
        <input id={`${p}-dia`} name="dia" type="date" required defaultValue={aula?.dia ?? "2027-09-24"} className={classeInput} />
      </Campo>
      <Campo id={`${p}-ini`} label="Início">
        <input id={`${p}-ini`} name="horarioInicio" type="time" required defaultValue={aula?.horarioInicio} className={classeInput} />
      </Campo>
      <Campo id={`${p}-fim`} label="Fim (opcional)">
        <input id={`${p}-fim`} name="horarioFim" type="time" defaultValue={aula?.horarioFim ?? ""} className={classeInput} />
      </Campo>
      <div className="sm:col-span-3">
        <Campo id={`${p}-titulo`} label="Título">
          <input id={`${p}-titulo`} name="titulo" required maxLength={120} defaultValue={aula?.titulo} placeholder="Aula de zouk — nível intermediário" className={classeInput} />
        </Campo>
      </div>
      <Campo id={`${p}-prof`} label="Professor/DJ">
        <select id={`${p}-prof`} name="professorId" defaultValue={aula?.professorId ?? ""} className={classeInput}>
          <option value="">Nenhum</option>
          {lista.map((prof) => (
            <option key={prof.id} value={prof.id}>{prof.nome}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`${p}-local`} label="Local (opcional)">
        <input id={`${p}-local`} name="local" maxLength={100} defaultValue={aula?.local ?? ""} placeholder="Sala 1" className={classeInput} />
      </Campo>
      <Campo id={`${p}-ordem`} label="Ordem no dia">
        <input id={`${p}-ordem`} name="ordem" type="number" min={0} max={999} defaultValue={aula?.ordem ?? 0} className={classeInput} />
      </Campo>
      <div className="sm:col-span-3">
        <Campo id={`${p}-desc`} label="Descrição (opcional)">
          <textarea id={`${p}-desc`} name="descricao" rows={2} maxLength={1000} defaultValue={aula?.descricao ?? ""} className={classeInput} />
        </Campo>
      </div>
      <div className="sm:col-span-3">
        <button type="submit" className={classeBotao}>{aula ? "Salvar" : "Adicionar ao cronograma"}</button>
      </div>
    </form>
  );
}

function FormRemover({ action, id, texto }: { action: (form: FormData) => Promise<void>; id: string; texto: string }) {
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-center gap-2 text-xs text-mist/80">
        <input type="checkbox" name="confirmo" required className="h-4 w-4 accent-ember-500" />
        Confirmo
      </label>
      <button type="submit" className={classeSecundario}>{texto}</button>
    </form>
  );
}
