import { z } from "zod";

// Regras do cadastro de congressista — usadas no formulário (feedback
// imediato) e no servidor (ação de completar cadastro), que é quem de fato decide.

export const PAIS_BRASIL = "Brasil";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const SENHA_MIN = 8;
export const SENHA_MAX = 128;

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function cpfValido(valor: string) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (base.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digito(cpf.slice(0, 9));
  const d2 = digito(cpf.slice(0, 10));
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

// Normaliza para formato internacional (+55...) — o que o gateway e
// ferramentas de mensagem esperam.
export function normalizarCelular(valor: string, pais: string) {
  const digitos = somenteDigitos(valor);
  if (pais === PAIS_BRASIL) {
    const nacional = digitos.startsWith("55") && digitos.length === 13 ? digitos.slice(2) : digitos;
    // DDD (2) + 9 + 8 dígitos
    return /^[1-9]{2}9\d{8}$/.test(nacional) ? `+55${nacional}` : null;
  }
  return digitos.length >= 8 && digitos.length <= 15 ? `+${digitos}` : null;
}

// Máscaras de digitação (só visual — o servidor guarda só os dígitos).
export function mascararCpf(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function mascararCep(valor: string) {
  return somenteDigitos(valor).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

// ---------------------------------------------------------------------------
// Ficha completa do congressista (/congressistas/completar-cadastro).
// Todo cadastro — e-mail/senha ou Google — passa por ela antes da área logada.
// ---------------------------------------------------------------------------

export const COMO_CONHECEU = [
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Indicação de amigo(a)",
  "Professor(a) ou escola de dança",
  "Google / pesquisa na internet",
  "Outro evento de dança",
  "Outro",
] as const;

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// Idade calculada pela data (sem fuso), para não errar perto da meia-noite.
export function idadeEm(dataNascimento: string, hoje = new Date()) {
  const [a, m, d] = dataNascimento.split("-").map(Number);
  let idade = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
  return idade;
}

export const fichaCongressistaSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe seu nome completo.").max(100, "Nome longo demais."),
    dataNascimento: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de nascimento."),
    celular: z.string().trim().min(1, "Informe o celular."),
    pais: z.string().trim().min(2, "Informe o país.").max(60),
    uf: z.string().trim().optional().nullable(),
    cidade: z.string().trim().min(2, "Informe a cidade.").max(80, "Nome de cidade longo demais."),
    cpf: z.string().trim().optional().nullable(),
    // Endereço — opcional, mas se começar a preencher, precisa estar completo.
    cep: opcional(9),
    logradouro: opcional(120),
    numero: opcional(10),
    complemento: opcional(60),
    bairro: opcional(80),
    // Naturalidade — opcional.
    naturalidadeCidade: opcional(80),
    naturalidadeEstado: opcional(60),
    // Como conheceu — opcional.
    comoConheceu: z.enum(COMO_CONHECEU, { error: "Escolha uma das opções da lista." }).optional().nullable().or(z.literal("").transform(() => null)),
    comoConheceuOutro: opcional(100),
  })
  .superRefine((f, ctx) => {
    const brasil = f.pais === PAIS_BRASIL;
    const erro = (campo: string, message: string) => ctx.addIssue({ code: "custom", path: [campo], message });

    const data = new Date(`${f.dataNascimento}T12:00:00`);
    if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== f.dataNascimento) {
      erro("dataNascimento", "Data de nascimento inválida.");
    } else {
      const idade = idadeEm(f.dataNascimento);
      if (idade < 0 || idade > 110) erro("dataNascimento", "Confira a data de nascimento.");
    }

    if (!normalizarCelular(f.celular, f.pais)) {
      erro(
        "celular",
        brasil
          ? "Celular inválido. Use DDD + número, ex: (11) 91234-5678."
          : "Celular inválido. Inclua o código do país, ex: +351 912 345 678.",
      );
    }
    if (brasil) {
      if (!f.uf || !(UFS as readonly string[]).includes(f.uf)) erro("uf", "Selecione o estado.");
      if (!f.cpf || !cpfValido(f.cpf)) erro("cpf", "CPF inválido.");
    }

    const temEndereco = [f.cep, f.logradouro, f.numero, f.complemento, f.bairro].some(Boolean);
    if (temEndereco) {
      if (!f.logradouro) erro("logradouro", "Informe a rua/avenida ou deixe o endereço todo em branco.");
      if (!f.numero) erro("numero", "Informe o número (ou \"s/n\").");
      if (brasil && somenteDigitos(f.cep ?? "").length !== 8) erro("cep", "CEP inválido. Use 8 dígitos, ex: 01310-100.");
    }

    if (f.comoConheceu === "Outro" && !f.comoConheceuOutro) erro("comoConheceuOutro", "Conte como nos conheceu.");
  })
  .transform((f) => {
    const brasil = f.pais === PAIS_BRASIL;
    const cepDigitos = somenteDigitos(f.cep ?? "");
    return {
      name: f.nome,
      dataNascimento: f.dataNascimento,
      celular: normalizarCelular(f.celular, f.pais)!,
      pais: f.pais,
      uf: brasil ? f.uf! : null,
      cidade: f.cidade,
      cpf: brasil ? somenteDigitos(f.cpf!) : null,
      cep: f.cep ? (brasil ? `${cepDigitos.slice(0, 5)}-${cepDigitos.slice(5)}` : f.cep) : null,
      logradouro: f.logradouro,
      numero: f.numero,
      complemento: f.complemento,
      bairro: f.bairro,
      naturalidadeCidade: f.naturalidadeCidade,
      naturalidadeEstado: f.naturalidadeEstado,
      comoConheceu:
        f.comoConheceu === "Outro" ? `Outro: ${f.comoConheceuOutro}` : (f.comoConheceu ?? null),
    };
  });

export type FichaCongressista = z.output<typeof fichaCongressistaSchema>;

// Campos de entrada da ficha (nomes dos inputs do formulário).
export type CampoFicha = keyof z.input<typeof fichaCongressistaSchema> | "aceite";
