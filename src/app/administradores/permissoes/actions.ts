"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ehAdmin } from "@/modules/auth/papeis";
import { exigirAdmin } from "@/modules/auth/sessao";
import { alterarPapel, PAPEIS } from "@/modules/usuarios";
import { registrarAuditoria } from "@/modules/auditoria";

const VOLTAR = "/administradores/permissoes";

// Só organizadores mudam perfis. Regras: ninguém muda o próprio perfil (evita
// a organização ficar sem nenhum organizador) e dar acesso administrativo
// exige marcar a confirmação.
export async function alterarPapelAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador"]);

  const dados = z
    .object({ usuarioId: z.string().min(1).max(100), papel: z.enum(PAPEIS) })
    .safeParse({ usuarioId: form.get("usuarioId"), papel: form.get("papel") });
  const voltar = String(form.get("voltar") ?? "");
  // Volta para a tela de origem (Permissões ou Usuários), nunca para fora,
  // mantendo a busca/filtro e trocando só os avisos.
  const permitidos = [VOLTAR, "/administradores/usuarios"];
  const [caminho, consulta = ""] = voltar.split("?");
  const base = permitidos.includes(caminho) ? caminho : VOLTAR;
  const params = new URLSearchParams(consulta);
  for (const p of ["ok", "erro", "alvo"]) params.delete(p);
  const comAviso = (aviso: string) => {
    const final = new URLSearchParams(params);
    for (const [k, v] of new URLSearchParams(aviso)) final.set(k, v);
    return `${base}?${final}`;
  };

  if (!dados.success) redirect(comAviso("erro=dados"));
  if (dados.data.usuarioId === user.id) redirect(comAviso("erro=proprio"));

  const alvo = await db.query.usuarios.findFirst({ where: eq(usuarios.id, dados.data.usuarioId) });
  if (!alvo) redirect(comAviso("erro=dados"));
  if (alvo.papel === dados.data.papel) redirect(comAviso(`ok=sem-mudanca&alvo=${alvo.id}`));

  const viraAdmin = ehAdmin(dados.data.papel);
  if (viraAdmin && form.get("confirmo") !== "on") redirect(comAviso("erro=confirmar"));

  await alterarPapel(alvo.id, dados.data.papel);
  await registrarAuditoria({
    acao: "perfil_alterado",
    autor: user,
    alvo: { id: alvo.id, name: alvo.name, email: alvo.email },
    detalhes: { antes: alvo.papel, depois: dados.data.papel },
  });
  revalidatePath(VOLTAR);
  revalidatePath("/administradores/usuarios");
  redirect(comAviso(`ok=1&alvo=${alvo.id}`));
}
