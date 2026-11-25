import type { Metadata } from "next";
import { exigirAdmin } from "@/modules/auth/sessao";
import { AreaEmConstrucao } from "../_components/area-em-construcao";

export const metadata: Metadata = { title: "DJ — LPZ Training" };

export default async function Page() {
  await exigirAdmin(["organizador"]);
  return <AreaEmConstrucao titulo="DJ" descricao="Área dos DJs do evento. O conteúdo desta área ainda vai ser definido." />;
}
