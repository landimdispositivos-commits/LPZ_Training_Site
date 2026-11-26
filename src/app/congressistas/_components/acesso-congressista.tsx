"use client";

import Link from "next/link";
import { useState } from "react";
import { traducoes } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { authClient } from "@/modules/auth/auth-client";
import { SENHA_MAX, SENHA_MIN } from "@/modules/auth/cadastro";
import { BotaoGoogle, SeparadorOu } from "../../_components/botao-google";
import { FormEntrar, FormEsqueci } from "../../_components/form-entrar";
import { Aviso, Campo, classeBotao, classeInput, traduzirErro } from "../../_components/form-ui";

type Aba = "entrar" | "criar" | "esqueci";


const TEXTOS = traducoes(
  {
    entrar: "Entrar",
    criarConta: "Criar conta",
    acesso: "Acesso do congressista",
    primeiroGoogle: "No primeiro acesso pelo Google, pediremos seus dados e o aceite da Política de Privacidade.",
    erroNome: "Informe seu nome completo.",
    erroEmail: "Informe seu e-mail.",
    erroSenha: (min: number) => `A senha precisa ter pelo menos ${min} caracteres.`,
    erroConfirmacao: "As senhas não conferem.",
    erroAceite: "É preciso aceitar a Política de Privacidade.",
    quaseLa: "Quase lá!",
    enviamosA: "Enviamos um link de confirmação para",
    abraEmail: "Abra o e-mail e clique em",
    confirmarEmail: "Confirmar e-mail",
    depoisCompleta: "— em seguida você completa seus dados.",
    naoChegou: "Não chegou? Confira o spam. O link vale por 24 horas.",
    nome: "Nome completo",
    email: "E-mail",
    senha: "Senha",
    minimo: (min: number) => `Mínimo de ${min} caracteres.`,
    confirme: "Confirme a senha",
    liAceito: "Li e aceito a",
    politica: "Política de Privacidade",
    criando: "Criando conta...",
    depoisConfirmar: "Depois de confirmar o e-mail, você completa seus dados pessoais.",
  },
  {
    entrar: "Sign in",
    criarConta: "Create account",
    acesso: "Attendee access",
    primeiroGoogle: "On your first Google sign-in, we will ask for your details and your acceptance of the Privacy Policy.",
    erroNome: "Enter your full name.",
    erroEmail: "Enter your email.",
    erroSenha: (min: number) => `The password must have at least ${min} characters.`,
    erroConfirmacao: "The passwords do not match.",
    erroAceite: "You need to accept the Privacy Policy.",
    quaseLa: "Almost there!",
    enviamosA: "We sent a confirmation link to",
    abraEmail: "Open the email and click",
    confirmarEmail: "Confirm email",
    depoisCompleta: "— then you will fill in your details.",
    naoChegou: "Didn't get it? Check your spam folder. The link is valid for 24 hours.",
    nome: "Full name",
    email: "Email",
    senha: "Password",
    minimo: (min: number) => `At least ${min} characters.`,
    confirme: "Confirm password",
    liAceito: "I have read and accept the",
    politica: "Privacy Policy",
    criando: "Creating account...",
    depoisConfirmar: "After confirming your email, you will fill in your personal details.",
  },
  {
    entrar: "Entrar",
    criarConta: "Crear cuenta",
    acesso: "Acceso del participante",
    primeiroGoogle: "En tu primer acceso con Google, te pediremos tus datos y la aceptación de la Política de Privacidad.",
    erroNome: "Ingresa tu nombre completo.",
    erroEmail: "Ingresa tu correo.",
    erroSenha: (min: number) => `La contraseña debe tener al menos ${min} caracteres.`,
    erroConfirmacao: "Las contraseñas no coinciden.",
    erroAceite: "Debes aceptar la Política de Privacidad.",
    quaseLa: "¡Ya casi!",
    enviamosA: "Enviamos un enlace de confirmación a",
    abraEmail: "Abre el correo y haz clic en",
    confirmarEmail: "Confirmar correo",
    depoisCompleta: "— después completas tus datos.",
    naoChegou: "¿No llegó? Revisa el spam. El enlace vale por 24 horas.",
    nome: "Nombre completo",
    email: "Correo",
    senha: "Contraseña",
    minimo: (min: number) => `Mínimo de ${min} caracteres.`,
    confirme: "Confirma la contraseña",
    liAceito: "Leí y acepto la",
    politica: "Política de Privacidad",
    criando: "Creando cuenta...",
    depoisConfirmar: "Después de confirmar el correo, completas tus datos personales.",
  },
);

export function AcessoCongressista({
  avisoInicial,
  googleAtivo,
  proximo,
}: {
  avisoInicial?: string;
  googleAtivo: boolean;
  // Veio de uma caixinha de ingresso: depois de entrar, volta para a compra.
  proximo?: string;
}) {
  // Depois do login: página principal (ou de volta para a compra, se veio do "Comprar").
  const destino = proximo ?? "/";
  const [aba, setAba] = useState<Aba>("entrar");
  const t = TEXTOS[useIdioma()];

  const abas: { id: Aba; label: string }[] = [
    { id: "entrar", label: t.entrar },
    { id: "criar", label: t.criarConta },
  ];

  return (
    <div className="mx-auto w-full max-w-md">
      <div role="tablist" aria-label={t.acesso} className="grid grid-cols-2 rounded-full border border-white/15 p-1">
        {abas.map((a) => (
          <button
            key={a.id}
            role="tab"
            type="button"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls={`painel-${a.id}`}
            onClick={() => setAba(a.id)}
            className={
              aba === a.id
                ? "bg-gold-metal rounded-full py-2 text-sm font-semibold text-gold-ink"
                : "rounded-full py-2 text-sm font-medium text-mist/80 hover:text-gold-300"
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-petrol-900/80 p-6 shadow-xl backdrop-blur">
        {avisoInicial && <div className="mb-4"><Aviso tipo="erro">{avisoInicial}</Aviso></div>}

        {/* Google serve tanto para entrar quanto para criar conta. */}
        {aba !== "esqueci" && (
          <>
            <BotaoGoogle
              destino={destino}
              paginaErro={proximo ? `/congressistas?proximo=${encodeURIComponent(proximo)}` : "/congressistas"}
              criarConta
              ativo={googleAtivo}
            />
            {aba === "criar" && (
              <p className="mt-3 text-center text-xs text-mist/60">
                {t.primeiroGoogle}
              </p>
            )}
            <SeparadorOu />
          </>
        )}

        {aba === "entrar" && (
          <FormEntrar
            destino={destino}
            destinoCongressista={proximo}
            onEsqueci={() => setAba("esqueci")}
            painelProps={{ id: "painel-entrar", role: "tabpanel", "aria-labelledby": "aba-entrar" }}
          />
        )}
        {aba === "criar" && <FormCriarConta destino={destino} />}
        {aba === "esqueci" && (
          <FormEsqueci redirectTo="/congressistas/redefinir-senha" onVoltar={() => setAba("entrar")} />
        )}
      </div>
    </div>
  );
}

type ErrosCadastro = Partial<Record<"nome" | "email" | "senha" | "confirmacao" | "aceite", string>>;

// Cadastro curto: os dados pessoais são pedidos depois, na ficha
// (/congressistas/completar-cadastro) — a mesma de quem entra pelo Google.
function FormCriarConta({ destino }: { destino: string }) {
  const idioma = useIdioma();
  const t = TEXTOS[idioma];
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string>();
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [emailEnviado, setEmailEnviado] = useState<string>();

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nome = String(form.get("nome") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const senha = String(form.get("senha") ?? "");
    const confirmacao = String(form.get("confirmacao") ?? "");
    const aceite = form.get("aceite") === "on";

    const novosErros: ErrosCadastro = {};
    if (nome.length < 2) novosErros.nome = t.erroNome;
    if (!email) novosErros.email = t.erroEmail;
    if (senha.length < SENHA_MIN) novosErros.senha = t.erroSenha(SENHA_MIN);
    if (senha !== confirmacao) novosErros.confirmacao = t.erroConfirmacao;
    if (!aceite) novosErros.aceite = t.erroAceite;

    setErros(novosErros);
    setErroGeral(undefined);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    const { error } = await authClient.signUp.email({
      name: nome,
      email,
      password: senha,
      // Campo lido só pelo hook do servidor (registro do consentimento).
      aceitePrivacidade: true,
      callbackURL: destino,
    } as Parameters<typeof authClient.signUp.email>[0]);
    setEnviando(false);

    if (error) {
      setErroGeral(traduzirErro(error, idioma));
      return;
    }
    setEmailEnviado(email);
  }

  if (emailEnviado) {
    return (
      <div id="painel-criar" role="tabpanel" aria-labelledby="aba-criar" className="space-y-4 text-center">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-gold-metal">{t.quaseLa}</p>
        <p className="text-mist">
          {t.enviamosA} <strong className="text-white">{emailEnviado}</strong>. {t.abraEmail}{" "}
          <strong className="text-white">{t.confirmarEmail}</strong> {t.depoisCompleta}
        </p>
        <p className="text-sm text-mist/60">{t.naoChegou}</p>
      </div>
    );
  }

  const aria = (campo: keyof ErrosCadastro, id: string) => ({
    "aria-invalid": erros[campo] ? true : undefined,
    "aria-describedby": erros[campo] ? `${id}-erro` : undefined,
  });

  return (
    <form id="painel-criar" role="tabpanel" aria-labelledby="aba-criar" onSubmit={enviar} noValidate className="space-y-4">
      {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}

      <Campo id="cad-nome" label={t.nome} erro={erros.nome}>
        <input id="cad-nome" name="nome" autoComplete="name" maxLength={100} className={classeInput} {...aria("nome", "cad-nome")} />
      </Campo>

      <Campo id="cad-email" label={t.email} erro={erros.email}>
        <input id="cad-email" name="email" type="email" autoComplete="email" className={classeInput} {...aria("email", "cad-email")} />
      </Campo>

      <Campo id="cad-senha" label={t.senha} erro={erros.senha} dica={t.minimo(SENHA_MIN)}>
        <input
          id="cad-senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          maxLength={SENHA_MAX}
          className={classeInput}
          aria-invalid={erros.senha ? true : undefined}
          aria-describedby={erros.senha ? "cad-senha-erro" : "cad-senha-dica"}
        />
      </Campo>

      <Campo id="cad-confirmacao" label={t.confirme} erro={erros.confirmacao}>
        <input id="cad-confirmacao" name="confirmacao" type="password" autoComplete="new-password" maxLength={SENHA_MAX} className={classeInput} {...aria("confirmacao", "cad-confirmacao")} />
      </Campo>

      <div>
        <label className="flex items-start gap-3 text-sm text-mist">
          {/* LGPD: nunca pré-marcado. */}
          <input
            type="checkbox"
            name="aceite"
            className="mt-0.5 h-4 w-4 accent-gold-400"
            aria-invalid={erros.aceite ? true : undefined}
            aria-describedby={erros.aceite ? "cad-aceite-erro" : undefined}
          />
          <span>
            {t.liAceito}{" "}
            <Link href="/privacidade" target="_blank" className="text-teal-300 underline">
              {t.politica}
            </Link>
            .
          </span>
        </label>
        {erros.aceite && <p id="cad-aceite-erro" className="mt-1 text-sm text-ember-400">{erros.aceite}</p>}
      </div>

      <button type="submit" disabled={enviando} className={classeBotao}>
        {enviando ? t.criando : t.criarConta}
      </button>
      <p className="text-center text-xs text-mist/60">{t.depoisConfirmar}</p>
    </form>
  );
}
