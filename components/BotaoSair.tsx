"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function BotaoSair() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    const supabase = criarClienteNavegador();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={saindo}
      className="toque rounded-lg border border-borda px-3 text-sm font-medium text-texto-suave transition hover:bg-superficie disabled:opacity-60"
    >
      {saindo ? "Saindo…" : "Sair"}
    </button>
  );
}
