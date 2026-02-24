# HUB-CONTROLO — Review de Arquitectura

**Data**: 24 Fev 2026
**Branch**: claude/review-architecture-Q2omD

---

## Contexto: 4 Negócios Independentes

A Vivianne gere 4 produtos digitais. Cada um tem o seu **próprio Supabase, Vercel e domínio**. Servem mercados completamente diferentes — praticamente zero sobreposição de clientes.

| Produto | O que é | Mercado | Moeda | Supabase | Admin existente |
|---------|---------|---------|-------|----------|-----------------|
| **Sete Ecos** | Plataforma holística de wellness (7 ecos + Lumina + Aurora + Comunidade) | Moçambique / Portugal | MZN | Próprio (`vvvdtogvlutrybultffx`) | Sim — 7 rotas `/coach`, API `coach.js` (1247 LOC) |
| **ANIMA** | Autoconhecimento com 5 espelhos IA (Claude) | Global (4 línguas) | EUR | Próprio | Não — monitorização prevista para o HUB |
| **Os Sete Véus** | Ficção transformativa (7 Espelhos + 7 Nós + comunidade Ecos) | Lusófono | USD/MZN/BRL/EUR | Próprio | Sim — `/admin` (pagamentos, links, códigos) |
| **PITCH** | Aprendizagem adaptativa para crianças com necessidades especiais | Famílias / terapeutas | EUR | Próprio | Não |

### O papel da Vivianne em cada produto

| Produto | Papel | Tipo de interacção |
|---------|-------|--------------------|
| Sete Ecos | **Coach activa** | Conversa com clientes, cria planos alimentares, faz broadcast WA/email, gere alertas, acompanha check-ins diários |
| ANIMA | **Supervisora** | A IA faz o coaching; Vivianne monitoriza padrões, fases, churn, subscrições, breakthroughs |
| Os Sete Véus | **Autora/admin** | Confirma pagamentos manuais, aprova códigos LIVRO, gere links especiais, publica novos espelhos |
| PITCH | **Terapeuta** | Recebe partilhas de perfis de crianças, monitoriza progresso, níveis, actividade |

---

## O que o HUB é (e o que não é)

**O HUB NÃO substitui** os painéis de admin que já existem no Sete Ecos e nos Sete Véus. Esses continuam a funcionar para tarefas pesadas (gerar plano alimentar, broadcast WA, confirmar pagamento com comprovativo).

**O HUB É** a cabine de pilotagem mobile-first onde a Vivianne:

1. **Vê tudo num sítio** — o que aconteceu nos 4 produtos nas últimas horas
2. **Responde rápido** — messenger do Sete Ecos (substitui WhatsApp)
3. **Age sobre alertas** — pagamento pendente nos Véus, streak quebrado na ANIMA, criança inactiva no PITCH
4. **Tem o resumo do dia** — KPIs por produto, quem precisa de atenção

---

## Estado Actual do HUB (~1,450 LOC)

### O que funciona (tudo Sete Ecos)

| Funcionalidade | Estado |
|----------------|--------|
| Login exclusivo coach (3 emails) | OK |
| Sessão persistente (localStorage) | OK |
| Feed de actividade (alertas, mensagens, checkins) | OK — só Sete Ecos |
| Real-time (4 canais Supabase) | OK — só Sete Ecos |
| Messenger (lista + chat + mark-as-read) | OK — só Sete Ecos |
| Directório de clientes (Vitalis + Aurea) | OK — só Sete Ecos |
| Perfil de cliente (peso, checkins, intake) | OK — só Sete Ecos |
| Dashboard (4 KPIs, leaderboard peso) | OK — só Sete Ecos |
| Bottom nav + unread badge + dark theme | OK |

### O que falta

| Gap | Impacto |
|-----|---------|
| 0 dados de ANIMA | Não vê sessões IA, padrões, streaks, fases, subscrições |
| 0 dados dos Sete Véus | Não vê pagamentos pendentes, pedidos de código, leitoras activas |
| 0 dados do PITCH | Não vê progresso de crianças, partilhas pendentes |
| Só 1 Supabase client | Não liga aos outros 3 produtos |
| Sem alertas accionáveis | Alerta aparece no feed mas não se pode marcar lido/resolvido |
| Sem KPIs de receita | MRR não calculado |
| Sem gráficos | Tudo texto e contadores |

---

## Arquitectura: 4 Supabase Independentes

### O problema técnico

Cada produto tem o seu próprio projecto Supabase → IDs de utilizador diferentes → sem JOINs possíveis entre projectos.

### Solução: 4 clientes Supabase no HUB

```
lib/
  supabase.ts        → Cliente principal (Sete Ecos) — auth + messenger + real-time
  supabase-anima.ts  → Cliente ANIMA (read-only)
  supabase-veus.ts   → Cliente Sete Véus (read-only + updates operacionais)
  supabase-pitch.ts  → Cliente PITCH (read-only)
```

### Env vars necessárias (8 no total)

```env
# Sete Ecos (principal — auth, messenger, real-time)
VITE_SUPABASE_URL=https://vvvdtogvlutrybultffx.supabase.co
VITE_SUPABASE_ANON_KEY=...

# ANIMA (read-only)
VITE_ANIMA_SUPABASE_URL=https://XXXX.supabase.co
VITE_ANIMA_SUPABASE_ANON_KEY=...

# Os Sete Véus (read + operações admin)
VITE_VEUS_SUPABASE_URL=https://XXXX.supabase.co
VITE_VEUS_SUPABASE_ANON_KEY=...

# PITCH (read-only)
VITE_PITCH_SUPABASE_URL=https://XXXX.supabase.co
VITE_PITCH_SUPABASE_ANON_KEY=...
```

### Auth: como funciona

- A Vivianne faz login **uma vez** no HUB (via Sete Ecos Supabase)
- Para os outros 3 Supabase: a Vivianne precisa de ter conta (mesmo email) em cada um
- No login, o HUB autentica nos 4 em paralelo com as mesmas credenciais
- Cada Supabase tem `is_coach()` ou verificação admin que reconhece o email dela
- **Nota**: Os Sete Véus já usa `is_admin` no `profiles` + `user_roles`; pode não precisar de `is_coach()`

### Real-time vs Polling

| Produto | Estratégia | Razão |
|---------|-----------|-------|
| Sete Ecos | **Real-time** (WebSockets) | Já funciona, messenger precisa de ser instantâneo |
| ANIMA | **Polling** (30-60s) | Supervisão, não precisa de ser instantâneo |
| Os Sete Véus | **Polling** (30-60s) | Alertas operacionais, pode ter algum delay |
| PITCH | **Polling** (5 min) | Dados são snapshots, actualizam raramente |

---

## O que o HUB precisa de ler de cada produto

### Sete Ecos (85+ tabelas, HUB lê ~8)

O HUB já lê estas. O que falta é expandir o que mostra.

| Tabela | Para quê | Operações |
|--------|----------|-----------|
| users | Perfil base | SELECT |
| vitalis_clients | Status, fase, peso | SELECT |
| vitalis_intake | Dados de intake (70+ campos) | SELECT |
| vitalis_checkins | Check-ins diários | SELECT |
| vitalis_alerts | Alertas (6 tipos, 4 prioridades) | SELECT, UPDATE |
| messenger_conversations | Conversas | SELECT, UPDATE |
| messenger_messages | Mensagens | SELECT, INSERT, UPDATE |
| aurea_clients | Status Áurea | SELECT |

**Futuro**: Expandir para ler `{eco}_clients` dos outros 6 ecos (serena, ignis, ventis, ecoa, imago, aurora) para KPIs completos.

### ANIMA (14 tabelas, HUB lê ~7)

| Tabela | Para quê | Dados chave |
|--------|----------|-------------|
| users | Email, tier, subscription_status, language | Identificação + estado de subscrição |
| user_journey | current_phase, conversations por mirror, fases completadas | Onde o cliente está na jornada |
| user_streaks | current_streak, longest_streak, last_session_date | Actividade/inactividade |
| user_patterns | pattern_type, integration_level, discovered_in_mirror | Padrões emocionais detectados pela IA |
| user_insights | insight_text, insight_type, is_favorited | Breakthroughs |
| subscription_events | event_type (cancelled, payment_failed, renewed) | Alertas de pagamento |
| user_sessions | status das 35 sessões estruturadas | Progresso na Travessia |

**KPIs ANIMA**: Clientes por tier/fase, MRR (count × preço EUR), sessões/semana, streaks médios, padrões comuns, mirrors mais usados.

**Alertas ANIMA**: Novo registo, cancelamento, payment_failed, inactividade 7d+, streak quebrado, fase completada, breakthrough.

### Os Sete Véus (20+ tabelas, HUB lê ~6)

| Tabela | Para quê | Dados chave |
|--------|----------|-------------|
| profiles | Flags de acesso (book, mirrors, audiobook, early_access), is_admin | Quem tem acesso a quê |
| reading_progress | chapter_slug, completed, updated_at | Capítulos lidos por espelho/nó |
| payments | status, amount, currency, payment_method, proof | **Pagamentos pendentes a confirmar** |
| livro_code_requests | status, full_name, email, proof_url | **Pedidos de código a aprovar** |
| livro_codes | code, status, used_by, used_at | Códigos usados |
| admin_notifications | type, title, message, read | Notificações operacionais |

**KPIs Véus**: Leitoras activas, capítulos/semana, receita pendente vs confirmada, códigos pendentes, progressão entre véus, ecos na comunidade.

**Alertas Véus** (os mais urgentes — precisam de acção manual):
- Pagamento pending (precisa de confirmar)
- Comprovativo enviado (pronto para rever)
- Pedido de código pending (precisa de aprovar/rejeitar)
- Código resgatado, link especial usado, novo membro

### PITCH (2 tabelas)

| Tabela | Para quê | Dados chave |
|--------|----------|-------------|
| profile_shares | Partilhas com a coach (role='therapist') | profile_data (JSONB), progress_data (JSONB), status, updated_at |
| user_data | (Indirecto — dados vêm via profile_shares) | — |

**A coach acede a dados de crianças VIA `profile_shares`**, não directamente. O `profile_data` JSONB contém: nome, idade, competencyLevels (1-10 por campo), configs sensoriais/atenção. O `progress_data` contém: estrelas, streak, actividades completadas, palavras aprendidas.

**KPIs PITCH**: Crianças activas, nível médio por campo, fase predominante, actividades mais completadas, inactividade.

**Alertas PITCH**: Nova partilha pendente, inactividade prolongada, partilha revogada, nível subiu.

---

## Feed Universal

O feed agrega eventos dos 4 produtos num stream único, ordenado por timestamp, filtrado por produto.

### Fontes de eventos

| Produto | Tabela | Evento | Prioridade | Via |
|---------|--------|--------|-----------|-----|
| Sete Ecos | vitalis_alerts | INSERT | Depende do tipo | Real-time |
| Sete Ecos | messenger_messages | INSERT (sender_type=user) | medium | Real-time |
| Sete Ecos | vitalis_checkins | INSERT | low | Real-time |
| ANIMA | subscription_events | cancelled / payment_failed | critical | Polling |
| ANIMA | user_insights | breakthrough | medium | Polling |
| ANIMA | user_streaks | streak quebrado (current_streak=0) | high | Polling |
| Véus | payments | INSERT (status=pending) | **critical** | Polling |
| Véus | livro_code_requests | INSERT (status=pending) | **high** | Polling |
| Véus | admin_notifications | INSERT (read=false) | medium | Polling |
| PITCH | profile_shares | INSERT (role=therapist, status=pending) | medium | Polling |

### Filtros no feed

- Por produto: Todos / Sete Ecos / ANIMA / Véus / PITCH
- Por tipo: Alertas / Mensagens / Actividade
- Por urgência: Todos / Precisa de acção / Informativo

---

## Directório de Clientes

**NÃO é uma lista unificada cross-produto.** São 4 listas, uma por produto, porque os clientes são diferentes.

### Vista por produto

| Produto | Fonte de dados | Colunas na lista |
|---------|---------------|-----------------|
| Sete Ecos | users + vitalis_clients + aurea_clients + ... | Nome, email, eco(s) activo(s), status, fase, último checkin |
| ANIMA | users + user_journey + user_streaks | Nome, email, tier, fase, streak, última sessão |
| Véus | profiles + reading_progress | Email, acessos, capítulos lidos, último lido |
| PITCH | profile_shares (role=therapist, status=accepted) | Nome da criança, níveis, estrelas, última sync |

### Perfil individual

Cada produto mostra um perfil diferente:

**Sete Ecos**: Fase, peso (actual/meta/perdido), últimos checkins, alertas pendentes, plano alimentar, conversas messenger, gamificação por eco.

**ANIMA**: Tier, fase da jornada, conversas por mirror, sessões completadas (X/35), padrões detectados, insights, streak.

**Véus**: Flags de acesso, progresso por espelho (capítulos lidos de 7), pagamentos, códigos usados.

**PITCH**: Dados do JSONB — nome, idade, competencyLevels por campo (1-10), fase (Germinar/Estruturar/Florescer/Sustentar), estrelas, actividades completadas.

---

## Dashboard / Resumo

### KPIs Globais (topo)

| KPI | Fonte |
|-----|-------|
| Total clientes activos (todos os produtos) | Soma das contagens por produto |
| Mensagens não lidas | messenger_conversations WHERE unread_coach > 0 |
| Alertas pendentes (total) | Sete Ecos + Véus + ANIMA + PITCH |
| Acções urgentes | Pagamentos Véus pending + códigos pending |

### KPIs por produto (secções ou tabs)

**Sete Ecos:**
- Clientes activos por eco e tier
- Check-ins hoje / semana
- MRR: COUNT por tier × preço MZN
- Top perda de peso
- Inactivos (sem checkin >3 dias)

**ANIMA:**
- Clientes por tier × preço EUR = MRR
- Clientes por fase (foundation→complete)
- Sessões completadas esta semana
- Streaks médios
- Padrões mais comuns
- Mirrors mais usados

**Os Sete Véus:**
- Leitoras activas esta semana
- Capítulos lidos
- Receita pendente vs confirmada (valor + count)
- Códigos/pagamentos pendentes
- Progressão entre véus

**PITCH:**
- Crianças activas (profile_shares com updated_at recente)
- Nível médio por campo
- Distribuição por fase
- Actividades mais completadas

---

## RLS: O que precisa de existir em cada Supabase

### Sete Ecos — JÁ EXISTE
`is_coach()` funciona. Policies definidas em `supabase/hub_controlo_rls.sql`.

### ANIMA — PRECISA DE SER CRIADO
A coach precisa de conta no Supabase da ANIMA + `is_coach()` + policies SELECT em: users, user_journey, user_streaks, user_patterns, user_insights, subscription_events, user_sessions, conversations (read-only).

### Os Sete Véus — PARCIALMENTE EXISTE
Já tem `is_admin` no `profiles` e `user_roles`. Se a Vivianne for admin no Sete Véus (provavelmente já é), pode não precisar de `is_coach()` adicional. Precisa de confirmar que as RLS policies permitem leitura de: profiles, reading_progress, payments, livro_code_requests, admin_notifications, livro_codes.

### PITCH — PRECISA DE SER CRIADO
Actualmente as RLS policies só permitem owner e recipient ler os seus dados. A coach precisa de uma policy que permita ler `profile_shares` WHERE role='therapist' AND shared_with_id = coach_id. **Ou** adicionar `is_coach()`.

---

## Plano de Implementação

### Fase 0 — Pré-requisitos (Vivianne faz)
1. Fornecer URL + Anon Key dos 3 Supabase secundários
2. Confirmar que tem conta (mesmo email) nos 4 Supabase
3. Confirmar que é admin no Sete Véus
4. Correr SQL de `is_coach()` + policies na ANIMA e no PITCH

### Fase 1 — Multi-client + Types
1. Expandir `lib/supabase.ts` para 4 clients
2. Actualizar `AuthContext.tsx` para multi-auth
3. Criar types para ANIMA, Véus, PITCH
4. Criar `lib/anima.ts`, `lib/sete-veus.ts`, `lib/pitch.ts` (queries read-only)

### Fase 2 — Feed Universal
1. Expandir `lib/activity.ts` (real-time Sete Ecos + polling dos outros)
2. Reescrever `Feed.tsx` com filtros por produto e urgência

### Fase 3 — Clientes por Produto
1. Reescrever `Clients.tsx` com tabs/filtro por produto
2. Reescrever `ClientDetail.tsx` com secções por produto

### Fase 4 — Dashboard
1. Reescrever `Summary.tsx` com KPIs dos 4 produtos

### Fase 5 — Acções operacionais
1. Marcar alertas como lidos/resolvidos
2. (Futuro) Confirmar pagamentos Véus a partir do HUB
3. (Futuro) Aprovar códigos LIVRO a partir do HUB

### Fase 6 — Polish
1. Error boundaries
2. Paginação
3. Gráficos de evolução (Recharts?)
