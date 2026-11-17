"use client";

import { useState } from "react";
import { BotaoGoogle, SeparadorOu } from "../../_components/botao-google";
import { FormEntrar, FormEsqueci } from "../../_components/form-entrar";
import { Aviso } from "../../_components/form-ui";

const AREA = "/profissionais/minha-area";

// Sem cadastro público: contas de profissionais só existem por convite.
export function AcessoProfissional({ avisoInicial, googleAtivo }: { avisoInicial?: string; googleAtivo: boolean }) {
  const [esqueci, setEsqueci] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-petrol-900/80 p-6 shadow-xl backdrop-blur">
      {avisoInicial && <div className="mb-4"><Aviso tipo="erro">{avisoInicial}</Aviso></div>}
      {/* Google só entra em conta já convidada (sem criar conta nova). */}
      {googleAtivo && !esqueci && (
        <>
          <BotaoGoogle destino={AREA} paginaErro="/profissionais" />
          <p className="mt-3 text-center text-xs text-mist/60">Use o mesmo e-mail em que recebeu o convite.</p>
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
          msgPapelRecusado="Esta área é exclusiva para professores e DJs convidados pela organização. Se você é congressista, entre pela área de Congressistas."
        />
      )}
      <p className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-mist/60">
        É professor(a) ou DJ do evento e ainda não tem acesso? Peça o convite à organização.
      </p>
    </div>
  );
}
