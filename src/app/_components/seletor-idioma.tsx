"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Idioma } from "@/i18n";
import { useIdioma } from "@/i18n/cliente";
import { trocarIdiomaAction } from "@/i18n/acoes";

// Bandeiras desenhadas em SVG (bandeiras nacionais são de domínio público).
// Emoji de bandeira não aparece no Windows, por isso não usamos emoji.
function BandeiraBrasil() {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 20" className="h-5 w-7 rounded-[3px]">
      <rect width="28" height="20" fill="#009c3b" />
      <path d="M14 2.2 25.4 10 14 17.8 2.6 10Z" fill="#ffdf00" />
      <circle cx="14" cy="10" r="4.6" fill="#002776" />
      <path d="M9.6 9.1c2.9-.6 6.2-.2 8.8 1.3" stroke="#fff" strokeWidth="0.9" fill="none" />
    </svg>
  );
}

function BandeiraEUA() {
  const listras = Array.from({ length: 7 }, (_, i) => (
    <rect key={i} y={(i * 20) / 6.5} width="28" height={20 / 13} fill="#b22234" />
  ));
  return (
    <svg aria-hidden="true" viewBox="0 0 28 20" className="h-5 w-7 rounded-[3px]">
      <rect width="28" height="20" fill="#fff" />
      {listras}
      <rect width="12" height={(20 / 13) * 7} fill="#3c3b6e" />
      {[2, 5, 8].map((y) => [2, 5, 8, 11].map((x) => (
        <circle key={`${x}-${y}`} cx={x} cy={y + 0.6} r="0.7" fill="#fff" />
      )))}
    </svg>
  );
}

const OPCOES: { idioma: Idioma; rotulo: string; Bandeira: () => React.ReactElement }[] = [
  { idioma: "pt", rotulo: "Português", Bandeira: BandeiraBrasil },
  { idioma: "en", rotulo: "English", Bandeira: BandeiraEUA },
];

export function SeletorIdioma() {
  const atual = useIdioma();
  const router = useRouter();
  const [trocando, iniciar] = useTransition();

  function escolher(idioma: Idioma) {
    if (idioma === atual) return;
    iniciar(async () => {
      await trocarIdiomaAction(idioma);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={atual === "pt" ? "Idioma do site" : "Site language"}
      className={`flex items-center gap-1 rounded-full border border-white/15 p-1 ${trocando ? "opacity-60" : ""}`}
    >
      {OPCOES.map(({ idioma, rotulo, Bandeira }) => {
        const ativo = idioma === atual;
        return (
          <button
            key={idioma}
            type="button"
            onClick={() => escolher(idioma)}
            disabled={trocando}
            aria-pressed={ativo}
            aria-label={rotulo}
            title={rotulo}
            lang={idioma === "pt" ? "pt-BR" : "en"}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-300 ${
              ativo ? "bg-white/15 ring-1 ring-gold-400" : "opacity-50 grayscale-[40%] hover:bg-white/10 hover:opacity-100"
            }`}
          >
            <Bandeira />
          </button>
        );
      })}
    </div>
  );
}
