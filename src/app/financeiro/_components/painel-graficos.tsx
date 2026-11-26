import { formatarPreco } from "@/lib/formatar";
import { painelFinanceiro } from "@/modules/financeiro";
import { nomeDoProduto } from "@/modules/ingressos";
import { CORES, DefinicoesGraficos, GraficoMensal, GraficoProdutos, GraficoRosca, rotuloMes } from "./graficos";

function Cartao({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-petrol-900/80 p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-300">{titulo}</h2>
      {children}
    </section>
  );
}

function Numero({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
      <p className="text-sm text-mist/70">{rotulo}</p>
      <p className="text-gold-metal mt-1 text-2xl font-extrabold sm:text-3xl">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-mist/60">{detalhe}</p>}
    </div>
  );
}

// Aba "Gráficos" do Financeiro.
export async function PainelGraficos() {
  const p = await painelFinanceiro();
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  const ultimoMes = p.meses[p.meses.length - 1]?.mes;

  return (
    <div className="space-y-6">
      <DefinicoesGraficos />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Numero
          rotulo="Recebido até agora"
          valor={formatarPreco(p.recebido.centavos)}
          detalhe={`${plural(p.recebido.quantidade, "item pago", "itens pagos")} · ${plural(p.recebido.compradores, "comprador", "compradores")}`}
        />
        <Numero
          rotulo="Em andamento (sacola / aguardando)"
          valor={formatarPreco(p.provisionado.centavos)}
          detalhe={`${plural(p.provisionado.quantidade, "pedido reservado", "pedidos reservados")} por até 30 min`}
        />
        <Numero
          rotulo={`Projeção até ${ultimoMes ? rotuloMes(ultimoMes) : "o evento"}`}
          valor={formatarPreco(p.projetadoAteEvento)}
          detalhe={`Ritmo atual: ${formatarPreco(p.ritmoDiario)} por dia`}
        />
        <Numero rotulo="Potencial se os lotes esgotarem" valor={formatarPreco(p.potencialRestante)} detalhe="Vagas livres nos lotes ativos × preço" />
      </div>

      <Cartao titulo="Recebido e projetado por mês">
        <GraficoMensal meses={p.meses} mesAtual={p.mesAtual} />
        <p className="mt-3 text-xs text-mist/60">
          A projeção é uma estimativa: repete o ritmo de vendas dos últimos 30 dias até o mês do evento, sem passar do que ainda há
          de vagas nos lotes ativos. O mês atual inclui as compras em andamento. Pagamentos parcelados no cartão entram pelo valor
          total na data da aprovação (o repasse segue a configuração da conta do Mercado Pago).
        </p>
      </Cartao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Recebido por produto">
          <GraficoProdutos itens={p.porProduto.map((x) => ({ nome: nomeDoProduto(x.tipo), centavos: x.centavos, quantidade: x.quantidade }))} />
        </Cartao>
        <Cartao titulo="Situação dos pedidos">
          <GraficoRosca
            fatias={[
              { rotulo: "Recebido", centavos: p.recebido.centavos, quantidade: p.recebido.quantidade, cor: CORES.recebido },
              { rotulo: "Em andamento (sacola)", centavos: p.provisionado.centavos, quantidade: p.provisionado.quantidade, cor: CORES.provisionado },
              {
                rotulo: "Estornos (feitos + aguardando)",
                centavos: p.estornado.centavos + p.estornoPendente.centavos,
                quantidade: p.estornado.quantidade + p.estornoPendente.quantidade,
                cor: CORES.estorno,
              },
              { rotulo: "Não pagos (reserva venceu)", centavos: p.naoPago.centavos, quantidade: p.naoPago.quantidade, cor: CORES.naoPago },
            ]}
          />
          <p className="mt-4 text-xs text-mist/60">
            “Não pagos” são reservas que venceram sem pagamento (a pessoa desistiu ou o pagamento não foi aprovado em 30 min).
            Estornos aguardando aprovação: {plural(p.estornoPendente.quantidade, "pedido", "pedidos")} ({formatarPreco(p.estornoPendente.centavos)}).
          </p>
        </Cartao>
      </div>
    </div>
  );
}
