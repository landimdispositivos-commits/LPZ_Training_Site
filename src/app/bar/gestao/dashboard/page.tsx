import type { Metadata } from "next";
import { formatarPreco } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao, ROTULO_MOVIMENTO } from "@/modules/bar";
import { totaisPorForma, ROTULO_FORMA } from "@/modules/bar/caixa";
import { comparativoEventos, maisVendidos, produtosNoPrejuizo, resumoDoEvento, vendasPorDia, vendasPorHora } from "@/modules/bar/dashboard";
import { Barras, Ranking } from "../../_components/graficos";
import { GestaoShell, SemEvento } from "../../_components/gestao-shell";

export const metadata: Metadata = { title: "Bar — Dashboard — LPZ Training" };

function Cartao({ rotulo, valor, tom, dica }: { rotulo: string; valor: string; tom?: "bom" | "ruim"; dica?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
      <p className="text-xs uppercase tracking-wider text-mist/60">{rotulo}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tom === "ruim" ? "text-ember-400" : tom === "bom" ? "text-teal-300" : "text-gold-metal"}`}>{valor}</p>
      {dica && <p className="mt-1 text-xs text-mist/60">{dica}</p>}
    </div>
  );
}

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-300">{titulo}</h2>
    {children}
  </section>
);

export default async function Page(props: PageProps<"/bar/gestao/dashboard">) {
  await exigirBar("gestao");
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);

  const [r, horas, dias, top, prejuizo, formas, comparativo] = evento
    ? await Promise.all([
        resumoDoEvento(evento.id),
        vendasPorHora(evento.id),
        vendasPorDia(evento.id),
        maisVendidos(evento.id),
        produtosNoPrejuizo(evento.id),
        totaisPorForma({ eventoId: evento.id }),
        comparativoEventos(),
      ])
    : [null, [], [], [], [], [], []];

  return (
    <GestaoShell titulo="Dashboard" atual="/bar/gestao/dashboard" eventos={eventos} evento={evento} ok={ok} erro={erro}>
      {!evento || !r ? (
        <SemEvento />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Cartao rotulo="Receita" valor={formatarPreco(r.receita)} dica={`${r.vendas} ${r.vendas === 1 ? "venda" : "vendas"} · ticket médio ${formatarPreco(r.ticketMedio)}`} />
            <Cartao rotulo="Custo das vendas" valor={formatarPreco(r.custoVendas)} />
            <Cartao rotulo="Lucro bruto" valor={formatarPreco(r.lucroBruto)} tom={r.lucroBruto < 0 ? "ruim" : "bom"} dica={`Margem de ${r.margem}%`} />
            <Cartao rotulo="Lucro após perdas" valor={formatarPreco(r.lucroLiquido)} tom={r.lucroLiquido < 0 ? "ruim" : "bom"} dica={`Perdas controladas: ${formatarPreco(r.perdasCusto)}`} />
          </div>

          <Secao titulo="Caixa do evento e projeção">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Cartao rotulo="Gasto em compras" valor={formatarPreco(r.compras)} />
              <Cartao
                rotulo="Comandas em aberto"
                valor={formatarPreco(r.aReceberComandas)}
                tom={r.aReceberComandas > 0 ? "ruim" : undefined}
                dica={`${r.comandasAbertas} ${r.comandasAbertas === 1 ? "comanda" : "comandas"} a receber (ainda não é receita)`}
              />
              <Cartao
                rotulo="Resultado de caixa agora"
                valor={formatarPreco(r.resultadoCaixa)}
                tom={r.resultadoCaixa < 0 ? "ruim" : "bom"}
                dica="Receita menos compras. Negativo = ainda não pagou o que comprou."
              />
              <Cartao rotulo="Estoque restante" valor={`${r.estoqueUnidades} un.`} dica={`Custo ${formatarPreco(r.estoqueACusto)}`} />
              <Cartao
                rotulo="Projeção se vender tudo"
                valor={formatarPreco(r.projecaoResultado)}
                tom={r.projecaoResultado < 0 ? "ruim" : "bom"}
                dica={`Estoque vale ${formatarPreco(r.estoqueAVenda)} a preço de venda`}
              />
            </div>
            <p className="mt-4 text-sm text-mist/80">
              {r.faltaParaCobrirCompras > 0 ? (
                <>
                  Faltam <strong className="text-white">{formatarPreco(r.faltaParaCobrirCompras)}</strong> em vendas para cobrir tudo o que foi
                  comprado.
                </>
              ) : (
                <>As vendas já cobriram o que foi comprado. O que entrar daqui para a frente é lucro.</>
              )}
            </p>
          </Secao>

          <div className="grid gap-6 lg:grid-cols-2">
            <Secao titulo="Vendas por hora">
              {horas.length === 0 ? (
                <p className="text-sm text-mist/70">Sem vendas ainda.</p>
              ) : (
                <Barras rotuloEixo="Receita por hora do dia" dados={horas.map((h) => ({ rotulo: `${String(h.hora).padStart(2, "0")}h`, valor: h.total, extra: `${h.qtd} vendas` }))} />
              )}
            </Secao>
            <Secao titulo="Vendas por dia">
              {dias.length === 0 ? (
                <p className="text-sm text-mist/70">Sem vendas ainda.</p>
              ) : (
                <Barras rotuloEixo="Receita por dia" dados={dias.map((d) => ({ rotulo: d.dia.slice(8) + "/" + d.dia.slice(5, 7), valor: d.total, extra: `${d.qtd} vendas` }))} />
              )}
            </Secao>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Secao titulo="Mais vendidos">
              {top.length === 0 ? (
                <p className="text-sm text-mist/70">Sem vendas ainda.</p>
              ) : (
                <Ranking
                  itens={top.map((t) => ({
                    rotulo: t.nome,
                    valor: t.unidades,
                    texto: `${t.unidades} un. · ${formatarPreco(t.receita)}`,
                    sub: `Lucro ${formatarPreco(t.lucro)}`,
                  }))}
                />
              )}
            </Secao>
            <div className="space-y-6">
              <Secao titulo="Por forma de pagamento">
                {formas.length === 0 ? (
                  <p className="text-sm text-mist/70">Sem vendas ainda.</p>
                ) : (
                  <Ranking
                    itens={formas.map((f) => ({
                      rotulo: ROTULO_FORMA[f.forma] ?? f.forma,
                      valor: f.total,
                      texto: `${formatarPreco(f.total)} (${f.vendas})`,
                    }))}
                  />
                )}
              </Secao>
              <Secao titulo="Perdas e estornos">
                <ul className="space-y-1 text-sm text-mist">
                  {r.perdas.length === 0 && <li className="text-mist/70">Nenhuma perda registrada.</li>}
                  {r.perdas.map((p) => (
                    <li key={p.tipo} className="flex justify-between">
                      <span>{ROTULO_MOVIMENTO[p.tipo] ?? p.tipo} ({p.unidades} un.)</span>
                      <span className="text-ember-400">{formatarPreco(p.custo)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between border-t border-white/10 pt-1">
                    <span>Vendas estornadas ({r.estornos.qtd})</span>
                    <span className="text-white">{formatarPreco(r.estornos.total)}</span>
                  </li>
                </ul>
              </Secao>
            </div>
          </div>

          {prejuizo.length > 0 && (
            <section role="status" className="rounded-2xl border border-ember-500/50 bg-ember-500/10 p-4 text-sm text-mist">
              <strong className="text-ember-400">Atenção — vendendo abaixo do custo:</strong>{" "}
              {prejuizo.map((p) => `${p.nome} (custo ${formatarPreco(p.custo)}, venda ${formatarPreco(p.preco)})`).join("; ")}
            </section>
          )}

          <Secao titulo="Comparativo entre eventos">
            {comparativo.length <= 1 ? (
              <p className="text-sm text-mist/70">Quando houver mais de um evento, a comparação aparece aqui.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-mist/60">
                    <tr><th className="py-2 pr-3">Evento</th><th className="py-2 pr-3 text-right">Vendas</th><th className="py-2 pr-3 text-right">Receita</th><th className="py-2 pr-3 text-right">Lucro bruto</th><th className="py-2 pr-3 text-right">Compras</th><th className="py-2 text-right">Resultado</th></tr>
                  </thead>
                  <tbody>
                    {comparativo.map((c) => (
                      <tr key={c.id} className="border-t border-white/10">
                        <td className="py-2 pr-3 text-white">{c.nome}</td>
                        <td className="py-2 pr-3 text-right text-mist">{c.vendas}</td>
                        <td className="py-2 pr-3 text-right text-mist">{formatarPreco(c.receita)}</td>
                        <td className="py-2 pr-3 text-right text-mist">{formatarPreco(c.lucroBruto)}</td>
                        <td className="py-2 pr-3 text-right text-mist">{formatarPreco(c.compras)}</td>
                        <td className={`py-2 text-right font-semibold ${c.resultadoCaixa < 0 ? "text-ember-400" : "text-teal-300"}`}>{formatarPreco(c.resultadoCaixa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Secao>
        </>
      )}
    </GestaoShell>
  );
}
