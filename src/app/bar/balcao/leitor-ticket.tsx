"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Leitura do QR do ticket pela câmera (BarcodeDetector nativo: Chrome/Edge).
// Onde não houver suporte, o balcão digita o código de 8 caracteres.
type Detector = { detect(fonte: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (opcoes: { formats: string[] }) => Detector;

export function LeitorTicket() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [suportado, setSuportado] = useState<boolean | null>(null);
  const [ligado, setLigado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuportado("BarcodeDetector" in window && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  useEffect(() => {
    if (!ligado) return;
    let ativo = true;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!ativo || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
        const detector = new Ctor({ formats: ["qr_code"] });
        const ler = async () => {
          if (!ativo || !video.current) return;
          try {
            const [lido] = await detector.detect(video.current);
            if (lido?.rawValue) {
              setLigado(false);
              const parte = lido.rawValue.trim().split(/[/?#]/).filter(Boolean).pop() ?? "";
              router.push(`/bar/ticket/${encodeURIComponent(parte)}`);
              return;
            }
          } catch {
            // frame ainda não pronto
          }
          timer = setTimeout(ler, 300);
        };
        ler();
      } catch {
        setErro("Não foi possível abrir a câmera. Confira a permissão do navegador ou digite o código.");
        setLigado(false);
      }
    })();
    return () => {
      ativo = false;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [ligado, router]);

  if (suportado === false) {
    return <p className="text-xs text-mist/60">Este navegador não lê QR pela câmera. Digite o código do ticket ou use o Chrome no Android.</p>;
  }
  if (suportado === null) return null;

  return (
    <div className="space-y-3">
      {erro && <p role="alert" className="text-sm text-ember-400">{erro}</p>}
      {ligado ? (
        <>
          <video ref={video} muted playsInline className="w-full rounded-xl border border-white/10 bg-black" />
          <button type="button" onClick={() => setLigado(false)} className="w-full rounded-full border border-gold-500/60 px-6 py-3 text-sm font-semibold text-gold-300 hover:bg-gold-500/10">
            Fechar câmera
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setErro(null);
            setLigado(true);
          }}
          className="bg-gold-metal w-full rounded-full px-6 py-3 font-semibold text-gold-ink hover:brightness-110"
        >
          Ler QR do ticket com a câmera
        </button>
      )}
    </div>
  );
}
