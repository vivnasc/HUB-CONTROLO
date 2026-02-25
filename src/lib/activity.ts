import { seteEcosClient, animaClient, veusClient, pitchClient } from './products'
import type { ActivityEvent } from '../types/database'

// Fetch recent activity across all products
export async function fetchActivityFeed(limit = 50): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = []

  const results = await Promise.allSettled([
    fetchSeteEcosEvents(),
    animaClient ? fetchAnimaEvents() : Promise.resolve([]),
    veusClient ? fetchVeusEvents() : Promise.resolve([]),
    pitchClient ? fetchPitchEvents() : Promise.resolve([]),
  ])

  for (const result of results) {
    if (result.status === 'fulfilled') {
      events.push(...result.value)
    }
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return events.slice(0, limit)
}

// --- SETE ECOS (uses main client) ---

async function fetchSeteEcosEvents(): Promise<ActivityEvent[]> {
  const events: ActivityEvent[] = []
  const sb = seteEcosClient

  const [alertsRes, msgsRes, checkinsRes] = await Promise.all([
    sb
      .from('vitalis_alerts')
      .select('*, users!vitalis_alerts_user_id_fkey(nome, email)')
      .order('created_at', { ascending: false })
      .limit(20),
    sb
      .from('messenger_messages')
      .select('*, messenger_conversations!inner(user_id, users!messenger_conversations_user_id_fkey(nome, email))')
      .eq('sender_type', 'user')
      .order('created_at', { ascending: false })
      .limit(15),
    sb
      .from('vitalis_checkins')
      .select('*, users!vitalis_checkins_user_id_fkey(nome, email)')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const emojiMap: Record<string, string> = {
    novo_pagamento: '💳',
    novo_cliente: '🎉',
    trial_expiring: '⏰',
    espaco_retorno: '💬',
    plano_erro: '⚠️',
    meta_atingida: '🏆',
  }
  for (const a of alertsRes.data || []) {
    events.push({
      id: `alert-${a.id}`,
      type: 'alerta',
      produto: 'sete_ecos',
      title: a.descricao,
      detail: null,
      user_id: a.user_id,
      user_name: a.users?.nome || a.users?.email || null,
      timestamp: a.created_at,
      priority: a.prioridade === 'critica' ? 'critical' : a.prioridade === 'alta' ? 'high' : 'medium',
      emoji: emojiMap[a.tipo_alerta] || '🔔',
    })
  }

  for (const m of msgsRes.data || []) {
    const conv = m.messenger_conversations
    events.push({
      id: `msg-${m.id}`,
      type: 'mensagem',
      produto: 'sete_ecos',
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

  for (const c of checkinsRes.data || []) {
    const hasPeso = c.peso !== null && c.peso !== undefined
    events.push({
      id: `checkin-${c.id}`,
      type: hasPeso ? 'peso' : 'checkin',
      produto: 'sete_ecos',
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

  return events
}

// --- ANIMA (uses animaClient) ---

async function fetchAnimaEvents(): Promise<ActivityEvent[]> {
  if (!animaClient) return []
  const events: ActivityEvent[] = []
  const sb = animaClient

  const [subEventsRes, insightsRes] = await Promise.allSettled([
    sb
      .from('subscription_events')
      .select('*, users!subscription_events_user_id_fkey(email)')
      .in('event_type', ['cancelled', 'payment_failed'])
      .order('created_at', { ascending: false })
      .limit(10),
    sb
      .from('user_insights')
      .select('*, users!user_insights_user_id_fkey(email)')
      .eq('insight_type', 'breakthrough')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (subEventsRes.status === 'fulfilled' && subEventsRes.value.data) {
    for (const e of subEventsRes.value.data) {
      const isFail = e.event_type === 'payment_failed'
      events.push({
        id: `anima-sub-${e.id}`,
        type: 'subscricao',
        produto: 'anima',
        title: isFail ? 'Falha de pagamento ANIMA' : 'Cancelamento ANIMA',
        detail: e.users?.email || null,
        user_id: e.user_id,
        user_name: e.users?.email || null,
        timestamp: e.created_at,
        priority: 'critical',
        emoji: isFail ? '❌' : '🚪',
      })
    }
  }

  if (insightsRes.status === 'fulfilled' && insightsRes.value.data) {
    for (const i of insightsRes.value.data) {
      events.push({
        id: `anima-insight-${i.id}`,
        type: 'insight',
        produto: 'anima',
        title: 'Breakthrough na ANIMA',
        detail: i.insight_text?.slice(0, 80) || null,
        user_id: i.user_id,
        user_name: i.users?.email || null,
        timestamp: i.created_at,
        priority: 'medium',
        emoji: '💡',
      })
    }
  }

  return events
}

// --- OS SETE VÉUS (uses veusClient) ---

async function fetchVeusEvents(): Promise<ActivityEvent[]> {
  if (!veusClient) return []
  const events: ActivityEvent[] = []
  const sb = veusClient

  const [paymentsRes, codeReqsRes, notifRes] = await Promise.allSettled([
    sb
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10),
    sb
      .from('livro_code_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10),
    sb
      .from('admin_notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data) {
    for (const p of paymentsRes.value.data) {
      events.push({
        id: `veus-pay-${p.id}`,
        type: 'pagamento',
        produto: 'veus',
        title: `Pagamento pendente — ${p.amount} ${p.currency}`,
        detail: `${p.user_email} via ${p.payment_method}`,
        user_id: p.user_id,
        user_name: p.user_email,
        timestamp: p.created_at,
        priority: 'critical',
        emoji: '💰',
      })
    }
  }

  if (codeReqsRes.status === 'fulfilled' && codeReqsRes.value.data) {
    for (const r of codeReqsRes.value.data) {
      events.push({
        id: `veus-code-${r.id}`,
        type: 'codigo',
        produto: 'veus',
        title: 'Pedido de código LIVRO',
        detail: `${r.full_name} (${r.email})`,
        user_id: '',
        user_name: r.full_name,
        timestamp: r.created_at,
        priority: 'high',
        emoji: '📖',
      })
    }
  }

  if (notifRes.status === 'fulfilled' && notifRes.value.data) {
    for (const n of notifRes.value.data) {
      if (n.type === 'payment_created' || n.type === 'code_request') continue
      events.push({
        id: `veus-notif-${n.id}`,
        type: 'alerta',
        produto: 'veus',
        title: n.title,
        detail: n.message?.slice(0, 80) || null,
        user_id: '',
        user_name: null,
        timestamp: n.created_at,
        priority: 'medium',
        emoji: n.type === 'new_member' ? '👋' : n.type === 'code_redeemed' ? '🔓' : '📢',
      })
    }
  }

  return events
}

// --- PITCH (uses pitchClient) ---

async function fetchPitchEvents(): Promise<ActivityEvent[]> {
  if (!pitchClient) return []
  const sb = pitchClient
  const events: ActivityEvent[] = []

  const { data } = await sb
    .from('profile_shares')
    .select('*')
    .eq('status', 'pending')
    .eq('role', 'therapist')
    .order('created_at', { ascending: false })
    .limit(5)

  for (const s of data || []) {
    const name = (s.profile_data as any)?.name || 'Criança'
    events.push({
      id: `pitch-share-${s.id}`,
      type: 'partilha',
      produto: 'pitch',
      title: 'Nova partilha PITCH pendente',
      detail: name,
      user_id: s.owner_id,
      user_name: name,
      timestamp: s.created_at,
      priority: 'medium',
      emoji: '🧒',
    })
  }

  return events
}

// --- ALERT ACTIONS ---

export async function markAlertRead(alertId: string): Promise<void> {
  await seteEcosClient
    .from('vitalis_alerts')
    .update({ status: 'lido' })
    .eq('id', alertId)
}

export async function markAlertResolved(alertId: string): Promise<void> {
  await seteEcosClient
    .from('vitalis_alerts')
    .update({ status: 'resolvido' })
    .eq('id', alertId)
}

export async function markVeusNotificationRead(notifId: string): Promise<void> {
  if (!veusClient) return
  await veusClient
    .from('admin_notifications')
    .update({ read: true })
    .eq('id', notifId)
}

// Subscribe to real-time activity (Sete Ecos only — primary product with auth)
export function subscribeToActivity(onEvent: (event: ActivityEvent) => void) {
  const channel = seteEcosClient
    .channel('hub-activity')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vitalis_alerts' },
      (payload) => {
        const a = payload.new as any
        onEvent({
          id: `alert-${a.id}`,
          type: 'alerta',
          produto: 'sete_ecos',
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
          produto: 'sete_ecos',
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
          produto: 'sete_ecos',
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
