import { classificar, type Metas } from "@/lib/glicemia";

export type Estatisticas = {
  totalMedicoes: number;
  naFaixa: number;
  abaixo: number;
  acima: number;
  /** Casos de hipoglicemia grave (< limiteHipoGrave) dentro de "abaixo". */
  hipoGrave: number;
  /** Casos de hiperglicemia severa (> limiteHiperSevera) dentro de "acima". */
  hiperSevera: number;
  /** `null` quando não há medições no período — nunca 0 nesse caso, para não
   *  sugerir "0% na faixa" quando na verdade não há dado nenhum. */
  percentualNaFaixa: number | null;
  media: number | null;
  desvioPadrao: number | null;
};

/**
 * Calcula as métricas do painel (PROJECT.md §5.5 e F7).
 *
 * O percentual nunca é o número principal sozinho — ele sempre vem
 * acompanhado de `totalMedicoes`, porque com 4–8 medições manuais por dia o
 * que se calcula é "% das medições na faixa", não o Time in Range clínico
 * de verdade (que pressupõe centenas de leituras de um sensor contínuo).
 */
export function calcularEstatisticas(valores: number[], metas: Metas): Estatisticas {
  const total = valores.length;

  if (total === 0) {
    return {
      totalMedicoes: 0,
      naFaixa: 0,
      abaixo: 0,
      acima: 0,
      hipoGrave: 0,
      hiperSevera: 0,
      percentualNaFaixa: null,
      media: null,
      desvioPadrao: null,
    };
  }

  let naFaixa = 0;
  let abaixo = 0;
  let acima = 0;
  let hipoGrave = 0;
  let hiperSevera = 0;

  for (const valor of valores) {
    const classificacao = classificar(valor, metas);
    switch (classificacao) {
      case "ALVO":
        naFaixa++;
        break;
      case "HIPO":
        abaixo++;
        break;
      case "HIPO_GRAVE":
        abaixo++;
        hipoGrave++;
        break;
      case "HIPER":
        acima++;
        break;
      case "HIPER_SEVERA":
        acima++;
        hiperSevera++;
        break;
    }
  }

  const media = valores.reduce((soma, v) => soma + v, 0) / total;
  const variancia = valores.reduce((soma, v) => soma + (v - media) ** 2, 0) / total;

  return {
    totalMedicoes: total,
    naFaixa,
    abaixo,
    acima,
    hipoGrave,
    hiperSevera,
    percentualNaFaixa: Math.round((naFaixa / total) * 100),
    media: Math.round(media),
    desvioPadrao: Math.round(Math.sqrt(variancia) * 10) / 10,
  };
}
