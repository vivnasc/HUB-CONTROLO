import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, RefreshCw, LogOut, Check, Eye } from 'lucide-react'
import { fetchActivityFeed, subscribeToActivity, markAlertRead, markAlertResolved, markVeusNotificationRead } from '../lib/activity'
import { supabase } from '../lib/supabase'
import type { ActivityEvent, Produto } from '../types/database'
import { timeAgo } from '../lib/messenger'

const priorityColors: Record<string, string> = {
  critical: 'border-l-hub-danger',
  high: 'border-l-hub-warning',
  medium: 'border-l-hub-accent',
  low: 'border-l-hub-border',
}

const produtoLabels: Record<Produto, string> = {
  sete_ecos: 'Sete Ecos',
  anima: 'ANIMA',
  veus: 'Véus',
  pitch: 'PITCH',
}

const produtoColors: Record<Produto, string> = {
  sete_ecos: 'bg-purple-500/20 text-purple-300',
  anima: 'bg-emerald-500/20 text-emerald-300',
  veus: 'bg-sky-500/20 text-sky-300',
  pitch: 'bg-amber-500/20 text-amber-300',
}

type FilterTab = 'todos' | Produto

export default function Feed() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('todos')
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchActivityFeed()
      setEvents(data)
    } catch {
      // Supabase connection might not be configured yet
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const channel = subscribeToActivity((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 50))
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  async function handleMarkRead(event: ActivityEvent, e: React.MouseEvent) {
    e.stopPropagation()
    setActioning(event.id)
    try {
      const rawId = event.id.replace(/^(alert-|veus-notif-)/, '')
      if (event.produto === 'sete_ecos' && event.type === 'alerta') {
        await markAlertRead(rawId)
      } else if (event.produto === 'veus' && event.type === 'alerta') {
        await markVeusNotificationRead(rawId)
      }
      setEvents((prev) => prev.filter((ev) => ev.id !== event.id))
    } finally {
      setActioning(null)
    }
  }

  async function handleMarkResolved(event: ActivityEvent, e: React.MouseEvent) {
    e.stopPropagation()
    setActioning(event.id)
    try {
      const rawId = event.id.replace(/^alert-/, '')
      await markAlertResolved(rawId)
      setEvents((prev) => prev.filter((ev) => ev.id !== event.id))
    } finally {
      setActioning(null)
    }
  }

  const filtered = filter === 'todos' ? events : events.filter((ev) => ev.produto === filter)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'sete_ecos', label: 'Sete Ecos' },
    { key: 'anima', label: 'ANIMA' },
    { key: 'veus', label: 'Véus' },
    { key: 'pitch', label: 'PITCH' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hub-accent/20 flex items-center justify-center">
            <Activity size={20} className="text-hub-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-hub-text">Feed</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-hub-success animate-pulse-dot" />
              <span className="text-[11px] text-hub-text-dim">Em tempo real</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg hover:bg-hub-surface transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={18} className={`text-hub-text-dim ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-hub-surface transition-colors"
            title="Sair"
          >
            <LogOut size={18} className="text-hub-text-dim" />
          </button>
        </div>
      </div>

      {/* Product filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-hub-accent text-hub-bg'
                : 'bg-hub-surface text-hub-text-muted hover:text-hub-text'
            }`}
          >
            {tab.label}
            {tab.key !== 'todos' && (
              <span className="ml-1 opacity-60">
                {events.filter((ev) => ev.produto === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events */}
      {loading && events.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-hub-surface rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-hub-card rounded w-3/4 mb-2" />
              <div className="h-3 bg-hub-card rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-hub-surface flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-hub-text-dim" />
          </div>
          <p className="text-hub-text-muted text-sm">
            {filter === 'todos' ? 'Sem actividade recente' : `Sem actividade ${produtoLabels[filter as Produto]}`}
          </p>
          <p className="text-hub-text-dim text-xs mt-1">
            Eventos dos teus produtos aparecem aqui em tempo real
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <button
              key={event.id}
              onClick={() => event.action_url && navigate(event.action_url)}
              className={`w-full text-left bg-hub-surface rounded-xl p-3.5 border-l-[3px] ${
                priorityColors[event.priority]
              } hover:bg-hub-card transition-colors ${event.action_url ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${produtoColors[event.produto]}`}>
                      {produtoLabels[event.produto]}
                    </span>
                    {event.priority === 'critical' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-hub-danger/20 text-hub-danger font-medium">
                        Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-hub-text leading-snug">{event.title}</p>
                  {event.detail && (
                    <p className="text-xs text-hub-text-muted mt-0.5 truncate">{event.detail}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {event.user_name && (
                      <span className="text-[11px] text-hub-accent font-medium">{event.user_name}</span>
                    )}
                    <span className="text-[10px] text-hub-text-dim">{timeAgo(event.timestamp)}</span>
                  </div>

                  {/* Action buttons for alerts */}
                  {event.type === 'alerta' && (event.produto === 'sete_ecos' || event.produto === 'veus') && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => handleMarkRead(event, e)}
                        disabled={actioning === event.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-hub-card text-hub-text-muted text-[11px] hover:text-hub-text transition-colors disabled:opacity-50"
                      >
                        <Eye size={12} /> Lido
                      </button>
                      {event.produto === 'sete_ecos' && (
                        <button
                          onClick={(e) => handleMarkResolved(event, e)}
                          disabled={actioning === event.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-hub-accent/10 text-hub-accent text-[11px] hover:bg-hub-accent/20 transition-colors disabled:opacity-50"
                        >
                          <Check size={12} /> Resolvido
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
