import Link from "next/link";
import { obterIdioma } from "@/i18n/servidor";

export async function RodapeSite() {
  const idioma = await obterIdioma();
  return (
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-mist/60">
      <span className="font-display tracking-[0.25em]">LPZ TRAINING</span>
      <p className="mt-3">
        <Link href="/privacidade" className="hover:text-gold-300 hover:underline">
          {idioma === "en" ? "Privacy Policy" : "Política de Privacidade"}
        </Link>
        <span aria-hidden="true" className="mx-2">·</span>
        {/* Entrada da organização: depois de entrar, aparecem as canetinhas de edição. */}
        <Link href="/administradores" className="hover:text-gold-300 hover:underline">
          {idioma === "en" ? "Organizers area" : "Área da organização"}
        </Link>
      </p>
    </footer>
  );
}
