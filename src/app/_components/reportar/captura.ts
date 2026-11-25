// Captura da tela visível sem biblioteca externa: copia a página com os
// estilos já calculados pelo navegador, desenha numa imagem SVG
// (foreignObject) e converte para JPEG. Funciona no Chrome/Edge/Firefox; no
// Safari o navegador pode bloquear — aí o reporte segue sem o print.

const IGNORAR = new Set(["SCRIPT", "NOSCRIPT", "TEMPLATE", "LINK", "META", "IFRAME"]);

function copiarEstilos(original: Element, copia: Element) {
  const estilo = getComputedStyle(original);
  let css = "";
  for (let i = 0; i < estilo.length; i++) {
    const nome = estilo[i];
    css += `${nome}:${estilo.getPropertyValue(nome)};`;
  }
  (copia as HTMLElement).setAttribute("style", css);
}

async function imagemComoDataUrl(img: HTMLImageElement): Promise<string | null> {
  try {
    if (!img.complete || !img.naturalWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null; // imagem de outro site: fica de fora do print
  }
}

async function clonar(original: Element): Promise<Element | null> {
  if (IGNORAR.has(original.tagName)) return null;
  if ((original as HTMLElement).dataset?.reportarIgnorar !== undefined) return null;
  const copia = original.cloneNode(false) as Element;
  copiarEstilos(original, copia);

  if (original instanceof HTMLImageElement) {
    const dados = await imagemComoDataUrl(original);
    if (dados) (copia as HTMLImageElement).src = dados;
    else copia.removeAttribute("src");
    copia.removeAttribute("srcset");
  } else if (original instanceof HTMLCanvasElement) {
    try {
      const img = document.createElement("img");
      img.src = original.toDataURL();
      img.setAttribute("style", (copia as HTMLElement).getAttribute("style") ?? "");
      return img;
    } catch {
      return copia;
    }
  } else if (original instanceof HTMLInputElement && original.type !== "password") {
    copia.setAttribute("value", original.value);
  } else if (original instanceof HTMLInputElement) {
    copia.setAttribute("value", ""); // senha nunca vai no print
  } else if (original instanceof HTMLTextAreaElement) {
    copia.textContent = original.value;
    return copia;
  } else if (original instanceof HTMLSelectElement) {
    const escolhido = original.options[original.selectedIndex];
    if (escolhido) copia.setAttribute("data-valor", escolhido.text);
  }

  for (const filho of Array.from(original.childNodes)) {
    if (filho.nodeType === Node.TEXT_NODE) copia.appendChild(filho.cloneNode());
    else if (filho.nodeType === Node.ELEMENT_NODE) {
      const c = await clonar(filho as Element);
      if (c) copia.appendChild(c);
    }
  }
  return copia;
}

export async function capturarTela(): Promise<Blob | null> {
  try {
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    const corpo = await clonar(document.body);
    if (!corpo) return null;
    // Mostra só a parte da página que está na tela.
    (corpo as HTMLElement).style.margin = "0";
    (corpo as HTMLElement).style.transform = `translate(${-window.scrollX}px, ${-window.scrollY}px)`;
    corpo.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    const fundo = getComputedStyle(document.body).backgroundColor || "#0b2a33";
    const xhtml = new XMLSerializer().serializeToString(corpo);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}"><foreignObject x="0" y="0" width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${largura}px;height:${altura}px;overflow:hidden;background:${fundo}">${xhtml}</div></foreignObject></svg>`;

    const imagem = new Image();
    imagem.decoding = "sync";
    await new Promise<void>((ok, falha) => {
      imagem.onload = () => ok();
      imagem.onerror = () => falha(new Error("svg"));
      imagem.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(imagem, 0, 0);
    return await new Promise<Blob | null>((ok) => canvas.toBlob((b) => ok(b), "image/jpeg", 0.8));
  } catch {
    return null;
  }
}
