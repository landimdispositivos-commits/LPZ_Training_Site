import Link from "next/link";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { ROTULO_FORMA } from "@/modules/bar/caixa";
import { ReceberComanda } from "./receber-comanda";

export type Situacao = "receber" | "pagas" | "todas";

export function situacaoDe(valor: unknown): Situacao {
  return valor === "pagas" || valor === "todas" ? valor : "receber";
}

type Aberta = { id: string; numero: string; abertaEm: Date; itens: number; total: number };
type Paga = { id: string; numero: string; pagaEm: Date | null; total: number; forma: string; recebidoPor: string };

// Lista de comandas com filtro "A receber" / "Pagas" / "Todas". Usada no menu
// Comandas da gestão e na tela de comandas do caixa e do balcão.
export function ListaComandas({
  abertas,
  pagas,
  situacao,
  base,
  extra,
  podeReceber,
  voltar,
}: {
  abertas: Aberta[];
  pagas: Paga[];
  situacao: Situacao;
  base: string; // ex.: /bar/comanda
  extra?: Record<string, string>; // parâmetros que devem ser mantidos (ex.: evento)
  podeReceber: boolean;
  voltar: "lista" | "gestao";
}) {
  const aReceber = abertas.reduce((s, c) => s + c.total, 0);
  const recebido = pagas.reduce((s, c) => s + c.total, 0);
  const href = (s: Situacao) => {
    const p = new URLSearchParams({ ...extra, situacao: s });
    return `${base}?${p}`;
  };
  const filtros: { id: Situacao; rotulo: string; n: number }[] = [
    { id: "receber", rotulo: "A receber", n: abertas.length },
    { id: "pagas", rotulo: "Pagas", n: pagas.length },
    { id: "todas", rotulo: "Todas", n: abertas.length + pagas.length },
  ];
  const mostraAbertas = situacao !== "pagas";
  const mostraPagas = situacao !== "receber";

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
      <nav aria-label="Filtro de comandas" className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <Link
            key={f.id}
            href={href(f.id)}
            aria-current={situacao === f.id ? "page" : undefined}
            className={
              situacao === f.id
                ? "bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink"
                : "rounded-full border border-gold-500/40 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/10"
            }
          >
            {f.rotulo} ({f.n})
          </Link>
        ))}
      </nav>

      <p className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-mist/70">
        <span>A receber: <strong className={aReceber > 0 ? "text-ember-400" : "text-white"}>{formatarPreco(aReceber)}</strong></span>
        <span>Já recebido: <strong className="text-teal-300">{formatarPreco(recebido)}</strong></span>
      </p>

      {mostraAbertas && (
        <div>
          {situacao === "todas" && <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">A receber</h2>}
          {abertas.length === 0 ? (
            <p className="mt-2 text-sm text-mist/70">Nenhuma comanda a receber.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 text-sm">
              {abertas.map((c) => (
                <li key={c.id} className="space-y-2 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex flex-wrap items-baseline gap-x-3 text-mist">
                      <strong className="font-mono text-2xl font-extrabold tracking-wider text-gold-300 sm:text-3xl">{c.numero}</strong>
                      <span className="text-sm text-mist/70">{c.itens} {c.itens === 1 ? "item" : "itens"} · {formatarDataHora(c.abertaEm)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <strong className="text-white">{formatarPreco(c.total)}</strong>
                      <Link href={`/bar/comanda/${encodeURIComponent(c.numero)}`} className="rounded-full border border-gold-500/60 px-3 py-1 font-semibold text-gold-300 hover:bg-gold-500/10">Abrir</Link>
                    </span>
                  </div>
                  {podeReceber && c.total > 0 && <ReceberComanda numero={c.numero} total={c.total} voltar={voltar} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mostraPagas && (
        <div>
          {situacao === "todas" && <h2 className="mt-2 text-xs font-semibold uppercase tracking-wider text-teal-300">Pagas</h2>}
          {pagas.length === 0 ? (
            <p className="mt-2 text-sm text-mist/70">Nenhuma comanda paga ainda.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 text-sm">
              {pagas.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-mist">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <strong className="font-mono text-2xl font-extrabold tracking-wider text-gold-300 sm:text-3xl">{c.numero}</strong>
                    <span className="text-sm text-mist/70">{c.pagaEm ? formatarDataHora(c.pagaEm) : ""} · {ROTULO_FORMA[c.forma] ?? c.forma} · recebido por {c.recebidoPor}</span>
                  </span>
                  <strong className="text-teal-300">{formatarPreco(c.total)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
