import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FormularioCompartilhar } from "@/components/FormularioCompartilhar";
import { obterPapelAcesso } from "@/lib/acesso";
import type { Perfil } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function CompartilharPage({
  params,
}: {
  params: Promise<{ perfilId: string }>;
}) {
  const { perfilId } = await params;
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfil")
    .select("*")
    .eq("id", perfilId)
    .single<Perfil>();

  if (!perfil) {
    notFound();
  }

  const papel = await obterPapelAcesso(supabase, perfilId, user.id);
  if (papel !== "PACIENTE") {
    redirect(`/perfil/${perfilId}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-5 py-8 sm:py-12">
      <div className="flex flex-col gap-1.5">
        <Link href={`/perfil/${perfilId}`} className="text-sm text-texto-suave hover:underline">
          ← {perfil.nome}
        </Link>
        <h1 className="text-2xl font-bold">Compartilhar perfil</h1>
        <p className="text-sm text-texto-suave">
          Dá acesso de leitura ao histórico, painel e relatório de {perfil.nome} — sem poder criar,
          editar ou excluir nada.
        </p>
      </div>

      <FormularioCompartilhar perfilId={perfilId} />
    </main>
  );
}
