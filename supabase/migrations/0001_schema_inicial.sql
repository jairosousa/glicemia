-- =============================================================================
-- Glicemia — schema inicial (fase 1)
-- =============================================================================
-- Cobre: perfis de paciente, metas glicêmicas, controle de acesso, glicemia
-- e insulina. Ver PROJECT.md §7 para o modelo conceitual completo.
--
-- Este arquivo é a fonte de verdade do schema. Se o banco for recriado do
-- zero, rodar este script inteiro reproduz a mesma estrutura.
--
-- Aplicar: painel do Supabase → SQL Editor → colar → Run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
-- Espelham exatamente os tipos TypeScript de lib/glicemia.ts. Se um valor
-- for adicionado lá (ex.: um novo contexto de medição), precisa ser
-- adicionado aqui também com ALTER TYPE ... ADD VALUE.

create type papel_acesso as enum ('PACIENTE', 'OBSERVADOR');

create type tipo_insulina as enum ('BASAL', 'BOLUS');

create type contexto_medicao as enum (
  'JEJUM',
  'ANTES_REFEICAO',
  'POS_REFEICAO_2H',
  'ANTES_DORMIR',
  'MADRUGADA',
  'ANTES_EXERCICIO',
  'DEPOIS_EXERCICIO',
  'SINTOMA_HIPO',
  'ALEATORIO'
);

-- -----------------------------------------------------------------------------
-- perfil — o paciente (Jairo, filho...)
-- -----------------------------------------------------------------------------
-- Não existe tabela "usuario": quem faz login é gerenciado pelo Supabase Auth
-- em auth.users. "criado_por" aponta para lá.

create table perfil (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null check (char_length(trim(nome)) > 0),
  data_nascimento date not null check (data_nascimento <= current_date),
  criado_por      uuid not null references auth.users (id) on delete cascade,
  criado_em       timestamptz not null default now()
);

comment on table perfil is 'Um paciente acompanhado no app. Cada perfil tem histórico e metas próprios — nunca somados no mesmo cálculo (PROJECT.md §4.1).';

-- -----------------------------------------------------------------------------
-- perfil_meta — metas glicêmicas do perfil
-- -----------------------------------------------------------------------------
-- Um-para-um com perfil. Separada em tabela própria (em vez de colunas em
-- "perfil") porque metas mudam com orientação médica e essa fronteira ajuda a
-- manter a regra de permissão de escrita isolada do resto do perfil.
--
-- Os valores padrão replicam METAS_PADRAO em lib/glicemia.ts. Se um mudar,
-- o outro precisa mudar junto.

create table perfil_meta (
  perfil_id           uuid primary key references perfil (id) on delete cascade,
  alvo_min            integer not null default 70,
  alvo_max            integer not null default 180,
  limite_hipo_grave   integer not null default 54,
  limite_hiper_severa integer not null default 250,
  constraint metas_em_ordem check (
    limite_hipo_grave < alvo_min
    and alvo_min < alvo_max
    and alvo_max < limite_hiper_severa
  )
);

comment on table perfil_meta is 'Metas glicêmicas por perfil. Editáveis porque alvo é individualizado (PROJECT.md §5.2) — nunca usar valor fixo no código para classificar um perfil específico.';

-- -----------------------------------------------------------------------------
-- perfil_acesso — quem pode ver/editar cada perfil
-- -----------------------------------------------------------------------------
-- É esta tabela, e as políticas de permissão que a consultam, que impedem a
-- observadora (esposa) de editar dado clínico — mesmo que um bug na
-- interface tentasse permitir (PROJECT.md §4.2, F8).

create table perfil_acesso (
  perfil_id  uuid not null references perfil (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  papel      papel_acesso not null,
  criado_em  timestamptz not null default now(),
  primary key (perfil_id, usuario_id)
);

comment on table perfil_acesso is 'Controle de acesso por perfil. PACIENTE lê e escreve; OBSERVADOR só lê. Esta tabela é a autoridade — não a interface.';

-- -----------------------------------------------------------------------------
-- medicao_glicemia
-- -----------------------------------------------------------------------------
-- "id" não tem valor padrão de propósito: é gerado no navegador (UUID),
-- não no banco. Isso é o que permite registrar offline em aparelhos
-- diferentes sem conflito — os registros simplesmente se unem ao sincronizar
-- (PROJECT.md §7, "Identidade e sincronização").

create table medicao_glicemia (
  id             uuid primary key,
  perfil_id      uuid not null references perfil (id) on delete cascade,
  valor          integer not null check (valor between 20 and 600), -- GLICEMIA_MIN/MAX em lib/glicemia.ts
  data_hora      timestamptz not null check (data_hora <= now() + interval '5 minutes'), -- ver migração 0002: buffer de 1 min era apertado demais
  contexto       contexto_medicao not null,
  observacao     text,
  registrado_por uuid not null references auth.users (id),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

comment on table medicao_glicemia is 'Uma leitura de glicemia. O intervalo 20–600 em "valor" não é meta clínica: é para bloquear erro de digitação (ex.: 1200 em vez de 120).';

-- -----------------------------------------------------------------------------
-- registro_insulina
-- -----------------------------------------------------------------------------

create table registro_insulina (
  id             uuid primary key,
  perfil_id      uuid not null references perfil (id) on delete cascade,
  tipo           tipo_insulina not null,
  unidades       numeric(5, 1) not null check (unidades between 0.5 and 100), -- INSULINA_MIN/MAX em lib/glicemia.ts
  data_hora      timestamptz not null check (data_hora <= now() + interval '5 minutes'), -- ver migração 0002: buffer de 1 min era apertado demais
  observacao     text,
  registrado_por uuid not null references auth.users (id),
  criado_em      timestamptz not null default now()
);

comment on table registro_insulina is 'Uma dose de insulina aplicada. Sem cálculo de dose — o app só registra o que já foi decidido e aplicado (PROJECT.md §5.3, §6.3).';

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------
-- Toda consulta do app filtra por perfil e ordena por data — histórico (F6)
-- e painel (F7) dependem disso para responder rápido mesmo com anos de dado.

create index medicao_glicemia_perfil_data_idx on medicao_glicemia (perfil_id, data_hora desc);
create index registro_insulina_perfil_data_idx on registro_insulina (perfil_id, data_hora desc);
create index perfil_acesso_usuario_idx on perfil_acesso (usuario_id);

-- -----------------------------------------------------------------------------
-- "atualizado_em" sempre correto
-- -----------------------------------------------------------------------------
-- Sustenta a regra de sincronização "last-write-wins": o timestamp de
-- atualização vem sempre do relógio do servidor, nunca do cliente — impede
-- que o relógio errado de um aparelho reescreva o histórico.

create function marcar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger medicao_glicemia_atualizado_em
  before update on medicao_glicemia
  for each row
  execute function marcar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Perfil novo já nasce com metas padrão e acesso do criador
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: a política de perfil_acesso (abaixo) não permite que o
-- cliente insira sua própria linha de acesso — só este gatilho pode, rodando
-- com privilégio elevado. Isso fecha a única porta por onde alguém poderia
-- se autoconceder acesso a um perfil que não é seu.

create function inicializar_perfil_novo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfil_acesso (perfil_id, usuario_id, papel)
  values (new.id, new.criado_por, 'PACIENTE');

  insert into perfil_meta (perfil_id)
  values (new.id);

  return new;
end;
$$;

create trigger perfil_inicializar
  after insert on perfil
  for each row
  execute function inicializar_perfil_novo();

-- -----------------------------------------------------------------------------
-- Função auxiliar de permissão
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER de propósito: as políticas de RLS abaixo chamam esta
-- função para checar perfil_acesso. Sem SECURITY DEFINER, a checagem
-- disparceria a própria RLS de perfil_acesso e causaria recursão. É o
-- padrão recomendado pelo Supabase para este tipo de checagem.

create function tem_acesso_perfil(p_perfil_id uuid, p_papeis papel_acesso[] default array['PACIENTE', 'OBSERVADOR']::papel_acesso[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from perfil_acesso
    where perfil_id = p_perfil_id
      and usuario_id = auth.uid()
      and papel = any (p_papeis)
  );
$$;

-- -----------------------------------------------------------------------------
-- Regras de permissão (Row Level Security)
-- -----------------------------------------------------------------------------
-- Regra geral: nenhuma tabela é acessível sem uma política explícita. Onde
-- uma operação não tem política (ex.: excluir um perfil inteiro, ou o
-- cliente inserir em perfil_acesso), ela fica bloqueada por padrão — não
-- por esquecimento, e sim porque a funcionalidade ainda não existe (ver
-- PROJECT.md §6.2, fases).

alter table perfil enable row level security;
alter table perfil_meta enable row level security;
alter table perfil_acesso enable row level security;
alter table medicao_glicemia enable row level security;
alter table registro_insulina enable row level security;

-- perfil: lê quem tem qualquer acesso; cria quem se declara o criador;
-- só PACIENTE edita (ex.: corrigir o nome). Excluir perfil não é permitido
-- por enquanto — não é uma funcionalidade do MVP.
create policy perfil_select on perfil
  for select using (tem_acesso_perfil(id));

create policy perfil_insert on perfil
  for insert with check (criado_por = auth.uid());

create policy perfil_update on perfil
  for update using (tem_acesso_perfil(id, array['PACIENTE']::papel_acesso[]));

-- perfil_meta: mesma regra — todos com acesso leem, só PACIENTE edita metas.
create policy perfil_meta_select on perfil_meta
  for select using (tem_acesso_perfil(perfil_id));

create policy perfil_meta_update on perfil_meta
  for update using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

-- perfil_acesso: cada usuário só enxerga suas próprias linhas de acesso —
-- suficiente para o app saber "quais perfis eu posso abrir". Conceder acesso
-- a outra pessoa (compartilhar com a esposa) é fase 2 e, até lá, feito
-- manualmente pelo SQL Editor.
create policy perfil_acesso_select on perfil_acesso
  for select using (usuario_id = auth.uid());

-- medicao_glicemia: todos com acesso ao perfil leem (paciente e, no futuro,
-- observadora); só PACIENTE escreve, edita e apaga.
create policy medicao_glicemia_select on medicao_glicemia
  for select using (tem_acesso_perfil(perfil_id));

create policy medicao_glicemia_insert on medicao_glicemia
  for insert with check (
    tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[])
    and registrado_por = auth.uid()
  );

create policy medicao_glicemia_update on medicao_glicemia
  for update using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

create policy medicao_glicemia_delete on medicao_glicemia
  for delete using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

-- registro_insulina: mesma regra de medicao_glicemia.
create policy registro_insulina_select on registro_insulina
  for select using (tem_acesso_perfil(perfil_id));

create policy registro_insulina_insert on registro_insulina
  for insert with check (
    tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[])
    and registrado_por = auth.uid()
  );

create policy registro_insulina_update on registro_insulina
  for update using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));

create policy registro_insulina_delete on registro_insulina
  for delete using (tem_acesso_perfil(perfil_id, array['PACIENTE']::papel_acesso[]));
