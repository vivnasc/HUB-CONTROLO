# ANIMA

## Descricao

ANIMA e uma plataforma de autoconhecimento estruturado baseada em 5 "espelhos" conversacionais com IA (Claude). Cada espelho representa uma fase de desenvolvimento pessoal: corpo (SOMA), emocoes (SEREN), consciencia (LUMA), integracao (ECHO) e relacoes (NEXUS). O utilizador final e qualquer pessoa que quer explorar padroes emocionais e comportamentais de forma guiada. A coach Vivianne supervisiona todos os clientes atraves do HUB-CONTROLO.

## Stack Tecnico

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API routes + Supabase (PostgreSQL, Auth, Edge Functions)
- **IA:** Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Pagamentos:** PayPal Subscriptions API
- **Email:** Resend API (nudges de engagement)
- **i18n:** next-intl (PT, EN, FR, ES)
- **Deploy:** Vercel + Supabase managed

## Supabase

- **Project ID local:** `anima` (config.toml)
- **Site URL:** `https://animamirror.com`
- **Auth:** Email/password + Magic link + PKCE flow
- **Tabelas partilhadas com outros produtos:** `users` (tabela central de utilizadores partilhada via Supabase project)

## Tiers de Subscricao

| Tier | Preco | Limite mensal | Mirrors | Sessoes |
|------|-------|---------------|---------|---------|
| free | 0 | 10 msgs | SOMA | 7 |
| essencial | 19 EUR | ilimitado | SOMA, SEREN, LUMA, ECHO | 28 |
| relacional | 29 EUR | ilimitado | + NEXUS | 35 |
| duo | 39 EUR | ilimitado | + NEXUS + jornada partilhada | 35 |
| profundo | 49 EUR | ilimitado | todos + features premium | 35 |

---

## Tabelas

### users
**Para que serve:** Perfil principal do utilizador, subscricao, preferencias e tracking de uso mensal.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| email | text | nao | - | UNIQUE |
| created_at | timestamptz | sim | NOW() | |
| subscription_tier | text | sim | 'free' | 'free' / 'essencial' / 'relacional' / 'duo' / 'profundo' |
| subscription_status | text | sim | 'inactive' | 'active' / 'inactive' / 'cancelled' |
| paypal_subscription_id | text | sim | null | ID da subscricao PayPal |
| language_preference | text | sim | 'pt' | 'pt' / 'en' / 'fr' / 'es' |
| monthly_message_count | int | sim | 0 | Reset mensal para free tier |
| last_reset_date | date | sim | CURRENT_DATE | Data do ultimo reset do contador |
| onboarding_completed | boolean | sim | false | |
| preferred_start_mirror | text | sim | 'soma' | Mirror sugerido ao iniciar |
| duo_partner_id | uuid | sim | null | FK -> users.id (parceiro duo) |
| duo_invite_code | text | sim | null | UNIQUE, codigo de convite duo |

**RLS:** SELECT e UPDATE apenas para auth.uid() = id; INSERT para auth.uid() = id (migration 004).

---

### user_journey
**Para que serve:** Tracking da progressao do utilizador pelas fases da jornada e contadores de conversas por mirror.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| user_id | uuid | nao | - | FK -> users.id, UNIQUE, ON DELETE CASCADE |
| current_phase | text | sim | 'foundation' | 'foundation' / 'regulation' / 'expansion' / 'integration' / 'relational' / 'complete' |
| foundation_completed | boolean | sim | false | |
| regulation_completed | boolean | sim | false | |
| expansion_completed | boolean | sim | false | |
| integration_completed | boolean | sim | false | |
| soma_conversations | int | sim | 0 | Total de conversas no SOMA |
| seren_conversations | int | sim | 0 | Total de conversas no SEREN |
| luma_conversations | int | sim | 0 | Total de conversas no LUMA |
| echo_conversations | int | sim | 0 | Total de conversas no ECHO |
| nexus_conversations | int | sim | 0 | Total de conversas no NEXUS (migration 003) |
| total_conversations | int | sim | 0 | Soma de todas as conversas |
| milestones_unlocked | text[] | sim | '{}' | Array de milestone IDs desbloqueados |
| foundation_started_at | timestamptz | sim | null | |
| regulation_started_at | timestamptz | sim | null | |
| expansion_started_at | timestamptz | sim | null | |
| integration_started_at | timestamptz | sim | null | |
| journey_completed_at | timestamptz | sim | null | |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | |

**RLS:** SELECT, UPDATE e INSERT para auth.uid() = user_id.
**Trigger:** Auto-criada via `handle_new_user_journey()` quando um user e inserido.

**Transicoes de fase automaticas:**
- SOMA >= 8 conversas -> foundation_completed, avanca para regulation
- SEREN >= 10 conversas -> regulation_completed, avanca para expansion
- LUMA >= 12 conversas -> expansion_completed, avanca para integration
- ECHO >= 15 conversas -> integration_completed, avanca para complete

---

### mirrors
**Para que serve:** Definicoes dos 5 espelhos de IA (SOMA, SEREN, LUMA, ECHO, NEXUS) com descricoes multilingue e prompts.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| slug | text | nao | - | UNIQUE: 'soma', 'seren', 'luma', 'echo', 'nexus' |
| name | text | nao | - | Nome display: SOMA, SEREN, LUMA, ECHO, NEXUS |
| description_pt | text | nao | - | |
| description_en | text | nao | - | |
| description_fr | text | nao | - | |
| description_es | text | nao | - | |
| system_prompt | text | nao | - | Prompt base do mirror (expandido no codigo) |
| color_theme | text | nao | - | Hex: #10b981, #6366f1, #f59e0b, #8b5cf6, #ec4899 |
| icon | text | nao | - | Emoji: 🌱, 🌊, ✨, 🔊, 🔗 |
| journey_phase | text | nao | - | foundation/regulation/expansion/integration/relational |
| is_active | boolean | sim | true | |
| is_premium | boolean | sim | false | SOMA=false, resto=true |
| display_order | int | sim | 0 | 1-5 |
| created_at | timestamptz | sim | NOW() | |

**RLS:** SELECT para authenticated users onde is_active = true.

**Seed data:**
| slug | name | icon | color | phase | premium | order |
|------|------|------|-------|-------|---------|-------|
| soma | SOMA | 🌱 | #10b981 | foundation | nao | 1 |
| seren | SEREN | 🌊 | #6366f1 | regulation | sim | 2 |
| luma | LUMA | ✨ | #f59e0b | expansion | sim | 3 |
| echo | ECHO | 🔊 | #8b5cf6 | integration | sim | 4 |
| nexus | NEXUS | 🔗 | #ec4899 | relational | sim | 5 |

---

### conversations
**Para que serve:** Sessoes de chat entre utilizador e um mirror, com contexto da fase da jornada.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| user_id | uuid | sim | - | FK -> users.id, ON DELETE CASCADE |
| mirror_id | uuid | sim | - | FK -> mirrors.id |
| title | text | sim | null | Auto-gerado dos primeiros 80 chars da 1a msg |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | |
| message_count | int | sim | 0 | Incrementado a cada par user+assistant |
| language | text | sim | 'pt' | Lingua da conversa |
| is_archived | boolean | sim | false | |
| journey_phase_at_creation | text | sim | null | Fase em que a conversa foi criada |

**RLS:** SELECT, INSERT e UPDATE para auth.uid() = user_id.

---

### messages
**Para que serve:** Mensagens individuais dentro de conversas, com metadata de IA e tagging de padroes.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| conversation_id | uuid | sim | - | FK -> conversations.id, ON DELETE CASCADE |
| role | text | nao | - | CHECK: 'user' ou 'assistant' |
| content | text | nao | - | Texto da mensagem |
| created_at | timestamptz | sim | NOW() | |
| tokens_used | int | sim | null | Tokens consumidos pela IA |
| model | text | sim | 'claude-sonnet-4' | Modelo de IA usado |
| patterns_detected | text[] | sim | '{}' | Padroes detectados nesta mensagem |
| insights_flagged | text[] | sim | '{}' | Insights sinalizados |

**RLS:** SELECT e INSERT via ownership da conversation (subquery).

---

### user_patterns
**Para que serve:** Padroes emocionais/comportamentais detectados pela IA, com tracking de integracao cross-mirror.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| user_id | uuid | sim | - | FK -> users.id, ON DELETE CASCADE |
| pattern_type | text | nao | - | Ex: eating_when_anxious, catastrophic_thinking, avoidant_attachment |
| pattern_description | text | sim | null | Descricao gerada pela IA |
| discovered_in_mirror | text | sim | - | 'soma'/'seren'/'luma'/'echo'/'nexus' |
| discovered_at | timestamptz | sim | NOW() | |
| related_patterns | uuid[] | sim | null | IDs de padroes relacionados |
| is_active | boolean | sim | true | |
| integration_level | int | sim | 0 | 0-5, aumenta quando trabalhado em multiplos mirrors |
| conversation_id | uuid | sim | null | FK -> conversations.id |
| message_id | uuid | sim | null | FK -> messages.id |

**RLS:** SELECT e INSERT para auth.uid() = user_id.

**Tipos de padroes detectados (keyword-based):**
eating_when_anxious, food_as_comfort, body_disconnection, body_rejection, catastrophic_thinking, control_seeking, people_pleasing, perfectionism, avoidant_attachment, anxious_attachment, codependency, self_sabotage, identity_confusion, fear_of_abandonment, emotional_suppression, comparison_pattern, imposter_syndrome, boundary_issues, grief_avoidance, relationship_pattern, sleep_disruption, burnout_pattern

---

### user_insights
**Para que serve:** Momentos de breakthrough e insights chave capturados durante sessoes ou exit rituals.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| user_id | uuid | sim | - | FK -> users.id, ON DELETE CASCADE |
| insight_text | text | nao | - | Texto do insight |
| insight_type | text | sim | null | 'awareness'/'breakthrough'/'connection'/'integration' |
| mirror_slug | text | sim | null | Mirror que gerou o insight |
| journey_phase | text | sim | null | Fase em que foi capturado |
| created_at | timestamptz | sim | NOW() | |
| is_favorited | boolean | sim | false | Marcado como favorito pelo user |
| user_notes | text | sim | null | Notas pessoais do user |

**RLS:** SELECT, INSERT e UPDATE para auth.uid() = user_id.

---

### subscription_events
**Para que serve:** Log de auditoria de todos os eventos PayPal (activacoes, cancelamentos, falhas de pagamento).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| user_id | uuid | sim | - | FK -> users.id, ON DELETE CASCADE |
| event_type | text | nao | - | 'created'/'activated'/'cancelled'/'payment_failed'/'renewed' |
| paypal_event_id | text | sim | null | UNIQUE, ID do evento PayPal |
| metadata | jsonb | sim | null | Dados adicionais do webhook |
| created_at | timestamptz | sim | NOW() | |

**RLS:** SELECT e INSERT para auth.uid() = user_id.

---

### daily_usage
**Para que serve:** Analytics diarios por utilizador (mensagens, conversas, mirrors usados, tokens).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| user_id | uuid | sim | - | FK -> users.id, ON DELETE CASCADE |
| date | date | sim | CURRENT_DATE | UNIQUE(user_id, date) |
| messages_sent | int | sim | 0 | |
| conversations_started | int | sim | 0 | |
| mirrors_used | text[] | sim | null | Ex: ['soma', 'seren'] |
| total_tokens | int | sim | 0 | |

**RLS:** SELECT, INSERT e UPDATE para auth.uid() = user_id.

---

### mirror_sessions
**Para que serve:** Definicoes das 7 sessoes estruturadas por mirror (Travessia), com titulos e prompts multilingue.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| mirror_slug | text | nao | - | UNIQUE(mirror_slug, session_number) |
| session_number | int | nao | - | CHECK: 1-7 |
| title_pt | text | nao | - | |
| title_en | text | nao | - | |
| title_es | text | nao | - | |
| title_fr | text | nao | - | |
| subtitle_pt | text | nao | - | |
| subtitle_en | text | nao | - | |
| subtitle_es | text | nao | - | |
| subtitle_fr | text | nao | - | |
| session_prompt | text | nao | - | Prompt especifico da sessao para a IA |
| estimated_minutes | int | sim | 15 | Duracao estimada |
| unlock_after | int | sim | null | Sessao que desbloqueia esta (null = disponivel) |

**RLS:** SELECT para authenticated users (migration 004).

**Total de sessoes seeded:** 35 (7 x 5 mirrors)

---

### user_sessions
**Para que serve:** Progresso individual do utilizador pelas sessoes estruturadas de cada mirror.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | - | FK -> auth.users(id), ON DELETE CASCADE |
| mirror_slug | text | nao | - | UNIQUE(user_id, mirror_slug, session_number) |
| session_number | int | nao | - | |
| status | text | sim | 'locked' | 'locked'/'available'/'in_progress'/'completed' |
| started_at | timestamptz | sim | null | |
| completed_at | timestamptz | sim | null | |
| conversation_id | uuid | sim | null | Conversa associada a sessao |
| exit_insight | text | sim | null | Insight capturado no exit ritual |
| created_at | timestamptz | sim | NOW() | |

**RLS:** FOR ALL com auth.uid() = user_id.

---

### user_streaks
**Para que serve:** Tracking de streaks diarios de sessoes para gamificacao e engagement.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | - | FK -> auth.users(id), ON DELETE CASCADE, UNIQUE |
| current_streak | int | sim | 0 | Streak actual |
| longest_streak | int | sim | 0 | Recorde historico |
| last_session_date | date | sim | null | Ultima sessao |
| updated_at | timestamptz | sim | NOW() | |

**RLS:** FOR ALL com auth.uid() = user_id.

---

### milestones
**Para que serve:** Definicoes dos milestones/achievements do sistema com titulos multilingue e triggers.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| trigger_type | text | nao | - | UNIQUE(trigger_type, trigger_value). Ex: 'session_complete', 'phase_complete', 'streak' |
| trigger_value | text | nao | - | Ex: 'soma_1', 'soma', '7', '30' |
| title_pt | text | nao | - | |
| title_en | text | nao | - | |
| title_es | text | nao | - | |
| title_fr | text | nao | - | |
| description_pt | text | nao | - | |
| description_en | text | nao | - | |
| description_es | text | nao | - | |
| description_fr | text | nao | - | |
| mirror_slug | text | sim | null | Mirror associado (null para milestones globais) |

**RLS:** SELECT para authenticated users (migration 004).

**Milestones seeded:**
| trigger_type | trigger_value | title_pt | mirror |
|---|---|---|---|
| session_complete | soma_1 | Primeiro passo | soma |
| session_complete | soma_3 | Corpo mapeado | soma |
| phase_complete | soma | Corpo desperto | soma |
| phase_complete | seren | Mente clara | seren |
| phase_complete | luma | Horizonte aberto | luma |
| phase_complete | echo | Travessia completa | echo |
| streak | 7 | 7 dias de presenca | global |
| streak | 30 | 30 dias de travessia | global |
| session_complete | nexus_1 | Primeiro Vinculo | nexus |
| phase_complete | nexus | Mestre Relacional | nexus |

---

### user_milestones
**Para que serve:** Registo de milestones desbloqueados por cada utilizador.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | - | FK -> auth.users(id), ON DELETE CASCADE |
| milestone_id | uuid | nao | - | FK -> milestones.id, UNIQUE(user_id, milestone_id) |
| unlocked_at | timestamptz | sim | NOW() | |
| seen | boolean | sim | false | Se o user ja viu a notificacao |

**RLS:** FOR ALL com auth.uid() = user_id.

---

### duo_invites
**Para que serve:** Sistema de convites para jornada partilhada (tier Duo).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | uuid_generate_v4() | PK |
| inviter_id | uuid | nao | - | FK -> users.id, ON DELETE CASCADE |
| invite_code | text | nao | - | UNIQUE |
| invitee_email | text | sim | null | Email do convidado |
| accepted_by | uuid | sim | null | FK -> users.id |
| accepted_at | timestamptz | sim | null | |
| created_at | timestamptz | sim | NOW() | |
| expires_at | timestamptz | sim | NOW() + 7 days | Expira em 7 dias |

**RLS:** SELECT para inviter_id ou accepted_by; INSERT para inviter_id; UPDATE para accepted_by ou inviter_id.

---

## Relacoes entre tabelas

```
users.id             <- user_journey.user_id (1:1, UNIQUE, CASCADE)
users.id             <- conversations.user_id (1:N, CASCADE)
users.id             <- user_patterns.user_id (1:N, CASCADE)
users.id             <- user_insights.user_id (1:N, CASCADE)
users.id             <- subscription_events.user_id (1:N, CASCADE)
users.id             <- daily_usage.user_id (1:N, CASCADE)
users.id             <- user_sessions.user_id (1:N, CASCADE)
users.id             <- user_streaks.user_id (1:1, UNIQUE, CASCADE)
users.id             <- user_milestones.user_id (1:N, CASCADE)
users.id             <- duo_invites.inviter_id (1:N, CASCADE)
users.id             <- duo_invites.accepted_by (1:N)
users.id             <- users.duo_partner_id (self-ref, 1:1)

mirrors.id           <- conversations.mirror_id (1:N)

conversations.id     <- messages.conversation_id (1:N, CASCADE)
conversations.id     <- user_patterns.conversation_id (1:N)
conversations.id     <- user_sessions.conversation_id (1:N)

messages.id          <- user_patterns.message_id (1:N)

milestones.id        <- user_milestones.milestone_id (1:N)
```

---

## Funcoes SQL

### handle_new_user_journey()
- **Trigger:** AFTER INSERT ON users
- **Accao:** Insere automaticamente um registo em user_journey com foundation_started_at = NOW()
- **Security:** DEFINER

### reset_monthly_message_counts()
- **Tipo:** Scheduled function (cron)
- **Accao:** Reset monthly_message_count = 0 para todos os users cujo last_reset_date < inicio do mes actual
- **Security:** DEFINER

---

## Funcoes RPC

Nenhuma funcao RPC definida. Todas as operacoes sao feitas via queries directas do cliente Supabase.

---

## Views

Nenhuma view SQL definida nas migracoes.

---

## Real-time Subscriptions

Nenhuma subscription real-time (.channel) implementada no codigo actual.

---

## Edge Functions

### engagement-nudge
- **Trigger:** Cron diario (10:00 UTC)
- **Accao:** Envia emails de nudge quando utilizadores ficam inactivos
- **Niveis:** 48h ("A tua jornada espera"), 7 dias ("O espelho lembra-se de ti"), 14 dias ("Quando quiseres, estamos aqui")
- **Tabelas:** Leitura de user_streaks e users
- **Email:** Via Resend API

---

## Fluxos importantes para a Coach (HUB-CONTROLO)

### Dados por cliente

Para cada cliente, a Vivianne precisa de ver:

- **Perfil:** email, tier, status da subscricao, lingua, data de registo (`users`)
- **Fase actual:** current_phase, fases completadas (`user_journey`)
- **Actividade por mirror:** soma/seren/luma/echo/nexus_conversations, total_conversations (`user_journey`)
- **Sessoes estruturadas:** status de cada sessao (locked/available/in_progress/completed), exit insights (`user_sessions`)
- **Streak:** current_streak, longest_streak, last_session_date (`user_streaks`)
- **Padroes detectados:** pattern_type, pattern_description, discovered_in_mirror, integration_level (`user_patterns`)
- **Insights:** insight_text, insight_type, mirror_slug, is_favorited (`user_insights`)
- **Milestones:** quais desbloqueou e quando (`user_milestones` + `milestones`)
- **Historico de conversas:** titulo, mirror, message_count, data (`conversations`)
- **Pagamentos:** event_type, datas, metadata (`subscription_events`)
- **Uso diario:** messages_sent, mirrors_used, tokens (`daily_usage`)
- **Duo:** se tem parceiro, quem e, convites enviados (`users.duo_partner_id`, `duo_invites`)

### Eventos que devem gerar alerta

- **Novo registo:** INSERT em users
- **Upgrade/downgrade de tier:** UPDATE em users.subscription_tier
- **Cancelamento de subscricao:** subscription_events com event_type = 'cancelled'
- **Falha de pagamento:** subscription_events com event_type = 'payment_failed'
- **Inactividade:** last_session_date em user_streaks > 7 dias
- **Streak quebrado:** current_streak desceu para 0
- **Fase completada:** UPDATE em user_journey com phase_complete = true
- **Milestone desbloqueado:** INSERT em user_milestones
- **Travessia completa:** user_journey.journey_completed_at preenchido
- **Insight de breakthrough:** INSERT em user_insights com insight_type = 'breakthrough'

### KPIs para o dashboard

- **Clientes activos:** COUNT de users com last_session_date nos ultimos 7 dias
- **Clientes por tier:** GROUP BY users.subscription_tier
- **Clientes por fase:** GROUP BY user_journey.current_phase
- **Sessoes esta semana:** COUNT de user_sessions completadas nos ultimos 7 dias
- **Mensagens esta semana:** SUM de daily_usage.messages_sent nos ultimos 7 dias
- **Receita mensal (MRR):** COUNT por tier x preco (free=0, essencial=19, relacional=29, duo=39, profundo=49)
- **Taxa de retencao:** % de users com actividade nos ultimos 30 dias vs total
- **Streaks medios:** AVG de user_streaks.current_streak
- **Padroes mais comuns:** GROUP BY user_patterns.pattern_type ORDER BY count DESC
- **Mirrors mais usados:** SUM de conversations por mirror_id
- **Taxa de conclusao de sessoes:** completed vs total em user_sessions
- **Churn:** COUNT de subscription_events com event_type = 'cancelled' no ultimo mes
- **Engagement por hora:** distribuicao temporal de messages.created_at

### Queries uteis para o HUB

```sql
-- Clientes activos nos ultimos 7 dias
SELECT u.email, u.subscription_tier, uj.current_phase, us.current_streak
FROM users u
JOIN user_journey uj ON uj.user_id = u.id
LEFT JOIN user_streaks us ON us.user_id = u.id
WHERE us.last_session_date >= CURRENT_DATE - INTERVAL '7 days';

-- Clientes em risco (inactivos 7+ dias com subscricao activa)
SELECT u.email, u.subscription_tier, us.last_session_date, us.current_streak
FROM users u
LEFT JOIN user_streaks us ON us.user_id = u.id
WHERE u.subscription_status = 'active'
AND (us.last_session_date IS NULL OR us.last_session_date < CURRENT_DATE - INTERVAL '7 days');

-- Resumo de progressao por cliente
SELECT u.email, uj.current_phase,
  uj.soma_conversations, uj.seren_conversations,
  uj.luma_conversations, uj.echo_conversations,
  uj.nexus_conversations, uj.total_conversations,
  COUNT(DISTINCT up.id) as patterns_count,
  COUNT(DISTINCT ui.id) as insights_count
FROM users u
JOIN user_journey uj ON uj.user_id = u.id
LEFT JOIN user_patterns up ON up.user_id = u.id
LEFT JOIN user_insights ui ON ui.user_id = u.id
GROUP BY u.email, uj.current_phase, uj.soma_conversations,
  uj.seren_conversations, uj.luma_conversations,
  uj.echo_conversations, uj.nexus_conversations, uj.total_conversations;

-- Receita mensal (MRR)
SELECT subscription_tier, COUNT(*) as count,
  CASE subscription_tier
    WHEN 'essencial' THEN COUNT(*) * 19
    WHEN 'relacional' THEN COUNT(*) * 29
    WHEN 'duo' THEN COUNT(*) * 39
    WHEN 'profundo' THEN COUNT(*) * 49
    ELSE 0
  END as mrr_eur
FROM users
WHERE subscription_status = 'active'
GROUP BY subscription_tier;
```

---

## Indexes

| Tabela | Index | Colunas |
|--------|-------|---------|
| conversations | idx_conversations_user_id | user_id |
| conversations | idx_conversations_mirror_id | mirror_id |
| conversations | idx_conversations_updated_at | updated_at DESC |
| messages | idx_messages_conversation_id | conversation_id |
| messages | idx_messages_created_at | created_at |
| messages | idx_messages_patterns | patterns_detected (GIN) |
| user_journey | idx_user_journey_user_id | user_id |
| user_journey | idx_user_journey_current_phase | current_phase |
| user_patterns | idx_user_patterns_user_id | user_id |
| user_patterns | idx_user_patterns_mirror | discovered_in_mirror |
| user_patterns | idx_user_patterns_active | is_active |
| daily_usage | idx_daily_usage_date | date |
| daily_usage | idx_daily_usage_user_date | user_id, date |
| user_sessions | idx_user_sessions_user | user_id |
| user_sessions | idx_user_sessions_mirror | user_id, mirror_slug |
| user_sessions | idx_user_sessions_status | user_id, status |
| user_streaks | idx_user_streaks_user | user_id |
| user_milestones | idx_user_milestones_user | user_id |
| user_milestones | idx_user_milestones_unseen | user_id, seen |
| users | idx_users_duo_invite_code | duo_invite_code |
| duo_invites | idx_duo_invites_inviter | inviter_id |
| duo_invites | idx_duo_invites_accepted_by | accepted_by |
| duo_invites | idx_duo_invites_expires | expires_at |
| duo_invites | idx_duo_invites_code | invite_code |

---

## Estrutura de Ficheiros Relevante

```
src/
  app/
    api/
      chat/route.ts              # Chat principal (mensagens, patterns, journey)
      auth/callback/route.ts     # Auth callback (login, signup, upsert user)
      conversations/[id]/messages/route.ts  # Historico de mensagens
      sessions/route.ts          # Gestao de sessoes estruturadas
      milestones/route.ts        # Desbloquear milestones
      journey/restart/route.ts   # Reset da jornada
      export/diary/route.ts      # Exportar diario (insights, patterns, streaks)
      duo/invite/route.ts        # Criar convite duo
      duo/accept/route.ts        # Aceitar convite duo
      paypal/create-subscription/route.ts  # Criar subscricao PayPal
      webhooks/paypal/route.ts   # Webhooks PayPal
    (app)/
      dashboard/page.tsx         # Dashboard principal
      chat/[mirrorSlug]/page.tsx # Interface de chat
      mirrors/page.tsx           # Seleccao de mirrors
      settings/page.tsx          # Definicoes do user
  lib/
    supabase/
      client.ts                  # Cliente Supabase (browser)
      server.ts                  # Cliente Supabase (server)
      middleware.ts              # Middleware de sessao
    ai/
      prompts.ts                 # System prompts por mirror
      cross-mirror-context.ts    # Contexto cross-mirror para IA
      pattern-detection.ts       # Deteccao de padroes (IA + keywords)
    journey/
      constants.ts               # Tiers, limites, fases, milestones
      sessions.ts                # Gestao de sessoes (init, get, complete)
      streaks.ts                 # Gestao de streaks
      milestones.ts              # Gestao de milestones
  types/
    database.ts                  # Tipos TypeScript completos do schema
supabase/
  config.toml                    # Configuracao Supabase
  migrations/
    001_initial_schema.sql       # Schema base (9 tabelas + RLS + triggers)
    002_travessia_tables.sql     # Sessoes, streaks, milestones (6 tabelas)
    003_tiers_nexus_duo.sql      # Tiers, NEXUS, duo (1 tabela + alteracoes)
    004_rls_fixes_and_consistency.sql  # Fixes de RLS e indexes
  functions/
    engagement-nudge/index.ts    # Edge function de nudges por email
  templates/
    magic-link.html              # Template email magic link
    confirmation.html            # Template email confirmacao
    invite.html                  # Template email convite
```
