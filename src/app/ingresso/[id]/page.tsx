import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { ingressos, lotes, pedidos, usuarios } from "@/db/schema";
import { traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { vePessoas } from "@/modules/auth/papeis";
import { exigirAdmin, obterSessao } from "@/modules/auth/sessao";
import { nomeDoLote, nomeDoProduto } from "@/modules/ingressos";
import { descreverPagamento } from "@/modules/pagamentos/formas";
import { agruparPorPedido, presencasDosPedidos } from "@/modules/presencas";
import { BotoesPresenca } from "../../_components/botoes-presenca";
import { PaginaPublica } from "../../_components/pagina-publica";
import { RodapeSite } from "../../_components/rodape-site";
import { SiteHeader } from "../../_components/site-header";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

// Destino do QR code do e-mail/Minha área (/ingresso/<id do ingresso ou do pedido>).
// - Organização logada (Organizador, Portaria, Acesso total, com 2 etapas):
//   vê TODOS os dados da pessoa e de todas as compras dela.
// - O próprio comprador logado: vê a sua compra.
// - Qualquer outra pessoa: só a confirmação de que é um código do LPZ, sem
//   nenhum dado pessoal (LGPD — alguém pode fotografar o QR).
export const metadata: Metadata = { title: "LPZ Training", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Ingresso LPZ",
    restrito: "Este é um código do LPZ Training. Os dados do participante só aparecem para a organização do evento.",
    entrarOrg: "Sou da organização — entrar",
    entrarDono: "É seu? Entre na sua conta",
    participante: "Participante",
    nome: "Nome",
    email: "E-mail",
    celular: "Celular",
    nascimento: "Nascimento",
    mora: "Mora em",
    cpf: "CPF",
    semCadastro: "Compra feita sem cadastro completo no site.",
    compras: "Compras",
    pagamento: "Pagamento",
    status: { pago: "Pago", pendente: "Aguardando pagamento", cancelado: "Cancelado", reembolsado: "Reembolsado" } as Record<string, string>,
    ingresso: "Ingresso",
    valido: "Válido",
    usado: (quando: string) => `Entrada registrada em ${quando}`,
    cancelado: "Cancelado",
    semIngresso: "Sem ingresso de entrada (serviço/inscrição)",
    este: "este QR",
    presenca: "Presença",
    checkin: "Ir para o check-in deste ingresso",
    suaCompra: "Sua compra",
    minhaArea: "Ver minha área",
  },
  {
    titulo: "LPZ ticket",
    restrito: "This is an LPZ Training code. Attendee details are only shown to the event organizers.",
    entrarOrg: "I'm an organizer — sign in",
    entrarDono: "Is it yours? Sign in to your account",
    participante: "Attendee",
    nome: "Name",
    email: "Email",
    celular: "Mobile",
    nascimento: "Date of birth",
    mora: "Lives in",
    cpf: "CPF",
    semCadastro: "Purchase made without a complete profile on the site.",
    compras: "Purchases",
    pagamento: "Payment",
    status: { pago: "Paid", pendente: "Awaiting payment", cancelado: "Cancelled", reembolsado: "Refunded" } as Record<string, string>,
    ingresso: "Ticket",
    valido: "Valid",
    usado: (quando: string) => `Entry recorded on ${quando}`,
    cancelado: "Cancelled",
    semIngresso: "No entry ticket (service/registration)",
    este: "this QR",
    presenca: "Attendance",
    checkin: "Go to check-in for this ticket",
    suaCompra: "Your purchase",
    minhaArea: "Go to my area",
  },
  {
    titulo: "Entrada LPZ",
    restrito: "Este es un código de LPZ Training. Los datos del participante solo se muestran a la organización del evento.",
    entrarOrg: "Soy de la organización — entrar",
    entrarDono: "¿Es tuyo? Entra en tu cuenta",
    participante: "Participante",
    nome: "Nombre",
    email: "Correo",
    celular: "Celular",
    nascimento: "Fecha de nacimiento",
    mora: "Vive en",
    cpf: "CPF",
    semCadastro: "Compra hecha sin registro completo en el sitio.",
    compras: "Compras",
    pagamento: "Pago",
    status: { pago: "Pagado", pendente: "Esperando el pago", cancelado: "Cancelado", reembolsado: "Reembolsado" } as Record<string, string>,
    ingresso: "Entrada",
    valido: "Válida",
    usado: (quando: string) => `Entrada registrada el ${quando}`,
    cancelado: "Cancelada",
    semIngresso: "Sin entrada de acceso (servicio/inscripción)",
    este: "este QR",
    presenca: "Asistencia",
    checkin: "Ir al check-in de esta entrada",
    suaCompra: "Tu compra",
    minhaArea: "Ver mi área",
  },
);

// Resultado do registro de presença (só a organização vê).
const VERDE = "border-teal-400 bg-teal-400/15 text-teal-300";
const LARANJA = "border-ember-500 bg-ember-500/15 text-ember-400";
const AVISOS = {
  ok: { texto: "PRESENÇA REGISTRADA", classe: VERDE },
  "ja-registrado": { texto: "JÁ REGISTRADO NESTE DIA", classe: LARANJA },
  "nao-pago": { texto: "PAGAMENTO NÃO CONFIRMADO", classe: LARANJA },
  cancelado: { texto: "INGRESSO CANCELADO", classe: LARANJA },
  "dia-invalido": { texto: "ESTE PRODUTO NÃO VALE PARA ESSE DIA", classe: LARANJA },
  "nao-encontrado": { texto: "COMPRA NÃO ENCONTRADA", classe: LARANJA },
} as const;

// CPF parcial (LGPD: o suficiente para conferir um documento na portaria).
function cpfParcial(cpf: string) {
  const d = cpf.replace(/\D/g, "");
  return `${d.slice(0, 3)}.***.***-${d.slice(9, 11)}`;
}

const classeCaixa = "rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6";

async function localizar(id: string) {
  const ingresso = await db.query.ingressos.findFirst({ where: eq(ingressos.id, id) });
  const pedidoId = ingresso?.pedidoId ?? id;
  const pedido = await db.query.pedidos.findFirst({ where: eq(pedidos.id, pedidoId) });
  return pedido ? { pedido, ingressoId: ingresso?.id ?? null } : null;
}

export default async function Page(props: PageProps<"/ingresso/[id]">) {
  await carregarCatalogo();
  const id = z.uuid().safeParse((await props.params).id);
  if (!id.success) notFound();
  const achado = await localizar(id.data);
  if (!achado) notFound();

  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const sessao = await obterSessao().catch(() => null);
  // Só Organizador, Portaria e Acesso total veem dados da pessoa (Mídias não).
  const organizacao = !!sessao && vePessoas(sessao.user);
  // Organização: confere papel e duas etapas no banco (redireciona se faltar).
  if (organizacao) await exigirAdmin(["organizador", "portaria"]);
  const dono = !organizacao && sessao?.user.email === achado.pedido.email;

  if (!organizacao && !dono) {
    return (
      <>
        <SiteHeader />
        <PaginaPublica titulo={t.titulo} largura="max-w-md">
          <div className={`${classeCaixa} space-y-5 text-center`}>
            <p className="text-mist/90">{t.restrito}</p>
            <div className="flex flex-col gap-3">
              <Link href="/administradores" className="bg-gold-metal rounded-full px-6 py-3 font-semibold text-gold-ink hover:brightness-110">
                {t.entrarOrg}
              </Link>
              <Link href="/congressistas" className="text-sm text-teal-300 hover:underline">{t.entrarDono}</Link>
            </div>
          </div>
        </PaginaPublica>
        <RodapeSite />
      </>
    );
  }

  const email = achado.pedido.email;
  const [pessoa, compras] = await Promise.all([
    organizacao ? db.query.usuarios.findFirst({ where: eq(usuarios.email, email) }) : Promise.resolve(undefined),
    db
      .select({
        pedidoId: pedidos.id,
        status: pedidos.status,
        valorCentavos: pedidos.valorCentavos,
        formaPagamento: pedidos.formaPagamento,
        parcelas: pedidos.parcelas,
        criadoEm: pedidos.criadoEm,
        tipo: lotes.tipo,
        loteNome: lotes.nome,
        ingressoId: ingressos.id,
        ingressoStatus: ingressos.status,
        checkinEm: ingressos.checkinEm,
      })
      .from(pedidos)
      .innerJoin(lotes, eq(lotes.id, pedidos.loteId))
      .leftJoin(ingressos, eq(ingressos.pedidoId, pedidos.id))
      .where(organizacao ? eq(pedidos.email, email) : eq(pedidos.id, achado.pedido.id))
      .orderBy(desc(pedidos.criadoEm)),
  ]);

  const presencasPorPedido = agruparPorPedido(await presencasDosPedidos(compras.map((c) => c.pedidoId)));
  const { r } = await props.searchParams;
  const aviso = organizacao && typeof r === "string" ? AVISOS[r as keyof typeof AVISOS] : undefined;

  const local = pessoa ? [pessoa.cidade, pessoa.uf ?? pessoa.pais].filter(Boolean).join(" — ") : "";
  const dadosPessoa = organizacao
    ? [
        { r: t.nome, v: pessoa?.name ?? achado.pedido.nome },
        { r: t.email, v: email },
        { r: t.celular, v: pessoa?.celular ?? achado.pedido.telefone ?? "—" },
        ...(pessoa?.dataNascimento ? [{ r: t.nascimento, v: pessoa.dataNascimento.split("-").reverse().join("/") }] : []),
        ...(local ? [{ r: t.mora, v: local }] : []),
        ...(pessoa?.cpf ? [{ r: t.cpf, v: cpfParcial(pessoa.cpf) }] : []),
      ]
    : [];

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} largura="max-w-2xl">
        {aviso && (
          <p role="status" className={`rounded-2xl border-2 p-4 text-center text-lg font-extrabold tracking-wide ${aviso.classe}`}>
            {aviso.texto}
          </p>
        )}
        {organizacao && (
          <section className={classeCaixa}>
            <h2 className="font-display text-xs uppercase tracking-[0.15em] text-teal-300">{t.participante}</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {dadosPessoa.map((d) => (
                <div key={d.r}>
                  <dt className="text-xs uppercase tracking-wider text-mist/60">{d.r}</dt>
                  <dd className="break-words font-medium text-white">{d.v}</dd>
                </div>
              ))}
            </dl>
            {!pessoa && <p className="mt-3 text-xs text-mist/60">{t.semCadastro}</p>}
          </section>
        )}

        <section className={classeCaixa}>
          <h2 className="font-display text-xs uppercase tracking-[0.15em] text-teal-300">{organizacao ? t.compras : t.suaCompra}</h2>
          <ul className="mt-4 space-y-3">
            {compras.map((c) => {
              const desteQr = c.pedidoId === achado.pedido.id;
              return (
                <li
                  key={c.pedidoId}
                  className={`rounded-xl border p-4 ${desteQr ? "border-gold-300 ring-1 ring-gold-400" : "border-white/10"}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-gold-300">
                      {nomeDoProduto(c.tipo, idioma)} <span className="text-sm font-normal text-mist/70">· {nomeDoLote(c.loteNome, idioma)}</span>
                    </p>
                    <p className="text-sm text-mist/80">{t.status[c.status] ?? c.status}</p>
                  </div>
                  <p className="mt-1 text-sm text-mist/80">
                    {formatarPreco(c.valorCentavos, idioma)} · {formatarDataHora(c.criadoEm, idioma)}
                  </p>
                  {c.status === "pago" && (
                    <p className="text-sm text-mist/80">
                      {t.pagamento}: {descreverPagamento(c.formaPagamento, c.parcelas, c.valorCentavos, idioma)}
                    </p>
                  )}
                  <p className="mt-2 text-sm">
                    <span className="text-mist/60">{t.ingresso}: </span>
                    <span className={c.ingressoStatus !== "cancelado" ? "text-teal-300" : "text-mist/80"}>
                      {!c.ingressoId
                        ? t.semIngresso
                        : c.ingressoStatus === "cancelado"
                          ? t.cancelado
                          : t.valido}
                    </span>
                    {desteQr && <span className="ml-2 text-xs text-gold-300">({t.este})</span>}
                  </p>
                  {c.status === "pago" && c.ingressoStatus !== "cancelado" && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-xs uppercase tracking-wider text-mist/60">{t.presenca}</p>
                      <BotoesPresenca
                        pedidoId={c.pedidoId}
                        tipo={c.tipo}
                        registros={presencasPorPedido.get(c.pedidoId) ?? []}
                        podeRegistrar={organizacao}
                        voltar="ingresso"
                        qrId={id.data}
                        idioma={idioma}
                      />
                      {!organizacao && !(presencasPorPedido.get(c.pedidoId)?.length) && (
                        <p className="mt-1 text-sm text-mist/70">—</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {dono && (
          <p className="text-center">
            <Link href="/congressistas/minha-area" className="text-sm text-teal-300 hover:underline">{t.minhaArea}</Link>
          </p>
        )}
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
