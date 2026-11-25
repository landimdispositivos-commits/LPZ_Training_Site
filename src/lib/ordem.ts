// Move um item uma posição para cima ou para baixo numa lista ordenada e
// devolve a lista nova (usado para ordenar caixas na tela).
export function moverNaLista<T>(lista: readonly T[], item: T, direcao: "cima" | "baixo"): T[] {
  const nova = [...lista];
  const i = nova.indexOf(item);
  const j = direcao === "cima" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= nova.length) return nova;
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}
