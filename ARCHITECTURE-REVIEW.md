# HUB-CONTROLO — Review de Arquitectura

**Data**: 24 Fev 2026
**Branch**: claude/review-architecture-Q2omD

---

## O Problema

A Vivianne tem 4 produtos digitais activos, cada um com o **seu próprio Supabase e Vercel**. Precisa de uma cabine de pilotagem (PWA) que:

1. **Messenger** — clientes escrevem dentro do Sete Ecos, ela responde pelo HUB. Substitui o WhatsApp.
2. **Feed em tempo real** — tudo o que acontece nos 4 produtos aparece aqui.
3. **Acções rápidas** — lembrar cliente, dar feedback, ver perfil — tudo com um toque.
4. **Resumo diário** — quem registou, quem não registou, quem precisa de atenção.
5. **Autenticação exclusiva** — só ela entra.

---

## Facto Crítico: 4 Supabase Independentes

Cada produto tem o seu **próprio projecto Supabase** com o seu próprio auth, as suas próprias tabelas, e os seus próprios IDs de utilizador. Isto significa:

- **Não há JOINs directos** entre produtos
- **user_id é diferente** em cada projecto — o mesmo email tem IDs diferentes
- **Match entre produtos é por email** (único campo comum)
- O HUB precisa de **4 clientes Supabase** (um por produto)
- O HUB autentica a Vivianne **no Supabase do Sete Ecos** (o principal) e usa as **anon keys** dos outros para queries read-only
- **Real-time** funciona apenas nos Supabase onde a Vivianne tem sessão (Sete Ecos para já)
- Para real-time nos outros produtos: ou a Vivianne tem conta coach em cada Supabase, ou usamos polling

### Implicações na arquitectura

| Aspecto | Antes (1 Supabase) | Agora (4 Supabase) |
|---------|--------------------|--------------------|
| Queries | 1 client, JOINs | 4 clients, merge no frontend |
| Auth | 1 login | 1 login principal + anon keys |
| Real-time | Channels em tudo | Channels no Sete Ecos, polling nos outros |
| Clientes unificados | JOIN por user_id | Merge por email |
| Env vars | 2 (URL + key) | 8 (2 por produto) |
| RLS | is_coach() num sítio | is_coach() em 4 sítios |

---

## Estado Actual (~1,450 LOC)

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
| **Só 1 Supabase client** | Não liga aos outros 3 produtos |
| **Messenger só texto** | Sem imagens, áudio, ficheiros |
| **Feed só Sete Ecos** | Não vê eventos de ANIMA/Véus/PITCH |
| **Sem alertas accionáveis** | Aparece no feed mas não se pode marcar lido/resolvido |
| **Sem KPIs de receita** | MRR não calculado |
| **Sem gráficos** | Tudo é texto e contadores |
| **Sem resumo diário** | Não existe o "resumo às 20h" |
| **Sem notas da coach** | Não pode guardar notas por cliente |
| **Sem paginação** | Tudo carrega de uma vez |
| **Sem error handling** | Real-time falha silenciosamente |

---

## Arquitectura Alvo

### Princípios

1. **4 clients, 1 interface** — um Supabase client por produto, dados fundidos no frontend
2. **Email = chave universal** — é o único campo que liga um cliente entre produtos
3. **Sete Ecos é o "principal"** — auth, messenger e real-time vivem aqui
4. **Outros são read-only** — o HUB lê dados de ANIMA, Véus e PITCH mas não escreve
5. **Mobile-first** — tudo funciona no telemóvel da Vivianne

### Env vars necessárias

```env
# Sete Ecos (principal — auth + messenger + real-time)
VITE_SUPABASE_URL=https://vvvdtogvlutrybultffx.supabase.co
VITE_SUPABASE_ANON_KEY=...

# ANIMA (read-only)
VITE_ANIMA_SUPABASE_URL=https://XXXX.supabase.co
VITE_ANIMA_SUPABASE_ANON_KEY=...

# Os Sete Véus (read-only)
VITE_VEUS_SUPABASE_URL=https://XXXX.supabase.co
VITE_VEUS_SUPABASE_ANON_KEY=...

# PITCH (read-only)
VITE_PITCH_SUPABASE_URL=https://XXXX.supabase.co
VITE_PITCH_SUPABASE_ANON_KEY=...
```

### Multi-client Supabase

```typescript
// lib/supabase.ts — expandido para 4 clients

// Principal (Sete Ecos) — auth + full access
export const supabase = createClient(SETE_ECOS_URL, SETE_ECOS_KEY, {
  auth: { persistSession: true, storageKey: 'hub-auth' }
})

// ANIMA — read-only, sem auth próprio
export const animaDb = createClient(ANIMA_URL, ANIMA_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// Os Sete Véus — read-only, sem auth próprio
export const veusDb = createClient(VEUS_URL, VEUS_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// PITCH — read-only, sem auth próprio
export const pitchDb = createClient(PITCH_URL, PITCH_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
```

**NOTA IMPORTANTE sobre RLS:**
- Sem auth nos clients secundários, as queries usam a **anon key**
- As tabelas precisam de ter **RLS policies que permitam leitura pela anon key** OU
- A Vivianne precisa de ter **conta coach criada em cada Supabase** e fazer sign-in em todos
- **Alternativa mais simples**: Criar uma policy `is_hub_read()` que permita SELECT pela anon key com um header custom, ou usar **service role key** (menos seguro mas funcional)

### A melhor abordagem para RLS cross-project

**Opção A — Service Role Key (simples, menos seguro):**
- Usar a service_role key de cada projecto no HUB
- Bypassa RLS completamente
- Risco: se a key vazar, acesso total
- OK para uma app que só a Vivianne usa

**Opção B — Conta coach em cada Supabase (mais seguro):**
- Criar conta com email da Vivianne em cada Supabase
- Sign-in em paralelo nos 4 clients no login do HUB
- Cada projecto tem policy is_coach() que reconhece o email
- Mais seguro, mais complexo

**Opção C — API intermediária (mais robusto):**
- Criar edge functions em cada Supabase que servem dados para o HUB
- O HUB chama as functions com um token/secret
- Melhor separação, mais trabalho inicial

**Recomendação**: Opção B para começar — é segura e não precisa de infra extra. A Vivianne faz login uma vez, o HUB autentica nos 4 Supabase em paralelo.

---

## Rotas

```
/login              → Login.tsx (auth nos 4 Supabase)
/                   → Feed.tsx (feed universal)
/messenger          → Messenger.tsx (lista de conversas — Sete Ecos)
/messenger/:id      → Chat.tsx (chat individual)
/clients            → Clients.tsx (directório unificado cross-produto)
/clients/:email     → ClientDetail.tsx (perfil por email, não por ID)
/summary            → Summary.tsx (KPIs dos 4 produtos)
```

**Nota**: ClientDetail usa `:email` em vez de `:id` porque o ID é diferente em cada Supabase. O email é a chave universal.

---

## Estrutura de ficheiros

```
src/
  App.tsx
  main.tsx
  components/
    Shell.tsx                    # Layout + bottom nav
    ProductBadge.tsx             # Badge: Sete Ecos / ANIMA / Véus / PITCH
  contexts/
    AuthContext.tsx               # Auth nos 4 Supabase + isCoach guard
  hooks/
    useUnreadCount.ts            # Mantém (Sete Ecos)
  lib/
    supabase.ts                  # 4 Supabase clients
    coach.ts                     # Mantém
    activity.ts                  # Feed: Sete Ecos (real-time) + outros (polling)
    messenger.ts                 # Mantém (só Sete Ecos)
    anima.ts                     # NOVO — queries read-only ao Supabase ANIMA
    sete-veus.ts                 # NOVO — queries read-only ao Supabase Véus
    pitch.ts                     # NOVO — queries read-only ao Supabase PITCH
    clients.ts                   # NOVO — merge de clientes por email
  types/
    database.ts                  # Expandir com tipos ANIMA, Véus, PITCH
  pages/
    Login.tsx                    # Auth multi-Supabase
    Feed.tsx                     # Feed universal
    Messenger.tsx                # Mantém
    Chat.tsx                     # Mantém
    Clients.tsx                  # Directório unificado
    ClientDetail.tsx             # Perfil cross-produto (por email)
    Summary.tsx                  # KPIs dos 4 produtos
  styles/
    app.css
```

---

## Como funciona o merge de clientes por email

```typescript
// lib/clients.ts

interface UnifiedClient {
  email: string
  nome: string | null
  produtos: ('sete_ecos' | 'anima' | 'veus' | 'pitch')[]

  seteEcos?: {
    user_id: string
    status: string
    fase_actual: string
    peso_actual: number | null
    peso_meta: number | null
    ultimo_checkin: string | null
    alertas_pendentes: number
  }

  anima?: {
    user_id: string
    tier: string
    current_phase: string
    total_conversations: number
    current_streak: number
    last_session_date: string | null
  }

  veus?: {
    user_id: string
    has_book_access: boolean
    has_mirrors_access: boolean
    capitulos_lidos: number
    pagamentos_pendentes: number
  }

  pitch?: {
    user_id: string
    criancas: number
    ultima_sync: string | null
  }
}

async function getAllClients(): Promise<UnifiedClient[]> {
  // Fetch em paralelo dos 4 Supabase
  const [seteEcosClients, animaClients, veusClients, pitchClients] =
    await Promise.all([
      fetchSeteEcosClients(),   // supabase.from('users')...
      fetchAnimaClients(),       // animaDb.from('users')...
      fetchVeusClients(),        // veusDb.from('profiles')...
      fetchPitchClients(),       // pitchDb.from('profile_shares')...
    ])

  // Merge por email
  const byEmail = new Map<string, UnifiedClient>()

  for (const c of seteEcosClients) {
    const existing = byEmail.get(c.email) || createEmpty(c.email)
    existing.nome = existing.nome || c.nome
    existing.seteEcos = c
    existing.produtos.push('sete_ecos')
    byEmail.set(c.email, existing)
  }

  // ... mesmo para anima, veus, pitch

  return Array.from(byEmail.values())
}
```

---

## Feed Universal

### Sete Ecos — Real-time (WebSockets)
Funciona como hoje: subscriptions em vitalis_alerts, messenger_messages, vitalis_checkins.

### ANIMA, Véus, PITCH — Polling (30s interval)
Sem auth real-time nos Supabase secundários, usamos polling:

```typescript
// Fetch eventos recentes a cada 30 segundos
useEffect(() => {
  const interval = setInterval(async () => {
    const animaEvents = await fetchAnimaRecentEvents()  // últimos 5 min
    const veusEvents = await fetchVeusRecentEvents()
    const pitchEvents = await fetchPitchRecentEvents()
    mergeIntoFeed(animaEvents, veusEvents, pitchEvents)
  }, 30_000)
  return () => clearInterval(interval)
}, [])
```

**No futuro**: se a Vivianne tiver conta coach em cada Supabase, pode-se activar real-time em todos.

---

## RLS — O que precisa de ser criado

### Em cada Supabase secundário (ANIMA, Véus, PITCH)

A função `is_coach()` precisa de existir em cada projecto:

```sql
-- Correr no SQL Editor de CADA Supabase (ANIMA, Véus, PITCH)
CREATE OR REPLACE FUNCTION is_coach() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) IN ('viv.saraiva@gmail.com', 'vivnasc@gmail.com', 'vivianne.saraiva@outlook.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Depois, policies SELECT em todas as tabelas que o HUB precisa de ler.

**SQL completo por produto**: ver ficheiro `supabase/hub_rls_anima.sql`, `supabase/hub_rls_veus.sql`, `supabase/hub_rls_pitch.sql` (a criar).

---

## O que a Vivianne precisa de fornecer

Antes de eu poder escrever código que funcione:

### 1. URLs e Anon Keys dos outros Supabase

| Produto | Preciso de |
|---------|-----------|
| ANIMA | SUPABASE_URL + ANON_KEY |
| Os Sete Véus | SUPABASE_URL + ANON_KEY |
| PITCH | SUPABASE_URL + ANON_KEY |

### 2. Conta coach nos outros Supabase

A Vivianne precisa de ter uma conta (mesmo email: viv.saraiva@gmail.com) criada nos Supabase de:
- ANIMA
- Os Sete Véus
- PITCH

### 3. Correr SQL em cada Supabase

A função `is_coach()` e as policies de SELECT precisam de existir em cada projecto.

### 4. Confirmar tabelas (opcional)

Se quiser, correr `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` em cada Supabase para confirmar que as tabelas documentadas existem.

---

## Plano de Implementação

### Fase 0 — Setup (a Vivianne faz)
1. Fornecer URLs + anon keys dos 3 Supabase secundários
2. Criar conta coach em cada Supabase (se não existir)
3. Correr SQL das policies is_coach() em cada Supabase

### Fase 1 — Multi-client + Types (eu faço)
1. Expandir `lib/supabase.ts` para 4 clients
2. Expandir `types/database.ts` com interfaces ANIMA, Véus, PITCH
3. Criar `lib/anima.ts`, `lib/sete-veus.ts`, `lib/pitch.ts`
4. Criar `lib/clients.ts` (merge por email)
5. Actualizar `AuthContext.tsx` para multi-auth

### Fase 2 — Feed Universal
1. Reescrever `lib/activity.ts` (Sete Ecos real-time + polling dos outros)
2. Reescrever `Feed.tsx` com filtros por produto

### Fase 3 — Clientes Cross-Produto
1. Reescrever `Clients.tsx` com dados dos 4 produtos
2. Reescrever `ClientDetail.tsx` por email (secções por produto)

### Fase 4 — Dashboard
1. Reescrever `Summary.tsx` com KPIs dos 4 produtos

### Fase 5 — Polish
1. Error boundaries
2. Paginação
3. Messenger melhorado (media)
