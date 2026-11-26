import { comoChamar } from "@/modules/perfil/apelido";
import { ehGestor, perfisDo, temPerfil } from "@/modules/auth/papeis";
import Link from "next/link";
import { traducoes, type Idioma } from "@/i18n";
import { obterIdioma } from "@/i18n/servidor";
import { menuDosPerfis, rotuloPapel } from "@/modules/auth/menu";
import { obterSessao } from "@/modules/auth/sessao";
import { contarSacola } from "@/modules/ingressos";
import { ItemSair } from "./item-sair";
import { MenuSuspenso } from "./menu-suspenso";
import { pararVerComoAction } from "./ver-como-actions";
import { SeletorIdioma } from "./seletor-idioma";

const TEXTOS = traducoes(
  {
    navegacao: "Navegação principal",
    entrar: "Entrar",
    cadastre: "Cadastre",
    ou: "ou",
    facaLogin: "faça login",
    abrirMenu: "Abrir menu",
    fecharMenu: "Fechar menu",
    faleConosco: "Fale conosco",
    buscar: "Buscar",
    buscarDica: "Buscar no site…",
    idioma: "Idioma",
    sacola: (n: number) => `Sacola com ${n} ${n === 1 ? "item" : "itens"}`,
    links: [
      { href: "/cronograma", label: "Cronograma" },
      { href: "/professores", label: "Professores" },
      { href: "/djs", label: "DJs" },
      { href: "/ingressos", label: "Loja" },
      { href: "/galeria", label: "Galeria" },
      { href: "/servicos", label: "Serviços" },
    ],
  },
  {
    navegacao: "Main navigation",
    entrar: "Sign in",
    cadastre: "Sign up",
    ou: "or",
    facaLogin: "log in",
    abrirMenu: "Open menu",
    fecharMenu: "Close menu",
    faleConosco: "Contact us",
    buscar: "Search",
    buscarDica: "Search the site…",
    idioma: "Language",
    sacola: (n: number) => `Cart with ${n} ${n === 1 ? "item" : "items"}`,
    links: [
      { href: "/cronograma", label: "Schedule" },
      { href: "/professores", label: "Teachers" },
      { href: "/djs", label: "DJs" },
      { href: "/ingressos", label: "Shop" },
      { href: "/galeria", label: "Gallery" },
      { href: "/servicos", label: "Services" },
    ],
  },
  {
    navegacao: "Navegación principal",
    entrar: "Entrar",
    cadastre: "Regístrate",
    ou: "o",
    facaLogin: "inicia sesión",
    abrirMenu: "Abrir menú",
    fecharMenu: "Cerrar menú",
    faleConosco: "Contáctanos",
    buscar: "Buscar",
    buscarDica: "Buscar en el sitio…",
    idioma: "Idioma",
    sacola: (n: number) => `Bolsa con ${n} ${n === 1 ? "artículo" : "artículos"}`,
    links: [
      { href: "/cronograma", label: "Cronograma" },
      { href: "/professores", label: "Profesores" },
      { href: "/djs", label: "DJs" },
      { href: "/ingressos", label: "Tienda" },
      { href: "/galeria", label: "Galería" },
      { href: "/servicos", label: "Servicios" },
    ],
  },
);

const classeLink = "text-mist/80 hover:text-gold-300";
const classeBotaoConta =
  "bg-gold-metal flex h-11 min-w-0 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-sm font-semibold text-gold-ink shadow-[0_0_20px_rgb(230_181_74/0.25)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:px-4 [&::-webkit-details-marker]:hidden";

function IconePessoa({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// Sacola (só aparece para congressista com itens reservados).
async function BotaoSacola({ idioma }: { idioma: Idioma }) {
  const sessao = await obterSessao().catch(() => null);
  if (!sessao || !temPerfil(sessao.user, "congressista")) return null;
  const n = await contarSacola(sessao.user.email).catch(() => 0);
  if (n === 0) return null;
  return (
    <Link
      href="/sacola"
      aria-label={TEXTOS[idioma].sacola(n)}
      title={TEXTOS[idioma].sacola(n)}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/60 text-gold-300 hover:bg-gold-500/10"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span className="bg-gold-metal absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-gold-ink">
        {n}
      </span>
    </Link>
  );
}

// Canto superior direito. Visitante: "Cadastre ou faça login". Logado: nome +
// menu com as áreas do seu perfil e "Sair / trocar de usuário".
async function MenuConta({ idioma }: { idioma: Idioma }) {
  const t = TEXTOS[idioma];
  const sessao = await obterSessao().catch(() => null);

  if (!sessao) {
    return (
      <Link href="/congressistas" className={classeBotaoConta}>
        <IconePessoa className="h-5 w-5" />
        <span className="sm:hidden">{t.entrar}</span>
        <span className="hidden sm:inline">
          {t.cadastre} <span className="font-normal">{t.ou}</span> {t.facaLogin}
        </span>
      </Link>
    );
  }

  const { user } = sessao;
  const itens = menuDosPerfis(perfisDo(user), idioma);

  return (
    <MenuSuspenso
      className="group relative min-w-0"
      resumoClassName={classeBotaoConta}
      resumo={
        <>
          <IconePessoa className="h-5 w-5 shrink-0" />
          {/* No celular só o primeiro nome (o topo tem 360–390px); do tablet para cima, o nome todo. */}
          <span className="min-w-0 max-w-[6.5rem] truncate sm:hidden">{comoChamar(user).split(" ")[0]}</span>
          <span className="hidden min-w-0 max-w-[10rem] truncate sm:inline">{comoChamar(user)}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </>
      }
    >
      <div className="menu-descer absolute right-0 z-50 mt-3 w-64 rounded-xl border border-gold-500/30 p-2 shadow-2xl shadow-black/50">
        <div className="border-b border-white/10 px-3 pb-2 pt-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-mist/60">{user.email}</p>
          <p className="mt-1 text-xs text-teal-300">{rotuloPapel(user.papel, idioma)}</p>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-1 text-sm font-medium">
          {itens.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`block rounded px-3 py-2.5 hover:bg-white/10 ${classeLink}`}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 pt-1">
          {sessao.impersonador ? (
            // Modo "ver como": voltar para a própria conta, sem sair do login.
            <form action={pararVerComoAction}>
              <button type="submit" className="block w-full rounded px-3 py-2.5 text-left text-sm font-medium text-teal-300 hover:bg-petrol-800">
                ↩ Voltar para o meu admin
              </button>
            </form>
          ) : (
            <>
              {ehGestor(user.papel) && (
                <Link href="/administradores/usuarios" className={`block rounded px-3 py-2.5 text-sm font-medium hover:bg-white/10 ${classeLink}`}>
                  👁 Ver o site como outro usuário
                </Link>
              )}
              <ItemSair />
            </>
          )}
        </div>
      </div>
    </MenuSuspenso>
  );
}

// Faixa do modo "ver o site como esta pessoa" (só a organização chega aqui).
async function FaixaVerComo() {
  const sessao = await obterSessao().catch(() => null);
  if (!sessao?.impersonador) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-3 bg-teal-400 px-4 py-2 text-sm font-semibold text-petrol-950">
      <span>
        👁 Você está vendo o site como <strong>{sessao.user.name}</strong> ({sessao.user.email}) — só visualização.
      </span>
      <form action={pararVerComoAction}>
        <button type="submit" className="rounded-full bg-petrol-950 px-4 py-1 text-xs font-bold text-teal-300 hover:bg-petrol-900">
          Voltar para o meu admin
        </button>
      </form>
    </div>
  );
}

export async function SiteHeader() {
  const idioma = await obterIdioma();
  const t = TEXTOS[idioma];
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-petrol-950/85 backdrop-blur">
      <FaixaVerComo />
      <nav
        aria-label={t.navegacao}
        className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-4 sm:gap-6 sm:px-4"
      >
        <Link href="/" className="shrink-0 whitespace-nowrap font-display text-xs tracking-[0.18em] text-gold-metal sm:text-sm sm:tracking-[0.25em]">
          {/* No celular a marca encurta para "LPZ" e sobra espaço para o nome do usuário. */}
          <span className="sm:hidden">LPZ</span>
          <span className="hidden sm:inline">LPZ TRAINING</span>
        </Link>

        <ul className="hidden items-center gap-5 whitespace-nowrap text-sm font-medium lg:flex xl:gap-6">
          {t.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={classeLink}>{link.label}</Link>
            </li>
          ))}
        </ul>

        {/* No celular o seletor de idioma vai para dentro do menu (☰): as três
            bandeiras + conta + menu não cabem numa linha de 360–390px. */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <MenuSuspenso
            resumoClassName="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-gold-300 hover:bg-gold-500/10 [&::-webkit-details-marker]:hidden"
            resumo={
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <span className="sr-only">{TEXTOS[idioma].buscar}</span>
              </>
            }
          >
            <form
              action="/busca"
              method="get"
              role="search"
              className="absolute right-0 top-12 z-50 flex w-[min(86vw,22rem)] gap-2 rounded-2xl border border-gold-500/40 bg-petrol-900/95 p-3 shadow-xl backdrop-blur"
            >
              <label htmlFor="busca-topo" className="sr-only">{TEXTOS[idioma].buscar}</label>
              <input
                id="busca-topo"
                name="q"
                type="search"
                autoFocus
                placeholder={TEXTOS[idioma].buscarDica}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-petrol-950/80 px-3 py-2 text-sm text-white placeholder:text-mist/50 focus:border-teal-400 focus:outline-none"
              />
              <button type="submit" className="rounded-lg bg-teal-400 px-3 text-sm font-semibold text-petrol-950 hover:brightness-110">
                {TEXTOS[idioma].buscar}
              </button>
            </form>
          </MenuSuspenso>
          <div className="hidden sm:block">
            <SeletorIdioma />
          </div>
          <BotaoSacola idioma={idioma} />
          <MenuConta idioma={idioma} />
          <Link
            href="/fale-conosco"
            className="hidden h-11 items-center whitespace-nowrap rounded-full border border-gold-500/60 px-4 text-sm font-semibold text-gold-300 hover:bg-gold-500/10 lg:flex"
          >
            {t.faleConosco}
          </Link>

          {/* Menu mobile sem JavaScript: <details> abre/fecha nativamente. */}
          <MenuSuspenso
            className="group relative shrink-0 lg:hidden"
            resumoClassName="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-gold-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-300 [&::-webkit-details-marker]:hidden"
            resumo={
              <>
                <span className="sr-only group-open:hidden">{t.abrirMenu}</span>
                <span className="sr-only hidden group-open:inline">{t.fecharMenu}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden h-6 w-6 group-open:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </>
            }
          >
            <div className="menu-descer absolute right-0 z-50 mt-3 w-56 rounded-xl border border-gold-500/30 p-2 shadow-2xl shadow-black/50">
              <div className="border-b border-white/10 px-3 pb-3 pt-1 sm:hidden">
                <p className="mb-2 text-xs text-mist/60">{t.idioma}</p>
                <SeletorIdioma />
              </div>
              <ul className="text-sm font-medium">
                {t.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`block rounded px-3 py-2.5 hover:bg-white/10 ${classeLink}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/fale-conosco" className="block rounded px-3 py-2.5 font-semibold text-gold-300 hover:bg-white/10">
                    {t.faleConosco}
                  </Link>
                </li>
              </ul>
            </div>
          </MenuSuspenso>
        </div>
      </nav>
    </header>
  );
}
