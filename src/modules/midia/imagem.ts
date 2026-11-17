import { storageAdapter } from "./index";
import { TAMANHO_MAXIMO_BYTES } from "./local-disk-storage";

// Descobre o tipo real da imagem pelos primeiros bytes ("assinatura"), sem
// confiar no content-type nem na extensão enviados pelo navegador.
export function detectarTipoImagem(conteudo: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (conteudo.length >= 3 && conteudo[0] === 0xff && conteudo[1] === 0xd8 && conteudo[2] === 0xff) return "image/jpeg";
  if (conteudo.length >= 8 && conteudo.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (
    conteudo.length >= 12 &&
    conteudo.subarray(0, 4).toString("ascii") === "RIFF" &&
    conteudo.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export class ErroImagem extends Error {}

// Valida e salva uma foto vinda de formulário. Retorna o caminho relativo.
export async function salvarFotoDoFormulario(arquivo: FormDataEntryValue | null) {
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new ErroImagem("Escolha uma foto.");
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) throw new ErroImagem("Foto grande demais (máximo 8 MB).");
  const conteudo = Buffer.from(await arquivo.arrayBuffer());
  const contentType = detectarTipoImagem(conteudo);
  if (!contentType) throw new ErroImagem("Formato não aceito. Use JPG, PNG ou WebP.");
  const { caminho } = await storageAdapter.salvar({ nomeOriginal: arquivo.name, conteudo, contentType });
  return caminho;
}

// URL pública "/uploads/<arquivo>" → caminho relativo no storage (ou null).
export function caminhoDaUrl(url: string | null | undefined) {
  const prefixo = storageAdapter.obterUrl("");
  return url && url.startsWith(prefixo) ? url.slice(prefixo.length) : null;
}
