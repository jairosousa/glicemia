-- =============================================================================
-- Glicemia — mensagem mais clara ao convidar quem ainda não tem conta
-- =============================================================================
-- A mensagem original repetia a mesma ideia do texto de ajuda que já aparece
-- fixo abaixo do campo de e-mail na tela de compartilhar (PROJECT.md F8),
-- deixando a explicação repetida duas vezes na tela. Encurtando para só
-- constatar o fato — a orientação de "precisa logar antes" já está visível
-- ali do lado.
--
-- `create or replace function` com a mesma assinatura: substitui o corpo da
-- função já criada em 0004, sem precisar recriar policies nem grants.
--
-- Aplicar: painel do Supabase → SQL Editor → colar → Run.
-- =============================================================================

create or replace function convidar_observador(p_perfil_id uuid, p_email text)
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
    raise exception 'Nenhuma conta encontrada com esse e-mail.';
  end if;

  if v_usuario_id = auth.uid() then
    raise exception 'Você já tem acesso a este perfil.';
  end if;

  insert into perfil_acesso (perfil_id, usuario_id, papel)
  values (p_perfil_id, v_usuario_id, 'OBSERVADOR')
  on conflict (perfil_id, usuario_id) do update set papel = 'OBSERVADOR';
end;
$$;
