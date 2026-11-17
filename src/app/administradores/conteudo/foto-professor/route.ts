import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { professores } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { origemDoProprioSite, redirecionar } from "@/modules/auth/origem";
import { storageAdapter } from "@/modules/midia";
import { caminhoDaUrl, ErroImagem, salvarFotoDoFormulario } from "@/modules/midia/imagem";

// Troca a foto de um professor. Route handler pelo mesmo motivo do upload da
// galeria (limite de 1 MB das server actions).
export async function POST(request: Request) {
  if (!origemDoProprioSite(request)) return new Response("Origem inválida", { status: 403 });
  await exigirAdmin(["organizador"]);

  try {
    const form = await request.formData();
    const id = z.uuid().parse(form.get("professorId"));
    const professor = await db.query.professores.findFirst({ where: eq(professores.id, id) });
    if (!professor) return redirecionar("/administradores/professores?erro=dados");

    const caminho = await salvarFotoDoFormulario(form.get("foto"));
    await db.update(professores).set({ fotoUrl: storageAdapter.obterUrl(caminho) }).where(eq(professores.id, id));

    const antiga = caminhoDaUrl(professor.fotoUrl);
    if (antiga) await storageAdapter.remover(antiga);
  } catch (erro) {
    if (erro instanceof ErroImagem) return redirecionar("/administradores/professores?erro=foto");
    console.error("Falha ao trocar foto do professor", (erro as Error).message);
    return redirecionar("/administradores/professores?erro=dados");
  }
  return redirecionar("/administradores/professores?ok=foto");
}
