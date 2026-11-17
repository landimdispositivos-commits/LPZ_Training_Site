// Peças visuais compartilhadas pelos formulários de congressista.
import type { Idioma } from "@/i18n";

export const classeInput =
  "w-full rounded-lg border border-white/15 bg-petrol-950/70 px-3 py-2.5 text-white placeholder:text-mist/40 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/40 aria-[invalid=true]:border-ember-400";

export const classeBotao =
  "bg-gold-metal w-full rounded-full px-6 py-3 font-semibold text-gold-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300 disabled:cursor-wait disabled:opacity-60";

export function Campo({
  id,
  label,
  erro,
  dica,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-mist">
        {label}
      </label>
      {children}
      {dica && !erro && <p id={`${id}-dica`} className="mt-1 text-xs text-mist/60">{dica}</p>}
      {erro && <p id={`${id}-erro`} className="mt-1 text-sm text-ember-400">{erro}</p>}
    </div>
  );
}

export function Aviso({ tipo, children }: { tipo: "erro" | "ok"; children: React.ReactNode }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={
        tipo === "erro"
          ? "rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm text-mist"
          : "rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm text-mist"
      }
    >
      {children}
    </div>
  );
}

// Mensagens do Better Auth vêm em inglês; traduzimos pelos códigos.
const ERROS_EN: Record<string, string> = {
  generico: "Something went wrong. Please try again.",
  limite: "Too many attempts in a short time. Wait a minute and try again.",
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  EMAIL_NOT_VERIFIED:
    "Your email has not been confirmed yet. We sent you a new confirmation link — check your inbox (and spam folder).",
  PASSWORD_TOO_SHORT: "The password must have at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  INVALID_EMAIL: "Invalid email.",
  INVALID_TOKEN: "Invalid or expired link. Request a new one.",
};

export function traduzirErro(
  erro: { code?: string; status?: number; message?: string } | null | undefined,
  idioma: Idioma = "pt",
) {
  if (idioma === "en") {
    if (!erro) return ERROS_EN.generico;
    if (erro.status === 429) return ERROS_EN.limite;
    // Validações do nosso servidor chegam em português.
    if (erro.code === "LPZ_VALIDACAO" && erro.message) return erro.message;
    return ERROS_EN[erro.code ?? ""] ?? ERROS_EN.generico;
  }
  if (!erro) return "Algo deu errado. Tente novamente.";
  if (erro.status === 429) return "Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.";
  switch (erro.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "E-mail ou senha incorretos.";
    case "EMAIL_NOT_VERIFIED":
      return "Seu e-mail ainda não foi confirmado. Enviamos um novo link de confirmação — confira sua caixa de entrada (e o spam).";
    case "PASSWORD_TOO_SHORT":
      return "A senha precisa ter pelo menos 8 caracteres.";
    case "PASSWORD_TOO_LONG":
      return "Senha longa demais.";
    case "INVALID_EMAIL":
      return "E-mail inválido.";
    case "INVALID_TOKEN":
      return "Link inválido ou expirado. Peça um novo.";
    // Validações do nosso hook no servidor — mensagem já em português.
    case "LPZ_VALIDACAO":
      if (erro.message) return erro.message;
  }
  return "Algo deu errado. Tente novamente.";
}
