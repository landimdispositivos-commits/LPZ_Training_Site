// Gerador mínimo de planilha Excel (.xlsx) — uma aba, cabeçalho em negrito,
// textos e números. Sem dependência externa: um .xlsx é um ZIP de arquivos
// XML; aqui o ZIP é montado sem compressão ("stored"), que o Excel aceita.

type Celula = string | number | null | undefined;

const CRC_TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(dados: Buffer) {
  let c = 0xffffffff;
  for (const b of dados) c = CRC_TABELA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(arquivos: { nome: string; conteudo: string }[]) {
  const partes: Buffer[] = [];
  const central: Buffer[] = [];
  let deslocamento = 0;
  for (const arq of arquivos) {
    const nome = Buffer.from(arq.nome, "utf8");
    const dados = Buffer.from(arq.conteudo, "utf8");
    const crc = crc32(dados);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(dados.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nome.length, 26);
    partes.push(local, nome, dados);

    const cab = Buffer.alloc(46);
    cab.writeUInt32LE(0x02014b50, 0);
    cab.writeUInt16LE(20, 4);
    cab.writeUInt16LE(20, 6);
    cab.writeUInt16LE(0x0800, 8);
    cab.writeUInt16LE(0, 10);
    cab.writeUInt32LE(crc, 16);
    cab.writeUInt32LE(dados.length, 20);
    cab.writeUInt32LE(dados.length, 24);
    cab.writeUInt16LE(nome.length, 28);
    cab.writeUInt32LE(deslocamento, 42);
    central.push(cab, nome);

    deslocamento += local.length + nome.length + dados.length;
  }
  const tamanhoCentral = central.reduce((t, b) => t + b.length, 0);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(tamanhoCentral, 12);
  fim.writeUInt32LE(deslocamento, 16);
  return Buffer.concat([...partes, ...central, fim]);
}

function xml(texto: string) {
  // Remove caracteres de controle que o XML não aceita e escapa os especiais.
  return texto
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nomeColuna(i: number) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export function gerarXlsx(aba: string, cabecalho: string[], linhas: Celula[][]): Buffer {
  const celula = (valor: Celula, ref: string, estilo = 0) => {
    if (valor === null || valor === undefined || valor === "") return "";
    if (typeof valor === "number" && Number.isFinite(valor)) return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
    return `<c r="${ref}" t="inlineStr" s="${estilo}"><is><t xml:space="preserve">${xml(String(valor))}</t></is></c>`;
  };
  const linhaXml = (valores: Celula[], n: number, estilo = 0) =>
    `<row r="${n}">${valores.map((v, i) => celula(v, `${nomeColuna(i)}${n}`, estilo)).join("")}</row>`;

  const larguras = cabecalho
    .map((t, i) => {
      const maior = Math.max(t.length, ...linhas.slice(0, 200).map((l) => String(l[i] ?? "").length));
      return `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(maior + 2, 10), 60)}" customWidth="1"/>`;
    })
    .join("");

  const planilha =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${larguras}</cols><sheetData>` +
    linhaXml(cabecalho, 1, 1) +
    linhas.map((l, i) => linhaXml(l, i + 2)).join("") +
    `</sheetData>` +
    (cabecalho.length ? `<autoFilter ref="A1:${nomeColuna(cabecalho.length - 1)}${linhas.length + 1}"/>` : "") +
    `</worksheet>`;

  return zip([
    {
      nome: "[Content_Types].xml",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      nome: "_rels/.rels",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      nome: "xl/workbook.xml",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${xml(aba.slice(0, 31))}" sheetId="1" r:id="rId1"/></sheets>` +
        (cabecalho.length
          ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${xml(aba.slice(0, 31))}'!$A$1:$${nomeColuna(cabecalho.length - 1)}$${linhas.length + 1}</definedName></definedNames>`
          : "") +
        `</workbook>`,
    },
    {
      nome: "xl/_rels/workbook.xml.rels",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    {
      nome: "xl/styles.xml",
      conteudo:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
        `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
        `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
        `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
        `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>` +
        `</styleSheet>`,
    },
    { nome: "xl/worksheets/sheet1.xml", conteudo: planilha },
  ]);
}
