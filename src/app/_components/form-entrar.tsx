"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/modules/auth/auth-client";
import { areaDoPapel } from "@/modules/auth/papeis";
import { Aviso, Campo, classeBotao, classeInput, traduzirErro } from "./form-ui";

// Login único por e-mail/senha. Depois de entrar, cada pessoa vai para a área
// do SEU perfil (definido pela organização em Permissões). Contas com
// verificação em duas etapas (organização/portaria) pedem o código aqui mesmo.
// `papelExigido` é só experiência de uso (sai na hora e avisa); quem garante o
// acesso é a checagem de papel no servidor, em cada página.
export function FormEntrar({
  destino,
  onEsqueci,
  papelExigido,
  msgPapelRecusado,
  painelProps,
}: {
  destino: string;
  onEsqueci: () => void;
  papelExigido?: "congressista" | "profissional";
  msgPapelRecusado?: string;
  painelProps?: React.ComponentProps<"form">;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [etapa, setEtapa] = useState<"senha" | "codigo" | "recuperacao">("senha");

  function irParaArea(papel: string | null | undefined) {
    router.push(papelExigido ? destino : areaDoPapel(papel));
    router.refresh();
  }

  async function enviarCodigo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const codigo = String(new FormData(e.currentTarget).get("codigo") ?? "").trim();
    setEnviando(true);
    setErro(undefined);
    const { data, error } =
      etapa === "codigo"
        ? await authClient.twoFactor.verifyTotp({ code: codigo.replace(/\s/g, "") })
        : await authClient.twoFactor.verifyBackupCode({ code: codigo });
    setEnviando(false);
    if (error) {
      setErro(
        error.code === "INVALID_CODE" || error.code === "INVALID_BACKUP_CODE"
          ? "Código inválido."
          : error.status === 401
            ? "Tempo esgotado. Entre com e-mail e senha de novo."
            : traduzirErro(error),
      );
      if (error.status === 401) setEtapa("senha");
      return;
    }
    irParaArea(data?.user.papel);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(undefined);
    const { data, error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("senha")),
      callbackURL: destino,
    });
    if (error) {
      setErro(traduzirErro(error));
      setEnviando(false);
      return;
    }
    // Conta com duas etapas (organização/portaria): pede o código aqui mesmo.
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setEnviando(false);
      setEtapa("codigo");
      return;
    }
    if (papelExigido && data?.user.papel !== papelExigido) {
      await authClient.signOut();
      setErro(msgPapelRecusado ?? "Acesso restrito.");
      setEnviando(false);
      return;
    }
    irParaArea(data && "user" in data ? data.user.papel : undefined);
  }

  if (etapa !== "senha") {
    return (
      <form key={etapa} onSubmit={enviarCodigo} className="space-y-4">
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <p className="text-sm text-mist/90">
          {etapa === "codigo"
            ? "Sua conta usa verificação em duas etapas. Abra o app autenticador no celular e digite o código de 6 dígitos do LPZ Training."
            : "Digite um dos códigos de recuperação que você guardou ao ativar as duas etapas. Cada código funciona uma vez."}
        </p>
        <Campo id="login-codigo" label={etapa === "codigo" ? "Código de 6 dígitos" : "Código de recuperação"}>
          <input
            id="login-codigo"
            name="codigo"
            required
            autoFocus
            autoComplete="one-time-code"
            inputMode={etapa === "codigo" ? "numeric" : "text"}
            maxLength={etapa === "codigo" ? 7 : 32}
            className={`${classeInput} text-center text-lg tracking-[0.3em]`}
          />
        </Campo>
        <button type="submit" disabled={enviando} className={classeBotao}>
          {enviando ? "Verificando..." : "Entrar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setErro(undefined);
            setEtapa(etapa === "codigo" ? "recuperacao" : "codigo");
          }}
          className="block w-full text-center text-sm text-teal-300 hover:underline"
        >
          {etapa === "codigo" ? "Perdi o acesso ao app — usar código de recuperação" : "Usar o código do app"}
        </button>
      </form>
    );
  }

  return (
    <form {...painelProps} onSubmit={enviar} className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo id="login-email" label="E-mail">
        <input id="login-email" name="email" type="email" autoComplete="email" required className={classeInput} />
      </Campo>
      <Campo id="login-senha" label="Senha">
        <input id="login-senha" name="senha" type="password" autoComplete="current-password" required className={classeInput} />
      </Campo>
      <button type="submit" disabled={enviando} className={classeBotao}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      <button type="button" onClick={onEsqueci} className="block w-full text-center text-sm text-teal-300 hover:underline">
        Esqueci minha senha
      </button>
    </form>
  );
}

export function FormEsqueci({ redirectTo, onVoltar }: { redirectTo: string; onVoltar: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(undefined);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo,
    });
    setEnviando(false);
    if (error) {
      setErro(traduzirErro(error));
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="space-y-4">
      {enviado ? (
        // Mesma resposta exista ou não a conta — não revela quem é cadastrado.
        <Aviso tipo="ok">
          Se houver uma conta com esse e-mail, você vai receber um link para redefinir a senha. O link vale por 1 hora.
        </Aviso>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <p className="text-sm text-mist/80">Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}
          <Campo id="esqueci-email" label="E-mail">
            <input id="esqueci-email" name="email" type="email" autoComplete="email" required className={classeInput} />
          </Campo>
          <button type="submit" disabled={enviando} className={classeBotao}>
            {enviando ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}
      <button type="button" onClick={onVoltar} className="block w-full text-center text-sm text-teal-300 hover:underline">
        Voltar para entrar
      </button>
    </div>
  );
}
