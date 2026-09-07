"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validarNovoPerfil } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoFormularioPerfil = {
  erros?: Partial<Record<"nome" | "dataNascimento", string>>;
  erroGeral?: string;
};

export async function criarPerfil(
  _estadoAnterior: EstadoFormularioPerfil,
  formData: FormData,
): Promise<EstadoFormularioPerfil> {
  const validacao = validarNovoPerfil({
    nome: formData.get("nome"),
    dataNascimento: formData.get("dataNascimento"),
  });

  if (!validacao.ok) {
    return { erros: validacao.erros };
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("perfil").insert({
    nome: validacao.nome,
    data_nascimento: validacao.dataNascimento,
    criado_por: user.id,
  });

  if (error) {
    return { erroGeral: "Não foi possível salvar o perfil. Tente novamente." };
  }

  revalidatePath("/");
  redirect("/");
}
