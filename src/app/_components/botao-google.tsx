"use client";

import { useState } from "react";
import { traducoes } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { authClient } from "@/modules/auth/auth-client";
import { Aviso } from "./form-ui";

const TEXTOS = traducoes(
  {
    configurando: "O login com o Google está sendo configurado pela organização. Por enquanto, entre com e-mail e senha.",
    limite: "Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.",
    falhou: "Não foi possível abrir o login do Google. Tente de novo.",
    abrindo: "Abrindo o Google...",
    entrar: "Entrar com o Google",
    ou: "ou",
  },
  {
    configurando: "Google sign-in is being set up by the organizers. For now, sign in with email and password.",
    limite: "Too many attempts in a short time. Wait a minute and try again.",
    falhou: "We could not open Google sign-in. Please try again.",
    abrindo: "Opening Google...",
    entrar: "Sign in with Google",
    ou: "or",
  },
  {
    configurando: "El inicio de sesión con Google lo está configurando la organización. Por ahora, entra con correo y contraseña.",
    limite: "Demasiados intentos en poco tiempo. Espera un minuto e inténtalo de nuevo.",
    falhou: "No pudimos abrir el inicio de sesión de Google. Inténtalo de nuevo.",
    abrindo: "Abriendo Google...",
    entrar: "Entrar con Google",
    ou: "o",
  },
);

// Botão "Entrar com Google" no padrão visual exigido pelo Google
// (fundo branco, logotipo "G" oficial, texto "Entrar com o Google").
// criarConta: só a área de Congressistas cria conta nova pelo Google; nas
// demais áreas ele apenas entra em contas que já existem.
export function BotaoGoogle({
  destino,
  paginaErro,
  criarConta = false,
  ativo = true,
}: {
  destino: string;
  paginaErro: string;
  criarConta?: boolean;
  // false = credenciais do Google ainda não configuradas no servidor (.env).
  ativo?: boolean;
}) {
  const t = TEXTOS[useIdioma()];
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string>();

  async function entrar() {
    if (!ativo) {
      setErro(t.configurando);
      return;
    }
    setIndo(true);
    setErro(undefined);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: destino,
      errorCallbackURL: paginaErro,
      requestSignUp: criarConta,
    });
    // Sucesso = o navegador já está indo para o Google.
    if (error) {
      setErro(
        error.status === 429
          ? t.limite
          : t.falhou,
      );
      setIndo(false);
    }
  }

  return (
    <div className="space-y-3">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <button
        type="button"
        onClick={entrar}
        disabled={indo}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-6 py-3 font-medium text-[#1f1f1f] transition hover:bg-[#f2f2f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300 disabled:cursor-wait disabled:opacity-70"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {indo ? t.abrindo : t.entrar}
      </button>
    </div>
  );
}

// Separador "ou" entre o Google e o formulário de e-mail/senha.
export function SeparadorOu() {
  const t = TEXTOS[useIdioma()];
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-mist/50" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      {t.ou}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
