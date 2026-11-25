"use client";

import { useActionState, useState } from "react";
import { tx } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { MAX_APELIDO } from "@/modules/perfil/apelido";
import { salvarApelidoAction, type ResultadoApelido } from "./apelido-actions";
import { BotaoSalvar } from "./botao-salvar";

// "Como prefere ser chamado(a)?" — aparece no topo do site no lugar do primeiro nome.
export function CampoApelido({ apelido, primeiroNome }: { apelido: string | null; primeiroNome: string }) {
  const idioma = useIdioma();
  const [valor, setValor] = useState(apelido ?? "");
  const [estado, acao] = useActionState<ResultadoApelido, FormData>(salvarApelidoAction, {});
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">
        {tx(idioma, "Como prefere ser chamado(a)?", "What should we call you?", "¿Cómo prefieres que te llamemos?")}
      </h2>
      <form action={acao} className="mt-4 flex flex-wrap items-end gap-3">
        <label htmlFor="f-apelido" className="sr-only">
          {tx(idioma, "Apelido", "Nickname", "Apodo")}
        </label>
        <input
          id="f-apelido"
          name="apelido"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          maxLength={MAX_APELIDO}
          placeholder={primeiroNome}
          autoComplete="nickname"
          aria-describedby="f-apelido-dica"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-petrol-950/60 px-3 py-2 text-white placeholder:text-mist/40 focus:border-teal-400 focus:outline-none"
        />
        <BotaoSalvar />
      </form>
      <p id="f-apelido-dica" className="mt-2 text-xs text-mist/60">
        {tx(
          idioma,
          "É o nome que aparece no topo do site. Deixe em branco para usar seu primeiro nome.",
          "This is the name shown at the top of the site. Leave blank to use your first name.",
          "Es el nombre que aparece en la parte superior del sitio. Déjalo en blanco para usar tu primer nombre.",
        )}
      </p>
      {estado.ok && (
        <p role="status" className="mt-2 text-sm text-teal-300">
          {tx(idioma, "Pronto! Atualizado.", "Done! Updated.", "¡Listo! Actualizado.")}
        </p>
      )}
      {estado.erro && (
        <p role="alert" className="mt-2 text-sm text-ember-400">
          {estado.erro === "tamanho"
            ? tx(idioma, `Use até ${MAX_APELIDO} caracteres.`, `Use up to ${MAX_APELIDO} characters.`, `Usa hasta ${MAX_APELIDO} caracteres.`)
            : tx(idioma, "Sua sessão expirou. Entre de novo.", "Your session expired. Please sign in again.", "Tu sesión expiró. Inicia sesión de nuevo.")}
        </p>
      )}
    </section>
  );
}
