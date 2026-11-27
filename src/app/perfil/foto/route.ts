import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { origemDoProprioSite } from "@/modules/auth/origem";
import { emModoVerComo, obterSessao } from "@/modules/auth/sessao";
import { storageAdapter } from "@/modules/midia";
import { caminhoDaUrl, ErroImagem, salvarFotoDoFormulario } from "@/modules/midia/imagem";

// Foto de perfil do próprio usuário logado. Route handler (e não server action)
// pelo limite de 1 MB das actions. Só altera a conta de quem está logado.
function json(corpo: Record<string, unknown>, status = 200) {
  return Response.json(corpo, { status });
}

export async function POST(request: Request) {
  if (!origemDoProprioSite(request)) return json({ erro: "origem" }, 403);
  const sessao = await obterSessao();
  if (!sessao || emModoVerComo(sessao)) return json({ erro: "sessao" }, 401);
  const { user } = sessao;

  try {
    const form = await request.formData();
    const caminho = await salvarFotoDoFormulario(form.get("foto"));
    await db
      .update(usuarios)
      .set({ image: storageAdapter.obterUrl(caminho), updatedAt: new Date() })
      .where(eq(usuarios.id, user.id));
    const antiga = caminhoDaUrl(user.image);
    if (antiga) await storageAdapter.remover(antiga);
  } catch (erro) {
    if (erro instanceof ErroImagem) return json({ erro: "imagem", mensagem: erro.message }, 400);
    console.error("Falha ao salvar foto de perfil", (erro as Error).message);
    return json({ erro: "falha" }, 500);
  }
  revalidatePath("/", "layout");
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!origemDoProprioSite(request)) return json({ erro: "origem" }, 403);
  const sessao = await obterSessao();
  if (!sessao || emModoVerComo(sessao)) return json({ erro: "sessao" }, 401);
  const { user } = sessao;

  await db.update(usuarios).set({ image: null, updatedAt: new Date() }).where(eq(usuarios.id, user.id));
  const antiga = caminhoDaUrl(user.image);
  if (antiga) await storageAdapter.remover(antiga).catch(() => undefined);
  revalidatePath("/", "layout");
  return json({ ok: true });
}
