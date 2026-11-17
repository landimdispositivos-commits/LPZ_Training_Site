import { eq } from "drizzle-orm";
import qrcode from "qrcode-generator";
import { db } from "@/db";
import { ingressos, lotes, pedidos } from "@/db/schema";
import { ehIdioma, type Idioma } from "@/i18n";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { enviarEmail, escaparHtml } from "@/modules/email";
import { nomeDoProduto, PRODUTOS, type TipoProduto } from "./produtos";

// E-mails da compra, no idioma em que a pessoa estava no site:
// 1. Confirmação da compra (todo produto pago).
// 2. Ingresso com QR code (só produtos de entrada) — também reenviado pela
//    organização dias antes do evento (Financeiro → Enviar ingressos).
// O QR contém só o id do ingresso; a portaria sempre confere no banco.

const COR = {
  fundo: "#04161b",
  cartao: "#072a31",
  borda: "#11525c",
  ouro: "#e6b54a",
  ouroClaro: "#f5d27a",
  agua: "#7fe0d8",
  texto: "#e8f4f3",
  suave: "#9fb9b7",
  tinta: "#1a1204",
};

function urlSite(caminho: string) {
  return `${(process.env.APP_URL ?? "http://localhost:3005").replace(/\/$/, "")}${caminho}`;
}

function codigoCurto(ingressoId: string) {
  return ingressoId.slice(0, 8).toUpperCase();
}

// QR em GIF (gerado no servidor, sem serviço externo).
function imagemQr(conteudo: string): Buffer {
  const qr = qrcode(0, "M");
  qr.addData(conteudo);
  qr.make();
  const dataUrl = qr.createDataURL(8, 4);
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

const TEXTOS = {
  pt: {
    assuntoCompra: (produto: string) => `Compra confirmada — ${produto} | LPZ Training`,
    assuntoIngresso: (produto: string) => `Seu ingresso — ${produto} | LPZ Training`,
    ola: (nome: string) => `Olá, ${nome}!`,
    compraOk: "Seu pagamento foi aprovado. Obrigado por fazer parte do LPZ Training!",
    produto: "Produto",
    lote: "Lote",
    valor: "Valor",
    data: "Data",
    pedido: "Pedido",
    proximoIngresso: "Seu ingresso com o QR code de entrada chega em um e-mail separado e também fica na sua área do site.",
    proximoJJ: "Sua inscrição no Jack and Jill está confirmada. A organização passa os detalhes da competição.",
    proximoServico: "A equipe do LPZ entra em contato sobre o serviço.",
    verArea: "Ver minha área",
    seuIngresso: "Seu ingresso",
    mostre: "Mostre este QR code na entrada do evento. Pode ser no celular — não precisa imprimir.",
    codigo: "Código do ingresso (se a câmera falhar)",
    titular: "Titular",
    pessoal: "O ingresso é pessoal: guarde este e-mail e não compartilhe o QR code.",
    rodape: "LPZ Training — congresso de zouk",
    duvidas: "Dúvidas? Responda este e-mail.",
  },
  en: {
    assuntoCompra: (produto: string) => `Purchase confirmed — ${produto} | LPZ Training`,
    assuntoIngresso: (produto: string) => `Your ticket — ${produto} | LPZ Training`,
    ola: (nome: string) => `Hi, ${nome}!`,
    compraOk: "Your payment has been approved. Thank you for being part of LPZ Training!",
    produto: "Product",
    lote: "Batch",
    valor: "Amount",
    data: "Date",
    pedido: "Order",
    proximoIngresso: "Your ticket with the entry QR code arrives in a separate email and is also available in your area on the site.",
    proximoJJ: "Your Jack and Jill registration is confirmed. The organizers will share the competition details.",
    proximoServico: "The LPZ team will contact you about the service.",
    verArea: "Go to my area",
    seuIngresso: "Your ticket",
    mostre: "Show this QR code at the event entrance. It can be on your phone — no need to print.",
    codigo: "Ticket code (if the camera fails)",
    titular: "Ticket holder",
    pessoal: "This ticket is personal: keep this email and do not share the QR code.",
    rodape: "LPZ Training — zouk congress",
    duvidas: "Questions? Just reply to this email.",
  },
} satisfies Record<Idioma, unknown>;

// Moldura comum (tabelas e estilos inline: é o que funciona nos e-mails).
function moldura(conteudo: string, idioma: Idioma) {
  const t = TEXTOS[idioma];
  return `<!DOCTYPE html>
<html lang="${idioma === "en" ? "en" : "pt-BR"}"><body style="margin:0;padding:0;background:${COR.fundo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Arial,Helvetica,sans-serif;color:${COR.texto}">
<tr><td align="center" style="padding:8px 0 20px">
<div style="font-size:22px;letter-spacing:8px;font-weight:bold;color:${COR.ouro}">LPZ</div>
<div style="font-size:12px;letter-spacing:10px;color:${COR.texto};margin-top:4px">TRAINING</div>
</td></tr>
<tr><td style="background:${COR.cartao};border:1px solid ${COR.borda};border-top:3px solid ${COR.ouro};border-radius:16px;padding:28px 24px">
${conteudo}
</td></tr>
<tr><td align="center" style="padding:20px 8px;font-size:12px;color:${COR.suave}">
${escaparHtml(t.rodape)}<br>${escaparHtml(t.duvidas)}
</td></tr>
</table></td></tr></table></body></html>`;
}

function botao(texto: string, url: string) {
  return `<p style="margin:24px 0 4px;text-align:center"><a href="${escaparHtml(url)}" style="background:${COR.ouro};color:${COR.tinta};padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block">${escaparHtml(texto)}</a></p>`;
}

function linha(rotulo: string, valor: string) {
  return `<tr><td style="padding:6px 0;color:${COR.suave};font-size:14px">${escaparHtml(rotulo)}</td><td style="padding:6px 0;text-align:right;font-size:14px;color:${COR.texto};font-weight:bold">${escaparHtml(valor)}</td></tr>`;
}

type DadosPedido = {
  pedidoId: string;
  nome: string;
  email: string;
  valorCentavos: number;
  atualizadoEm: Date;
  idioma: Idioma;
  tipo: TipoProduto;
  loteNome: string;
};

async function carregarPedido(pedidoId: string): Promise<DadosPedido | null> {
  const p = await db
    .select({
      pedidoId: pedidos.id,
      nome: pedidos.nome,
      email: pedidos.email,
      valorCentavos: pedidos.valorCentavos,
      atualizadoEm: pedidos.atualizadoEm,
      idioma: pedidos.idioma,
      tipo: lotes.tipo,
      loteNome: lotes.nome,
    })
    .from(pedidos)
    .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
    .where(eq(pedidos.id, pedidoId))
    .then((r) => r[0]);
  if (!p) return null;
  return { ...p, idioma: ehIdioma(p.idioma) ? p.idioma : "pt" };
}

export async function enviarEmailConfirmacao(d: DadosPedido) {
  const t = TEXTOS[d.idioma];
  const produto = nomeDoProduto(d.tipo, d.idioma);
  const primeiroNome = d.nome.split(" ")[0];
  const proximo = PRODUTOS[d.tipo].entrada ? t.proximoIngresso : d.tipo === "jack_and_jill" ? t.proximoJJ : t.proximoServico;
  const valor = formatarPreco(d.valorCentavos, d.idioma);
  const data = formatarDataHora(d.atualizadoEm, d.idioma);
  const pedido = d.pedidoId.slice(0, 8).toUpperCase();

  const html = moldura(
    `<p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:${COR.ouroClaro}">${escaparHtml(t.ola(primeiroNome))}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5">${escaparHtml(t.compraOk)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COR.borda};border-bottom:1px solid ${COR.borda};padding:8px 0">
${linha(t.produto, produto)}${linha(t.lote, d.loteNome)}${linha(t.valor, valor)}${linha(t.data, data)}${linha(t.pedido, pedido)}
</table>
<p style="margin:20px 0 0;font-size:14px;line-height:1.5;color:${COR.agua}">${escaparHtml(proximo)}</p>
${botao(t.verArea, urlSite("/congressistas/minha-area"))}`,
    d.idioma,
  );
  const texto = [
    t.ola(primeiroNome),
    "",
    t.compraOk,
    "",
    `${t.produto}: ${produto}`,
    `${t.lote}: ${d.loteNome}`,
    `${t.valor}: ${valor}`,
    `${t.data}: ${data}`,
    `${t.pedido}: ${pedido}`,
    "",
    proximo,
    urlSite("/congressistas/minha-area"),
    "",
    t.rodape,
  ].join("\n");

  await enviarEmail({ para: d.email, assunto: t.assuntoCompra(produto), texto, html });
}

export async function enviarEmailIngresso(ingressoId: string) {
  const dados = await db
    .select({ pedidoId: ingressos.pedidoId, status: ingressos.status })
    .from(ingressos)
    .where(eq(ingressos.id, ingressoId))
    .then((r) => r[0]);
  if (!dados || dados.status !== "valido") return false;
  const d = await carregarPedido(dados.pedidoId);
  if (!d) return false;

  const t = TEXTOS[d.idioma];
  const produto = nomeDoProduto(d.tipo, d.idioma);
  const codigo = codigoCurto(ingressoId);

  const html = moldura(
    `<p style="margin:0;text-align:center;font-size:12px;letter-spacing:4px;color:${COR.agua}">${escaparHtml(t.seuIngresso.toUpperCase())}</p>
<p style="margin:6px 0 4px;text-align:center;font-size:24px;font-weight:bold;letter-spacing:2px;color:${COR.ouroClaro}">${escaparHtml(produto.toUpperCase())}</p>
<p style="margin:0 0 20px;text-align:center;font-size:13px;color:${COR.suave}">${escaparHtml(d.loteNome)}</p>
<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#ffffff;border-radius:16px;padding:14px;border:3px solid ${COR.ouro}">
<img src="cid:qr-ingresso" width="240" height="240" alt="QR code" style="display:block;width:240px;height:240px">
</td></tr></table>
<p style="margin:18px 0 2px;text-align:center;font-size:12px;color:${COR.suave}">${escaparHtml(t.codigo)}</p>
<p style="margin:0;text-align:center;font-family:'Courier New',monospace;font-size:28px;letter-spacing:6px;font-weight:bold;color:${COR.texto}">${codigo}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid ${COR.borda};padding-top:8px">
${linha(t.titular, d.nome)}
</table>
<p style="margin:18px 0 0;font-size:14px;line-height:1.5;text-align:center">${escaparHtml(t.mostre)}</p>
<p style="margin:10px 0 0;font-size:12px;line-height:1.5;text-align:center;color:${COR.suave}">${escaparHtml(t.pessoal)}</p>
${botao(t.verArea, urlSite("/congressistas/minha-area"))}`,
    d.idioma,
  );
  const texto = [
    t.ola(d.nome.split(" ")[0]),
    "",
    `${t.seuIngresso}: ${produto} (${d.loteNome})`,
    `${t.codigo}: ${codigo}`,
    `${t.titular}: ${d.nome}`,
    "",
    t.mostre,
    t.pessoal,
    urlSite("/congressistas/minha-area"),
  ].join("\n");

  await enviarEmail({
    para: d.email,
    assunto: t.assuntoIngresso(produto),
    texto,
    html,
    anexos: [{ nomeArquivo: `ingresso-${codigo}.gif`, conteudo: imagemQr(ingressoId), tipo: "image/gif", cid: "qr-ingresso" }],
  });
  return true;
}

// Chamado quando o pagamento é confirmado. Não trava a confirmação: se o
// e-mail falhar, só registra (o ingresso continua na Minha área).
export function enviarEmailsDaCompra(pedidoId: string) {
  (async () => {
    const d = await carregarPedido(pedidoId);
    if (!d) return;
    await enviarEmailConfirmacao(d);
    const ingresso = await db.query.ingressos.findFirst({ where: eq(ingressos.pedidoId, pedidoId) });
    if (ingresso) await enviarEmailIngresso(ingresso.id);
  })().catch((erro: unknown) => {
    console.error("[email] Falha ao enviar e-mails da compra", { pedidoId, erro: (erro as Error)?.message });
  });
}

// Reenvio em massa (organização, dias antes do evento): todos os ingressos
// válidos ainda sem check-in. Devolve quantos e-mails saíram.
export async function reenviarTodosOsIngressos() {
  const validos = await db.select({ id: ingressos.id }).from(ingressos).where(eq(ingressos.status, "valido"));
  let enviados = 0;
  for (const i of validos) {
    try {
      if (await enviarEmailIngresso(i.id)) enviados++;
    } catch (erro) {
      console.error("[email] Falha ao reenviar ingresso", { ingressoId: i.id, erro: (erro as Error).message });
    }
  }
  return { total: validos.length, enviados };
}
