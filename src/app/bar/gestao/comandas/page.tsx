import type { Metadata } from "next";
import Link from "next/link";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao } from "@/modules/bar";
import { comandasAbertas, comandasPagas } from "@/modules/bar/comanda";
import { GestaoShell, SemEvento } from "../../_components/gestao-shell";
import { ListaComandas, situacaoDe } from "../../_components/lista-comandas";

export const metadata: Metadata = { title: "Bar — Comandas — LPZ Training" };

export default async function Page(props: PageProps<"/bar/gestao/comandas">) {
  const { user } = await exigirBar(["gestao", "caixa"]);
  const podeReceber = acessoBar(user).caixa;
  const { ok, erro, evento: pedido, situacao } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);
  const [abertas, pagas] = evento ? await Promise.all([comandasAbertas(evento.id), comandasPagas(evento.id)]) : [[], []];

  return (
    <GestaoShell titulo="Comandas" atual="/bar/gestao/comandas" eventos={eventos} evento={evento} ok={ok} erro={erro}>
      {!evento ? (
        <SemEvento />
      ) : (
        <>
          {!evento.usaComanda && (
            <p className="rounded-2xl border border-white/10 bg-petrol-900/80 p-4 text-sm text-mist/80">
              A comanda está desligada neste evento. Ligue em <Link href="/bar/gestao/eventos" className="text-teal-300 underline">Eventos</Link>.
            </p>
          )}
          <ListaComandas
            abertas={abertas}
            pagas={pagas}
            situacao={situacaoDe(situacao)}
            base="/bar/gestao/comandas"
            extra={{ evento: evento.id }}
            podeReceber={podeReceber}
            voltar="gestao"
          />
        </>
      )}
    </GestaoShell>
  );
}
