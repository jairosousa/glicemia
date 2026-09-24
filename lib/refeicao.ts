import type { Validacao } from "@/lib/glicemia";

// ---------------------------------------------------------------------------
// Tipo de refeição
// ---------------------------------------------------------------------------

export type TipoRefeicao = "CAFE" | "ALMOCO" | "JANTAR" | "LANCHE";

export const TIPO_REFEICAO_ROTULO: Record<TipoRefeicao, string> = {
  CAFE: "Café da manhã",
  ALMOCO: "Almoço",
  JANTAR: "Jantar",
  LANCHE: "Lanche",
};

/**
 * Sugere o tipo de refeição a partir do horário, no mesmo espírito de
 * `inferirContexto` em lib/glicemia.ts: dá para corrigir em um toque, mas
 * na maioria das vezes já vem certo.
 */
export function inferirTipoRefeicao(quando: Date): TipoRefeicao {
  const hora = quando.getHours();
  if (hora >= 5 && hora < 10) return "CAFE";
  if (hora >= 10 && hora < 15) return "ALMOCO";
  if (hora >= 18 && hora < 22) return "JANTAR";
  return "LANCHE";
}

// ---------------------------------------------------------------------------
// Validação de entrada
// ---------------------------------------------------------------------------

/** Menor valor aceito, em gramas. */
export const CARBOIDRATO_MIN = 0;
/** Maior valor aceito, em gramas — acima disso é erro de digitação. */
export const CARBOIDRATO_MAX = 500;

export function validarCarboidrato(entrada: unknown): Validacao<number> {
  const texto = String(entrada ?? "").trim();

  if (texto === "") {
    return { ok: false, erro: "Informe os carboidratos, em gramas." };
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return { ok: false, erro: "Use apenas números." };
  }
  if (!Number.isInteger(numero)) {
    return { ok: false, erro: "Os carboidratos são um número inteiro, sem casas decimais." };
  }
  if (numero < CARBOIDRATO_MIN || numero > CARBOIDRATO_MAX) {
    return {
      ok: false,
      erro: `Informe entre ${CARBOIDRATO_MIN} e ${CARBOIDRATO_MAX} gramas.`,
    };
  }

  return { ok: true, valor: numero };
}
