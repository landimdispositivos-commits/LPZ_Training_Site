"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useIdioma } from "@/i18n/cliente";
import { enviarReporteAction, type ResultadoReporte } from "./actions";
import { capturarTela } from "./captura";
import { errosRegistrados, instalarRegistroDeErros } from "./registro-erros";

// Ícone próprio: celular com um balão de alerta e uma mão tocando a tela.
export function IconeReportar({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* celular */}
      <rect x="11" y="3" width="15" height="25" rx="3" />
      <path d="M16.5 10h6M16.5 13.5h6M16.5 17h4" />
      {/* balão com alerta */}
      <path d="M3.5 12.5a5.5 5.5 0 1 1 3.2 5l-2.9 1.6.8-3.1a5.5 5.5 0 0 1-1.1-3.5Z" fill="currentColor" fillOpacity="0.12" />
      <path d="M9 9.2l2.3 4H6.7Z" />
      <path d="M9 10.6v1" />
      {/* mão tocando */}
      <path d="M19 30v-3.2l-2.4-3a1.2 1.2 0 0 1 1.8-1.5L20 24v-6.5a1.2 1.2 0 0 1 2.4 0V22l3.6.6a1.8 1.8 0 0 1 1.5 2l-.6 3.8a1.8 1.8 0 0 1-1.8 1.6Z" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}

const TEXTOS = {
  botao: ["Reportar problema", "Report a problem", "Reportar un problema"],
  titulo: ["Reportar um problema", "Report a problem", "Reportar un problema"],
  descricao: ["O que aconteceu? (opcional)", "What happened? (optional)", "¿Qué pasó? (opcional)"],
  aviso: [
    "Vamos enviar à organização um print desta tela e informações técnicas (página, navegador e erros). O print pode mostrar seus dados: usamos só para corrigir o problema. Senhas nunca são incluídas.",
    "We will send the organizers a screenshot of this screen and technical details (page, browser and errors). The screenshot may show your data: we only use it to fix the problem. Passwords are never included.",
    "Enviaremos a la organización una captura de esta pantalla e información técnica (página, navegador y errores). La captura puede mostrar tus datos: solo la usamos para corregir el problema. Las contraseñas nunca se incluyen.",
  ],
  enviar: ["Enviar", "Send", "Enviar"],
  enviando: ["Enviando…", "Sending…", "Enviando…"],
  cancelar: ["Cancelar", "Cancel", "Cancelar"],
  ok: ["Obrigado! Recebemos o seu reporte.", "Thank you! We received your report.", "¡Gracias! Recibimos tu reporte."],
  limite: ["Muitos reportes em pouco tempo. Tente de novo em alguns minutos.", "Too many reports. Please try again in a few minutes.", "Demasiados reportes. Inténtalo de nuevo en unos minutos."],
  falha: ["Não foi possível enviar agora. Tente de novo ou use o Fale conosco.", "Could not send right now. Try again or use Contact us.", "No se pudo enviar ahora. Inténtalo de nuevo o usa Contáctanos."],
} as const;

export function BotaoReportar() {
  const idioma = useIdioma();
  const i = idioma === "en" ? 1 : idioma === "es" ? 2 : 0;
  const t = (k: keyof typeof TEXTOS) => TEXTOS[k][i];
  const dialogo = useRef<HTMLDialogElement>(null);
  const [descricao, setDescricao] = useState("");
  const [estado, acao] = useActionState<ResultadoReporte, FormData>(enviarReporteAction, {});
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => instalarRegistroDeErros(), []);
  useEffect(() => {
    if (estado.ok) setAviso(t("ok"));
    else if (estado.erro === "limite") setAviso(t("limite"));
    else if (estado.erro) setAviso(t("falha"));
    if (estado.ok || estado.erro) {
      const id = setTimeout(() => setAviso(null), 6000);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  function enviar() {
    dialogo.current?.close();
    iniciar(async () => {
      // Espera o diálogo sumir para ele não sair no print.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const print = await capturarTela();
      const form = new FormData();
      form.set("descricao", descricao);
      form.set("pagina", location.pathname);
      form.set("navegador", navigator.userAgent);
      form.set("tela", `${innerWidth}x${innerHeight}`);
      form.set("idioma", idioma);
      form.set("erros", JSON.stringify(errosRegistrados()));
      if (print) form.set("print", new File([print], "print.jpg", { type: "image/jpeg" }));
      acao(form);
      setDescricao("");
    });
  }

  return (
    <div data-reportar-ignorar="">
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        aria-label={t("botao")}
        title={t("botao")}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/70 bg-petrol-900/95 text-gold-300 shadow-lg backdrop-blur hover:bg-petrol-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
      >
        <IconeReportar className="h-7 w-7" />
      </button>

      {(aviso || pendente) && (
        <p role="status" className="fixed bottom-20 right-4 z-40 max-w-xs rounded-xl border border-teal-400/50 bg-petrol-900/95 px-4 py-3 text-sm text-white shadow-lg">
          {pendente ? t("enviando") : aviso}
        </p>
      )}

      <dialog
        ref={dialogo}
        aria-labelledby="reportar-titulo"
        className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-gold-500/50 bg-petrol-900 p-6 text-mist backdrop:bg-black/60"
      >
        <h2 id="reportar-titulo" className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.15em] text-gold-300">
          <IconeReportar className="h-6 w-6" /> {t("titulo")}
        </h2>
        <label htmlFor="reportar-descricao" className="mt-4 block text-sm text-white">{t("descricao")}</label>
        <textarea
          id="reportar-descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          maxLength={2000}
          rows={4}
          className="mt-1 w-full rounded-lg border border-white/15 bg-petrol-950/60 px-3 py-2 text-white focus:border-teal-400 focus:outline-none"
        />
        <p className="mt-3 text-xs text-mist/70">{t("aviso")}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => dialogo.current?.close()} className="rounded-full px-4 py-2 text-sm text-mist/80 hover:text-white">
            {t("cancelar")}
          </button>
          <button type="button" onClick={enviar} className="bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
            {t("enviar")}
          </button>
        </div>
      </dialog>
    </div>
  );
}

