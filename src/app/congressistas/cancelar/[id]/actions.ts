"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { emModoVerComo, obterSessao } from "@/modules/auth/sessao";
import { cancelarCompraDoCliente, ErroCancelamento } from "@/modules/ingressos";
import { registrarAuditoria } from "@/modules/auditoria";

// O próprio cliente cancela (só o dono do pedido; regras conferidas no servidor).
export async function cancelarCompraAction(form: FormData) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  if (emModoVerComo(sessao)) redirect("/congressistas/minha-area");
  const pedidoId = z.uuid().safeParse(form.get("pedidoId"));
  if (!pedidoId.success) redirect("/congressistas/minha-area");
  if (form.get("confirmo") !== "on") redirect(`/congressistas/cancelar/${pedidoId.data}?erro=confirmar`);

  try {
    await cancelarCompraDoCliente(pedidoId.data, sessao.user.email);
  } catch (erro) {
    const codigo = erro instanceof ErroCancelamento ? erro.codigo : "falha";
    if (!(erro instanceof ErroCancelamento)) console.error("[cancelamento] Falha", (erro as Error).message);
    redirect(`/congressistas/cancelar/${pedidoId.data}?erro=${codigo}`);
  }
  await registrarAuditoria({
    acao: "compra_cancelada",
    autor: sessao.user,
    alvo: sessao.user,
    detalhes: { pedidoId: pedidoId.data },
  });
  redirect("/congressistas/minha-area?cancelado=1");
}
