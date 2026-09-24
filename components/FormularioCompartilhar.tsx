"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";

type Props = {
  perfilId: string;
};

type Status = "preenchendo" | "enviando" | "enviado";

/**
 * Compartilha o perfil como OBSERVADOR (somente leitura) com quem já tem
 * conta no app (PROJECT.md F8). Chama a função `convidar_observador` (ver
 * supabase/migrations/0004_compartilhar_perfil.sql) — ela mesma checa que
 * quem está chamando é PACIENTE deste perfil, então não repetimos a
 * checagem aqui.
 */
export function FormularioCompartilhar({ perfilId }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("preenchendo");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setStatus("enviando");

    const supabase = criarClienteNavegador();
    const { error } = await supabase.rpc("convidar_observador", {
      p_perfil_id: perfilId,
      p_email: email.trim(),
    });

    if (error) {
      setErro(error.message);
      setStatus("preenchendo");
      return;
    }

    setStatus("enviado");
  }

  if (status === "enviado") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span aria-hidden="true" className="text-alvo text-4xl">
          ✓
        </span>
        <p className="text-lg font-semibold">Acesso concedido a {email}.</p>
        <p className="text-sm text-texto-suave">
          A pessoa já pode entrar no app com a conta Google dela e ver este perfil — sem poder
          criar, editar ou excluir nada.
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail("");
            setStatus("preenchendo");
          }}
          className="toque rounded-lg border border-borda px-4 font-medium hover:bg-superficie"
        >
          Compartilhar com outra pessoa
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail da conta Google
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@exemplo.com"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? "erro-email" : undefined}
          className="toque rounded-lg border border-borda bg-fundo px-3 text-base"
        />
        <p className="text-sm text-texto-suave">
          Funciona só para quem já entrou no app com a conta Google pelo menos uma vez.
        </p>
        {erro && (
          <p id="erro-email" role="alert" className="text-sm text-hipo">
            {erro}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "enviando"}
        className="toque rounded-lg bg-texto px-4 font-medium text-fundo transition disabled:opacity-60"
      >
        {status === "enviando" ? "Compartilhando…" : "Compartilhar acesso"}
      </button>
    </form>
  );
}
