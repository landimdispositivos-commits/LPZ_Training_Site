import type { Metadata } from "next";
import Link from "next/link";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { obterSessao } from "@/modules/auth/sessao";
import { perfisDo } from "@/modules/auth/papeis";
import { obterTextosGaleria, SECOES_GALERIA, textoGaleriaNoIdioma, type TextoCaixaGaleria } from "@/modules/midia/textos-galeria";
import { PaginaPublica } from "../_components/pagina-publica";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";
import { Aviso, classeBotao, classeInput } from "../_components/form-ui";
import { CancelarEdicao } from "../_components/cancelar-edicao";
import { salvarCaixaGaleriaAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Galeria — LPZ Training", "Gallery — LPZ Training", "Galería — LPZ Training") };
}

export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Galeria",
    subtitulo: "Escolha o que você quer ver.",
    abrir: "Abrir",
    editar: "Editar galeria",
    sair: "Concluir edição",
    dica: "Use “Editar” em cada caixa para mudar o título e a descrição.",
    editarCaixa: "Editar",
    tituloCampo: "Título (português)",
    tituloEn: "Título em inglês (opcional)",
    tituloEs: "Título em espanhol (opcional)",
    textoCampo: "Descrição (português)",
    textoEn: "Descrição em inglês (opcional)",
    textoEs: "Descrição em espanhol (opcional)",
    salvar: "Salvar",
    cancelar: "Cancelar",
    ok: "Caixa salva.",
    erro: "Confira os campos: o título é obrigatório.",
  },
  {
    titulo: "Gallery",
    subtitulo: "Choose what you want to see.",
    abrir: "Open",
    editar: "Edit gallery",
    sair: "Finish editing",
    dica: "Use “Edit” on each box to change its title and description.",
    editarCaixa: "Edit",
    tituloCampo: "Title (Portuguese)",
    tituloEn: "Title in English (optional)",
    tituloEs: "Title in Spanish (optional)",
    textoCampo: "Description (Portuguese)",
    textoEn: "Description in English (optional)",
    textoEs: "Description in Spanish (optional)",
    salvar: "Save",
    cancelar: "Cancel",
    ok: "Box saved.",
    erro: "Check the fields: the title is required.",
  },
  {
    titulo: "Galería",
    subtitulo: "Elige lo que quieres ver.",
    abrir: "Abrir",
    editar: "Editar galería",
    sair: "Terminar edición",
    dica: "Usa “Editar” en cada caja para cambiar el título y la descripción.",
    editarCaixa: "Editar",
    tituloCampo: "Título (portugués)",
    tituloEn: "Título en inglés (opcional)",
    tituloEs: "Título en español (opcional)",
    textoCampo: "Descripción (portugués)",
    textoEn: "Descripción en inglés (opcional)",
    textoEs: "Descripción en español (opcional)",
    salvar: "Guardar",
    cancelar: "Cancelar",
    ok: "Caja guardada.",
    erro: "Revisa los campos: el título es obligatorio.",
  },
);

function FormCaixaGaleria({ secao, caixa, t }: { secao: string; caixa: TextoCaixaGaleria; t: (typeof TEXTOS)["pt"] }) {
  type Campo = keyof TextoCaixaGaleria;
  const campo = (nome: Campo, rotulo: string, longo = false, obrigatorio = false) => (
    <label className="block text-sm text-mist" htmlFor={`${nome}-${secao}`}>
      {rotulo}
      {longo ? (
        <textarea id={`${nome}-${secao}`} name={nome} rows={3} maxLength={500} defaultValue={caixa[nome] ?? ""} className={`${classeInput} mt-1`} />
      ) : (
        <input id={`${nome}-${secao}`} name={nome} required={obrigatorio} maxLength={60} defaultValue={caixa[nome] ?? ""} className={`${classeInput} mt-1`} />
      )}
    </label>
  );
  return (
    <form action={salvarCaixaGaleriaAction} className="mt-3 space-y-3 text-left">
      <input type="hidden" name="secao" value={secao} />
      {campo("titulo", t.tituloCampo, false, true)}
      {campo("texto", t.textoCampo, true)}
      {campo("tituloEn", t.tituloEn)}
      {campo("textoEn", t.textoEn, true)}
      {campo("tituloEs", t.tituloEs)}
      {campo("textoEs", t.textoEs, true)}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={`${classeBotao} sm:w-auto`}>{t.salvar}</button>
        <CancelarEdicao rotulo={t.cancelar} />
      </div>
    </form>
  );
}

// Três caixinhas no mesmo estilo das da Loja; cada uma abre sua seção.
// Organização e Mídias mudam título e descrição pelo botão "Editar galeria".
export default async function Page(props: PageProps<"/galeria">) {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const [busca, textos, sessao] = await Promise.all([props.searchParams, obterTextosGaleria(), obterSessao().catch(() => null)]);
  const editavel =
    !!sessao && perfisDo(sessao.user).some((p) => p === "organizador" || p === "acesso_total" || p === "midias");
  const editando = editavel && busca.editar === "1";

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} subtitulo={t.subtitulo}>
        {editavel && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={editando ? "/galeria" : "/galeria?editar=1"}
              className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
            >
              <span aria-hidden="true">{editando ? "✓" : "✎"}</span> {editando ? t.sair : t.editar}
            </Link>
            {editando && <p className="text-xs text-mist/60">{t.dica}</p>}
          </div>
        )}
        {editando && busca.ok && <Aviso tipo="ok">{t.ok}</Aviso>}
        {editando && busca.erro && <Aviso tipo="erro">{t.erro}</Aviso>}

        <ul className="grid gap-4 pt-4 sm:grid-cols-3">
          {SECOES_GALERIA.map((secao) => {
            const { titulo, texto } = textoGaleriaNoIdioma(textos[secao], idioma);
            return (
              <li
                key={secao}
                id={`caixa-${secao}`}
                className="relative flex scroll-mt-24 flex-col rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 text-center transition hover:border-gold-300 hover:shadow-[0_0_24px_rgb(230_181_74/0.25)]"
              >
                <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{titulo}</p>
                {texto && <p className="mt-3 whitespace-pre-line text-sm text-mist/80">{texto}</p>}
                <div className="mt-auto pt-5">
                  <Link
                    href={`/galeria/${secao}`}
                    // Fora do modo edição a caixa inteira é clicável; no modo
                    // edição só o botão, para não atrapalhar o formulário.
                    className={`bg-gold-metal inline-block w-full rounded-full px-6 py-3 font-semibold text-gold-ink transition hover:brightness-110 ${
                      editando ? "" : "after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                    }`}
                  >
                    {t.abrir}
                  </Link>
                </div>
                {editando && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-gold-300">✎ {t.editarCaixa}</summary>
                    <FormCaixaGaleria secao={secao} caixa={textos[secao]} t={t} />
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
