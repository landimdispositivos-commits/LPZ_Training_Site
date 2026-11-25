"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  cancelarPedidoPendente,
  criarPedido,
  ErroCompra,
  iniciarPagamento,
  ordemDosProdutos,
  pagarSacola,
  salvarOrdemDosProdutos,
  atualizarPacote,
  carregarCatalogo,
  criarPacote,
  ehTipoProduto,
  infoProduto,
  type CodigoErroCompra,
} from "@/modules/ingressos";
import { areaDoPapel, temPerfil } from "@/modules/auth/papeis";
import { urlCompra } from "@/modules/auth/proximo";
import { emModoVerComo, exigirAdmin, obterSessao } from "@/modules/auth/sessao";
import { moverNaLista } from "@/lib/ordem";
import { reaisParaCentavos } from "@/lib/formatar";
import { revalidatePath } from "next/cache";
import { obterIdioma } from "@/i18n/servidor";

// Server actions são endpoints públicos (POST direto): sessão, papel e dono
// do pedido são conferidos aqui, nunca confiando no formulário.
// `voltarPara`: depois do login/ficha, a pessoa volta para esta compra.
async function exigirCongressista(voltarPara = "/ingressos") {
  const sessao = await obterSessao();
  if (!sessao) redirect(`/congressistas?proximo=${encodeURIComponent(voltarPara)}`);
  // Organização vendo o site como outra pessoa: só visualização.
  if (emModoVerComo(sessao)) redirect(voltarPara);
  const { user } = sessao;
  if (!temPerfil(user, "congressista")) redirect(areaDoPapel(user.papel));
  if (!user.cadastroCompletoEm) redirect(`/congressistas/completar-cadastro?proximo=${encodeURIComponent(voltarPara)}`);
  return user;
}

const pedidoIdSchema = z.uuid();

export async function comprarAction(form: FormData) {
  await carregarCatalogo();
  const tipo = z.string().refine(ehTipoProduto).safeParse(form.get("tipo"));
  if (!tipo.success) redirect("/ingressos?erro=sem-lote");
  const user = await exigirCongressista(urlCompra(tipo.data));
  const idioma = await obterIdioma();

  let destino: string;
  try {
    const pedidoId = await criarPedido(
      {
        nome: user.name,
        email: user.email,
        telefone: user.celular ?? null,
        cpf: user.cpf ?? null,
      },
      tipo.data,
      idioma,
      loteEscolhido(form),
    );
    destino = await iniciarPagamento(pedidoId, user.email);
  } catch (erro) {
    destino = `/ingressos?erro=${codigoDoErro(erro)}`;
  }
  redirect(destino);
}

export async function retomarPagamentoAction(form: FormData) {
  const user = await exigirCongressista();
  const pedidoId = pedidoIdSchema.safeParse(form.get("pedidoId"));
  if (!pedidoId.success) redirect("/ingressos?erro=pedido-invalido");

  let destino: string;
  try {
    destino = await iniciarPagamento(pedidoId.data, user.email);
  } catch (erro) {
    destino = `/ingressos?erro=${codigoDoErro(erro)}`;
  }
  redirect(destino);
}

export async function desistirAction(form: FormData) {
  const user = await exigirCongressista();
  const pedidoId = pedidoIdSchema.safeParse(form.get("pedidoId"));
  if (pedidoId.success) await cancelarPedidoPendente(pedidoId.data, user.email);
  redirect("/ingressos?cancelado=1");
}

// Sacola: reserva a vaga do produto (pedido pendente) sem abrir o pagamento.
export async function adicionarSacolaAction(form: FormData) {
  await carregarCatalogo();
  const tipo = z.string().refine(ehTipoProduto).safeParse(form.get("tipo"));
  if (!tipo.success) redirect("/ingressos?erro=sem-lote");
  const user = await exigirCongressista();
  const idioma = await obterIdioma();
  let destino = `/ingressos?adicionado=${tipo.data}`;
  try {
    await criarPedido(
      { nome: user.name, email: user.email, telefone: user.celular ?? null, cpf: user.cpf ?? null },
      tipo.data,
      idioma,
      loteEscolhido(form),
    );
  } catch (erro) {
    destino = `/ingressos?erro=${codigoDoErro(erro)}`;
  }
  redirect(destino);
}

// Tira um item da sacola: cancela o pedido pendente e devolve a vaga.
export async function removerDaSacolaAction(form: FormData) {
  const user = await exigirCongressista();
  const pedidoId = pedidoIdSchema.safeParse(form.get("pedidoId"));
  if (pedidoId.success) await cancelarPedidoPendente(pedidoId.data, user.email);
  redirect(form.get("voltar") === "sacola" ? "/sacola" : "/ingressos");
}

// Um único pagamento para todos os itens da sacola.
export async function pagarSacolaAction() {
  const user = await exigirCongressista("/sacola");
  let destino: string;
  try {
    destino = await pagarSacola(user.email);
  } catch (erro) {
    destino = `/sacola?erro=${codigoDoErro(erro)}`;
  }
  redirect(destino);
}

// Opção escolhida (ex: duração da massagem). O servidor confere se o lote é do produto.
function loteEscolhido(form: FormData) {
  const r = z.uuid().safeParse(form.get("loteId"));
  return r.success ? r.data : undefined;
}

function codigoDoErro(erro: unknown): CodigoErroCompra {
  if (erro instanceof ErroCompra) return erro.codigo;
  console.error("Erro inesperado na compra", (erro as Error)?.message);
  return "pagamento";
}

// Setinhas ▲ ▼ nas caixas de Ingressos (só organização).
export async function moverProdutoAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  await carregarCatalogo();
  const tipo = z.string().refine(ehTipoProduto).safeParse(form.get("tipo"));
  if (!tipo.success) redirect("/ingressos?editar=1");
  const direcao = form.get("direcao") === "cima" ? "cima" : "baixo";
  await salvarOrdemDosProdutos(moverNaLista(await ordemDosProdutos(), tipo.data, direcao));
  revalidatePath("/ingressos");
  redirect(`/ingressos?editar=1#produto-${tipo.data}`);
}

// ---------------------------------------------------------------------------
// Modo edição da tela de Ingressos (só organização): criar e editar pacotes.
// ---------------------------------------------------------------------------
const textoOpcional = z.string().trim().max(80).transform((v) => v || null);
const nomesSchema = z.object({
  nome: z.string().trim().min(1).max(80),
  nomeEn: textoOpcional,
  nomeEs: textoOpcional,
  opcoes: z.boolean(),
});

function lerNomes(form: FormData) {
  const texto = (campo: string) => String(form.get(campo) ?? "");
  return nomesSchema.safeParse({
    nome: texto("nome"),
    nomeEn: texto("nomeEn"),
    nomeEs: texto("nomeEs"),
    opcoes: form.get("opcoes") === "on",
  });
}

// "+ Adicionar pacote": cria o produto e o primeiro lote (preço e quantidade).
// Mais lotes/opções e mudanças de preço ficam no Financeiro.
export async function criarPacoteAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const nomes = lerNomes(form);
  const texto = (campo: string) => String(form.get(campo) ?? "");
  const lote = z
    .object({
      nome: z.string().trim().min(1).max(60),
      precoCentavos: z.number().int().min(0).max(10_000_000),
      quantidadeTotal: z.number().int().min(1).max(10_000),
    })
    .safeParse({
      nome: texto("loteNome") || "Lote único",
      precoCentavos: reaisParaCentavos(texto("preco")) ?? Number.NaN,
      quantidadeTotal: Number.parseInt(texto("quantidade"), 10),
    });
  const presenca = form.get("presenca") === "entrada" ? "entrada" : "servico";
  if (!nomes.success || !lote.success) redirect("/ingressos?editar=1&erro-edicao=pacote#novo-pacote");

  const chave = await criarPacote({ ...nomes.data, presenca, lote: lote.data });
  revalidatePath("/ingressos");
  redirect(`/ingressos?editar=1&ok-edicao=criado#produto-${chave}`);
}

// Editar nome (pt/en/es), "cliente escolhe opção" e ativo/desativado de um
// pacote criado pela organização. Os produtos fixos não mudam por aqui.
export async function editarPacoteAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  await carregarCatalogo();
  const chave = String(form.get("tipo") ?? "");
  if (!ehTipoProduto(chave) || !infoProduto(chave).personalizado) redirect("/ingressos?editar=1");
  const nomes = lerNomes(form);
  if (!nomes.success) redirect(`/ingressos?editar=1&erro-edicao=pacote#produto-${chave}`);
  await atualizarPacote(chave, { ...nomes.data, ativo: form.get("ativo") === "on" });
  revalidatePath("/ingressos");
  redirect(`/ingressos?editar=1&ok-edicao=salvo#produto-${chave}`);
}
