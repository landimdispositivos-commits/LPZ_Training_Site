import { formatarDataHora } from "@/lib/formatar";
import type { Idioma } from "@/i18n";
import type { TipoProduto } from "@/modules/ingressos/produtos";
import {
  diaDeHoje,
  regraPresenca,
  rotuloBotaoPresenca,
  rotuloPresenca,
  type DiaPresenca,
  type Presenca,
} from "@/modules/presencas/regras-tela";
import { registrarPresencaAction } from "../administradores/checkin/actions";

// Lista o que já foi registrado e, para a organização, os botões que faltam.
export function BotoesPresenca({
  pedidoId,
  tipo,
  registros,
  podeRegistrar,
  voltar,
  qrId,
  idioma = "pt",
}: {
  pedidoId: string;
  tipo: TipoProduto;
  registros: Presenca[];
  podeRegistrar: boolean;
  voltar: "ingresso" | "checkin";
  qrId?: string;
  idioma?: Idioma;
}) {
  const regra = regraPresenca(tipo);
  const feitos = new Map(registros.map((r) => [r.dia, r]));
  const hoje = diaDeHoje();
  const faltam = regra.dias.filter((d) => !feitos.has(d));

  return (
    <div className="mt-3 space-y-2">
      {registros.length > 0 && (
        <ul className="space-y-1 text-sm">
          {registros.map((r) => (
            <li key={r.id} className="text-teal-300">
              ✓ {rotuloPresenca(tipo, r.dia as DiaPresenca, idioma)} ·{" "}
              <span className="text-mist/80">
                {formatarDataHora(r.registradoEm, idioma)}
                {podeRegistrar && r.registradoPorNome ? ` · por ${r.registradoPorNome}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
      {podeRegistrar && faltam.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {faltam.map((dia) => (
            <form key={dia} action={registrarPresencaAction}>
              <input type="hidden" name="pedidoId" value={pedidoId} />
              <input type="hidden" name="dia" value={dia} />
              <input type="hidden" name="voltar" value={voltar} />
              {qrId && <input type="hidden" name="qrId" value={qrId} />}
              <button
                type="submit"
                className={
                  dia === hoje || dia === "unico"
                    ? "bg-gold-metal rounded-full px-4 py-2 text-sm font-semibold text-gold-ink hover:brightness-110"
                    : "rounded-full border border-gold-400/60 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-400/10"
                }
              >
                {rotuloBotaoPresenca(tipo, dia)}
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
