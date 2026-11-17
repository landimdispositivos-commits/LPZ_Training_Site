import type { Metadata } from "next";
import Link from "next/link";
import { buscarIngressos, resumoCheckin, ultimasEntradas, type IngressoEncontrado } from "@/modules/checkin";
import { codigoCurto } from "@/modules/ingressos";
import { exigirAdmin } from "@/modules/auth/sessao";
import { formatarDataHora } from "@/lib/formatar";
import { classeBotao, classeInput } from "../../_components/form-ui";
import { SiteHeader } from "../../_components/site-header";
import { registrarEntradaAction } from "./actions";
import { LeitorQr } from "./leitor-qr";

export const metadata: Metadata = { title: "Check-in — LPZ Training" };

const RESULTADOS = {
  ok: { titulo: "ENTRADA LIBERADA", classe: "border-teal-400 bg-teal-400/15 text-teal-300" },
  "ja-usado": { titulo: "INGRESSO JÁ USADO", classe: "border-ember-500 bg-ember-500/15 text-ember-400" },
  cancelado: { titulo: "INGRESSO CANCELADO", classe: "border-ember-500 bg-ember-500/15 text-ember-400" },
  "nao-pago": { titulo: "PAGAMENTO NÃO CONFIRMADO", classe: "border-ember-500 bg-ember-500/15 text-ember-400" },
  "nao-encontrado": { titulo: "INGRESSO NÃO ENCONTRADO", classe: "border-ember-500 bg-ember-500/15 text-ember-400" },
} as const;

export default async function Page(props: PageProps<"/administradores/checkin">) {
  await exigirAdmin();
  const { q, r, id } = await props.searchParams;
  const termo = typeof q === "string" ? q.slice(0, 100) : "";
  const resultado = typeof r === "string" && r in RESULTADOS ? RESULTADOS[r as keyof typeof RESULTADOS] : null;

  const [encontrados, ingressoDoResultado, resumo, ultimas] = await Promise.all([
    termo ? buscarIngressos(termo) : Promise.resolve([]),
    resultado && typeof id === "string" ? buscarIngressos(id).then((l) => l[0]) : Promise.resolve(undefined),
    resumoCheckin(),
    ultimasEntradas(),
  ]);

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
            Presentes: <strong className="text-white">{resumo.presentes}</strong> de{" "}
            <strong className="text-white">{resumo.total}</strong> ingressos vendidos.
          </p>

          {resultado && (
            <div role="status" className={`rounded-2xl border-2 p-6 text-center ${resultado.classe}`}>
              <p className="text-2xl font-extrabold tracking-wide">{resultado.titulo}</p>
              {ingressoDoResultado && (
                <>
                  <p className="mt-2 text-lg font-semibold text-white">{ingressoDoResultado.nome}</p>
                  <p className="text-sm text-mist/80">{ingressoDoResultado.loteNome}</p>
                  {r === "ja-usado" && ingressoDoResultado.checkinEm && (
                    <p className="mt-2 text-sm text-mist">
                      Entrou em {formatarDataHora(ingressoDoResultado.checkinEm)}
                      {ingressoDoResultado.checkinPorNome ? ` (check-in por ${ingressoDoResultado.checkinPorNome})` : ""}.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <section className="space-y-4 rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
            <LeitorQr />
            <form method="get" className="flex gap-2">
              <label htmlFor="busca" className="sr-only">Código, nome ou e-mail</label>
              <input
                id="busca"
                name="q"
                defaultValue={termo}
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
                <p className="text-sm text-mist/70">Nenhum ingresso encontrado para “{termo}”.</p>
              ) : (
                encontrados.map((ingresso) => <CartaoIngresso key={ingresso.id} ingresso={ingresso} />)
              )}
            </section>
          )}

          {ultimas.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-petrol-900/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-teal-300">Últimas entradas</h2>
              <ul className="mt-3 divide-y divide-white/5 text-sm">
                {ultimas.map((u) => (
                  <li key={u.id} className="flex justify-between gap-3 py-2">
                    <span className="text-white">{u.nome}</span>
                    <span className="text-mist/60">{u.checkinEm ? formatarDataHora(u.checkinEm) : ""}</span>
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

function CartaoIngresso({ ingresso }: { ingresso: IngressoEncontrado }) {
  const liberavel = ingresso.status === "valido" && ingresso.pedidoStatus === "pago";
  const situacao =
    ingresso.pedidoStatus !== "pago"
      ? "Pagamento não confirmado"
      : ingresso.status === "usado"
        ? `Já entrou${ingresso.checkinEm ? ` em ${formatarDataHora(ingresso.checkinEm)}` : ""}`
        : ingresso.status === "cancelado"
          ? "Cancelado"
          : "Válido";

  return (
    <div className="rounded-2xl border border-white/10 bg-petrol-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{ingresso.nome}</p>
          <p className="text-sm text-mist/60">{ingresso.loteNome} · código {codigoCurto(ingresso.id)}</p>
        </div>
        <span
          className={
            liberavel
              ? "rounded-full bg-teal-400/15 px-3 py-1 text-xs text-teal-300"
              : "rounded-full bg-ember-500/15 px-3 py-1 text-xs text-ember-400"
          }
        >
          {situacao}
        </span>
      </div>
      {liberavel && (
        <form action={registrarEntradaAction} className="mt-4">
          <input type="hidden" name="ingressoId" value={ingresso.id} />
          <button type="submit" className={classeBotao}>Confirmar entrada</button>
        </form>
      )}
    </div>
  );
}
