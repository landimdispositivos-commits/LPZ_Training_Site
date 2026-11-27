import type { Metadata } from "next";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoDaGestao } from "@/modules/bar";
import { Campo, classeInput } from "../../../_components/form-ui";
import { BotaoSalvar } from "../../../_components/botao-salvar";
import { GestaoShell } from "../../_components/gestao-shell";
import { definirEmAndamentoAction, salvarEventoAction } from "../actions";

export const metadata: Metadata = { title: "Bar — Eventos — LPZ Training" };

export default async function Page(props: PageProps<"/bar/gestao/eventos">) {
  await exigirBar("admin");
  const { ok, erro, evento: pedido } = await props.searchParams;
  const { eventos, evento } = await eventoDaGestao(pedido);

  return (
    <GestaoShell titulo="Eventos" atual="/bar/gestao/eventos" eventos={eventos} evento={evento} ok={ok} erro={erro}>
      <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
        <p className="text-sm text-mist/70">
          Cada festa tem o seu estoque, as suas compras e as suas vendas. O evento <strong className="text-white">em andamento</strong> é o
          que aparece no cardápio dos clientes.
        </p>
        <details className="mt-4" open={eventos.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold text-gold-300">+ Novo evento</summary>
          <FormEvento />
        </details>
      </section>

      <ul className="space-y-3">
        {eventos.map((e) => (
          <li key={e.id} className="rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{e.nome}</p>
                <p className="text-sm text-mist/60">
                  {[e.usaCaixa && "Caixa", e.usaComanda && "Comanda", e.usaOnline && "Pedido online"].filter(Boolean).join(" + ") || "Nenhuma forma de venda ligada"} ·{" "}
                  {e.inicio ? e.inicio.split("-").reverse().join("/") : "sem data"}
                  {e.fim ? ` a ${e.fim.split("-").reverse().join("/")}` : ""}
                </p>
              </div>
              {e.emAndamento ? (
                <span className="rounded-full bg-teal-400/20 px-3 py-1 text-xs font-semibold text-teal-200">Em andamento</span>
              ) : (
                <form action={definirEmAndamentoAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="rounded-full border border-teal-400/60 px-4 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-400/10">
                    Colocar em andamento
                  </button>
                </form>
              )}
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-teal-300">Editar</summary>
              <FormEvento evento={e} />
            </details>
          </li>
        ))}
      </ul>
    </GestaoShell>
  );
}

function FormEvento({ evento }: { evento?: { id: string; nome: string; inicio: string | null; fim: string | null; usaCaixa: boolean; usaComanda: boolean; usaOnline: boolean } }) {
  const p = evento?.id ?? "novo-evento";
  return (
    <form action={salvarEventoAction} className="mt-4 grid gap-4 sm:grid-cols-3">
      {evento && <input type="hidden" name="id" value={evento.id} />}
      <Campo id={`${p}-nome`} label="Nome do evento">
        <input id={`${p}-nome`} name="nome" required maxLength={120} defaultValue={evento?.nome} placeholder="LPZ Training 2027" className={classeInput} />
      </Campo>
      <Campo id={`${p}-inicio`} label="Início (opcional)">
        <input id={`${p}-inicio`} name="inicio" type="date" defaultValue={evento?.inicio ?? ""} className={classeInput} />
      </Campo>
      <Campo id={`${p}-fim`} label="Fim (opcional)">
        <input id={`${p}-fim`} name="fim" type="date" defaultValue={evento?.fim ?? ""} className={classeInput} />
      </Campo>
      <fieldset className="flex flex-wrap gap-5 sm:col-span-3">
        <legend className="mb-2 text-xs text-mist/70">Formas de venda ligadas neste evento</legend>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="usaCaixa" defaultChecked={evento?.usaCaixa ?? true} className="h-4 w-4 accent-gold-400" />
          Caixa com ticket (venda direta)
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="usaComanda" defaultChecked={evento?.usaComanda ?? true} className="h-4 w-4 accent-gold-400" />
          Comanda (pulseira ou cartão com número)
        </label>
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="usaOnline" defaultChecked={evento?.usaOnline ?? true} className="h-4 w-4 accent-gold-400" />
          Pedido online pelo site (Pix e cartão)
        </label>
      </fieldset>
      <div className="sm:col-span-3">
        <BotaoSalvar />
      </div>
    </form>
  );
}
