-- =============================================================================
-- Glicemia — compartilhar perfil com a observadora (fase 2, F8)
-- =============================================================================
-- Até aqui, conceder acesso de OBSERVADOR a alguém (a esposa) só era possível
-- manualmente pelo SQL Editor (ver comentário em perfil_acesso, 0001). Esta
-- migração cria uma função que o próprio app pode chamar, mantendo a mesma
-- garantia de segurança: só quem já é PACIENTE do perfil pode compartilhar,
-- e só para gente que já entrou no app pelo menos uma vez (evita expor busca
-- de e-mail arbitrária a quem não tem conta aqui).
--
-- SECURITY DEFINER pelo mesmo motivo de tem_acesso_perfil/inicializar_perfil_novo
-- (0001): o cliente não tem — e não deve ter — permissão de inserir
-- diretamente em perfil_acesso ou de ler auth.users.
--
-- Aplicar: painel do Supabase → SQL Editor → colar → Run.
-- =============================================================================

create function convidar_observador(p_perfil_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
begin
  if not tem_acesso_perfil(p_perfil_id, array['PACIENTE']::papel_acesso[]) then
    raise exception 'Você não tem permissão para compartilhar este perfil.';
  end if;

  select id into v_usuario_id
  from auth.users
  where email = lower(trim(p_email))
  limit 1;

  if v_usuario_id is null then
    raise exception 'Não existe conta com este e-mail. A pessoa precisa entrar no app pelo menos uma vez antes de ser convidada.';
  end if;

  if v_usuario_id = auth.uid() then
    raise exception 'Você já tem acesso a este perfil.';
  end if;

  insert into perfil_acesso (perfil_id, usuario_id, papel)
  values (p_perfil_id, v_usuario_id, 'OBSERVADOR')
  on conflict (perfil_id, usuario_id) do update set papel = 'OBSERVADOR';
end;
$$;

comment on function convidar_observador(uuid, text) is 'Compartilha um perfil como OBSERVADOR (somente leitura) com quem já tem conta no app (PROJECT.md F8).';

grant execute on function convidar_observador(uuid, text) to authenticated;
