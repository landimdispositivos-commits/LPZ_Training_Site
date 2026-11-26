import Link from "next/link";

// Abas do Financeiro: tabelas (lotes, pedidos, estornos) × gráficos.
export function AbasFinanceiro({ ativa }: { ativa: "tabelas" | "graficos" }) {
  const aba = (id: "tabelas" | "graficos", href: string, rotulo: string) => (
    <Link
      href={href}
      aria-current={ativa === id ? "page" : undefined}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        ativa === id ? "bg-gold-metal text-gold-ink" : "border border-white/15 text-mist/80 hover:bg-white/10"
      }`}
    >
      {rotulo}
    </Link>
  );
  return (
    <nav aria-label="Visões do financeiro" className="flex flex-wrap gap-2">
      {aba("tabelas", "/financeiro", "📋 Tabelas")}
      {aba("graficos", "/financeiro?aba=graficos", "📊 Gráficos")}
    </nav>
  );
}
