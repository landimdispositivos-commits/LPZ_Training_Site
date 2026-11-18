"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  cancelarPedidoPendente,
  criarPedido,
  ErroCompra,
  iniciarPagamento,
  pagarSacola,
  TIPOS_PRODUTO,
  type CodigoErroCompra,
  type TipoProduto,
} from "@/modules/ingressos";
import { areaDoPapel } from "@/modules/auth/papeis";
import { urlCompra } from "@/modules/auth/proximo";
import { obterSessao } from "@/modules/auth/sessao";
import { obterIdioma } from "@/i18n/servidor";

// Server actions são endpoints públicos (POST direto): sessão, papel e dono
// do pedido são conferidos aqui, nunca confiando no formulário.
// `voltarPara`: depois do login/ficha, a pessoa volta para esta compra.
async function exigirCongressista(voltarPara = "/ingressos") {
  const sessao = await obterSessao();
  if (!sessao) redirect(`/congressistas?proximo=${encodeURIComponent(voltarPara)}`);
  const { user } = sessao;
  if (user.papel !== "congressista") redirect(areaDoPapel(user.papel));
  if (!user.cadastroCompletoEm) redirect(`/congressistas/completar-cadastro?proximo=${encodeURIComponent(voltarPara)}`);
  return user;
}

const pedidoIdSchema = z.uuid();

export async function comprarAction(form: FormData) {
  const tipo = z.enum(TIPOS_PRODUTO as [TipoProduto, ...TipoProduto[]]).safeParse(form.get("tipo"));
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
  const tipo = z.enum(TIPOS_PRODUTO as [TipoProduto, ...TipoProduto[]]).safeParse(form.get("tipo"));
  if (!tipo.success) redirect("/ingressos?erro=sem-lote");
  const user = await exigirCongressista();
  const idioma = await obterIdioma();
  let destino = `/ingressos?adicionado=${tipo.data}`;
  try {
    await criarPedido(
      { nome: user.name, email: user.email, telefone: user.celular ?? null, cpf: user.cpf ?? null },
      tipo.data,
      idioma,
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

function codigoDoErro(erro: unknown): CodigoErroCompra {
  if (erro instanceof ErroCompra) return erro.codigo;
  console.error("Erro inesperado na compra", (erro as Error)?.message);
  return "pagamento";
}
