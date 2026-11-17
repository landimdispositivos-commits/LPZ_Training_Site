"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { type CampoFicha, fichaCongressistaSchema, PAIS_BRASIL } from "@/modules/auth/cadastro";
import { areaDoPapel } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { registrarAuditoria } from "@/modules/auditoria";
import { proximoSeguro } from "@/modules/auth/proximo";

export type ResultadoFicha = { erros: Partial<Record<CampoFicha, string>>; erroGeral?: string };

const MSG_CPF_EM_USO =
  "Não foi possível usar este CPF. Se você já tem outra conta com ele, entre por ela ou fale com a organização.";

const texto = (form: FormData, campo: string) => {
  const v = form.get(campo);
  return typeof v === "string" ? v : null;
};

// Server actions são endpoints públicos (POST direto): sessão e papel são
// conferidos aqui, e todos os dados são validados de novo no servidor.
export async function salvarFichaAction(form: FormData): Promise<ResultadoFicha> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const { user } = sessao;
  if (user.papel !== "congressista") redirect(areaDoPapel(user.papel));

  const brasil = texto(form, "origem") !== "outro";
  const resultado = fichaCongressistaSchema.safeParse({
    nome: texto(form, "nome") ?? "",
    dataNascimento: texto(form, "dataNascimento") ?? "",
    celular: texto(form, "celular") ?? "",
    pais: brasil ? PAIS_BRASIL : (texto(form, "pais") ?? ""),
    uf: brasil ? texto(form, "uf") : null,
    cidade: texto(form, "cidade") ?? "",
    cpf: brasil ? texto(form, "cpf") : null,
    cep: texto(form, "cep"),
    logradouro: texto(form, "logradouro"),
    numero: texto(form, "numero"),
    complemento: texto(form, "complemento"),
    bairro: texto(form, "bairro"),
    naturalidadeCidade: texto(form, "naturalidadeCidade"),
    naturalidadeEstado: texto(form, "naturalidadeEstado"),
    comoConheceu: texto(form, "comoConheceu") ?? "",
    comoConheceuOutro: texto(form, "comoConheceuOutro"),
  });

  const erros: ResultadoFicha["erros"] = {};
  if (!resultado.success) {
    for (const issue of resultado.error.issues) {
      erros[issue.path[0] as CampoFicha] ??= issue.message;
    }
  }
  // Quem entrou pelo Google ainda não aceitou a Política (LGPD).
  const precisaAceite = !user.privacidadeAceitaEm;
  if (precisaAceite && texto(form, "aceite") !== "on") {
    erros.aceite = "É preciso aceitar a Política de Privacidade.";
  }
  if (!resultado.success || Object.keys(erros).length > 0) return { erros };

  const ficha = resultado.data;
  if (ficha.cpf) {
    const [outro] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.cpf, ficha.cpf), ne(usuarios.id, user.id)))
      .limit(1);
    if (outro) return { erros: { cpf: MSG_CPF_EM_USO } };
  }

  const primeiraVez = !user.cadastroCompletoEm;
  const agora = new Date();
  try {
    await db
      .update(usuarios)
      .set({
        ...ficha,
        cadastroCompletoEm: user.cadastroCompletoEm ?? agora,
        privacidadeAceitaEm: user.privacidadeAceitaEm ?? agora,
        updatedAt: agora,
      })
      .where(eq(usuarios.id, user.id));
  } catch (erro) {
    // Corrida rara: outro cadastro gravou o mesmo CPF entre a checagem e aqui.
    const causa = (erro as { cause?: { code?: string } })?.cause ?? (erro as { code?: string });
    if (causa?.code === "23505") return { erros: { cpf: MSG_CPF_EM_USO } };
    console.error("Falha ao salvar ficha do congressista", { usuarioId: user.id });
    return { erros: {}, erroGeral: "Não foi possível salvar seus dados agora. Tente de novo em instantes." };
  }

  // Auditoria: só os NOMES dos campos que mudaram (nunca os valores — LGPD).
  const atual = user as unknown as Record<string, unknown>;
  const campos = Object.entries(ficha)
    .filter(([campo, valor]) => (atual[campo] ?? null) !== (valor ?? null))
    .map(([campo]) => (campo === "name" ? "nome" : campo));
  if (primeiraVez || campos.length > 0) {
    await registrarAuditoria({
      acao: primeiraVez ? "cadastro_concluido" : "ficha_atualizada",
      autor: user,
      alvo: { id: user.id, name: ficha.name, email: user.email },
      detalhes: { campos },
    });
  }

  // Veio de uma compra (caixinha de ingresso)? Volta para ela.
  const proximo = proximoSeguro(texto(form, "proximo"));
  if (proximo) redirect(proximo);
  redirect(primeiraVez ? "/congressistas/minha-area?bemvindo=1" : "/congressistas/minha-area?atualizado=1");
}
