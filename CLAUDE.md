# HUB-CONTROLO — Cabine de Pilotagem da Vivianne

## Instrucoes de Sessao (OBRIGATORIO)

1. **Lingua**: Portugues informal. A Vivianne escreve com typos e abreviaturas — interpretar naturalmente.
2. **Nunca partir funcionalidade existente.** Ler ficheiros antes de alterar. Nao tocar em layout ou logica a menos que pedido.
3. **Build-check** (`tsc -b && vite build`) apos alteracoes de codigo antes de commit.
4. **Schema Supabase importa.** As tabelas partilhadas com outros projectos tem colunas especificas. Nunca tentar escrever em colunas que nao existem.
5. **Coach-only.** Este painel e exclusivo da Vivianne. Toda a autorizacao usa `is_coach()` (SQL) e `isCoach()` (TS).

---

## Descricao

HUB-CONTROLO e o painel central da coach Vivianne para monitorizar clientes de todos os seus produtos digitais. E uma SPA React/TypeScript que liga directamente ao Supabase partilhado, com feed de actividade em real-time, messenger, directorio de clientes e resumo diario.

**Owner**: Vivianne Saraiva
**Utilizador unico**: Vivianne (emails autorizados: viv.saraiva@gmail.com, vivnasc@gmail.com, vivianne.saraiva@outlook.com)

---

## Stack Tecnico

| Categoria | Tecnologia |
|-----------|------------|
| Framework | React 19.2 + TypeScript 5.9 + Vite 7.3 |
| Routing | React Router DOM 7.13 |
| Backend | Supabase JS Client 2.97 (partilhado com todos os produtos) |
| Styling | Tailwind CSS 4.2 (via Vite plugin) |
| Icons | Lucide React 0.575 |
| Datas | date-fns 4.1 |
| Linting | ESLint 9.39 + TypeScript ESLint |
| Deploy | Vite SPA build (PWA-ready com manifest.json) |

---

## Supabase

- **Project ID**: vvvdtogvlutrybultffx
- **URL**: https://vvvdtogvlutrybultffx.supabase.co
- **Auth**: Supabase Auth (email/password)
- **Real-time**: Activo (4 canais: hub-activity, hub-convs, hub-chat-{id}, hub-unread)
- **RLS**: Todas as policies usam `is_coach()` — funcao SQL que verifica email do auth.uid()

### Env vars
```
VITE_SUPABASE_URL=https://vvvdtogvlutrybultffx.supabase.co
VITE_SUPABASE_ANON_KEY=<chave publica>
```

---

## Arquitectura

```
src/
  App.tsx              # Router (6 rotas: login, feed, messenger, chat, clients, clientDetail, summary)
  main.tsx             # Entry point
  components/
    Shell.tsx           # Layout wrapper com bottom nav (4 tabs + badge unread)
  contexts/
    AuthContext.tsx      # Session + isCoach guard
  hooks/
    useUnreadCount.ts   # Real-time unread counter (Supabase subscription)
  lib/
    supabase.ts         # Cliente Supabase (browser, auth persistLocalStorage)
    coach.ts            # Whitelist de emails autorizados
    activity.ts         # Feed de actividade (fetch + real-time subscriptions)
    messenger.ts        # Conversas e mensagens (CRUD + real-time)
  types/
    database.ts         # Interfaces TS do schema
  pages/
    Login.tsx           # Login restrito a emails de coach
    Feed.tsx            # Feed de actividade agregado (alertas, mensagens, checkins)
    Messenger.tsx       # Lista de conversas com search e filtros
    Chat.tsx            # Interface de chat completa com historico
    Clients.tsx         # Directorio unificado de clientes (Vitalis + Aurea)
    ClientDetail.tsx    # Perfil individual com stats, intake, checkins, conversas
    Summary.tsx         # Dashboard com KPIs e insights diarios
  styles/
    app.css             # Tailwind + custom theme (dark purple)
  assets/
supabase/
  hub_controlo_rls.sql  # RLS policies para acesso coach
public/
  manifest.json         # PWA manifest
projects/               # Documentacao dos produtos (ANIMA.md, SETE-ECOS.md, Os-Sete-Veus.md, PITCH.md)
```

### Comandos
```bash
npm run dev       # Dev server (Vite, port 5173)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

---

## Tabelas que o HUB Acede

O HUB liga-se ao mesmo Supabase de todos os produtos. As tabelas que o HUB le/escreve directamente:

### Tabelas de uso directo pelo HUB

| Tabela | Produto | Operacoes | Ficheiro |
|--------|---------|-----------|----------|
| users | Partilhada | SELECT | activity.ts, messenger.ts, Clients.tsx, ClientDetail.tsx |
| vitalis_clients | Sete Ecos | SELECT | Clients.tsx, ClientDetail.tsx, Summary.tsx |
| vitalis_intake | Sete Ecos | SELECT | ClientDetail.tsx |
| vitalis_checkins | Sete Ecos | SELECT | activity.ts, ClientDetail.tsx, Summary.tsx |
| vitalis_alerts | Sete Ecos | SELECT, UPDATE | activity.ts, Summary.tsx |
| aurea_clients | Sete Ecos | SELECT | Clients.tsx |
| messenger_conversations | Partilhada | SELECT, UPDATE | messenger.ts, Clients.tsx, Summary.tsx |
| messenger_messages | Partilhada | SELECT, INSERT, UPDATE | messenger.ts, activity.ts |

### Real-time Subscriptions

| Canal | Tabela | Evento | Filtro | Ficheiro |
|-------|--------|--------|--------|----------|
| hub-activity | vitalis_alerts | INSERT | — | activity.ts |
| hub-activity | messenger_messages | INSERT | sender_type=eq.user | activity.ts |
| hub-activity | vitalis_checkins | INSERT | — | activity.ts |
| hub-convs | messenger_conversations | * | — | messenger.ts |
| hub-chat-{id} | messenger_messages | INSERT | conversation_id=eq.{id} | messenger.ts |
| hub-unread | messenger_conversations | UPDATE | — | useUnreadCount.ts |

---

## Os 4 Produtos da Vivianne

O HUB-CONTROLO monitoriza clientes de todos estes produtos. Todos partilham o mesmo Supabase project.

### 1. SETE ECOS (app.seteecos.com)

**O que e**: Plataforma holistica de 7 Ecos (modulos de wellness: Vitalis, Aurea, Serena, Ignis, Ventis, Ecoa, Imago) + Lumina (diagnostico gratuito) + Aurora (integracao final) + Comunidade.
**Stack**: React 18 + Vite 5 + Supabase + Tailwind + Vercel
**Mercado**: Mocambique e Portugal. Precos em MZN.
**Documentacao completa**: `projects/SETE-ECOS.md`

**Tabelas principais (85+):**
- `users` — tabela central partilhada
- `{eco}_clients` — 8 tabelas (vitalis, aurea, serena, ignis, ventis, ecoa, imago, aurora)
- `vitalis_intake` — formulario de intake (70+ campos)
- `vitalis_meal_plans` — planos alimentares gerados
- `vitalis_checkins` — check-ins diarios (peso, humor, energia, sono, agua)
- `vitalis_alerts` — alertas para a coach (6 tipos, 4 prioridades)
- `messenger_conversations` + `messenger_messages` — messenger partilhado
- `community_*` — 12 tabelas de comunidade (posts, comments, circles, etc.)
- `lumina_*` — 4 tabelas (checkins, leituras, padroes, waitlist)
- `referral_*` — 2 tabelas (codigos, usos)
- `push_subscriptions` — web push
- `whatsapp_broadcast_log` — log de broadcast WA
- `chatbot_mensagens` — log do chatbot WA
- Tabelas por eco: aurea (13), serena (8), ignis (10), ventis (9), ecoa (10), imago (11), aurora (7)

**Tiers de subscricao**: tester → trial (7 dias) → active → pending → expired → cancelled
**Pagamentos**: PayPal + M-Pesa (manual)

---

### 2. ANIMA (animamirror.com)

**O que e**: Plataforma de autoconhecimento com 5 "espelhos" conversacionais de IA (Claude): SOMA (corpo), SEREN (emocoes), LUMA (consciencia), ECHO (integracao), NEXUS (relacoes).
**Stack**: Next.js 16 + React 19 + TypeScript + Supabase + Anthropic Claude API
**Documentacao completa**: `projects/ANIMA.md`

**Tabelas (14):**
- `users` — perfil + subscricao + preferencias
- `user_journey` — progressao por fases (foundation → complete)
- `mirrors` — definicoes dos 5 espelhos
- `conversations` — sessoes de chat com mirrors
- `messages` — mensagens com metadata IA (tokens, padroes)
- `user_patterns` — padroes emocionais detectados (22 tipos)
- `user_insights` — breakthroughs e insights
- `subscription_events` — log PayPal
- `daily_usage` — analytics diarios
- `mirror_sessions` — 35 sessoes estruturadas (7 x 5 mirrors)
- `user_sessions` — progresso individual nas sessoes
- `user_streaks` — streaks diarios
- `milestones` + `user_milestones` — achievements
- `duo_invites` — convites para jornada partilhada

**Tiers**: free (10 msgs/mes) → essencial (19 EUR) → relacional (29 EUR) → duo (39 EUR) → profundo (49 EUR)
**Pagamentos**: PayPal Subscriptions

---

### 3. Os Sete Veus (os7veus.com)

**O que e**: Plataforma de leitura transformativa. 7 Espelhos (ficcao interior) + 7 Nos (ficcao relacional, desbloqueia ao completar Espelho) + Ecos (comunidade anonima). Livros com leitura sequencial desbloqueavel.
**Stack**: Next.js + Supabase
**Autora**: Vivianne dos Santos
**Documentacao completa**: `projects/Os-Sete-Véus.md`

**Tabelas (20+):**
- `profiles` — perfil com flags de acesso (has_book_access, has_mirrors_access, has_audiobook_access, has_early_access, is_admin)
- `reading_progress` — capitulos lidos (gate para Nos)
- `checklist_progress` — itens de checklist por capitulo
- `journal_entries` — diario pessoal por capitulo
- `livro_codes` — codigos LIVRO-XXXXX para acesso
- `livro_code_requests` — pedidos de codigo (revisao manual)
- `payments` — pagamentos (bank_transfer, mpesa, paypal)
- `purchases` — acessos concedidos
- `access_types` — tipos de produto/acesso
- `special_links` — links especiais de acesso directo
- `admin_notifications` — notificacoes para admin
- `reflexoes` — reflexoes pessoais por capitulo/veu
- `ecos` — reflexoes anonimas na comunidade (expiram em 30 dias)
- `reconhecimentos` — "reconheco-me" (likes intimos)
- `sussurros` — mensagens efemeras de uma via (expiram em 7 dias)
- `marcas` — frases ao completar veu (expiram em 90 dias)
- `circulos` + `circulo_membros` + `circulo_fragmentos` — grupos temporarios por veu
- `fogueiras` + `fogueira_faiscas` — sessoes de contemplacao colectiva
- `diario_espelho` — interaccoes IA do journal
- `ecos_guardados` — bookmarks de ecos

**Precos Espelhos**: $29 individual, $69 pack 3, $149 jornada completa (7)
**Precos Nos**: $12 individual (incluido em packs)
**Publicado**: Espelho da Ilusao + No da Heranca. Restantes: Marco-Agosto 2026.

---

### 4. PITCH (Play. Interact. Think. Challenge. Hone.)

**O que e**: Plataforma de aprendizagem adaptativa para criancas com necessidades especiais. Construida para o Breno (12 anos, espectro autista). 4 campos (Linguagem, Matematica, Descoberta, Autonomia), 20 actividades, motor adaptativo, deteccao de frustracao.
**Stack**: React 18 + Vite + Supabase + PWA (offline-first)
**Documentacao completa**: `projects/PITCH.md`

**Tabelas (2):**
- `user_data` — perfis + progresso numa unica row JSONB por user
- `profile_shares` — partilha de perfis familia→terapeuta via codigo de 6 chars

**Tiers**: Semente (gratis, 1 perfil, 4 actividades) → Flor (5,99 EUR/mes, 5 perfis) → Floresta (14,99 EUR/mes, 20 perfis)
**Pagamento**: PayPal (client-side apenas, sem webhooks server-side)

---

## Dados que a Vivianne Precisa de Ver por Cliente

### Por produto — Sete Ecos
- Perfil: email, nome, genero, tier, status, data de inicio
- Fase actual do Vitalis (inducao → manutencao)
- Peso: inicial, actual, meta, IMC
- Ultimos check-ins (peso, humor, energia, sono, agua)
- Plano alimentar activo
- Alertas pendentes
- Conversas no messenger
- Gamificacao por eco (nivel, badges, streaks)
- Actividade na comunidade

### Por produto — ANIMA
- Tier e status da subscricao
- Fase da jornada (foundation → complete)
- Conversas por mirror (SOMA, SEREN, LUMA, ECHO, NEXUS)
- Sessoes completadas (de 35 estruturadas)
- Padroes emocionais detectados pela IA
- Insights e breakthroughs
- Streaks e milestones
- Uso diario (mensagens, tokens)

### Por produto — Os Sete Veus
- Flags de acesso (livro, espelhos, audiobook, early access)
- Progresso de leitura (capitulos completados por espelho/no)
- Diario pessoal (journal entries)
- Pagamentos (status pendentes a confirmar)
- Codigos usados
- Actividade na comunidade (ecos, reconhecimentos)

### Por produto — PITCH
- Perfis de criancas (via profile_shares aceites)
- Niveis de competencia por campo (1-10)
- Fase narrativa (Germinar, Estruturar, Florescer, Sustentar)
- Estrelas, streaks, actividades completadas
- Configuracoes sensoriais e de atencao
- Ultima sincronizacao

---

## Alertas que Devem Chegar ao HUB

### Sete Ecos
- Novo pagamento (PayPal ou M-Pesa pendente)
- Trial a expirar (-3, -1, 0 dias)
- Inactividade (sem check-in ha 7+ dias)
- Meta de peso atingida
- Novo cliente
- Erro na geracao de plano
- Cancelamento de subscricao

### ANIMA
- Novo registo / upgrade / downgrade de tier
- Cancelamento ou falha de pagamento PayPal
- Inactividade (last_session_date > 7 dias)
- Fase completada / jornada completa
- Insight de breakthrough
- Streak quebrado

### Os Sete Veus
- Novo pagamento pendente (precisa confirmacao manual)
- Comprovativo enviado (pronto para rever)
- Pedido de codigo LIVRO (precisa aprovacao)
- Codigo resgatado / link especial usado
- Novo membro registado
- Espelho completado (potencial para No)

### PITCH
- Nova partilha pendente (familia gerou codigo)
- Inactividade prolongada (dados nao actualizados)
- Partilha revogada
- Novo nivel atingido

---

## KPIs para o Dashboard

### Globais
- Total de clientes activos (todos os produtos)
- Receita mensal (MRR) agregada
- Mensagens nao lidas no messenger
- Alertas pendentes

### Sete Ecos
- Clientes activos por eco e tier
- Check-ins hoje / esta semana
- Receita MRR: COUNT por tier x preco (MZN)
- Taxa de retencao (30 dias)
- Churn mensal

### ANIMA
- Clientes por tier e fase
- Sessoes completadas esta semana
- Mensagens/tokens esta semana
- Streaks medios
- Padroes mais comuns
- Mirrors mais usados

### Os Sete Veus
- Leitoras activas (reading_progress recente)
- Capitulos lidos esta semana
- Receita pendente vs confirmada
- Codigos/pagamentos pendentes
- Ecos activos na comunidade
- Progressao entre veus

### PITCH
- Criancas activas (profile_shares com updated_at recente)
- Nivel medio por campo
- Actividades mais completadas
- Distribuicao por fase (Germinar/Estruturar/Florescer/Sustentar)

---

## O Que Falta Implementar no HUB

### Prioritario
- [ ] Integracao com ANIMA (ler tabelas do ANIMA: users, user_journey, conversations, user_patterns, user_sessions, user_streaks)
- [ ] Integracao com Os Sete Veus (ler tabelas: profiles, reading_progress, payments, livro_code_requests)
- [ ] Integracao com PITCH (ler tabelas: profile_shares, user_data)
- [ ] Dashboard de KPIs com graficos (actualmente so contadores basicos)
- [ ] Gestao de alertas (marcar como lido/resolvido, vista de detalhe)
- [ ] Pagina de settings

### Messenger
- [ ] Upload de media (imagens, audio, ficheiros)
- [ ] Edicao/eliminacao de mensagens
- [ ] Conversas arquivadas
- [ ] Pesquisa dentro de mensagens
- [ ] Indicadores de digitacao
- [ ] Read receipts

### Clientes
- [ ] Vista unificada cross-produto (um cliente pode estar em multiplos produtos)
- [ ] Graficos de evolucao (peso, engagement, progresso)
- [ ] Historico de accoes/eventos por cliente
- [ ] Notas da coach por cliente
- [ ] Bulk operations

### Tecnico
- [ ] Error boundaries
- [ ] Caching / estado global (considerar Zustand)
- [ ] Paginacao na UI
- [ ] Offline support
- [ ] Testes
- [ ] Error logging/reporting

---

## Convencoes de Codigo

- TypeScript strict
- Tailwind utility-first, dark theme unico (sem light mode)
- Custom colors: hub-bg (#0F0F1A), hub-surface, hub-accent, hub-text, hub-muted
- Mobile-first (max-w-lg container)
- Portugues em toda a UI (pt-PT)
- date-fns para formatacao de datas
- Lucide React para icons
- Supabase queries directas (sem ORM, sem abstraction layer)
- Real-time via Supabase channels
- Estado local via useState/useContext (sem state library)

---

## Queries SQL Uteis

```sql
-- Clientes activos Sete Ecos (ultimos 7 dias)
SELECT u.email, vc.subscription_status, vc.fase_actual, vc.peso_actual
FROM users u
JOIN vitalis_clients vc ON vc.user_id = u.id
WHERE vc.subscription_status IN ('active', 'trial', 'tester');

-- Clientes ANIMA activos
SELECT u.email, u.subscription_tier, uj.current_phase, us.current_streak
FROM users u
JOIN user_journey uj ON uj.user_id = u.id
LEFT JOIN user_streaks us ON us.user_id = u.id
WHERE u.subscription_status = 'active';

-- Leitoras Sete Veus activas (ultima semana)
SELECT p.email, COUNT(rp.id) as capitulos_lidos
FROM profiles p
JOIN reading_progress rp ON rp.user_id = p.id
WHERE rp.completed = true AND rp.updated_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.email;

-- Criancas PITCH com partilha aceite
SELECT ps.share_code, ps.profile_data->>'name' as nome,
  ps.progress_data->>'totalStars' as estrelas,
  ps.updated_at
FROM profile_shares ps
WHERE ps.status = 'accepted' AND ps.role = 'therapist';

-- MRR Sete Ecos
SELECT subscription_status, COUNT(*) as n,
  CASE subscription_status
    WHEN 'active' THEN COUNT(*) * 2500
    ELSE 0
  END as mrr_mzn
FROM vitalis_clients
GROUP BY subscription_status;

-- Mensagens nao lidas
SELECT COUNT(*) FROM messenger_conversations WHERE unread_coach > 0;

-- Alertas pendentes
SELECT tipo_alerta, COUNT(*) FROM vitalis_alerts WHERE status = 'pendente' GROUP BY tipo_alerta;
```

---

## RLS Policies do HUB

Definidas em `supabase/hub_controlo_rls.sql`:

```sql
-- Funcao central de autorizacao
CREATE OR REPLACE FUNCTION is_coach() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid())
    IN ('viv.saraiva@gmail.com', 'vivnasc@gmail.com', 'vivianne.saraiva@outlook.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: Coach sees all / updates all em:
-- messenger_conversations (SELECT, UPDATE)
-- messenger_messages (SELECT, INSERT com sender_type='coach', UPDATE)
-- users (SELECT)
-- vitalis_clients (SELECT)
-- vitalis_intake (SELECT)
-- vitalis_alerts (SELECT, UPDATE)
-- vitalis_checkins (SELECT)
-- aurea_clients (SELECT, condicional)
```

**Nota**: Para integrar ANIMA, Os Sete Veus e PITCH, serao necessarias policies `is_coach()` adicionais nas tabelas desses produtos.
