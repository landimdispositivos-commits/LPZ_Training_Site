"use client";

import { tx } from "@/i18n";

import { useState } from "react";
import { useIdioma } from "@/i18n/cliente";
import { BotaoGoogle, SeparadorOu } from "../../_components/botao-google";
import { FormEntrar, FormEsqueci } from "../../_components/form-entrar";
import { Aviso } from "../../_components/form-ui";

// Depois do login todo mundo cai na página principal.
const AREA = "/";

// Sem cadastro público: contas de profissionais só existem por convite.
export function AcessoProfissional({ avisoInicial, googleAtivo }: { avisoInicial?: string; googleAtivo: boolean }) {
  const [esqueci, setEsqueci] = useState(false);
  const idioma = useIdioma();

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-petrol-900/80 p-6 shadow-xl backdrop-blur">
      {avisoInicial && <div className="mb-4"><Aviso tipo="erro">{avisoInicial}</Aviso></div>}
      {/* Google só entra em conta já convidada (sem criar conta nova). */}
      {googleAtivo && !esqueci && (
        <>
          <BotaoGoogle destino={AREA} paginaErro="/profissionais" />
          <p className="mt-3 text-center text-xs text-mist/60">{tx(idioma, "Use o mesmo e-mail em que recebeu o convite.", "Use the same email where you received the invitation.", "Usa el mismo correo en el que recibiste la invitación.")}</p>
          <SeparadorOu />
        </>
      )}
      {esqueci ? (
        <FormEsqueci redirectTo="/profissionais/redefinir-senha" onVoltar={() => setEsqueci(false)} />
      ) : (
        <FormEntrar
          destino={AREA}
          onEsqueci={() => setEsqueci(true)}
          papelExigido="profissional"
          msgPapelRecusado={
            tx(
              idioma,
              "Esta área é exclusiva para professores e DJs convidados pela organização. Se você é congressista, entre pela área de Congressistas.",
              "This area is only for teachers and DJs invited by the organizers. If you are an attendee, sign in through the Attendees area.",
              "Esta área es exclusiva para profesores y DJs invitados por la organización. Si eres participante, entra por el área de Participantes.",
            )
          }
        />
      )}
      <p className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-mist/60">
        {tx(
          idioma,
          "É professor(a) ou DJ do evento e ainda não tem acesso? Peça o convite à organização.",
          "Are you a teacher or DJ at the event and don't have access yet? Ask the organizers for an invitation.",
          "¿Eres profesor(a) o DJ del evento y aún no tienes acceso? Pide la invitación a la organización.",
        )}
      </p>
    </div>
  );
}
