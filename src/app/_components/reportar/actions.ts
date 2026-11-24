"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { formatarDataHora } from "@/lib/formatar";
import { registrarAuditoria } from "@/modules/auditoria";
import { obterSessao } from "@/modules/auth/sessao";
import { obterContatos } from "@/modules/contato";
import { enviarEmail, escaparHtml } from "@/modules/email";
import { detectarTipoImagem } from "@/modules/midia/imagem";

export type ResultadoReporte = { ok?: boolean; erro?: "limite" | "dados" | "falha" };

// Limite simples por IP (memória do servidor): evita usarem o botão para
// encher a caixa de e-mail da organização.
const tentativas = new Map<string, number[]>();
const JANELA_MS = 10 * 60 * 1000;
const MAXIMO = 5;

function passouDoLimite(ip: string) {
  const agora = Date.now();
  const recentes = (tentativas.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= MAXIMO) return true;
  tentativas.set(ip, [...recentes, agora]);
  return false;
}

const reporteSchema = z.object({
  descricao: z.string().trim().max(2000),
  pagina: z.string().trim().max(500),
  navegador: z.string().trim().max(500),
  tela: z.string().trim().max(50),
  idioma: z.string().trim().max(10),
  erros: z.string().max(40_000),
});

// Monta um e-mail para a organização com o print da tela e o log de erros,
// pronto para abrir uma issue de correção.
export async function enviarReporteAction(_: ResultadoReporte, form: FormData): Promise<ResultadoReporte> {
  const cabecalhos = await headers();
  const ip = cabecalhos.get("x-real-ip") ?? cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (passouDoLimite(ip)) return { erro: "limite" };

  const dados = reporteSchema.safeParse({
    descricao: String(form.get("descricao") ?? ""),
    pagina: String(form.get("pagina") ?? ""),
    navegador: String(form.get("navegador") ?? ""),
    tela: String(form.get("tela") ?? ""),
    idioma: String(form.get("idioma") ?? ""),
    erros: String(form.get("erros") ?? "[]"),
  });
  if (!dados.success) return { erro: "dados" };

  // Só o caminho da página (sem domínio externo nem parâmetros com dados).
  let caminho = "/";
  try {
    caminho = new URL(dados.data.pagina, "http://local").pathname;
  } catch {}

  let erros: { quando: string; tipo: string; mensagem: string }[] = [];
  try {
    const lista = JSON.parse(dados.data.erros);
    if (Array.isArray(lista)) erros = lista.slice(-30).map((e) => ({ quando: String(e.quando), tipo: String(e.tipo), mensagem: String(e.mensagem).slice(0, 1000) }));
  } catch {}

  // Print: confere pelo conteúdo que é mesmo uma imagem (máx. 5 MB).
  let print: Buffer | null = null;
  const arquivo = form.get("print");
  if (arquivo instanceof File && arquivo.size > 0 && arquivo.size <= 5 * 1024 * 1024) {
    const conteudo = Buffer.from(await arquivo.arrayBuffer());
    if (detectarTipoImagem(conteudo)) print = conteudo;
  }

  const sessao = await obterSessao().catch(() => null);
  const quem = sessao ? `${sessao.user.name} <${sessao.user.email}> (perfil ${sessao.user.papel})` : "Visitante não logado";
  const quando = formatarDataHora(new Date());
  const destino = (await obterContatos()).email ?? process.env.EMAIL_FROM;
  if (!destino) return { erro: "falha" };

  const linhasTexto = [
    `Página: ${caminho}`,
    `Quando: ${quando}`,
    `Quem: ${quem}`,
    `Navegador: ${dados.data.navegador}`,
    `Tela: ${dados.data.tela} · idioma ${dados.data.idioma}`,
    "",
    "O que aconteceu (relato da pessoa):",
    dados.data.descricao || "(sem descrição)",
    "",
    `Erros registrados no navegador (${erros.length}):`,
    ...(erros.length ? erros.map((e) => `[${e.quando}] ${e.tipo}: ${e.mensagem}`) : ["(nenhum)"]),
    "",
    print ? "Print da tela em anexo." : "Print da tela indisponível neste navegador.",
  ];
  const e = escaparHtml;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111">
<h2 style="margin:0 0 12px">Reporte de problema — ${e(caminho)}</h2>
<table cellpadding="4" style="border-collapse:collapse">
<tr><td><b>Quando</b></td><td>${e(quando)}</td></tr>
<tr><td><b>Quem</b></td><td>${e(quem)}</td></tr>
<tr><td><b>Navegador</b></td><td>${e(dados.data.navegador)}</td></tr>
<tr><td><b>Tela</b></td><td>${e(dados.data.tela)} · idioma ${e(dados.data.idioma)}</td></tr>
</table>
<h3>O que aconteceu</h3><p style="white-space:pre-wrap">${e(dados.data.descricao || "(sem descrição)")}</p>
<h3>Erros registrados no navegador (${erros.length})</h3>
<pre style="white-space:pre-wrap;background:#f4f4f4;padding:8px;font-size:12px">${e(erros.length ? erros.map((x) => `[${x.quando}] ${x.tipo}: ${x.mensagem}`).join("\n") : "(nenhum)")}</pre>
<p>${print ? "Print da tela em anexo." : "Print da tela indisponível neste navegador."}</p>
</div>`;

  try {
    await enviarEmail({
      para: destino,
      assunto: `[Reporte de problema] ${caminho} — ${quando}`,
      responderPara: sessao?.user.email,
      texto: linhasTexto.join("\n"),
      html,
      anexos: print ? [{ nomeArquivo: `print-${Date.now()}.jpg`, conteudo: print, tipo: "image/jpeg" }] : undefined,
    });
  } catch (erro) {
    console.error("[reportar] Falha ao enviar", (erro as Error).message);
    return { erro: "falha" };
  }
  if (sessao) {
    await registrarAuditoria({ acao: "problema_reportado", autor: sessao.user, alvo: sessao.user, detalhes: { pagina: caminho } });
  }
  return { ok: true };
}
