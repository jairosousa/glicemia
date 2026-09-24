export type NivelHumor = "MUITO_MAL" | "MAL" | "NEUTRO" | "BEM" | "MUITO_BEM";

/** Ordem de exibição, do pior para o melhor. */
export const NIVEIS_HUMOR: NivelHumor[] = ["MUITO_MAL", "MAL", "NEUTRO", "BEM", "MUITO_BEM"];

/**
 * Rótulo e ícone de cada nível — mesma regra de comunicação de
 * lib/glicemia.ts (CLASSIFICACAO_INFO): nunca só o emoji, sempre com texto.
 */
export const NIVEL_HUMOR_INFO: Record<NivelHumor, { rotulo: string; icone: string }> = {
  MUITO_MAL: { rotulo: "Muito mal", icone: "😞" },
  MAL: { rotulo: "Mal", icone: "🙁" },
  NEUTRO: { rotulo: "Neutro", icone: "😐" },
  BEM: { rotulo: "Bem", icone: "🙂" },
  MUITO_BEM: { rotulo: "Muito bem", icone: "😄" },
};
