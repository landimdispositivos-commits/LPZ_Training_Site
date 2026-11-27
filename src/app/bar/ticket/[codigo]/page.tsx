import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "react-qr-code";
import { formatarDataHora, formatarPreco } from "@/lib/formatar";
import { acessoBar } from "@/modules/auth/papeis";
import { exigirBar } from "@/modules/auth/sessao";
import { extrairCodigo, ROTULO_FORMA, ticketPorCodigo } from "@/modules/bar/caixa";
import { Aviso } from "../../../_components/form-ui";
import { SiteHeader } from "../../../_components/site-header";
import { BotaoImprimir } from "./botao-imprimir";
import { Retirada } from "./retirada";

export const metadata: Metadata = { title: "Ticket do Bar — LPZ Training" };

const ERROS: Record<string, string> = {
  jaentregue: "Este ticket já foi todo entregue ou foi cancelado.",
  quantidade: "Quantidade maior que o saldo do ticket.",
  nada: "Escolha pelo menos um item para entregar.",
};

// Ticket do Bar. Só a equipe (caixa, balcão, gestão) abre: o QR leva a este
// endereço e as retiradas são sempre conferidas no banco, nunca pelo QR.
export default async function Page(props: PageProps<"/bar/ticket/[codigo]">) {
  const { user } = await exigirBar(["caixa", "balcao"]);
  const { codigo: bruto } = await props.params;
  const { novo, ok, erro } = await props.searchParams;
  const codigo = extrairCodigo(decodeURIComponent(bruto));
  const t = await ticketPorCodigo(codigo);
  if (!t) notFound();
  const acesso = acessoBar(user);
  const url = `${(process.env.APP_URL ?? "http://localhost:3005").replace(/\/$/, "")}/bar/ticket/${t.codigo}`;
  const rotuloStatus = { pendente: "AGUARDANDO RETIRADA", parcial: "RETIRADA PARCIAL", entregue: "ENTREGUE", cancelado: "CANCELADO" }[t.status] ?? t.status;
  const corStatus =
    t.status === "pendente" || t.status === "parcial"
      ? "border-gold-400 bg-gold-400/10 text-gold-300"
      : t.status === "entregue"
        ? "border-teal-400 bg-teal-400/15 text-teal-300"
        : "border-ember-500 bg-ember-500/15 text-ember-400";
  const aberto = t.status === "pendente" || t.status === "parcial";
  const restantes = t.itens.reduce((s, i) => s + (i.quantidade - i.retirados), 0);

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-md space-y-4">
          {novo === "1" && <Aviso tipo="ok">Venda registrada! Entregue este ticket ao cliente.</Aviso>}
          {ok === "entregue" && <Aviso tipo="ok">Pedido todo entregue.</Aviso>}
          {ok === "parcial" && <Aviso tipo="ok">Entrega registrada. Ainda há itens a retirar neste ticket.</Aviso>}
          {typeof erro === "string" && ERROS[erro] && <Aviso tipo="erro">{ERROS[erro]}</Aviso>}

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/90 p-6 text-center">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-gold-300">Bar — Ticket nº {t.numero}</p>
            <p className={`rounded-xl border-2 px-4 py-3 text-lg font-extrabold ${corStatus}`}>{rotuloStatus}</p>
            <div className="inline-block rounded-xl bg-white p-3">
              <QRCode value={url} size={176} aria-label={`QR do ticket ${t.codigo}`} />
            </div>
            <p className="font-mono text-2xl font-bold tracking-[0.3em] text-white">{t.codigo}</p>
            {aberto && <p className="text-sm text-mist/70">Restam <strong className="text-white">{restantes}</strong> {restantes === 1 ? "item" : "itens"} para retirar. O mesmo QR vale até acabar.</p>}

            <ul className="divide-y divide-white/10 text-left text-sm">
              {t.itens.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2">
                  <span className="text-white">{i.quantidade}× {i.nome}<span className="block text-xs text-mist/60">retirados {i.retirados} de {i.quantidade}</span></span>
                  <span className="text-mist">{formatarPreco(i.quantidade * i.precoUnitCentavos)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-white/10 pt-2 text-left font-semibold text-white">
              <span>Total ({ROTULO_FORMA[t.forma] ?? t.forma})</span>
              <span>{formatarPreco(t.total)}</span>
            </p>
            <p className="text-xs text-mist/60">{formatarDataHora(t.criadoEm)}</p>
          </section>

          {aberto && acesso.balcao && <Retirada codigo={t.codigo} itens={t.itens.map((i) => ({ id: i.id, nome: i.nome, quantidade: i.quantidade, retirados: i.retirados }))} />}

          {t.historico.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-4 text-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-300">Histórico de retiradas</h2>
              <ul className="mt-2 space-y-1 text-mist">
                {t.historico.map((h, idx) => (
                  <li key={idx}>
                    <strong className="text-white">{h.quantidade}× {h.nome}</strong> · {formatarDataHora(h.em)}{h.por ? ` · ${h.por}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <BotaoImprimir />
            {acesso.caixa && <Link href="/bar/caixa" className="text-teal-300 hover:underline">Nova venda</Link>}
            {acesso.balcao && <Link href="/bar/balcao" className="text-teal-300 hover:underline">Balcão</Link>}
          </div>
        </div>
      </main>
    </>
  );
}
