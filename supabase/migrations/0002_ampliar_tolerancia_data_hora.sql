-- =============================================================================
-- Glicemia — ampliar tolerância de relógio nas datas de registro
-- =============================================================================
-- O buffer de 1 minuto contra "data no futuro" (0001) mostrou-se apertado
-- demais na prática: o relógio do navegador e o do servidor nunca estão
-- perfeitamente sincronizados, e a própria viagem da requisição consome
-- tempo. Ampliando para 5 minutos — ainda bloqueia erro grosseiro (digitar
-- uma data do ano que vem), sem recusar um registro legítimo por causa de
-- uma pequena diferença de relógio entre os dois lados.
--
-- Aplicar: painel do Supabase → SQL Editor → colar → Run.
-- =============================================================================

alter table medicao_glicemia
  drop constraint medicao_glicemia_data_hora_check,
  add constraint medicao_glicemia_data_hora_check
    check (data_hora <= now() + interval '5 minutes');

alter table registro_insulina
  drop constraint registro_insulina_data_hora_check,
  add constraint registro_insulina_data_hora_check
    check (data_hora <= now() + interval '5 minutes');
