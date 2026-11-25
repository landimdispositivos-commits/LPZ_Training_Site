import { cronogramaItens, professores } from "@/db/schema";
import { Campo, classeBotao, classeInput } from "../../_components/form-ui";
import { salvarAulaAction, salvarProfessorAction } from "./actions";

const classeSecundario =
  "rounded-full border border-ember-500/60 px-4 py-2 text-xs font-semibold text-ember-400 hover:bg-ember-500/10";

export type Professor = typeof professores.$inferSelect;
export type Aula = typeof cronogramaItens.$inferSelect;

export function FormProfessor({ professor }: { professor?: Professor }) {
  const p = professor?.id ?? "novo-prof";
  return (
    <form action={salvarProfessorAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      {professor && <input type="hidden" name="id" value={professor.id} />}
      <Campo id={`${p}-nome`} label="Nome">
        <input id={`${p}-nome`} name="nome" required maxLength={100} defaultValue={professor?.nome} className={classeInput} />
      </Campo>
      <Campo id={`${p}-insta`} label="Instagram (opcional)">
        <input id={`${p}-insta`} name="instagram" maxLength={60} defaultValue={professor?.instagram ?? ""} placeholder="@perfil" className={classeInput} />
      </Campo>
      <div className="sm:col-span-2">
        <Campo id={`${p}-bio`} label="Bio (opcional)">
          <textarea id={`${p}-bio`} name="bio" rows={3} maxLength={1000} defaultValue={professor?.bio ?? ""} className={classeInput} />
        </Campo>
      </div>
      <Campo id={`${p}-ordem`} label="Ordem no site" dica="Menor aparece primeiro.">
        <input id={`${p}-ordem`} name="ordem" type="number" min={0} max={999} defaultValue={professor?.ordem ?? 0} className={classeInput} />
      </Campo>
      <div className="flex items-end">
        <button type="submit" className={classeBotao}>{professor ? "Salvar" : "Adicionar professor"}</button>
      </div>
    </form>
  );
}

export function FormAula({ aula, professores: lista }: { aula?: Aula; professores: { id: string; nome: string }[] }) {
  const p = aula?.id ?? "nova-aula";
  return (
    <form action={salvarAulaAction} className="mt-4 grid gap-4 sm:grid-cols-3">
      {aula && <input type="hidden" name="id" value={aula.id} />}
      <Campo id={`${p}-dia`} label="Dia">
        <input id={`${p}-dia`} name="dia" type="date" required defaultValue={aula?.dia ?? "2027-09-24"} className={classeInput} />
      </Campo>
      <Campo id={`${p}-ini`} label="Início">
        <input id={`${p}-ini`} name="horarioInicio" type="time" required defaultValue={aula?.horarioInicio} className={classeInput} />
      </Campo>
      <Campo id={`${p}-fim`} label="Fim (opcional)">
        <input id={`${p}-fim`} name="horarioFim" type="time" defaultValue={aula?.horarioFim ?? ""} className={classeInput} />
      </Campo>
      <div className="sm:col-span-3">
        <Campo id={`${p}-titulo`} label="Título">
          <input id={`${p}-titulo`} name="titulo" required maxLength={120} defaultValue={aula?.titulo} placeholder="Aula de zouk — nível intermediário" className={classeInput} />
        </Campo>
      </div>
      <Campo id={`${p}-prof`} label="Professor/DJ">
        <select id={`${p}-prof`} name="professorId" defaultValue={aula?.professorId ?? ""} className={classeInput}>
          <option value="">Nenhum</option>
          {lista.map((prof) => (
            <option key={prof.id} value={prof.id}>{prof.nome}</option>
          ))}
        </select>
      </Campo>
      <Campo id={`${p}-local`} label="Local (opcional)">
        <input id={`${p}-local`} name="local" maxLength={100} defaultValue={aula?.local ?? ""} placeholder="Sala 1" className={classeInput} />
      </Campo>
      <Campo id={`${p}-ordem`} label="Ordem no dia">
        <input id={`${p}-ordem`} name="ordem" type="number" min={0} max={999} defaultValue={aula?.ordem ?? 0} className={classeInput} />
      </Campo>
      <div className="sm:col-span-3">
        <Campo id={`${p}-desc`} label="Descrição (opcional)">
          <textarea id={`${p}-desc`} name="descricao" rows={2} maxLength={1000} defaultValue={aula?.descricao ?? ""} className={classeInput} />
        </Campo>
      </div>
      <div className="sm:col-span-3">
        <button type="submit" className={classeBotao}>{aula ? "Salvar" : "Adicionar ao cronograma"}</button>
      </div>
    </form>
  );
}

export function FormRemover({ action, id, texto }: { action: (form: FormData) => Promise<void>; id: string; texto: string }) {
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-center gap-2 text-xs text-mist/80">
        <input type="checkbox" name="confirmo" required className="h-4 w-4 accent-ember-500" />
        Confirmo
      </label>
      <button type="submit" className={classeSecundario}>{texto}</button>
    </form>
  );
}
