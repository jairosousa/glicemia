"use client";

import { useEffect, useState } from "react";
import { assinarFila, contarPendentes } from "@/lib/filaOffline";

/**
 * Indicador visível de pendência (PROJECT.md F10): mostra quantos registros
 * feitos offline ainda não subiram para o Supabase. Fica invisível quando a
 * fila está vazia — a maior parte do tempo.
 */
export function IndicadorFila() {
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    setPendentes(contarPendentes());
    return assinarFila(() => setPendentes(contarPendentes()));
  }, []);

  if (pendentes === 0) return null;

  return (
    <p role="status" className="no-print faixa faixa-hiper mt-3 text-sm">
      {pendentes} {pendentes === 1 ? "registro pendente" : "registros pendentes"} de envio — sobe
      sozinho quando a internet voltar.
    </p>
  );
}
