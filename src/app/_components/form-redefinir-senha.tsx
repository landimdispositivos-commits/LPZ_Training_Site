"use client";

import Link from "next/link";
import { useState } from "react";
import { traducoes } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { authClient } from "@/modules/auth/auth-client";
import { SENHA_MAX, SENHA_MIN } from "@/modules/auth/cadastro";
import { Aviso, Campo, classeBotao, classeInput, traduzirErro } from "./form-ui";

const TEXTOS = traducoes(
  {
    conviteInvalido: "Link de convite inválido ou expirado. Peça um novo convite à organização.",
    linkInvalido: "Link inválido ou expirado. Peça um novo em “Esqueci minha senha”.",
    voltar: "Voltar para entrar",
    definida: "Senha definida! Agora é só entrar com seu e-mail e a nova senha.",
    alterada: "Senha alterada. Por segurança, você foi desconectado de todos os aparelhos.",
    entrar: "Entrar",
    curta: (min: number) => `A senha precisa ter pelo menos ${min} caracteres.`,
    naoConferem: "As senhas não conferem.",
    nova: "Nova senha",
    minimo: (min: number) => `Mínimo de ${min} caracteres.`,
    confirme: "Confirme a nova senha",
    salvando: "Salvando...",
    definir: "Definir senha",
    salvar: "Salvar nova senha",
  },
  {
    conviteInvalido: "Invalid or expired invitation link. Ask the organizers for a new invitation.",
    linkInvalido: "Invalid or expired link. Request a new one in “Forgot my password”.",
    voltar: "Back to sign in",
    definida: "Password set! Now just sign in with your email and the new password.",
    alterada: "Password changed. For security, you have been signed out of all devices.",
    entrar: "Sign in",
    curta: (min: number) => `The password must have at least ${min} characters.`,
    naoConferem: "The passwords do not match.",
    nova: "New password",
    minimo: (min: number) => `At least ${min} characters.`,
    confirme: "Confirm the new password",
    salvando: "Saving...",
    definir: "Set password",
    salvar: "Save new password",
  },
  {
    conviteInvalido: "Enlace de invitación inválido o vencido. Pide una nueva invitación a la organización.",
    linkInvalido: "Enlace inválido o vencido. Pide uno nuevo en “Olvidé mi contraseña”.",
    voltar: "Volver a entrar",
    definida: "¡Contraseña creada! Ahora solo entra con tu correo y la nueva contraseña.",
    alterada: "Contraseña cambiada. Por seguridad, cerramos tu sesión en todos los dispositivos.",
    entrar: "Entrar",
    curta: (min: number) => `La contraseña debe tener al menos ${min} caracteres.`,
    naoConferem: "Las contraseñas no coinciden.",
    nova: "Nueva contraseña",
    minimo: (min: number) => `Mínimo de ${min} caracteres.`,
    confirme: "Confirma la nueva contraseña",
    salvando: "Guardando...",
    definir: "Crear contraseña",
    salvar: "Guardar nueva contraseña",
  },
);

// modo "definir": primeira senha de profissional convidado; "redefinir": esqueci a senha.
export function FormRedefinirSenha({
  token,
  urlEntrar,
  modo = "redefinir",
}: {
  token?: string;
  urlEntrar: string;
  modo?: "definir" | "redefinir";
}) {
  const idioma = useIdioma();
  const t = TEXTOS[idioma];
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pronto, setPronto] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <Aviso tipo="erro">
          {modo === "definir"
            ? t.conviteInvalido
            : t.linkInvalido}
        </Aviso>
        <Link href={urlEntrar} className="text-sm text-teal-300 hover:underline">{t.voltar}</Link>
      </div>
    );
  }

  if (pronto) {
    return (
      <div className="space-y-4 text-center">
        <Aviso tipo="ok">
          {modo === "definir"
            ? t.definida
            : t.alterada}
        </Aviso>
        <Link href={urlEntrar} className={`${classeBotao} inline-block`}>{t.entrar}</Link>
      </div>
    );
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const senha = String(form.get("senha") ?? "");
    if (senha.length < SENHA_MIN) return setErro(t.curta(SENHA_MIN));
    if (senha !== form.get("confirmacao")) return setErro(t.naoConferem);

    setEnviando(true);
    setErro(undefined);
    const { error } = await authClient.resetPassword({ newPassword: senha, token });
    setEnviando(false);
    if (error) return setErro(traduzirErro(error, idioma));
    setPronto(true);
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo id="nova-senha" label={t.nova} dica={t.minimo(SENHA_MIN)}>
        <input id="nova-senha" name="senha" type="password" autoComplete="new-password" maxLength={SENHA_MAX} required className={classeInput} />
      </Campo>
      <Campo id="nova-confirmacao" label={t.confirme}>
        <input id="nova-confirmacao" name="confirmacao" type="password" autoComplete="new-password" maxLength={SENHA_MAX} required className={classeInput} />
      </Campo>
      <button type="submit" disabled={enviando} className={classeBotao}>
        {enviando ? t.salvando : modo === "definir" ? t.definir : t.salvar}
      </button>
    </form>
  );
}
