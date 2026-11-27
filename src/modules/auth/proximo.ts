// "Para onde voltar depois do login" (?proximo=...). Só aceitamos caminhos
// internos da área de compra — nunca um endereço externo (evita usar o login
// do site para mandar alguém para um site falso).
export function proximoSeguro(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  // Área de compra de ingressos ou o cardápio do Bar (/bar...).
  if (!valor.startsWith("/ingressos") && !/^\/bar(?:[/?#]|$)/.test(valor)) return undefined;
  if (valor.includes("//") || valor.includes("\\") || valor.length > 200) return undefined;
  return valor;
}

export function urlCompra(tipo: string) {
  return `/ingressos?comprar=${encodeURIComponent(tipo)}`;
}

export function urlLoginParaComprar(tipo: string) {
  return `/congressistas?proximo=${encodeURIComponent(urlCompra(tipo))}`;
}
