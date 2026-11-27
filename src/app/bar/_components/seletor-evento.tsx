"use client";

import { classeInput } from "../../_components/form-ui";

type Opcao = { id: string; nome: string; emAndamento: boolean };

// Troca o evento na hora, sem precisar clicar em "Ver".
export function SeletorEvento({ eventos, atual }: { eventos: Opcao[]; atual?: string }) {
  return (
    <div>
      <label htmlFor="seletor-evento" className="mb-1 block text-xs text-mist/70">Evento</label>
      <select
        id="seletor-evento"
        name="evento"
        defaultValue={atual}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`${classeInput} min-w-56`}
      >
        {eventos.map((e) => (
          <option key={e.id} value={e.id}>{e.nome}{e.emAndamento ? " (em andamento)" : ""}</option>
        ))}
      </select>
    </div>
  );
}
