import { Fragment } from "react";
import { ehGestor, temPerfil } from "@/modules/auth/papeis";
import type { Metadata } from "next";
import Link from "next/link";
import { urlLoginParaComprar } from "@/modules/auth/proximo";
import { obterSessao } from "@/modules/auth/sessao";
import { nomeDoLote, type TipoProduto, tiposDoCatalogo } from "@/modules/ingressos/produtos";
import { traducoes, tx } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { MENSAGENS_ERRO_COMPRA, MINUTOS_RESERVA, nomeDoProduto, sacolaDoComprador, situacaoDoComprador, vitrine } from "@/modules/ingressos";
import { formatarPreco } from "@/lib/formatar";
import { Aviso, Campo, classeBotao, classeInput } from "../_components/form-ui";
import { RodapeSite } from "../_components/rodape-site";
import { POLITICA_COMPRA } from "@/modules/ingressos/politica";
import { mensagemErroCompra } from "./erros";
import { AutoComprar } from "./auto-comprar";
import { SiteHeader } from "../_components/site-header";
import { adicionarSacolaAction, comprarAction, criarPacoteAction, editarPacoteAction, moverProdutoAction, removerDaSacolaAction, retomarPagamentoAction } from "./actions";
import { infoProduto } from "@/modules/ingressos/produtos";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

export async function generateMetadata(): Promise<Metadata> {
  return { title: tx(await obterIdioma(), "Ingressos — LPZ Training", "Tickets — LPZ Training", "Entradas — LPZ Training") };
}

const TEXTOS = traducoes(
  {
    titulo: "Ingressos",
    cancelado: "Pedido cancelado. A vaga voltou para o lote.",
    paraComprar: "Para comprar, entre na sua conta ou faça um cadastro rápido.",
    cadastreLogin: "Cadastre-se ou faça login",
    soCongressista: "A compra é feita pela conta de congressista.",
    naoAbertas: "Vendas ainda não abertas. Volte em breve.",
    esgotado: "Esgotado. O próximo lote abre em breve.",
    emBreve: "Valor e vendas em breve.",
    comprado: "Comprado — ver na minha área",
    continuar: "Continuar pagamento",
    desistir: "Desistir",
    comprar: "Ir para o pagamento",
    comprarVisitante: "Comprar",
    novidade: "Novidade em breve",
    escolhaOpcao: "Escolha a opção",
    moverAntes: "Mover para antes",
    moverDepois: "Mover para depois",
    naSacola: "✓ Na sacola",
    adicionar: "Adicionar à sacola",
    comprarAgora: "Comprar só este agora",
    pagarItem: "Pagar só este agora",
    remover: "Remover da sacola",
    adicionado: (nome: string) => `${nome} foi para a sacola. Continue escolhendo ou vá para o pagamento.`,
    sacola: (n: number, total: string) => `Sacola: ${n} ${n === 1 ? "item" : "itens"} · ${total}`,
    verSacola: "Ver sacola e pagar",
    escolheu: (nome: string) => `Você escolheu ${nome}. Levando você para o pagamento…`,
    aguardando: "Recebemos seu pedido e o pagamento está em processamento (o Pix pode levar alguns minutos). Assim que for aprovado, você recebe um e-mail de confirmação.",
    meios: "Pix, cartão de crédito, cartão de débito virtual Caixa ou saldo do Mercado Pago.",
    rodape: (min: number) =>
      `Pagamento processado pelo Mercado Pago — os dados do seu cartão não passam pelo nosso site. A vaga fica reservada por ${min} minutos enquanto você paga.`,
  },
  {
    titulo: "Tickets",
    cancelado: "Order cancelled. The spot went back to the batch.",
    paraComprar: "To buy, sign in to your account or create one quickly.",
    cadastreLogin: "Sign up or log in",
    soCongressista: "Purchases are made with an attendee account.",
    naoAbertas: "Sales are not open yet. Come back soon.",
    esgotado: "Sold out. The next batch opens soon.",
    emBreve: "Price and sales coming soon.",
    comprado: "Purchased — see it in my area",
    continuar: "Continue payment",
    desistir: "Cancel",
    comprar: "Go to payment",
    comprarVisitante: "Buy",
    novidade: "Coming soon",
    escolhaOpcao: "Choose an option",
    moverAntes: "Move earlier",
    moverDepois: "Move later",
    naSacola: "✓ In your cart",
    adicionar: "Add to cart",
    comprarAgora: "Buy just this one now",
    pagarItem: "Pay just this one now",
    remover: "Remove from cart",
    adicionado: (nome: string) => `${nome} was added to your cart. Keep choosing or go to payment.`,
    sacola: (n: number, total: string) => `Cart: ${n} ${n === 1 ? "item" : "items"} · ${total}`,
    verSacola: "View cart and pay",
    escolheu: (nome: string) => `You chose ${nome}. Taking you to payment…`,
    aguardando: "We received your order and the payment is being processed (Pix may take a few minutes). As soon as it is approved, you will receive a confirmation email.",
    meios: "Pix, credit card, Caixa virtual debit card or Mercado Pago balance.",
    rodape: (min: number) =>
      `Payment processed by Mercado Pago — your card details never pass through our site. Your spot is held for ${min} minutes while you pay.`,
  },
  {
    titulo: "Entradas",
    cancelado: "Pedido cancelado. El lugar volvió al lote.",
    paraComprar: "Para comprar, entra en tu cuenta o regístrate rápidamente.",
    cadastreLogin: "Regístrate o inicia sesión",
    soCongressista: "La compra se hace con una cuenta de participante.",
    naoAbertas: "Las ventas aún no están abiertas. Vuelve pronto.",
    esgotado: "Agotado. El próximo lote abre pronto.",
    emBreve: "Precio y ventas próximamente.",
    comprado: "Comprado — ver en mi área",
    continuar: "Continuar el pago",
    desistir: "Desistir",
    comprar: "Ir al pago",
    comprarVisitante: "Comprar",
    novidade: "Próximamente",
    escolhaOpcao: "Elige una opción",
    moverAntes: "Mover antes",
    moverDepois: "Mover después",
    naSacola: "✓ En tu bolsa",
    adicionar: "Agregar a la bolsa",
    comprarAgora: "Comprar solo este ahora",
    pagarItem: "Pagar solo este ahora",
    remover: "Quitar de la bolsa",
    adicionado: (nome: string) => `${nome} se agregó a tu bolsa. Sigue eligiendo o ve al pago.`,
    sacola: (n: number, total: string) => `Bolsa: ${n} ${n === 1 ? "artículo" : "artículos"} · ${total}`,
    verSacola: "Ver bolsa y pagar",
    escolheu: (nome: string) => `Elegiste ${nome}. Llevándote al pago…`,
    aguardando: "Recibimos tu pedido y el pago se está procesando (el Pix puede tardar unos minutos). En cuanto se apruebe, recibirás un correo de confirmación.",
    meios: "Pix, tarjeta de crédito, tarjeta de débito virtual Caixa o saldo de Mercado Pago.",
    rodape: (min: number) =>
      `Pago procesado por Mercado Pago — los datos de tu tarjeta nunca pasan por nuestro sitio. Tu lugar queda reservado ${min} minutos mientras pagas.`,
  },
);
const EDICAO = traducoes(
  {
    editar: "Editar ingressos",
    sair: "Concluir edição",
    dica: "Use ◀ ▶ para mudar a ordem. Preços, novos lotes e opções ficam no Financeiro.",
    financeiro: "Abrir o Financeiro",
    adicionar: "+ Adicionar pacote",
    nome: "Nome do pacote (português)",
    nomeEn: "Nome em inglês (opcional)",
    nomeEs: "Nome em espanhol (opcional)",
    presenca: "Como é usado no evento",
    presencaEntrada: "Entrada — gera ingresso com QR para a portaria",
    presencaServico: "Serviço ou produto — a equipe marca como utilizado/retirado",
    opcoes: "O cliente escolhe entre opções (cada lote vira uma opção, como nas massagens)",
    loteNome: "Nome do primeiro lote",
    preco: "Preço (R$)",
    quantidade: "Quantidade de vagas",
    criar: "Criar pacote",
    editarPacote: "Editar pacote",
    ativo: "Ativo (aparece na loja)",
    salvar: "Salvar",
    fixo: "Produto fixo do site: nome e regras não mudam por aqui.",
    desativado: "Desativado — não aparece para o público",
    okCriado: "Pacote criado! Ele já aparece na grade, no Financeiro e em Usuários.",
    okSalvo: "Pacote salvo.",
    erro: "Confira os campos: nome obrigatório, preço válido e quantidade de pelo menos 1.",
  },
  {
    editar: "Edit tickets",
    sair: "Finish editing",
    dica: "Use ◀ ▶ to change the order. Prices, new batches and options are managed in Finance.",
    financeiro: "Open Finance",
    adicionar: "+ Add package",
    nome: "Package name (Portuguese)",
    nomeEn: "Name in English (optional)",
    nomeEs: "Name in Spanish (optional)",
    presenca: "How it is used at the event",
    presencaEntrada: "Entry — issues a QR ticket for the door",
    presencaServico: "Service or product — staff marks it as used/picked up",
    opcoes: "Customer chooses between options (each batch becomes an option, like the massages)",
    loteNome: "First batch name",
    preco: "Price (R$)",
    quantidade: "Number of spots",
    criar: "Create package",
    editarPacote: "Edit package",
    ativo: "Active (shown in the store)",
    salvar: "Save",
    fixo: "Built-in product: name and rules can't be changed here.",
    desativado: "Disabled — hidden from the public",
    okCriado: "Package created! It now shows in the grid, Finance and Users.",
    okSalvo: "Package saved.",
    erro: "Check the fields: name is required, price must be valid and spots at least 1.",
  },
  {
    editar: "Editar entradas",
    sair: "Terminar edición",
    dica: "Usa ◀ ▶ para cambiar el orden. Precios, nuevos lotes y opciones están en Finanzas.",
    financeiro: "Abrir Finanzas",
    adicionar: "+ Añadir paquete",
    nome: "Nombre del paquete (portugués)",
    nomeEn: "Nombre en inglés (opcional)",
    nomeEs: "Nombre en español (opcional)",
    presenca: "Cómo se usa en el evento",
    presencaEntrada: "Entrada — genera entrada con QR para la puerta",
    presencaServico: "Servicio o producto — el equipo lo marca como utilizado/retirado",
    opcoes: "El cliente elige entre opciones (cada lote es una opción, como en los masajes)",
    loteNome: "Nombre del primer lote",
    preco: "Precio (R$)",
    quantidade: "Cantidad de plazas",
    criar: "Crear paquete",
    editarPacote: "Editar paquete",
    ativo: "Activo (aparece en la tienda)",
    salvar: "Guardar",
    fixo: "Producto fijo del sitio: nombre y reglas no se cambian aquí.",
    desativado: "Desactivado — no aparece al público",
    okCriado: "¡Paquete creado! Ya aparece en la grilla, en Finanzas y en Usuarios.",
    okSalvo: "Paquete guardado.",
    erro: "Revisa los campos: nombre obligatorio, precio válido y al menos 1 plaza.",
  },
);
export const dynamic = "force-dynamic";

const classeBotaoSecundario =
  "w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10";

export default async function Page(props: PageProps<"/ingressos">) {
  await carregarCatalogo();
  const busca = await props.searchParams;
  const { erro, cancelado, comprar, aguardando, adicionado } = busca;
  const tipoAdicionado = tiposDoCatalogo().includes(adicionado as TipoProduto) ? (adicionado as TipoProduto) : null;
  const escolhido = tiposDoCatalogo().includes(comprar as TipoProduto) ? (comprar as TipoProduto) : null;
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  const sessao = await obterSessao();
  const user = sessao?.user;
  const congressista = !!user && temPerfil(user, "congressista");
  const organizacao = !!user && ehGestor(user.papel);
  const editando = organizacao && busca.editar === "1";
  const te = EDICAO[idioma];

  const [itens, situacao, sacola] = await Promise.all([
    vitrine({ incluirInativos: editando }),
    congressista && user ? situacaoDoComprador(user.email) : Promise.resolve(null),
    congressista && user ? sacolaDoComprador(user.email) : Promise.resolve([]),
  ]);
  const mensagemErro =
    typeof erro === "string" && erro in MENSAGENS_ERRO_COMPRA
      ? mensagemErroCompra(erro as keyof typeof MENSAGENS_ERRO_COMPRA, idioma)
      : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-city-glow min-h-[80vh] px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">
            {t.titulo}
          </h1>

          {organizacao && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={editando ? "/ingressos" : "/ingressos?editar=1"}
                className="inline-flex items-center gap-2 rounded-full bg-gold-400/15 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/30"
              >
                <span aria-hidden="true">{editando ? "✓" : "✎"}</span> {editando ? te.sair : te.editar}
              </Link>
              {editando && (
                <p className="text-xs text-mist/60">
                  {te.dica}{" "}
                  <Link href="/financeiro" className="text-teal-300 hover:underline">{te.financeiro}</Link>
                </p>
              )}
            </div>
          )}
          {editando && busca["ok-edicao"] && <Aviso tipo="ok">{busca["ok-edicao"] === "criado" ? te.okCriado : te.okSalvo}</Aviso>}
          {editando && busca["erro-edicao"] && <Aviso tipo="erro">{te.erro}</Aviso>}
          {editando && (
            <details id="novo-pacote" className="scroll-mt-24 rounded-2xl border border-white/10 bg-petrol-900/80 p-5">
              <summary className="cursor-pointer text-sm font-semibold text-gold-300">{te.adicionar}</summary>
              <form action={criarPacoteAction} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo id="pacote-nome" label={te.nome}>
                    <input id="pacote-nome" name="nome" required maxLength={80} className={classeInput} />
                  </Campo>
                  <Campo id="pacote-nome-en" label={te.nomeEn}>
                    <input id="pacote-nome-en" name="nomeEn" maxLength={80} className={classeInput} />
                  </Campo>
                  <Campo id="pacote-nome-es" label={te.nomeEs}>
                    <input id="pacote-nome-es" name="nomeEs" maxLength={80} className={classeInput} />
                  </Campo>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-mist">{te.presenca}</legend>
                  <label className="flex items-center gap-2 text-sm text-mist/90">
                    <input type="radio" name="presenca" value="servico" defaultChecked className="h-4 w-4 accent-teal-400" /> {te.presencaServico}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-mist/90">
                    <input type="radio" name="presenca" value="entrada" className="h-4 w-4 accent-teal-400" /> {te.presencaEntrada}
                  </label>
                </fieldset>
                <label className="flex items-center gap-2 text-sm text-mist/90">
                  <input type="checkbox" name="opcoes" className="h-4 w-4 accent-teal-400" /> {te.opcoes}
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo id="pacote-lote" label={te.loteNome}>
                    <input id="pacote-lote" name="loteNome" maxLength={60} defaultValue="Lote único" className={classeInput} />
                  </Campo>
                  <Campo id="pacote-preco" label={te.preco}>
                    <input id="pacote-preco" name="preco" required inputMode="decimal" placeholder="0,00" className={classeInput} />
                  </Campo>
                  <Campo id="pacote-qtd" label={te.quantidade}>
                    <input id="pacote-qtd" name="quantidade" type="number" required min={1} max={10000} defaultValue={100} className={classeInput} />
                  </Campo>
                </div>
                <button type="submit" className={classeBotao}>{te.criar}</button>
              </form>
            </details>
          )}

          {mensagemErro && <Aviso tipo="erro">{mensagemErro}</Aviso>}
          {cancelado && <Aviso tipo="ok">{t.cancelado}</Aviso>}
          {aguardando && <Aviso tipo="ok">{t.aguardando}</Aviso>}
          {tipoAdicionado && <Aviso tipo="ok">{t.adicionado(nomeDoProduto(tipoAdicionado, idioma))}</Aviso>}
          {sacola.length > 0 && (
            <div className="sticky top-2 z-20 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-400/60 bg-petrol-900/95 px-5 py-3 shadow-lg backdrop-blur">
              <p className="font-semibold text-white">
                {t.sacola(sacola.length, formatarPreco(sacola.reduce((s, i) => s + i.valorCentavos, 0), idioma))}
              </p>
              <Link href="/sacola" className="bg-gold-metal rounded-full px-5 py-2 text-sm font-semibold text-gold-ink hover:brightness-110">
                {t.verSacola}
              </Link>
            </div>
          )}
          {escolhido && congressista && user?.cadastroCompletoEm && !situacao?.[escolhido]?.pago && (
            <Aviso tipo="ok">{t.escolheu(nomeDoProduto(escolhido, idioma))}</Aviso>
          )}

          {!user && (
            <div className="mx-auto max-w-md space-y-3 text-center">
              <p className="text-sm text-mist/80">{t.paraComprar}</p>
              <Link href="/congressistas" className={`${classeBotao} inline-block`}>
                {t.cadastreLogin}
              </Link>
            </div>
          )}
          {user && !congressista && <Aviso tipo="erro">{t.soCongressista}</Aviso>}

          {!editando && itens.every((i) => i.emBreve) ? (
            <p className="text-center text-mist/80">{t.naoAbertas}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((item, indice) => {
                const minha = situacao?.[item.tipo];
                return (
                  <Fragment key={item.tipo}>
                  <li
                    id={`produto-${item.tipo}`}
                    className={`relative flex scroll-mt-24 flex-col rounded-2xl border bg-petrol-950/70 p-6 text-center transition ${editando ? "pb-10" : ""} ${item.ativo ? "" : "opacity-60"} ${
                      escolhido === item.tipo
                        ? "border-gold-300 shadow-[0_0_30px_rgb(230_181_74/0.35)] ring-2 ring-gold-400"
                        : "border-gold-500/40"
                    } ${!user && item.lote ? "hover:border-gold-300 hover:shadow-[0_0_24px_rgb(230_181_74/0.25)]" : ""}`}
                  >
                    <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300">{nomeDoProduto(item.tipo, idioma)}</p>
                    {!item.ativo && <p className="mt-1 text-xs font-semibold text-ember-400">{te.desativado}</p>}
                    {item.opcoes.length > 0 ? (
                      // Produto com opções (massagens): lista de durações e valores.
                      <ul className="mt-3 space-y-1 text-sm">
                        {item.opcoes.map((o) => (
                          <li key={o.id} className="flex justify-between gap-3 border-b border-white/5 pb-1">
                            <span className="text-teal-300">{nomeDoLote(o.nome, idioma)}</span>
                            <span className="font-semibold text-gold-300">{formatarPreco(o.precoCentavos, idioma)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : item.lote ? (
                      <>
                        <p className="mt-1 text-sm text-teal-300">{nomeDoLote(item.lote.nome, idioma)}</p>
                        <p className="text-gold-metal mt-1 text-3xl font-extrabold">{formatarPreco(item.lote.precoCentavos, idioma)}</p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-mist/80">{item.emBreve ? t.emBreve : t.esgotado}</p>
                    )}

                    <div className="mt-auto space-y-2 pt-5">
                      {congressista && minha?.pago ? (
                        <Link href="/congressistas/minha-area" className={`${classeBotao} inline-block`}>
                          {t.comprado}
                        </Link>
                      ) : congressista && minha?.pendente ? (
                        <>
                          <p className="font-semibold text-teal-300">{t.naSacola}</p>
                          <form action={retomarPagamentoAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className={classeBotaoSecundario}>{t.pagarItem}</button>
                          </form>
                          <form action={removerDaSacolaAction}>
                            <input type="hidden" name="pedidoId" value={minha.pendente} />
                            <button type="submit" className="text-sm text-mist/70 underline-offset-2 hover:text-ember-400 hover:underline">
                              {t.remover}
                            </button>
                          </form>
                        </>
                      ) : congressista && item.lote ? (
                        <form id={`comprar-${item.tipo}`} action={comprarAction} className="space-y-2">
                          <input type="hidden" name="tipo" value={item.tipo} />
                          {item.opcoes.length > 0 && (
                            <>
                              <label htmlFor={`opcao-${item.tipo}`} className="sr-only">{t.escolhaOpcao}</label>
                              <select
                                id={`opcao-${item.tipo}`}
                                name="loteId"
                                className="w-full rounded-lg border border-white/15 bg-petrol-950/80 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                              >
                                {item.opcoes.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {nomeDoLote(o.nome, idioma)} — {formatarPreco(o.precoCentavos, idioma)}
                                  </option>
                                ))}
                              </select>
                            </>
                          )}
                          {escolhido === item.tipo && user?.cadastroCompletoEm && item.opcoes.length === 0 && (
                            <AutoComprar formId={`comprar-${item.tipo}`} tipo={item.tipo} />
                          )}
                          <button type="submit" formAction={adicionarSacolaAction} className={classeBotao}>{t.adicionar}</button>
                          <button type="submit" className={classeBotaoSecundario}>{t.comprarAgora}</button>
                        </form>
                      ) : !user && item.lote ? (
                        // A caixinha inteira é clicável: leva ao login e volta para esta compra.
                        <Link
                          href={urlLoginParaComprar(item.tipo)}
                          className={`${classeBotao} inline-block after:absolute after:inset-0 after:rounded-2xl after:content-['']`}
                        >
                          {t.comprarVisitante}
                        </Link>
                      ) : null}
                    </div>
                    {editando && (
                      <div className="relative z-10 mt-3 text-left">
                        {infoProduto(item.tipo).personalizado ? (
                          <details>
                            <summary className="cursor-pointer text-sm font-semibold text-gold-300">✎ {te.editarPacote}</summary>
                            <form action={editarPacoteAction} className="mt-3 space-y-3">
                              <input type="hidden" name="tipo" value={item.tipo} />
                              <label className="block text-xs text-mist">
                                {te.nome}
                                <input name="nome" required maxLength={80} defaultValue={infoProduto(item.tipo).nome} className={`${classeInput} mt-1`} />
                              </label>
                              <label className="block text-xs text-mist">
                                {te.nomeEn}
                                <input name="nomeEn" maxLength={80} defaultValue={infoProduto(item.tipo).nomeEn === infoProduto(item.tipo).nome ? "" : infoProduto(item.tipo).nomeEn} className={`${classeInput} mt-1`} />
                              </label>
                              <label className="block text-xs text-mist">
                                {te.nomeEs}
                                <input name="nomeEs" maxLength={80} defaultValue={infoProduto(item.tipo).nomeEs === infoProduto(item.tipo).nome ? "" : infoProduto(item.tipo).nomeEs} className={`${classeInput} mt-1`} />
                              </label>
                              <label className="flex items-center gap-2 text-xs text-mist/90">
                                <input type="checkbox" name="opcoes" defaultChecked={infoProduto(item.tipo).opcoes} className="h-4 w-4 accent-teal-400" /> {te.opcoes}
                              </label>
                              <label className="flex items-center gap-2 text-xs text-mist/90">
                                <input type="checkbox" name="ativo" defaultChecked={item.ativo} className="h-4 w-4 accent-teal-400" /> {te.ativo}
                              </label>
                              <button type="submit" className={classeBotao}>{te.salvar}</button>
                            </form>
                          </details>
                        ) : (
                          <p className="text-xs text-mist/50">{te.fixo}</p>
                        )}
                      </div>
                    )}
                    {editando && (
                      // Setinhas delicadas para ordenar as caixas (só organização), no canto inferior direito.
                      <div className="absolute bottom-2.5 right-3 z-10 flex gap-1">
                        {(["cima", "baixo"] as const).map((direcao) => (
                          <form key={direcao} action={moverProdutoAction}>
                            <input type="hidden" name="tipo" value={item.tipo} />
                            <input type="hidden" name="direcao" value={direcao} />
                            <button
                              type="submit"
                              disabled={direcao === "cima" ? indice === 0 : indice === itens.length - 1}
                              aria-label={`${direcao === "cima" ? t.moverAntes : t.moverDepois}: ${nomeDoProduto(item.tipo, idioma)}`}
                              title={direcao === "cima" ? t.moverAntes : t.moverDepois}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] leading-none text-gold-300 hover:bg-gold-400/20 disabled:opacity-25"
                            >
                              {direcao === "cima" ? "◀" : "▶"}
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </li>
                  {item.tipo === "camiseta" && (
                    // Espaço reservado para o próximo produto (ainda sem definição).
                    <li
                      aria-label={t.novidade}
                      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/40 bg-petrol-950/40 p-6 text-center"
                    >
                      <p className="font-display text-sm uppercase tracking-[0.15em] text-gold-300/70">{t.novidade}</p>
                    </li>
                  )}
                  </Fragment>
                );
              })}
            </ul>
          )}

          <p className="text-center text-xs text-mist/60">
            {t.meios} {t.rodape(MINUTOS_RESERVA)}
          </p>
          <p className="mx-auto max-w-2xl rounded-lg border border-gold-500/30 bg-petrol-900/60 px-4 py-3 text-center text-xs text-mist/80">
            {POLITICA_COMPRA[idioma]}
          </p>
        </div>
      </main>
      <RodapeSite />
    </>
  );
}
