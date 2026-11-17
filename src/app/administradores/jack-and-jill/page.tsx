import type { Metadata } from "next";
import { exigirAdmin } from "@/modules/auth/sessao";
import { AreaEmConstrucao } from "../_components/area-em-construcao";

export const metadata: Metadata = { title: "Jack and Jill — LPZ Training" };

export default async function Page() {
  await exigirAdmin(["organizador"]);
  return <AreaEmConstrucao titulo="Jack and Jill" descricao="Competição Jack and Jill. O conteúdo desta área ainda vai ser definido." />;
}
