import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LOCALE, traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { formatarPreco } from "@/lib/formatar";
import { areaDoPapel } from "@/modules/auth/papeis";
import { obterSessao } from "@/modules/auth/sessao";
import { MENSAGENS_ERRO_COMPRA, MINUTOS_RESERVA, nomeDoLote, nomeDoProduto, sacolaDoComprador } from "@/modules/ingressos";
import { POLITICA_COMPRA } from "@/modules/ingressos/politica";
import { Aviso, classeBotao } from "../_components/form-ui";
import { PaginaPublica } from "../_components/pagina-publica";
import { RodapeSite } from "../_components/rodape-site";
import { SiteHeader } from "../_components/site-header";
import { pagarSacolaAction, removerDaSacolaAction } from "../ingressos/actions";
import { mensagemErroCompra } from "../ingressos/erros";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Sacola — LPZ Training", "Cart — LPZ Training", "Bolsa — LPZ Training") };
}
export const dynamic = "force-dynamic";

const TEXTOS = traducoes(
  {
    titulo: "Sacola",
    vazia: "Sua sacola está vazia.",
    escolher: "Escolher produtos",
    continuar: "Continuar escolhendo",
    remover: "Remover",
    total: "Total",
    pagar: "Pagar tudo",
    reserva: (hora: string) => `Suas vagas ficam reservadas até ${hora}. Depois disso, voltam para o lote.`,
    umPagamento: "Um único pagamento para todos os itens (Pix, crédito em até 12x ou débito). Cada produto gera o seu próprio QR code.",
  },
  {
    titulo: "Cart",
    vazia: "Your cart is empty.",
    escolher: "Choose products",
    continuar: "Keep choosing",
    remover: "Remove",
    total: "Total",
    pagar: "Pay for everything",
    reserva: (hora: string) => `Your spots are held until ${hora}. After that, they go back to the batch.`,
    umPagamento: "A single payment for all items (Pix, credit card in up to 12 installments or debit). Each product gets its own QR code.",
  },
  {
    titulo: "Bolsa",
    vazia: "Tu bolsa está vacía.",
    escolher: "Elegir productos",
    continuar: "Seguir eligiendo",
    remover: "Quitar",
    total: "Total",
    pagar: "Pagar todo",
    reserva: (hora: string) => `Tus lugares quedan reservados hasta las ${hora}. Después vuelven al lote.`,
    umPagamento: "Un único pago para todos los artículos (Pix, crédito en hasta 12 cuotas o débito). Cada producto genera su propio código QR.",
  },
);

export default async function Page(props: PageProps<"/sacola">) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/congressistas?proximo=%2Fsacola");
  const { user } = sessao;
  if (user.papel !== "congressista") redirect(areaDoPapel(user.papel));

  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const { erro } = await props.searchParams;
  const mensagemErro =
    typeof erro === "string" && erro in MENSAGENS_ERRO_COMPRA
      ? mensagemErroCompra(erro as keyof typeof MENSAGENS_ERRO_COMPRA, idioma)
      : null;

  const itens = await sacolaDoComprador(user.email);
  const total = itens.reduce((s, i) => s + i.valorCentavos, 0);
  const reservaAte = itens.length
    ? new Date(Math.min(...itens.map((i) => i.criadoEm.getTime())) + MINUTOS_RESERVA * 60 * 1000).toLocaleTimeString(
        LOCALE[idioma],
        { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" },
      )
    : "";

  return (
    <>
      <SiteHeader />
      <PaginaPublica titulo={t.titulo} largura="max-w-lg">
        {mensagemErro && <Aviso tipo="erro">{mensagemErro}</Aviso>}
        {itens.length === 0 ? (
          <div className="space-y-4 text-center">
            <p className="text-mist/80">{t.vazia}</p>
            <Link href="/ingressos" className={`${classeBotao} inline-block`}>{t.escolher}</Link>
          </div>
        ) : (
          <section className="rounded-2xl border border-gold-500/40 bg-petrol-950/70 p-6">
            <ul className="divide-y divide-white/10">
              {itens.map((i) => (
                <li key={i.pedidoId} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{nomeDoProduto(i.tipo, idioma)}</p>
                    <p className="text-sm text-mist/70">{nomeDoLote(i.loteNome, idioma)}</p>
                    <form action={removerDaSacolaAction} className="mt-1">
                      <input type="hidden" name="pedidoId" value={i.pedidoId} />
                      <input type="hidden" name="voltar" value="sacola" />
                      <button type="submit" className="text-xs text-mist/60 underline-offset-2 hover:text-ember-400 hover:underline">
                        {t.remover}
                      </button>
                    </form>
                  </div>
                  <p className="whitespace-nowrap font-semibold text-gold-300">{formatarPreco(i.valorCentavos, idioma)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-gold-500/40 pt-4">
              <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{t.total}</p>
              <p className="text-gold-metal text-3xl font-extrabold">{formatarPreco(total, idioma)}</p>
            </div>
            <p className="mt-3 text-xs text-mist/60">{t.reserva(reservaAte)}</p>
            <form action={pagarSacolaAction} className="mt-5">
              <button type="submit" className={classeBotao}>{t.pagar}</button>
            </form>
            <p className="mt-3 text-center text-xs text-mist/60">{t.umPagamento}</p>
            <p className="mt-4 text-center">
              <Link href="/ingressos" className="text-sm text-teal-300 hover:underline">{t.continuar}</Link>
            </p>
          </section>
        )}
        <p className="mx-auto mt-6 max-w-xl rounded-lg border border-gold-500/30 bg-petrol-900/60 px-4 py-3 text-center text-xs text-mist/80">
          {POLITICA_COMPRA[idioma]}
        </p>
      </PaginaPublica>
      <RodapeSite />
    </>
  );
}
