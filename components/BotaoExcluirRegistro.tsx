"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Props = {
  tabela: "medicao_glicemia" | "registro_insulina";
  registroId: string;
  /** Usado só na pergunta de confirmação, ex.: "a glicemia de 95 mg/dL". */
  descricao: string;
};

export function BotaoExcluirRegistro({ tabela, registroId, descricao }: Props) {
  const router = useRouter();
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    const confirmado = window.confirm(`Excluir ${descricao}? Essa ação não pode ser desfeita.`);
    if (!confirmado) return;

    setExcluindo(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from(tabela).delete().eq("id", registroId);
    setExcluindo(false);

    if (error) {
      window.alert("Não foi possível excluir. Verifique sua internet e tente novamente.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={excluir}
      disabled={excluindo}
      aria-label={`Excluir ${descricao}`}
      className="toque rounded-lg px-2.5 text-sm text-texto-suave transition hover:bg-red-50 hover:text-red-700 disabled:opacity-60 dark:hover:bg-red-950 dark:hover:text-red-300"
    >
      {excluindo ? "Excluindo…" : "Excluir"}
    </button>
  );
}
