import type { Metas } from "@/lib/glicemia";

export type Perfil = {
  id: string;
  nome: string;
  /** Data no formato ISO (AAAA-MM-DD), como o Postgres devolve uma coluna `date`. */
  data_nascimento: string;
  criado_por: string;
  criado_em: string;
};

/**
 * Formato exato de uma linha da tabela `perfil_meta` (colunas em snake_case,
 * padrão do Postgres). NÃO confundir com `Metas`, que é o formato usado no
 * código (camelCase) — sempre passar por `linhaParaMetas` entre os dois.
 */
export type PerfilMetaLinha = {
  perfil_id: string;
  alvo_min: number;
  alvo_max: number;
  limite_hipo_grave: number;
  limite_hiper_severa: number;
};

export function linhaParaMetas(linha: PerfilMetaLinha): Metas {
  return {
    alvoMin: linha.alvo_min,
    alvoMax: linha.alvo_max,
    limiteHipoGrave: linha.limite_hipo_grave,
    limiteHiperSevera: linha.limite_hiper_severa,
  };
}

/** Idade em anos completos, na data de hoje. */
export function calcularIdade(dataNascimentoIso: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimentoIso);

  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversarioEsteAno =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

  if (aindaNaoFezAniversarioEsteAno) idade--;
  return idade;
}

export type ValidacaoPerfil =
  | { ok: true; nome: string; dataNascimento: string }
  | { ok: false; erros: Partial<Record<"nome" | "dataNascimento", string>> };

/**
 * Validação do formulário de novo perfil, espelhando as restrições do banco
 * (supabase/migrations/0001_schema_inicial.sql, tabela `perfil`) — para dar
 * o erro na hora, sem esperar a viagem até o servidor.
 */
export function validarNovoPerfil(entrada: { nome: unknown; dataNascimento: unknown }): ValidacaoPerfil {
  const erros: Partial<Record<"nome" | "dataNascimento", string>> = {};

  const nome = String(entrada.nome ?? "").trim();
  if (nome === "") {
    erros.nome = "Informe um nome.";
  }

  const dataNascimento = String(entrada.dataNascimento ?? "").trim();
  if (dataNascimento === "") {
    erros.dataNascimento = "Informe a data de nascimento.";
  } else if (new Date(dataNascimento) > new Date()) {
    erros.dataNascimento = "A data de nascimento não pode ser no futuro.";
  }

  if (Object.keys(erros).length > 0) {
    return { ok: false, erros };
  }

  return { ok: true, nome, dataNascimento };
}
