import { supabase } from './supabase'
import type { ActivityEvent } from '../types/database'

// Fetch recent activity across all products
export async function fetchActivityFeed(limit = 50): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = []

  // 1. Vitalis Alerts
  const { data: alerts } = await supabase
    .from('vitalis_alerts')
    .select('*, users!vitalis_alerts_user_id_fkey(nome, email)')
    .order('created_at', { ascending: false })
    .limit(20)

  for (const a of alerts || []) {
    const emojiMap: Record<string, string> = {
      novo_pagamento: '💳',
      novo_cliente: '🎉',
      trial_expiring: '⏰',
      espaco_retorno: '💬',
      plano_erro: '⚠️',
      meta_atingida: '🏆',
    }
    events.push({
      id: `alert-${a.id}`,
      type: 'alerta',
      title: a.descricao,
      detail: null,
      user_id: a.user_id,
      user_name: a.users?.nome || a.users?.email || null,
      timestamp: a.created_at,
      priority: a.prioridade === 'critica' ? 'critical' : a.prioridade === 'alta' ? 'high' : 'medium',
      emoji: emojiMap[a.tipo_alerta] || '🔔',
    })
  }

  // 2. Recent messenger messages (from clients)
  const { data: msgs } = await supabase
    .from('messenger_messages')
    .select('*, messenger_conversations!inner(user_id, users!messenger_conversations_user_id_fkey(nome, email))')
    .eq('sender_type', 'user')
    .order('created_at', { ascending: false })
    .limit(15)

  for (const m of msgs || []) {
    const conv = m.messenger_conversations
    events.push({
      id: `msg-${m.id}`,
      type: 'mensagem',
      title: `Mensagem de ${conv?.users?.nome || 'Cliente'}`,
      detail: m.conteudo?.slice(0, 80) || null,
      user_id: conv?.user_id,
      user_name: conv?.users?.nome || conv?.users?.email || null,
      timestamp: m.created_at,
      priority: 'medium',
      action_url: `/messenger/${m.conversation_id}`,
      emoji: '💬',
    })
  }

  // 3. Recent Vitalis checkins (weight registrations)
  const { data: checkins } = await supabase
    .from('vitalis_checkins')
    .select('*, users!vitalis_checkins_user_id_fkey(nome, email)')
    .order('created_at', { ascending: false })
    .limit(15)

  for (const c of checkins || []) {
    const hasPeso = c.peso !== null && c.peso !== undefined
    events.push({
      id: `checkin-${c.id}`,
      type: hasPeso ? 'peso' : 'checkin',
      title: hasPeso
        ? `${c.users?.nome || 'Cliente'} registou ${c.peso}kg`
        : `Check-in de ${c.users?.nome || 'Cliente'}`,
      detail: c.notas || null,
      user_id: c.user_id,
      user_name: c.users?.nome || c.users?.email || null,
      timestamp: c.created_at,
      priority: 'low',
      emoji: hasPeso ? '⚖️' : '✅',
    })
  }

  // Sort all events by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return events.slice(0, limit)
}

// Subscribe to real-time activity
export function subscribeToActivity(onEvent: (event: ActivityEvent) => void) {
  const channel = supabase
    .channel('hub-activity')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vitalis_alerts' },
      (payload) => {
        const a = payload.new as any
        onEvent({
          id: `alert-${a.id}`,
          type: 'alerta',
          title: a.descricao,
          detail: null,
          user_id: a.user_id,
          user_name: null,
          timestamp: a.created_at,
          priority: a.prioridade === 'critica' ? 'critical' : 'medium',
          emoji: '🔔',
        })
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messenger_messages', filter: 'sender_type=eq.user' },
      (payload) => {
        const m = payload.new as any
        onEvent({
          id: `msg-${m.id}`,
          type: 'mensagem',
          title: 'Nova mensagem de cliente',
          detail: m.conteudo?.slice(0, 80) || null,
          user_id: '',
          user_name: null,
          timestamp: m.created_at,
          priority: 'medium',
          action_url: `/messenger/${m.conversation_id}`,
          emoji: '💬',
        })
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vitalis_checkins' },
      (payload) => {
        const c = payload.new as any
        onEvent({
          id: `checkin-${c.id}`,
          type: c.peso ? 'peso' : 'checkin',
          title: c.peso ? `Cliente registou ${c.peso}kg` : 'Novo check-in',
          detail: null,
          user_id: c.user_id,
          user_name: null,
          timestamp: c.created_at,
          priority: 'low',
          emoji: c.peso ? '⚖️' : '✅',
        })
      }
    )
    .subscribe()

  return channel
}
