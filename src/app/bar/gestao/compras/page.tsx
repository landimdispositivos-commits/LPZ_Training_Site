import type { Metadata } from "next";
import { formatarPreco } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao, LINHAS_COMPRA, listarCompras, listarProdutosComSaldo } from "@/modules/bar";
import { Campo, classeInput } from "../../../_components/form-ui";
import { BotaoSalvar } from "../../../_components/botao-salvar";
import { GestaoShell, SemEvento } from "../../_components/gestao-shell";
import { registrarCompraAction } from "../actions";

export const metadata: Metadata = { title: "Bar — Compras — LPZ Training" };

export default async function Page(props: PageProps<"/bar/gestao/compras">) {
  await exigirBar("admin");
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);
  const [produtos, compras] = evento ? await Promise.all([listarProdutosComSaldo(evento.id), listarCompras(evento.id)]) : [[], []];
  const ativos = produtos.filter((p) => p.ativo && !p.usaFicha);
  const totalGasto = compras.reduce((s, c) => s + c.totalCentavos, 0);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <GestaoShell titulo="Compras de insumos" atual="/bar/gestao/compras" eventos={eventos} evento={evento} ok={ok} erro={erro} exportar="compras">
      {!evento ? (
        <SemEvento />
      ) : ativos.length === 0 ? (
        <p className="text-sm text-mist/70">Cadastre os produtos do evento antes de registrar compras.</p>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Registrar compra</h2>
            <p className="mt-2 text-xs text-mist/60">
              A mercadoria entra no estoque e o <strong className="text-white">custo médio</strong> do produto é recalculado. Preencha só as
              linhas que precisar (até {LINHAS_COMPRA} produtos por compra).
            </p>
            <form action={registrarCompraAction} className="mt-4 space-y-4">
              <input type="hidden" name="eventoId" value={evento.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo id="cp-forn" label="Fornecedor (opcional)">
                  <input id="cp-forn" name="fornecedor" maxLength={120} className={classeInput} />
                </Campo>
                <Campo id="cp-data" label="Data da compra">
                  <input id="cp-data" name="data" type="date" defaultValue={hoje} className={classeInput} />
                </Campo>
                <Campo id="cp-obs" label="Observação (opcional)">
                  <input id="cp-obs" name="observacao" maxLength={500} className={classeInput} />
                </Campo>
              </div>
              <div className="space-y-2">
                {Array.from({ length: LINHAS_COMPRA }, (_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_5rem_6.5rem] gap-2 sm:grid-cols-[1fr_8rem_9rem]">
                    <label htmlFor={`cp-p-${i}`} className="sr-only">Produto {i + 1}</label>
                    <select id={`cp-p-${i}`} name={`produto-${i}`} defaultValue="" className={classeInput}>
                      <option value="">{i === 0 ? "Produto…" : "— (em branco)"}</option>
                      {ativos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                    <label htmlFor={`cp-q-${i}`} className="sr-only">Quantidade {i + 1}</label>
                    <input id={`cp-q-${i}`} name={`qtd-${i}`} type="number" min={1} placeholder="Qtd." className={classeInput} />
                    <label htmlFor={`cp-c-${i}`} className="sr-only">Custo unitário {i + 1}</label>
                    <input id={`cp-c-${i}`} name={`custo-${i}`} inputMode="decimal" placeholder="Custo un. R$" className={classeInput} />
                  </div>
                ))}
              </div>
              <BotaoSalvar>Registrar compra</BotaoSalvar>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Compras do evento</h2>
              <p className="text-sm text-mist/70">Total gasto: <strong className="text-white">{formatarPreco(totalGasto)}</strong></p>
            </div>
            {compras.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhuma compra registrada.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10 text-sm">
                {compras.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium text-white">{c.dataCompra.split("-").reverse().join("/")}</span>
                      <span className="text-mist/60"> · {c.fornecedor ?? "sem fornecedor"}{c.autorNome ? ` · ${c.autorNome}` : ""}</span>
                    </span>
                    <span className="font-semibold text-white">{formatarPreco(c.totalCentavos)}</span>
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
