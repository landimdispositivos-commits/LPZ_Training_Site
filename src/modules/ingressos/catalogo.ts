import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lotes, produtosPersonalizados } from "@/db/schema";
import {
  catalogoCarregadoEm,
  definirProdutosPersonalizados,
  ehTipoFixo,
  produtosPersonalizados as listaEmMemoria,
  type ModoPresenca,
} from "./produtos";

// Pacotes de ingresso criados pela organização (botão "Editar" em Ingressos).
// A lista fica em memória (produtos.ts) e é recarregada do banco a cada 30 s
// ou logo após qualquer alteração, para servir telas, e-mails e relatórios.
const VALIDADE_MS = 30_000;

export async function carregarCatalogo({ forcar = false } = {}) {
  if (!forcar && Date.now() - catalogoCarregadoEm() < VALIDADE_MS) return listaEmMemoria();
  try {
    const lista = await db.select().from(produtosPersonalizados).orderBy(asc(produtosPersonalizados.criadoEm));
    definirProdutosPersonalizados(
      lista.map((p) => ({
        chave: p.chave,
        nome: p.nome,
        nomeEn: p.nomeEn,
        nomeEs: p.nomeEs,
        presenca: p.presenca,
        opcoes: p.opcoes,
        ativo: p.ativo,
      })),
    );
  } catch (erro) {
    // Banco fora do ar não pode derrubar a página: segue com o que já tinha.
    console.error("Falha ao carregar o catálogo de produtos", (erro as Error).message);
  }
  return listaEmMemoria();
}

// "Workshop de giro" → "extra_workshop_de_giro" (com sufixo se já existir).
function chaveDoNome(nome: string, existentes: Set<string>) {
  const base =
    "extra_" +
    (nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "pacote");
  let chave = base;
  for (let n = 2; existentes.has(chave) || ehTipoFixo(chave); n++) chave = `${base}_${n}`;
  return chave;
}

export interface NovoPacote {
  nome: string;
  nomeEn: string | null;
  nomeEs: string | null;
  presenca: ModoPresenca;
  opcoes: boolean;
  lote: { nome: string; precoCentavos: number; quantidadeTotal: number };
}

// Cria o pacote e o primeiro lote dele (preço e quantidade) numa transação.
export async function criarPacote(dados: NovoPacote) {
  const existentes = new Set<string>(
    (await db.select({ chave: produtosPersonalizados.chave }).from(produtosPersonalizados)).map((p: { chave: string }) => p.chave),
  );
  const chave = chaveDoNome(dados.nome, existentes);
  await db.transaction(async (tx) => {
    await tx.insert(produtosPersonalizados).values({
      chave,
      nome: dados.nome,
      nomeEn: dados.nomeEn,
      nomeEs: dados.nomeEs,
      presenca: dados.presenca,
      opcoes: dados.opcoes,
    });
    await tx.insert(lotes).values({
      tipo: chave,
      nome: dados.lote.nome,
      precoCentavos: dados.lote.precoCentavos,
      quantidadeTotal: dados.lote.quantidadeTotal,
    });
  });
  await carregarCatalogo({ forcar: true });
  return chave;
}

// O modo de presença (entrada com QR × serviço) não muda depois de criado:
// ingressos já emitidos ficariam incoerentes.
export async function atualizarPacote(
  chave: string,
  dados: { nome: string; nomeEn: string | null; nomeEs: string | null; opcoes: boolean; ativo: boolean },
) {
  const [antes] = await db.select().from(produtosPersonalizados).where(eq(produtosPersonalizados.chave, chave));
  if (!antes) return null;
  await db.update(produtosPersonalizados).set(dados).where(eq(produtosPersonalizados.chave, chave));
  await carregarCatalogo({ forcar: true });
  return antes;
}
