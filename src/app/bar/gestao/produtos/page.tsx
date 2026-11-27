import type { Metadata } from "next";
import { formatarPreco } from "@/lib/formatar";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao, LINHAS_COMPRA, listarCategorias, listarProdutosComSaldo, margemPercentual } from "@/modules/bar";
import { fichasDoEvento } from "@/modules/bar/ficha";
import { Campo, classeInput } from "../../../_components/form-ui";
import { BotaoSalvar } from "../../../_components/botao-salvar";
import { GestaoShell, SemEvento } from "../../_components/gestao-shell";
import { copiarProdutosAction, salvarFichaAction, salvarProdutoAction } from "../actions";

export const metadata: Metadata = { title: "Bar — Produtos — LPZ Training" };

const centavosParaCampo = (c: number) => (c / 100).toFixed(2).replace(".", ",");

export default async function Page(props: PageProps<"/bar/gestao/produtos">) {
  const { user } = await exigirBar(["admin", "caixa"]);
  const edita = acessoBar(user).admin;
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);
  const [produtos, categorias, fichas] = evento
    ? await Promise.all([listarProdutosComSaldo(evento.id), listarCategorias(), fichasDoEvento(evento.id)])
    : [[], [], new Map<string, { insumoId: string; quantidade: number }[]>()];
  const insumosDisponiveis = produtos.filter((p) => p.ativo && !p.usaFicha);
  const outros = eventos.filter((e) => e.id !== evento?.id);

  return (
    <GestaoShell titulo="Produtos" atual="/bar/gestao/produtos" eventos={eventos} evento={evento} ok={ok} erro={erro}>
      {!evento ? (
        <SemEvento />
      ) : (
        <>
          {edita && (
          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <details open={produtos.length === 0}>
              <summary className="cursor-pointer text-sm font-semibold text-gold-300">+ Novo produto</summary>
              <FormProduto eventoId={evento.id} categorias={categorias.map((c) => c.nome)} />
            </details>
            {produtos.length === 0 && outros.length > 0 && (
              <form action={copiarProdutosAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
                <input type="hidden" name="destino" value={evento.id} />
                <div>
                  <label htmlFor="copiar-origem" className="mb-1 block text-xs text-mist/70">Copiar os produtos (sem estoque) de outro evento</label>
                  <select id="copiar-origem" name="origem" className={`${classeInput} min-w-56`}>
                    {outros.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
                <BotaoSalvar>Copiar</BotaoSalvar>
              </form>
            )}
          </section>
          )}

          {produtos.length === 0 ? (
            <p className="text-sm text-mist/70">Nenhum produto neste evento ainda.</p>
          ) : (
            <ul className="space-y-3">
              {produtos.map((p) => {
                const lucro = p.precoCentavos - p.custoCentavos;
                return (
                  <li key={p.id} className={`rounded-2xl border bg-petrol-900/80 p-5 ${p.ativo ? "border-white/10" : "border-white/5 opacity-60"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">
                          {p.nome} <span className="text-xs font-normal text-mist/60">({p.unidade})</span>
                        </p>
                        <p className="text-xs text-mist/60">
                          {p.categoria ?? "Sem categoria"}
                          {p.usaFicha && " · com ficha técnica"}
                          {!p.aVenda && " · insumo (não vendido)"}
                          {!p.ativo && " · inativo"}
                          {p.ativo && !p.visivelCardapio && " · fora do cardápio"}
                        </p>
                      </div>
                      <dl className="grid grid-cols-4 gap-x-5 text-right text-sm">
                        {edita && <div><dt className="text-xs text-mist/60">Custo</dt><dd className="text-white">{formatarPreco(p.custoCentavos)}</dd></div>}
                        <div><dt className="text-xs text-mist/60">Venda</dt><dd className="text-white">{formatarPreco(p.precoCentavos)}</dd></div>
                        {edita && <div className={p.aVenda ? "" : "invisible"}>
                          <dt className="text-xs text-mist/60">Lucro</dt>
                          <dd className={lucro < 0 ? "text-ember-400" : "text-teal-300"}>
                            {formatarPreco(lucro)} <span className="text-xs">({margemPercentual(p.custoCentavos, p.precoCentavos)}%)</span>
                          </dd>
                        </div>}
                        <div><dt className="text-xs text-mist/60">{p.usaFicha ? "Dá para fazer" : "Estoque"}</dt><dd className={p.saldo <= p.estoqueMinimo ? "text-ember-400" : "text-white"}>{p.saldo}</dd></div>
                      </dl>
                    </div>
                    {edita && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-teal-300">Editar</summary>
                      <FormProduto eventoId={evento.id} categorias={categorias.map((c) => c.nome)} produto={p} />
                      {p.usaFicha && (
                        <FormFicha eventoId={evento.id} produtoId={p.id} insumos={insumosDisponiveis.filter((i) => i.id !== p.id)} atual={fichas.get(p.id) ?? []} />
                      )}
                    </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </GestaoShell>
  );
}

function FormProduto({
  eventoId,
  categorias,
  produto,
}: {
  eventoId: string;
  categorias: string[];
  produto?: {
    id: string;
    nome: string;
    categoria: string | null;
    unidade: string;
    custoCentavos: number;
    precoCentavos: number;
    estoqueMinimo: number;
    visivelCardapio: boolean;
    aVenda: boolean;
    usaFicha: boolean;
    ativo: boolean;
  };
}) {
  const p = produto?.id ?? "novo-produto";
  return (
    <form action={salvarProdutoAction} className="mt-4 grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="eventoId" value={eventoId} />
      {produto && <input type="hidden" name="id" value={produto.id} />}
      <Campo id={`${p}-nome`} label="Nome">
        <input id={`${p}-nome`} name="nome" required maxLength={120} defaultValue={produto?.nome} placeholder="Cerveja long neck" className={classeInput} />
      </Campo>
      <Campo id={`${p}-cat`} label="Categoria (opcional)">
        <input id={`${p}-cat`} name="categoria" list={`${p}-cats`} maxLength={60} defaultValue={produto?.categoria ?? ""} placeholder="Bebidas" className={classeInput} />
        <datalist id={`${p}-cats`}>
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>
      <Campo id={`${p}-un`} label="Unidade">
        <input id={`${p}-un`} name="unidade" maxLength={20} defaultValue={produto?.unidade ?? "un"} className={classeInput} />
      </Campo>
      <Campo id={`${p}-custo`} label="Preço de custo (R$)" dica="O que você paga. As compras atualizam o custo médio. Com ficha técnica, é calculado pelos insumos.">
        <input id={`${p}-custo`} name="custo" inputMode="decimal" defaultValue={produto ? centavosParaCampo(produto.custoCentavos) : ""} placeholder="4,50" className={classeInput} />
      </Campo>
      <Campo id={`${p}-preco`} label="Preço de venda (R$)" dica="O que você cobra do cliente.">
        <input id={`${p}-preco`} name="preco" required inputMode="decimal" defaultValue={produto ? centavosParaCampo(produto.precoCentavos) : ""} placeholder="12,00" className={classeInput} />
      </Campo>
      <Campo id={`${p}-min`} label="Estoque mínimo (alerta)">
        <input id={`${p}-min`} name="estoqueMinimo" type="number" min={0} defaultValue={produto?.estoqueMinimo ?? 0} className={classeInput} />
      </Campo>
      {!produto && (
        <Campo id={`${p}-ini`} label="Estoque inicial (opcional)">
          <input id={`${p}-ini`} name="estoqueInicial" type="number" min={0} defaultValue={0} className={classeInput} />
        </Campo>
      )}
      <div className="flex flex-wrap items-center gap-5 sm:col-span-3">
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="visivelCardapio" defaultChecked={produto?.visivelCardapio ?? true} className="h-4 w-4 accent-gold-400" />
          Aparece no cardápio dos clientes
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="aVenda" defaultChecked={produto?.aVenda ?? true} className="h-4 w-4 accent-gold-400" />
          Vendido no caixa (desmarque para insumos)
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="usaFicha" defaultChecked={produto?.usaFicha ?? false} className="h-4 w-4 accent-gold-400" />
          Tem ficha técnica (receita com insumos)
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="ativo" defaultChecked={produto?.ativo ?? true} className="h-4 w-4 accent-gold-400" />
          Ativo
        </label>
      </div>
      <div className="sm:col-span-3">
        <BotaoSalvar />
      </div>
    </form>
  );
}

function FormFicha({
  eventoId,
  produtoId,
  insumos,
  atual,
}: {
  eventoId: string;
  produtoId: string;
  insumos: { id: string; nome: string; unidade: string }[];
  atual: { insumoId: string; quantidade: number }[];
}) {
  return (
    <form action={salvarFichaAction} className="mt-4 space-y-3 border-t border-white/10 pt-4">
      <input type="hidden" name="eventoId" value={eventoId} />
      <input type="hidden" name="produtoId" value={produtoId} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Ficha técnica (por unidade vendida)</h3>
      <p className="text-xs text-mist/60">
        Escolha os insumos e a quantidade que cada unidade consome, na unidade do insumo (ex.: 50 ml, 1 un.). Cadastre os insumos como
        produtos &quot;não vendidos&quot; e compre-os na aba Compras. Use unidades pequenas (ml, g, dose) para a receita ficar precisa.
      </p>
      {insumos.length === 0 ? (
        <p className="text-sm text-ember-400">Cadastre antes os insumos (produtos sem ficha) deste evento.</p>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: LINHAS_COMPRA }, (_, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem] gap-2 sm:grid-cols-[1fr_9rem]">
              <label htmlFor={`${produtoId}-i-${i}`} className="sr-only">Insumo {i + 1}</label>
              <select id={`${produtoId}-i-${i}`} name={`insumo-${i}`} defaultValue={atual[i]?.insumoId ?? ""} className={classeInput}>
                <option value="">{i === 0 ? "Insumo…" : "— (em branco)"}</option>
                {insumos.map((x) => (
                  <option key={x.id} value={x.id}>{x.nome} ({x.unidade})</option>
                ))}
              </select>
              <label htmlFor={`${produtoId}-q-${i}`} className="sr-only">Quantidade {i + 1}</label>
              <input id={`${produtoId}-q-${i}`} name={`qtd-${i}`} type="number" min={1} defaultValue={atual[i]?.quantidade ?? ""} placeholder="Qtd." className={classeInput} />
            </div>
          ))}
        </div>
      )}
      <BotaoSalvar>Salvar ficha técnica</BotaoSalvar>
    </form>
  );
}
