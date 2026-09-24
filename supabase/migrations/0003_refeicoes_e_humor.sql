-- =============================================================================
-- Glicemia — refeições e humor (fase 2, F4 e F5)
-- =============================================================================
-- Duas tabelas novas, no mesmo molde de registro_insulina (0001): campo
-- "id" sem valor padrão (gerado no cliente), mesma janela de tolerância de
-- relógio de 5 minutos (0002), e as mesmas 4 políticas de RLS.
--
-- Aplicar: painel do Supabase → SQL Editor → colar → Run.
-- =============================================================================

create type tipo_refeicao as enum ('CAFE', 'ALMOCO', 'JANTAR', 'LANCHE');

create type nivel_humor as enum ('MUITO_MAL', 'MAL', 'NEUTRO', 'BEM', 'MUITO_BEM');

-- -----------------------------------------------------------------------------
-- refeicao
-- -----------------------------------------------------------------------------

create table refeicao (
  id                   uuid primary key,
  perfil_id            uuid not null references perfil (id) on delete cascade,
  data_hora            timestamptz not null check (data_hora <= now() + interval '5 minutes'),
  tipo                 tipo_refeicao not null,
  carboidratos_gramas  integer not null check (carboidratos_gramas between 0 and 500), -- CARBOIDRATO_MIN/MAX em lib/refeicao.ts
  descricao            text,
  registrado_por       uuid not null references auth.users (id),
  criado_em            timestamptz not null default now()
);

comment on table refeicao is 'Uma refeição registrada: carboidratos em gramas + descrição livre (PROJECT.md F4).';

-- -----------------------------------------------------------------------------
-- registro_humor
-- -----------------------------------------------------------------------------

create table registro_humor (
  id             uuid primary key,
  perfil_id      uuid not null references perfil (id) on delete cascade,
  data_hora      timestamptz not null check (data_hora <= now() + interval '5 minutes'),
  nivel          nivel_humor not null,
  observacao     text,
  registrado_por uuid not null references auth.users (id),
  criado_em      timestamptz not null default now()
);

comment on table registro_humor is 'Registro de humor, independente de medição de glicemia (PROJECT.md F5).';

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------

create index refeicao_perfil_data_idx on refeicao (perfil_id, data_hora desc);
create index registro_humor_perfil_data_idx on registro_humor (perfil_id, data_hora desc);

-- -----------------------------------------------------------------------------
-- Regras de permissão (Row Level Security)
-- -----------------------------------------------------------------------------
-- Mesma regra de medicao_glicemia/registro_insulina: todos com acesso ao
-- perfil leem; só PACIENTE escreve, edita e apaga.

alter table refeicao enable row level security;
alter table registro_humor enable row level security;

create policy refeicao_select on refeicao
  for select using (tem_acesso_perfil(perfil_id));

create policy refeicao_insert on refeicao
  for insert with check (
    tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[])
    and registrado_por = auth.uid()
  );

create policy refeicao_update on refeicao
  for update using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

create policy refeicao_delete on refeicao
  for delete using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

create policy registro_humor_select on registro_humor
  for select using (tem_acesso_perfil(perfil_id));

create policy registro_humor_insert on registro_humor
  for insert with check (
    tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[])
    and registrado_por = auth.uid()
  );

create policy registro_humor_update on registro_humor
  for update using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

create policy registro_humor_delete on registro_humor
  for delete using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));
