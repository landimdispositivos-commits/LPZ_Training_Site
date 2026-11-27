import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "react-qr-code";
import { origemPublica } from "@/modules/bar/origem";
import { BotaoImprimir } from "../ticket/[codigo]/botao-imprimir";
import { AutoImprimir } from "./auto-imprimir";

export const metadata: Metadata = { title: "QR do cardápio — LPZ Training" };

// Plaquinha para imprimir ou salvar em PDF: o QR abre o cardápio do Bar sem login.
// A página é aberta de propósito (só aponta para o cardápio público).
export default async function Page(props: PageProps<"/bar/qr">) {
  const { imprimir } = await props.searchParams;
  const url = `${await origemPublica()}/bar`;
  return (
    <main className="min-h-screen bg-white px-6 py-10 text-center text-black print:p-0">
      {imprimir === "1" && <AutoImprimir />}
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex justify-between gap-3 text-sm print:hidden">
          <Link href="/bar" className="text-teal-700 underline">Voltar ao Bar</Link>
          <span className="flex gap-3">
            <a href="/bar/qr/cardapio.svg" download="qr-cardapio-bar.svg" className="text-teal-700 underline">Baixar SVG</a>
            <BotaoImprimir />
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-widest">BAR</h1>
        <p className="text-lg font-semibold">Aponte a câmera do celular</p>
        <div className="mx-auto inline-block rounded-xl border-4 border-black p-4">
          <QRCode value={url} size={280} fgColor="#000000" bgColor="#ffffff" aria-label="QR code do cardápio do Bar" />
        </div>
        <p className="text-lg">Veja o cardápio e os preços e, se quiser, peça pelo celular.</p>
        <p className="break-all text-xs text-neutral-600">{url}</p>
        <p className="text-xs text-neutral-500 print:hidden">Na janela de impressão, escolha &quot;Salvar como PDF&quot; para gerar o arquivo. Imprima as plaquinhas só depois de publicar o site, para o QR apontar para o endereço oficial.</p>
      </div>
    </main>
  );
}
