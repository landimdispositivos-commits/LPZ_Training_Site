import { tx } from "@/i18n";
import Link from "next/link";
import { obterIdioma } from "@/i18n/servidor";

export async function RodapeSite() {
  const idioma = await obterIdioma();
  return (
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-mist/60">
      <span className="font-display tracking-[0.25em]">LPZ TRAINING</span>
      <p className="mt-3">
        <Link href="/privacidade" className="hover:text-gold-300 hover:underline">
          {tx(idioma, "Política de Privacidade", "Privacy Policy", "Política de Privacidad")}
        </Link>
        <span aria-hidden="true" className="mx-2">·</span>
        <Link href="/seguranca" className="hover:text-gold-300 hover:underline">
          {tx(idioma, "Segurança", "Security", "Seguridad")}
        </Link>
        <span aria-hidden="true" className="mx-2">·</span>
        <Link href="/fale-conosco" className="hover:text-gold-300 hover:underline">
          {tx(idioma, "Fale conosco", "Contact us", "Contáctanos")}
        </Link>
        <span aria-hidden="true" className="mx-2">·</span>
        {/* Entrada da organização: depois de entrar, aparecem as canetinhas de edição. */}
        <Link href="/administradores" className="hover:text-gold-300 hover:underline">
          {tx(idioma, "Área da organização", "Organizers area", "Área de la organización")}
        </Link>
      </p>
    </footer>
  );
}
