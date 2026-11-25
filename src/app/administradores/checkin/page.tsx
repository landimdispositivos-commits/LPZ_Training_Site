import type { Metadata } from "next";
import Link from "next/link";
import { buscarCompras, type CompraEncontrada } from "@/modules/checkin";
import { codigoCurto, nomeDoProduto } from "@/modules/ingressos";
import { exigirAdmin } from "@/modules/auth/sessao";
import { formatarDataHora } from "@/lib/formatar";
import {
  agruparPorPedido,
  presencasDosPedidos,
  resumoPresencas,
  rotuloPresenca,
  ultimasPresencas,
  type DiaPresenca,
  type Presenca,
} from "@/modules/presencas";
import { BotoesPresenca } from "../../_components/botoes-presenca";
import { classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { LeitorQr } from "./leitor-qr";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

export const metadata: Metadata = { title: "Check-in — LPZ Training" };

const VERDE = "border-teal-400 bg-teal-400/15 text-teal-300";
const LARANJA = "border-ember-500 bg-ember-500/15 text-ember-400";
const RESULTADOS = {
  ok: { titulo: "PRESENÇA REGISTRADA", classe: VERDE },
  "ja-registrado": { titulo: "JÁ REGISTRADO NESTE DIA", classe: LARANJA },
  cancelado: { titulo: "INGRESSO CANCELADO", classe: LARANJA },
  "nao-pago": { titulo: "PAGAMENTO NÃO CONFIRMADO", classe: LARANJA },
  "dia-invalido": { titulo: "ESTE PRODUTO NÃO VALE PARA ESSE DIA", classe: LARANJA },
  "nao-encontrado": { titulo: "COMPRA NÃO ENCONTRADA", classe: LARANJA },
} as const;

export default async function Page(props: PageProps<"/administradores/checkin">) {
  await carregarCatalogo();
  await exigirAdmin(["organizador", "portaria"]);
  const { q, r, pedido } = await props.searchParams;
  const termo = typeof q === "string" ? q.slice(0, 200) : typeof pedido === "string" ? pedido : "";
  const resultado = typeof r === "string" && r in RESULTADOS ? RESULTADOS[r as keyof typeof RESULTADOS] : null;

  const [encontrados, resumo, ultimas] = await Promise.all([
    termo ? buscarCompras(termo) : Promise.resolve([]),
    resumoPresencas(),
    ultimasPresencas(),
  ]);
  const porPedido = agruparPorPedido(await presencasDosPedidos(encontrados.map((e) => e.pedidoId)));

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-10">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal">Check-in</h1>
            <Link href="/administradores/painel" className="text-sm text-teal-300 hover:underline">Painel</Link>
          </div>

          <p className="text-sm text-mist/80">
            Pessoas que já entraram: <strong className="text-white">{resumo.presentes}</strong> de{" "}
            <strong className="text-white">{resumo.total}</strong> compras de entrada pagas.
          </p>

          {resultado && (
            <div role="status" className={`rounded-2xl border-2 p-5 text-center ${resultado.classe}`}>
              <p className="text-2xl font-extrabold tracking-wide">{resultado.titulo}</p>
            </div>
          )}

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <LeitorQr />
            <form method="get" className="flex gap-2">
              <label htmlFor="busca" className="sr-only">Código, nome ou e-mail</label>
              <input
                id="busca"
                name="q"
                defaultValue={typeof q === "string" ? q : ""}
                autoFocus
                autoComplete="off"
                placeholder="Código (8 letras), nome ou e-mail"
                className={classeInput}
              />
              <button type="submit" className="rounded-lg bg-teal-400 px-4 font-semibold text-petrol-950 hover:brightness-110">
                Buscar
              </button>
            </form>
          </section>

          {termo && (
            <section className="space-y-3">
              {encontrados.length === 0 ? (
                <p className="text-sm text-mist/70">Nenhuma compra encontrada para “{termo}”.</p>
              ) : (
                encontrados.map((c) => <CartaoCompra key={c.pedidoId} compra={c} registros={porPedido.get(c.pedidoId) ?? []} />)
              )}
            </section>
          )}

          {ultimas.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Últimos registros</h2>
              <ul className="mt-3 divide-y divide-white/5 text-sm">
                {ultimas.map((u) => (
                  <li key={u.id} className="flex justify-between gap-3 py-2">
                    <span className="text-white">
                      {u.nome} <span className="text-mist/60">· {rotuloPresenca(u.tipo, u.dia as DiaPresenca)}</span>
                    </span>
                    <span className="shrink-0 text-mist/60">{formatarDataHora(u.registradoEm)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function CartaoCompra({ compra, registros }: { compra: CompraEncontrada; registros: Presenca[] }) {
  const pago = compra.pedidoStatus === "pago";
  const cancelado = compra.ingressoStatus === "cancelado";
  const situacao = !pago ? "Pagamento não confirmado" : cancelado ? "Cancelado" : "Pago";

  return (
    <div className="rounded-2xl border border-white/10 bg-petrol-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{compra.nome}</p>
          <p className="text-sm text-mist/60">
            {nomeDoProduto(compra.tipo)} · {compra.loteNome} · código {codigoCurto(compra.ingressoId ?? compra.pedidoId)}
          </p>
        </div>
        <span
          className={
            pago && !cancelado
              ? "rounded-full bg-teal-400/15 px-3 py-1 text-xs text-teal-300"
              : "rounded-full bg-ember-500/15 px-3 py-1 text-xs text-ember-400"
          }
        >
          {situacao}
        </span>
      </div>
      {pago && !cancelado && (
        <BotoesPresenca pedidoId={compra.pedidoId} tipo={compra.tipo} registros={registros} podeRegistrar voltar="checkin" />
      )}
    </div>
  );
}
