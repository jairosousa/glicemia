"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EtiquetaFaixa } from "@/components/EtiquetaFaixa";
import { SeletorPill } from "@/components/SeletorPill";
import { paraDatetimeLocal, deDatetimeLocal } from "@/lib/datetime";
import {
  CONTEXTO_ROTULO,
  GLICEMIA_MAX,
  GLICEMIA_MIN,
  inferirContexto,
  validarDataHora,
  validarGlicemia,
  type Contexto,
  type Metas,
} from "@/lib/glicemia";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Props = {
  perfilId: string;
  perfilNome: string;
  metas: Metas;
  usuarioId: string;
};

type Status = "preenchendo" | "salvando" | "salvo" | "erro";

const CONTEXTOS: Contexto[] = [
  "JEJUM",
  "ANTES_REFEICAO",
  "POS_REFEICAO_2H",
  "ANTES_DORMIR",
  "MADRUGADA",
  "ANTES_EXERCICIO",
  "DEPOIS_EXERCICIO",
  "SINTOMA_HIPO",
  "ALEATORIO",
];

/**
 * Registro de glicemia — a tela mais importante do app.
 *
 * PROJECT.md §9: registrar precisa custar menos de 10 segundos, do toque no
 * ícone à confirmação. Três decisões de design vêm direto disso:
 *
 * 1. Data/hora e contexto já chegam preenchidos (inferidos), então na maioria
 *    das vezes só falta digitar o número e tocar em salvar.
 * 2. O campo de valor recebe foco automático assim que a tela abre.
 * 3. A gravação é direto do navegador para o Supabase — sem passar por uma
 *    rota do servidor Next.js — porque cada requisição a mais é tempo a mais
 *    entre o toque e a confirmação.
 */
export function FormularioGlicemia({ perfilId, perfilNome, metas, usuarioId }: Props) {
  const [valor, setValor] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [contexto, setContexto] = useState<Contexto>("ALEATORIO");
  const [observacao, setObservacao] = useState("");
  const [status, setStatus] = useState<Status>("preenchendo");
  const [erroValor, setErroValor] = useState<string | null>(null);
  const [erroDataHora, setErroDataHora] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [ultimoValor, setUltimoValor] = useState<number | null>(null);

  const campoValorRef = useRef<HTMLInputElement>(null);

  function reiniciarParaAgora() {
    const agora = new Date();
    setDataHora(paraDatetimeLocal(agora));
    setContexto(inferirContexto(agora));
  }

  // Roda só no cliente: evita que o servidor e o navegador calculem "agora"
  // em instantes diferentes e gerem um aviso de hidratação no React.
  useEffect(() => {
    reiniciarParaAgora();
  }, []);

  useEffect(() => {
    if (status === "preenchendo") {
      campoValorRef.current?.focus();
    }
  }, [status]);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    const validacao = validarGlicemia(valor);
    if (!validacao.ok) {
      setErroValor(validacao.erro);
      return;
    }
    setErroValor(null);

    const dataHoraValidada = validarDataHora(deDatetimeLocal(dataHora));
    if (!dataHoraValidada.ok) {
      setErroDataHora(dataHoraValidada.erro);
      return;
    }
    setErroDataHora(null);
    setErroGeral(null);
    setStatus("salvando");

    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("medicao_glicemia").insert({
      id: crypto.randomUUID(),
      perfil_id: perfilId,
      valor: validacao.valor,
      data_hora: dataHoraValidada.valor.toISOString(),
      contexto,
      observacao: observacao.trim() || null,
      registrado_por: usuarioId,
    });

    if (error) {
      setErroGeral("Não foi possível salvar. Verifique sua internet e tente novamente.");
      setStatus("erro");
      return;
    }

    setUltimoValor(validacao.valor);
    setStatus("salvo");
  }

  function registrarOutra() {
    setValor("");
    setObservacao("");
    setUltimoValor(null);
    setErroGeral(null);
    setErroDataHora(null);
    reiniciarParaAgora();
    setStatus("preenchendo");
  }

  if (status === "salvo" && ultimoValor !== null) {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span aria-hidden="true" className="text-alvo text-4xl">
            ✓
          </span>
          <p className="numero text-4xl font-bold">
            {ultimoValor} <span className="text-lg font-normal text-texto-suave">mg/dL</span>
          </p>
          <EtiquetaFaixa valor={ultimoValor} metas={metas} detalhe="longo" />
        </div>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={registrarOutra}
            className="toque rounded-lg bg-texto px-4 font-medium text-fundo"
          >
            Registrar outra leitura
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
        <label htmlFor="valor" className="text-sm font-medium">
          Glicemia (mg/dL)
        </label>
        <input
          ref={campoValorRef}
          id="valor"
          name="valor"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={3}
          required
          value={valor}
          onChange={(e) => setValor(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={`${GLICEMIA_MIN}–${GLICEMIA_MAX}`}
          aria-invalid={erroValor ? true : undefined}
          aria-describedby={erroValor ? "erro-valor" : undefined}
          className="numero toque rounded-lg border border-borda bg-fundo px-3 text-3xl font-semibold"
        />
        {erroValor && (
          <p id="erro-valor" role="alert" className="text-sm text-hipo">
            {erroValor}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Contexto</span>
        <SeletorPill
          opcoes={CONTEXTOS.map((c) => ({ valor: c, rotulo: CONTEXTO_ROTULO[c] }))}
          valor={contexto}
          aoMudar={setContexto}
          rotuloGrupo="Contexto da medição"
        />
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
