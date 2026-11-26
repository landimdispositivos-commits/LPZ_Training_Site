import { formatarPreco } from "@/lib/formatar";

// Gráficos da aba "Gráficos" do Financeiro, em SVG puro (sem biblioteca nova).
// Paleta validada no fundo petróleo (scripts do skill dataviz, modo escuro):
// recebido = dourado, em andamento = verde-água, estornos = laranja,
// não pagos = lilás. Cada gráfico tem passar-o-mouse (<title>) e tabela.
export const CORES = {
  recebido: "#c4922a",
  provisionado: "#2aa69f",
  estorno: "#e8641a",
  naoPago: "#9a86d6",
} as const;

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export function rotuloMes(chave: string) {
  const [a, m] = chave.split("-").map(Number);
  return `${MESES[m - 1]}/${String(a).slice(2)}`;
}

// "R$ 12,3 mil" para os eixos (o valor exato fica no tooltip e na tabela).
function compacto(centavos: number) {
  const reais = centavos / 100;
  if (reais >= 1000) return `R$ ${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(reais).toLocaleString("pt-BR")}`;
}

// Escala "redonda" para o eixo: 1, 2, 2,5 ou 5 × 10^n.
function topoDoEixo(maximo: number) {
  if (maximo <= 0) return 10000;
  const base = 10 ** Math.floor(Math.log10(maximo));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * base >= maximo) return f * base;
  return 10 * base;
}

function TabelaDados({ titulo, colunas, linhas }: { titulo: string; colunas: string[]; linhas: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-teal-300">Ver em tabela</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs text-mist/85">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr className="border-b border-white/10 text-mist/60">
              {colunas.map((c) => (
                <th key={c} className="py-1.5 pr-4 font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} className="border-b border-white/5">
                {l.map((v, j) => (
                  <td key={j} className="py-1.5 pr-4">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Legenda({ itens }: { itens: { rotulo: string; cor: string; textura?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-mist/80">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-2">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
            <rect width="14" height="14" rx="3" fill={i.textura ? "url(#lpz-hachura)" : i.cor} stroke={i.textura ? i.cor : "none"} strokeWidth="1.5" />
          </svg>
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

// Padrão de hachura (projeção = estimativa): mesma cor do recebido, com textura.
export function DefinicoesGraficos() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <pattern id="lpz-hachura" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill={CORES.recebido} fillOpacity="0.25" />
          <line x1="0" y1="0" x2="0" y2="6" stroke={CORES.recebido} strokeWidth="2.5" />
        </pattern>
      </defs>
    </svg>
  );
}

// Barras por mês: recebido (sólido) e projetado (hachurado), empilhados.
export function GraficoMensal({ meses, mesAtual }: { meses: { mes: string; recebido: number; projetado: number }[]; mesAtual: string }) {
  const L = 720;
  const A = 260;
  const m = { esq: 64, dir: 8, topo: 12, base: 28 };
  const topo = topoDoEixo(Math.max(...meses.map((x) => x.recebido + x.projetado), 0));
  const larg = (L - m.esq - m.dir) / Math.max(meses.length, 1);
  const barra = Math.min(36, larg * 0.62);
  const y = (v: number) => m.topo + (A - m.topo - m.base) * (1 - v / topo);
  const passoRotulo = meses.length > 14 ? 2 : 1;

  return (
    <figure>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="img" aria-label="Recebido e projetado por mês">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={m.esq} x2={L - m.dir} y1={y(topo * f)} y2={y(topo * f)} stroke="rgb(255 255 255 / 0.08)" />
            <text x={m.esq - 8} y={y(topo * f) + 4} textAnchor="end" className="fill-mist/60 text-[11px]">
              {compacto(topo * f)}
            </text>
          </g>
        ))}
        {meses.map((x, i) => {
          const cx = m.esq + larg * i + larg / 2;
          const yRec = y(x.recebido);
          const yProj = y(x.recebido + x.projetado);
          const base = y(0);
          return (
            <g key={x.mes}>
              {/* área de passar o mouse maior que a barra */}
              <rect x={cx - larg / 2} y={m.topo} width={larg} height={base - m.topo} fill="transparent">
                <title>{`${rotuloMes(x.mes)} — recebido ${formatarPreco(x.recebido)}${x.projetado ? ` · projetado ${formatarPreco(x.projetado)}` : ""}`}</title>
              </rect>
              {x.recebido > 0 && (
                <rect x={cx - barra / 2} y={yRec} width={barra} height={Math.max(base - yRec, 1)} rx="4" fill={CORES.recebido} pointerEvents="none" />
              )}
              {x.projetado > 0 && (
                <rect
                  x={cx - barra / 2}
                  y={yProj}
                  width={barra}
                  height={Math.max(yRec - yProj - (x.recebido > 0 ? 2 : 0), 1)}
                  rx="4"
                  fill="url(#lpz-hachura)"
                  stroke={CORES.recebido}
                  strokeWidth="1"
                  pointerEvents="none"
                />
              )}
              {i % passoRotulo === 0 && (
                <text
                  x={cx}
                  y={A - 8}
                  textAnchor="middle"
                  className={`text-[11px] ${x.mes === mesAtual ? "fill-gold-300 font-semibold" : "fill-mist/60"}`}
                >
                  {rotuloMes(x.mes)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={m.esq} x2={L - m.dir} y1={y(0)} y2={y(0)} stroke="rgb(255 255 255 / 0.25)" />
      </svg>
      <figcaption className="mt-2">
        <Legenda
          itens={[
            { rotulo: "Recebido", cor: CORES.recebido },
            { rotulo: "Projetado (estimativa)", cor: CORES.recebido, textura: true },
          ]}
        />
      </figcaption>
      <TabelaDados
        titulo="Recebido e projetado por mês"
        colunas={["Mês", "Recebido", "Projetado"]}
        linhas={meses.map((x) => [rotuloMes(x.mes), formatarPreco(x.recebido), x.projetado ? formatarPreco(x.projetado) : "—"])}
      />
    </figure>
  );
}

// Barras horizontais: recebido por produto (uma cor só: é uma série).
export function GraficoProdutos({ itens }: { itens: { nome: string; centavos: number; quantidade: number }[] }) {
  if (itens.length === 0) return <p className="text-sm text-mist/60">Nenhuma venda paga ainda.</p>;
  const maximo = Math.max(...itens.map((i) => i.centavos));
  return (
    <figure>
      <ul className="space-y-3" aria-label="Recebido por produto">
        {itens.map((i) => (
          <li key={i.nome} title={`${i.nome}: ${formatarPreco(i.centavos)} (${i.quantidade} pago${i.quantidade === 1 ? "" : "s"})`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-mist/90">{i.nome}</span>
              <span className="shrink-0 font-semibold text-white">
                {formatarPreco(i.centavos)} <span className="font-normal text-mist/60">· {i.quantidade}</span>
              </span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-white/5">
              <div className="h-3 rounded-full" style={{ width: `${Math.max((i.centavos / maximo) * 100, 1.5)}%`, background: CORES.recebido }} />
            </div>
          </li>
        ))}
      </ul>
      <TabelaDados
        titulo="Recebido por produto"
        colunas={["Produto", "Recebido", "Pagos"]}
        linhas={itens.map((i) => [i.nome, formatarPreco(i.centavos), i.quantidade])}
      />
    </figure>
  );
}

// Rosca: para onde foi cada pedido (recebido, em andamento, estornos, não pagos).
export function GraficoRosca({ fatias }: { fatias: { rotulo: string; centavos: number; quantidade: number; cor: string }[] }) {
  const total = fatias.reduce((t, f) => t + f.centavos, 0);
  const R = 80;
  const r = 52;
  const C = 100;
  let angulo = -Math.PI / 2;
  const ponto = (raio: number, a: number) => `${C + raio * Math.cos(a)} ${C + raio * Math.sin(a)}`;
  const visiveis = fatias.filter((f) => f.centavos > 0);

  return (
    <figure className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 200 200" className="h-48 w-48 shrink-0" role="img" aria-label="Distribuição dos pedidos por situação">
        {total === 0 ? (
          <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={R - r} />
        ) : visiveis.length === 1 ? (
          <circle cx={C} cy={C} r={(R + r) / 2} fill="none" stroke={visiveis[0].cor} strokeWidth={R - r}>
            <title>{`${visiveis[0].rotulo}: ${formatarPreco(visiveis[0].centavos)}`}</title>
          </circle>
        ) : (
          visiveis.map((f) => {
            const fatia = (f.centavos / total) * Math.PI * 2;
            const ini = angulo;
            const fim = angulo + fatia;
            angulo = fim;
            const grande = fatia > Math.PI ? 1 : 0;
            const d = `M ${ponto(R, ini)} A ${R} ${R} 0 ${grande} 1 ${ponto(R, fim)} L ${ponto(r, fim)} A ${r} ${r} 0 ${grande} 0 ${ponto(r, ini)} Z`;
            return (
              // contorno da cor do fundo = 2px de respiro entre as fatias
              <path key={f.rotulo} d={d} fill={f.cor} stroke="#072a31" strokeWidth="2">
                <title>{`${f.rotulo}: ${formatarPreco(f.centavos)} (${Math.round((f.centavos / total) * 100)}%)`}</title>
              </path>
            );
          })
        )}
        <text x={C} y={C - 4} textAnchor="middle" className="fill-mist/60 text-[11px]">Total</text>
        <text x={C} y={C + 14} textAnchor="middle" className="fill-white text-[13px] font-semibold">{compacto(total)}</text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-mist/85">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm" style={{ background: f.cor }} />
              {f.rotulo}
            </span>
            <span className="text-right font-semibold text-white">
              {formatarPreco(f.centavos)}{" "}
              <span className="font-normal text-mist/60">
                · {f.quantidade} · {total ? Math.round((f.centavos / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
