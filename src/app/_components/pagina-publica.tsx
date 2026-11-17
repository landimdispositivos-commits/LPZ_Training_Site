// Moldura das páginas públicas (Ingressos, Cronograma, Professores, DJs,
// Galeria): mesmo fundo em degradê, mesmo título dourado e mesmo espaçamento.
export function PaginaPublica({
  titulo,
  subtitulo,
  largura = "max-w-4xl",
  children,
}: {
  titulo: string;
  subtitulo?: string;
  largura?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="bg-city-glow min-h-[80vh] px-4 py-16">
      <div className={`mx-auto ${largura} space-y-6`}>
        <h1 className="text-center font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">{titulo}</h1>
        {subtitulo && <p className="text-center text-mist/80">{subtitulo}</p>}
        {children}
      </div>
    </main>
  );
}
