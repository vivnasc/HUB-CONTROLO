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

// Activity feed event (computed from multiple sources)
export interface ActivityEvent {
  id: string
  type: 'checkin' | 'peso' | 'mensagem' | 'alerta' | 'modulo' | 'pagamento' | 'inactividade'
  title: string
  detail: string | null
  user_id: string
  user_name: string | null
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  action_url?: string
  emoji: string
}
