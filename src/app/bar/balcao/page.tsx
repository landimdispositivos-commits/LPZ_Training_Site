import type { Metadata } from "next";
import Link from "next/link";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { exigirBar } from "@/modules/auth/sessao";
import { eventoEmAndamento } from "@/modules/bar";
import { ticketsPendentes } from "@/modules/bar/caixa";
import { Aviso, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { buscarTicketAction } from "../caixa/actions";
import { LeitorTicket } from "./leitor-ticket";

export const metadata: Metadata = { title: "Bar — Balcão — LPZ Training" };

export default async function Page(props: PageProps<"/bar/balcao">) {
  await exigirBar("balcao");
  const { erro } = await props.searchParams;
  const evento = await eventoEmAndamento();
  const pendentes = evento ? await ticketsPendentes(evento.id) : [];

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl uppercase tracking-[0.2em] text-gold-metal sm:text-2xl">Bar — Balcão</h1>
            <Link href="/bar" className="text-sm text-teal-300 hover:underline">Voltar ao Bar</Link>
          </div>
          {erro === "naoachou" && <Aviso tipo="erro">Ticket não encontrado. Confira o código.</Aviso>}

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <LeitorTicket />
            <form action={buscarTicketAction} className="flex gap-2">
              <label htmlFor="codigo" className="sr-only">Código do ticket</label>
              <input id="codigo" name="codigo" required autoFocus autoComplete="off" maxLength={80} placeholder="Código do ticket" className={`${classeInput} font-mono uppercase tracking-widest`} />
              <button type="submit" className="rounded-lg bg-teal-400 px-4 font-semibold text-petrol-950 hover:brightness-110">Abrir</button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Aguardando retirada ({pendentes.length})</h2>
            {pendentes.length === 0 ? (
              <p className="mt-3 text-sm text-mist/70">Nenhum pedido na fila.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10 text-sm">
                {pendentes.map((p) => (
                  <li key={p.codigo} className="flex items-center justify-between gap-2 py-2">
                    <span className="text-mist">
                      <strong className="text-white">Nº {p.numero}</strong> · {formatarDataHora(p.criadoEm)} · {formatarPreco(p.total)}
                    </span>
                    <Link href={`/bar/ticket/${p.codigo}`} className="rounded-full border border-gold-500/60 px-3 py-1 font-semibold text-gold-300 hover:bg-gold-500/10">Abrir</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
