"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { ehAdmin, perfisDo } from "@/modules/auth/papeis";
import { exigirAdmin } from "@/modules/auth/sessao";
import { alterarPerfis, PAPEIS, type Papel } from "@/modules/usuarios";
import { registrarAuditoria } from "@/modules/auditoria";

const VOLTAR = "/administradores/permissoes";

// Só organizadores mudam perfis. Regras: ninguém muda o próprio perfil (evita
// a organização ficar sem nenhum organizador) e dar acesso administrativo
// exige marcar a confirmação.
export async function alterarPapelAction(form: FormData) {
  const { user } = await exigirAdmin(["organizador"]);

  // Vários perfis por pessoa (caixinhas): pelo menos um.
  const dados = z
    .object({ usuarioId: z.string().min(1).max(100), perfis: z.array(z.enum(PAPEIS)).min(1).max(PAPEIS.length) })
    .safeParse({ usuarioId: form.get("usuarioId"), perfis: form.getAll("perfis") });
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

  if (!dados.success) return redirect(comAviso("erro=dados"));
  if (dados.data.usuarioId === user.id) redirect(comAviso("erro=proprio"));

  const alvo = await db.query.usuarios.findFirst({ where: eq(usuarios.id, dados.data.usuarioId) });
  if (!alvo) return redirect(comAviso("erro=dados"));
  const antes = perfisDo(alvo);
  const depois: Papel[] = dados.data.perfis.filter((p, i, lista) => lista.indexOf(p) === i);
  const mesmos = antes.length === depois.length && antes.every((p) => (depois as string[]).includes(p));
  if (mesmos) redirect(comAviso(`ok=sem-mudanca&alvo=${alvo.id}`));

  // Ganhar um perfil de administração exige marcar a confirmação.
  const ganhaAdmin = depois.some((p) => ehAdmin(p) && !antes.includes(p));
  if (ganhaAdmin && form.get("confirmo") !== "on") redirect(comAviso("erro=confirmar"));

  await alterarPerfis(alvo.id, depois);
  await registrarAuditoria({
    acao: "perfil_alterado",
    autor: user,
    alvo: { id: alvo.id, name: alvo.name, email: alvo.email },
    detalhes: { antes, depois },
  });
  revalidatePath(VOLTAR);
  revalidatePath("/administradores/usuarios");
  redirect(comAviso(`ok=1&alvo=${alvo.id}`));
}
