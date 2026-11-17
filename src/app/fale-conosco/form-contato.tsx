"use client";

import { useActionState } from "react";
import { traducoes } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { ASSUNTOS, LISTA_ASSUNTOS } from "@/modules/contato/assuntos";
import { Aviso, Campo, classeBotao, classeInput } from "../_components/form-ui";
import { enviarMensagemAction, type ResultadoContato } from "./actions";

const TEXTOS = traducoes(
  {
    nome: "Seu nome",
    email: "Seu e-mail (para respondermos)",
    assunto: "Sobre o que você quer falar?",
    escolha: "Escolha um assunto",
    mensagem: "Sua mensagem",
    enviar: "Enviar mensagem",
    enviando: "Enviando...",
    ok: "Mensagem enviada! Nossa equipe vai responder no seu e-mail.",
    falhou: "Não foi possível enviar agora. Tente de novo em alguns minutos ou fale com a gente pelos contatos ao lado.",
    erroNome: "Informe seu nome.",
    erroEmail: "Informe um e-mail válido.",
    erroAssunto: "Escolha um assunto.",
    erroMensagem: "Escreva sua mensagem (pelo menos 5 caracteres).",
    privacidade: "Usamos seu nome e e-mail só para responder esta mensagem.",
  },
  {
    nome: "Your name",
    email: "Your email (so we can reply)",
    assunto: "What is it about?",
    escolha: "Choose a topic",
    mensagem: "Your message",
    enviar: "Send message",
    enviando: "Sending...",
    ok: "Message sent! Our team will reply to your email.",
    falhou: "We could not send it right now. Try again in a few minutes or reach us through the contacts.",
    erroNome: "Enter your name.",
    erroEmail: "Enter a valid email.",
    erroAssunto: "Choose a topic.",
    erroMensagem: "Write your message (at least 5 characters).",
    privacidade: "We use your name and email only to reply to this message.",
  },
);

export function FormContato({ nome, email }: { nome?: string; email?: string }) {
  const idioma = useIdioma();
  const t = TEXTOS[idioma];
  const [estado, enviar, pendente] = useActionState<ResultadoContato, FormData>(enviarMensagemAction, {});
  const e = estado.erros ?? {};

  if (estado.ok) return <Aviso tipo="ok">{t.ok}</Aviso>;

  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.falhou && <Aviso tipo="erro">{t.falhou}</Aviso>}
      {/* Armadilha para robôs: invisível para pessoas. */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <Campo id="fc-nome" label={t.nome} erro={e.nome ? t.erroNome : undefined}>
        <input id="fc-nome" name="nome" required maxLength={100} defaultValue={nome} autoComplete="name" className={classeInput} aria-invalid={e.nome || undefined} />
      </Campo>
      <Campo id="fc-email" label={t.email} erro={e.email ? t.erroEmail : undefined}>
        <input id="fc-email" name="email" type="email" required maxLength={200} defaultValue={email} autoComplete="email" className={classeInput} aria-invalid={e.email || undefined} />
      </Campo>
      <Campo id="fc-assunto" label={t.assunto} erro={e.assunto ? t.erroAssunto : undefined}>
        <select id="fc-assunto" name="assunto" required defaultValue="" className={classeInput} aria-invalid={e.assunto || undefined}>
          <option value="" disabled>{t.escolha}</option>
          {LISTA_ASSUNTOS.map((a) => (
            <option key={a} value={a}>{ASSUNTOS[a][idioma]}</option>
          ))}
        </select>
      </Campo>
      <Campo id="fc-mensagem" label={t.mensagem} erro={e.mensagem ? t.erroMensagem : undefined}>
        <textarea id="fc-mensagem" name="mensagem" required rows={6} maxLength={4000} className={classeInput} aria-invalid={e.mensagem || undefined} />
      </Campo>
      <p className="text-xs text-mist/60">{t.privacidade}</p>
      <button type="submit" disabled={pendente} className={classeBotao}>
        {pendente ? t.enviando : t.enviar}
      </button>
    </form>
  );
}
