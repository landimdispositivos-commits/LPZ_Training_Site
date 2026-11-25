"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { ASSUNTOS, LISTA_ASSUNTOS, obterContatos, type Assunto } from "@/modules/contato";
import { enviarEmail, escaparHtml } from "@/modules/email";

export type ResultadoContato = { ok?: boolean; erros?: Partial<Record<"nome" | "email" | "assunto" | "mensagem", true>>; falhou?: boolean };

// Limite simples contra abuso: 5 mensagens a cada 10 minutos por endereço IP.
const tentativas = ((globalThis as { __lpzFaleConosco?: Map<string, number[]> }).__lpzFaleConosco ??= new Map());

const mensagemSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  assunto: z.enum(LISTA_ASSUNTOS as [Assunto, ...Assunto[]]),
  mensagem: z.string().trim().min(5).max(4000),
});

// A mensagem NÃO fica guardada no banco: vai só por e-mail para a organização.
export async function enviarMensagemAction(_anterior: ResultadoContato, form: FormData): Promise<ResultadoContato> {
  // Campo escondido: pessoas não preenchem, robôs sim.
  if (String(form.get("site") ?? "")) return { ok: true };

  const dados = mensagemSchema.safeParse({
    nome: form.get("nome"),
    email: String(form.get("email") ?? "").trim(),
    assunto: form.get("assunto"),
    mensagem: form.get("mensagem"),
  });
  if (!dados.success) {
    const erros: ResultadoContato["erros"] = {};
    for (const issue of dados.error.issues) erros[issue.path[0] as keyof typeof erros] = true;
    return { erros };
  }

  const h = await headers();
  const ip = (h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "local").trim();
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < 10 * 60 * 1000);
  if (recentes.length >= 5) return { falhou: true };
  tentativas.set(ip, [...recentes, agora]);

  const { nome, email, assunto, mensagem } = dados.data;
  const contatos = await obterContatos();
  const destino = contatos.email ?? process.env.EMAIL_FROM;
  if (!destino) return { falhou: true };

  const titulo = ASSUNTOS[assunto].pt;
  try {
    await enviarEmail({
      para: destino,
      responderPara: email,
      assunto: `[Fale conosco] ${titulo} — ${nome}`,
      texto: `Nova mensagem pelo Fale conosco do site.\n\nAssunto: ${titulo}\nNome: ${nome}\nE-mail: ${email}\n\n${mensagem}\n\n(Responda este e-mail para falar direto com a pessoa.)`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;color:#04161b">
<p style="font-size:13px;color:#555">Nova mensagem pelo <strong>Fale conosco</strong> do site LPZ Training.</p>
<table style="font-size:14px;margin:12px 0"><tr><td style="color:#555;padding-right:12px">Assunto</td><td><strong>${escaparHtml(titulo)}</strong></td></tr>
<tr><td style="color:#555;padding-right:12px">Nome</td><td>${escaparHtml(nome)}</td></tr>
<tr><td style="color:#555;padding-right:12px">E-mail</td><td>${escaparHtml(email)}</td></tr></table>
<div style="white-space:pre-wrap;border-left:3px solid #e6b54a;padding:8px 12px;background:#f7f4ea">${escaparHtml(mensagem)}</div>
<p style="font-size:12px;color:#777">Responda este e-mail para falar direto com a pessoa.</p></div>`,
    });
  } catch (erro) {
    console.error("[fale-conosco] Falha ao enviar", (erro as Error).message);
    return { falhou: true };
  }
  return { ok: true };
}

const contatosSchema = z.object({
  contato_email: z.union([z.email().max(200), z.literal("")]),
  contato_whatsapp: z.string().trim().max(30).regex(/^[\d\s()+-]*$/),
  contato_instagram: z.string().trim().max(31).regex(/^@?[A-Za-z0-9._]*$/),
});

// Canetinha da organização: edita e-mail, WhatsApp e Instagram do evento.
export async function salvarContatosAction(form: FormData) {
  await exigirAdmin(["organizador"]);
  const dados = contatosSchema.safeParse({
    contato_email: String(form.get("contato_email") ?? "").trim(),
    contato_whatsapp: String(form.get("contato_whatsapp") ?? ""),
    contato_instagram: String(form.get("contato_instagram") ?? ""),
  });
  if (!dados.success) redirect("/fale-conosco?editar=1&erro=1#contatos");

  const agora = new Date();
  for (const [chave, bruto] of Object.entries(dados.data)) {
    const valor = chave === "contato_instagram" && bruto && !bruto.startsWith("@") ? `@${bruto}` : bruto;
    await db
      .insert(configuracoes)
      .values({ chave, valor, atualizadoEm: agora })
      .onConflictDoUpdate({ target: configuracoes.chave, set: { valor, atualizadoEm: agora } });
  }
  revalidatePath("/fale-conosco");
  redirect("/fale-conosco?salvo=1#contatos");
}
