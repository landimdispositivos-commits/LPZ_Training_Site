// Faixa de título das subpáginas públicas (Cronograma, Professores…).
export function CabecalhoPagina({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <section className="bg-city-glow px-4 py-20 text-center">
      <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-gold-metal sm:text-3xl">{titulo}</h1>
      <p className="mx-auto mt-4 max-w-xl text-mist/90">{subtitulo}</p>
    </section>
  );
}
