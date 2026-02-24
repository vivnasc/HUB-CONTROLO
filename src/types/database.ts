// Types matching the shared Supabase project (vvvdtogvlutrybultffx)

export interface User {
  id: string
  auth_id: string
  email: string
  nome: string | null
  genero: 'masculino' | 'feminino' | null
  created_at: string
  updated_at: string
}

export interface VitalisClient {
  id: string
  user_id: string
  status: 'activo' | 'inactivo' | 'pausado' | 'cancelado'
  subscription_status: 'active' | 'trial' | 'pending' | 'expired' | 'cancelled' | 'tester'
  data_inicio: string
  data_fim: string | null
  fase_actual: string
  peso_inicial: number | null
  peso_actual: number | null
  peso_meta: number | null
  imc_inicial: number | null
  imc_actual: number | null
  objectivo_principal: string | null
  emocao_dominante: string | null
  created_at: string
  updated_at: string
}

export interface VitalisAlert {
  id: string
  user_id: string
  tipo_alerta: string
  descricao: string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'pendente' | 'lido' | 'resolvido'
  created_at: string
  updated_at: string
}

export interface MessengerConversation {
  id: string
  user_id: string
  canal: 'pessoal' | 'chatbot'
  origem: 'sete_ecos' | 'sete_veus'
  status: 'activa' | 'arquivada' | 'bloqueada'
  assunto: string | null
  last_message: string | null
  last_message_at: string | null
  last_sender_type: 'user' | 'coach' | 'bot' | null
  unread_user: number
  unread_coach: number
  created_at: string
  updated_at: string
  // Joined fields
  users?: User
}

export interface MessengerMessage {
  id: string
  conversation_id: string
  sender_type: 'user' | 'coach' | 'bot'
  sender_id: string | null
  conteudo: string | null
  tipo: 'texto' | 'imagem' | 'audio' | 'ficheiro' | 'sistema'
  media_url: string | null
  lida: boolean
  created_at: string
}

export interface VitalisCheckin {
  id: string
  user_id: string
  data: string
  peso: number | null
  humor: string | null
  energia: number | null
  sono_horas: number | null
  agua_litros: number | null
  notas: string | null
  created_at: string
}

// --- ANIMA ---

export interface AnimaUser {
  id: string
  email: string
  subscription_tier: 'free' | 'essencial' | 'relacional' | 'duo' | 'profundo'
  subscription_status: 'active' | 'inactive' | 'cancelled'
  language_preference: string
  monthly_message_count: number
  created_at: string
}

export interface AnimaJourney {
  id: string
  user_id: string
  current_phase: 'foundation' | 'regulation' | 'expansion' | 'integration' | 'relational' | 'complete'
  soma_conversations: number
  seren_conversations: number
  luma_conversations: number
  echo_conversations: number
  nexus_conversations: number
  total_conversations: number
  foundation_completed: boolean
  regulation_completed: boolean
  expansion_completed: boolean
  integration_completed: boolean
  journey_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AnimaStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_session_date: string | null
  updated_at: string
}

export interface AnimaSubscriptionEvent {
  id: string
  user_id: string
  event_type: 'created' | 'activated' | 'cancelled' | 'payment_failed' | 'renewed'
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AnimaPattern {
  id: string
  user_id: string
  pattern_type: string
  pattern_description: string
  discovered_in_mirror: string
  integration_level: number
  is_active: boolean
  created_at: string
}

export interface AnimaInsight {
  id: string
  user_id: string
  insight_text: string
  insight_type: 'awareness' | 'breakthrough' | 'connection' | 'integration'
  mirror_slug: string
  is_favorited: boolean
  created_at: string
}

// --- OS SETE VÉUS ---

export interface VeusProfile {
  id: string
  email: string | null
  is_admin: boolean
  subscription_status: string | null
  has_book_access: boolean
  has_mirrors_access: boolean
  has_audiobook_access: boolean
  has_early_access: boolean | null
  purchased_products: unknown[]
  created_at: string
  updated_at: string
}

export interface VeusPayment {
  id: string
  user_id: string
  user_email: string
  access_type_code: string
  payment_method: 'bank_transfer' | 'mpesa' | 'paypal'
  amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'rejected'
  transaction_id: string | null
  mpesa_reference: string | null
  notes: string | null
  created_at: string
}

export interface VeusCodeRequest {
  id: string
  full_name: string
  email: string
  whatsapp: string | null
  purchase_location: string | null
  proof_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface VeusAdminNotification {
  id: string
  type: string
  title: string
  message: string
  details: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface VeusReadingProgress {
  id: string
  user_id: string
  chapter_slug: string
  completed: boolean
  created_at: string
  updated_at: string
}

// --- PITCH ---

export interface PitchProfileShare {
  id: string
  owner_id: string
  share_code: string
  profile_id: string
  profile_data: {
    name?: string
    age?: number
    universe?: string
    competencyLevels?: { campo1: number; campo2: number; campo3: number; campo4: number }
    subscriptionTier?: string
    learningNeeds?: { areas?: string[]; readingLevel?: string; supportLevel?: string }
    attention?: { sessionLength?: number; frustrationSensitivity?: string }
  }
  progress_data: {
    totalStars?: number
    streakDays?: number
    activitiesCompleted?: Record<string, unknown>
    wordsLearned?: string[]
  }
  shared_with_id: string | null
  role: 'therapist' | 'family' | 'teacher'
  status: 'pending' | 'accepted' | 'revoked'
  created_at: string
  accepted_at: string | null
  updated_at: string
}

// --- PRODUTOS ---

export type Produto = 'sete_ecos' | 'anima' | 'veus' | 'pitch'

// Activity feed event (computed from multiple sources)
export interface ActivityEvent {
  id: string
  type: 'checkin' | 'peso' | 'mensagem' | 'alerta' | 'modulo' | 'pagamento' | 'inactividade' | 'subscricao' | 'codigo' | 'partilha' | 'leitura' | 'insight'
  produto: Produto
  title: string
  detail: string | null
  user_id: string
  user_name: string | null
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  action_url?: string
  emoji: string
}
