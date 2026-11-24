import Link from "next/link";
import { traducoes, type Idioma } from "@/i18n";
import { ehGestor } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { linkInstagram, ROTA_CATEGORIA, type Categoria } from "@/modules/perfis";
import type { professores } from "@/db/schema";
import { Aviso, Campo, classeBotao, classeInput } from "./form-ui";
import { moverPerfilAction, salvarPerfilAction } from "./perfis-actions";

// Caixinhas e página de bio dos casais de professores e dos DJs.
type Perfil = typeof professores.$inferSelect;

export const TEXTOS_PERFIS = traducoes(
  {
    verBio: "Bio",
    moverAntes: "Mover para antes",
    moverDepois: "Mover para depois",
    instagramEmBreve: "Instagram em breve",
    bioEmBreve: "Bio em breve.",
    editar: "Editar",
    editarBio: "Editar bio",
    voltar: (c: Categoria): string => (c === "dj" ? "Voltar para os DJs" : "Voltar para os professores"),
    salvo: "Operação realizada com sucesso!",
    erro: "Confira os campos: nome obrigatório e Instagram só com letras, números, ponto e _.",
    editando: "Editar perfil (só a organização vê)",
    nome: "Nome",
    bio: "Bio em português",
    bioEn: "Bio em inglês (opcional — sem ela, aparece a bio em português)",
    instagram: "Instagram",
    salvar: "Salvar",
    foto: "Foto",
    fotoDica: "JPG, PNG ou WebP, até 8 MB. Deixe em branco para manter a foto atual.",
    removerFoto: "Remover a foto atual",
    fotoDe: (n: string) => `Foto de ${n}`,
  },
  {
    verBio: "Bio",
    moverAntes: "Move earlier",
    moverDepois: "Move later",
    instagramEmBreve: "Instagram coming soon",
    bioEmBreve: "Bio coming soon.",
    editar: "Edit",
    editarBio: "Edit bio",
    voltar: (c: Categoria): string => (c === "dj" ? "Back to DJs" : "Back to teachers"),
    salvo: "Saved successfully!",
    erro: "Check the fields: name is required and Instagram only allows letters, numbers, dot and _.",
    editando: "Edit profile (organizers only)",
    nome: "Name",
    bio: "Bio in Portuguese",
    bioEn: "Bio in English (optional — without it, the Portuguese bio is shown)",
    instagram: "Instagram",
    salvar: "Save",
    foto: "Photo",
    fotoDica: "JPG, PNG or WebP, up to 8 MB. Leave blank to keep the current photo.",
    removerFoto: "Remove current photo",
    fotoDe: (n: string) => `Photo of ${n}`,
  },
  {
    verBio: "Bio",
    moverAntes: "Mover antes",
    moverDepois: "Mover después",
    instagramEmBreve: "Instagram próximamente",
    bioEmBreve: "Bio próximamente.",
    editar: "Editar",
    editarBio: "Editar bio",
    voltar: (c: Categoria): string => (c === "dj" ? "Volver a los DJs" : "Volver a los profesores"),
    salvo: "¡Guardado con éxito!",
    erro: "Revisa los campos: el nombre es obligatorio e Instagram solo admite letras, números, punto y _.",
    editando: "Editar perfil (solo la organización lo ve)",
    nome: "Nombre",
    bio: "Bio en portugués",
    bioEn: "Bio en inglés (opcional — sin ella, se muestra la bio en portugués)",
    instagram: "Instagram",
    salvar: "Guardar",
    foto: "Foto",
    fotoDica: "JPG, PNG o WebP, hasta 8 MB. Déjalo en blanco para mantener la foto actual.",
    removerFoto: "Quitar la foto actual",
    fotoDe: (n: string) => `Foto de ${n}`,
  },
);

export async function podeEditar() {
  const sessao = await obterSessao().catch(() => null);
  return ehGestor(sessao?.user.papel);
}

function bioDoIdioma(p: Perfil, idioma: Idioma) {
  // Espanhol usa a bio em português (idioma próximo) até haver uma bio própria.
  return idioma === "en" ? (p.bioEn ?? p.bio) : p.bio;
}

function IconeCamera() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Aparece em todos os perfis; sem @ cadastrado, fica apagado até preencherem.
export function BotaoInstagram({
  instagram,
  className = "",
  textoEmBreve,
}: {
  instagram: string | null;
  className?: string;
  textoEmBreve: string;
}) {
  const url = linkInstagram(instagram);
  if (!url) {
    return (
      <span
        title={textoEmBreve}
        aria-label={textoEmBreve}
        className={`relative z-10 inline-flex cursor-default items-center gap-2 rounded-full border border-teal-300/25 px-4 py-1.5 text-sm font-medium text-teal-300/40 ${className}`}
      >
        <IconeCamera />
        Instagram
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative z-10 inline-flex items-center gap-2 rounded-full border border-teal-300/60 px-4 py-1.5 text-sm font-medium text-teal-300 hover:bg-teal-300/10 ${className}`}
    >
      <IconeCamera />
      Instagram
    </a>
  );
}

function IconeCaneta() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function Foto({ perfil, idioma, grande = false }: { perfil: Perfil; idioma: Idioma; grande?: boolean }) {
  const tamanho = grande ? "h-40 w-40" : "h-24 w-24";
  if (perfil.fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={perfil.fotoUrl}
        alt={TEXTOS_PERFIS[idioma].fotoDe(perfil.nome)}
        loading="lazy"
        className={`${tamanho} rounded-full border-2 border-gold-400/70 object-cover`}
      />
    );
  }
  const iniciais = perfil.nome
    .split(/\s+/)
    .filter((p) => /^[A-Za-zÀ-ú]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden="true"
      className={`${tamanho} flex items-center justify-center rounded-full border-2 border-gold-400/40 bg-petrol-800 font-display text-xl text-gold-300`}
    >
      {iniciais || "LPZ"}
    </div>
  );
}

// Grade de caixinhas. A caixinha inteira leva à bio (onde fica o Instagram);
// a canetinha (só organização) fica por cima, no canto inferior esquerdo.
export function GradePerfis({
  perfis,
  categoria,
  idioma,
  editavel,
}: {
  perfis: Perfil[];
  categoria: Categoria;
  idioma: Idioma;
  editavel: boolean;
}) {
  const t = TEXTOS_PERFIS[idioma];
  const base = ROTA_CATEGORIA[categoria];
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {perfis.map((p, indice) => (
        <li
          key={p.id}
          id={`perfil-${p.id}`}
          className="relative flex scroll-mt-24 flex-col items-center rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6 pb-16 text-center transition hover:border-gold-300 hover:shadow-[0_0_24px_rgb(230_181_74/0.25)]"
        >
          <Foto perfil={p} idioma={idioma} />
          <Link
            href={`${base}/${p.id}`}
            className="mt-4 font-display text-sm uppercase tracking-[0.15em] text-gold-300 after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            {p.nome}
          </Link>
          {/* Rodapé da caixinha: canetinha (só organização) à esquerda, "Bio" à direita. */}
          {editavel && (
            <Link
              href={`${base}/${p.id}?editar=1#editar`}
              aria-label={`${t.editar}: ${p.nome}`}
              title={t.editar}
              className="absolute bottom-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gold-400/15 text-gold-300 hover:bg-gold-400/30"
            >
              <IconeCaneta />
            </Link>
          )}
          <span className={`absolute right-5 text-sm font-semibold text-teal-300 ${editavel ? "bottom-10" : "bottom-4"}`}>{t.verBio}</span>
          {editavel && (
            // Setinhas delicadas para ordenar (só organização), no canto inferior direito.
            <div className="absolute bottom-2.5 right-3 z-10 flex gap-1">
              {(["cima", "baixo"] as const).map((direcao) => {
                const desabilitado = direcao === "cima" ? indice === 0 : indice === perfis.length - 1;
                return (
                  <form key={direcao} action={moverPerfilAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="categoria" value={categoria} />
                    <input type="hidden" name="direcao" value={direcao} />
                    <button
                      type="submit"
                      disabled={desabilitado}
                      aria-label={`${direcao === "cima" ? t.moverAntes : t.moverDepois}: ${p.nome}`}
                      title={direcao === "cima" ? t.moverAntes : t.moverDepois}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] leading-none text-gold-300 hover:bg-gold-400/20 disabled:opacity-25"
                    >
                      {direcao === "cima" ? "◀" : "▶"}
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// Página da bio de um perfil; com ?editar=1 a organização vê o formulário.
export function DetalhePerfil({
  perfil,
  categoria,
  idioma,
  editavel,
  editar,
  ok,
  erro,
}: {
  perfil: Perfil;
  categoria: Categoria;
  idioma: Idioma;
  editavel: boolean;
  editar: boolean;
  ok: boolean;
  erro: boolean;
}) {
  const t = TEXTOS_PERFIS[idioma];
  const base = ROTA_CATEGORIA[categoria];
  const bio = bioDoIdioma(perfil, idioma);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {ok && <Aviso tipo="ok">{t.salvo}</Aviso>}
      {erro && <Aviso tipo="erro">{t.erro}</Aviso>}
      <article className="relative flex flex-col items-center rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-8 pb-16 text-center">
        {editavel && !editar && (
          <Link
            href={`${base}/${perfil.id}?editar=1#editar`}
            className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
          >
            <IconeCaneta />
            {t.editarBio}
          </Link>
        )}
        <Foto perfil={perfil} idioma={idioma} grande />
        <h1 className="mt-5 font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">{perfil.nome}</h1>
        <p className="mt-5 whitespace-pre-line text-left text-mist/90 sm:text-center">{bio ?? t.bioEmBreve}</p>
        <BotaoInstagram instagram={perfil.instagram} textoEmBreve={t.instagramEmBreve} className="mt-6" />
      </article>

      {editavel && editar && (
        <form id="editar" action={salvarPerfilAction} className="scroll-mt-24 space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t.editando}</h2>
          <input type="hidden" name="id" value={perfil.id} />
          <input type="hidden" name="categoria" value={categoria} />
          <Campo id="perfil-nome" label={t.nome}>
            <input id="perfil-nome" name="nome" required maxLength={100} defaultValue={perfil.nome} className={classeInput} />
          </Campo>
          <Campo id="perfil-bio" label={t.bio}>
            <textarea id="perfil-bio" name="bio" rows={6} maxLength={2000} defaultValue={perfil.bio ?? ""} className={classeInput} />
          </Campo>
          <Campo id="perfil-bio-en" label={t.bioEn}>
            <textarea id="perfil-bio-en" name="bioEn" rows={6} maxLength={2000} defaultValue={perfil.bioEn ?? ""} className={classeInput} />
          </Campo>
          <Campo id="perfil-insta" label={t.instagram}>
            <input id="perfil-insta" name="instagram" maxLength={31} defaultValue={perfil.instagram ?? ""} placeholder="@perfil" className={classeInput} />
          </Campo>
          <Campo id="perfil-foto" label={t.foto} dica={t.fotoDica}>
            <input
              id="perfil-foto"
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-mist/80 file:mr-3 file:rounded-full file:border-0 file:bg-gold-400/20 file:px-4 file:py-2 file:font-semibold file:text-gold-300 hover:file:bg-gold-400/30"
            />
          </Campo>
          {perfil.fotoUrl && (
            <label className="flex items-center gap-2 text-sm text-mist/80">
              <input type="checkbox" name="removerFoto" className="h-4 w-4 accent-teal-400" /> {t.removerFoto}
            </label>
          )}
          <button type="submit" className={classeBotao}>{t.salvar}</button>
        </form>
      )}

      <p className="text-center">
        <Link href={base} className="text-sm text-teal-300 hover:underline">{t.voltar(categoria)}</Link>
      </p>
    </div>
  );
}
