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
  },
);
type Textos = (typeof TEXTOS)["pt"];

function FormCaixa({ pagina, caixa, t }: { pagina: PaginaCaixas; caixa?: Caixa; t: Textos }) {
  const sufixo = caixa?.id ?? "nova";
  type Campo = "titulo" | "tituloEn" | "tituloEs" | "texto" | "textoEn" | "textoEs";
  const campo = (nome: Campo, rotulo: string, longo = false, obrigatorio = false) => (
    <label className="block text-sm text-mist" htmlFor={`${nome}-${sufixo}`}>
      {rotulo}
      {longo ? (
        <textarea
          id={`${nome}-${sufixo}`}
          name={nome}
          rows={5}
          maxLength={5000}
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
}) {
  const t = TEXTOS[idioma];
  const base = PAGINAS_CAIXAS[pagina];
  const editando = editavel && busca.editar === "1";
  const ok = typeof busca.ok === "string" ? t.ok[busca.ok] : undefined;
  const grade = layout === "grade";

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
          <FormCaixa pagina={pagina} t={t} />
        </details>
      )}

      {caixas.length === 0 ? (
        <p className="text-center text-mist/70">{vazio}</p>
      ) : (
        <ul className={grade ? "grid gap-5 sm:grid-cols-2" : "space-y-6"}>
          {caixas.map((c, indice) => {
            const { titulo, texto } = caixaNoIdioma(c, idioma);
            return (
              <li
                key={c.id}
                id={`caixa-${c.id}`}
                className={`relative scroll-mt-24 rounded-2xl border p-6 ${
                  grade ? "border-gold-500/40 bg-petrol-950/70" : "border-white/10 bg-petrol-900/80"
                } ${editando ? "pb-12" : ""}`}
              >
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

                {editando && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gold-300">✎ {t.editarCaixa}</summary>
                    <FormCaixa pagina={pagina} caixa={c} t={t} />
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
                          disabled={direcao === "cima" ? indice === 0 : indice === caixas.length - 1}
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
