"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIdioma } from "@/i18n/cliente";
import { authClient } from "@/modules/auth/auth-client";

// Item "Sair / trocar de usuário" do menu da conta, no topo do site.
export function ItemSair() {
  const router = useRouter();
  const idioma = useIdioma();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await authClient.signOut();
    router.push("/congressistas");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className="block w-full rounded px-3 py-2.5 text-left text-sm font-medium text-ember-400 hover:bg-petrol-800 disabled:opacity-60"
    >
      {idioma === "en" ? (saindo ? "Signing out..." : "Sign out / switch user") : saindo ? "Saindo..." : "Sair / trocar de usuário"}
    </button>
  );
}
