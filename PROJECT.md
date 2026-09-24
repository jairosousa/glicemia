# Glicemia — PRD (Product Requirements Document)

> Documento de requisitos do produto. Define **o que** o app é, **para quem**, **por quê** e **como saber se ficou certo**.
> Documento vivo: muda conforme o app é construído e testado.

- **Autor:** Jairo Nascimento
- **Data:** 2026-09-24 *(revisão — fases 1 e 2 entregues)*
- **Versão:** 3.0 *(v2.0 assumia o app ainda em desenvolvimento; fases 1 e 2 concluídas e em produção na Vercel)*
- **Status:** fases 1 e 2 em produção — fase 3 aguardando uso real (§6.2)

---

## 1. Visão em uma frase

Um aplicativo web instalável para **Jairo e seu filho** registrarem glicemia, insulina, refeições e humor no dia a dia, com **acesso de leitura para a esposa** acompanhar à distância e gerar o relatório impresso da consulta médica — funcionando bem no celular e no computador.

## 2. O problema

Jairo tem 53 anos, tem diabetes e mede glicemia com aparelho de fitas. Seu filho também acompanha glicemia. Hoje esse controle vive em caderno e memória. Três problemas concretos:

1. **Perda de contexto.** O valor isolado não explica nada. `180 mg/dL` em jejum é um problema; `180` duas horas após o almoço está na meta. Sem a marcação do momento, o histórico é quase inútil.
2. **Padrões invisíveis.** "Sempre subo depois do jantar" ou "caio de madrugada" só aparecem quando se sobrepõem vários dias. Caderno não mostra isso.
3. **A esposa fica no escuro.** Quando ela não está por perto, não tem como saber se está tudo bem. Hoje depende de perguntar.

E há o motivo econômico: os apps existentes cobram assinatura. Este é feito sob medida e sem custo recorrente.

## 3. Objetivo e não-objetivo

**Objetivo:** uso pessoal e familiar real, sem custo de assinatura. O critério de sucesso é **registrar de verdade, todos os dias, por meses**. Confiabilidade e baixo atrito valem mais que qualquer sofisticação.

**Não-objetivo:** não é produto comercial, não é dispositivo médico, não decide dose de insulina.

### Aviso médico (obrigatório no produto)

> Este aplicativo é uma ferramenta de **registro e visualização**. Não substitui avaliação médica, não emite diagnóstico e não recomenda doses de medicamento. Toda decisão de tratamento é da equipe de saúde.

Aparece no primeiro acesso e em rodapé permanente nas telas de análise e no relatório impresso. Não é formalidade: é o que mantém o projeto fora da classificação de software médico regulado (ANVISA RDC 657/2022).

## 4. Quem vai usar

Três pessoas, **dois papéis distintos**.

### 4.1 Pacientes (papel: registrar e ver)

| | Jairo | Filho |
|---|---|---|
| Idade | 53 anos | *a confirmar* |
| Medição | glicosímetro de fitas | glicosímetro de fitas |
| Quem opera o app | ele mesmo | *a confirmar* |
| Metas glicêmicas | padrão adulto | **podem diferir** — ver §5.2 |

Cada paciente tem **perfil separado**: histórico próprio, gráficos próprios, metas próprias. Não se misturam em nenhum cálculo — média e % na faixa de duas pessoas somadas não significam nada clinicamente.

### 4.2 Observadora (papel: apenas ver)

**Esposa.** Acessa histórico, gráficos e gera o relatório para impressão dos dois perfis. **Não cria e não edita nenhum registro.**

Decisão deliberada: ela nunca alterar dado clínico por engano é mais valioso que a conveniência de ela poder lançar. Se na prática surgir a necessidade (Jairo indisposto e ela precisa registrar por ele), promovemos o papel depois.

### 4.3 O que o perfil do usuário implica no design

| Característica | Consequência |
|---|---|
| 53 anos, sem experiência técnica | Interface direta, sem jargão, sem configuração obrigatória |
| Mede 4–8x/dia | Registrar precisa custar **menos de 10 segundos** |
| Diabetes tipo 1 usa insulina diariamente | Registro de insulina é essencial, não opcional |
| Conta carboidratos (aprende na consulta) | Digita gramas direto; não precisa de base de alimentos |
| Risco real de hipoglicemia grave | Hipo tem que ser visualmente inconfundível |
| Diabetes pode causar retinopatia | **Nunca** comunicar status só por cor |

## 5. Domínio — o conhecimento necessário

Esta seção existe porque o autor não é especialista em diabetes. É a base clínica que sustenta as regras do sistema.

### 5.1 Como se mede

| Método | Frequência | Papel neste projeto |
|---|---|---|
| **Glicosímetro** (fita, ponta de dedo) | 4–8x/dia, pontual | **Fonte única** — entrada manual |
| **CGM** (sensor contínuo: Libre, Dexcom) | a cada 1–5 min | Fora de escopo — não é usado por eles |
| **HbA1c** (hemoglobina glicada) | exame de laboratório, a cada 3 meses | Registro manual do resultado (fase 3) |

Unidade adotada: **mg/dL** (padrão no Brasil). `mmol/L` fora de escopo.

### 5.2 Faixas de referência

Valores padrão do sistema, baseados em diretrizes ADA e SBD para **adulto com diabetes tipo 1** — editáveis **por perfil**.

| Faixa | Valor (mg/dL) | Classificação | Comunicação visual |
|---|---|---|---|
| Hipoglicemia grave | `< 54` | Emergência | Vermelho escuro + ícone de alerta + texto |
| Hipoglicemia | `54 – 69` | Abaixo da meta | Vermelho + seta para baixo + texto |
| **Na faixa (alvo)** | `70 – 180` | Meta | Verde + marca de confirmação + texto |
| Hiperglicemia | `181 – 250` | Acima da meta | Amarelo + seta para cima + texto |
| Hiperglicemia severa | `> 250` | Atenção (risco de cetoacidose) | Laranja + ícone de alerta + texto |

Metas por contexto (referência para o relatório): jejum/pré-refeição **80–130**; 2h pós-refeição **< 180**.

**Por que as metas são editáveis por perfil:** alvo glicêmico é individualizado. Criança e adolescente costumam ter alvo noturno mais alto para reduzir risco de hipoglicemia durante o sono. As metas do filho precisam vir do endocrinologista dele, não deste documento (pendência §13.1).

**Regra firme:** a classificação **nunca** é comunicada só por cor. Sempre cor + ícone + texto.

### 5.3 Insulina no tipo 1

Dois tipos, papéis distintos:

- **Basal** — ação lenta, 1–2x/dia em horário fixo. Mantém a glicemia estável no jejum. Ex.: Lantus, Tresiba, Levemir.
- **Bolus** — ação rápida, a cada refeição (pelo carboidrato) ou para corrigir hiperglicemia. Ex.: Novorapid, Humalog, Fiasp.

O sistema registra **tipo + unidades + data/hora**. **Não calcula dose.** Bomba de insulina fora de escopo (nenhum dos dois usa).

### 5.4 O que altera a glicemia

Justifica cada campo do diário: **carboidratos** (subida em 30–120 min), **insulina** (queda), **exercício** (geralmente queda, podendo durar horas), **estresse e doença** (subida), **álcool** (queda tardia, risco noturno).

O registro de **humor** entra por aqui: estresse e mal-estar alteram glicemia de verdade, e o próprio sintoma de hipo/hiper se manifesta como sensação antes de o aparelho confirmar.

### 5.5 Time in Range (TIR) — e sua limitação aqui

TIR é o **% do tempo com glicemia entre 70 e 180 mg/dL**. Meta clínica: **acima de 70%**. É mais informativa que a média, porque distingue quem oscila muito de quem é estável na mesma média.

**Limitação que este projeto declara:** o TIR padrão pressupõe CGM (centenas de leituras/dia). Com 4–8 medições de fita, o que se calcula é **% de medições na faixa**, não % de tempo.

Decisão: exibir com **rótulo honesto** — *"% das medições na faixa"* — sempre acompanhado da contagem que o sustenta (ex.: `78% — 42 de 54 medições em 12 dias`). **Nunca** mostrar o percentual sozinho. Isso importa porque o médico pode ajustar dose olhando esse número.

## 6. O que o app faz

### 6.1 Funcionalidades e comportamento esperado

#### F1 — Perfis de paciente
Ao entrar, o app mostra os perfis disponíveis (Jairo, filho). Todo registro e toda análise pertencem ao perfil ativo. Trocar de perfil é sempre visível e custa um toque. Cada perfil tem nome, data de nascimento e suas próprias metas.

#### F2 — Registro de glicemia
Campo numérico grande, teclado numérico no celular. Data/hora vêm preenchidas com o momento atual (editáveis). Contexto (jejum, pós-refeição...) vem **inferido pelo horário** e corrigível em um toque. Observação livre opcional. Ao salvar, mostra a classificação imediatamente (cor + ícone + texto).

#### F3 — Registro de insulina
Tipo (basal ou bolus), unidades (aceita meia unidade), data/hora. Observação opcional.

#### F4 — Registro de refeição
Gramas de carboidrato + descrição em texto livre ("arroz, feijão e frango"). Tipo de refeição (café, almoço, jantar, lanche) inferido pelo horário.

#### F5 — Registro de humor
Escala de 5 níveis com ícone: muito mal · mal · neutro · bem · muito bem. Mais observação livre opcional. Um toque para registrar. Independente da glicemia — dá para registrar "me sinto mal" sem medir.

#### F6 — Histórico
Lista cronológica unificada de todos os tipos de registro do perfil ativo, com filtro por período e por tipo. Editar e excluir registro (exclusão com confirmação).

#### F7 — Painel de análise
Do perfil ativo, no período escolhido (7 / 14 / 30 / 90 dias):
- % de medições na faixa, abaixo e acima — com a contagem visível (§5.5)
- Média e desvio padrão
- Contagem de hipoglicemias e hiperglicemias
- Gráfico de linha no tempo com as faixas alvo ao fundo

#### F8 — Acesso da observadora
A esposa entra com a conta dela e vê os perfis compartilhados com ela: histórico, painel e relatório. Nenhum botão de criar, editar ou excluir aparece para ela. A permissão é imposta **no banco**, não só na interface.

#### F9 — Relatório para impressão
Gera arquivo com as leituras do período escolhido, formatado para papel A4: identificação do paciente, período, tabela de medições com contexto, resumo estatístico, insulina aplicada e o aviso médico. É o que vai para a consulta.

#### F10 — Instalável e tolerante a falha de conexão
Instala na tela de início do celular e no desktop. Registrar sem internet funciona: o registro fica numa fila local e sobe sozinho ao reconectar, com indicador visível de pendência.

### 6.2 Faseamento

Recorte: **MVP enxuto**. Registrar e enxergar glicemia primeiro.

---

**Fase 1 — O básico funcionando** *(concluída — em produção)* · substituir o caderno

F1 perfis · F2 glicemia · F3 insulina · F6 histórico · F7 painel · configuração de metas · login com Google

*Pronto quando:* Jairo registra 7 dias seguidos sem recorrer a papel. *(critério de uso — a confirmar com o tempo)*

---

**Fase 2 — A família dentro** *(concluída — em produção)* · atender a esposa e o contexto

F4 refeições · F5 humor · F8 acesso da observadora · F9 relatório para impressão · F10 instalável e fila offline

*Pronto quando:* a esposa consulta o app sozinha, sem pedir ajuda, e imprime o relatório da consulta. *(critério de uso — a confirmar com o tempo)*

---

**Fase 3 — Refinamento** *(não iniciada — Jairo decidiu esperar meses de uso real antes de começar, 2026-09-24)* · só depois de meses de uso real

Atividade física · lembretes push de medir e aplicar · registro de peso e pressão · resultados de HbA1c · HbA1c estimada (GMI, com aviso de que não substitui exame) · importação de CSV

### 6.3 O que fica de fora

| Item | Motivo |
|---|---|
| **Calculadora de bolus** | Software médico regulado. Erro causa dano grave. Não entra em nenhuma fase. |
| Recomendação de conduta clínica | Mesmo motivo. O app mostra dados; a decisão é médica. |
| Integração com API de CGM | Nenhum dos dois usa sensor contínuo. |
| Base de alimentos com busca | Subprojeto próprio (TACO/TBCA). Tipo 1 já conta carboidrato. |
| Estimativa de carboidrato por foto | Margem de erro alta. Erro de carboidrato vira erro de insulina. |
| Suporte a bomba de insulina | Nenhum dos dois usa. |
| Painel para médico / nutricionista | Vira produto B2B2C. Fora do objetivo. |
| Esposa poder registrar | Decisão de §4.2 — reavaliar se a necessidade aparecer. |
| `mmol/L` e outros idiomas | Uso pessoal no Brasil. |
| Qualquer serviço pago | Restrição firme: só camada gratuita, sem cartão de crédito. |

## 7. Modelo de dados

### Entidades

**usuario** *(vem da autenticação)* — `id`, `email`, `nome`

**perfil** *(o paciente)* — `id`, `nome`, `data_nascimento`, `criado_por` (usuário dono), `criado_em`

**perfil_meta** — `perfil_id`, `alvo_min` (70), `alvo_max` (180), `limite_hipo_grave` (54), `limite_hiper_severa` (250)

**perfil_acesso** *(quem vê o quê)* — `perfil_id`, `usuario_id`, `papel` (`PACIENTE` | `OBSERVADOR`)

**medicao_glicemia** — `id` (UUID do cliente), `perfil_id`, `valor` (inteiro, mg/dL), `data_hora`, `contexto`, `observacao`, `registrado_por`, `criado_em`, `atualizado_em`

**registro_insulina** — `id`, `perfil_id`, `tipo` (`BASAL` | `BOLUS`), `unidades` (decimal), `data_hora`, `observacao`

**refeicao** *(fase 2)* — `id`, `perfil_id`, `data_hora`, `tipo`, `carboidratos_gramas`, `descricao`

**registro_humor** *(fase 2)* — `id`, `perfil_id`, `data_hora`, `nivel`, `observacao`

**atividade_fisica** *(fase 3)* — `id`, `perfil_id`, `data_hora`, `tipo`, `duracao_minutos`, `intensidade`

**medida_corporal** *(fase 3)* — `id`, `perfil_id`, `data_hora`, `peso_kg`, `pressao_sistolica`, `pressao_diastolica`

### Enumerações

**contexto da medição** — `JEJUM` · `ANTES_REFEICAO` · `POS_REFEICAO_2H` · `ANTES_DORMIR` · `MADRUGADA` · `ANTES_EXERCICIO` · `DEPOIS_EXERCICIO` · `SINTOMA_HIPO` · `ALEATORIO`

**nível de humor** — `MUITO_MAL` · `MAL` · `NEUTRO` · `BEM` · `MUITO_BEM`

**tipo de refeição** — `CAFE` · `ALMOCO` · `JANTAR` · `LANCHE`

### Regras de negócio

**Inferência de contexto** — o contexto dá sentido ao número (§2.1), então é obrigatório. Mas travar o registro nele quebraria a meta de 10 segundos. Solução: inferir pelo horário e deixar corrigível em um toque.

| Horário | Contexto sugerido |
|---|---|
| 05:00 – 09:00 | `JEJUM` |
| 22:00 – 05:00 | `MADRUGADA` |
| demais | `ALEATORIO` |

**Validação** *(protege contra erro de digitação — `1200` em vez de `120`)*

| Campo | Regra |
|---|---|
| glicemia | inteiro, 20 a 600 mg/dL — bloquear fora disso com mensagem |
| insulina | decimal, 0,5 a 100 unidades |
| carboidrato | inteiro, 0 a 500 gramas |
| `data_hora` | não aceitar data futura |

**Identidade e sincronização** — todo registro tem **UUID gerado no cliente**, não no banco. Isso elimina conflito: registros criados offline em aparelhos diferentes simplesmente se unem. Edições usam `atualizado_em` com regra *last-write-wins*.

**Permissão** — imposta no banco por *Row Level Security*, não na interface:
- `PACIENTE` — leitura e escrita nos registros do seu perfil
- `OBSERVADOR` — **somente leitura** nos perfis compartilhados com ele
- ninguém acessa perfil ao qual não tem vínculo em `perfil_acesso`

## 8. Decisões técnicas

Todas justificadas, porque o autor não programa e precisa entender o que tem em mãos.

### 8.1 Restrição que governa tudo: custo zero

Requisito firme: **apenas camada gratuita, sem cadastrar cartão de crédito.**

Volume real estimado: ~20 registros/dia por perfil × 2 perfis = **40 escritas/dia**; histórico de um ano ≈ **4 MB**. Isso é uma fração desprezível de qualquer plano gratuito. O risco não é estourar cota — é depender de serviço que **exija cartão** para alguma função.

### 8.2 Backend — Supabase

**Decidido.** Sem servidor próprio: autenticação, banco e regras de permissão vêm de serviço gerenciado.

**Por quê Supabase e não Firebase** *(esta recomendação mudou da v1.0 deste documento, quando o acesso da esposa ainda não estava no escopo)*:

| Critério | Supabase | Firebase |
|---|---|---|
| **Exige cartão de crédito** | **nunca** | **sim, para lembretes push** (Cloud Functions só no plano Blaze) |
| **Permissão de leitura para a esposa** | *Row Level Security* — regra em SQL na própria tabela | regras em linguagem própria, mais frágil |
| **Relatório cruzando 4 tipos de registro** | uma consulta SQL com `JOIN` | código manual no cliente |
| Banco gratuito | 500 MB (~100 anos de uso) | 1 GiB |
| Sincronização offline | precisa ser construída | nativa no Firestore |

Os dois primeiros critérios decidiram. O acesso somente-leitura da esposa (F8) é exatamente o problema que RLS resolve, e a exigência de cartão do Firebase colide com a restrição de §8.1.

**O que se perde:** o Firestore sincroniza offline de fábrica; aqui isso será construído como fila local (F10) — menos robusto, suficiente para o uso deles.

**Ponto a vigiar:** projeto gratuito do Supabase **pausa após 7 dias sem acesso**. Com uso diário, não acontece. Se acontecer, basta reativar pelo painel — não há perda de dados.

### 8.3 Front-end — Next.js + React + TypeScript

**Decidido.**

- **React** — biblioteca de interface mais usada e documentada. Para quem não programa, isso importa mais que elegância: qualquer dúvida futura já foi respondida por alguém.
- **Next.js** — organiza o React, gera as páginas e publica na Vercel gratuitamente com um comando. Também dá o lado servidor necessário para o relatório impresso (F9) sem manter servidor próprio.
- **TypeScript** — obriga a declarar o tipo de cada dado. Impede a classe de erro mais perigosa aqui: tratar `"180"` (texto) como `180` (número) e classificar glicemia errado.

**Alternativa considerada e descartada:** Vite puro seria mais simples e teria PWA offline melhor. Escolhi Next.js porque publicação, autenticação e geração do relatório são bem mais diretas — e são justamente as partes onde você ficaria travado sozinho. Aceito que o offline dá mais trabalho.

### 8.4 Interface — Tailwind CSS + Recharts

- **Tailwind CSS** — estilo aplicado direto no elemento, com adaptação a tamanho de tela embutida. Como o app tem que funcionar de celular a monitor, isso resolve o requisito central com menos código.
- **Recharts** — gráficos em React. Escolhido porque desenha nativamente as **faixas coloridas de fundo** (`ReferenceArea`) que o gráfico de glicemia exige, e se adapta sozinho à largura da tela.

### 8.5 Autenticação — Google

**Decidido.** Apenas login social com Google. Sem senha para gerenciar, sem recuperação de senha, entrada em um toque — o que importa para três pessoas de perfis técnicos diferentes.

**Risco anotado:** dependência de conta Google. Todos os três já têm.

### 8.6 Plataforma — PWA responsivo

**Decidido.** Uma base de código para web e celular, instalável na tela de início.

| Faixa | Largura | Layout |
|---|---|---|
| Celular | < 640px | Coluna única, navegação inferior, botão flutuante de registro rápido |
| Tablet | 640 – 1024px | Duas colunas, navegação lateral recolhível |
| Desktop | > 1024px | Painel com gráfico e resumo lado a lado, navegação lateral fixa |

Abordagem *mobile-first*: o registro acontece no celular; o desktop serve para revisar e imprimir.

**Restrição do iOS a tratar na fase 3:** notificação push em PWA funciona no iOS a partir da versão 16.4 e **somente se o app estiver instalado na tela de início**. No navegador, não chega nada. Quando os lembretes entrarem, será obrigatório ter uma tela que detecte iOS sem instalação e ensine "Compartilhar → Adicionar à Tela de Início". Sem isso, o recurso falha em silêncio — o pior tipo de falha.

### 8.7 Publicação — Vercel

**Decidido.** Plano gratuito, sem cartão, integrado ao GitHub: cada envio de código publica a nova versão automaticamente.

### 8.8 Resumo da stack

| Camada | Escolha | Custo |
|---|---|---|
| Interface | React + Next.js + TypeScript | grátis |
| Estilo | Tailwind CSS | grátis |
| Gráficos | Recharts | grátis |
| Banco e autenticação | Supabase | grátis, sem cartão |
| Hospedagem | Vercel | grátis, sem cartão |
| Código-fonte | GitHub | grátis |

## 9. Requisitos não funcionais

### Desempenho
- **Registrar uma glicemia em menos de 10 segundos**, do toque no ícone à confirmação. *É o requisito mais importante deste documento* — se registrar dói, o registro para e todo o resto foi desperdício.
- Abrir o app com dados em cache: **< 2 s**.
- Painel e gráfico de 90 dias: **< 1 s**.

### Tolerância a falha de conexão
- Registrar e consultar o histórico recente devem funcionar **sem internet**.
- Envio automático ao reconectar, sem ação do usuário.
- Indicador visível: sincronizado / pendente.

### Acessibilidade — WCAG 2.1 nível AA
- Contraste mínimo **4,5:1** para texto.
- Classificação de faixa **nunca** só por cor — sempre cor + ícone + texto (§5.2).
- Alvos de toque de no mínimo **44 × 44 px**.
- Navegação completa por teclado no desktop.
- Todo campo com `label` associado; erros anunciados por leitor de tela.
- Respeitar o tamanho de fonte definido no sistema operacional.

### Privacidade e dados

Dado de saúde é **dado pessoal sensível** na LGPD (art. 5º, II). Mesmo em uso familiar, o app nasce com o mínimo correto:

- HTTPS sempre; dados criptografados em repouso pelo provedor.
- Isolamento por perfil imposto no banco (RLS) — ninguém alcança dado sem vínculo.
- **Exportar todos os dados** em formato aberto (CSV/JSON) a qualquer momento.
- **Excluir conta e todos os dados** de forma completa.
- Sem rastreamento de terceiros, sem anúncios.

### Confiabilidade
- Nenhum registro pode ser perdido: grava local primeiro, envia depois.
- Exclusão sempre com confirmação explícita.
- A exportação serve também como cópia de segurança.

## 10. Como saber se ficou certo

Critérios de verificação por funcionalidade. É o que permite a você e ao Claude Code julgarem se está pronto.

| # | Funcionalidade | Verificação |
|---|---|---|
| F1 | Perfis | Criar dois perfis; registrar em um; confirmar que o outro não mostra o registro nem o inclui na média |
| F2 | Glicemia | Registrar `95` em jejum → aparece verde com texto "na faixa". Registrar `65` → vermelho com "hipoglicemia". Tentar `1200` → bloqueia com mensagem |
| F2 | Contexto inferido | Registrar às 07:00 → vem `JEJUM`. Às 23:00 → vem `MADRUGADA` |
| F3 | Insulina | Registrar 12 U de basal e 4,5 U de bolus → ambos no histórico com tipo correto |
| F4 | Refeição | Registrar 60 g com descrição → aparece no histórico junto da glicemia do mesmo horário |
| F5 | Humor | Registrar "mal" sem medir glicemia → salva normalmente |
| F6 | Histórico | Filtrar 7 dias → só registros do período. Excluir um → pede confirmação |
| F7 | Painel | Com 10 medições sendo 7 na faixa → exibe `70% — 7 de 10 medições`. Nunca o percentual sozinho |
| F7 | Gráfico | Abrir em celular e desktop → legível nos dois, faixas alvo visíveis ao fundo |
| F8 | Esposa | Entrar com a conta dela → vê histórico e painel, **nenhum botão de editar**. Tentar alterar por fora → o banco recusa |
| F9 | Relatório | Gerar e imprimir → cabe em A4, legível, com paciente, período, medições, resumo e aviso médico |
| F10 | Offline | Ativar modo avião, registrar, reativar → o registro sobe sozinho e o indicador limpa |
| — | Responsivo | Abrir em celular, tablet e desktop → nenhum corte, nenhuma rolagem horizontal |
| — | Desempenho | Cronometrar do toque à confirmação → menos de 10 s |

## 11. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| **Abandono por atrito de registro** | Fatal — sem dado não há produto | Meta de 10 s; data/hora e contexto pré-preenchidos; registro sempre a um toque |
| TIR interpretado como número clínico | Decisão de dose sobre métrica frágil | Rótulo "% das medições na faixa" + contagem sempre visível (§5.5) |
| App tratado como orientação médica | Risco à saúde | Aviso no primeiro acesso, no rodapé das análises e no relatório |
| Erro de digitação virar dado ruim | Análises distorcidas | Validação 20–600 com bloqueio e mensagem clara |
| Metas do filho erradas | Classificação clínica incorreta para ele | Metas por perfil + validar com o endocrinologista dele (§13.1) |
| Esposa alterar dado por engano | Perda de integridade do histórico | Papel `OBSERVADOR` somente leitura, imposto no banco |
| Projeto Supabase pausar por inatividade | App fora do ar | Uso diário previne; reativação pelo painel sem perda de dados |
| Escopo da fase 2 travar a fase 1 | Nunca sair do começo | Faseamento firme: fase 1 é só glicemia e insulina |
| Aprisionamento no Supabase | Migração custosa | Postgres é padrão aberto; exportação em CSV/JSON |

## 12. Métricas de sucesso

Para uso pessoal, o que importa é a continuidade:

1. **Registros por dia** — alvo: 4 ou mais, sustentado
2. **Dias consecutivos com registro** — alvo: 30+ sem interrupção
3. **Tempo médio de registro** — alvo: abaixo de 10 segundos
4. **Caderno abandonado** — sim/não. É o teste definitivo
5. **Esposa usa sozinha** — sim/não, sem pedir ajuda
6. **Custo mensal** — tem que permanecer **R$ 0,00**

Métricas clínicas (% na faixa, média, hipos) são **resultado do tratamento**, não do software. O app é bom se o registro acontece — não se a glicemia melhora.

## 13. Pendências

| # | Pendência | Responsável |
|---|---|---|
| 1 | **Idade do filho e metas glicêmicas dele**, validadas com o endocrinologista | Jairo |
| 2 | Quem opera o app no perfil do filho — ele mesmo ou Jairo? | Jairo |
| 3 | Validar as metas de Jairo com o médico dele | Jairo |
| 4 | ~~Criar conta no Supabase e obter as chaves de conexão~~ — resolvido, conta criada e `.env.local` configurado | Jairo, com instrução passo a passo |
| 5 | Confirmar que as três pessoas têm conta Google | Jairo |
| 6 | Definir formato do relatório impresso com base no que o médico pede hoje — relatório já implementado conforme §6.1 F9; falta validar o formato na próxima consulta | Jairo |

## 14. Glossário

| Termo | Significado |
|---|---|
| **Glicemia** | Concentração de glicose no sangue. Medida em mg/dL no Brasil. |
| **Diabetes tipo 1** | Doença autoimune: o pâncreas para de produzir insulina. Exige insulina externa. Sem relação com hábitos de vida. |
| **Diabetes tipo 2** | Resistência à insulina, ligada a genética e fatores de vida. Maioria dos casos. |
| **Insulina basal** | Ação lenta, 1–2x/dia. Mantém a glicemia estável no jejum. |
| **Insulina bolus** | Ação rápida, nas refeições ou para corrigir hiperglicemia. |
| **Hipoglicemia** | Glicemia abaixo de 70 mg/dL. Tremor, suor, confusão. Abaixo de 54 é emergência. |
| **Hiperglicemia** | Glicemia acima da meta. Acima de 250 há risco de cetoacidose. |
| **Cetoacidose diabética** | Complicação aguda e grave da hiperglicemia prolongada. Emergência médica. |
| **HbA1c** | Hemoglobina glicada. Exame que reflete a média de ~3 meses. |
| **GMI** | *Glucose Management Indicator* — HbA1c estimada pela média. Estimativa, não exame. |
| **TIR** | *Time in Range* — % do tempo entre 70 e 180 mg/dL. Meta: > 70%. |
| **Contagem de carboidratos** | Método de calcular a dose de bolus pelos gramas de carboidrato da refeição. |
| **Retinopatia diabética** | Lesão nos vasos da retina causada pelo diabetes. Pode afetar a visão de cores — motivo da regra de §5.2. |
| **PWA** | *Progressive Web App* — aplicação web instalável, com funcionamento offline. |
| **RLS** | *Row Level Security* — regra de permissão escrita na própria tabela do banco. Impede acesso indevido mesmo que a interface falhe. |
| **BaaS** | *Backend as a Service* — banco, login e permissões como serviço pronto, sem servidor próprio. |

---

## Resumo das decisões

| Tema | Decisão |
|---|---|
| Usuários | Jairo (53) e filho como pacientes; esposa como observadora |
| Perfis | Separados, com histórico e metas próprias |
| Esposa | Somente leitura — histórico, gráficos e relatório |
| Objetivo | Uso pessoal e familiar, sem assinatura |
| Escopo do produto | Diário completo: glicemia, insulina, refeição, humor, atividade |
| Escopo da fase 1 | Perfis + glicemia + insulina + histórico + painel |
| Entrada de dados | Manual (glicosímetro de fita) |
| Metas glicêmicas | Padrão 70–180 mg/dL, editável por perfil |
| Insulina | Basal e bolus separados, **sem cálculo de dose** |
| Refeições | Gramas de carboidrato + descrição livre |
| Humor | Escala de 5 níveis + observação |
| Plataforma | PWA responsivo instalável, tolerante a falta de conexão |
| Front-end | Next.js + React + TypeScript + Tailwind + Recharts |
| Backend | Supabase (Postgres + Auth + RLS) |
| Autenticação | Google |
| Publicação | Vercel + GitHub |
| Análises na fase 1 | % de medições na faixa, média, desvio, gráfico temporal |
| Unidade / idioma | mg/dL, pt-BR |
| Acessibilidade | WCAG 2.1 AA |
| **Custo** | **R$ 0,00 — sem cartão de crédito em nenhum serviço** |
