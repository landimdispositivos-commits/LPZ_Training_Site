"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ehDiaPresenca, registrarPresenca } from "@/modules/presencas";

// Organizador, portaria e acesso total registram presença. A autorização é
// refeita aqui porque server actions aceitam POST direto.
export async function registrarPresencaAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador", "portaria"]);
  const pedido = z.uuid().safeParse(form.get("pedidoId"));
  const dia = form.get("dia");
  // Volta só para as duas telas conhecidas (nada de redirecionamento aberto).
  const voltar = form.get("voltar");
  const qrId = z.uuid().safeParse(form.get("qrId"));
  const base =
    voltar === "ingresso" && qrId.success ? `/ingresso/${qrId.data}?` : "/administradores/checkin?";

  if (!pedido.success || !ehDiaPresenca(dia)) return redirect(`${base}r=nao-encontrado`);
  const resultado = await registrarPresenca(pedido.data, dia, { id: user.id, name: user.name });
  redirect(`${base}r=${resultado.ok ? "ok" : resultado.motivo}&pedido=${pedido.data}&dia=${dia}`);
}
