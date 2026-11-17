import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { midia } from "@/db/schema";
import { storageAdapter } from "./index";

export async function itensDaGaleria() {
  const lista = await db.select().from(midia).orderBy(asc(midia.ordem), desc(midia.criadoEm));
  return lista.map((item) => ({
    ...item,
    url:
      item.tipo === "foto"
        ? storageAdapter.obterUrl(item.referencia)
        : item.tipo === "video"
          ? `https://www.youtube-nocookie.com/embed/${item.referencia}`
          : item.referencia, // audio: URL de incorporação já validada ao salvar
  }));
}
