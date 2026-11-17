"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/modules/auth/auth-client";
import { SENHA_MAX, SENHA_MIN } from "@/modules/auth/cadastro";
import { BotaoGoogle, SeparadorOu } from "../../_components/botao-google";
import { FormEntrar, FormEsqueci } from "../../_components/form-entrar";
import { Aviso, Campo, classeBotao, classeInput, traduzirErro } from "../../_components/form-ui";

type Aba = "entrar" | "criar" | "esqueci";

const AREA = "/congressistas/minha-area";

export function AcessoCongressista({ avisoInicial, googleAtivo }: { avisoInicial?: string; googleAtivo: boolean }) {
  const [aba, setAba] = useState<Aba>("entrar");

  const abas: { id: Aba; label: string }[] = [
    { id: "entrar", label: "Entrar" },
    { id: "criar", label: "Criar conta" },
  ];

  return (
    <div className="mx-auto w-full max-w-md">
      <div role="tablist" aria-label="Acesso do congressista" className="grid grid-cols-2 rounded-full border border-white/15 p-1">
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
        {googleAtivo && aba !== "esqueci" && (
          <>
            <BotaoGoogle destino={AREA} paginaErro="/congressistas" criarConta />
            {aba === "criar" && (
              <p className="mt-3 text-center text-xs text-mist/60">
                No primeiro acesso pelo Google, pediremos seus dados e o aceite da Política de Privacidade.
              </p>
            )}
            <SeparadorOu />
          </>
        )}

        {aba === "entrar" && (
          <FormEntrar
            destino={AREA}
            onEsqueci={() => setAba("esqueci")}
            painelProps={{ id: "painel-entrar", role: "tabpanel", "aria-labelledby": "aba-entrar" }}
          />
        )}
        {aba === "criar" && <FormCriarConta />}
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
function FormCriarConta() {
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
    if (nome.length < 2) novosErros.nome = "Informe seu nome completo.";
    if (!email) novosErros.email = "Informe seu e-mail.";
    if (senha.length < SENHA_MIN) novosErros.senha = `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`;
    if (senha !== confirmacao) novosErros.confirmacao = "As senhas não conferem.";
    if (!aceite) novosErros.aceite = "É preciso aceitar a Política de Privacidade.";

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
      callbackURL: AREA,
    } as Parameters<typeof authClient.signUp.email>[0]);
    setEnviando(false);

    if (error) {
      setErroGeral(traduzirErro(error));
      return;
    }
    setEmailEnviado(email);
  }

  if (emailEnviado) {
    return (
      <div id="painel-criar" role="tabpanel" aria-labelledby="aba-criar" className="space-y-4 text-center">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-gold-metal">Quase lá!</p>
        <p className="text-mist">
          Enviamos um link de confirmação para <strong className="text-white">{emailEnviado}</strong>.
          Abra o e-mail e clique em <strong className="text-white">Confirmar e-mail</strong> — em seguida você
          completa seus dados.
        </p>
        <p className="text-sm text-mist/60">Não chegou? Confira o spam. O link vale por 24 horas.</p>
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

      <Campo id="cad-nome" label="Nome completo" erro={erros.nome}>
        <input id="cad-nome" name="nome" autoComplete="name" maxLength={100} className={classeInput} {...aria("nome", "cad-nome")} />
      </Campo>

      <Campo id="cad-email" label="E-mail" erro={erros.email}>
        <input id="cad-email" name="email" type="email" autoComplete="email" className={classeInput} {...aria("email", "cad-email")} />
      </Campo>

      <Campo id="cad-senha" label="Senha" erro={erros.senha} dica={`Mínimo de ${SENHA_MIN} caracteres.`}>
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

      <Campo id="cad-confirmacao" label="Confirme a senha" erro={erros.confirmacao}>
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
            Li e aceito a{" "}
            <Link href="/privacidade" target="_blank" className="text-teal-300 underline">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {erros.aceite && <p id="cad-aceite-erro" className="mt-1 text-sm text-ember-400">{erros.aceite}</p>}
      </div>

      <button type="submit" disabled={enviando} className={classeBotao}>
        {enviando ? "Criando conta..." : "Criar conta"}
      </button>
      <p className="text-center text-xs text-mist/60">Depois de confirmar o e-mail, você completa seus dados pessoais.</p>
    </form>
  );
}
