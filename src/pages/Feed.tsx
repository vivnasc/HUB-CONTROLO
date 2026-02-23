import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, RefreshCw, LogOut } from 'lucide-react'
import { fetchActivityFeed, subscribeToActivity } from '../lib/activity'
import { supabase } from '../lib/supabase'
import type { ActivityEvent } from '../types/database'
import { timeAgo } from '../lib/messenger'

const priorityColors: Record<string, string> = {
  critical: 'border-l-hub-danger',
  high: 'border-l-hub-warning',
  medium: 'border-l-hub-accent',
  low: 'border-l-hub-border',
}

export default function Feed() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-hub-surface flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-hub-text-dim" />
          </div>
          <p className="text-hub-text-muted text-sm">Sem actividade recente</p>
          <p className="text-hub-text-dim text-xs mt-1">
            Eventos dos teus produtos aparecem aqui em tempo real
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
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
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
