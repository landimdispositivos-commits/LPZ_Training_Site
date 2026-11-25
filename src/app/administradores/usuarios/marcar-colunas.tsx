"use client";

// Atalhos para marcar/desmarcar as colunas da exportação.
export function MarcarColunas() {
  function marcar(modo: "todas" | "nenhuma" | "basicas") {
    document.querySelectorAll<HTMLInputElement>('input[name="col"]').forEach((c) => {
      c.checked = modo === "todas" ? true : modo === "nenhuma" ? false : c.dataset.basica === "1";
    });
  }
  const classe = "rounded-full border border-white/15 px-3 py-1 text-xs text-mist/80 hover:border-gold-400";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => marcar("todas")} className={classe}>Marcar todas</button>
      <button type="button" onClick={() => marcar("basicas")} className={classe}>Só as básicas</button>
      <button type="button" onClick={() => marcar("nenhuma")} className={classe}>Desmarcar todas</button>
    </div>
  );
}
