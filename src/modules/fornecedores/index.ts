import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { fornecedores } from "@/db/schema";

export const CATEGORIAS = [
  "Som e DJ",
  "Iluminação",
  "Local / espaço",
  "Buffet e bebidas",
  "Foto e vídeo",
  "Decoração",
  "Hospedagem",
  "Transporte",
  "Gráfica e brindes",
  "Segurança e limpeza",
  "Outros",
] as const;

export const STATUS_FORNECEDOR = {
  cotacao: "Em cotação",
  contratado: "Contratado",
  pago: "Pago",
  descartado: "Descartado",
} as const;
export type StatusFornecedor = keyof typeof STATUS_FORNECEDOR;
export const LISTA_STATUS = Object.keys(STATUS_FORNECEDOR) as StatusFornecedor[];

export async function listarFornecedores() {
  return db.select().from(fornecedores).orderBy(asc(fornecedores.categoria), desc(fornecedores.atualizadoEm));
}
