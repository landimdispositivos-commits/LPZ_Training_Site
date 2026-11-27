import type { Metadata } from "next";
import { formatarDataHora } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao, listarProdutosComSaldo, ROTULO_MOVIMENTO, TIPOS_AJUSTE, ultimosMovimentos } from "@/modules/bar";
import { Campo, classeInput } from "../../../_components/form-ui";
import { BotaoSalvar } from "../../../_components/botao-salvar";
import { GestaoShell, SemEvento } from "../../_components/gestao-shell";
import { ajustarEstoqueAction } from "../actions";

export const metadata: Metadata = { title: "Bar — Estoque — LPZ Training" };

export default async function Page(props: PageProps<"/bar/gestao/estoque">) {
  await exigirBar("admin");
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);
  const [produtos, movimentos] = evento ? await Promise.all([listarProdutosComSaldo(evento.id), ultimosMovimentos(evento.id)]) : [[], []];
  const ativos = produtos.filter((p) => p.ativo);
  const baixos = ativos.filter((p) => p.saldo <= p.estoqueMinimo);

  return (
    <GestaoShell titulo="Estoque" atual="/bar/gestao/estoque" eventos={eventos} evento={evento} ok={ok} erro={erro} exportar="estoque">
      {!evento ? (
        <SemEvento />
      ) : (
        <>
          {baixos.length > 0 && (
            <section role="status" className="rounded-2xl border border-ember-500/50 bg-ember-500/10 p-4 text-sm text-mist">
              <strong className="text-ember-400">Estoque baixo:</strong> {baixos.map((p) => `${p.nome} (${p.saldo})`).join(", ")}
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Saldo atual</h2>
            {ativos.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Cadastre produtos para controlar o estoque.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-mist/60">
                    <tr><th className="py-2 pr-3">Produto</th><th className="py-2 pr-3">Categoria</th><th className="py-2 pr-3 text-right">Saldo</th><th className="py-2 text-right">Mínimo</th></tr>
                  </thead>
                  <tbody>
                    {ativos.map((p) => (
                      <tr key={p.id} className="border-t border-white/10">
                        <td className="py-2 pr-3 text-white">{p.nome}{p.usaFicha && <span className="text-xs text-mist/60"> (receita: dá para fazer)</span>}</td>
                        <td className="py-2 pr-3 text-mist/70">{p.categoria ?? "—"}</td>
                        <td className={`py-2 pr-3 text-right font-semibold ${p.saldo <= p.estoqueMinimo ? "text-ember-400" : "text-white"}`}>{p.saldo}</td>
                        <td className="py-2 text-right text-mist/70">{p.estoqueMinimo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {ativos.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Ajustar estoque</h2>
              <p className="mt-2 text-xs text-mist/60">
                Perdas, quebras, cortesias e consumo da equipe contam como <strong className="text-white">perda controlada</strong> no
                financeiro. Para entrada de mercadoria, use a aba Compras.
              </p>
              <form action={ajustarEstoqueAction} className="mt-4 grid gap-4 sm:grid-cols-4">
                <input type="hidden" name="eventoId" value={evento.id} />
                <Campo id="aj-produto" label="Produto">
                  <select id="aj-produto" name="produtoId" required defaultValue="" className={classeInput}>
                    <option value="" disabled>Escolha…</option>
                    {ativos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome} (saldo {p.saldo})</option>
                    ))}
                  </select>
                </Campo>
                <Campo id="aj-tipo" label="Motivo do ajuste">
                  <select id="aj-tipo" name="tipo" required defaultValue="perda" className={classeInput}>
                    {Object.entries(TIPOS_AJUSTE).map(([k, v]) => (
                      <option key={k} value={k}>{v.rotulo}</option>
                    ))}
                  </select>
                </Campo>
                <Campo id="aj-qtd" label="Quantidade">
                  <input id="aj-qtd" name="quantidade" type="number" min={1} required className={classeInput} />
                </Campo>
                <Campo id="aj-motivo" label="Observação (opcional)">
                  <input id="aj-motivo" name="motivo" maxLength={300} className={classeInput} />
                </Campo>
                <div className="sm:col-span-4">
                  <BotaoSalvar>Registrar ajuste</BotaoSalvar>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Últimas movimentações</h2>
            {movimentos.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhuma movimentação ainda.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10 text-sm">
                {movimentos.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0">
                      <span className="font-medium text-white">{m.produto}</span>{" "}
                      <span className="text-mist/60">· {ROTULO_MOVIMENTO[m.tipo] ?? m.tipo}{m.motivo && m.motivo !== ROTULO_MOVIMENTO[m.tipo] ? ` — ${m.motivo}` : ""}</span>
                    </span>
                    <span className="text-right">
                      <span className={m.quantidade < 0 ? "font-semibold text-ember-400" : "font-semibold text-teal-300"}>
                        {m.quantidade > 0 ? "+" : ""}{m.quantidade}
                      </span>{" "}
                      <span className="text-xs text-mist/50">{formatarDataHora(m.criadoEm)}{m.autorNome ? ` · ${m.autorNome}` : ""}</span>
                    </span>
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
