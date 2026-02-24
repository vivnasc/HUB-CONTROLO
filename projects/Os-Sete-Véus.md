# Os Sete Véus — Visão Completa do Projecto

## Descricao

Plataforma digital de leitura transformativa criada por Vivianne dos Santos. Oferece livros digitais (Espelhos e Nós) com leitura sequencial desbloqueável, diário reflexivo, comunidade anónima (Ecos) e painel de administração. O utilizador final é a leitora que procura autoconhecimento; a coach Vivianne gere tudo via painel admin (HUB-CONTROLO).

## Autora
**Vivianne dos Santos** — economista, escritora, moçambicana.
Email: viv.saraiva@gmail.com

---

## A Arquitectura: Espelhos, Nós e Ecos

Cada véu tem **três dimensões**:

### 1. Espelhos (Ficção Interior)
Histórias onde a leitora se reconhece. Cada espelho revela um véu.
- São 7 livros, um por véu
- Estrutura: 7 capítulos + reflexões + checklist por capítulo
- Leitura sequencial (desbloqueia capítulo a capítulo)

### 2. Nós (Ficção Relacional)
O que se passa **entre duas pessoas** quando um véu cai.
- São 7 livros, um por véu (par do Espelho correspondente)
- **Regra fundamental: Só lês o Nó se viveste o Espelho**
- O Nó é continuação emocional, não upsell
- Desbloqueia ao completar TODOS os capítulos do Espelho correspondente

### 3. Ecos (Comunidade)
Onde as vozes se encontram. Partilhas, reflexões, ressonâncias.
- Comunidade em `/comunidade`
- Integrada na experiência de leitura

---

## Os 7 Véus

| # | Véu | Espelho | Nó | Personagens Nó | Tema |
|---|-----|---------|-----|---------------|------|
| 1 | Ilusão | O Espelho da Ilusão | O Nó da Herança | Sara + Helena (mãe) | O silêncio herdado entre mãe e filha |
| 2 | Medo | O Espelho do Medo | O Nó do Silêncio | Rui + Ana | O que o medo calou entre eles |
| 3 | Culpa | O Espelho da Culpa | O Nó do Sacrifício | Filipe + Luísa | A culpa disfarçada de entrega |
| 4 | Identidade | O Espelho da Identidade | O Nó da Vergonha | Vítor + Mariana | A máscara que caiu entre dois estranhos |
| 5 | Controlo | O Espelho do Controlo | O Nó da Solidão | Isabel + Pedro | O controlo que isolou quem mais amava |
| 6 | Desejo | O Espelho do Desejo | O Nó do Vazio | Lena + Sofia | O desejo que esvaziou a amizade |
| 7 | Separação | O Espelho da Separação | O Nó da Pertença | Helena T. + Miguel C. | A separação que reinventou o lar |

---

## Modelo de Preços

### Espelhos
- Individual: **$29** USD / 1885 MZN / R$119 / €27
- Pack 3 Espelhos: **$69** (18% desconto)
- Jornada Completa (7 Espelhos): **$149** (27% desconto)

### Nós
- Individual: **$12** USD / 780 MZN / R$49 / €11
- **Pack 3 Espelhos ($69) → 3 Nós incluídos**
- **Jornada Completa ($149) → Nós completo incluído**

### Lógica de upgrade
- Espelho individual ($29) + Nó individual ($12) = $41
- Quem começa com individual sente a dor de pagar $12 por nó → empurra para upgrade
- A Jornada Completa torna-se absurdamente valiosa

---

## O Momento Mágico (UX do Nó)

### Enquanto lê o Espelho (não completou):
- Aparece teaser trancado no final da lista de capítulos
- Cadeado + "Sara viu o véu. Mas há um nó que ficou por desatar."
- "Disponível ao completar este espelho."

### Depois de completar o Espelho:
- Cadeado desaparece, card brilha
- "✓ Espelho da Ilusão — Completo"
- "A mãe sempre viu. Esperou anos. Agora que Sara acordou, Helena tem algo para lhe dizer."
- Botão: "Desatar este nó →"

### No dashboard do membro:
- Se Espelho não completo: teaser trancado
- Se Espelho completo: card desbloqueado com progresso

---

## Estado Actual (Fevereiro 2026)

### Publicado:
- **Espelho da Ilusão** — disponível, completo (7 capítulos)
- **Nó da Herança** — disponível, completo (depende de completar Espelho da Ilusão)
- **Os 7 Véus do Despertar** — livro filosófico

### Em breve:
- Espelho do Medo — Março 2026
- Espelho da Culpa — Abril 2026
- Espelho da Identidade — Maio 2026
- Espelho do Controlo — Junho 2026
- Espelho do Desejo — Julho 2026
- Espelho da Separação — Agosto 2026

### Nós restantes:
- Ainda não escritos (escrevem-se à medida que os Espelhos são publicados)

---

## Supabase

- **Auth:** Supabase Auth com magic links (email OTP)
- **Storage bucket:** `proof-photos` (comprovativos de compra, publico, max 5MB, JPG/PNG/WebP/HEIC)
- **RLS:** Activo em todas as tabelas
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Estrutura de Acessos

- `has_book_access` — acesso ao livro filosófico (Os 7 Véus do Despertar) + comunidade
- `has_mirrors_access` — acesso aos Espelhos (e Nós desbloqueáveis) — produto separado, comprado
- `has_audiobook_access` — acesso ao audiobook
- `has_early_access` — acesso antecipado (7 dias antes do lancamento de novos Espelhos)
- `is_admin` — acesso total

### Código do livro físico (LIVRO-XXXXX):
- Concede **apenas** `has_book_access` (livro filosófico + comunidade)
- Espelhos e Nós são produtos separados que se compram

### Lógica do Nó:
- Requer `has_mirrors_access` (mesmo que os Espelhos)
- Mas também requer **todos os capítulos do Espelho lidos** (gate no frontend)
- Admin/autora bypassa o gate

---

## Tabelas

### profiles
**Fonte:** `create-profiles-table.sql` + migracoes posteriores
**Para que serve:** Perfil do utilizador — flags de acesso, estado da subscricao, produtos comprados.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | — | PK, FK → auth.users(id) ON DELETE CASCADE |
| email | text | sim | — | UNIQUE |
| is_admin | boolean | sim | false | Admin bypassa todos os gates |
| subscription_status | text | sim | 'inactive' | 'inactive', 'active', 'cancelled' |
| has_book_access | boolean | sim | false | Acesso ao livro filosofico + comunidade |
| has_mirrors_access | boolean | sim | false | Acesso aos Espelhos e Nos |
| has_audiobook_access | boolean | sim | false | Acesso ao audiobook |
| has_early_access | boolean | sim | — | Acesso antecipado (7 dias antes do lancamento) |
| purchased_products | jsonb | sim | '[]'::jsonb | Array de {type, date, code?} |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | Trigger automatico |

**RLS:** Users veem/editam o proprio perfil. Admins veem todos. Service role pode inserir.

---

### reading_progress
**Fonte:** `supabase-reader-tables.sql`
**Para que serve:** Registo de capitulos lidos (Espelhos e Nos). Usado para desbloquear capitulos seguintes e gate dos Nos.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | sim | — | FK → auth.users(id) ON DELETE CASCADE |
| chapter_slug | text | nao | — | Slug do capitulo (ex: "cap-1") |
| completed | boolean | sim | false | |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | |

**Constraint:** UNIQUE(user_id, chapter_slug)

---

### checklist_progress
**Fonte:** `supabase-reader-tables.sql`
**Para que serve:** Estado dos itens de checklist por capitulo. Cada capitulo tem N itens que a leitora marca.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | sim | — | FK → auth.users(id) ON DELETE CASCADE |
| chapter_slug | text | nao | — | |
| item_index | int | nao | — | Indice do item no checklist |
| checked | boolean | sim | false | |
| checked_at | timestamptz | sim | — | |

**Constraint:** UNIQUE(user_id, chapter_slug, item_index)

---

### journal_entries
**Fonte:** `supabase-reader-tables.sql`
**Para que serve:** Diario pessoal da leitora por capitulo. Texto livre de reflexao.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | sim | — | FK → auth.users(id) ON DELETE CASCADE |
| chapter_slug | text | nao | — | |
| content | text | sim | '' | Texto livre |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | |

**Constraint:** UNIQUE(user_id, chapter_slug)

---

### referrals
**Fonte:** `supabase-reader-tables.sql`
**Para que serve:** Registo de partilhas/referrals feitas pelas leitoras nas redes sociais.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | sim | — | FK → auth.users(id) ON DELETE CASCADE |
| platform | text | nao | — | Rede social (ex: "whatsapp", "instagram") |
| referral_code | text | nao | — | Codigo de referral |
| shared_at | timestamptz | sim | NOW() | |

---

### livro_codes
**Fonte:** `supabase/migrations/create_livro_codes_table.sql`
**Para que serve:** Codigos LIVRO-XXXXX para acesso ao livro filosofico digital. Gerados pelo admin ou automaticamente.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| code | varchar(20) | nao | — | UNIQUE, formato LIVRO-XXXXX |
| email | varchar(255) | sim | — | Email destinatario (opcional) |
| status | varchar(20) | sim | 'unused' | CHECK: 'unused', 'used', 'expired' |
| generated_at | timestamptz | sim | NOW() | |
| used_at | timestamptz | sim | — | Quando foi usado |
| used_by | uuid | sim | — | FK → auth.users(id) |
| created_by | varchar(50) | sim | 'auto' | 'auto', 'admin', 'manual' |
| notes | text | sim | — | |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | Trigger automatico |

**RLS:** Apenas admins (via user_roles) podem ver, inserir e actualizar.

---

### livro_code_requests
**Fonte:** `supabase/migrations/create_livro_codes_table.sql`
**Para que serve:** Pedidos de codigo por clientes que compraram o livro fisico. Admin revê e aprova/rejeita.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| full_name | varchar(255) | nao | — | |
| email | varchar(255) | nao | — | |
| whatsapp | varchar(50) | sim | — | |
| purchase_location | text | sim | — | Onde comprou (livraria, evento) |
| proof_url | text | sim | — | URL da foto do comprovativo (Storage) |
| status | varchar(20) | sim | 'pending' | CHECK: 'pending', 'approved', 'rejected' |
| generated_code_id | uuid | sim | — | FK → livro_codes(id) |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | Trigger automatico |
| reviewed_at | timestamptz | sim | — | |
| reviewed_by | uuid | sim | — | FK → auth.users(id) |
| rejection_reason | text | sim | — | |

**RLS:** Qualquer um pode criar. Users veem os proprios. Admins veem todos e actualizam.

---

### payments *(schema inferido do codigo)*
**Fonte:** inferido de `src/app/api/payment/` + `src/app/admin/pagamentos/page.tsx`
**Para que serve:** Registos de pagamento (transferencia bancaria, MPesa, PayPal). Admin confirma ou rejeita manualmente.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) |
| user_email | text | nao | — | Email do cliente |
| user_phone | text | sim | — | Telefone do cliente |
| access_type_code | text | nao | — | Codigo do produto (ex: "experiencia-veu-ilusao") |
| payment_method | text | nao | — | 'bank_transfer', 'mpesa', 'paypal' |
| amount | numeric | nao | — | Valor |
| currency | text | sim | 'MZN' | 'MZN', 'USD', 'BRL', 'EUR' |
| status | text | sim | 'pending' | 'pending', 'confirmed', 'rejected' |
| transaction_id | text | sim | — | Numero de transacao bancaria |
| mpesa_reference | text | sim | — | Referencia MPesa |
| notes | text | sim | — | Notas adicionais |
| confirmed_by | uuid | sim | — | FK → auth.users(id) (admin que confirmou) |
| confirmed_at | timestamptz | sim | — | |
| rejection_reason | text | sim | — | |
| created_at | timestamptz | sim | NOW() | |

---

### purchases *(schema inferido do codigo)*
**Fonte:** inferido de `src/app/api/payment/confirm/route.ts` + `src/app/api/special-link/validate/route.ts` + `src/app/api/codes/redeem/route.ts`
**Para que serve:** Registo definitivo de acessos concedidos. Criado apos confirmacao de pagamento, uso de codigo, ou link especial.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) |
| product | text | nao | — | Codigo do produto |
| access_type_code | text | nao | — | Codigo do tipo de acesso |
| granted_via | text | nao | — | 'payment', 'livro_code', 'special_link' |
| granted_at | timestamptz | sim | — | |
| created_at | timestamptz | sim | NOW() | |

---

### access_types *(schema inferido do codigo)*
**Fonte:** inferido de `src/app/api/payment/create/route.ts`
**Para que serve:** Tabela de referencia com os tipos de acesso/produtos disponiveis e se sao pagos.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| code | varchar | nao | — | PK (ex: "experiencia-veu-ilusao", "livro-codigo") |
| is_paid | boolean | nao | — | Se requer pagamento |

**Nota:** Possivelmente tem mais colunas (nome, descricao, preco). Verificar com query abaixo.

---

### special_links *(schema inferido do codigo)*
**Fonte:** inferido de `src/app/admin/links-especiais/page.tsx` + `src/app/api/special-link/`
**Para que serve:** Links especiais de acesso directo (livro fisico, presentes). O admin cria, partilha URL, cliente regista-se com ele.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| code | text | nao | — | UNIQUE, nanoid(16) |
| access_type_code | text | nao | — | Tipo de acesso concedido |
| is_active | boolean | sim | true | |
| is_used | boolean | sim | false | |
| max_uses | int | sim | 1 | Maximo de utilizacoes |
| current_uses | int | sim | 0 | Contador de utilizacoes |
| expires_at | timestamptz | sim | — | Null = nunca expira |
| used_by | uuid | sim | — | FK → auth.users(id) (ultimo utilizador) |
| used_at | timestamptz | sim | — | |
| created_by | uuid | sim | — | FK → auth.users(id) (admin) |
| notes | text | sim | — | |
| created_at | timestamptz | sim | NOW() | |

---

### admin_notifications *(schema inferido do codigo)*
**Fonte:** inferido de `src/lib/notify-admin.ts`
**Para que serve:** Notificacoes internas para o painel admin. Cada evento importante gera uma notificacao.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| type | text | nao | — | 'payment_proof', 'payment_created', 'code_request', 'code_redeemed', 'special_link_used', 'new_member', 'general' |
| title | text | nao | — | |
| message | text | nao | — | |
| details | jsonb | sim | '{}' | Dados extras (chave-valor) |
| read | boolean | sim | false | Se a admin ja leu |
| created_at | timestamptz | sim | NOW() | |

---

### notifications_sent *(schema inferido do codigo)*
**Fonte:** inferido de `src/app/api/cron/notify-launch/route.ts`
**Para que serve:** Registo de notificacoes de lancamento enviadas (evita duplicados).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| slug | text | nao | — | Slug do espelho |
| type | text | nao | — | 'early_access', 'public_launch' |
| sent_at | timestamptz | nao | — | |
| recipients | int | sim | — | Numero de destinatarios |

---

### publish_log *(schema inferido do codigo)*
**Fonte:** inferido de `src/app/api/cron/publish/route.ts`
**Para que serve:** Log de publicacoes automaticas de espelhos (cron diario).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| type | text | nao | — | 'espelho_published' |
| slug | text | nao | — | Slug do espelho |
| title | text | sim | — | Titulo do espelho |
| published_at | timestamptz | nao | — | |

---

### user_roles *(schema inferido do codigo)*
**Fonte:** inferido de RLS policies em `create_livro_codes_table.sql` + `src/app/api/codes/generate/route.ts`
**Para que serve:** Tabela de roles de utilizadores. Usada nas RLS policies para verificar admin.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| user_id | uuid | nao | — | FK → auth.users(id) |
| role | text | nao | — | 'admin' (possivelmente outros) |

**Nota:** Possivelmente tem id e created_at. Verificar com query abaixo.

---

### waitlist *(schema inferido do codigo)*
**Fonte:** inferido de `src/components/WaitlistForm.tsx`
**Para que serve:** Lista de espera para lancamento dos Espelhos (captura de leads).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| email | text | nao | — | UNIQUE (usado em onConflict) |
| source | text | sim | — | Ex: "experiencias" |

---

### newsletter *(schema inferido do codigo)*
**Fonte:** inferido de `src/components/WaitlistForm.tsx` (fallback)
**Para que serve:** Tabela de newsletter (fallback se waitlist falha).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| email | text | nao | — | UNIQUE (usado em onConflict) |
| source | text | sim | — | Ex: "waitlist-experiencias" |

---

### reflexoes
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Reflexoes pessoais da leitora por capitulo/veu. Base para criacao de ecos.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| veu_numero | int | nao | — | CHECK: 1-7 |
| capitulo | int | nao | — | |
| conteudo | text | nao | — | |
| created_at | timestamptz | sim | NOW() | |
| updated_at | timestamptz | sim | NOW() | |

---

### progresso
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Progresso por veu/capitulo (usado na comunidade, complementar a reading_progress).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| veu_numero | int | nao | — | CHECK: 1-7 |
| capitulo_numero | int | nao | — | |
| completado | boolean | sim | false | |
| last_read_at | timestamptz | sim | NOW() | |

**Constraint:** UNIQUE(user_id, veu_numero, capitulo_numero)

---

### ecos
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Reflexoes partilhadas anonimamente na comunidade. Impermanentes (expiram em 30 dias).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| reflexao_id | uuid | sim | — | FK → reflexoes(id) ON DELETE SET NULL |
| veu_numero | int | nao | — | CHECK: 1-7 |
| capitulo | int | sim | — | |
| conteudo | text | nao | — | |
| temas | text[] | sim | '{}' | Tags/temas do eco |
| expires_at | timestamptz | nao | NOW() + 30 dias | Impermanencia |
| created_at | timestamptz | nao | NOW() | |

**RLS:** Autenticados veem ecos nao expirados. Users inserem/apagam os proprios.
**Indices:** veu_numero, expires_at, temas (GIN).

---

### reconhecimentos
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** "Reconheco-me" silenciosos — equivalente a um like, mas mais intimo.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| eco_id | uuid | nao | — | FK → ecos(id) ON DELETE CASCADE |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| created_at | timestamptz | nao | NOW() | |

**Constraint:** UNIQUE(eco_id, user_id)

---

### sussurros
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Mensagens efemeras de uma so via. Um sussurro em resposta a um eco. Expira apos 7 dias ou apos ser lido.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| eco_id | uuid | nao | — | FK → ecos(id) ON DELETE CASCADE |
| from_user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| to_user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| conteudo | text | nao | — | CHECK: max 100 caracteres |
| lido | boolean | sim | false | |
| expires_at | timestamptz | nao | NOW() + 7 dias | |
| created_at | timestamptz | nao | NOW() | |

---

### marcas
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Frases deixadas ao completar um veu. Uma por veu por pessoa. Expira em 90 dias.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| veu_numero | int | nao | — | CHECK: 1-7 |
| conteudo | text | nao | — | CHECK: max 200 caracteres |
| expires_at | timestamptz | nao | NOW() + 90 dias | |
| created_at | timestamptz | nao | NOW() | |

**Constraint:** UNIQUE(user_id, veu_numero)

---

### circulos
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Grupos temporarios por veu (max 7 membros). Circulos de espelho. Expiram em 14 dias.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| veu_numero | int | nao | — | CHECK: 1-7 |
| max_membros | int | sim | 7 | |
| activo | boolean | sim | true | |
| expires_at | timestamptz | nao | NOW() + 14 dias | |
| created_at | timestamptz | nao | NOW() | |

---

### circulo_membros
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Membros de cada circulo. Nome sombra anonimo atribuido.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| circulo_id | uuid | nao | — | FK → circulos(id) ON DELETE CASCADE |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| sombra_nome | text | nao | — | Pseudonimo anonimo (cor do veu + numero) |
| joined_at | timestamptz | nao | NOW() | |

**Constraint:** UNIQUE(circulo_id, user_id)

---

### circulo_fragmentos
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Fragmentos anonimos partilhados dentro de um circulo. Nao sao mensagens — sao reflexoes.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| circulo_id | uuid | nao | — | FK → circulos(id) ON DELETE CASCADE |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| conteudo | text | nao | — | CHECK: max 300 caracteres |
| created_at | timestamptz | nao | NOW() | |

---

### fogueiras
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Sessoes de contemplacao colectiva agendadas pela autora. Tempo limitado.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| titulo | text | nao | — | |
| descricao | text | sim | — | |
| starts_at | timestamptz | nao | — | Inicio agendado |
| ends_at | timestamptz | nao | — | Fim agendado |
| activa | boolean | sim | false | |
| frase_abertura | text | sim | — | Frase da Vivianne no inicio |
| frase_fecho | text | sim | — | Frase da Vivianne no fim |
| created_at | timestamptz | nao | NOW() | |

---

### fogueira_faiscas
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Reflexoes anonimas partilhadas durante uma fogueira. Max 200 caracteres.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| fogueira_id | uuid | nao | — | FK → fogueiras(id) ON DELETE CASCADE |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| conteudo | text | nao | — | CHECK: max 200 caracteres |
| created_at | timestamptz | nao | NOW() | |

---

### diario_espelho
**Fonte:** `supabase-schema-novas-features.sql`
**Para que serve:** Interaccoes IA do journal — pares reflexao/pergunta para sintese mensal.

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| reflexao | text | nao | — | Texto da reflexao da leitora |
| pergunta_espelho | text | nao | — | Pergunta gerada pela IA |
| veu_numero | int | sim | — | |
| created_at | timestamptz | sim | NOW() | |

**RLS:** Users leem e inserem os proprios.

---

### ecos_guardados
**Fonte:** `supabase-schema-novas-features.sql`
**Para que serve:** Coleccao pessoal de ecos que tocaram a leitora (bookmark de ecos).

| Coluna | Tipo | Nullable | Default | Notas |
|--------|------|----------|---------|-------|
| id | uuid | nao | gen_random_uuid() | PK |
| user_id | uuid | nao | — | FK → auth.users(id) ON DELETE CASCADE |
| eco_id | uuid | nao | — | Sem FK constraint (independente da tabela ecos) |
| created_at | timestamptz | sim | NOW() | |

**Constraint:** UNIQUE(user_id, eco_id)
**RLS:** Users leem, inserem e apagam os proprios.

---

### Relacoes entre tabelas

**Perfis e Auth:**
- profiles.id → auth.users(id)

**Leitura:**
- reading_progress.user_id → auth.users(id)
- checklist_progress.user_id → auth.users(id)
- journal_entries.user_id → auth.users(id)
- referrals.user_id → auth.users(id)
- progresso.user_id → auth.users(id)
- reflexoes.user_id → auth.users(id)
- diario_espelho.user_id → auth.users(id)

**Codigos e acessos:**
- livro_codes.used_by → auth.users(id)
- livro_code_requests.generated_code_id → livro_codes(id)
- livro_code_requests.reviewed_by → auth.users(id)
- purchases.user_id → auth.users(id)
- payments.user_id → auth.users(id)
- payments.confirmed_by → auth.users(id)
- special_links.used_by → auth.users(id)
- special_links.created_by → auth.users(id)

**Comunidade (Ecos):**
- ecos.user_id → auth.users(id)
- ecos.reflexao_id → reflexoes(id)
- reconhecimentos.eco_id → ecos(id)
- reconhecimentos.user_id → auth.users(id)
- sussurros.eco_id → ecos(id)
- sussurros.from_user_id → auth.users(id)
- sussurros.to_user_id → auth.users(id)
- marcas.user_id → auth.users(id)
- ecos_guardados.user_id → auth.users(id)

**Circulos:**
- circulo_membros.circulo_id → circulos(id)
- circulo_membros.user_id → auth.users(id)
- circulo_fragmentos.circulo_id → circulos(id)
- circulo_fragmentos.user_id → auth.users(id)

**Fogueiras:**
- fogueira_faiscas.fogueira_id → fogueiras(id)
- fogueira_faiscas.user_id → auth.users(id)

---

## Views

### mare_consciencia
**Fonte:** `supabase-schema-ecos.sql`
**Para que serve:** Agregacao anonima de temas dos ecos activos para visualizacao da "mare de consciencia".

```sql
SELECT
    unnest(temas) AS tema,
    veu_numero,
    COUNT(*) AS intensidade,
    DATE_TRUNC('hour', created_at) AS periodo
FROM public.ecos
WHERE expires_at > now()
GROUP BY tema, veu_numero, periodo
ORDER BY periodo DESC, intensidade DESC;
```

---

## Funcoes RPC (SQL)

### generate_unique_livro_code()
**Retorno:** VARCHAR(20)
**Para que serve:** Gera codigo unico LIVRO-XXXXX verificando colisoes. Nota: o codigo JS em `codes/generate/route.ts` tambem gera codigos sem usar esta funcao.

### update_updated_at_column()
**Retorno:** TRIGGER
**Para que serve:** Trigger function para actualizar automaticamente `updated_at`. Usada em: profiles, livro_codes, livro_code_requests.

---

## Real-time Subscriptions

Nenhuma subscricao realtime (.channel() / .on()) encontrada no codigo actual. A comunidade (ecos) usa fetch normal.

---

## Storage (Supabase Storage)

### Bucket: proof-photos
**Para que serve:** Armazenar comprovativos de compra (fotos de recibos, fotos do livro fisico).
- **Publico:** sim
- **Max tamanho:** 5MB
- **Tipos:** image/jpeg, image/png, image/webp, image/heic
- **Naming:** `comprovativo-{timestamp}-{random}.{ext}`
- **Usado em:** `src/app/api/upload-proof/route.ts`

---

## Constantes e Mapeamentos

### ACCESS_FLAG_MAP (`src/lib/constants.ts`)
Mapeia `access_type_code` → flag no perfil:

| access_type_code | Flag no profiles |
|-----------------|-----------------|
| experiencia-veu-ilusao | has_mirrors_access |
| experiencia-veu-medo | has_mirrors_access |
| experiencia-veu-culpa | has_mirrors_access |
| experiencia-veu-identidade | has_mirrors_access |
| experiencia-veu-controlo | has_mirrors_access |
| experiencia-veu-desejo | has_mirrors_access |
| experiencia-veu-separacao | has_mirrors_access |
| pack-3-espelhos | has_mirrors_access |
| jornada-completa | has_mirrors_access |
| livro-codigo | has_book_access |

### ADMIN_EMAILS (`src/lib/constants.ts`)
- `viv.saraiva@gmail.com`

---

## Fluxos importantes para a Coach (HUB-CONTROLO)

### Dados por cliente
A Vivianne precisa de ver por cada cliente:
- **Perfil:** email, flags de acesso (book, mirrors, audiobook, early_access), subscription_status
- **Produtos comprados:** purchased_products (JSONB array no profiles)
- **Progresso de leitura:** reading_progress (capitulos completados por espelho/no)
- **Checklist:** checklist_progress (itens marcados por capitulo)
- **Diario:** journal_entries (texto de reflexao por capitulo)
- **Pagamentos:** payments (historico completo, status pendentes)
- **Codigos usados:** livro_codes filtrado por used_by (codigo e data de uso)
- **Actividade comunidade:** ecos criados, reconhecimentos dados, sussurros enviados
- **Diario IA:** diario_espelho (pares reflexao/pergunta)
- **Referrals:** plataformas partilhadas

### Eventos que devem gerar alerta
- **Novo pagamento criado** (payments.status = 'pending') — precisa de confirmacao manual
- **Comprovativo enviado** (payment com transaction_id/mpesa_reference) — pronto para rever
- **Novo pedido de codigo** (livro_code_requests.status = 'pending') — precisa de aprovacao
- **Codigo resgatado** (livro_codes.status changed to 'used') — novo membro
- **Link especial usado** (special_links.current_uses incrementado) — acesso concedido
- **Novo membro registado** — notificacao via admin_notifications
- **Inactividade** (leitora nao lê ha X dias) — calculado a partir de reading_progress.updated_at
- **Espelho completado** (todos os 7 capitulos de um espelho completados) — potencial para No
- **Veu completado** (marca deixada em marcas) — celebracao

### KPIs para o dashboard
- **Clientes activos:** profiles com has_book_access=true OR has_mirrors_access=true
- **Leitoras esta semana:** COUNT DISTINCT user_id de reading_progress WHERE updated_at > 7 dias
- **Capitulos lidos esta semana:** COUNT de reading_progress WHERE completed=true AND updated_at > 7 dias
- **Receita pendente:** SUM(amount) de payments WHERE status='pending'
- **Receita confirmada:** SUM(amount) de payments WHERE status='confirmed' (por periodo)
- **Codigos pendentes:** COUNT de livro_code_requests WHERE status='pending'
- **Pagamentos pendentes:** COUNT de payments WHERE status='pending'
- **Ecos activos:** COUNT de ecos WHERE expires_at > now()
- **Leitoras na comunidade:** COUNT DISTINCT user_id de ecos WHERE expires_at > now()
- **Fogueiras agendadas:** COUNT de fogueiras WHERE starts_at > now()
- **Taxa de conclusao por espelho:** reading_progress completados / total leitoras com acesso
- **Progressao entre veus:** quantas leitoras completaram veu 1, 2, 3...
- **Conversao waitlist → membro:** emails em waitlist que existem em profiles

---

## Ficheiros Chave

### Dados
- `src/data/ebook.ts` — Espelho da Ilusão (capítulos + conteúdo)
- `src/data/no-heranca.ts` — Nó da Herança (capítulos + conteúdo)
- `src/data/nos-collection.ts` — metadados dos 7 Nós + preços
- `src/data/experiences.ts` — metadados dos 7 Espelhos + preços

### Páginas de leitura
- `src/app/membro/leitura/page.tsx` — hub do Espelho (com teaser do Nó)
- `src/app/membro/leitura/[capitulo]/page.tsx` — leitor de capítulo do Espelho
- `src/app/membro/nos/page.tsx` — hub do Nó (com gate do Espelho)
- `src/app/membro/nos/[capitulo]/page.tsx` — leitor de capítulo do Nó

### Dashboard e navegação
- `src/app/membro/page.tsx` — dashboard do membro
- `src/app/sobre/page.tsx` — página da autora (ambas colecções)
- `src/components/Header.tsx` — navegação principal

### Admin
- `src/app/admin/page.tsx` — dashboard admin
- `src/app/admin/pagamentos/page.tsx` — gestao de pagamentos
- `src/app/admin/links-especiais/page.tsx` — gestao de links especiais

### API Routes
- `src/app/api/payment/create/route.ts` — criar pagamento
- `src/app/api/payment/confirm/route.ts` — confirmar/rejeitar pagamento (admin)
- `src/app/api/payment/submit-proof/route.ts` — submeter comprovativo
- `src/app/api/codes/generate/route.ts` — gerar codigo LIVRO-XXXXX (admin)
- `src/app/api/codes/redeem/route.ts` — resgatar codigo
- `src/app/api/codes/request/route.ts` — pedir codigo (livro fisico)
- `src/app/api/special-link/create/route.ts` — criar link especial (admin)
- `src/app/api/special-link/validate/route.ts` — validar e activar link especial
- `src/app/api/upload-proof/route.ts` — upload de comprovativo
- `src/app/api/mare/route.ts` — dados anonimos da mare de consciencia
- `src/app/api/cron/publish/route.ts` — publicacao automatica de espelhos
- `src/app/api/cron/notify-launch/route.ts` — notificacoes de lancamento

### Controlo de acesso
- `src/components/AuthProvider.tsx` — Profile type + auth context
- `src/hooks/useAccess.ts` — hook de verificação de acessos
- `src/lib/constants.ts` — ACCESS_FLAG_MAP, ALL_PRODUCTS, ADMIN_EMAILS
- `src/lib/notify-admin.ts` — sistema de notificacoes para admin (Supabase + webhook WhatsApp)
- `src/lib/supabase.ts` — cliente Supabase (browser)
- `src/lib/supabase-server.ts` — cliente Supabase (server/admin)
- `src/lib/publish.ts` — logica de publicacao automatica por data

### Schema SQL
- `create-profiles-table.sql` — tabela profiles (schema base)
- `supabase-reader-tables.sql` — reading_progress, checklist_progress, journal_entries, referrals
- `supabase/migrations/create_livro_codes_table.sql` — livro_codes, livro_code_requests, user_roles (RLS), funcoes SQL
- `supabase-schema-ecos.sql` — ecos, reconhecimentos, sussurros, marcas, circulos, circulo_membros, circulo_fragmentos, fogueiras, fogueira_faiscas, view mare_consciencia
- `supabase-schema-novas-features.sql` — diario_espelho, ecos_guardados

---

## Principios de Design

- **Devagar.** Sem pressa. Ao ritmo da leitora.
- **Sem emojis.** Tom sóbrio, quente, íntimo.
- **Cores por véu.** Cada véu tem a sua paleta.
- **Ecos entre colecções.** Espelhos e Nós ligam-se visualmente com o símbolo ~
- **Nunca upsell agressivo.** Tudo é continuação natural, convite gentil.
- **Mobile-first.** A maioria das leitoras lê no telemóvel.

---

## Queries SQL para validar schema (tabelas inferidas)

As tabelas marcadas como "inferido do codigo" podem ser validadas correndo no Supabase SQL Editor:

```sql
-- Listar todas as tabelas publicas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Schema de cada tabela inferida
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'purchases' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'access_types' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'special_links' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'admin_notifications' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'notifications_sent' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'publish_log' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'user_roles' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'waitlist' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'newsletter' ORDER BY ordinal_position;
SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Foreign keys
SELECT tc.table_name, kcu.column_name, ccu.table_name AS fk_table, ccu.column_name AS fk_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' ORDER BY tc.table_name;
```
