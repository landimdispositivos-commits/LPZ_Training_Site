import { asc, eq } from "drizzle-orm";
import qrcode from "qrcode-generator";
import { db } from "@/db";
import { cronogramaItens, ingressos, lotes, pedidos, professores } from "@/db/schema";
import { ehIdioma, LOCALE, type Idioma } from "@/i18n";
import { dataCurta, DIAS_EVENTO, diaDaSemana } from "@/lib/dias-evento";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { enviarEmail, escaparHtml } from "@/modules/email";
import { descreverPagamento } from "@/modules/pagamentos/formas";
import { linkInstagram, listarPerfis } from "@/modules/perfis";
import { nomeDoLote, nomeDoProduto, PRODUTOS, type TipoProduto } from "./produtos";

// E-mail completo da compra, enviado assim que o pagamento é aprovado, no
// idioma em que a pessoa estava no site. Traz: dados da compra e forma de
// pagamento, QR code, cronograma, professores e DJs (com o aviso de que tudo
// pode mudar até o dia do evento). A organização pode reenviar a todos pelo
// Financeiro (ex.: dias antes do evento) — sai com a programação atualizada.
//
// O QR leva ao endereço do site /ingresso/<id>: a organização logada vê ali
// todos os dados da pessoa; quem não é da organização não vê dados pessoais.
// Na portaria, o leitor de check-in entende esse endereço.

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
  alerta: "#f26b1d",
};

function urlSite(caminho: string) {
  return `${(process.env.APP_URL ?? "http://localhost:3005").replace(/\/$/, "")}${caminho}`;
}

export function urlDoQr(id: string) {
  return urlSite(`/ingresso/${id}`);
}

// QR em GIF (gerado no servidor, sem serviço externo).
function imagemQr(conteudo: string): Buffer {
  const qr = qrcode(0, "M");
  qr.addData(conteudo);
  qr.make();
  return Buffer.from(qr.createDataURL(6, 4).split(",")[1], "base64");
}

const TEXTOS = {
  pt: {
    assunto: (produto: string) => `Compra confirmada — ${produto} | LPZ Training`,
    ola: (nome: string) => `Olá, ${nome}!`,
    intro: "Seu pagamento foi aprovado. Obrigado por fazer parte do LPZ Training! Aqui está tudo o que você precisa saber.",
    suaCompra: "Sua compra",
    produto: "Produto",
    lote: "Lote",
    valor: "Valor",
    pagamento: "Forma de pagamento",
    data: "Data da compra",
    pedido: "Pedido",
    seuQr: "Seu QR code",
    qrEntrada: "Mostre este QR code na entrada do evento — pode ser no celular, não precisa imprimir.",
    qrServico: "Este QR code identifica a sua compra para a equipe do LPZ.",
    jj: "Sua inscrição no Jack and Jill está confirmada. A organização passa os detalhes da competição.",
    codigo: "Código",
    titular: "Titular",
    pessoal: "O QR code é pessoal: não compartilhe.",
    cronograma: "Cronograma",
    horariosEmBreve: "Horários em breve.",
    professores: "Professores",
    djs: "DJs",
    emBreve: "Em breve.",
    alteracoes:
      "Atenção: cronograma, professores e DJs podem sofrer alterações até o dia do evento. A versão mais atualizada está sempre no site.",
    verArea: "Ver minha área no site",
    rodape: "LPZ Training — congresso de zouk",
    duvidas: "Dúvidas? Responda este e-mail ou use o Fale conosco do site.",
  },
  en: {
    assunto: (produto: string) => `Purchase confirmed — ${produto} | LPZ Training`,
    ola: (nome: string) => `Hi, ${nome}!`,
    intro: "Your payment has been approved. Thank you for being part of LPZ Training! Here is everything you need to know.",
    suaCompra: "Your purchase",
    produto: "Product",
    lote: "Batch",
    valor: "Amount",
    pagamento: "Payment method",
    data: "Purchase date",
    pedido: "Order",
    seuQr: "Your QR code",
    qrEntrada: "Show this QR code at the event entrance — it can be on your phone, no need to print.",
    qrServico: "This QR code identifies your purchase for the LPZ team.",
    jj: "Your Jack and Jill registration is confirmed. The organizers will share the competition details.",
    codigo: "Code",
    titular: "Holder",
    pessoal: "This QR code is personal: do not share it.",
    cronograma: "Schedule",
    horariosEmBreve: "Times coming soon.",
    professores: "Teachers",
    djs: "DJs",
    emBreve: "Coming soon.",
    alteracoes:
      "Please note: the schedule, teachers and DJs may change until the day of the event. The latest version is always on the website.",
    verArea: "Go to my area on the site",
    rodape: "LPZ Training — zouk congress",
    duvidas: "Questions? Reply to this email or use Contact us on the site.",
  },
  es: {
    assunto: (produto: string) => `Compra confirmada — ${produto} | LPZ Training`,
    ola: (nome: string) => `¡Hola, ${nome}!`,
    intro: "Tu pago fue aprobado. ¡Gracias por ser parte de LPZ Training! Aquí tienes todo lo que necesitas saber.",
    suaCompra: "Tu compra",
    produto: "Producto",
    lote: "Lote",
    valor: "Valor",
    pagamento: "Forma de pago",
    data: "Fecha de compra",
    pedido: "Pedido",
    seuQr: "Tu código QR",
    qrEntrada: "Muestra este código QR en la entrada del evento — puede ser en el celular, no hace falta imprimirlo.",
    qrServico: "Este código QR identifica tu compra para el equipo de LPZ.",
    jj: "Tu inscripción en el Jack and Jill está confirmada. La organización compartirá los detalles de la competencia.",
    codigo: "Código",
    titular: "Titular",
    pessoal: "El código QR es personal: no lo compartas.",
    cronograma: "Cronograma",
    horariosEmBreve: "Horarios próximamente.",
    professores: "Profesores",
    djs: "DJs",
    emBreve: "Próximamente.",
    alteracoes:
      "Atención: el cronograma, los profesores y los DJs pueden cambiar hasta el día del evento. La versión más actualizada está siempre en el sitio.",
    verArea: "Ver mi área en el sitio",
    rodape: "LPZ Training — congreso de zouk",
    duvidas: "¿Dudas? Responde este correo o usa Contáctanos en el sitio.",
  },
} satisfies Record<Idioma, unknown>;

// ---- Peças de HTML (tabelas e estilos inline: é o que funciona em e-mail) --

const e = escaparHtml;

function titulo(texto: string) {
  return `<p style="margin:28px 0 10px;font-size:13px;letter-spacing:3px;font-weight:bold;color:${COR.ouro}">${e(texto.toUpperCase())}</p>`;
}

function linha(rotulo: string, valor: string) {
  return `<tr><td style="padding:6px 0;color:${COR.suave};font-size:14px;vertical-align:top">${e(rotulo)}</td><td style="padding:6px 0 6px 12px;text-align:right;font-size:14px;color:${COR.texto};font-weight:bold">${e(valor)}</td></tr>`;
}

function botao(texto: string, url: string) {
  return `<p style="margin:28px 0 4px;text-align:center"><a href="${e(url)}" style="background:${COR.ouro};color:${COR.tinta};padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block">${e(texto)}</a></p>`;
}

function moldura(conteudo: string, idioma: Idioma) {
  const t = TEXTOS[idioma];
  return `<!DOCTYPE html>
<html lang="${LOCALE[idioma]}"><body style="margin:0;padding:0;background:${COR.fundo}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo};padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Arial,Helvetica,sans-serif;color:${COR.texto}">
<tr><td align="center" style="padding:8px 0 20px">
<div style="font-size:22px;letter-spacing:8px;font-weight:bold;color:${COR.ouro}">LPZ</div>
<div style="font-size:12px;letter-spacing:10px;color:${COR.texto};margin-top:4px">TRAINING</div>
</td></tr>
<tr><td style="background:${COR.cartao};border:1px solid ${COR.borda};border-top:3px solid ${COR.ouro};border-radius:16px;padding:28px 24px">
${conteudo}
</td></tr>
<tr><td align="center" style="padding:20px 8px;font-size:12px;color:${COR.suave}">
${e(t.rodape)}<br>${e(t.duvidas)}
</td></tr>
</table></td></tr></table></body></html>`;
}

// ---- Dados ------------------------------------------------------------------

type DadosPedido = {
  pedidoId: string;
  nome: string;
  email: string;
  status: string;
  valorCentavos: number;
  atualizadoEm: Date;
  idioma: Idioma;
  formaPagamento: string | null;
  parcelas: number | null;
  tipo: TipoProduto;
  loteNome: string;
};

async function carregarPedido(pedidoId: string): Promise<DadosPedido | null> {
  const p = await db
    .select({
      pedidoId: pedidos.id,
      nome: pedidos.nome,
      email: pedidos.email,
      status: pedidos.status,
      valorCentavos: pedidos.valorCentavos,
      atualizadoEm: pedidos.atualizadoEm,
      idioma: pedidos.idioma,
      formaPagamento: pedidos.formaPagamento,
      parcelas: pedidos.parcelas,
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

async function programacao() {
  const [cronograma, listaProfessores, listaDjs] = await Promise.all([
    db
      .select({
        dia: cronogramaItens.dia,
        horarioInicio: cronogramaItens.horarioInicio,
        horarioFim: cronogramaItens.horarioFim,
        titulo: cronogramaItens.titulo,
        local: cronogramaItens.local,
        professorNome: professores.nome,
      })
      .from(cronogramaItens)
      .leftJoin(professores, eq(cronogramaItens.professorId, professores.id))
      .orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio), asc(cronogramaItens.ordem)),
    listarPerfis("professor"),
    listarPerfis("dj"),
  ]);
  return { cronograma, listaProfessores, listaDjs };
}

function blocoCronograma(itens: Awaited<ReturnType<typeof programacao>>["cronograma"], idioma: Idioma) {
  const t = TEXTOS[idioma];
  const en = idioma === "en";
  return DIAS_EVENTO.map((d) => {
    const doDia = itens.filter((i) => diaDaSemana(i.dia) === d.semana);
    const datas = [...new Set(doDia.map((i) => dataCurta(i.dia, en)))].join(" · ");
    const linhas = doDia.length
      ? doDia
          .map(
            (i) =>
              `<tr><td style="padding:6px 10px 6px 0;color:${COR.agua};font-size:13px;white-space:nowrap;vertical-align:top">${e(i.horarioInicio)}${i.horarioFim ? `–${e(i.horarioFim)}` : ""}</td><td style="padding:6px 0;font-size:14px"><strong>${e(i.titulo)}</strong>${
                i.professorNome || i.local
                  ? `<br><span style="color:${COR.suave};font-size:12px">${e([i.professorNome, i.local].filter(Boolean).join(" · "))}</span>`
                  : ""
              }</td></tr>`,
          )
          .join("")
      : `<tr><td style="padding:6px 0;color:${COR.suave};font-size:13px">${e(t.horariosEmBreve)}</td></tr>`;
    return `<div style="margin:0 0 12px;border:1px solid ${COR.borda};border-radius:12px;padding:12px 14px">
<p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:${COR.ouroClaro}">${e(d[idioma])}${datas ? ` <span style="color:${COR.agua};font-weight:normal">${e(datas)}</span>` : ""}</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${linhas}</table></div>`;
  }).join("");
}

function blocoPerfis(lista: Awaited<ReturnType<typeof listarPerfis>>, idioma: Idioma) {
  const t = TEXTOS[idioma];
  if (lista.length === 0) return `<p style="color:${COR.suave};font-size:13px">${e(t.emBreve)}</p>`;
  // Duas colunas: funciona bem no celular e no computador.
  const celulas = lista.map((p) => {
    const insta = linkInstagram(p.instagram);
    return `<td width="50%" style="padding:4px;vertical-align:top"><div style="border:1px solid ${COR.borda};border-radius:10px;padding:10px 12px">
<div style="font-size:13px;font-weight:bold;color:${COR.texto}">${e(p.nome)}</div>
${insta ? `<a href="${e(insta)}" style="font-size:12px;color:${COR.agua};text-decoration:none">${e(p.instagram ?? "")}</a>` : ""}
</div></td>`;
  });
  const linhas: string[] = [];
  for (let i = 0; i < celulas.length; i += 2) linhas.push(`<tr>${celulas[i]}${celulas[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${linhas.join("")}</table>`;
}

// ---- Envio ------------------------------------------------------------------

export async function enviarEmailCompra(pedidoId: string) {
  const d = await carregarPedido(pedidoId);
  if (!d || d.status !== "pago") return false;
  const ingresso = await db.query.ingressos.findFirst({ where: eq(ingressos.pedidoId, pedidoId) });
  if (ingresso && ingresso.status === "cancelado") return false;

  const t = TEXTOS[d.idioma];
  const en = d.idioma === "en";
  const produto = nomeDoProduto(d.tipo, d.idioma);
  const primeiroNome = d.nome.split(" ")[0];
  const valor = formatarPreco(d.valorCentavos, d.idioma);
  const forma = descreverPagamento(d.formaPagamento, d.parcelas, d.valorCentavos, d.idioma);
  const data = formatarDataHora(d.atualizadoEm, d.idioma);
  const idQr = ingresso?.id ?? d.pedidoId;
  const codigo = idQr.slice(0, 8).toUpperCase();
  const entrada = PRODUTOS[d.tipo].entrada;
  const { cronograma, listaProfessores, listaDjs } = await programacao();

  const html = moldura(
    `<p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:${COR.ouroClaro}">${e(t.ola(primeiroNome))}</p>
<p style="margin:0;font-size:15px;line-height:1.5">${e(t.intro)}</p>

${titulo(t.suaCompra)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COR.borda};border-bottom:1px solid ${COR.borda}">
${linha(t.produto, produto)}${linha(t.lote, nomeDoLote(d.loteNome, d.idioma))}${linha(t.valor, valor)}${linha(t.pagamento, forma)}${linha(t.data, data)}${linha(t.pedido, d.pedidoId.slice(0, 8).toUpperCase())}
</table>
${d.tipo === "jack_and_jill" ? `<p style="margin:14px 0 0;font-size:14px;color:${COR.agua}">${e(t.jj)}</p>` : ""}

${titulo(t.seuQr)}
<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr><td style="background:#ffffff;border-radius:16px;padding:12px;border:3px solid ${COR.ouro}">
<img src="cid:qr-compra" width="220" height="220" alt="QR code" style="display:block;width:220px;height:220px">
</td></tr></table>
<p style="margin:14px 0 0;text-align:center;font-family:'Courier New',monospace;font-size:24px;letter-spacing:6px;font-weight:bold">${codigo}</p>
<p style="margin:4px 0 0;text-align:center;font-size:13px;color:${COR.suave}">${e(t.titular)}: ${e(d.nome)}</p>
<p style="margin:12px 0 0;text-align:center;font-size:14px;line-height:1.5">${e(entrada ? t.qrEntrada : t.qrServico)}</p>
<p style="margin:6px 0 0;text-align:center;font-size:12px;color:${COR.suave}">${e(t.pessoal)}</p>

<div style="margin:28px 0 0;border:1px solid ${COR.alerta};border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.5;color:${COR.texto};background:rgba(242,107,29,0.08)">⚠ ${e(t.alteracoes)}</div>

${titulo(t.cronograma)}
${blocoCronograma(cronograma, d.idioma)}

${titulo(t.professores)}
${blocoPerfis(listaProfessores, d.idioma)}

${titulo(t.djs)}
${blocoPerfis(listaDjs, d.idioma)}

${botao(t.verArea, urlSite("/congressistas/minha-area"))}`,
    d.idioma,
  );

  const textoCronograma = DIAS_EVENTO.map((dia) => {
    const doDia = cronograma.filter((i) => diaDaSemana(i.dia) === dia.semana);
    const itens = doDia.length
      ? doDia.map((i) => `  ${i.horarioInicio}${i.horarioFim ? `-${i.horarioFim}` : ""} ${i.titulo}${i.professorNome ? ` (${i.professorNome})` : ""}`).join("\n")
      : `  ${t.horariosEmBreve}`;
    return `${dia[d.idioma]}\n${itens}`;
  }).join("\n");

  const texto = [
    t.ola(primeiroNome),
    "",
    t.intro,
    "",
    `${t.suaCompra.toUpperCase()}`,
    `${t.produto}: ${produto}`,
    `${t.lote}: ${nomeDoLote(d.loteNome, d.idioma)}`,
    `${t.valor}: ${valor}`,
    `${t.pagamento}: ${forma}`,
    `${t.data}: ${data}`,
    `${t.codigo}: ${codigo}`,
    "",
    entrada ? t.qrEntrada : t.qrServico,
    "",
    t.alteracoes,
    "",
    t.cronograma.toUpperCase(),
    textoCronograma,
    "",
    `${t.professores.toUpperCase()}: ${listaProfessores.map((p) => p.nome).join(", ") || t.emBreve}`,
    `${t.djs.toUpperCase()}: ${listaDjs.map((p) => p.nome).join(", ") || t.emBreve}`,
    "",
    urlSite("/congressistas/minha-area"),
  ].join("\n");

  await enviarEmail({
    para: d.email,
    assunto: t.assunto(produto),
    texto,
    html,
    anexos: [{ nomeArquivo: `lpz-${codigo}.gif`, conteudo: imagemQr(urlDoQr(idQr)), tipo: "image/gif", cid: "qr-compra" }],
  });
  return true;
}

// Chamado quando o pagamento é confirmado. Não trava a confirmação: se o
// e-mail falhar, só registra (a compra continua na Minha área).
export function enviarEmailsDaCompra(pedidoId: string) {
  enviarEmailCompra(pedidoId).catch((erro: unknown) => {
    console.error("[email] Falha ao enviar e-mail da compra", { pedidoId, erro: (erro as Error)?.message });
  });
}

// Reenvio em massa (organização, ex.: dias antes do evento): o e-mail
// completo, com a programação atualizada, para todas as compras pagas.
export async function reenviarTodosOsIngressos() {
  const pagos = await db.select({ id: pedidos.id }).from(pedidos).where(eq(pedidos.status, "pago"));
  let enviados = 0;
  for (const p of pagos) {
    try {
      if (await enviarEmailCompra(p.id)) enviados++;
    } catch (erro) {
      console.error("[email] Falha ao reenviar", { pedidoId: p.id, erro: (erro as Error).message });
    }
  }
  return { total: pagos.length, enviados };
}
