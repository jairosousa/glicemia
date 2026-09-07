"use client";

type Opcao<T extends string> = { valor: T; rotulo: string };

type Props<T extends string> = {
  opcoes: Opcao<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  rotuloGrupo: string;
};

/** Grupo de botões de escolha única — usado onde antes seria um `<select>`,
 * mas trocar de opção precisa custar um toque, não dois. */
export function SeletorPill<T extends string>({ opcoes, valor, aoMudar, rotuloGrupo }: Props<T>) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={rotuloGrupo}>
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          role="radio"
          aria-checked={valor === opcao.valor}
          onClick={() => aoMudar(opcao.valor)}
          className={`toque rounded-lg border px-3 text-sm font-medium transition ${
            valor === opcao.valor
              ? "border-texto bg-texto text-fundo"
              : "border-borda bg-fundo text-texto hover:bg-superficie"
          }`}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
