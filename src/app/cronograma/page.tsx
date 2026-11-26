import { traducoes, tx } from "@/i18n";
import { CancelarEdicao } from "../_components/cancelar-edicao";
import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cronogramaItens, professores } from "@/db/schema";
import { obterIdioma } from "@/i18n/servidor";
import { SiteHeader } from "../_components/site-header";
import { RodapeSite } from "../_components/rodape-site";
import { DATA_PADRAO_DO_DIA, dataCurta, DIAS_EVENTO, diaDaSemana } from "@/lib/dias-evento";
import { PaginaPublica } from "../_components/pagina-publica";
import { Aviso, classeBotao, classeInput } from "../_components/form-ui";
import { obterSessao } from "@/modules/auth/sessao";
import { ehGestor } from "@/modules/auth/papeis";
import { removerAulaPublicaAction, salvarAulaPublicaAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await obterIdioma();
  return {
    title: tx(idioma, "Cronograma — LPZ Training", "Schedule — LPZ Training", "Cronograma — LPZ Training"),
    description: tx(idioma, "Aulas e atividades do LPZ Training, dia a dia.", "LPZ Training classes and activities, day by day.", "Clases y actividades de LPZ Training, día a día."),
  };
}

export const dynamic = "force-dynamic";

// Textos da edição (só a organização vê; ficam nos 3 idiomas por padrão do site).
const EDICAO = traducoes(
  {
    editar: "Editar cronograma",
    sair: "Concluir edição",
    adicionar: "Adicionar aula",
    editarAula: "Editar",
    remover: "Remover esta aula",
    confirmo: "Confirmo a remoção",
    inicio: "Início",
    fim: "Fim (opcional)",
    titulo: "Aula ou atividade",
    descricao: "Descrição (opcional)",
    local: "Local (opcional)",
    professor: "Professor(es)/DJ (opcional)",
    nenhum: "— Nenhum —",
    salvar: "Salvar aula",
    cancelar: "Cancelar",
    ordem: "As aulas ficam em ordem automática pelo horário de início.",
    ok: "Cronograma atualizado.",
    erro: "Confira os campos: horário no formato 12:00 e o fim depois do início.",
    erroConfirmar: "Marque a confirmação para remover a aula.",
    removida: "Aula removida.",
  },
  {
    editar: "Edit schedule",
    sair: "Finish editing",
    adicionar: "Add class",
    editarAula: "Edit",
    remover: "Remove this class",
    confirmo: "I confirm the removal",
    inicio: "Start",
    fim: "End (optional)",
    titulo: "Class or activity",
    descricao: "Description (optional)",
    local: "Place (optional)",
    professor: "Teacher(s)/DJ (optional)",
    nenhum: "— None —",
    salvar: "Save class",
    cancelar: "Cancel",
    ordem: "Classes are automatically sorted by start time.",
    ok: "Schedule updated.",
    erro: "Check the fields: time as 12:00 and the end after the start.",
    erroConfirmar: "Tick the confirmation to remove the class.",
    removida: "Class removed.",
  },
  {
    editar: "Editar cronograma",
    sair: "Terminar edición",
    adicionar: "Agregar clase",
    editarAula: "Editar",
    remover: "Quitar esta clase",
    confirmo: "Confirmo la eliminación",
    inicio: "Inicio",
    fim: "Fin (opcional)",
    titulo: "Clase o actividad",
    descricao: "Descripción (opcional)",
    local: "Lugar (opcional)",
    professor: "Profesor(es)/DJ (opcional)",
    nenhum: "— Ninguno —",
    salvar: "Guardar clase",
    cancelar: "Cancelar",
    ordem: "Las clases se ordenan automáticamente por la hora de inicio.",
    ok: "Cronograma actualizado.",
    erro: "Revisa los campos: hora como 12:00 y el fin después del inicio.",
    erroConfirmar: "Marca la confirmación para quitar la clase.",
    removida: "Clase quitada.",
  },
);

type Aula = {
  id: string;
  dia: string;
  horarioInicio: string;
  horarioFim: string | null;
  titulo: string;
  descricao: string | null;
  local: string | null;
  professorId: string | null;
};

function FormAula({
  aula,
  dia,
  perfis,
  t,
}: {
  aula?: Aula;
  dia: string;
  perfis: { id: string; nome: string; categoria: string }[];
  t: (typeof EDICAO)["pt"];
}) {
  const sufixo = aula?.id ?? dia;
  return (
    <form action={salvarAulaPublicaAction} className="mt-3 space-y-3 rounded-xl border border-white/10 bg-petrol-950/60 p-4">
      {aula && <input type="hidden" name="id" value={aula.id} />}
      <input type="hidden" name="dia" value={aula?.dia ?? dia} />
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-mist">
          {t.inicio}
          <input name="horarioInicio" type="time" required defaultValue={aula?.horarioInicio ?? ""} className={`${classeInput} mt-1`} />
        </label>
        <label className="text-sm text-mist">
          {t.fim}
          <input name="horarioFim" type="time" defaultValue={aula?.horarioFim ?? ""} className={`${classeInput} mt-1`} />
        </label>
      </div>
      <label className="block text-sm text-mist">
        {t.titulo}
        <input name="titulo" required maxLength={120} defaultValue={aula?.titulo ?? ""} className={`${classeInput} mt-1`} />
      </label>
      <label className="block text-sm text-mist" htmlFor={`prof-${sufixo}`}>
        {t.professor}
        <select id={`prof-${sufixo}`} name="professorId" defaultValue={aula?.professorId ?? ""} className={`${classeInput} mt-1`}>
          <option value="">{t.nenhum}</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
              {p.categoria === "dj" ? " (DJ)" : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-mist">
          {t.local}
          <input name="local" maxLength={100} defaultValue={aula?.local ?? ""} className={`${classeInput} mt-1`} />
        </label>
        <label className="block text-sm text-mist">
          {t.descricao}
          <input name="descricao" maxLength={1000} defaultValue={aula?.descricao ?? ""} className={`${classeInput} mt-1`} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={`${classeBotao} sm:w-auto`}>{t.salvar}</button>
        <CancelarEdicao rotulo={t.cancelar} />
      </div>
    </form>
  );
}

export default async function Page(props: PageProps<"/cronograma">) {
  const idioma = await obterIdioma();
  const en = idioma === "en";
  const busca = await props.searchParams;
  const sessao = await obterSessao().catch(() => null);
  const editavel = !!sessao && ehGestor(sessao.user.papel);
  const editando = editavel && busca.editar === "1";
  const t = EDICAO[idioma];

  const [cronograma, perfis] = await Promise.all([
    db
      .select({
        id: cronogramaItens.id,
        dia: cronogramaItens.dia,
        horarioInicio: cronogramaItens.horarioInicio,
        horarioFim: cronogramaItens.horarioFim,
        titulo: cronogramaItens.titulo,
        descricao: cronogramaItens.descricao,
        local: cronogramaItens.local,
        professorId: cronogramaItens.professorId,
        professorNome: professores.nome,
        professorCategoria: professores.categoria,
      })
      .from(cronogramaItens)
      .leftJoin(professores, eq(cronogramaItens.professorId, professores.id))
      // Ordem automática pelo horário de início.
      .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio), asc(cronogramaItens.ordem)),
    editando
      ? db
          .select({ id: professores.id, nome: professores.nome, categoria: professores.categoria })
          .from(professores)
          .orderBy(asc(professores.categoria), asc(professores.nome))
      : Promise.resolve([]),
  ]);

  return (
    <>
      <SiteHeader />
      <PaginaPublica
        titulo={tx(idioma, "Cronograma", "Schedule", "Cronograma")}
        subtitulo={tx(idioma, "Aulas e atividades do congresso, dia a dia.", "Congress classes and activities, day by day.", "Clases y actividades del congreso, día a día.")}
        largura="max-w-3xl"
      >
        <div id="cronograma" className="scroll-mt-24 space-y-6">
          {editando && busca.ok && <Aviso tipo="ok">{busca.ok === "removida" ? t.removida : t.ok}</Aviso>}
          {editando && busca.erro && <Aviso tipo="erro">{busca.erro === "confirmar" ? t.erroConfirmar : t.erro}</Aviso>}
          {editavel && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={editando ? "/cronograma" : "/cronograma?editar=1"}
                className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
              >
                <span aria-hidden="true">{editando ? "✓" : "✎"}</span> {editando ? t.sair : t.editar}
              </Link>
              {editando && <p className="text-xs text-mist/60">{t.ordem}</p>}
            </div>
          )}

          {DIAS_EVENTO.map((d) => {
            const itens = cronograma.filter((i) => diaDaSemana(i.dia) === d.semana);
            const datas = [...new Set(itens.map((i) => dataCurta(i.dia, en)))];
            const dataDoDia = itens[0]?.dia ?? DATA_PADRAO_DO_DIA[d.semana];
            return (
              <section key={d.semana} className="rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6">
                <h2 className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">
                  {d[idioma]}
                  {datas.length > 0 && <span className="ml-2 text-teal-300">{datas.join(" · ")}</span>}
                </h2>
                {itens.length === 0 ? (
                  <p className="mt-3 text-sm text-mist/70">{tx(idioma, "Horários em breve.", "Times coming soon.", "Horarios próximamente.")}</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {itens.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-white/10 border-l-2 border-l-gold-400 bg-petrol-900/60 p-4"
                      >
                        <p className="text-sm font-medium text-teal-300">
                          {item.horarioInicio}
                          {item.horarioFim ? ` – ${item.horarioFim}` : ""}
                        </p>
                        <p className="mt-1 font-semibold text-white">{item.titulo}</p>
                        <p className="text-sm text-mist/70">
                          {item.professorId && item.professorNome ? (
                            // Liga a aula à bio do professor/DJ na galeria de professores.
                            <Link
                              href={`${item.professorCategoria === "dj" ? "/djs" : "/professores"}/${item.professorId}`}
                              className="font-medium text-gold-300 underline-offset-2 hover:underline"
                            >
                              {item.professorNome}
                            </Link>
                          ) : null}
                          {item.professorNome && item.local ? " · " : ""}
                          {item.local}
                        </p>
                        {item.descricao && <p className="mt-1 text-sm text-mist/60">{item.descricao}</p>}

                        {editando && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-semibold text-gold-300">✎ {t.editarAula}</summary>
                            <FormAula aula={item} dia={item.dia} perfis={perfis} t={t} />
                            <form action={removerAulaPublicaAction} className="mt-3 flex flex-wrap items-center gap-3">
                              <input type="hidden" name="id" value={item.id} />
                              <label className="flex items-center gap-2 text-xs text-mist/80">
                                <input type="checkbox" name="confirmo" required className="h-4 w-4 accent-ember-500" /> {t.confirmo}
                              </label>
                              <button type="submit" className="rounded-full border border-ember-500/60 px-3 py-1 text-xs font-semibold text-ember-400 hover:bg-ember-500/10">
                                {t.remover}
                              </button>
                            </form>
                          </details>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {editando && (
                  <details className="mt-4">
                    <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-400/15 px-4 py-2 text-sm font-semibold text-teal-300 hover:bg-teal-400/25">
                      + {t.adicionar} — {d[idioma]}
                    </summary>
                    <FormAula dia={dataDoDia} perfis={perfis} t={t} />
                  </details>
                )}
              </section>
            );
          })}
        </div>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
