import Link from "next/link";
import { menuDoPapel, ROTULO_PAPEL } from "@/modules/auth/menu";
import { obterSessao } from "@/modules/auth/sessao";
import { ItemSair } from "./item-sair";

// Links públicos (todos veem). Os links de cada perfil ficam no menu da conta,
// no canto superior direito. "/#..." funciona também a partir das internas.
const linksSecoes = [
  { href: "/#cronograma", label: "Cronograma" },
  { href: "/#professores", label: "Professores" },
  { href: "/ingressos", label: "Ingressos" },
  { href: "/galeria", label: "Galeria" },
];

const classeLink = "text-mist/80 hover:text-gold-300";
const classeBotaoConta =
  "bg-gold-metal flex h-11 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-sm font-semibold text-gold-ink shadow-[0_0_20px_rgb(230_181_74/0.25)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 sm:px-4 [&::-webkit-details-marker]:hidden";

function IconePessoa({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// Canto superior direito. Visitante: "Cadastre ou faça login". Logado: nome +
// menu com as áreas do seu perfil e "Sair / trocar de usuário".
async function MenuConta() {
  const sessao = await obterSessao().catch(() => null);

  if (!sessao) {
    return (
      <Link href="/congressistas" className={classeBotaoConta}>
        <IconePessoa className="h-5 w-5" />
        <span className="sm:hidden">Entrar</span>
        <span className="hidden sm:inline">
          Cadastre <span className="font-normal">ou</span> faça login
        </span>
      </Link>
    );
  }

  const { user } = sessao;
  const itens = menuDoPapel(user.papel);

  return (
    <details className="group relative">
      <summary className={classeBotaoConta}>
        <IconePessoa className="h-5 w-5" />
        <span className="max-w-[9rem] truncate">{user.name.split(" ")[0]}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute right-0 z-50 mt-3 w-64 rounded-lg border border-white/10 bg-petrol-950 p-2 shadow-xl">
        <div className="border-b border-white/10 px-3 pb-2 pt-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-mist/60">{user.email}</p>
          <p className="mt-1 text-xs text-teal-300">{ROTULO_PAPEL[user.papel ?? ""] ?? "Congressista"}</p>
        </div>
        <ul className="py-1 text-sm font-medium">
          {itens.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`block rounded px-3 py-2.5 hover:bg-petrol-800 ${classeLink}`}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 pt-1">
          <ItemSair />
        </div>
      </div>
    </details>
  );
}

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-petrol-950/85 backdrop-blur">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4"
      >
        <Link href="/" className="shrink-0 whitespace-nowrap font-display text-sm tracking-[0.25em] text-gold-metal">
          LPZ TRAINING
        </Link>

        <ul className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium lg:flex">
          {linksSecoes.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={classeLink}>{link.label}</Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <MenuConta />

          {/* Menu mobile sem JavaScript: <details> abre/fecha nativamente. */}
          <details className="group relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-gold-300 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-300 [&::-webkit-details-marker]:hidden">
              <span className="sr-only group-open:hidden">Abrir menu</span>
              <span className="sr-only hidden group-open:inline">Fechar menu</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden h-6 w-6 group-open:block" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </summary>
            <div className="absolute right-0 z-50 mt-3 w-56 rounded-lg border border-white/10 bg-petrol-950 p-2 shadow-xl">
              <ul className="text-sm font-medium">
                {linksSecoes.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`block rounded px-3 py-2.5 hover:bg-petrol-800 ${classeLink}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
