"use client";

import { useEffect } from "react";
import { sincronizarFila } from "@/lib/filaOffline";
import { criarClienteNavegador } from "@/lib/supabase/client";

/**
 * Reenvia a fila offline (PROJECT.md F10) ao montar (cobre reabrir o app já
 * conectado com pendências antigas) e sempre que a conexão voltar.
 * Montado uma vez em app/layout.tsx — não renderiza nada.
 */
export function SincronizadorFila() {
  useEffect(() => {
    const supabase = criarClienteNavegador();

    sincronizarFila(supabase);

    function aoReconectar() {
      sincronizarFila(supabase);
    }

    window.addEventListener("online", aoReconectar);
    return () => window.removeEventListener("online", aoReconectar);
  }, []);

  return null;
}
