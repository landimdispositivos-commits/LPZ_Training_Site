import { db } from "@/db";
import { midia } from "@/db/schema";
import { exigirAdmin } from "@/modules/auth/sessao";
import { origemDoProprioSite, redirecionar } from "@/modules/auth/origem";
import { ErroImagem, salvarFotoDoFormulario } from "@/modules/midia/imagem";

// Upload de foto da galeria. Route handler (e não server action) porque
// server actions limitam o corpo a 1 MB e fotos de celular passam disso.
export async function POST(request: Request) {
  if (!origemDoProprioSite(request)) return new Response("Origem inválida", { status: 403 });
  await exigirAdmin(["organizador"]);

  try {
    const form = await request.formData();
    const caminho = await salvarFotoDoFormulario(form.get("foto"));
    const titulo = String(form.get("titulo") ?? "").trim().slice(0, 120) || null;
    await db.insert(midia).values({ tipo: "foto", referencia: caminho, titulo });
  } catch (erro) {
    const codigo = erro instanceof ErroImagem ? "foto" : "falha";
    if (!(erro instanceof ErroImagem)) console.error("Falha no upload da galeria", (erro as Error).message);
    return redirecionar(`/administradores/galeria?erro=${codigo}`);
  }
  return redirecionar("/administradores/galeria?ok=foto");
}
