import { asc } from "drizzle-orm";
import { db } from "@/db";
import { cronogramaItens, lotes, professores } from "@/db/schema";
import { tx, type Idioma } from "@/i18n";
import { nomeDoLote, nomeDoProduto, tiposDoCatalogo } from "@/modules/ingressos/produtos";
import { carregarCatalogo } from "@/modules/ingressos/catalogo";

// Busca do site (lupa do topo): páginas, produtos, professores, DJs e
// cronograma. Sem acentos e sem diferenciar maiúsculas; todas as palavras
// digitadas precisam aparecer.

export type ResultadoBusca = { titulo: string; resumo: string; href: string; tipo: string };

export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Páginas fixas com palavras-chave nos três idiomas (para achar por assunto).
function paginas(idioma: Idioma): (ResultadoBusca & { chaves: string })[] {
  const p = (href: string, titulo: [string, string, string], resumo: [string, string, string], chaves: string) => ({
    href,
    titulo: tx(idioma, ...titulo),
    resumo: tx(idioma, ...resumo),
    tipo: tx(idioma, "Página", "Page", "Página"),
    chaves,
  });
  return [
    p("/", ["Início", "Home", "Inicio"], ["Apresentação do LPZ Training.", "About LPZ Training.", "Presentación de LPZ Training."], "inicio home lpz training zouk congresso congress congreso"),
    p("/cronograma", ["Cronograma", "Schedule", "Cronograma"], ["Aulas e atividades por dia.", "Classes and activities by day.", "Clases y actividades por día."], "cronograma schedule horario horarios aulas classes sexta sabado domingo friday saturday sunday viernes"),
    p("/professores", ["Professores", "Teachers", "Profesores"], ["Casais de professores do congresso.", "The congress teaching couples.", "Parejas de profesores."], "professores teachers profesores casais aulas bio"),
    p("/djs", ["DJs", "DJs", "DJs"], ["DJs do congresso.", "The congress DJs.", "DJs del congreso."], "dj djs musica music baile bailes party"),
    p("/ingressos", ["Loja", "Shop", "Tienda"], ["Pacotes, bailes, Jack and Jill, paparazzi, camiseta e massagens.", "Packages, parties, Jack and Jill, paparazzi, T-shirt and massages.", "Paquetes, bailes, Jack and Jill, paparazzi, camiseta y masajes."], "loja shop tienda ingressos tickets entradas comprar buy pacote full pass baile preco valor price pagamento pix cartao credito debito parcelado lote sacola cart reembolso refund cancelar cancel arrependimento 7 dias"),
    p("/galeria", ["Galeria", "Gallery", "Galería"], ["Vídeos, fotos e paparazzi.", "Videos, photos and paparazzi.", "Videos, fotos y paparazzi."], "galeria gallery fotos photos videos paparazzi musica"),
    p("/galeria/videos", ["Vídeos", "Videos", "Videos"], ["Vídeos e músicas do LPZ.", "LPZ videos and music.", "Videos y música de LPZ."], "videos youtube musica music playlist"),
    p("/galeria/fotos", ["Fotos", "Photos", "Fotos"], ["Fotos dos eventos.", "Event photos.", "Fotos de los eventos."], "fotos photos imagens"),
    p("/galeria/paparazzi", ["Paparazzi", "Paparazzi", "Paparazzi"], ["Seus melhores momentos dançando.", "Your best dancing moments.", "Tus mejores momentos bailando."], "paparazzi fotografo filmagem video foto"),
    p("/servicos", ["Serviços", "Services", "Servicios"], ["Serviços do evento: telão, expositores, divulgação, parcerias e paparazzi.", "Event services: screen ads, exhibitors, promotion, partnerships and paparazzi.", "Servicios del evento: pantalla, expositores, divulgación, alianzas y paparazzi."], "servicos services servicios marketing telao expositores estande divulgacao parcerias patrocinio paparazzi"),
    p("/fale-conosco", ["Fale conosco", "Contact us", "Contáctanos"], ["Dúvidas, sugestões e reclamações; e-mail, WhatsApp e Instagram.", "Questions, suggestions and complaints; email, WhatsApp and Instagram.", "Dudas, sugerencias y reclamos; correo, WhatsApp e Instagram."], "fale conosco contato contact contacto email whatsapp instagram telefone celular reclamacao duvida ajuda help"),
    p("/quem-somos", ["Quem somos", "About us", "Quiénes somos"], ["A história e a organização do LPZ.", "LPZ story and organizers.", "Historia y organización de LPZ."], "quem somos about historia organizacao"),
    p("/privacidade", ["Política de Privacidade", "Privacy Policy", "Política de Privacidad"], ["Como tratamos seus dados (LGPD).", "How we handle your data.", "Cómo tratamos tus datos."], "privacidade privacy lgpd dados data excluir delete"),
    p("/congressistas/minha-area", ["Minha área", "My area", "Mi área"], ["Seus ingressos, QR code e compras.", "Your tickets, QR code and purchases.", "Tus entradas, código QR y compras."], "minha area my area ingressos qr code compras cancelar compra cancel login entrar"),
    p("/congressistas/completar-cadastro", ["Meu cadastro", "My profile", "Mi registro"], ["Ver e editar seus dados.", "View and edit your details.", "Ver y editar tus datos."], "meu cadastro profile dados editar alterar cpf celular endereco apelido nickname"),
    p("/sacola", ["Sacola", "Cart", "Bolsa"], ["Itens escolhidos para pagar juntos.", "Items to pay together.", "Artículos para pagar juntos."], "sacola cart carrinho bolsa pagar"),
  ];
}

export async function buscarNoSite(consulta: string, idioma: Idioma): Promise<ResultadoBusca[]> {
  await carregarCatalogo();
  const palavras = normalizar(consulta).split(/\s+/).filter((p) => p.length >= 2).slice(0, 8);
  if (palavras.length === 0) return [];
  const casa = (...textos: (string | null | undefined)[]) => {
    const alvo = normalizar(textos.filter(Boolean).join(" "));
    return palavras.every((p) => alvo.includes(p));
  };

  const [perfis, aulas, listaLotes] = await Promise.all([
    db.select().from(professores).orderBy(asc(professores.ordem), asc(professores.nome)),
    db.select().from(cronogramaItens).orderBy(asc(cronogramaItens.dia), asc(cronogramaItens.horarioInicio)),
    db.select({ tipo: lotes.tipo, nome: lotes.nome }).from(lotes).orderBy(asc(lotes.precoCentavos)),
  ]);

  const resultados: ResultadoBusca[] = [];
  for (const pg of paginas(idioma)) if (casa(pg.titulo, pg.resumo, pg.chaves)) resultados.push(pg);

  for (const tipo of tiposDoCatalogo({ soAtivos: true })) {
    const nomes = [nomeDoProduto(tipo, "pt"), nomeDoProduto(tipo, "en"), nomeDoProduto(tipo, "es")];
    const doTipo = listaLotes.filter((l) => l.tipo === tipo).map((l) => nomeDoLote(l.nome, idioma));
    if (casa(...nomes, ...doTipo)) {
      resultados.push({
        titulo: nomeDoProduto(tipo, idioma),
        resumo: doTipo.join(" · ") || tx(idioma, "Valor em breve.", "Price coming soon.", "Precio próximamente."),
        href: "/ingressos",
        tipo: tx(idioma, "Produto", "Product", "Producto"),
      });
    }
  }

  for (const p of perfis) {
    const bio = idioma === "en" ? p.bioEn ?? p.bio : p.bio;
    if (casa(p.nome, p.bio, p.bioEn, p.instagram)) {
      resultados.push({
        titulo: p.nome,
        resumo: (bio ?? "").slice(0, 140),
        href: `${p.categoria === "dj" ? "/djs" : "/professores"}/${p.id}`,
        tipo: p.categoria === "dj" ? "DJ" : tx(idioma, "Professores", "Teachers", "Profesores"),
      });
    }
  }

  for (const a of aulas) {
    if (casa(a.titulo, a.descricao, a.local)) {
      resultados.push({
        titulo: a.titulo,
        resumo: [a.horarioInicio, a.local, a.descricao].filter(Boolean).join(" · ").slice(0, 140),
        href: "/cronograma",
        tipo: tx(idioma, "Cronograma", "Schedule", "Cronograma"),
      });
    }
  }
  return resultados.slice(0, 50);
}
