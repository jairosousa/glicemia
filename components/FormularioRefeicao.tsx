"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SeletorPill } from "@/components/SeletorPill";
import { paraDatetimeLocal, deDatetimeLocal } from "@/lib/datetime";
import { salvarOuEnfileirar } from "@/lib/filaOffline";
import { validarDataHora } from "@/lib/glicemia";
import {
  CARBOIDRATO_MAX,
  CARBOIDRATO_MIN,
  TIPO_REFEICAO_ROTULO,
  inferirTipoRefeicao,
  validarCarboidrato,
  type TipoRefeicao,
} from "@/lib/refeicao";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Props = {
  perfilId: string;
  perfilNome: string;
  usuarioId: string;
};

type Status = "preenchendo" | "salvando" | "salvo" | "erro";

const TIPOS: TipoRefeicao[] = ["CAFE", "ALMOCO", "JANTAR", "LANCHE"];

/**
 * Registro de refeição (PROJECT.md F4).
 *
 * Mesma arquitetura de FormularioGlicemia.tsx / FormularioInsulina.tsx:
 * grava direto do navegador para o Supabase, sem passar pelo servidor
 * Next.js, para manter o registro rápido.
 */
export function FormularioRefeicao({ perfilId, perfilNome, usuarioId }: Props) {
  const [tipo, setTipo] = useState<TipoRefeicao>("LANCHE");
  const [carboidratos, setCarboidratos] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [status, setStatus] = useState<Status>("preenchendo");
  const [erroCarboidratos, setErroCarboidratos] = useState<string | null>(null);
  const [erroDataHora, setErroDataHora] = useState<string | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState<{ tipo: TipoRefeicao; carboidratos: number } | null>(
    null,
  );
  const [pendente, setPendente] = useState(false);

  const campoCarboidratosRef = useRef<HTMLInputElement>(null);

  function reiniciarParaAgora() {
    const agora = new Date();
    setDataHora(paraDatetimeLocal(agora));
    setTipo(inferirTipoRefeicao(agora));
  }

  useEffect(() => {
    reiniciarParaAgora();
  }, []);

  useEffect(() => {
    if (status === "preenchendo") {
      campoCarboidratosRef.current?.focus();
    }
  }, [status]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    const validacao = validarCarboidrato(carboidratos);
    if (!validacao.ok) {
      setErroCarboidratos(validacao.erro);
      return;
    }
    setErroCarboidratos(null);

    const dataHoraValidada = validarDataHora(deDatetimeLocal(dataHora));
    if (!dataHoraValidada.ok) {
      setErroDataHora(dataHoraValidada.erro);
      return;
    }
    setErroDataHora(null);
    setStatus("salvando");

    const supabase = criarClienteNavegador();
    const { pendente: ficouPendente } = await salvarOuEnfileirar(supabase, "refeicao", {
      id: crypto.randomUUID(),
      perfil_id: perfilId,
      tipo,
      carboidratos_gramas: validacao.valor,
      data_hora: dataHoraValidada.valor.toISOString(),
      descricao: descricao.trim() || null,
      registrado_por: usuarioId,
    });

    setPendente(ficouPendente);
    setUltimoRegistro({ tipo, carboidratos: validacao.valor });
    setStatus("salvo");
  }

  function registrarOutra() {
    setCarboidratos("");
    setDescricao("");
    setUltimoRegistro(null);
    setPendente(false);
    setErroDataHora(null);
    reiniciarParaAgora();
    setStatus("preenchendo");
  }

  if (status === "salvo" && ultimoRegistro !== null) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span aria-hidden="true" className="text-alvo text-4xl">
            ✓
          </span>
          <p className="numero text-4xl font-bold">
            {ultimoRegistro.carboidratos}{" "}
            <span className="text-lg font-normal text-texto-suave">g</span>
          </p>
          <span className="faixa faixa-alvo">{TIPO_REFEICAO_ROTULO[ultimoRegistro.tipo]}</span>
          {pendente && (
            <p className="faixa faixa-hiper text-sm">
              Salvo localmente — sobe sozinho quando a internet voltar.
            </p>
          )}
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={registrarOutra}
            className="toque rounded-lg bg-texto px-4 font-medium text-fundo"
          >
            Registrar outra refeição
          </button>
          <Link
            href={`/perfil/${perfilId}`}
            className="toque flex items-center justify-center rounded-lg border border-borda px-4 font-medium"
          >
            Voltar ao perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Tipo</span>
        <SeletorPill
          opcoes={TIPOS.map((t) => ({ valor: t, rotulo: TIPO_REFEICAO_ROTULO[t] }))}
          valor={tipo}
          aoMudar={setTipo}
          rotuloGrupo="Tipo de refeição"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="carboidratos" className="text-sm font-medium">
          Carboidratos (g)
        </label>
        <input
          ref={campoCarboidratosRef}
          id="carboidratos"
          name="carboidratos"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={3}
          required
          value={carboidratos}
          onChange={(e) => setCarboidratos(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={`${CARBOIDRATO_MIN}–${CARBOIDRATO_MAX}`}
          aria-invalid={erroCarboidratos ? true : undefined}
          aria-describedby={erroCarboidratos ? "erro-carboidratos" : undefined}
          className="numero toque rounded-lg border border-borda bg-fundo px-3 text-3xl font-semibold"
        />
        {erroCarboidratos && (
          <p id="erro-carboidratos" role="alert" className="text-sm text-hipo">
            {erroCarboidratos}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dataHora" className="text-sm font-medium">
          Data e hora
        </label>
        <input
          id="dataHora"
          name="dataHora"
          type="datetime-local"
          required
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          aria-invalid={erroDataHora ? true : undefined}
          aria-describedby={erroDataHora ? "erro-data-hora" : undefined}
          className="numero toque rounded-lg border border-borda bg-fundo px-3"
        />
        {erroDataHora && (
          <p id="erro-data-hora" role="alert" className="text-sm text-hipo">
            {erroDataHora}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="descricao" className="text-sm font-medium">
          Descrição <span className="font-normal text-texto-suave">(opcional)</span>
        </label>
        <input
          id="descricao"
          name="descricao"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: arroz, feijão e frango"
          className="toque rounded-lg border border-borda bg-fundo px-3"
        />
      </div>

      <button
        type="submit"
        disabled={status === "salvando"}
        className="toque rounded-lg bg-texto px-4 text-lg font-semibold text-fundo disabled:opacity-60"
      >
        {status === "salvando" ? "Salvando…" : `Salvar para ${perfilNome}`}
      </button>
    </form>
  );
}
