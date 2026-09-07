import Link from "next/link";
import { redirect } from "next/navigation";
import { BotaoSair } from "@/components/BotaoSair";
import { calcularIdade, type Perfil } from "@/lib/perfil";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS (supabase/migrations/0001_schema_inicial.sql) já filtra para só os
  // perfis aos quais este usuário tem acesso — não é preciso pedir isso aqui.
  const { data: perfis } = await supabase
    .from("perfil")
    .select("*")
    .order("criado_em")
    .returns<Perfil[]>();

  const temPerfis = (perfis?.length ?? 0) > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold sm:text-4xl">Glicemia</h1>
          <p className="text-sm text-texto-suave">{user.email}</p>
        </div>
        <BotaoSair />
      </header>

      {temPerfis ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Quem vamos acompanhar?</h2>
          <ul className="flex flex-col gap-3">
            {perfis!.map((perfil) => (
              <li key={perfil.id}>
                <Link
                  href={`/perfil/${perfil.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-borda px-4 py-4 transition hover:bg-superficie"
                >
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold">{perfil.nome}</span>
                    <span className="text-sm text-texto-suave">
                      {calcularIdade(perfil.data_nascimento)} anos
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-texto-suave">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/perfis/novo"
            className="toque flex items-center justify-center gap-2 rounded-xl border border-dashed border-borda text-sm font-medium text-texto-suave transition hover:bg-superficie hover:text-texto"
          >
            + Adicionar perfil
          </Link>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-4 rounded-xl border border-borda bg-superficie px-6 py-10 text-center">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-semibold">Nenhum perfil ainda</h2>
            <p className="text-sm text-texto-suave">
              Crie o primeiro perfil para começar a registrar.
            </p>
          </div>
          <Link
            href="/perfis/novo"
            className="toque inline-flex items-center rounded-lg bg-texto px-4 font-medium text-fundo"
          >
            Criar meu perfil
          </Link>
        </section>
      )}

      <footer className="rounded-xl border border-borda bg-superficie px-4 py-4 text-sm text-texto-suave">
        <strong className="font-semibold text-texto">Aviso médico.</strong> Este aplicativo é uma
        ferramenta de registro e visualização. Não substitui avaliação médica, não emite
        diagnóstico e não recomenda doses de medicamento. Toda decisão de tratamento é da equipe
        de saúde.
      </footer>
    </main>
  );
}
