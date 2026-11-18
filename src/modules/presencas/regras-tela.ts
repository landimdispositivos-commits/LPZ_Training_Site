// Reexporta as regras e o tipo de registro sem puxar o acesso ao banco.
export * from "./regras";
export type Presenca = {
  id: string;
  pedidoId: string;
  tipo: string;
  dia: string;
  registradoEm: Date;
  registradoPor: string | null;
  registradoPorNome: string | null;
};
