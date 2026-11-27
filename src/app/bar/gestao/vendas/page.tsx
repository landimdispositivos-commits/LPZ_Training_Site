import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { barCaixas, barComandas, barTickets, barVendas } from "@/db/schema";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao } from "@/modules/bar";
import { pedidosComProblema } from "@/modules/bar/online";
import { totaisPorForma, totaisPorOrigem, ROTULO_FORMA } from "@/modules/bar/caixa";
import { comandasAbertas } from "@/modules/bar/comanda";
import { classeInput } from "../../../_components/form-ui";
import { GestaoShell, SemEvento } from "../../_components/gestao-shell";
import { estornarVendaAction } from "../../caixa/actions";
import { devolverPedidoOnlineAction } from "../actions";

export const metadata: Metadata = { title: "Bar — Vendas e caixas — LPZ Training" };

export default async function Page(props: PageProps<"/bar/gestao/vendas">) {
  const { user } = await exigirBar(["gestao", "caixa"]);
  const gestor = acessoBar(user).gestao;
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);

  const problemas = evento ? await pedidosComProblema(evento.id) : [];
  const origens = evento ? await totaisPorOrigem(evento.id) : [];
  const abertas = evento?.usaComanda ? await comandasAbertas(evento.id) : [];
  const aReceber = abertas.reduce((s, c) => s + c.total, 0);
  const [totais, caixas, vendas] = evento
    ? await Promise.all([
        totaisPorForma({ eventoId: evento.id }),
        db.select().from(barCaixas).where(eq(barCaixas.eventoId, evento.id)).orderBy(desc(barCaixas.abertoEm)),
        db
          .select({
            id: barVendas.id,
            numero: barVendas.numero,
            criadoEm: barVendas.criadoEm,
            operador: barVendas.operadorNome,
            forma: barVendas.formaPagamento,
            total: barVendas.totalCentavos,
            custo: barVendas.custoTotalCentavos,
            origem: barVendas.origem,
            comandaNumero: barComandas.numero,
            status: barVendas.status,
            motivo: barVendas.motivoEstorno,
            ticket: barTickets.status,
            codigo: barTickets.codigo,
          })
          .from(barVendas)
          .innerJoin(barTickets, eq(barTickets.vendaId, barVendas.id))
          .leftJoin(barComandas, eq(barComandas.id, barVendas.comandaId))
          .where(eq(barVendas.eventoId, evento.id))
          .orderBy(desc(barVendas.numero))
          .limit(100),
      ])
    : [[], [], []];

  const receita = totais.reduce((s, t) => s + t.total, 0);
  const custo = totais.reduce((s, t) => s + t.custo, 0);
  const qtd = totais.reduce((s, t) => s + t.vendas, 0);

  return (
    <GestaoShell titulo="Vendas e caixas" atual="/bar/gestao/vendas" eventos={eventos} evento={evento} ok={ok} erro={erro} exportar={gestor ? "vendas" : undefined}>
      {!evento ? (
        <SemEvento />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Link href="/bar/caixa" className="bg-gold-metal rounded-full px-5 py-2.5 text-sm font-semibold text-gold-ink hover:brightness-110">Nova venda</Link>
            <Link href="/bar/comanda" className="rounded-full border border-gold-500/60 px-5 py-2.5 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">Comandas a receber</Link>
          </div>
          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6 text-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Como as vendas entraram</h2>
            <ul className="mt-3 space-y-1">
              {[["caixa", "Pagas na hora (caixa)"], ["comanda", "Recebidas de comandas"], ["online", "Pedidos online"]].map(([k, r]) => {
                const o = origens.find((x) => x.origem === k);
                return (
                  <li key={k} className="flex justify-between text-mist">
                    <span>{r} ({o?.vendas ?? 0})</span>
                    <span className="text-white">{formatarPreco(o?.total ?? 0)}</span>
                  </li>
                );
              })}
              {evento.usaComanda && (
                <li className="flex justify-between border-t border-white/10 pt-1 text-mist">
                  <span>Comandas ainda em aberto ({abertas.length}) — a receber</span>
                  <span className={aReceber > 0 ? "font-semibold text-ember-400" : "text-white"}>{formatarPreco(aReceber)}</span>
                </li>
              )}
            </ul>
          </section>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { r: "Vendas", v: String(qtd) },
              { r: "Receita", v: formatarPreco(receita) },
              ...(gestor
                ? [
                    { r: "Custo das vendas", v: formatarPreco(custo) },
                    { r: "Lucro bruto", v: formatarPreco(receita - custo) },
                  ]
                : []),
            ].map((c) => (
              <div key={c.r} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
                <p className="text-xs uppercase tracking-wider text-mist/60">{c.r}</p>
                <p className="text-gold-metal mt-1 text-2xl font-extrabold">{c.v}</p>
              </div>
            ))}
          </div>

          {gestor && problemas.length > 0 && (
            <section role="alert" className="space-y-3 rounded-2xl border border-ember-500/50 bg-ember-500/10 p-5 text-sm text-mist">
              <strong className="text-ember-400">Pedidos online pagos sem estoque — devolva o pagamento:</strong>
              <ul className="space-y-2">
                {problemas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{p.nome} · {p.email} · <strong className="text-white">{formatarPreco(p.totalCentavos)}</strong></span>
                    <form action={devolverPedidoOnlineAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="rounded-full border border-ember-500/60 px-4 py-1.5 text-xs font-semibold text-ember-400 hover:bg-ember-500/10">Devolver pagamento</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {totais.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6 text-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Por forma de pagamento</h2>
              <ul className="mt-3 space-y-1">
                {totais.map((t) => (
                  <li key={t.forma} className="flex justify-between text-mist">
                    <span>{ROTULO_FORMA[t.forma] ?? t.forma} ({t.vendas})</span>
                    <span className="text-white">{formatarPreco(t.total)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Caixas</h2>
            {caixas.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhum caixa aberto ainda.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10 text-sm">
                {caixas.map((c) => {
                  const dif = c.dinheiroContadoCentavos !== null && c.dinheiroEsperadoCentavos !== null ? c.dinheiroContadoCentavos - c.dinheiroEsperadoCentavos : null;
                  return (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="text-mist">
                        <strong className="text-white">{c.operadorNome}</strong> · abriu {formatarDataHora(c.abertoEm)}
                        {c.fechadoEm ? ` · fechou ${formatarDataHora(c.fechadoEm)}` : " · aberto"}
                      </span>
                      <span className={dif === null ? "text-mist/60" : dif === 0 ? "text-teal-300" : "font-semibold text-ember-400"}>
                        {dif === null ? "em andamento" : dif === 0 ? "dinheiro conferido" : `diferença ${formatarPreco(dif)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Vendas</h2>
            {vendas.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhuma venda ainda.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {vendas.map((v) => (
                  <li key={v.id} className={`rounded-xl border border-white/10 bg-petrol-950/60 p-4 text-sm ${v.status === "estornada" ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-mist">
                        <Link href={`/bar/ticket/${v.codigo}`} className="font-semibold text-teal-300 underline">Nº {v.numero}</Link> ·{" "}
                        {formatarDataHora(v.criadoEm)} · {v.operador} · {ROTULO_FORMA[v.forma] ?? v.forma}{v.origem === "online" ? " · online" : ""}{v.origem === "comanda" && v.comandaNumero ? <> · <span className="text-xs uppercase tracking-wider text-mist/60">Comanda</span> <strong className="font-mono text-xl font-extrabold text-gold-300">{v.comandaNumero}</strong></> : ""}
                      </span>
                      <span className="text-right">
                        <strong className="text-white">{formatarPreco(v.total)}</strong>{" "}
                        <span className="text-xs text-mist/60">
                          {v.status === "estornada" ? "estornada" : v.ticket === "entregue" ? "entregue" : v.ticket === "parcial" ? "retirada parcial" : "aguardando retirada"}
                        </span>
                      </span>
                    </div>
                    {v.status === "estornada" && v.motivo && <p className="mt-1 text-xs text-mist/60">Motivo: {v.motivo}</p>}
                    {gestor && v.status === "paga" && v.ticket === "pendente" && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-ember-400">Estornar</summary>
                        <form action={estornarVendaAction} className="mt-2 flex flex-wrap items-end gap-2">
                          <input type="hidden" name="vendaId" value={v.id} />
                          <label htmlFor={`mot-${v.id}`} className="sr-only">Motivo do estorno</label>
                          <input id={`mot-${v.id}`} name="motivo" required minLength={3} maxLength={300} placeholder="Motivo do estorno" className={`${classeInput} max-w-sm`} />
                          <button type="submit" className="rounded-full border border-ember-500/60 px-4 py-2 text-xs font-semibold text-ember-400 hover:bg-ember-500/10">
                            Confirmar estorno
                          </button>
                        </form>
                        <p className="mt-1 text-xs text-mist/60">O estoque volta. Devolva o dinheiro ao cliente e avise o balcão.</p>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </GestaoShell>
  );
}
