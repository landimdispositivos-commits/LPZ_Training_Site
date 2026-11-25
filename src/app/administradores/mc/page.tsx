import type { Metadata } from "next";
import { exigirAdmin } from "@/modules/auth/sessao";
import { AreaEmConstrucao } from "../_components/area-em-construcao";

export const metadata: Metadata = { title: "MC — LPZ Training" };

export default async function Page() {
  await exigirAdmin(["organizador"]);
  return <AreaEmConstrucao titulo="MC" descricao="Área dos MCs do evento. O conteúdo desta área ainda vai ser definido." />;
}
