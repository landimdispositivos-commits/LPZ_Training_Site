import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { servicos } from "@/db/schema";
import { traducoes, tx, type Idioma } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { obterSessao } from "@/modules/auth/sessao";
import { ehGestor } from "@/modules/auth/papeis";
import { SiteHeader } from "../_components/site-header";
import { RodapeSite } from "../_components/rodape-site";
import { PaginaPublica } from "../_components/pagina-publica";
import { Aviso, classeBotao, classeInput } from "../_components/form-ui";
import { CancelarEdicao } from "../_components/cancelar-edicao";
import { criarServicoAction, moverServicoAction, removerServicoAction, salvarServicoAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Serviços — LPZ Training", "Services — LPZ Training", "Servicios — LPZ Training") };
}

export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Serviços",
    subtitulo: "O que o LPZ Training oferece para marcas, escolas e parceiros durante o evento.",
    vazio: "Serviços em breve.",
    contato: "Quer contratar ou saber mais?",
    faleConosco: "Fale conosco",
    editar: "Editar serviços",
    sair: "Concluir edição",
    dica: "Use ◀ ▶ para mudar a ordem e “Editar” em cada caixa para mudar o texto.",
    adicionar: "+ Adicionar serviço",
    editarCaixa: "Editar",
    tituloCampo: "Título (português)",
    tituloEn: "Título em inglês (opcional)",
    tituloEs: "Título em espanhol (opcional)",
    textoCampo: "Texto (português)",
    textoEn: "Texto em inglês (opcional)",
    textoEs: "Texto em espanhol (opcional)",
    criar: "Adicionar",
    salvar: "Salvar",
    cancelar: "Cancelar",
    confirmo: "Confirmo que quero remover esta caixa",
    remover: "Remover",
    moverAntes: "Mover para antes",
    moverDepois: "Mover para depois",
    ok: { criado: "Serviço adicionado.", salvo: "Serviço salvo.", removido: "Serviço removido." } as Record<string, string>,
    erro: "Confira os campos: o título é obrigatório.",
    erroConfirmar: "Marque a confirmação para remover.",
  },
  {
    titulo: "Services",
    subtitulo: "What LPZ Training offers brands, schools and partners during the event.",
    vazio: "Services coming soon.",
    contato: "Want to book or learn more?",
    faleConosco: "Contact us",
    editar: "Edit services",
    sair: "Finish editing",
    dica: "Use ◀ ▶ to change the order and “Edit” on each box to change the text.",
    adicionar: "+ Add service",
    editarCaixa: "Edit",
    tituloCampo: "Title (Portuguese)",
    tituloEn: "Title in English (optional)",
    tituloEs: "Title in Spanish (optional)",
    textoCampo: "Text (Portuguese)",
    textoEn: "Text in English (optional)",
    textoEs: "Text in Spanish (optional)",
    criar: "Add",
    salvar: "Save",
    cancelar: "Cancel",
    confirmo: "I confirm I want to remove this box",
    remover: "Remove",
    moverAntes: "Move before",
    moverDepois: "Move after",
    ok: { criado: "Service added.", salvo: "Service saved.", removido: "Service removed." } as Record<string, string>,
    erro: "Check the fields: the title is required.",
    erroConfirmar: "Tick the confirmation to remove.",
  },
  {
    titulo: "Servicios",
    subtitulo: "Lo que LPZ Training ofrece a marcas, escuelas y aliados durante el evento.",
    vazio: "Servicios próximamente.",
    contato: "¿Quieres contratar o saber más?",
    faleConosco: "Contáctanos",
    editar: "Editar servicios",
    sair: "Terminar edición",
    dica: "Usa ◀ ▶ para cambiar el orden y “Editar” en cada caja para cambiar el texto.",
    adicionar: "+ Añadir servicio",
    editarCaixa: "Editar",
    tituloCampo: "Título (portugués)",
    tituloEn: "Título en inglés (opcional)",
    tituloEs: "Título en español (opcional)",
    textoCampo: "Texto (portugués)",
    textoEn: "Texto en inglés (opcional)",
    textoEs: "Texto en español (opcional)",
    criar: "Añadir",
    salvar: "Guardar",
    cancelar: "Cancelar",
    confirmo: "Confirmo que quiero eliminar esta caja",
    remover: "Eliminar",
    moverAntes: "Mover antes",
    moverDepois: "Mover después",
    ok: { criado: "Servicio añadido.", salvo: "Servicio guardado.", removido: "Servicio eliminado." } as Record<string, string>,
    erro: "Revisa los campos: el título es obligatorio.",
    erroConfirmar: "Marca la confirmación para eliminar.",
  },
);

type Servico = typeof servicos.$inferSelect;
type Textos = (typeof TEXTOS)["pt"];

function noIdioma(s: Servico, idioma: Idioma) {
  if (idioma === "en") return { titulo: s.tituloEn || s.titulo, texto: s.textoEn || s.texto };
  if (idioma === "es") return { titulo: s.tituloEs || s.titulo, texto: s.textoEs || s.texto };
  return { titulo: s.titulo, texto: s.texto };
}

function FormServico({ servico, t }: { servico?: Servico; t: Textos }) {
  const sufixo = servico?.id ?? "novo";
  const campo = (nome: keyof Servico, rotulo: string, longo = false, obrigatorio = false) => (
    <label className="block text-sm text-mist" htmlFor={`${nome}-${sufixo}`}>
      {rotulo}
      {longo ? (
        <textarea
          id={`${nome}-${sufixo}`}
          name={nome}
          rows={4}
          maxLength={3000}
          defaultValue={(servico?.[nome] as string | null) ?? ""}
          className={`${classeInput} mt-1`}
        />
      ) : (
        <input
          id={`${nome}-${sufixo}`}
          name={nome}
          required={obrigatorio}
          maxLength={80}
          defaultValue={(servico?.[nome] as string | null) ?? ""}
          className={`${classeInput} mt-1`}
        />
      )}
    </label>
  );
  return (
    <form action={servico ? salvarServicoAction : criarServicoAction} className="mt-3 space-y-3 text-left">
      {servico && <input type="hidden" name="id" value={servico.id} />}
      {campo("titulo", t.tituloCampo, false, true)}
      {campo("texto", t.textoCampo, true)}
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("tituloEn", t.tituloEn)}
        {campo("tituloEs", t.tituloEs)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {campo("textoEn", t.textoEn, true)}
        {campo("textoEs", t.textoEs, true)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={`${classeBotao} sm:w-auto`}>{servico ? t.salvar : t.criar}</button>
        <CancelarEdicao rotulo={t.cancelar} />
      </div>
    </form>
  );
}

export default async function Page(props: PageProps<"/servicos">) {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const busca = await props.searchParams;
  const [lista, sessao] = await Promise.all([
    db.select().from(servicos).orderBy(asc(servicos.ordem), asc(servicos.criadoEm)),
    obterSessao().catch(() => null),
  ]);
  const editavel = !!sessao && ehGestor(sessao.user.papel);
  const editando = editavel && busca.editar === "1";
  const ok = typeof busca.ok === "string" ? t.ok[busca.ok] : undefined;

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} subtitulo={t.subtitulo} largura="max-w-5xl">
        {editavel && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={editando ? "/servicos" : "/servicos?editar=1"}
              className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
            >
              <span aria-hidden="true">{editando ? "✓" : "✎"}</span> {editando ? t.sair : t.editar}
            </Link>
            {editando && <p className="text-xs text-mist/60">{t.dica}</p>}
          </div>
        )}
        {editando && ok && <Aviso tipo="ok">{ok}</Aviso>}
        {editando && busca.erro && <Aviso tipo="erro">{busca.erro === "confirmar" ? t.erroConfirmar : t.erro}</Aviso>}

        {editando && (
          <details id="novo-servico" className="scroll-mt-24 rounded-2xl border border-white/10 bg-petrol-900/80 p-5" open={lista.length === 0}>
            <summary className="cursor-pointer text-sm font-semibold text-gold-300">{t.adicionar}</summary>
            <FormServico t={t} />
          </details>
        )}

        {lista.length === 0 ? (
          <p className="text-center text-mist/70">{t.vazio}</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {lista.map((s, indice) => {
              const { titulo, texto } = noIdioma(s, idioma);
              return (
                <li
                  key={s.id}
                  id={`servico-${s.id}`}
                  className={`relative scroll-mt-24 rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 ${editando ? "pb-12" : ""}`}
                >
                  <h2 className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{titulo}</h2>
                  {texto && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist/85">{texto}</p>}

                  {editando && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-gold-300">✎ {t.editarCaixa}</summary>
                      <FormServico servico={s} t={t} />
                      <form action={removerServicoAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
                        <input type="hidden" name="id" value={s.id} />
                        <label className="flex items-center gap-2 text-xs text-mist/80">
                          <input type="checkbox" name="confirmo" required className="h-4 w-4 accent-ember-500" /> {t.confirmo}
                        </label>
                        <button type="submit" className="rounded-full border border-ember-500/60 px-3 py-1 text-xs font-semibold text-ember-400 hover:bg-ember-500/10">
                          {t.remover}
                        </button>
                      </form>
                    </details>
                  )}

                  {editando && (
                    <div className="absolute bottom-2.5 right-3 z-10 flex gap-1">
                      {(["cima", "baixo"] as const).map((direcao) => (
                        <form key={direcao} action={moverServicoAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="direcao" value={direcao} />
                          <button
                            type="submit"
                            disabled={direcao === "cima" ? indice === 0 : indice === lista.length - 1}
                            aria-label={`${direcao === "cima" ? t.moverAntes : t.moverDepois}: ${titulo}`}
                            title={direcao === "cima" ? t.moverAntes : t.moverDepois}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] leading-none text-gold-300 hover:bg-gold-400/20 disabled:opacity-25"
                          >
                            {direcao === "cima" ? "◀" : "▶"}
                          </button>
                        </form>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-center text-sm text-mist/80">
          {t.contato}{" "}
          <Link href="/fale-conosco" className="font-semibold text-teal-300 hover:underline">
            {t.faleConosco}
          </Link>
        </p>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
