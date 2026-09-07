/**
 * Núcleo de domínio da glicemia.
 *
 * Este arquivo concentra TODA a regra clínica do app: as faixas, a classificação
 * de um valor, a validação de digitação e a inferência do contexto da medição.
 *
 * Por que tudo num lugar só: se a regra de "o que é hipoglicemia" estiver
 * espalhada por várias telas, um dia elas vão discordar entre si — e aí o app
 * mostra verde numa tela e vermelho na outra para o mesmo número.
 *
 * Referência clínica: diretrizes ADA e SBD para adulto com diabetes tipo 1.
 * Ver PROJECT.md §5.2.
 */

// ---------------------------------------------------------------------------
// Metas glicêmicas
// ---------------------------------------------------------------------------

export type Metas = {
  /** Limite inferior da faixa alvo, em mg/dL. */
  alvoMin: number;
  /** Limite superior da faixa alvo, em mg/dL. */
  alvoMax: number;
  /** Abaixo deste valor é hipoglicemia grave (emergência). */
  limiteHipoGrave: number;
  /** Acima deste valor é hiperglicemia severa (risco de cetoacidose). */
  limiteHiperSevera: number;
};

/**
 * Metas padrão para adulto com diabetes tipo 1.
 *
 * IMPORTANTE: alvo glicêmico é individualizado. Cada perfil pode sobrescrever
 * estes valores — criança e adolescente costumam ter alvo noturno mais alto
 * para reduzir risco de hipoglicemia durante o sono.
 */
export const METAS_PADRAO: Metas = {
  alvoMin: 70,
  alvoMax: 180,
  limiteHipoGrave: 54,
  limiteHiperSevera: 250,
};

// ---------------------------------------------------------------------------
// Classificação
// ---------------------------------------------------------------------------

export type Classificacao =
  | "HIPO_GRAVE"
  | "HIPO"
  | "ALVO"
  | "HIPER"
  | "HIPER_SEVERA";

/**
 * Classifica um valor de glicemia dentro das metas informadas.
 *
 * As comparações usam as metas na ordem do mais grave para o menos grave,
 * para que faixas mal configuradas nunca deixem um valor sem classificação.
 */
export function classificar(valor: number, metas: Metas = METAS_PADRAO): Classificacao {
  if (valor < metas.limiteHipoGrave) return "HIPO_GRAVE";
  if (valor < metas.alvoMin) return "HIPO";
  if (valor <= metas.alvoMax) return "ALVO";
  if (valor <= metas.limiteHiperSevera) return "HIPER";
  return "HIPER_SEVERA";
}

/**
 * Como cada classificação é comunicada ao usuário.
 *
 * REGRA FIRME (PROJECT.md §5.2): status nunca é comunicado só por cor.
 * Toda classificação carrega cor + ícone + texto. Parte das pessoas com
 * diabetes desenvolve retinopatia e perde precisão na visão de cores.
 */
export const CLASSIFICACAO_INFO: Record<
  Classificacao,
  {
    /** Texto curto, para etiquetas e listas. */
    curto: string;
    /** Texto completo, para a tela de confirmação do registro. */
    longo: string;
    /** Ícone que acompanha a cor. Nunca omitir. */
    icone: string;
    /** Classe Tailwind da etiqueta. Tokens definidos em app/globals.css. */
    classe: string;
    /** Ordem de gravidade, para ordenar resumos. 0 = mais grave. */
    gravidade: number;
  }
> = {
  HIPO_GRAVE: {
    curto: "Hipo grave",
    longo: "Hipoglicemia grave — procure ajuda",
    icone: "▼▼",
    classe: "faixa-hipo-grave",
    gravidade: 0,
  },
  HIPO: {
    curto: "Baixa",
    longo: "Hipoglicemia — abaixo da meta",
    icone: "▼",
    classe: "faixa-hipo",
    gravidade: 1,
  },
  ALVO: {
    curto: "Na faixa",
    longo: "Dentro da meta",
    icone: "✓",
    classe: "faixa-alvo",
    gravidade: 4,
  },
  HIPER: {
    curto: "Alta",
    longo: "Hiperglicemia — acima da meta",
    icone: "▲",
    classe: "faixa-hiper",
    gravidade: 3,
  },
  HIPER_SEVERA: {
    curto: "Muito alta",
    longo: "Hiperglicemia severa — atenção",
    icone: "▲▲",
    classe: "faixa-hiper-severa",
    gravidade: 2,
  },
};

// ---------------------------------------------------------------------------
// Validação de entrada
// ---------------------------------------------------------------------------

/** Menor valor aceito. Abaixo disso é erro de digitação, não medição. */
export const GLICEMIA_MIN = 20;
/** Maior valor aceito. Acima disso é erro de digitação (ex.: 1200 em vez de 120). */
export const GLICEMIA_MAX = 600;

export type Validacao<T> =
  | { ok: true; valor: T }
  | { ok: false; erro: string };

/**
 * Valida um valor de glicemia digitado.
 *
 * Recebe `unknown` de propósito: o valor vem de um campo de formulário, ou seja,
 * chega como texto. Deixar o TypeScript exigir a conversão aqui impede a classe
 * de erro mais perigosa do app — tratar "180" (texto) como 180 (número) e
 * classificar a glicemia errado.
 */
export function validarGlicemia(entrada: unknown): Validacao<number> {
  const texto = String(entrada ?? "").trim();

  if (texto === "") {
    return { ok: false, erro: "Informe o valor da glicemia." };
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return { ok: false, erro: "Use apenas números." };
  }
  if (!Number.isInteger(numero)) {
    return { ok: false, erro: "A glicemia é um número inteiro, sem casas decimais." };
  }
  if (numero < GLICEMIA_MIN || numero > GLICEMIA_MAX) {
    return {
      ok: false,
      erro: `Valor fora do possível. Informe entre ${GLICEMIA_MIN} e ${GLICEMIA_MAX} mg/dL.`,
    };
  }

  return { ok: true, valor: numero };
}

/** Menor dose registrável. */
export const INSULINA_MIN = 0.5;
/** Maior dose registrável. */
export const INSULINA_MAX = 100;

export function validarInsulina(entrada: unknown): Validacao<number> {
  const texto = String(entrada ?? "").trim().replace(",", ".");

  if (texto === "") {
    return { ok: false, erro: "Informe as unidades de insulina." };
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero)) {
    return { ok: false, erro: "Use apenas números." };
  }
  if (numero < INSULINA_MIN || numero > INSULINA_MAX) {
    return {
      ok: false,
      erro: `Informe entre ${INSULINA_MIN} e ${INSULINA_MAX} unidades.`,
    };
  }

  return { ok: true, valor: numero };
}

/**
 * Valida se a data/hora de um registro não está no futuro.
 *
 * Compara com o relógio do próprio aparelho — o mesmo que preencheu o campo
 * por padrão — então nunca acusa erro por diferença entre o relógio do
 * cliente e o do servidor (esse tipo de folga fica a cargo da checagem do
 * banco, que usa uma tolerância maior). Esta função existe para pegar o caso
 * de a pessoa mexer manualmente no campo e escolher uma data futura.
 */
export function validarDataHora(dataHora: Date): Validacao<Date> {
  if (Number.isNaN(dataHora.getTime())) {
    return { ok: false, erro: "Informe uma data e hora válidas." };
  }

  const tolerancia = 60_000; // 1 minuto — absorve o tempo entre preencher e enviar
  if (dataHora.getTime() > Date.now() + tolerancia) {
    return { ok: false, erro: "A data e hora não podem estar no futuro." };
  }

  return { ok: true, valor: dataHora };
}

// ---------------------------------------------------------------------------
// Contexto da medição
// ---------------------------------------------------------------------------

export type Contexto =
  | "JEJUM"
  | "ANTES_REFEICAO"
  | "POS_REFEICAO_2H"
  | "ANTES_DORMIR"
  | "MADRUGADA"
  | "ANTES_EXERCICIO"
  | "DEPOIS_EXERCICIO"
  | "SINTOMA_HIPO"
  | "ALEATORIO";

export const CONTEXTO_ROTULO: Record<Contexto, string> = {
  JEJUM: "Em jejum",
  ANTES_REFEICAO: "Antes da refeição",
  POS_REFEICAO_2H: "2h após refeição",
  ANTES_DORMIR: "Antes de dormir",
  MADRUGADA: "Madrugada",
  ANTES_EXERCICIO: "Antes do exercício",
  DEPOIS_EXERCICIO: "Depois do exercício",
  SINTOMA_HIPO: "Sentindo sintoma",
  ALEATORIO: "Fora de contexto",
};

/**
 * Sugere o contexto a partir do horário da medição.
 *
 * O contexto é obrigatório porque é ele que dá sentido ao número: 180 mg/dL em
 * jejum é um problema, 180 duas horas após o almoço está na meta. Mas exigir
 * que o usuário escolha antes de salvar quebraria a meta de registrar em menos
 * de 10 segundos. Então inferimos e deixamos corrigível em um toque.
 */
export function inferirContexto(quando: Date): Contexto {
  const hora = quando.getHours();
  if (hora >= 22 || hora < 5) return "MADRUGADA";
  if (hora < 9) return "JEJUM";
  return "ALEATORIO";
}

// ---------------------------------------------------------------------------
// Insulina
// ---------------------------------------------------------------------------

export type TipoInsulina = "BASAL" | "BOLUS";

export const TIPO_INSULINA_ROTULO: Record<TipoInsulina, string> = {
  BASAL: "Basal",
  BOLUS: "Bolus",
};
