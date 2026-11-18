import { formatarDataHora } from "@/lib/formatar";
import { PRODUTOS, TIPOS_PRODUTO } from "@/modules/ingressos/produtos";
import { ROTULO_PAPEL } from "@/modules/auth/menu";
import type { Cadastro } from "./index";

// Colunas da exportação de usuários para Excel. `basica`: vem marcada por
// padrão e aparece na grade principal.

function mascararCpf(cpf: string) {
  return `${cpf.slice(0, 3)}.***.***-**`;
}

function dataBr(data: string | null) {
  if (!data) return "";
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

type Valor = string | number | null;
export type Coluna = { id: string; titulo: string; basica: boolean; valor: (u: Cadastro) => Valor };

export const COLUNAS: Coluna[] = [
  { id: "nome", titulo: "Nome", basica: true, valor: (u) => u.nome },
  { id: "apelido", titulo: "Apelido", basica: false, valor: (u) => u.apelido },
  { id: "email", titulo: "E-mail", basica: true, valor: (u) => u.email },
  { id: "celular", titulo: "Celular", basica: true, valor: (u) => u.celular },
  { id: "perfil", titulo: "Perfil", basica: true, valor: (u) => ROTULO_PAPEL[u.papel] ?? u.papel },
  { id: "cadastro_via", titulo: "Cadastro via", basica: true, valor: (u) => u.formaCadastro },
  { id: "cidade", titulo: "Cidade", basica: true, valor: (u) => u.cidade },
  { id: "uf", titulo: "UF", basica: true, valor: (u) => u.uf },
  { id: "pais", titulo: "País", basica: false, valor: (u) => u.pais },
  { id: "nascimento", titulo: "Nascimento", basica: false, valor: (u) => dataBr(u.dataNascimento) },
  { id: "cpf", titulo: "CPF (parcial)", basica: false, valor: (u) => (u.cpf ? mascararCpf(u.cpf) : "") },
  {
    id: "endereco",
    titulo: "Endereço",
    basica: false,
    valor: (u) =>
      u.logradouro ? [`${u.logradouro}, ${u.numero ?? "s/n"}`, u.complemento, u.bairro].filter(Boolean).join(" · ") : "",
  },
  { id: "cep", titulo: "CEP", basica: false, valor: (u) => u.cep },
  { id: "como_conheceu", titulo: "Como conheceu", basica: false, valor: (u) => u.comoConheceu },
  ...TIPOS_PRODUTO.map((t) => ({
    id: t,
    titulo: PRODUTOS[t].nome,
    basica: true,
    valor: (u: Cadastro) => (u.comprou[t] ? "Sim" : "Não"),
  })),
  { id: "total_pago", titulo: "Total pago (R$)", basica: true, valor: (u) => u.totalPagoCentavos / 100 },
  {
    id: "checkin",
    titulo: "Check-in feito",
    basica: false,
    valor: (u) => (u.compras.some((c) => c.checkinEm) ? "Sim" : "Não"),
  },
  { id: "ficha_completa", titulo: "Ficha completa", basica: false, valor: (u) => (u.cadastroCompletoEm ? "Sim" : "Não") },
  { id: "email_confirmado", titulo: "E-mail confirmado", basica: false, valor: (u) => (u.emailVerificado ? "Sim" : "Não") },
  { id: "cadastrado_em", titulo: "Cadastrado em", basica: true, valor: (u) => formatarDataHora(u.criadoEm) },
];
