import type { Metadata } from "next";
import Link from "next/link";
import { exigirAdmin } from "@/modules/auth/sessao";
import { listarPedidos, lotesComVendas, resumoFinanceiro, STATUS_PEDIDO, type StatusPedido } from "@/modules/financeiro";
import { dateParaDataHoraLocal, formatarDataHora, formatarPreco } from "@/lib/formatar";
import { estornosPendentes, nomeDoProduto, type TipoProduto, tiposDoCatalogo } from "@/modules/ingressos";
import { Aviso, Campo, classeBotao, classeInput } from "../_components/form-ui";
import { BotaoSalvar } from "../_components/botao-salvar";
import { SiteHeader } from "../_components/site-header";
import { reenviarIngressosAction, criarLoteAction, editarLoteAction, estornarAction } from "./actions";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";
import { AbasFinanceiro } from "./_components/abas";
import { PainelGraficos } from "./_components/painel-graficos";

export const metadata: Metadata = { title: "Financeiro — LPZ Training" };

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pendente: "Aguardando pagamento",
  pago: "Pago",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const MENSAGENS: Record<string, { tipo: "ok" | "erro"; texto: string }> = {
  "lote-criado": { tipo: "ok", texto: "Lote criado." },
  "lote-salvo": { tipo: "ok", texto: "Lote atualizado." },
  lote: { tipo: "erro", texto: "Confira os dados do lote: nome, preço (ex.: 350,00), quantidade e datas." },
  quantidade: { tipo: "erro", texto: "A quantidade total não pode ficar abaixo do que já foi vendido ou reservado." },
  "ingressos-enviados": { tipo: "ok", texto: "E-mails com o QR code enviados." },
  "confirmar-envio": { tipo: "erro", texto: "Para enviar, digite ENVIAR no campo de confirmação." },
  estornado: { tipo: "ok", texto: "Estorno feito. O cliente recebeu um e-mail de confirmação." },
  estorno: { tipo: "erro", texto: "Não foi possível fazer o estorno agora. Confira no painel do Mercado Pago e tente de novo." },
};

export default async function Page(props: PageProps<"/financeiro">) {
  await carregarCatalogo();
  await exigirAdmin(["organizador"]);
  const { status, ok, erro, qtd, aba } = await props.searchParams;

  // Aba "Gráficos": só o painel com os gráficos (as tabelas ficam na outra aba).
  if (aba === "graficos") {
    return (
      <>
        <SiteHeader />
        <main className="bg-city-glow min-h-[80vh] px-4 py-12">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">Financeiro</h1>
              <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
            </div>
            <AbasFinanceiro ativa="graficos" />
            <PainelGraficos />
          </div>
        </main>
      </>
    );
  }
  const filtro = STATUS_PEDIDO.find((s) => s === status);
  const mensagem = MENSAGENS[String(ok ?? erro ?? "")];

  const [resumo, listaLotes, listaPedidos, estornos] = await Promise.all([
    resumoFinanceiro(),
    lotesComVendas(),
    listarPedidos({ status: filtro, limite: 200 }),
    estornosPendentes(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">Financeiro</h1>
            <div className="flex gap-4 text-sm">
              <a href="/financeiro/exportar" className="font-medium text-teal-300 hover:underline">Exportar pedidos (CSV)</a>
              <Link href="/administradores/painel" className="text-teal-300 hover:underline">Painel</Link>
            </div>
          </div>

          <AbasFinanceiro ativa="tabelas" />

          {mensagem && (
            <Aviso tipo={mensagem.tipo}>
              {mensagem.texto}
              {ok === "ingressos-enviados" && typeof qtd === "string" ? ` Total: ${qtd}.` : ""}
            </Aviso>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { rotulo: "Arrecadado", valor: formatarPreco(resumo.arrecadadoCentavos) },
              { rotulo: "Ingressos pagos", valor: resumo.pagos },
              { rotulo: "Aguardando pagamento", valor: resumo.pendentes },
              { rotulo: "Check-ins feitos", valor: resumo.presentes },
            ].map((n) => (
              <div key={n.rotulo} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
                <p className="text-sm text-mist/70">{n.rotulo}</p>
                <p className="text-gold-metal mt-1 text-3xl font-extrabold">{n.valor}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-mist/60">
            Valores brutos (antes da taxa do Mercado Pago). Pedidos pendentes há mais de 30 minutos são cancelados
            automaticamente e a vaga volta para o lote.
          </p>

          {estornos.length > 0 && (
            <section className="rounded-2xl border border-ember-500/50 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ember-400">
                Estornos aguardando aprovação ({estornos.length})
              </h2>
              <p className="mt-2 text-xs text-mist/70">
                Compras canceladas pelo próprio cliente dentro dos 7 dias (direito de arrependimento). O ingresso já foi
                cancelado e a vaga voltou ao lote. Ao clicar em Estornar, o valor é devolvido pelo Mercado Pago e o
                cliente recebe um e-mail.
              </p>
              <ul className="mt-4 divide-y divide-white/10">
                {estornos.map((e) => (
                  <li key={e.pedidoId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="text-sm">
                      <p className="font-semibold text-white">{e.nome} <span className="font-normal text-mist/60">· {e.email}</span></p>
                      <p className="text-mist/70">
                        {nomeDoProduto(e.tipo)} ({e.loteNome}) · cancelado em {e.canceladoEm ? formatarDataHora(e.canceladoEm) : "—"}
                      </p>
                    </div>
                    <form action={estornarAction}>
                      <input type="hidden" name="pedidoId" value={e.pedidoId} />
                      <button type="submit" className="rounded-full bg-ember-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
                        Estornar {formatarPreco(e.valorCentavos)}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Lotes</h2>
            {listaLotes.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhum lote criado.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {listaLotes.map((l) => (
                  <li key={l.id} className="rounded-xl border border-white/10 bg-petrol-950/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">{nomeDoProduto(l.tipo)}</p>
                        <p className="font-semibold text-white">
                          {l.nome} · {formatarPreco(l.precoCentavos)}
                        </p>
                        <p className="text-sm text-mist/70">
                          {l.pagos} pagos · {l.reservados} reservados · {l.quantidadeTotal - l.quantidadeVendida} livres de{" "}
                          {l.quantidadeTotal} · receita {formatarPreco(l.receitaCentavos)}
                        </p>
                        {(l.dataInicio || l.dataFim) && (
                          <p className="text-xs text-mist/60">
                            {l.dataInicio ? `de ${formatarDataHora(l.dataInicio)} ` : ""}
                            {l.dataFim ? `até ${formatarDataHora(l.dataFim)}` : ""}
                          </p>
                        )}
                      </div>
                      <span
                        className={
                          l.ativo
                            ? "rounded-full bg-teal-400/15 px-3 py-1 text-xs text-teal-300"
                            : "rounded-full bg-white/10 px-3 py-1 text-xs text-mist/70"
                        }
                      >
                        {l.ativo ? "À venda" : "Fechado"}
                      </span>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-teal-300">Editar</summary>
                      <FormLote action={editarLoteAction} lote={l} />
                    </details>
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-gold-300">+ Novo lote</summary>
              <FormLote action={criarLoteAction} />
            </details>
          </section>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Pedidos</h2>
              <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-2 text-xs">
                <FiltroLink href="/financeiro" ativo={!filtro}>Todos</FiltroLink>
                {STATUS_PEDIDO.map((s) => (
                  <FiltroLink key={s} href={`/financeiro?status=${s}`} ativo={filtro === s}>
                    {ROTULO_STATUS[s]}
                  </FiltroLink>
                ))}
              </nav>
            </div>
            {listaPedidos.length === 0 ? (
              <p className="mt-4 text-sm text-mist/70">Nenhum pedido.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-mist/60">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Data</th>
                      <th className="py-2 pr-3 font-medium">Comprador</th>
                      <th className="py-2 pr-3 font-medium">Produto / lote</th>
                      <th className="py-2 pr-3 font-medium">Valor</th>
                      <th className="py-2 pr-3 font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {listaPedidos.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-3 whitespace-nowrap text-mist/80">{formatarDataHora(p.criadoEm)}</td>
                        <td className="py-2 pr-3">
                          <p className="text-white">{p.nome}</p>
                          <p className="text-xs text-mist/60">{p.email}</p>
                        </td>
                        <td className="py-2 pr-3 text-mist/80">
                          {nomeDoProduto(p.tipo)}
                          <span className="block text-xs text-mist/60">{p.loteNome}</span>
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-white">{formatarPreco(p.valorCentavos)}</td>
                        <td className="py-2 pr-3 text-mist/80">
                          {ROTULO_STATUS[p.status]}
                          {p.checkinEm ? " · entrou" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {listaPedidos.length === 200 && (
                  <p className="mt-3 text-xs text-mist/60">Mostrando os 200 mais recentes. Exporte o CSV para ver todos.</p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Reenviar e-mail completo aos compradores</h2>
            <p className="mt-2 text-sm text-mist/80">
              O e-mail da compra (dados da compra, forma de pagamento, QR code, cronograma, professores e DJs) já sai
              sozinho assim que o pagamento é aprovado. Use este botão para mandar de novo a todas as compras pagas, com
              a programação atualizada — por exemplo, alguns dias antes do evento. Cada pessoa recebe no idioma em que
              comprou.
            </p>
            <form action={reenviarIngressosAction} className="mt-4 flex flex-wrap items-end gap-3">
              <Campo id="confirmar-envio" label="Digite ENVIAR para confirmar">
                <input id="confirmar-envio" name="confirmacao" autoComplete="off" className={classeInput} />
              </Campo>
              <BotaoSalvar>Enviar a todos</BotaoSalvar>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

function FiltroLink({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "page" : undefined}
      className={
        ativo
          ? "rounded-full bg-gold-400 px-3 py-1 font-semibold text-gold-ink"
          : "rounded-full border border-white/15 px-3 py-1 text-mist/80 hover:border-gold-400"
      }
    >
      {children}
    </Link>
  );
}

type LoteEditavel = {
  id: string;
  tipo: TipoProduto;
  nome: string;
  precoCentavos: number;
  quantidadeTotal: number;
  ativo: boolean;
  dataInicio: Date | null;
  dataFim: Date | null;
};

function FormLote({ action, lote }: { action: (form: FormData) => Promise<void>; lote?: LoteEditavel }) {
  const p = lote?.id ?? "novo";
  return (
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      {lote && <input type="hidden" name="id" value={lote.id} />}
      <Campo id={`${p}-tipo`} label="Produto">
        <select id={`${p}-tipo`} name="tipo" defaultValue={lote?.tipo ?? "full_pass"} className={classeInput}>
          {tiposDoCatalogo().map((t) => (
            <option key={t} value={t}>{nomeDoProduto(t)}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`${p}-nome`} label="Nome do lote">
        <input id={`${p}-nome`} name="nome" required maxLength={60} defaultValue={lote?.nome} placeholder="1º lote" className={classeInput} />
      </Campo>
      <Campo id={`${p}-preco`} label="Preço (R$)">
        <input
          id={`${p}-preco`}
          name="preco"
          required
          inputMode="decimal"
          defaultValue={lote ? (lote.precoCentavos / 100).toFixed(2).replace(".", ",") : ""}
          placeholder="350,00"
          className={classeInput}
        />
      </Campo>
      <Campo id={`${p}-qtd`} label="Quantidade de ingressos">
        <input id={`${p}-qtd`} name="quantidadeTotal" type="number" min={1} required defaultValue={lote?.quantidadeTotal} className={classeInput} />
      </Campo>
      <div className="flex items-end pb-3">
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="ativo" defaultChecked={lote?.ativo ?? true} className="h-4 w-4 accent-gold-400" />
          À venda
        </label>
      </div>
      <Campo id={`${p}-inicio`} label="Começa em (opcional)">
        <input id={`${p}-inicio`} name="dataInicio" type="datetime-local" defaultValue={dateParaDataHoraLocal(lote?.dataInicio ?? null)} className={classeInput} />
      </Campo>
      <Campo id={`${p}-fim`} label="Termina em (opcional)">
        <input id={`${p}-fim`} name="dataFim" type="datetime-local" defaultValue={dateParaDataHoraLocal(lote?.dataFim ?? null)} className={classeInput} />
      </Campo>
      <div className="sm:col-span-2">
        <button type="submit" className={classeBotao}>{lote ? "Salvar lote" : "Criar lote"}</button>
      </div>
    </form>
  );
}
