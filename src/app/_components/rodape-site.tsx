import Link from "next/link";

export function RodapeSite() {
  return (
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-mist/60">
      <span className="font-display tracking-[0.25em]">LPZ TRAINING</span>
      <p className="mt-3">
        <Link href="/privacidade" className="hover:text-gold-300 hover:underline">Política de Privacidade</Link>
      </p>
    </footer>
  );
}
