import { tx, type Idioma } from "@/i18n";
import { MENSAGENS_ERRO_COMPRA, type CodigoErroCompra } from "@/modules/ingressos";

const ERROS_EN: Record<keyof typeof MENSAGENS_ERRO_COMPRA, string> = {
  "sem-lote": "There is no ticket batch on sale right now.",
  esgotado: "This batch is sold out. Refresh the page to see if a new batch has opened.",
  "ja-tem-ingresso": "You have already bought this product. It is in your area.",
  "pedido-invalido": "Order not found.",
  pagamento: "We could not open the payment right now. Please try again in a few minutes.",
  "sacola-vazia": "Your cart is empty (or the reservation expired). Please choose the products again.",
};

const ERROS_ES: Record<keyof typeof MENSAGENS_ERRO_COMPRA, string> = {
  "sem-lote": "No hay ningún lote a la venta en este momento.",
  esgotado: "Este lote se agotó. Recarga la página para ver si abrió un nuevo lote.",
  "ja-tem-ingresso": "Ya compraste este producto. Está en tu área.",
  "pedido-invalido": "Pedido no encontrado.",
  pagamento: "No pudimos abrir el pago ahora. Inténtalo de nuevo en unos minutos.",
  "sacola-vazia": "Tu bolsa está vacía (o la reserva venció). Elige los productos de nuevo.",
};

export function mensagemErroCompra(codigo: CodigoErroCompra, idioma: Idioma) {
  return tx(idioma, MENSAGENS_ERRO_COMPRA, ERROS_EN, ERROS_ES)[codigo];
}
