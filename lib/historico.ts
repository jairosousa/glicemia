import type { Contexto, TipoInsulina } from "@/lib/glicemia";

export type ItemGlicemia = {
  tipo: "GLICEMIA";
  id: string;
  dataHora: string;
  valor: number;
  contexto: Contexto;
  observacao: string | null;
};

export type ItemInsulina = {
  tipo: "INSULINA";
  id: string;
  dataHora: string;
  tipoInsulina: TipoInsulina;
  unidades: number;
  observacao: string | null;
};

export type ItemHistorico = ItemGlicemia | ItemInsulina;

/** Formato bruto de uma linha de `medicao_glicemia` (colunas snake_case). */
type LinhaMedicaoGlicemia = {
  id: string;
  data_hora: string;
  valor: number;
  contexto: Contexto;
  observacao: string | null;
};

/** Formato bruto de uma linha de `registro_insulina` (colunas snake_case). */
type LinhaRegistroInsulina = {
  id: string;
  data_hora: string;
  tipo: TipoInsulina;
  unidades: number;
  observacao: string | null;
};

/** Une glicemias e doses de insulina numa única linha do tempo, mais recente primeiro. */
export function unificarHistorico(
  glicemias: LinhaMedicaoGlicemia[],
  insulinas: LinhaRegistroInsulina[],
): ItemHistorico[] {
  const itens: ItemHistorico[] = [
    ...glicemias.map(
      (g): ItemGlicemia => ({
        tipo: "GLICEMIA",
        id: g.id,
        dataHora: g.data_hora,
        valor: g.valor,
        contexto: g.contexto,
        observacao: g.observacao,
      }),
    ),
    ...insulinas.map(
      (i): ItemInsulina => ({
        tipo: "INSULINA",
        id: i.id,
        dataHora: i.data_hora,
        tipoInsulina: i.tipo,
        unidades: i.unidades,
        observacao: i.observacao,
      }),
    ),
  ];

  return itens.sort((a, b) => b.dataHora.localeCompare(a.dataHora));
}

export const PERIODOS_DISPONIVEIS = [7, 14, 30, 90] as const;
export type PeriodoDias = (typeof PERIODOS_DISPONIVEIS)[number];

export function periodoValido(valor: string | undefined): PeriodoDias {
  const numero = Number(valor);
  return (PERIODOS_DISPONIVEIS as readonly number[]).includes(numero)
    ? (numero as PeriodoDias)
    : 30;
}

export type FiltroTipo = "TODOS" | "GLICEMIA" | "INSULINA";

export function filtroTipoValido(valor: string | undefined): FiltroTipo {
  return valor === "GLICEMIA" || valor === "INSULINA" ? valor : "TODOS";
}

/** Data/hora de formatação curta em pt-BR, para as linhas do histórico. */
export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
