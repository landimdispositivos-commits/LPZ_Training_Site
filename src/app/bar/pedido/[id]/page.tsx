import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "react-qr-code";
import { LOCALE, traducoes } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { formatarPreco } from "@/lib/formatar";
import { obterSessao } from "@/modules/auth/sessao";
import { confirmarPedidoOnline, liberarReservasVencidas, pedidoDoCliente } from "@/modules/bar/online";
import { paymentProvider } from "@/modules/pagamentos";
import { FakePaymentProvider } from "@/modules/pagamentos/fake-payment-provider";
import { MAX_PARCELAS } from "@/modules/pagamentos/formas";
import { LimparSacola } from "../limpar-sacola";
import { cartaoVencido, cartoesDoCliente, rotuloBandeira } from "@/modules/bar/cartoes";
import { OpcoesPagamento } from "../opcoes-pagamento";
import { SiteHeader } from "../../../_components/site-header";
import { cancelarPedidoOnlineAction } from "../actions";

export const metadata: Metadata = { title: "Pedido do Bar — LPZ Training" };

const T = traducoes(
  {
    titulo: "Pedido do Bar",
    resumo: "Resumo",
    total: "Total",
    reservado: (h: string) => `Seus itens ficam reservados até ${h}.`,
    pagar: "Pagar com Pix ou cartão",
    jaPaguei: "Já paguei: atualizar",
    cancelar: "Cancelar pedido",
    teste: "Modo de teste: o Mercado Pago ainda não está conectado, nenhum dinheiro é cobrado.",
    forma: "Forma de pagamento",
    parcelas: "Parcelas",
    aprovar: (v: string) => `Simular pagamento de ${v}`,
    recusar: "Simular pagamento recusado",
    pagoTitulo: "Pagamento confirmado!",
    pagoTexto: "Mostre este QR code no balcão do bar para retirar o seu pedido.",
    aguardando: "AGUARDANDO RETIRADA",
    parcial: "RETIRADA PARCIAL",
    retirados: (a: number, b: number) => `retirados ${a} de ${b}`,
    entregue: "ENTREGUE",
    cancelado: "CANCELADO",
    expirado: "A reserva venceu e o pedido foi cancelado. Você pode fazer um novo pedido no cardápio.",
    canceladoMsg: "Pedido cancelado.",
    problema: "Recebemos o seu pagamento, mas os itens acabaram. A organização vai devolver o valor. Desculpe o transtorno.",
    voltar: "Voltar ao cardápio",
    pedidos: "Meus pedidos",
    seguro: "Pagamento processado pelo Mercado Pago. Os dados do cartão são digitados na página do Mercado Pago e nunca passam pelo nosso site.",
  },
  {
    titulo: "Bar order",
    resumo: "Summary",
    total: "Total",
    reservado: (h: string) => `Your items are held until ${h}.`,
    pagar: "Pay with Pix or card",
    jaPaguei: "I've paid: refresh",
    cancelar: "Cancel order",
    teste: "Test mode: Mercado Pago is not connected yet, no money is charged.",
    forma: "Payment method",
    parcelas: "Installments",
    aprovar: (v: string) => `Simulate payment of ${v}`,
    recusar: "Simulate declined payment",
    pagoTitulo: "Payment confirmed!",
    pagoTexto: "Show this QR code at the bar counter to pick up your order.",
    aguardando: "READY FOR PICKUP",
    parcial: "PARTIALLY PICKED UP",
    retirados: (a: number, b: number) => `picked up ${a} of ${b}`,
    entregue: "DELIVERED",
    cancelado: "CANCELLED",
    expirado: "The hold expired and the order was cancelled. You can place a new order from the menu.",
    canceladoMsg: "Order cancelled.",
    problema: "We received your payment, but the items ran out. The organizers will refund you. Sorry for the inconvenience.",
    voltar: "Back to the menu",
    pedidos: "My orders",
    seguro: "Payment processed by Mercado Pago. Card details are entered on Mercado Pago's page and never pass through our site.",
  },
  {
    titulo: "Pedido del Bar",
    resumo: "Resumen",
    total: "Total",
    reservado: (h: string) => `Tus artículos quedan reservados hasta las ${h}.`,
    pagar: "Pagar con Pix o tarjeta",
    jaPaguei: "Ya pagué: actualizar",
    cancelar: "Cancelar pedido",
    teste: "Modo de prueba: Mercado Pago aún no está conectado, no se cobra dinero.",
    forma: "Forma de pago",
    parcelas: "Cuotas",
    aprovar: (v: string) => `Simular pago de ${v}`,
    recusar: "Simular pago rechazado",
    pagoTitulo: "¡Pago confirmado!",
    pagoTexto: "Muestra este código QR en el mostrador del bar para retirar tu pedido.",
    aguardando: "LISTO PARA RETIRAR",
    parcial: "RETIRO PARCIAL",
    retirados: (a: number, b: number) => `retirados ${a} de ${b}`,
    entregue: "ENTREGADO",
    cancelado: "CANCELADO",
    expirado: "La reserva venció y el pedido fue cancelado. Puedes hacer un nuevo pedido desde la carta.",
    canceladoMsg: "Pedido cancelado.",
    problema: "Recibimos tu pago, pero los artículos se agotaron. La organización devolverá el valor. Disculpa las molestias.",
    voltar: "Volver a la carta",
    pedidos: "Mis pedidos",
    seguro: "Pago procesado por Mercado Pago. Los datos de la tarjeta se ingresan en la página de Mercado Pago y nunca pasan por nuestro sitio.",
  },
);

export default async function Page(props: PageProps<"/bar/pedido/[id]">) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas");
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const idioma = await obterIdioma();
  const t = T[idioma];

  await liberarReservasVencidas();
  let pedido = await pedidoDoCliente(id, sessao.user.id);
  if (!pedido) notFound();
  // Pix pago depois de fechar a página: confirma ao abrir.
  if (pedido.status === "pendente" && pedido.preferenceId) {
    try {
      await confirmarPedidoOnline(pedido.id);
      pedido = (await pedidoDoCliente(id, sessao.user.id)) ?? pedido;
    } catch (erro) {
      console.error("Falha ao confirmar pedido online", (erro as Error).message);
    }
  }

  const cartoes = pedido.status === "pendente" && paymentProvider.suportaCartaoSalvo ? await cartoesDoCliente(sessao.user.id) : [];
  const chavePublica = process.env.MERCADOPAGO_PUBLIC_KEY?.trim() || null;
  const simulado = process.env.TEST_MODE === "true" && paymentProvider instanceof FakePaymentProvider;
  const urlTicket = pedido.ticket ? `${(process.env.APP_URL ?? "http://localhost:3005").replace(/\/$/, "")}/bar/ticket/${pedido.ticket.codigo}` : null;
  const hora = pedido.expiraEm.toLocaleTimeString(LOCALE[idioma], { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const statusTicket = pedido.ticket?.status === "entregue" ? t.entregue : pedido.ticket?.status === "cancelado" ? t.cancelado : pedido.ticket?.status === "parcial" ? t.parcial : t.aguardando;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-md space-y-5">
          <LimparSacola eventoId={pedido.eventoId} />
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal">{t.titulo}</h1>
            <Link href="/bar/pedidos" className="text-sm text-teal-300 hover:underline">{t.pedidos}</Link>
          </div>

          {pedido.status === "pago" && (
            <p role="status" className="rounded-lg border border-teal-400/50 bg-teal-400/10 px-4 py-3 text-sm text-mist"><strong>{t.pagoTitulo}</strong> {t.pagoTexto}</p>
          )}
          {pedido.status === "expirado" && <p className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm text-mist">{t.expirado}</p>}
          {pedido.status === "cancelado" && <p className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm text-mist">{t.canceladoMsg}</p>}
          {pedido.status === "precisa_estorno" && <p role="alert" className="rounded-lg border border-ember-500/50 bg-ember-500/10 px-4 py-3 text-sm text-mist">{t.problema}</p>}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/90 p-5">
            {pedido.status === "pago" && urlTicket && (
              <div className="mb-4 space-y-3 text-center">
                <p className="rounded-xl border-2 border-gold-400 bg-gold-400/10 px-4 py-2 font-extrabold text-gold-300">{statusTicket}</p>
                <div className="inline-block rounded-xl bg-white p-3"><QRCode value={urlTicket} size={176} aria-label={`QR ${pedido.ticket!.codigo}`} /></div>
                <p className="font-mono text-2xl font-bold tracking-[0.3em] text-white">{pedido.ticket!.codigo}</p>
              </div>
            )}
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">{t.resumo}</h2>
            <ul className="mt-3 divide-y divide-white/10 text-sm">
              {pedido.itens.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2">
                  <span className="text-white">
                    {i.quantidade}× {i.nome}
                    {pedido.status === "pago" && (
                      <span className="block text-xs text-mist/60">{t.retirados(pedido.entrega.find((e) => e.nome === i.nome)?.retirados ?? 0, i.quantidade)}</span>
                    )}
                  </span>
                  <span className="text-mist">{formatarPreco(i.quantidade * i.precoUnitCentavos, idioma)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
              <span>{t.total}</span><span>{formatarPreco(pedido.totalCentavos, idioma)}</span>
            </p>
            {pedido.status === "pendente" && <p className="mt-3 text-xs text-mist/60">{t.reservado(hora)}</p>}
          </section>

          {pedido.status === "pendente" && (
            <>
              <OpcoesPagamento
                pedidoId={pedido.id}
                totalCentavos={pedido.totalCentavos}
                simulado={simulado}
                checkoutUrl={pedido.checkoutUrl}
                chavePublica={chavePublica}
                maxParcelas={MAX_PARCELAS}
                cartoes={cartoes.map((c) => ({
                  id: c.id,
                  rotulo: rotuloBandeira(c.bandeira),
                  bandeira: c.bandeira,
                  ultimos4: c.ultimos4,
                  padrao: c.padrao,
                  vencido: cartaoVencido(c.validade),
                  gatewayCartaoId: c.gatewayCartaoId,
                }))}
              />
              <p className="text-center text-sm">
                <Link href="/bar/cartoes" className="text-teal-300 underline">
                  {idioma === "en" ? "Manage my saved cards" : idioma === "es" ? "Administrar mis tarjetas" : "Gerenciar meus cartões salvos"}
                </Link>
              </p>
              <form action={cancelarPedidoOnlineAction} className="text-center">
                <input type="hidden" name="id" value={pedido.id} />
                <button type="submit" className="text-sm text-mist/70 underline hover:text-white">{t.cancelar}</button>
              </form>
            </>
          )}

          <p className="text-center text-sm"><Link href="/bar" className="text-teal-300 hover:underline">{t.voltar}</Link></p>
        </div>
      </main>
    </>
  );
}
