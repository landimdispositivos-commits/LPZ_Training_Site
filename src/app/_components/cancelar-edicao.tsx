"use client";

// Botão "Cancelar" dos formulários do modo edição: limpa o que foi digitado e
// fecha a caixinha (<details>) em que o formulário está, sem salvar nada.
// Se o formulário não estiver numa caixinha, volta para `voltarPara`.
export function CancelarEdicao({ rotulo, voltarPara }: { rotulo: string; voltarPara?: string }) {
  return (
    <button
      type="button"
      onClick={(evento) => {
        const botao = evento.currentTarget;
        botao.form?.reset();
        const caixa = botao.closest("details");
        if (caixa) {
          caixa.open = false;
          caixa.querySelector("summary")?.focus();
        } else if (voltarPara) {
          window.location.assign(voltarPara);
        }
      }}
      className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-mist/80 hover:bg-white/10"
    >
      {rotulo}
    </button>
  );
}
