"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin } from "@/modules/auth/sessao";
import { obterTextosGaleria, salvarTextosGaleria, SECOES_GALERIA } from "@/modules/midia/textos-galeria";

// Canetinha da Galeria: título e descrição de uma caixa (Vídeos, Fotos ou Paparazzi).
const opcional = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const schema = z.object({
  secao: z.enum(SECOES_GALERIA),
  titulo: z.string().trim().min(1).max(60),
  tituloEn: opcional(60),
  tituloEs: opcional(60),
  texto: z.string().trim().max(500),
  textoEn: opcional(500),
  textoEs: opcional(500),
});

export async function salvarCaixaGaleriaAction(form: FormData) {
  await exigirAdmin(["organizador", "midias"]);
  const campo = (n: string) => String(form.get(n) ?? "");
  const dados = schema.safeParse({
    secao: campo("secao"),
    titulo: campo("titulo"),
    tituloEn: campo("tituloEn"),
    tituloEs: campo("tituloEs"),
    texto: campo("texto"),
    textoEn: campo("textoEn"),
    textoEs: campo("textoEs"),
  });
  if (!dados.success) redirect(`/galeria?editar=1&erro=1#caixa-${encodeURIComponent(campo("secao"))}`);
  const { secao, ...texto } = dados.data;
  const atuais = await obterTextosGaleria();
  await salvarTextosGaleria({ ...atuais, [secao]: texto });
  revalidatePath("/galeria");
  revalidatePath(`/galeria/${secao}`);
  redirect(`/galeria?editar=1&ok=1#caixa-${secao}`);
}
