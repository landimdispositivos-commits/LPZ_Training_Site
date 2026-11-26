"use client";

import { useActionState } from "react";
import { tx } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { salvarNascimentoAction, type ResultadoNascimento } from "./nascimento-actions";
import { BotaoSalvar } from "./botao-salvar";

// Data de nascimento (opcional) de profissionais, professores, DJs e organização.
export function CampoNascimento({ dataNascimento }: { dataNascimento: string | null }) {
  const idioma = useIdioma();
  const [estado, acao] = useActionState<ResultadoNascimento, FormData>(salvarNascimentoAction, {});
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">
        {tx(idioma, "Data de nascimento", "Date of birth", "Fecha de nacimiento")}
      </h2>
      <form action={acao} className="mt-4 flex flex-wrap items-end gap-3">
        <label htmlFor="f-nascimento" className="sr-only">
          {tx(idioma, "Data de nascimento", "Date of birth", "Fecha de nacimiento")}
        </label>
        <input
          id="f-nascimento"
          name="dataNascimento"
          type="date"
          min="1915-01-01"
          max={hoje}
          defaultValue={dataNascimento ?? ""}
          autoComplete="bday"
          aria-describedby="f-nascimento-dica"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-petrol-950/60 px-3 py-2 text-white focus:border-teal-400 focus:outline-none [color-scheme:dark]"
        />
        <BotaoSalvar />
      </form>
      <p id="f-nascimento-dica" className="mt-2 text-xs text-mist/60">
        {tx(
          idioma,
          "Opcional. Usada só pela organização do evento (não aparece no site). Deixe em branco para apagar.",
          "Optional. Used only by the event organizers (not shown on the site). Leave blank to delete.",
          "Opcional. La usa solo la organización del evento (no aparece en el sitio). Déjala en blanco para borrarla.",
        )}
      </p>
      {estado.ok && (
        <p role="status" className="mt-2 text-sm text-teal-300">
          {tx(idioma, "Pronto! Atualizado.", "Done! Updated.", "¡Listo! Actualizado.")}
        </p>
      )}
      {estado.erro && (
        <p role="alert" className="mt-2 text-sm text-ember-400">
          {estado.erro === "data"
            ? tx(idioma, "Confira a data de nascimento.", "Please check the date of birth.", "Revisa la fecha de nacimiento.")
            : tx(idioma, "Sua sessão expirou. Entre de novo.", "Your session expired. Please sign in again.", "Tu sesión expiró. Inicia sesión de nuevo.")}
        </p>
      )}
    </section>
  );
}
