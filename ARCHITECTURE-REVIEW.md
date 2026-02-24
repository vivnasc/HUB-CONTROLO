# HUB-CONTROLO — Review de Arquitectura

**Data**: 24 Fev 2026
**Branch**: claude/review-architecture-Q2omD

---

## O Problema

A Vivianne tem 4 produtos digitais activos (Sete Ecos, ANIMA, Os Sete Véus, PITCH) e precisa de uma cabine de pilotagem para:

1. **Messenger** — clientes escrevem dentro do Sete Ecos, ela responde pelo HUB. Substitui o WhatsApp.
2. **Feed em tempo real** — tudo o que acontece nos produtos aparece aqui.
3. **Acções rápidas** — lembrar cliente, dar feedback, ver perfil — tudo com um toque.
4. **Resumo diário** — quem registou, quem não registou, quem precisa de atenção.
5. **Autenticação exclusiva** — só ela entra.

---

## Estado Actual (~1,450 linhas de código)

### O que funciona

| Funcionalidade | Estado | Notas |
|----------------|--------|-------|
| Login exclusivo coach | OK | 3 emails hardcoded, whitelist funciona |
| Sessão persistente | OK | localStorage, auto-refresh |
| Feed de actividade | Parcial | Só Sete Ecos (alertas, mensagens, checkins) |
| Real-time subscriptions | OK | 4 canais Supabase, cleanup correcto |
| Lista de conversas | OK | Search, badges unread, origem/canal |
| Chat completo | OK | Histórico, envio, mark-as-read, realtime |
| Directório de clientes | Parcial | Só Vitalis + Aurea |
| Perfil de cliente | Parcial | Só dados Vitalis (peso, checkins, intake) |
| Dashboard resumo | Parcial | 4 KPIs básicos, leaderboard peso, só Sete Ecos |
| Bottom nav + badges | OK | 4 tabs, unread count realtime |
| Dark theme mobile-first | OK | Custom palette, safe-area, skeletons |

### O que não funciona / não existe

| Gap | Impacto |
|-----|---------|
| **0 dados de ANIMA** | Não vê sessões IA, padrões, streaks, fases |
| **0 dados de Os Sete Véus** | Não vê pagamentos pendentes, códigos, leitoras |
| **0 dados de PITCH** | Não vê progresso do Breno |
| **Messenger só texto** | Sem imagens, áudio, ficheiros |
| **Feed só Sete Ecos** | Não vê eventos de ANIMA/Véus/PITCH |
| **Sem alertas accionáveis** | Alerta aparece no feed mas não se pode marcar como lido/resolvido |
| **Sem KPIs de receita** | MRR não calculado para nenhum produto |
| **Sem gráficos** | Tudo é texto e contadores |
| **Sem resumo diário automático** | Não existe o "resumo às 20h" |
| **Sem notas da coach** | Não pode guardar notas por cliente |
| **Sem paginação** | Tudo carrega de uma vez |
| **Sem error handling** | Real-time falha silenciosamente |

---

## Arquitectura Alvo

### Princípios

1. **Um ecrã, uma decisão** — cada página responde a uma pergunta da Vivianne
2. **Agregação, não duplicação** — um cliente com Sete Ecos + ANIMA aparece uma vez
3. **Feed universal** — todos os produtos alimentam o mesmo feed
4. **Acções inline** — responder, marcar, lembrar — sem navegar
5. **Mobile-first** — tudo funciona no telemóvel da Vivianne

### Rotas (proposta)

```
/login              → Login.tsx (mantém)
/                   → Feed.tsx (feed universal, home)
/messenger          → Messenger.tsx (lista de conversas)
/messenger/:id      → Chat.tsx (chat individual)
/clients            → Clients.tsx (directório unificado cross-produto)
/clients/:id        → ClientDetail.tsx (perfil completo cross-produto)
/summary            → Summary.tsx (dashboard com KPIs e resumo diário)
/settings           → Settings.tsx (NOVO - configurações, notificações)
```

### Estrutura de ficheiros (proposta)

```
src/
  App.tsx
  main.tsx
  components/
    Shell.tsx                    # Layout + bottom nav (mantém, melhorar)
    StatCard.tsx                 # Card de KPI reutilizável (extrair do Summary)
    EventCard.tsx                # Card de evento no feed (extrair do Feed)
    ConversationRow.tsx          # Row de conversa (extrair do Messenger)
    ProductBadge.tsx             # Badge de produto (Sete Ecos/ANIMA/Véus/PITCH)
    AlertActions.tsx             # NOVO — marcar lido/resolvido inline
    ClientCard.tsx               # Card de cliente na lista
  contexts/
    AuthContext.tsx               # Mantém
  hooks/
    useUnreadCount.ts            # Mantém
    useRealtimeFeed.ts           # NOVO — feed universal com subscriptions multi-produto
    useClients.ts                # NOVO — aggregação de clientes cross-produto
  lib/
    supabase.ts                  # Mantém
    coach.ts                     # Mantém
    activity.ts                  # REESCREVER — feed universal (4 produtos)
    messenger.ts                 # Mantém + expandir (media, archive)
    clients.ts                   # NOVO — queries unificadas de clientes
    anima.ts                     # NOVO — queries ANIMA
    sete-veus.ts                 # NOVO — queries Os Sete Véus
    pitch.ts                     # NOVO — queries PITCH
    alerts.ts                    # NOVO — gestão de alertas (CRUD)
    kpis.ts                      # NOVO — cálculos de KPIs por produto
  types/
    database.ts                  # EXPANDIR — tipos para os 4 produtos
  pages/
    Login.tsx                    # Mantém
    Feed.tsx                     # REESCREVER — feed universal
    Messenger.tsx                # Mantém
    Chat.tsx                     # Expandir (media)
    Clients.tsx                  # REESCREVER — cross-produto
    ClientDetail.tsx             # REESCREVER — dados de todos os produtos
    Summary.tsx                  # REESCREVER — KPIs dos 4 produtos
    Settings.tsx                 # NOVO
```

---

## Feed Universal — Como Deve Funcionar

O feed agrega eventos de todos os produtos num único stream ordenado por timestamp.

### Fontes de eventos

| Produto | Tabela | Evento | Prioridade |
|---------|--------|--------|-----------|
| Sete Ecos | vitalis_alerts | INSERT | Depende do tipo_alerta |
| Sete Ecos | vitalis_checkins | INSERT | low |
| Sete Ecos | messenger_messages | INSERT (sender_type=user) | medium |
| ANIMA | subscription_events | INSERT (cancelled/payment_failed) | critical |
| ANIMA | user_insights | INSERT (type=breakthrough) | medium |
| ANIMA | user_sessions | UPDATE (status=completed) | low |
| ANIMA | user_streaks | UPDATE (current_streak=0) | high |
| Sete Véus | payments | INSERT (status=pending) | critical |
| Sete Véus | livro_code_requests | INSERT (status=pending) | high |
| Sete Véus | reading_progress | UPDATE (completed=true) — último capítulo do espelho | medium |
| PITCH | profile_shares | INSERT (role=therapist) | medium |

### Real-time channels (proposta)

```
hub-activity-sete-ecos    → vitalis_alerts, messenger_messages, vitalis_checkins
hub-activity-anima        → subscription_events, user_insights, user_sessions, user_streaks
hub-activity-veus         → payments, livro_code_requests, reading_progress
hub-activity-pitch        → profile_shares
```

### Filtros no feed

- Por produto: Todos / Sete Ecos / ANIMA / Véus / PITCH
- Por prioridade: Todos / Crítico+Alto / Só crítico
- Por tipo: Alertas / Mensagens / Actividade

---

## Directório de Clientes — Como Deve Funcionar

### Problema actual

A mesma pessoa pode estar em múltiplos produtos. O email `joana@gmail.com` pode ser:
- vitalis_clients (Sete Ecos) — via users.id
- users na ANIMA — mesmo email, ID diferente (projecto Supabase separado? ou o mesmo?)
- profiles nos Sete Véus — mesmo email, tabela diferente

### Questão crítica: É o mesmo Supabase project ou são diferentes?

**Se é o MESMO projecto** (mesmo `vvvdtogvlutrybultffx`):
- users.id é o mesmo em todas as tabelas
- JOIN directo entre vitalis_clients, user_journey, profiles, profile_shares
- Solução simples: uma query com LEFT JOINs

**Se são projectos DIFERENTES**:
- Cada produto tem o seu próprio auth
- Match por email (não por ID)
- O HUB precisa de queries a múltiplos Supabase clients
- Muito mais complexo

**Baseado no CLAUDE.md**: Diz "Todos partilham o mesmo Supabase project" — logo, é o mesmo. Mas ANIMA tem `config.toml` com `project_id = 'anima'` e Os Sete Véus usa `profiles` em vez de `users`. Precisa de confirmação.

### Estrutura do directório (assumindo mesmo Supabase)

```
Cliente unificado = {
  // Base (users)
  id, email, nome, genero, created_at

  // Sete Ecos (vitalis_clients)
  seteEcos?: {
    status, fase_actual, peso_actual, peso_meta, ultimo_checkin, alertas_pendentes
  }

  // ANIMA (user_journey + user_streaks)
  anima?: {
    tier, current_phase, total_conversations, current_streak, last_session_date
  }

  // Os Sete Véus (profiles + reading_progress)
  seteVeus?: {
    has_book_access, has_mirrors_access, capitulos_lidos, ultimo_lido
  }

  // PITCH (profile_shares)
  pitch?: {
    criancas_partilhadas, ultima_sincronizacao
  }
}
```

### Filtros na lista

- Por produto: Todos / Sete Ecos / ANIMA / Véus / PITCH
- Por status: Activos / Trial / Pendentes / Expirados
- Por actividade: Activos hoje / Inactivos 7d / Inactivos 30d

---

## Perfil de Cliente — Como Deve Funcionar

O ClientDetail mostra TUDO sobre um cliente, organizado por tabs ou secções:

### Secção 1: Cabeçalho
- Nome, email, avatar (iniciais)
- Badges dos produtos activos
- Botão "Enviar mensagem"
- Botão "Adicionar nota"

### Secção 2: Sete Ecos (se aplicável)
- Fase, status, peso actual/meta/perdido
- Últimos 5 checkins (peso + humor + energia)
- Alertas pendentes (com acção inline)
- Link para plano alimentar

### Secção 3: ANIMA (se aplicável)
- Fase da jornada, tier
- Conversas por mirror (SOMA/SEREN/LUMA/ECHO/NEXUS)
- Sessões completadas (X/35)
- Streak actual
- Últimos padrões detectados

### Secção 4: Os Sete Véus (se aplicável)
- Flags de acesso
- Progresso por espelho (capítulos lidos)
- Pagamentos pendentes
- Códigos usados

### Secção 5: PITCH (se aplicável)
- Crianças partilhadas (nome, estrelas, fase)
- Última sincronização

### Secção 6: Conversas
- Lista de conversas activas com preview
- Quick-reply inline

### Secção 7: Notas da coach
- Timeline de notas (NOVO — precisa de tabela `coach_notes`)

---

## Dashboard / Resumo — Como Deve Funcionar

### KPIs Globais (topo)
| KPI | Query |
|-----|-------|
| Clientes activos (total) | COUNT DISTINCT de todas as client tables com status activo |
| Mensagens não lidas | SUM(unread_coach) de messenger_conversations |
| Alertas pendentes | COUNT de vitalis_alerts WHERE status='pendente' |
| MRR total | Sete Ecos MRR + ANIMA MRR |

### Por Produto (tabs ou secções)

**Sete Ecos:**
- Checkins hoje / semana
- Peso perdido esta semana (agregado)
- Top 5 perda de peso
- Clientes sem checkin (>3 dias)
- MRR: count por tier × preço MZN

**ANIMA:**
- Sessões completadas esta semana
- Clientes por fase (foundation/regulation/expansion/integration/complete)
- Streaks médios
- Padrões mais comuns
- MRR: count por tier × preço EUR

**Os Sete Véus:**
- Leitoras activas esta semana
- Capítulos lidos
- Pagamentos pendentes (valor + count)
- Códigos pendentes
- Receita confirmada vs pendente

**PITCH:**
- Crianças activas
- Nível médio por campo
- Última sincronização

### Resumo Diário (20h)
- Lista de "precisa de atenção" (inactivos, trials a expirar, pagamentos pendentes)
- Lista de "destaques" (metas atingidas, espelhos completados, breakthroughs)

---

## RLS Policies Necessárias

Para o HUB ler dados dos 4 produtos, precisa de policies `is_coach()` em:

### Já existem (hub_controlo_rls.sql)
- users (SELECT)
- messenger_conversations (SELECT, UPDATE)
- messenger_messages (SELECT, INSERT, UPDATE)
- vitalis_clients (SELECT)
- vitalis_intake (SELECT)
- vitalis_alerts (SELECT, UPDATE)
- vitalis_checkins (SELECT)
- aurea_clients (SELECT)

### Precisam de ser criadas — ANIMA
```sql
CREATE POLICY "Coach sees all user_journey" ON user_journey FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all conversations" ON conversations FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all messages" ON messages FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all user_patterns" ON user_patterns FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all user_insights" ON user_insights FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all user_sessions" ON user_sessions FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all user_streaks" ON user_streaks FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all subscription_events" ON subscription_events FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all daily_usage" ON daily_usage FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all user_milestones" ON user_milestones FOR SELECT USING (is_coach());
```

### Precisam de ser criadas — Os Sete Véus
```sql
CREATE POLICY "Coach sees all profiles" ON profiles FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all reading_progress" ON reading_progress FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all payments" ON payments FOR SELECT USING (is_coach());
CREATE POLICY "Coach updates payments" ON payments FOR UPDATE USING (is_coach());
CREATE POLICY "Coach sees all livro_code_requests" ON livro_code_requests FOR SELECT USING (is_coach());
CREATE POLICY "Coach updates livro_code_requests" ON livro_code_requests FOR UPDATE USING (is_coach());
CREATE POLICY "Coach sees all livro_codes" ON livro_codes FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all purchases" ON purchases FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all journal_entries" ON journal_entries FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all admin_notifications" ON admin_notifications FOR SELECT USING (is_coach());
CREATE POLICY "Coach updates admin_notifications" ON admin_notifications FOR UPDATE USING (is_coach());
```

### Precisam de ser criadas — PITCH
```sql
CREATE POLICY "Coach sees all profile_shares" ON profile_shares FOR SELECT USING (is_coach());
CREATE POLICY "Coach sees all user_data" ON user_data FOR SELECT USING (is_coach());
```

### Tabela nova — coach_notes
```sql
CREATE TABLE coach_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE POLICY "Coach manages notes" ON coach_notes FOR ALL USING (is_coach());
```

---

## Plano de Implementação (por fases)

### Fase 0 — SQL no Supabase (antes de tocar no código)
**A Vivianne precisa de correr:**
1. Policies is_coach() para ANIMA (10 policies)
2. Policies is_coach() para Os Sete Véus (11 policies)
3. Policies is_coach() para PITCH (2 policies)
4. Criar tabela coach_notes (1 tabela + 1 policy)
5. Verificar se `is_coach()` já existe no Supabase (pode já ter sido criada pelo HUB original)

### Fase 1 — Types + Lib (foundation)
1. Expandir `types/database.ts` com interfaces para ANIMA, Véus, PITCH
2. Criar `lib/anima.ts` — queries para user_journey, conversations, user_patterns, user_streaks, user_sessions
3. Criar `lib/sete-veus.ts` — queries para profiles, reading_progress, payments, livro_code_requests
4. Criar `lib/pitch.ts` — queries para profile_shares, user_data
5. Criar `lib/clients.ts` — query unificada cross-produto
6. Criar `lib/alerts.ts` — CRUD de alertas (marcar lido/resolvido)
7. Criar `lib/kpis.ts` — cálculos de KPIs por produto

### Fase 2 — Feed Universal
1. Reescrever `lib/activity.ts` — agregar eventos dos 4 produtos
2. Adicionar channels realtime para ANIMA, Véus, PITCH
3. Adicionar filtros no Feed.tsx (por produto, prioridade)
4. Adicionar acções inline nos alertas (marcar lido/resolvido)

### Fase 3 — Clientes Cross-Produto
1. Reescrever `Clients.tsx` — directório unificado
2. Reescrever `ClientDetail.tsx` — perfil completo com secções por produto
3. Adicionar filtros por produto e actividade
4. Adicionar notas da coach

### Fase 4 — Dashboard KPIs
1. Reescrever `Summary.tsx` — KPIs dos 4 produtos
2. Adicionar MRR por produto
3. Adicionar lista "precisa de atenção"
4. Adicionar lista "destaques do dia"

### Fase 5 — Messenger melhorado
1. Upload de imagens (Supabase Storage)
2. Pré-visualização de media recebida
3. Conversas arquivadas
4. Search dentro de mensagens

### Fase 6 — Settings + Polish
1. Página de settings
2. Error boundaries
3. Toast notifications para erros
4. PWA service worker
5. Paginação nas listas grandes

---

## Questões Abertas (precisam de resposta da Vivianne)

1. **Mesmo Supabase?** A ANIMA e Os Sete Véus usam o mesmo projecto Supabase (`vvvdtogvlutrybultffx`) ou têm projectos separados?

2. **Tabela users vs profiles**: A ANIMA usa `users` e Os Sete Véus usa `profiles`. Se são o mesmo Supabase, um cliente com email X tem registos em ambas as tabelas? Ou `profiles` é um alias/view?

3. **Messenger**: O messenger actual é só para Sete Ecos. A ANIMA e Os Sete Véus devem ter messenger também? Ou o Sete Ecos é o único ponto de contacto?

4. **Resumo diário automático**: Queres uma notificação push/email às 20h com o resumo? Ou basta a página Summary com os dados actualizados?

5. **Notas por cliente**: Queres notas simples (texto + data) ou algo mais estruturado (tags, prioridade, lembretes)?

6. **PITCH**: O PITCH está activo e com utilizadores reais, ou ainda em desenvolvimento?
