import { formatarPreco } from "@/lib/formatar";

// Gráficos simples em SVG/CSS (sem biblioteca). Cores do tema LPZ.

export function Barras({
  dados,
  formato = "dinheiro",
  rotuloEixo,
}: {
  dados: { rotulo: string; valor: number; extra?: string }[];
  formato?: "dinheiro" | "numero";
  rotuloEixo?: string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const largura = 100 / Math.max(dados.length, 1);
  const fmt = (v: number) => (formato === "dinheiro" ? formatarPreco(v) : String(v));
  return (
    <figure>
      <svg viewBox="0 0 100 52" role="img" aria-label={rotuloEixo ?? "Gráfico de barras"} className="h-48 w-full" preserveAspectRatio="none">
        <title>{rotuloEixo ?? "Gráfico de barras"}</title>
        <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.3" />
        {dados.map((d, i) => {
          const h = (d.valor / max) * 36;
          return (
            <g key={d.rotulo}>
              <title>{`${d.rotulo}: ${fmt(d.valor)}${d.extra ? ` (${d.extra})` : ""}`}</title>
              <rect x={i * largura + largura * 0.15} y={40 - h} width={largura * 0.7} height={Math.max(h, d.valor > 0 ? 0.6 : 0)} rx="0.6" className="fill-gold-400" />
            </g>
          );
        })}
      </svg>
      <div className="flex text-[10px] text-mist/60" aria-hidden="true">
        {dados.map((d) => (
          <span key={d.rotulo} className="flex-1 truncate text-center">{d.rotulo}</span>
        ))}
      </div>
      <figcaption className="sr-only">
        {dados.map((d) => `${d.rotulo}: ${fmt(d.valor)}`).join("; ")}
      </figcaption>
    </figure>
  );
}

// Barra horizontal com rótulo e valor (ranking).
export function Ranking({ itens }: { itens: { rotulo: string; valor: number; texto: string; sub?: string }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="space-y-3">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-white">{i.rotulo}</span>
            <span className="shrink-0 text-mist">{i.texto}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold-400" style={{ width: `${Math.max((i.valor / max) * 100, 2)}%` }} />
          </div>
          {i.sub && <p className="mt-0.5 text-xs text-mist/60">{i.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
