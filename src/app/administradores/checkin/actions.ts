"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { registrarEntrada } from "@/modules/checkin";
import { exigirAdmin } from "@/modules/auth/sessao";

// Organizador e portaria podem fazer check-in. A autorização é refeita aqui
// porque server actions aceitam POST direto.
export async function registrarEntradaAction(form: FormData) {
  const { user } = await exigirAdmin();
  const id = z.uuid().safeParse(form.get("ingressoId"));
  if (!id.success) redirect("/administradores/checkin?r=nao-encontrado");

  const resultado = await registrarEntrada(id.data, user.id);
  redirect(`/administradores/checkin?r=${resultado.ok ? "ok" : resultado.motivo}&id=${id.data}`);
}
