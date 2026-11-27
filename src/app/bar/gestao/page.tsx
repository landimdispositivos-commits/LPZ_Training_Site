import type { Metadata } from "next";
import Link from "next/link";
import { formatarPreco } from "@/lib/formatar";
import { redirect } from "next/navigation";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao, listarCompras, listarProdutosComSaldo } from "@/modules/bar";
import { GestaoShell, hrefComEvento, SemEvento } from "../_components/gestao-shell";

export const metadata: Metadata = { title: "Bar — Gestão — LPZ Training" };

export default async function Page(props: PageProps<"/bar/gestao">) {
  const { user } = await exigirBar(["gestao", "admin", "caixa"]);
  // Quem não tem a gestão completa vai direto para a primeira área que pode usar.
  if (!acessoBar(user).gestao) redirect("/bar/gestao/produtos");
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);
  const [produtos, compras] = evento ? await Promise.all([listarProdutosComSaldo(evento.id), listarCompras(evento.id, 500)]) : [[], []];
  const ativos = produtos.filter((p) => p.ativo);
  const diretos = ativos.filter((p) => !p.usaFicha);
  const valorEstoqueCusto = diretos.reduce((s, p) => s + Math.max(p.saldo, 0) * p.custoCentavos, 0);
  const valorEstoqueVenda = diretos.filter((p) => p.aVenda).reduce((s, p) => s + Math.max(p.saldo, 0) * p.precoCentavos, 0);
  const baixos = ativos.filter((p) => p.saldo <= p.estoqueMinimo).length;
  const gastoCompras = compras.reduce((s, c) => s + c.totalCentavos, 0);

  const cartoes = [
    { rotulo: "Produtos ativos", valor: String(ativos.length) },
    { rotulo: "Estoque baixo", valor: String(baixos) },
    { rotulo: "Estoque a preço de custo", valor: formatarPreco(valorEstoqueCusto) },
    { rotulo: "Potencial de venda do estoque", valor: formatarPreco(valorEstoqueVenda) },
    { rotulo: "Lucro potencial do estoque", valor: formatarPreco(valorEstoqueVenda - valorEstoqueCusto) },
    { rotulo: "Gasto em compras", valor: formatarPreco(gastoCompras) },
  ];

  return (
    <GestaoShell titulo="Gestão" atual="/bar/gestao" eventos={eventos} evento={evento} ok={ok} erro={erro}>
      {!evento ? (
        <SemEvento />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {cartoes.map((c) => (
              <div key={c.rotulo} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
                <p className="text-xs uppercase tracking-wider text-mist/60">{c.rotulo}</p>
                <p className="text-gold-metal mt-1 text-2xl font-extrabold">{c.valor}</p>
              </div>
            ))}
          </div>
          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6 text-sm text-mist/80">
            <p>
              Próximos passos: cadastre os <Link href={hrefComEvento("/bar/gestao/produtos", evento.id)} className="text-teal-300 underline">produtos</Link>,
              registre as <Link href={hrefComEvento("/bar/gestao/compras", evento.id)} className="text-teal-300 underline">compras</Link> de
              insumos e acompanhe o <Link href={hrefComEvento("/bar/gestao/estoque", evento.id)} className="text-teal-300 underline">estoque</Link>.
              Veja o lucro, as perdas e a projeção no <Link href={hrefComEvento("/bar/gestao/dashboard", evento.id)} className="text-teal-300 underline">dashboard</Link>.
            </p>
          </section>
        </>
      )}
    </GestaoShell>
  );
}
