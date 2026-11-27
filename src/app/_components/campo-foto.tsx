"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { tx } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";

// Foto de perfil: aparece no lugar do "bonequinho" no topo do site.
export function CampoFoto({ foto, nome }: { foto: string | null; nome: string }) {
  const idioma = useIdioma();
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const falha = tx(idioma, "Não foi possível salvar a foto. Tente de novo.", "Could not save the photo. Please try again.", "No se pudo guardar la foto. Inténtalo de nuevo.");

  async function enviar(arquivo: File) {
    setOcupado(true);
    setMensagem(null);
    try {
      const form = new FormData();
      form.set("foto", arquivo);
      const r = await fetch("/perfil/foto", { method: "POST", body: form });
      const dados = (await r.json().catch(() => ({}))) as { ok?: boolean; erro?: string };
      if (dados.ok) {
        setMensagem({ tipo: "ok", texto: tx(idioma, "Pronto! Foto atualizada.", "Done! Photo updated.", "¡Listo! Foto actualizada.") });
        router.refresh();
      } else if (dados.erro === "imagem") {
        setMensagem({
          tipo: "erro",
          texto: tx(idioma, "Use uma foto JPG, PNG ou WebP de até 8 MB.", "Use a JPG, PNG or WebP photo up to 8 MB.", "Usa una foto JPG, PNG o WebP de hasta 8 MB."),
        });
      } else {
        setMensagem({ tipo: "erro", texto: falha });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: falha });
    } finally {
      setOcupado(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function remover() {
    setOcupado(true);
    setMensagem(null);
    try {
      const r = await fetch("/perfil/foto", { method: "DELETE" });
      if (r.ok) {
        setMensagem({ tipo: "ok", texto: tx(idioma, "Foto removida.", "Photo removed.", "Foto eliminada.") });
        router.refresh();
      } else {
        setMensagem({ tipo: "erro", texto: falha });
      }
    } catch {
      setMensagem({ tipo: "erro", texto: falha });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">
        {tx(idioma, "Sua foto", "Your photo", "Tu foto")}
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold-500/60 bg-petrol-950/60 text-2xl font-semibold text-gold-300">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt={nome} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{nome.trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={entrada}
            id="f-foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={ocupado}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void enviar(arquivo);
            }}
          />
          <label
            htmlFor="f-foto"
            className="bg-gold-metal inline-flex h-10 cursor-pointer items-center rounded-full px-5 text-sm font-semibold text-gold-ink hover:brightness-110 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-300"
          >
            {ocupado
              ? tx(idioma, "Enviando…", "Uploading…", "Enviando…")
              : foto
                ? tx(idioma, "Trocar foto", "Change photo", "Cambiar foto")
                : tx(idioma, "Escolher foto", "Choose photo", "Elegir foto")}
          </label>
          {foto && (
            <button
              type="button"
              onClick={remover}
              disabled={ocupado}
              className="h-10 rounded-full px-4 text-sm text-mist/80 hover:text-white disabled:opacity-50"
            >
              {tx(idioma, "Remover", "Remove", "Quitar")}
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-mist/60">
        {tx(
          idioma,
          "Aparece no topo do site, no lugar do ícone. JPG, PNG ou WebP, até 8 MB. É opcional.",
          "Shown at the top of the site instead of the icon. JPG, PNG or WebP, up to 8 MB. Optional.",
          "Aparece en la parte superior del sitio, en lugar del ícono. JPG, PNG o WebP, hasta 8 MB. Es opcional.",
        )}
      </p>
      {mensagem && (
        <p role={mensagem.tipo === "erro" ? "alert" : "status"} className={`mt-2 text-sm ${mensagem.tipo === "erro" ? "text-ember-400" : "text-teal-300"}`}>
          {mensagem.texto}
        </p>
      )}
    </section>
  );
}
