import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArquivoParaSalvar, StorageAdapter } from "./storage-adapter";

// content-type real do arquivo (nunca a extensão enviada pelo usuário) define
// a extensão gravada em disco.
const EXTENSOES_PERMITIDAS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const CONTENT_TYPE_POR_EXTENSAO: Record<string, string> = Object.fromEntries(
  Object.entries(EXTENSOES_PERMITIDAS).map(([tipo, ext]) => [ext, tipo])
);

// Só nomes no formato gerado por `salvar` (UUID + extensão permitida) — isso
// impede path traversal (../) e leitura de qualquer outro arquivo do disco.
const REGEX_NOME_SALVO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8 MB

export class LocalDiskStorage implements StorageAdapter {
  constructor(
    private readonly diretorioBase: string,
    private readonly urlBase: string
  ) {}

  async salvar(arquivo: ArquivoParaSalvar): Promise<{ caminho: string }> {
    const extensao = EXTENSOES_PERMITIDAS[arquivo.contentType];
    if (!extensao) {
      throw new Error(`Tipo de arquivo não permitido: ${arquivo.contentType}`);
    }
    if (arquivo.conteudo.byteLength > TAMANHO_MAXIMO_BYTES) {
      throw new Error("Arquivo excede o tamanho máximo permitido.");
    }

    await mkdir(this.diretorioBase, { recursive: true });

    // Nome sempre gerado pelo servidor — nunca usar `arquivo.nomeOriginal` no
    // caminho: é a forma clássica de path traversal / RCE via upload.
    const nomeArquivo = `${randomUUID()}${extensao}`;
    const caminhoAbsoluto = path.join(this.diretorioBase, nomeArquivo);

    await writeFile(caminhoAbsoluto, arquivo.conteudo, { mode: 0o644 });

    return { caminho: nomeArquivo };
  }

  obterUrl(caminho: string): string {
    return `${this.urlBase}/${caminho}`;
  }

  async remover(caminho: string): Promise<void> {
    if (!REGEX_NOME_SALVO.test(caminho)) return;
    await unlink(path.join(this.diretorioBase, caminho)).catch(() => undefined);
  }

  async ler(caminho: string): Promise<{ conteudo: Buffer; contentType: string } | null> {
    if (!REGEX_NOME_SALVO.test(caminho)) return null;
    try {
      const conteudo = await readFile(path.join(this.diretorioBase, caminho));
      return { conteudo, contentType: CONTENT_TYPE_POR_EXTENSAO[path.extname(caminho)] };
    } catch {
      return null;
    }
  }
}
