import Link from "next/link";
import { traducoes, type Idioma } from "@/i18n";
import { caixaNoIdioma, PAGINAS_CAIXAS, type Caixa, type PaginaCaixas } from "@/modules/caixas";
import { Aviso, classeBotao, classeInput } from "../form-ui";
import { CancelarEdicao } from "../cancelar-edicao";
import { criarCaixaAction, moverCaixaAction, removerCaixaAction, salvarCaixaAction } from "./actions";

// Caixas de texto de uma página (Serviços, Quem somos) com o modo edição da
// organização: botão Editar, adicionar, editar título/texto, remover e ordenar.
const TEXTOS = traducoes(
  {
    sair: "Concluir edição",
    dica: "Use ◀ ▶ para mudar a ordem e “Editar” em cada caixa para mudar título e texto.",
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
    ok: { criado: "Caixa adicionada.", salvo: "Caixa salva.", removido: "Caixa removida." } as Record<string, string>,
    erro: "Confira os campos: o título é obrigatório.",
    erroConfirmar: "Marque a confirmação para remover.",
    ocultaCampo: "Oculta — só a organização vê (desmarque para publicar)",
    temPaginaCampo: "Esta caixa tem página própria (abre ao clicar na caixa)",
    conteudoPagina: "Conteúdo da página própria",
    detalhe: "Texto da página (português) — em branco usa o texto da caixa",
    detalheEn: "Texto da página em inglês (opcional)",
    detalheEs: "Texto da página em espanhol (opcional)",
    adicionarOculta: "+ Adicionar página oculta",
    dicaOculta: "Cria uma caixa com página própria, oculta até você desmarcar “Oculta”.",
    seloOculta: "Oculta — só a organização vê",
    saibaMais: "Saiba mais",
    abrirPagina: "Abrir a página",
  },
  {
    sair: "Finish editing",
    dica: "Use ◀ ▶ to change the order and “Edit” on each box to change its title and text.",
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
    ok: { criado: "Box added.", salvo: "Box saved.", removido: "Box removed." } as Record<string, string>,
    erro: "Check the fields: the title is required.",
    erroConfirmar: "Tick the confirmation to remove.",
    ocultaCampo: "Hidden — only the organizers see it (untick to publish)",
    temPaginaCampo: "This box has its own page (opens when the box is clicked)",
    conteudoPagina: "Content of its own page",
    detalhe: "Page text (Portuguese) — blank uses the box text",
    detalheEn: "Page text in English (optional)",
    detalheEs: "Page text in Spanish (optional)",
    adicionarOculta: "+ Add hidden page",
    dicaOculta: "Creates a box with its own page, hidden until you untick “Hidden”.",
    seloOculta: "Hidden — only the organizers see it",
    saibaMais: "Learn more",
    abrirPagina: "Open the page",
  },
  {
    sair: "Terminar edición",
    dica: "Usa ◀ ▶ para cambiar el orden y “Editar” en cada caja para cambiar título y texto.",
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
    ok: { criado: "Caja añadida.", salvo: "Caja guardada.", removido: "Caja eliminada." } as Record<string, string>,
    erro: "Revisa los campos: el título es obligatorio.",
    erroConfirmar: "Marca la confirmación para eliminar.",
    ocultaCampo: "Oculta — solo la organización la ve (desmarca para publicar)",
    temPaginaCampo: "Esta caja tiene página propia (se abre al hacer clic en la caja)",
    conteudoPagina: "Contenido de la página propia",
    detalhe: "Texto de la página (portugués) — en blanco usa el texto de la caja",
    detalheEn: "Texto de la página en inglés (opcional)",
    detalheEs: "Texto de la página en español (opcional)",
    adicionarOculta: "+ Añadir página oculta",
    dicaOculta: "Crea una caja con página propia, oculta hasta que desmarques “Oculta”.",
    seloOculta: "Oculta — solo la organización la ve",
    saibaMais: "Saber más",
    abrirPagina: "Abrir la página",
  },
);
type Textos = (typeof TEXTOS)["pt"];

function FormCaixa({
  pagina,
  caixa,
  t,
  comSubpagina = false,
  novaOculta = false,
}: {
  pagina: PaginaCaixas;
  caixa?: Caixa;
  t: Textos;
  comSubpagina?: boolean;
  novaOculta?: boolean;
}) {
  const sufixo = caixa?.id ?? (novaOculta ? "nova-oculta" : "nova");
  type Campo = "titulo" | "tituloEn" | "tituloEs" | "texto" | "textoEn" | "textoEs" | "detalhe" | "detalheEn" | "detalheEs";
  const campo = (nome: Campo, rotulo: string, longo = false, obrigatorio = false) => (
    <label className="block text-sm text-mist" htmlFor={`${nome}-${sufixo}`}>
      {rotulo}
      {longo ? (
        <textarea
          id={`${nome}-${sufixo}`}
          name={nome}
          rows={nome.startsWith("detalhe") ? 10 : 5}
          maxLength={nome.startsWith("detalhe") ? 20000 : 5000}
          defaultValue={caixa?.[nome] ?? ""}
          className={`${classeInput} mt-1`}
        />
      ) : (
        <input
          id={`${nome}-${sufixo}`}
          name={nome}
          required={obrigatorio}
          maxLength={80}
          defaultValue={caixa?.[nome] ?? ""}
          className={`${classeInput} mt-1`}
        />
      )}
    </label>
  );
  return (
    <form action={caixa ? salvarCaixaAction : criarCaixaAction} className="mt-3 space-y-3 text-left">
      <input type="hidden" name="pagina" value={pagina} />
      {caixa && <input type="hidden" name="id" value={caixa.id} />}
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
      <label className="flex items-center gap-2 text-sm text-mist/90">
        <input type="checkbox" name="oculta" defaultChecked={caixa?.oculta ?? novaOculta} className="h-4 w-4 accent-teal-400" /> {t.ocultaCampo}
      </label>
      {comSubpagina && (
        <>
          <label className="flex items-center gap-2 text-sm text-mist/90">
            <input type="checkbox" name="temPagina" defaultChecked={caixa?.temPagina ?? novaOculta} className="h-4 w-4 accent-teal-400" /> {t.temPaginaCampo}
          </label>
          <details className="rounded-xl border border-white/10 p-3" open={novaOculta || !!caixa?.temPagina}>
            <summary className="cursor-pointer text-sm font-semibold text-teal-300">{t.conteudoPagina}</summary>
            <div className="mt-3 space-y-3">
              {campo("detalhe", t.detalhe, true)}
              {campo("detalheEn", t.detalheEn, true)}
              {campo("detalheEs", t.detalheEs, true)}
            </div>
          </details>
        </>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={`${classeBotao} sm:w-auto`}>{caixa ? t.salvar : t.criar}</button>
        <CancelarEdicao rotulo={t.cancelar} />
      </div>
    </form>
  );
}

export function CaixasEditaveis({
  pagina,
  caixas,
  idioma,
  editavel,
  busca,
  rotuloEditar,
  rotuloAdicionar,
  vazio,
  layout = "grade",
  comSubpagina = false,
}: {
  pagina: PaginaCaixas;
  caixas: Caixa[];
  idioma: Idioma;
  editavel: boolean;
  busca: Record<string, string | string[] | undefined>;
  rotuloEditar: string;
  rotuloAdicionar: string;
  vazio: string;
  layout?: "grade" | "lista";
  comSubpagina?: boolean; // caixas podem ter página própria (Serviços)
}) {
  const t = TEXTOS[idioma];
  const base = PAGINAS_CAIXAS[pagina];
  const editando = editavel && busca.editar === "1";
  const ok = typeof busca.ok === "string" ? t.ok[busca.ok] : undefined;
  const grade = layout === "grade";
  // Caixas ocultas só aparecem para quem edita.
  const visiveis = editavel ? caixas : caixas.filter((c) => !c.oculta);

  return (
    <div className="space-y-6">
      {editavel && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={editando ? base : `${base}?editar=1`}
            className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
          >
            <span aria-hidden="true">{editando ? "✓" : "✎"}</span> {editando ? t.sair : rotuloEditar}
          </Link>
          {editando && <p className="text-xs text-mist/60">{t.dica}</p>}
        </div>
      )}
      {editando && ok && <Aviso tipo="ok">{ok}</Aviso>}
      {editando && busca.erro && <Aviso tipo="erro">{busca.erro === "confirmar" ? t.erroConfirmar : t.erro}</Aviso>}

      {editando && (
        <details id="nova-caixa" className="scroll-mt-24 rounded-2xl border border-white/10 bg-petrol-900/80 p-5" open={caixas.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold text-gold-300">{rotuloAdicionar}</summary>
          <FormCaixa pagina={pagina} t={t} comSubpagina={comSubpagina} />
        </details>
      )}
      {editando && comSubpagina && (
        <details id="nova-pagina-oculta" className="scroll-mt-24 rounded-2xl border border-teal-400/30 bg-petrol-900/80 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-teal-300">{t.adicionarOculta}</summary>
          <p className="mt-2 text-xs text-mist/60">{t.dicaOculta}</p>
          <FormCaixa pagina={pagina} t={t} comSubpagina novaOculta />
        </details>
      )}

      {visiveis.length === 0 ? (
        <p className="text-center text-mist/70">{vazio}</p>
      ) : (
        <ul className={grade ? "grid gap-5 sm:grid-cols-2" : "space-y-6"}>
          {visiveis.map((c, indice) => {
            const { titulo, texto } = caixaNoIdioma(c, idioma);
            return (
              <li
                key={c.id}
                id={`caixa-${c.id}`}
                className={`relative scroll-mt-24 rounded-2xl border p-6 ${
                  grade ? "border-gold-500/40 bg-petrol-950/70" : "border-white/10 bg-petrol-900/80"
                } ${editando ? "pb-12" : ""} ${c.oculta ? "border-dashed opacity-80" : ""} ${
                  comSubpagina && c.temPagina && !editando ? "transition hover:border-gold-300 hover:shadow-[0_0_24px_rgb(230_181_74/0.25)]" : ""
                }`}
              >
                {c.oculta && (
                  <p className="mb-2 inline-block rounded-full bg-ember-500/15 px-3 py-0.5 text-xs font-semibold text-ember-400">{t.seloOculta}</p>
                )}
                <h2
                  className={
                    grade
                      ? "font-display text-sm uppercase tracking-[0.15em] text-gold-300"
                      : "text-sm font-semibold uppercase tracking-wider text-teal-300"
                  }
                >
                  {titulo}
                </h2>
                {texto && <p className="mt-3 whitespace-pre-line leading-relaxed text-mist/90">{texto}</p>}
                {comSubpagina && c.temPagina && (
                  <Link
                    href={`${base}/${c.id}`}
                    // Fora do modo edição a caixa inteira é clicável.
                    className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-300 hover:underline ${
                      editando ? "" : "after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                    }`}
                  >
                    {editando ? t.abrirPagina : t.saibaMais} <span aria-hidden="true">→</span>
                  </Link>
                )}

                {editando && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gold-300">✎ {t.editarCaixa}</summary>
                    <FormCaixa pagina={pagina} caixa={c} t={t} comSubpagina={comSubpagina} />
                    <form action={removerCaixaAction} className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
                      <input type="hidden" name="pagina" value={pagina} />
                      <input type="hidden" name="id" value={c.id} />
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
                      <form key={direcao} action={moverCaixaAction}>
                        <input type="hidden" name="pagina" value={pagina} />
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="direcao" value={direcao} />
                        <button
                          type="submit"
                          disabled={direcao === "cima" ? indice === 0 : indice === visiveis.length - 1}
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
    </div>
  );
}
