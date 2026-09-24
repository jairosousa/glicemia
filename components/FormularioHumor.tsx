"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { paraDatetimeLocal, deDatetimeLocal } from "@/lib/datetime";
import { salvarOuEnfileirar } from "@/lib/filaOffline";
import { validarDataHora } from "@/lib/glicemia";
import { NIVEIS_HUMOR, NIVEL_HUMOR_INFO, type NivelHumor } from "@/lib/humor";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Props = {
  perfilId: string;
  perfilNome: string;
  usuarioId: string;
};

type Status = "preenchendo" | "salvando" | "salvo" | "erro";

/**
 * Registro de humor (PROJECT.md F5).
 *
 * Independente da glicemia — dá para registrar "me sinto mal" sem medir.
 * Mesma arquitetura de registro rápido dos outros formulários: grava direto
 * do navegador para o Supabase.
 */
export function FormularioHumor({ perfilId, perfilNome, usuarioId }: Props) {
  const [nivel, setNivel] = useState<NivelHumor>("NEUTRO");
  const [observacao, setObservacao] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [status, setStatus] = useState<Status>("preenchendo");
  const [erroDataHora, setErroDataHora] = useState<string | null>(null);
  const [ultimoNivel, setUltimoNivel] = useState<NivelHumor | null>(null);
  const [pendente, setPendente] = useState(false);

  const primeiroBotaoRef = useRef<HTMLButtonElement>(null);

  function reiniciarParaAgora() {
    setDataHora(paraDatetimeLocal(new Date()));
  }

  useEffect(() => {
    reiniciarParaAgora();
  }, []);

  useEffect(() => {
    if (status === "preenchendo") {
      primeiroBotaoRef.current?.focus();
    }
  }, [status]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    const dataHoraValidada = validarDataHora(deDatetimeLocal(dataHora));
    if (!dataHoraValidada.ok) {
      setErroDataHora(dataHoraValidada.erro);
      return;
    }
    setErroDataHora(null);
    setStatus("salvando");

    const supabase = criarClienteNavegador();
    const { pendente: ficouPendente } = await salvarOuEnfileirar(supabase, "registro_humor", {
      id: crypto.randomUUID(),
      perfil_id: perfilId,
      nivel,
      data_hora: dataHoraValidada.valor.toISOString(),
      observacao: observacao.trim() || null,
      registrado_por: usuarioId,
    });

    setPendente(ficouPendente);
    setUltimoNivel(nivel);
    setStatus("salvo");
  }

  function registrarOutro() {
    setObservacao("");
    setUltimoNivel(null);
    setPendente(false);
    setErroDataHora(null);
    setNivel("NEUTRO");
    reiniciarParaAgora();
    setStatus("preenchendo");
  }

  if (status === "salvo" && ultimoNivel !== null) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span aria-hidden="true" className="text-4xl">
            {NIVEL_HUMOR_INFO[ultimoNivel].icone}
          </span>
          <p className="text-xl font-bold">{NIVEL_HUMOR_INFO[ultimoNivel].rotulo}</p>
          {pendente && (
            <p className="faixa faixa-hiper text-sm">
              Salvo localmente — sobe sozinho quando a internet voltar.
            </p>
          )}
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={registrarOutro}
            className="toque rounded-lg bg-texto px-4 font-medium text-fundo"
          >
            Registrar outro humor
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
        <span className="text-sm font-medium">Como você está?</span>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Nível de humor">
          {NIVEIS_HUMOR.map((n, indice) => (
            <button
              key={n}
              ref={indice === 0 ? primeiroBotaoRef : undefined}
              type="button"
              role="radio"
              aria-checked={nivel === n}
              aria-label={NIVEL_HUMOR_INFO[n].rotulo}
              onClick={() => setNivel(n)}
              className={`toque flex flex-col items-center justify-center gap-1 rounded-lg border px-1 text-2xl transition ${
                nivel === n
                  ? "border-texto bg-texto"
                  : "border-borda bg-fundo hover:bg-superficie"
              }`}
            >
              <span aria-hidden="true">{NIVEL_HUMOR_INFO[n].icone}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-texto-suave">
          {NIVEL_HUMOR_INFO[nivel].rotulo}
        </p>
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
