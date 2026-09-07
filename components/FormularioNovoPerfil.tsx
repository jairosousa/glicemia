"use client";

import { useActionState } from "react";
import { criarPerfil, type EstadoFormularioPerfil } from "@/app/perfis/novo/actions";

const ESTADO_INICIAL: EstadoFormularioPerfil = {};

export function FormularioNovoPerfil() {
  const [estado, acao, pendente] = useActionState(criarPerfil, ESTADO_INICIAL);

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          autoComplete="name"
          placeholder="Ex.: Jairo"
          aria-invalid={estado.erros?.nome ? true : undefined}
          aria-describedby={estado.erros?.nome ? "erro-nome" : undefined}
          className="toque rounded-lg border border-borda bg-fundo px-3 text-base"
        />
        {estado.erros?.nome && (
          <p id="erro-nome" role="alert" className="text-sm text-hipo">
            {estado.erros.nome}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dataNascimento" className="text-sm font-medium">
          Data de nascimento
        </label>
        <input
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          required
          max={new Date().toISOString().slice(0, 10)}
          aria-invalid={estado.erros?.dataNascimento ? true : undefined}
          aria-describedby={estado.erros?.dataNascimento ? "erro-data" : undefined}
          className="toque rounded-lg border border-borda bg-fundo px-3 text-base"
        />
        {estado.erros?.dataNascimento && (
          <p id="erro-data" role="alert" className="text-sm text-hipo">
            {estado.erros.dataNascimento}
          </p>
        )}
      </div>

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
        {pendente ? "Salvando…" : "Criar perfil"}
      </button>
    </form>
  );
}
