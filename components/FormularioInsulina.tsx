"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SeletorPill } from "@/components/SeletorPill";
import { paraDatetimeLocal, deDatetimeLocal } from "@/lib/datetime";
import {
  INSULINA_MAX,
  INSULINA_MIN,
  TIPO_INSULINA_ROTULO,
  validarDataHora,
  validarInsulina,
  type TipoInsulina,
} from "@/lib/glicemia";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Props = {
  perfilId: string;
  perfilNome: string;
  usuarioId: string;
};

type Status = "preenchendo" | "salvando" | "salvo" | "erro";

const TIPOS: TipoInsulina[] = ["BOLUS", "BASAL"];

/**
 * Registro de insulina (PROJECT.md F3).
 *
 * Mesma arquitetura do registro de glicemia (FormularioGlicemia.tsx): grava
 * direto do navegador para o Supabase, sem passar pelo servidor Next.js, para
 * manter o registro rápido. Bolus vem selecionado por padrão porque é
 * aplicado a cada refeição — mais frequente que a basal, aplicada 1–2x/dia.
 */
export function FormularioInsulina({ perfilId, perfilNome, usuarioId }: Props) {
  const [tipo, setTipo] = useState<TipoInsulina>("BOLUS");
  const [unidades, setUnidades] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<Status>("preenchendo");
  const [erroUnidades, setErroUnidades] = useState<string | null>(null);
  const [erroDataHora, setErroDataHora] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState<{ tipo: TipoInsulina; unidades: number } | null>(
    null,
  );

  const campoUnidadesRef = useRef<HTMLInputElement>(null);

  function reiniciarParaAgora() {
    setDataHora(paraDatetimeLocal(new Date()));
  }

  useEffect(() => {
    reiniciarParaAgora();
  }, []);

  useEffect(() => {
    if (status === "preenchendo") {
      campoUnidadesRef.current?.focus();
    }
  }, [status]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    const validacao = validarInsulina(unidades);
    if (!validacao.ok) {
      setErroUnidades(validacao.erro);
      return;
    }
    setErroUnidades(null);

    const dataHoraValidada = validarDataHora(deDatetimeLocal(dataHora));
    if (!dataHoraValidada.ok) {
      setErroDataHora(dataHoraValidada.erro);
      return;
    }
    setErroDataHora(null);
    setErroGeral(null);
    setStatus("salvando");

    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("registro_insulina").insert({
      id: crypto.randomUUID(),
      perfil_id: perfilId,
      tipo,
      unidades: validacao.valor,
      data_hora: dataHoraValidada.valor.toISOString(),
      observacao: observacao.trim() || null,
      registrado_por: usuarioId,
    });

    if (error) {
      setErroGeral("Não foi possível salvar. Verifique sua internet e tente novamente.");
      setStatus("erro");
      return;
    }

    setUltimoRegistro({ tipo, unidades: validacao.valor });
    setStatus("salvo");
  }

  function registrarOutra() {
    setUnidades("");
    setObservacao("");
    setUltimoRegistro(null);
    setErroGeral(null);
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
            {ultimoRegistro.unidades}{" "}
            <span className="text-lg font-normal text-texto-suave">U</span>
          </p>
          <span className="faixa faixa-alvo">{TIPO_INSULINA_ROTULO[ultimoRegistro.tipo]}</span>
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={registrarOutra}
            className="toque rounded-lg bg-texto px-4 font-medium text-fundo"
          >
            Registrar outra dose
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
          opcoes={TIPOS.map((t) => ({ valor: t, rotulo: TIPO_INSULINA_ROTULO[t] }))}
          valor={tipo}
          aoMudar={setTipo}
          rotuloGrupo="Tipo de insulina"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="unidades" className="text-sm font-medium">
          Unidades (U)
        </label>
        <input
          ref={campoUnidadesRef}
          id="unidades"
          name="unidades"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          value={unidades}
          onChange={(e) => setUnidades(e.target.value.replace(/[^0-9,.]/g, ""))}
          placeholder={`${INSULINA_MIN}–${INSULINA_MAX}`}
          aria-invalid={erroUnidades ? true : undefined}
          aria-describedby={erroUnidades ? "erro-unidades" : undefined}
          className="numero toque rounded-lg border border-borda bg-fundo px-3 text-3xl font-semibold"
        />
        {erroUnidades && (
          <p id="erro-unidades" role="alert" className="text-sm text-hipo">
            {erroUnidades}
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
        <label htmlFor="observacao" className="text-sm font-medium">
          Observação <span className="font-normal text-texto-suave">(opcional)</span>
        </label>
        <input
          id="observacao"
          name="observacao"
          type="text"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className="toque rounded-lg border border-borda bg-fundo px-3"
        />
      </div>

      {erroGeral && (
        <p role="alert" className="faixa faixa-hipo text-sm">
          {erroGeral}
        </p>
      )}

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
