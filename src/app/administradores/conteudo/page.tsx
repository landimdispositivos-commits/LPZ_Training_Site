import { redirect } from "next/navigation";

// Página antiga: cronograma e professores agora têm menus separados.
export default function Page() {
  redirect("/administradores/cronograma");
}
