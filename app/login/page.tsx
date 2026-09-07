import { redirect } from "next/navigation";
import { BotaoEntrarComGoogle } from "@/components/BotaoEntrarComGoogle";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Já logado? Não faz sentido mostrar a tela de login de novo.
  if (user) {
    redirect("/");
  }

  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-8 px-5 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Glicemia</h1>
        <p className="text-texto-suave">Acompanhamento de glicemia, insulina, refeições e humor.</p>
      </div>

      <BotaoEntrarComGoogle />

      {erro === "auth" && (
        <p role="alert" className="faixa faixa-hipo text-sm">
          Não foi possível concluir o login. Tente novamente.
        </p>
      )}

      <p className="max-w-xs text-xs text-texto-suave">
        Este app é de uso pessoal e familiar. Somente contas convidadas conseguem entrar.
      </p>
    </main>
  );
}
