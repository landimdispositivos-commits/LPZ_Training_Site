"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  type CampoFicha,
  COMO_CONHECEU,
  fichaCongressistaSchema,
  mascararCep,
  mascararCpf,
  PAIS_BRASIL,
  UFS,
} from "@/modules/auth/cadastro";
import { Aviso, Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { salvarFichaAction } from "./actions";

export type ValoresFicha = {
  nome: string;
  email: string;
  dataNascimento: string;
  celular: string;
  pais: string;
  uf: string;
  cidade: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  naturalidadeCidade: string;
  naturalidadeEstado: string;
  comoConheceu: string;
};

type Erros = Partial<Record<CampoFicha, string>>;

// "Outro: texto livre" é guardado numa coluna só; separa para o formulário.
function separarComoConheceu(valor: string) {
  if (valor.startsWith("Outro: ")) return { opcao: "Outro", outro: valor.slice(7) };
  return { opcao: (COMO_CONHECEU as readonly string[]).includes(valor) ? valor : "", outro: "" };
}

export function FormFicha({ valores, precisaAceite }: { valores: ValoresFicha; precisaAceite: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [origem, setOrigem] = useState<"brasil" | "outro">(
    valores.pais && valores.pais !== PAIS_BRASIL ? "outro" : "brasil",
  );
  const [cpf, setCpf] = useState(mascararCpf(valores.cpf));
  const [cep, setCep] = useState(valores.cep);
  const inicialComo = separarComoConheceu(valores.comoConheceu);
  const [comoConheceu, setComoConheceu] = useState(inicialComo.opcao);
  const brasil = origem === "brasil";
  const hoje = new Date().toISOString().slice(0, 10);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const campo = (nome: string) => String(form.get(nome) ?? "");

    // Mesmas regras do servidor, para dar retorno imediato.
    const novosErros: Erros = {};
    const r = fichaCongressistaSchema.safeParse({
      nome: campo("nome"),
      dataNascimento: campo("dataNascimento"),
      celular: campo("celular"),
      pais: brasil ? PAIS_BRASIL : campo("pais"),
      uf: brasil ? campo("uf") : null,
      cidade: campo("cidade"),
      cpf: brasil ? campo("cpf") : null,
      cep: campo("cep"),
      logradouro: campo("logradouro"),
      numero: campo("numero"),
      complemento: campo("complemento"),
      bairro: campo("bairro"),
      naturalidadeCidade: campo("naturalidadeCidade"),
      naturalidadeEstado: campo("naturalidadeEstado"),
      comoConheceu: campo("comoConheceu"),
      comoConheceuOutro: campo("comoConheceuOutro"),
    });
    if (!r.success) {
      for (const issue of r.error.issues) novosErros[issue.path[0] as CampoFicha] ??= issue.message;
    }
    if (precisaAceite && form.get("aceite") !== "on") novosErros.aceite = "É preciso aceitar a Política de Privacidade.";

    setErros(novosErros);
    setErroGeral(undefined);
    if (Object.keys(novosErros).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }

    iniciar(async () => {
      // Em caso de sucesso, a ação redireciona para a Minha área.
      const resultado = await salvarFichaAction(form);
      setErros(resultado.erros);
      setErroGeral(resultado.erroGeral);
    });
  }

  const ligar = (nome: CampoFicha, id: string, temDica = false) => ({
    id,
    name: nome,
    className: classeInput,
    "aria-invalid": erros[nome] ? true : undefined,
    "aria-describedby": erros[nome] ? `${id}-erro` : temDica ? `${id}-dica` : undefined,
  });

  const classeGrupo = "space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6";
  const classeTitulo = "text-sm font-semibold uppercase tracking-wider text-teal-300";

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      {erroGeral && <Aviso tipo="erro">{erroGeral}</Aviso>}
      {Object.keys(erros).length > 0 && !erroGeral && (
        <Aviso tipo="erro">Confira os campos destacados abaixo.</Aviso>
      )}

      <fieldset className={classeGrupo}>
        <legend className={`${classeTitulo} float-left mb-2 w-full`}>Dados pessoais</legend>

        <Campo id="f-nome" label="Nome completo *" erro={erros.nome}>
          <input {...ligar("nome", "f-nome")} defaultValue={valores.nome} autoComplete="name" maxLength={100} />
        </Campo>

        <Campo id="f-email" label="E-mail" dica="E-mail da sua conta — não pode ser alterado aqui.">
          <input id="f-email" value={valores.email} readOnly aria-describedby="f-email-dica" className={`${classeInput} opacity-70`} />
        </Campo>

        <Campo id="f-nascimento" label="Data de nascimento *" erro={erros.dataNascimento}>
          <input
            {...ligar("dataNascimento", "f-nascimento")}
            type="date"
            min="1900-01-01"
            max={hoje}
            defaultValue={valores.dataNascimento}
            autoComplete="bday"
          />
        </Campo>

        <Campo
          id="f-celular"
          label="Celular (WhatsApp) *"
          erro={erros.celular}
          dica={brasil ? "Com DDD, ex: (11) 91234-5678." : "Com código do país, ex: +351 912 345 678."}
        >
          <input {...ligar("celular", "f-celular", true)} type="tel" defaultValue={valores.celular} autoComplete="tel" />
        </Campo>
      </fieldset>

      <fieldset className={classeGrupo}>
        <legend className={`${classeTitulo} float-left mb-2 w-full`}>Onde você mora</legend>

        <div role="radiogroup" aria-label="País onde mora" className="grid grid-cols-2 gap-2 text-sm">
          {(["brasil", "outro"] as const).map((opcao) => (
            <label
              key={opcao}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 has-[:checked]:border-gold-400 has-[:checked]:bg-gold-400/10"
            >
              <input
                type="radio"
                name="origem"
                value={opcao}
                checked={origem === opcao}
                onChange={() => setOrigem(opcao)}
                className="accent-gold-400"
              />
              {opcao === "brasil" ? "No Brasil" : "Em outro país"}
            </label>
          ))}
        </div>

        {brasil ? (
          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <Campo id="f-uf" label="Estado *" erro={erros.uf}>
              <select {...ligar("uf", "f-uf")} defaultValue={valores.uf}>
                <option value="">UF</option>
                {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </Campo>
            <Campo id="f-cidade" label="Cidade *" erro={erros.cidade}>
              <input {...ligar("cidade", "f-cidade")} defaultValue={valores.cidade} autoComplete="address-level2" maxLength={80} />
            </Campo>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="f-pais" label="País *" erro={erros.pais}>
              <input
                {...ligar("pais", "f-pais")}
                defaultValue={valores.pais === PAIS_BRASIL ? "" : valores.pais}
                autoComplete="country-name"
                maxLength={60}
              />
            </Campo>
            <Campo id="f-cidade" label="Cidade *" erro={erros.cidade}>
              <input {...ligar("cidade", "f-cidade")} defaultValue={valores.cidade} autoComplete="address-level2" maxLength={80} />
            </Campo>
          </div>
        )}

        {brasil && (
          <Campo id="f-cpf" label="CPF *" erro={erros.cpf} dica="Necessário para o pagamento do ingresso via Mercado Pago.">
            <input
              {...ligar("cpf", "f-cpf", true)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(mascararCpf(e.target.value))}
            />
          </Campo>
        )}
      </fieldset>

      <fieldset className={classeGrupo}>
        <legend className={`${classeTitulo} float-left mb-2 w-full`}>
          Endereço <span className="font-normal normal-case tracking-normal text-mist/60">(opcional)</span>
        </legend>
        <p className="text-xs text-mist/60">
          Usado só para envio de materiais do evento, se houver. Pode deixar em branco.
        </p>

        <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <Campo id="f-cep" label={brasil ? "CEP" : "Código postal"} erro={erros.cep}>
            <input
              {...ligar("cep", "f-cep")}
              inputMode={brasil ? "numeric" : "text"}
              autoComplete="postal-code"
              placeholder={brasil ? "00000-000" : ""}
              value={cep}
              maxLength={brasil ? 9 : 12}
              onChange={(e) => setCep(brasil ? mascararCep(e.target.value) : e.target.value)}
            />
          </Campo>
          <Campo id="f-logradouro" label="Rua / avenida" erro={erros.logradouro}>
            <input {...ligar("logradouro", "f-logradouro")} defaultValue={valores.logradouro} autoComplete="address-line1" maxLength={120} />
          </Campo>
        </div>
        <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
          <Campo id="f-numero" label="Número" erro={erros.numero}>
            <input {...ligar("numero", "f-numero")} defaultValue={valores.numero} maxLength={10} />
          </Campo>
          <Campo id="f-complemento" label="Complemento" erro={erros.complemento}>
            <input {...ligar("complemento", "f-complemento")} defaultValue={valores.complemento} autoComplete="address-line2" maxLength={60} />
          </Campo>
        </div>
        <Campo id="f-bairro" label="Bairro" erro={erros.bairro}>
          <input {...ligar("bairro", "f-bairro")} defaultValue={valores.bairro} autoComplete="address-level3" maxLength={80} />
        </Campo>
      </fieldset>

      <fieldset className={classeGrupo}>
        <legend className={`${classeTitulo} float-left mb-2 w-full`}>
          Mais sobre você <span className="font-normal normal-case tracking-normal text-mist/60">(opcional)</span>
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="f-nat-cidade" label="Cidade onde nasceu" erro={erros.naturalidadeCidade}>
            <input {...ligar("naturalidadeCidade", "f-nat-cidade")} defaultValue={valores.naturalidadeCidade} maxLength={80} />
          </Campo>
          <Campo id="f-nat-estado" label="Estado ou país onde nasceu" erro={erros.naturalidadeEstado}>
            <input {...ligar("naturalidadeEstado", "f-nat-estado")} defaultValue={valores.naturalidadeEstado} maxLength={60} />
          </Campo>
        </div>

        <Campo id="f-como" label="Como você conheceu o LPZ?" erro={erros.comoConheceu}>
          <select {...ligar("comoConheceu", "f-como")} value={comoConheceu} onChange={(e) => setComoConheceu(e.target.value)}>
            <option value="">Prefiro não dizer</option>
            {COMO_CONHECEU.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Campo>
        {comoConheceu === "Outro" && (
          <Campo id="f-como-outro" label="Conte como nos conheceu" erro={erros.comoConheceuOutro}>
            <input {...ligar("comoConheceuOutro", "f-como-outro")} defaultValue={inicialComo.outro} maxLength={100} />
          </Campo>
        )}
      </fieldset>

      {precisaAceite && (
        <div>
          <label className="flex items-start gap-3 text-sm text-mist">
            {/* LGPD: nunca pré-marcado. */}
            <input
              type="checkbox"
              name="aceite"
              className="mt-0.5 h-4 w-4 accent-gold-400"
              aria-invalid={erros.aceite ? true : undefined}
              aria-describedby={erros.aceite ? "f-aceite-erro" : undefined}
            />
            <span>
              Li e aceito a{" "}
              <Link href="/privacidade" target="_blank" className="text-teal-300 underline">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          {erros.aceite && <p id="f-aceite-erro" className="mt-1 text-sm text-ember-400">{erros.aceite}</p>}
        </div>
      )}

      <p className="text-xs text-mist/60">* Campos obrigatórios.</p>

      <button type="submit" disabled={pendente} className={classeBotao}>
        {pendente ? "Salvando..." : "Salvar meus dados"}
      </button>
    </form>
  );
}
