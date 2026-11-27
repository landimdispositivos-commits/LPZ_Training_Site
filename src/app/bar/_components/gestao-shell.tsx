import Link from "next/link";
import type { barEventos } from "@/db/schema";
import { Aviso } from "../../_components/form-ui";
import { acessoBar } from "@/modules/auth/papeis";
import { sessaoDeVerdade } from "@/modules/auth/sessao";
import { SiteHeader } from "../../_components/site-header";
import { definirEmAndamentoAction } from "../gestao/actions";
import { SeletorEvento } from "./seletor-evento";

type Evento = typeof barEventos.$inferSelect;

// Cada aba lista quem pode vê-la (a gestão vê todas).
const ABAS: { href: string; rotulo: string; ver: ("gestao" | "admin" | "caixa")[] }[] = [
  { href: "/bar/gestao", rotulo: "Resumo", ver: ["gestao"] },
  { href: "/bar/gestao/dashboard", rotulo: "Dashboard", ver: ["gestao"] },
  { href: "/bar/gestao/eventos", rotulo: "Eventos", ver: ["admin"] },
  { href: "/bar/gestao/produtos", rotulo: "Produtos", ver: ["admin", "caixa"] },
  { href: "/bar/gestao/estoque", rotulo: "Estoque", ver: ["admin"] },
  { href: "/bar/gestao/compras", rotulo: "Compras", ver: ["admin"] },
  { href: "/bar/gestao/vendas", rotulo: "Vendas e caixas", ver: ["gestao", "caixa"] },
  { href: "/bar/gestao/comandas", rotulo: "Comandas", ver: ["gestao", "caixa"] },
];

const OK: Record<string, string> = {
  salvo: "Salvo.",
  andamento: "Evento em andamento atualizado.",
  copiado: "Produtos copiados para este evento.",
  ajustado: "Estoque ajustado.",
  registrada: "Compra registrada e estoque atualizado.",
  estornada: "Venda estornada e estoque devolvido.",
  devolvido: "Pagamento devolvido ao cliente.",
  recebida: "Comanda recebida e contabilizada no seu caixa.",
  ficha: "Ficha técnica salva. O custo do produto foi recalculado.",
};

const ERRO: Record<string, string> = {
  dados: "Confira os campos e tente de novo.",
  vazio: "Nada para salvar: preencha pelo menos um item.",
  saldo: "A quantidade é maior que o saldo em estoque.",
  motivo: "Informe o motivo do estorno (mínimo 3 letras).",
  estorno: "Esta venda não pode ser estornada.",
  entregue: "O pedido já foi entregue: não dá para estornar.",
  vazia: "A comanda está sem itens para cobrar.",
  recebido: "O valor recebido é menor que o total.",
  comanda: "Esta comanda não está mais aberta.",
  gateway: "Não foi possível devolver o pagamento pelo Mercado Pago agora. Tente de novo.",
  ficha: "Este produto tem ficha técnica: use só baixas (perda, cortesia...) e cadastre a receita primeiro.",
};

export function hrefComEvento(caminho: string, eventoId?: string | null) {
  return eventoId ? `${caminho}?evento=${eventoId}` : caminho;
}

// Moldura das telas de gestão do Bar: abas, seletor de evento e avisos.
export async function GestaoShell({
  titulo,
  atual,
  eventos,
  evento,
  ok,
  erro,
  exportar,
  children,
}: {
  titulo: string;
  atual: string;
  eventos: Evento[];
  evento: Evento | null;
  ok?: unknown;
  erro?: unknown;
  exportar?: "vendas" | "estoque" | "compras";
  children: React.ReactNode;
}) {
  const sessao = await sessaoDeVerdade();
  const acesso = sessao ? acessoBar(sessao.user) : { gestao: false, admin: false, caixa: false, balcao: false };
  const abas = ABAS.filter((a) => a.ver.some((n) => acesso[n]));
  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Bar — {titulo}</h1>
            <span className="flex flex-wrap gap-4 text-sm">
              {exportar && evento && acesso.gestao && (
                <a href={`/bar/gestao/exportar?tipo=${exportar}&evento=${evento.id}`} className="text-teal-300 hover:underline">
                  Exportar para Excel (CSV)
                </a>
              )}
              <Link href="/bar" className="text-teal-300 hover:underline">Ver cardápio</Link>
            </span>
          </div>

          <nav aria-label="Áreas da gestão do Bar" className="flex flex-wrap gap-2">
            {abas.map((a) => (
              <Link
                key={a.href}
                href={hrefComEvento(a.href, evento?.id)}
                aria-current={a.href === atual ? "page" : undefined}
                className={
                  a.href === atual
                    ? "bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink"
                    : "rounded-full border border-gold-500/40 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/10"
                }
              >
                {a.rotulo}
              </Link>
            ))}
          </nav>

          {eventos.length > 0 && (
            <form method="get" className="flex flex-wrap items-end gap-3">
              <SeletorEvento eventos={eventos.map((e) => ({ id: e.id, nome: e.nome, emAndamento: e.emAndamento }))} atual={evento?.id} />
              <noscript>
                <button type="submit" className="rounded-full border border-teal-400/60 px-4 py-2.5 text-sm font-semibold text-teal-300">Ver</button>
              </noscript>
            </form>
          )}
          {evento && (
            <div className="text-xs text-mist/70">
              Você está vendo e editando: <strong className="text-white">{evento.nome}</strong>. Produtos, estoque, compras e vendas são separados por
              evento.{" "}
              {evento.emAndamento ? (
                "Este é o evento que os clientes e o caixa usam agora."
              ) : !acesso.admin ? (
                <span className="text-ember-400">Este evento não está em andamento.</span>
              ) : (
                <>
                  <span className="text-ember-400">Este evento não está em andamento: os clientes não veem estes produtos.</span>{" "}
                  <form action={definirEmAndamentoAction} className="inline">
                    <input type="hidden" name="id" value={evento.id} />
                    <button type="submit" className="font-semibold text-teal-300 underline">Colocar em andamento</button>
                  </form>
                </>
              )}
            </div>
          )}

          {typeof ok === "string" && OK[ok] && <Aviso tipo="ok">{OK[ok]}</Aviso>}
          {typeof erro === "string" && ERRO[erro] && <Aviso tipo="erro">{ERRO[erro]}</Aviso>}

          {children}
        </div>
      </main>
    </>
  );
}

export function SemEvento() {
  return (
    <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6 text-sm text-mist/80">
      Nenhum evento cadastrado ainda. Comece criando o primeiro em{" "}
      <Link href="/bar/gestao/eventos" className="text-teal-300 underline">Eventos</Link>.
    </section>
  );
}
