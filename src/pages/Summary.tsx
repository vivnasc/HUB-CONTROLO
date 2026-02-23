import { useState, useEffect } from 'react'
import { BarChart3, Scale, MessageCircle, AlertTriangle, Users, TrendingDown, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DailySummary {
  totalClients: number
  activeClients: number
  checkinsToday: number
  weighInsToday: number
  messagesUnread: number
  alertsPending: number
  weightLosses: { nome: string; delta: number }[]
  noCheckIn: { nome: string; daysSince: number }[]
}

export default function Summary() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalClients },
      { count: activeClients },
      { data: checkinsToday },
      { data: unreadConvs },
      { count: alertsPending },
      { data: allClients },
    ] = await Promise.all([
      supabase.from('vitalis_clients').select('*', { count: 'exact', head: true }),
      supabase.from('vitalis_clients').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'trial', 'tester']),
      supabase.from('vitalis_checkins').select('id, peso, user_id').gte('created_at', `${today}T00:00:00`),
      supabase.from('messenger_conversations').select('unread_coach').eq('status', 'activa').gt('unread_coach', 0),
      supabase.from('vitalis_alerts').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('vitalis_clients').select('user_id, peso_actual, peso_inicial, users!vitalis_clients_user_id_fkey(nome)').in('subscription_status', ['active', 'trial', 'tester']),
    ])

    const weighIns = (checkinsToday || []).filter((c: any) => c.peso)
    const unreadTotal = (unreadConvs || []).reduce((sum: number, c: any) => sum + (c.unread_coach || 0), 0)

    // Weight losses (clients who lost weight)
    const weightLosses = (allClients || [])
      .filter((c: any) => c.peso_inicial && c.peso_actual && c.peso_actual < c.peso_inicial)
      .map((c: any) => ({
        nome: (c.users as any)?.nome || 'Cliente',
        delta: Number((c.peso_inicial - c.peso_actual).toFixed(1)),
      }))
      .sort((a: any, b: any) => b.delta - a.delta)
      .slice(0, 5)

    // Clients who didn't check in today (from active clients)
    const checkedInUserIds = new Set((checkinsToday || []).map((c: any) => c.user_id))
    const noCheckIn = (allClients || [])
      .filter((c: any) => !checkedInUserIds.has(c.user_id))
      .map((c: any) => ({
        nome: (c.users as any)?.nome || 'Cliente',
        daysSince: 1, // Simplified
      }))

    setSummary({
      totalClients: totalClients || 0,
      activeClients: activeClients || 0,
      checkinsToday: (checkinsToday || []).length,
      weighInsToday: weighIns.length,
      messagesUnread: unreadTotal,
      alertsPending: alertsPending || 0,
      weightLosses,
      noCheckIn,
    })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hub-accent/20 flex items-center justify-center">
            <BarChart3 size={20} className="text-hub-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-hub-text">Resumo</h1>
            <p className="text-[11px] text-hub-text-dim">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg hover:bg-hub-surface transition-colors"
        >
          <RefreshCw size={18} className={`text-hub-text-dim ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading || !summary ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-hub-surface rounded-xl p-4 animate-pulse">
              <div className="h-8 bg-hub-card rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatCard
              icon={<Users size={16} />}
              label="Clientes activos"
              value={summary.activeClients}
              subtext={`${summary.totalClients} total`}
              color="text-hub-accent"
            />
            <StatCard
              icon={<Scale size={16} />}
              label="Check-ins hoje"
              value={summary.checkinsToday}
              subtext={`${summary.weighInsToday} com peso`}
              color="text-hub-success"
            />
            <StatCard
              icon={<MessageCircle size={16} />}
              label="Msgs por ler"
              value={summary.messagesUnread}
              color="text-blue-400"
              alert={summary.messagesUnread > 0}
            />
            <StatCard
              icon={<AlertTriangle size={16} />}
              label="Alertas"
              value={summary.alertsPending}
              color="text-hub-warning"
              alert={summary.alertsPending > 0}
            />
          </div>

          {/* Weight loss leaderboard */}
          {summary.weightLosses.length > 0 && (
            <div className="bg-hub-surface rounded-xl p-4 border border-hub-border mb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-hub-success" />
                <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider">
                  Perdas de peso
                </h3>
              </div>
              <div className="space-y-2">
                {summary.weightLosses.map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-hub-text">{w.nome}</span>
                    <span className="text-sm font-bold text-hub-success">-{w.delta}kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No check-in today */}
          {summary.noCheckIn.length > 0 && (
            <div className="bg-hub-surface rounded-xl p-4 border border-hub-border">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-hub-warning" />
                <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider">
                  Sem check-in hoje ({summary.noCheckIn.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.noCheckIn.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs bg-hub-warning/10 text-hub-warning px-2 py-1 rounded-lg"
                  >
                    {c.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
  alert,
}: {
  icon: React.ReactNode
  label: string
  value: number
  subtext?: string
  color: string
  alert?: boolean
}) {
  return (
    <div className={`bg-hub-surface rounded-xl p-3.5 border ${alert ? 'border-hub-warning/30' : 'border-hub-border'}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] text-hub-text-dim">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-[10px] text-hub-text-dim mt-0.5">{subtext}</p>}
    </div>
  )
}
