"use client";

import { useActionState } from "react";
import { atualizarMetas, type EstadoFormularioMetas } from "@/app/perfil/[perfilId]/metas/editar/actions";
import type { Metas } from "@/lib/glicemia";
import type { CampoMeta } from "@/lib/perfil";

const ESTADO_INICIAL: EstadoFormularioMetas = {};

const CAMPOS: { nome: CampoMeta; rotulo: string; ajuda: string }[] = [
  { nome: "limiteHipoGrave", rotulo: "Hipo grave abaixo de", ajuda: "Emergência — abaixo deste valor." },
  { nome: "alvoMin", rotulo: "Faixa alvo — mínimo", ajuda: "Início da meta." },
  { nome: "alvoMax", rotulo: "Faixa alvo — máximo", ajuda: "Fim da meta." },
  { nome: "limiteHiperSevera", rotulo: "Hiper severa acima de", ajuda: "Risco de cetoacidose — acima deste valor." },
];

type Props = {
  perfilId: string;
  metasAtuais: Metas;
};

export function FormularioMetas({ perfilId, metasAtuais }: Props) {
  const acaoComPerfil = atualizarMetas.bind(null, perfilId);
  const [estado, acao, pendente] = useActionState(acaoComPerfil, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      {CAMPOS.map((campo) => (
        <div key={campo.nome} className="flex flex-col gap-1.5">
          <label htmlFor={campo.nome} className="text-sm font-medium">
            {campo.rotulo} <span className="font-normal text-texto-suave">(mg/dL)</span>
          </label>
          <input
            id={campo.nome}
            name={campo.nome}
            type="number"
            inputMode="numeric"
            required
            defaultValue={metasAtuais[campo.nome]}
            aria-invalid={estado.erros?.[campo.nome] ? true : undefined}
            aria-describedby={`ajuda-${campo.nome}${estado.erros?.[campo.nome] ? ` erro-${campo.nome}` : ""}`}
            className="numero toque rounded-lg border border-borda bg-fundo px-3 text-lg"
          />
          <p id={`ajuda-${campo.nome}`} className="text-sm text-texto-suave">
            {campo.ajuda}
          </p>
          {estado.erros?.[campo.nome] && (
            <p id={`erro-${campo.nome}`} role="alert" className="text-sm text-hipo">
              {estado.erros[campo.nome]}
            </p>
          )}
        </div>
      ))}

      {estado.erroGeral && (
        <p role="alert" className="faixa faixa-hipo text-sm">
          {estado.erroGeral}
        </p>
      )}

      <button
        type="submit"
        disabled={pendente}
        className="toque rounded-lg bg-texto px-4 font-medium text-fundo transition disabled:opacity-60"
      >
        {pendente ? "Salvando…" : "Salvar metas"}
      </button>
    </form>
  );
}
