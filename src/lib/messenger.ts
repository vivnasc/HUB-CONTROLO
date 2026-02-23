import { supabase } from './supabase'
import type { MessengerConversation, MessengerMessage } from '../types/database'

// --- COACH-SIDE MESSENGER ---

// Get all active conversations with unread counts, ordered by last message
export async function getConversations(): Promise<MessengerConversation[]> {
  const { data, error } = await supabase
    .from('messenger_conversations')
    .select('*, users!messenger_conversations_user_id_fkey(id, nome, email)')
    .eq('status', 'activa')
    .order('last_message_at', { ascending: false })

  if (error) throw error
  return (data || []) as MessengerConversation[]
}

// Get messages for a conversation
export async function getMessages(conversaId: string, limit = 50, before?: string): Promise<MessengerMessage[]> {
  let query = supabase
    .from('messenger_messages')
    .select('*')
    .eq('conversation_id', conversaId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).reverse()
}

// Send message as coach
export async function sendMessage(conversaId: string, conteudo: string): Promise<MessengerMessage | null> {
  const { data, error } = await supabase
    .from('messenger_messages')
    .insert({
      conversation_id: conversaId,
      sender_type: 'coach',
      sender_id: null,
      conteudo,
      tipo: 'texto',
      lida: false,
    })
    .select()
    .single()

  if (error) throw error

  // Update conversation metadata
  const { data: conv } = await supabase
    .from('messenger_conversations')
    .select('unread_user')
    .eq('id', conversaId)
    .single()

  await supabase
    .from('messenger_conversations')
    .update({
      last_message: conteudo.slice(0, 100),
      last_message_at: new Date().toISOString(),
      last_sender_type: 'coach',
      unread_user: (conv?.unread_user || 0) + 1,
      unread_coach: 0,
    })
    .eq('id', conversaId)

  return data
}

// Mark messages as read by coach
export async function markAsRead(conversaId: string): Promise<void> {
  await supabase
    .from('messenger_messages')
    .update({ lida: true })
    .eq('conversation_id', conversaId)
    .eq('sender_type', 'user')
    .eq('lida', false)

  await supabase
    .from('messenger_conversations')
    .update({ unread_coach: 0 })
    .eq('id', conversaId)
}

// Subscribe to new messages in a conversation
export function subscribeToMessages(conversaId: string, onMessage: (msg: MessengerMessage) => void) {
  return supabase
    .channel(`hub-chat-${conversaId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messenger_messages',
        filter: `conversation_id=eq.${conversaId}`,
      },
      (payload) => onMessage(payload.new as MessengerMessage)
    )
    .subscribe()
}

// Subscribe to conversation list updates
export function subscribeToConversations(onUpdate: () => void) {
  return supabase
    .channel('hub-convs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messenger_conversations',
      },
      () => onUpdate()
    )
    .subscribe()
}

// Time formatting helpers
export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 7) return `${diffD}d`
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
}
