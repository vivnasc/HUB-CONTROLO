# PITCH — Play. Interact. Think. Challenge. Hone.

## Descricao

Plataforma de aprendizagem adaptativa para criancas com necessidades especiais.
Construida originalmente para o Breno (12 anos, espectro autista, homeschooling).
O objectivo e fornecer um curriculo gamificado em 4 campos (Linguagem, Matematica, Descoberta, Autonomia) com motor adaptativo que personaliza dificuldade, UI e deteccao de frustracao por crianca.

## Visao Geral

- **Stack**: React 18 + React Router 6 + Vite + Workbox PWA + Supabase
- **Backend**: Supabase (Auth, Postgres) — client-only ate agora, backend em evolucao
- **Dependencias externas**: react, react-dom, react-router-dom, @paypal/react-paypal-js, @supabase/supabase-js (producao)
- **Persistencia**: Supabase (cloud) + localStorage/IndexedDB (offline fallback)
- **Audio**: Web Speech API nativa (TTS + STT)
- **Styling**: CSS Variables + inline styles React (sem framework CSS)
- **Offline**: PWA com service worker + CacheFirst para imagens + sync quando online

## Supabase

- **Project ID**: vvvdtogvlutrybultffx (a confirmar — nao ha referencia directa no codigo; definido via env var `VITE_SUPABASE_URL`)
- **Client**: `src/lib/supabase.js` — cria cliente com `createClient()`, null se env vars nao existirem
- **Tabelas partilhadas com outros produtos**: nenhuma identificada neste repo (app standalone)

### Env vars

```
VITE_SUPABASE_URL         — URL do projecto Supabase
VITE_SUPABASE_ANON_KEY    — Chave publica (anon key)
```

### Servicos Supabase utilizados (implementados no codigo)

| Servico | Estado | Ficheiro |
|---------|--------|----------|
| Auth (email/password) | Implementado | `src/hooks/useAuth.js` |
| Auth (magic link / OTP) | Implementado | `src/hooks/useAuth.js` |
| Auth (Google, Apple) | Mencionado no CLAUDE.md original, NAO implementado no codigo | — |
| Database (Postgres) | Implementado (2 tabelas) | `src/hooks/useSync.js`, `src/hooks/useProfileSharing.js` |
| Realtime | NAO implementado (zero `.channel()` no codigo) | — |
| Edge Functions | NAO implementado (zero ficheiros em `supabase/functions/`) | — |
| Storage | NAO implementado (zero `.storage` no codigo) | — |

## Tabelas

### user_data

**Para que serve:** Armazena todos os perfis e progresso de um utilizador numa unica linha JSONB. Uma row por user.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK -> auth.users(id) ON DELETE CASCADE. UNIQUE. |
| profiles | jsonb | nao | '[]'::jsonb | Array de perfis de criancas (nome, idade, avatar, learningNeeds, competencyLevels, sensory, attention, etc.) |
| active_profile_id | text | sim | — | ID do perfil activo no momento |
| progress | jsonb | nao | '{}'::jsonb | Objecto com totalStars, streakDays, activitiesCompleted, wordsLearned, trophies, etc. |
| updated_at | timestamptz | nao | now() | Auto-updated via trigger |
| created_at | timestamptz | nao | now() | — |

**RLS policies:**
- `Users can read own data` — SELECT WHERE auth.uid() = user_id
- `Users can insert own data` — INSERT WITH CHECK auth.uid() = user_id
- `Users can update own data` — UPDATE WHERE auth.uid() = user_id
- `Users can delete own data` — DELETE WHERE auth.uid() = user_id

**Indices:**
- `idx_user_data_user_id` ON user_data(user_id)

**Usado em:**
- `src/hooks/useSync.js:28` — SELECT profiles, active_profile_id, progress, updated_at (pull from cloud on login)
- `src/hooks/useSync.js:68` — UPSERT user_id, profiles, active_profile_id, progress, updated_at (push to cloud, onConflict: user_id)

---

### profile_shares

**Para que serve:** Permite familias partilhar o perfil de uma crianca com terapeutas/educadores via codigo de 6 caracteres. O terapeuta insere o codigo e acede ao perfil (read-only snapshot mantido em sync pelo owner).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| owner_id | uuid | nao | — | FK -> auth.users(id) ON DELETE CASCADE. Quem partilha. |
| share_code | text | nao | — | UNIQUE. Codigo alfanumerico de 6 chars (sem I/O/0/1 para evitar ambiguidade). |
| profile_id | text | nao | — | ID local do perfil no dispositivo do owner |
| profile_data | jsonb | nao | '{}'::jsonb | Snapshot do perfil (nome, idade, niveis, configs sensoriais, etc.) |
| progress_data | jsonb | nao | '{}'::jsonb | Snapshot do progresso (estrelas, actividades, palavras, streak, etc.) |
| shared_with_id | uuid | sim | — | FK -> auth.users(id) ON DELETE SET NULL. Quem aceitou (null ate aceitar). |
| role | text | nao | 'therapist' | Papel do recipiente: 'therapist', 'family', 'teacher' |
| status | text | nao | 'pending' | Estado: 'pending' (codigo gerado), 'accepted' (ligado), 'revoked' (owner cancelou) |
| created_at | timestamptz | nao | now() | — |
| accepted_at | timestamptz | sim | — | Timestamp de quando o recipiente aceitou |
| updated_at | timestamptz | nao | now() | Auto-updated via trigger |

**Constraint UNIQUE:** (owner_id, profile_id) — um share por perfil por owner.

**RLS policies:**
- `Owners can read own shares` — SELECT WHERE auth.uid() = owner_id
- `Recipients can read accepted shares` — SELECT WHERE auth.uid() = shared_with_id
- `Anyone can read by share code` — SELECT WHERE status = 'pending' (permite encontrar o share para aceitar)
- `Owners can create shares` — INSERT WITH CHECK auth.uid() = owner_id
- `Owners can update own shares` — UPDATE WHERE auth.uid() = owner_id
- `Recipients can accept shares` — UPDATE WHERE status = 'pending' WITH CHECK auth.uid() = shared_with_id
- `Owners can delete own shares` — DELETE WHERE auth.uid() = owner_id

**Indices:**
- `idx_profile_shares_owner` ON profile_shares(owner_id)
- `idx_profile_shares_recipient` ON profile_shares(shared_with_id)
- `idx_profile_shares_code` ON profile_shares(share_code)

**Usado em:**
- `src/hooks/useProfileSharing.js:54` — SELECT * WHERE owner_id = user.id AND status != 'revoked' (load my shares)
- `src/hooks/useProfileSharing.js:73` — SELECT * WHERE shared_with_id = user.id AND status = 'accepted' (load shared with me)
- `src/hooks/useProfileSharing.js:118` — INSERT owner_id, share_code, profile_id, profile_data, progress_data, role, status (create share)
- `src/hooks/useProfileSharing.js:196` — SELECT * WHERE share_code = X AND status = 'pending' (find share to accept)
- `src/hooks/useProfileSharing.js:217` — UPDATE shared_with_id, status='accepted', accepted_at (accept share)
- `src/hooks/useProfileSharing.js:257` — UPDATE profile_data, progress_data (push updated data to shared entry)
- `src/hooks/useProfileSharing.js:284` — UPDATE status='revoked' WHERE id = X AND owner_id = user.id (revoke share)

### Relacoes entre tabelas

- `user_data.user_id` -> `auth.users.id` (ON DELETE CASCADE)
- `profile_shares.owner_id` -> `auth.users.id` (ON DELETE CASCADE)
- `profile_shares.shared_with_id` -> `auth.users.id` (ON DELETE SET NULL)

Nota: `user_data` e `profile_shares` nao tem FK entre si. A ligacao e feita pelo `profile_id` (text) que e o ID local do perfil dentro do JSONB `user_data.profiles`.

## Funcoes SQL

- **`update_updated_at()`** — Trigger function (plpgsql). Actualiza `NEW.updated_at = now()` antes de cada UPDATE.
  - Trigger `user_data_updated_at` ON user_data BEFORE UPDATE
  - Trigger `profile_shares_updated_at` ON profile_shares BEFORE UPDATE

## Funcoes RPC

Nenhuma funcao RPC implementada. Zero chamadas `.rpc()` no codigo.

## Views

Nenhuma view implementada.

## Real-time Subscriptions

Nenhuma subscription realtime implementada. Zero chamadas `.channel()` no codigo.

## Auth — Fluxos implementados

**Ficheiro:** `src/hooks/useAuth.js`

| Metodo | Funcao no hook | Notas |
|--------|---------------|-------|
| signUp (email + password) | `signUp(email, password)` | `supabase.auth.signUp()` |
| signIn (email + password) | `signIn(email, password)` | `supabase.auth.signInWithPassword()` |
| signIn (magic link) | `signInWithMagicLink(email)` | `supabase.auth.signInWithOtp()` |
| signOut | `signOut()` | `supabase.auth.signOut()` |
| getSession (auto-login) | useEffect on mount | `supabase.auth.getSession()` |
| onAuthStateChange | useEffect on mount | Listener para mudancas de sessao |

**Nota:** OAuth (Google, Apple) mencionado na documentacao original mas NAO implementado no codigo.

## Sync Offline (useSync.js)

- App funciona offline com dados locais (localStorage/IndexedDB)
- **Pull on login**: Busca `user_data` do Supabase ao autenticar
- **Push on change**: Envia dados locais para Supabase com debounce de 2s
- **Push on reconnect**: `window.addEventListener('online')` dispara push
- **Push on visibility**: `visibilitychange` event dispara push quando o user regressa ao tab
- **Throttle**: Maximo 1 push a cada 3 segundos
- **Conflitos**: "Last write wins" (sem merge campo a campo — o ultimo push completo ganha)

## Fluxos importantes para a Coach (HUB-CONTROLO)

### Dados por cliente (crianca)

A coach Vivianne pode aceder a dados de clientes via `profile_shares`. Quando uma familia partilha o perfil com a coach (role='therapist'), a coach ve:

**Do `profile_data` (JSONB snapshot dentro de `profile_shares`):**
- Nome e idade da crianca
- Avatar e universo tematico escolhido
- Necessidades de aprendizagem (areas, nivel de leitura, nivel de apoio)
- Niveis de competencia por campo (campo1-4, cada um de 1 a 10)
- Configuracoes sensoriais (som, animacoes, contraste, tamanho de texto)
- Configuracoes de atencao (duracao de sessao, sensibilidade a frustracao)
- Equipa favorita e objectivos definidos pelos pais

**Do `progress_data` (JSONB snapshot dentro de `profile_shares`):**
- Total de estrelas ganhas
- Dias consecutivos (streak)
- Actividades completadas (mapa de activityId -> dados)
- Palavras aprendidas em ingles (array)
- Trofeus conquistados

**De `profile_shares` directamente:**
- `status`: se a partilha esta pendente, aceite ou revogada
- `created_at`: quando a familia gerou o codigo
- `accepted_at`: quando a coach aceitou
- `updated_at`: ultima vez que os dados foram sincronizados pelo owner
- `role`: papel da coach (therapist/family/teacher)

### Eventos que devem gerar alerta

- **Nova partilha pendente**: `profile_shares` com `status = 'pending'` e `role = 'therapist'` (familia gerou codigo para a coach)
- **Dados actualizados**: `profile_shares.updated_at` muda (familia usou a app e os dados foram sincronizados)
- **Inactividade prolongada**: `profile_shares.updated_at` nao muda ha X dias (crianca nao usa a app)
- **Partilha revogada**: `profile_shares.status` mudou para 'revoked' (familia removeu acesso)
- **Novo nivel atingido**: comparar `profile_data.competencyLevels` entre snapshots (subida de nivel num campo)
- **Novo pagamento**: PayPal `onApprove` activa tier — neste momento e client-side apenas, guardado em `profile.subscriptionTier` dentro do JSONB. Para tracking server-side, seriam necessarios webhooks PayPal (NAO implementados).

### KPIs para o dashboard da Coach

- **Clientes activos**: COUNT de `profile_shares` com `status = 'accepted'` e `role IN ('therapist','teacher')` onde `updated_at` e recente (ex: ultimos 7 dias)
- **Clientes inactivos**: Shares aceites onde `updated_at` > 7 dias sem mudanca
- **Nivel medio por campo**: Agregar `profile_data.competencyLevels.campo1..4` de todos os shares aceites
- **Fase predominante**: Distribuicao de clientes por fase narrativa (Germinar 1-3, Estruturar 4-6, Florescer 7-8, Sustentar 9-10)
- **Actividades mais completadas**: Agregar `progress_data.activitiesCompleted` por actividade
- **Palavras aprendidas (media)**: Agregar `progress_data.wordsLearned.length`
- **Streak medio**: Agregar `progress_data.streakDays`
- **Tiers dos clientes**: Ver `profile_data.subscriptionTier` (free/family/therapist)
- **Total de clientes por tier**: COUNT shares por subscriptionTier dentro do profile_data

### Limitacoes actuais para o HUB

1. **Sem tabela dedicada de sessoes/eventos**: Nao ha tracking de quando a crianca usou a app, por quanto tempo, ou que actividades fez em cada sessao. Tudo e um snapshot acumulado.
2. **Sem tabela de pagamentos**: Pagamento PayPal e client-side; nao ha registo server-side de transaccoes.
3. **Sem realtime**: A coach nao recebe notificacoes push. Tem de fazer refresh manual (`refreshSharedProfiles()`).
4. **Dados sao snapshots**: O owner pusha dados com debounce de 5s. Se a familia nao abrir a app, os dados ficam desactualizados.
5. **Sem logs de actividade**: Nao ha historico de accoes (quando subiu de nivel, quando completou actividade X, etc.) — so o estado actual.

---

## Estrutura do Projecto

```
src/
  App.jsx                    # Router principal (20 routes de actividades + 16 paginas)
  main.jsx                   # Entry point
  lib/
    supabase.js              # Cliente Supabase (createClient ou null se sem env vars)
  components/
    ActivityShell.jsx         # Wrapper de todas as actividades (instrucoes, score, TTS)
    ActivityCard.jsx          # Card de actividade com estado locked/unlocked
    FeedbackMessage.jsx       # Feedback visual de acerto/erro
    BancoDaCalma.jsx          # Exercicio de respiracao (trigger por frustracao)
    VisualTimer.jsx           # Timer visual adaptativo
    UpgradePrompt.jsx         # Modal gentil para upgrade de plano
    PayPalSubscribeButton.jsx # Botao PayPal para subscricoes
    Layout.jsx                # Layout base com navegacao
    BreakReminder.jsx         # Lembrete de pausa
    CompletionCelebration.jsx # Celebracao ao completar actividade
    ProgressBar.jsx           # Barra de progresso
  hooks/
    useProfile.js             # Multi-perfil, localStorage, deep merge
    useProgress.js            # Stars, streaks, trofeus, actividades completadas
    useAdaptive.js            # Motor de personalizacao (30+ configs)
    useSubscription.js        # Gestao de tier (free/family/therapist)
    useTTS.js                 # Text-to-Speech (Web Speech API)
    useSTT.js                 # Speech-to-Text (Web Speech API)
    useSoundEffects.js        # Efeitos sonoros sintetizados (AudioContext)
    useFrustration.js         # Deteccao de frustracao (clicks rapidos, erros consecutivos)
    usePlanner.js             # Planeador diario (3 actividades/dia)
    useAuth.js                # Autenticacao Supabase (email, magic link)
    useProfileSharing.js      # Partilha de perfis entre familia e terapeutas
    useStorage.js             # IndexedDB wrapper + export/import backup
    useSync.js                # Sync offline-first com Supabase
  data/
    activities.js             # Registo das 20 actividades (5 por campo)
    tiers.js                  # 3 planos de subscricao (Semente, Flor, Floresta)
    competencies.js           # Framework de 10 niveis + 4 fases + diagnostico
    vocabulary.js             # 299 palavras ingles Cambridge Pre-A1 (19 categorias inc. sentimentos e social)
    universes.js              # 5 universos tematicos
    universeContent.js        # Conteudo contextualizado por universo
    brenoProfile.js           # Perfil pre-configurado do Breno
    challenges.js             # Desafios semanais rotativos
    news.js                   # Feed de noticias
    shop.js                   # 18 items cosmeticos (celebracoes, badges, stickers)
    worksheets.js             # Fichas para impressao
  pages/
    Home.jsx                  # Pagina inicial
    Welcome.jsx               # Boas-vindas
    Landing.jsx               # Landing page
    Intake.jsx                # Wizard de onboarding (12 perguntas diagnosticas)
    Dashboard.jsx             # Painel do educador (progresso detalhado)
    Progress.jsx              # Pagina de progresso
    Planner.jsx               # Planeador diario
    Definicoes.jsx            # Definicoes (perfil, sensorial, partilha, backup)
    Planos.jsx                # Pagina de pricing com FAQ e PayPal
    FAQ.jsx                   # Perguntas frequentes
    Suporte.jsx               # Suporte
    Comunidade.jsx            # Mural familiar (mensagens, conquistas, metas)
    Noticias.jsx              # Feed de noticias
    Desafios.jsx              # Desafios semanais
    Fichas.jsx                # Fichas para impressao
    Loja.jsx                  # Loja cosmetica
    SharedProfile.jsx         # Vista read-only de perfil partilhado (para terapeutas)
    Campo1Bancada.jsx         # Actividades de Linguagem
    Campo2Marcador.jsx        # Actividades de Matematica
    Campo3Mundo.jsx           # Actividades de Descoberta
    Campo4Vida.jsx            # Actividades de Autonomia
  activities/
    campo1/                   # 5 actividades de Linguagem
    campo2/                   # 5 actividades de Matematica
    campo3/                   # 5 actividades de Descoberta
    campo4/                   # 5 actividades de Autonomia
  styles/
    variables.css             # Design tokens
    global.css                # Base + a11y + print
    animations.css            # Animacoes suaves
supabase/
  migrations/
    001_initial_schema.sql    # Tabela user_data + RLS + trigger
    002_profile_shares.sql    # Tabela profile_shares + RLS + trigger
```

## Os 4 Campos

| Campo | Nome | Cor | Actividades |
|-------|------|-----|-------------|
| 1 | Linguagem e Comunicacao | #1565C0 | vocab-match, dress-player, color-kit, read-score, phonics |
| 2 | Matematica e Logica | #E65100 | goal-math, clock-reader, team-division, ticket-shop, patterns |
| 3 | Conhecimento e Descoberta | #2E7D32 | flag-match, world-explorer, body-science, weather-match, nature-lab |
| 4 | Autonomia e Vida | #6A1B9A | daily-routine, fair-play, emotion-cards, real-world, problem-solving |

## 5 Universos Tematicos

Futebol (default), Dinossauros, Espaco, Animais, Musica.
O mesmo curriculo, re-contextualizado por universo.

## Framework de Competencias

### 10 Niveis Progressivos

| Nv | Id | Label | Emoji |
|----|----|-------|-------|
| 1 | seed | Semente | 🌱 |
| 2 | root | Raiz | 🌿 |
| 3 | sprout | Broto | 🌾 |
| 4 | stem | Caule | 🪴 |
| 5 | leaf | Folha | 🍃 |
| 6 | bud | Botao | 🌷 |
| 7 | flower | Flor | 🌸 |
| 8 | fruit | Fruto | 🍎 |
| 9 | tree | Arvore | 🌳 |
| 10 | forest | Floresta | 🌲 |

### 4 Fases Narrativas (comunicacao com terapeutas/pais)

| Fase | Niveis | Significado |
|------|--------|-------------|
| Germinar | 1-3 | Exploracao, tentativa, curiosidade |
| Estruturar | 4-6 | Competencia a formar-se, menos apoio |
| Florescer | 7-8 | Autonomia emergente |
| Sustentar | 9-10 | Autonomia consolidada, pode ajudar outros |

### Diagnostico de Intake

O wizard de onboarding inclui 12 perguntas diagnosticas (3 por campo, nos tiers low/mid/high).
Cada campo recebe um nivel inicial independente (ex: nivel 7 em linguagem, nivel 3 em matematica).
Factores de ajuste: idade, nivel de leitura, nivel de apoio.

## Subscricao e Tiers

### 3 Planos

| Tier | Nome | Emoji | Preco | Perfis | Universos | Actividades |
|------|------|-------|-------|--------|-----------|-------------|
| free | Semente | 🌱 | Gratis | 1 | 1 (Futebol) | 4 (1/campo) |
| family | Flor | 🌸 | 5,99/mes | 5 | 5 (todos) | 20 (todas) |
| therapist | Floresta | 🌲 | 14,99/mes | 20 | 5 (todos) | 20 (todas) |

### Actividades Gratis (1 por campo)
- Campo 1: vocab-match
- Campo 2: goal-math
- Campo 3: flag-match
- Campo 4: daily-routine

### Principios de Monetizacao
- **Gratis funciona de verdade** — nao e demo, e 4 actividades com 10 niveis completos
- **Acessibilidade nunca e premium** — TTS, alto contraste, deteccao de frustracao, Banco da Calma
- **Zero publicidade** — publico vulneravel, sem ads
- **Zero dados vendidos**
- **Breno tem sempre acesso completo** (`subscriptionTier: 'family'` hardcoded)

### Pagamento: PayPal Subscriptions
- **Dependencia**: `@paypal/react-paypal-js` v8.9.2
- **Moeda**: EUR (Portugal e Mocambique suportados)
- **Componente**: `src/components/PayPalSubscribeButton.jsx`
- **Fluxo**: Escolher plano -> botao PayPal -> login PayPal -> aprovar -> tier activado (client-side)
- **Env vars**:
  - `VITE_PAYPAL_CLIENT_ID` — Client ID da REST App no PayPal Developer
  - `VITE_PAYPAL_PLAN_FAMILY` — Plan ID do plano Flor (5,99 EUR/mes)
  - `VITE_PAYPAL_PLAN_THERAPIST` — Plan ID do plano Floresta (14,99 EUR/mes)
- **Setup PayPal Dashboard**: Products -> Subscriptions -> criar 2 plans
- **Activacao**: `onApprove` actualiza `profile.subscriptionTier` + `paypalSubscriptionId` (client-side apenas)
- **Sem env vars**: mostra placeholder "Pagamentos PayPal em breve"
- **Webhook server-side**: NAO implementado. Sem validacao server-side de subscricoes.

### Gating
- `ActivityCard` recebe `locked` e `onLockedClick`
- Cada pagina de campo verifica `subscription.isActivityLocked(activityId, campoId)`
- Universos verificados via `subscription.isUniverseLocked(universeId)`
- Features: `subscription.hasFichas`, `subscription.hasDesafios`, `subscription.hasLoja`

## Comunidade e Familia

### Visao
A comunidade serve as criancas e as suas familias. Funcionalidades sociais sao **opcionais** — cada familia escolhe o nivel de participacao que quer.

### Mural Familiar (local)
- Mensagens de encorajamento guardadas no perfil local (`profile.encouragements`)
- Pais e terapeutas escrevem mensagens no mesmo dispositivo da crianca
- **Nota:** O mural remoto (via Supabase Realtime) NAO esta implementado. As mensagens sao locais.

### Partilha de Perfil (implementado via Supabase)
- Familia gera codigo de 6 chars -> da ao terapeuta
- Terapeuta insere o codigo -> acede ao perfil (read-only snapshot)
- Owner pusha actualizacoes automaticamente com debounce de 5s
- Terapeuta ve dados via `SharedProfile.jsx`

### Privacidade e Seguranca
- Publico vulneravel (criancas com necessidades especiais) — seguranca maxima
- RLS em todas as tabelas (users so acedem aos seus dados)
- Codigos de partilha sem caracteres ambiguos (sem I/O/0/1)
- Owner pode revogar acesso a qualquer momento
- Conformidade RGPD: export de dados disponivel nas Definicoes

## Motor Adaptativo (useAdaptive.js)

Traduz o perfil da crianca em adaptacoes concretas de UI/UX:
- **Dificuldade**: 1-3 por campo (derivada dos niveis de competencia)
- **Opcoes**: 2-4 escolhas por pergunta
- **Texto**: linguagem simples, suportes visuais, instrucoes audio
- **Visual**: tamanho de fonte, contraste alto, animacoes reduzidas
- **Sessao**: limite de tempo, lembretes de pausa
- **Frustracao**: deteccao automatica -> Banco da Calma (respiracao guiada)

## Acessibilidade

- Touch targets minimos 44x44px (WCAG 2.5.5)
- Focus visible 3px outline
- `prefers-reduced-motion` respeitado
- `forced-colors` (high contrast mode)
- Font Quicksand (dyslexia-friendly)
- Sem flashs ou animacoes bruscas
- TTS para leitura de instrucoes
- Perfil sensorial configuravel (som, animacao, contraste, tamanho)

## Tecnologias de Audio/Fala

### TTS (Text-to-Speech) — Implementado
- **Web Speech API** (`SpeechSynthesis`) via `src/hooks/useTTS.js`
  - `speak(text)` — fala em portugues (lang='pt')
  - `speakEn(text)` — fala em ingles (lang='en-GB')
  - Rate: 0.85 (mais lento para clareza)
  - Seleccao automatica de voz local

### STT (Speech-to-Text) — Implementado
- **Speech Recognition** nativa via `src/hooks/useSTT.js`
  - `listen()`, `listenForWord()`, `stop()`
  - Timeout automatico (5s default)
  - Integrado no Phonics
  - Requer internet

### Efeitos Sonoros — Implementado
- **AudioContext** sintetizado via `src/hooks/useSoundEffects.js`
  - `success()`, `error()`, `click()`, `celebrate()`, `levelUp()`
  - Zero ficheiros de audio, funciona offline

### Persistencia Local
- **IndexedDB** via `src/hooks/useStorage.js`
  - Migracao automatica localStorage -> IndexedDB
  - Fallback para localStorage
  - Export/import JSON para backup

## Lacunas Conhecidas

### Importantes
- **Sem testes**: Zero unit tests, zero integration tests
- **Export texto simples**: Relatorio e .txt, podia ser PDF com graficos
- **Sem i18n**: Tudo hardcoded em portugues
- **TTS qualidade variavel**: Depende do dispositivo/browser
- **STT requer internet**: Speech Recognition e cloud-processed

### Em Desenvolvimento / Nao Implementado
- **Realtime**: Mencionado na visao, nao implementado (zero `.channel()`)
- **Edge Functions**: Mencionado para webhooks PayPal, nao implementado
- **Storage**: Mencionado para avatares, nao implementado
- **OAuth (Google/Apple)**: Mencionado, nao implementado
- **Mural remoto**: Mensagens familiares sao locais, nao remotas
- **Notificacoes push**: Nao implementado
- **Webhooks PayPal**: Nao implementado (pagamento e client-side)
- **Analytics**: Nao implementado
- **Historico de eventos/sessoes**: Nao ha tracking granular

## Perfil do Breno (Quick Start)

```javascript
{
  name: 'Breno',
  age: 11,               // born 1 Oct 2014, conteudo misto de anos 1-6
  universe: 'football',
  learningNeeds: {
    areas: ['reading', 'math', 'attention'],
    readingLevel: 'beginning',
    supportLevel: 'some',
  },
  attention: {
    sessionLength: 15,
    frustrationSensitivity: 'sensitive',
  },
  competencyLevels: {     // detectados no intake
    campo1: 1,            // ajustados pela mini-avaliacao
    campo2: 1,
    campo3: 1,
    campo4: 1,
  },
}
```

## Comandos

```bash
npm run dev          # Dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
```

## Convencoes de Codigo

- JSX com inline styles (`const styles = { ... }`)
- CSS variables para design tokens (`var(--color-primary)`)
- Hooks customizados em `src/hooks/`
- Dados estaticos em `src/data/`
- Actividades em `src/activities/campo{1-4}/`
- Portugues neutro (sem `pt-PT` ou `pt-BR`, apenas `pt`)
- Conteudo globalmente diverso (sem centrismo nacional)
- Competencias por mestria, nunca por ano escolar ou idade
- Emojis como suporte visual, nao como decoracao

## Principios de Design

1. **Competencia, nao idade** — avanca quando domina, nao por calendario
2. **Universalista** — conteudo global (Barcelona, Liverpool, Bayern — nao centrado num pais)
3. **Adaptativo** — cada crianca tem um perfil unico de necessidades
4. **Gentil** — animacoes suaves, sem pressao temporal, deteccao de frustracao
5. **Offline-first** — PWA que funciona sem internet, sincroniza quando online
6. **Familia primeiro** — comunidade ao servico das familias, nunca o contrario
7. **Social por escolha** — funcionalidades sociais sao opt-in, nunca forcadas
8. **Seguranca maxima** — publico vulneravel, RGPD, consentimento parental, RLS
