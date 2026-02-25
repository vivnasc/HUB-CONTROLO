import { useState, useEffect } from 'react'
import { BarChart3, Scale, MessageCircle, AlertTriangle, Users, TrendingDown, RefreshCw } from 'lucide-react'
import { seteEcosClient, animaClient, veusClient, pitchClient, PRODUCTS, PRODUCT_LIST } from '../lib/products'
import type { Produto } from '../types/database'

interface DailySummary {
  messagesUnread: number
  alertsPending: number
  seteEcos: {
    totalClients: number
    activeClients: number
    checkinsToday: number
    weighInsToday: number
    weightLosses: { nome: string; delta: number }[]
    noCheckIn: { nome: string }[]
  }
  anima: {
    totalUsers: number
    activeUsers: number
    sessionsThisWeek: number
    breakthroughs: number
  }
  veus: {
    totalReaders: number
    pendingPayments: number
    pendingCodes: number
    chaptersThisWeek: number
  }
  pitch: {
    activeChildren: number
    pendingShares: number
  }
}

export default function Summary() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [
      seteEcosRes,
      globalRes,
      animaRes,
      veusRes,
      pitchRes,
    ] = await Promise.allSettled([
      loadSeteEcos(today),
      loadGlobal(),
      animaClient ? loadAnima(weekAgo) : Promise.resolve(null),
      veusClient ? loadVeus(weekAgo) : Promise.resolve(null),
      pitchClient ? loadPitch() : Promise.resolve(null),
    ])

    const seteEcos = seteEcosRes.status === 'fulfilled' ? seteEcosRes.value : {
      totalClients: 0, activeClients: 0, checkinsToday: 0, weighInsToday: 0, weightLosses: [], noCheckIn: [],
    }
    const global = globalRes.status === 'fulfilled' ? globalRes.value : { messagesUnread: 0, alertsPending: 0 }
    const anima = animaRes.status === 'fulfilled' && animaRes.value ? animaRes.value : { totalUsers: 0, activeUsers: 0, sessionsThisWeek: 0, breakthroughs: 0 }
    const veus = veusRes.status === 'fulfilled' && veusRes.value ? veusRes.value : { totalReaders: 0, pendingPayments: 0, pendingCodes: 0, chaptersThisWeek: 0 }
    const pitch = pitchRes.status === 'fulfilled' && pitchRes.value ? pitchRes.value : { activeChildren: 0, pendingShares: 0 }

    setSummary({ ...global, seteEcos, anima, veus, pitch })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const totalActive = (summary?.seteEcos.activeClients ?? 0) + (summary?.anima.activeUsers ?? 0) + (summary?.veus.totalReaders ?? 0) + (summary?.pitch.activeChildren ?? 0)

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
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-hub-surface rounded-xl p-4 animate-pulse">
              <div className="h-8 bg-hub-card rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Global KPIs */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <StatCard
              icon={<Users size={14} />}
              label="Activos total"
              value={totalActive}
              color="text-hub-accent"
            />
            <StatCard
              icon={<MessageCircle size={14} />}
              label="Msgs por ler"
              value={summary.messagesUnread}
              color="text-blue-400"
              alert={summary.messagesUnread > 0}
            />
            <StatCard
              icon={<AlertTriangle size={14} />}
              label="Alertas"
              value={summary.alertsPending}
              color="text-hub-warning"
              alert={summary.alertsPending > 0}
            />
          </div>

          {/* Per-product sections using registry */}
          {PRODUCT_LIST.map((prod) => (
            <ProductSection key={prod.key} produto={prod.key} summary={summary} />
          ))}
        </>
      )}
    </div>
  )
}

// --- Per-product section renderer ---

function ProductSection({ produto, summary }: { produto: Produto; summary: DailySummary }) {
  const config = PRODUCTS[produto]
  const { Icon } = config

  switch (produto) {
    case 'sete_ecos': {
      const d = summary.seteEcos
      return (
        <>
          <SectionHeader icon={<Icon size={14} />} label={config.label} color={config.iconColor} bgColor={config.iconBg} />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <StatCard icon={<Users size={14} />} label="Activos" value={d.activeClients} subtext={`${d.totalClients} total`} color={config.iconColor} />
            <StatCard icon={<Scale size={14} />} label="Check-ins hoje" value={d.checkinsToday} subtext={`${d.weighInsToday} com peso`} color="text-hub-success" />
          </div>
          {d.weightLosses.length > 0 && (
            <div className="bg-hub-surface rounded-xl p-3.5 border border-hub-border mb-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} className="text-hub-success" />
                <span className="text-[10px] text-hub-text-dim uppercase tracking-wider font-semibold">Perdas de peso</span>
              </div>
              <div className="space-y-1.5">
                {d.weightLosses.map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-hub-text">{w.nome}</span>
                    <span className="text-xs font-bold text-hub-success">-{w.delta}kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {d.noCheckIn.length > 0 && (
            <div className="bg-hub-surface rounded-xl p-3.5 border border-hub-border mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-hub-warning" />
                <span className="text-[10px] text-hub-text-dim uppercase tracking-wider font-semibold">Sem check-in hoje ({d.noCheckIn.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.noCheckIn.map((c, i) => (
                  <span key={i} className="text-[10px] bg-hub-warning/10 text-hub-warning px-2 py-0.5 rounded-lg">{c.nome}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )
    }
    case 'anima': {
      const d = summary.anima
      if (!animaClient) return null
      return (
        <>
          <SectionHeader icon={<Icon size={14} />} label={config.label} color={config.iconColor} bgColor={config.iconBg} />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={<Users size={14} />} label="Activos" value={d.activeUsers} subtext={`${d.totalUsers} total`} color={config.iconColor} />
            <StatCard icon={<Icon size={14} />} label="Sessões semana" value={d.sessionsThisWeek} subtext={`${d.breakthroughs} breakthroughs`} color={config.iconColor} />
          </div>
        </>
      )
    }
    case 'veus': {
      const d = summary.veus
      if (!veusClient) return null
      return (
        <>
          <SectionHeader icon={<Icon size={14} />} label={config.label} color={config.iconColor} bgColor={config.iconBg} />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={<Users size={14} />} label="Leitoras" value={d.totalReaders} subtext={`${d.chaptersThisWeek} caps/semana`} color={config.iconColor} />
            <StatCard icon={<AlertTriangle size={14} />} label="Pendentes" value={d.pendingPayments + d.pendingCodes} subtext={`${d.pendingPayments} pag. + ${d.pendingCodes} códigos`} color={config.iconColor} alert={(d.pendingPayments + d.pendingCodes) > 0} />
          </div>
        </>
      )
    }
    case 'pitch': {
      const d = summary.pitch
      if (!pitchClient) return null
      return (
        <>
          <SectionHeader icon={<Icon size={14} />} label={config.label} color={config.iconColor} bgColor={config.iconBg} />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={<Users size={14} />} label="Crianças" value={d.activeChildren} color={config.iconColor} />
            <StatCard icon={<AlertTriangle size={14} />} label="Partilhas pend." value={d.pendingShares} color={config.iconColor} alert={d.pendingShares > 0} />
          </div>
        </>
      )
    }
  }
}

// --- Data loading helpers (each uses its own Supabase client) ---

async function loadGlobal() {
  const [unreadConvs, { count: alertsPending }] = await Promise.all([
    seteEcosClient.from('messenger_conversations').select('unread_coach').eq('status', 'activa').gt('unread_coach', 0),
    seteEcosClient.from('vitalis_alerts').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])
  const messagesUnread = (unreadConvs.data || []).reduce((sum, c: any) => sum + (c.unread_coach || 0), 0)
  return { messagesUnread, alertsPending: alertsPending || 0 }
}

async function loadSeteEcos(today: string) {
  const sb = seteEcosClient
  const [
    { count: totalClients },
    { count: activeClients },
    { data: checkinsToday },
    { data: allClients },
  ] = await Promise.all([
    sb.from('vitalis_clients').select('*', { count: 'exact', head: true }),
    sb.from('vitalis_clients').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'trial', 'tester']),
    sb.from('vitalis_checkins').select('id, peso, user_id').gte('created_at', `${today}T00:00:00`),
    sb.from('vitalis_clients').select('user_id, peso_actual, peso_inicial, users!vitalis_clients_user_id_fkey(nome)').in('subscription_status', ['active', 'trial', 'tester']),
  ])

  const weighIns = (checkinsToday || []).filter((c: any) => c.peso)

  const weightLosses = (allClients || [])
    .filter((c: any) => c.peso_inicial && c.peso_actual && c.peso_actual < c.peso_inicial)
    .map((c: any) => ({ nome: (c.users as any)?.nome || 'Cliente', delta: Number((c.peso_inicial - c.peso_actual).toFixed(1)) }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)

  const checkedInUserIds = new Set((checkinsToday || []).map((c: any) => c.user_id))
  const noCheckIn = (allClients || [])
    .filter((c: any) => !checkedInUserIds.has(c.user_id))
    .map((c: any) => ({ nome: (c.users as any)?.nome || 'Cliente' }))

  return {
    totalClients: totalClients || 0,
    activeClients: activeClients || 0,
    checkinsToday: (checkinsToday || []).length,
    weighInsToday: weighIns.length,
    weightLosses,
    noCheckIn,
  }
}

async function loadAnima(weekAgo: string) {
  if (!animaClient) return null
  const sb = animaClient
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: sessionsThisWeek },
    { count: breakthroughs },
  ] = await Promise.all([
    sb.from('users').select('*', { count: 'exact', head: true }).not('subscription_tier', 'is', null),
    sb.from('users').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').not('subscription_tier', 'is', null),
    sb.from('user_sessions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    sb.from('user_insights').select('*', { count: 'exact', head: true }).eq('insight_type', 'breakthrough').gte('created_at', weekAgo),
  ])
  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    sessionsThisWeek: sessionsThisWeek || 0,
    breakthroughs: breakthroughs || 0,
  }
}

async function loadVeus(weekAgo: string) {
  if (!veusClient) return null
  const sb = veusClient
  const [
    { count: totalReaders },
    { count: pendingPayments },
    { count: pendingCodes },
    { count: chaptersThisWeek },
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('livro_code_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('reading_progress').select('*', { count: 'exact', head: true }).eq('completed', true).gte('updated_at', weekAgo),
  ])
  return {
    totalReaders: totalReaders || 0,
    pendingPayments: pendingPayments || 0,
    pendingCodes: pendingCodes || 0,
    chaptersThisWeek: chaptersThisWeek || 0,
  }
}

async function loadPitch() {
  if (!pitchClient) return null
  const sb = pitchClient
  const [
    { count: activeChildren },
    { count: pendingShares },
  ] = await Promise.all([
    sb.from('profile_shares').select('*', { count: 'exact', head: true }).eq('role', 'therapist').eq('status', 'accepted'),
    sb.from('profile_shares').select('*', { count: 'exact', head: true }).eq('role', 'therapist').eq('status', 'pending'),
  ])
  return {
    activeChildren: activeChildren || 0,
    pendingShares: pendingShares || 0,
  }
}

// --- UI components ---

function SectionHeader({ icon, label, color, bgColor }: { icon: React.ReactNode; label: string; color: string; bgColor: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-2">
      <div className={`w-6 h-6 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>{icon}</div>
      <h2 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</h2>
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
    <div className={`bg-hub-surface rounded-xl p-3 border ${alert ? 'border-hub-warning/30' : 'border-hub-border'}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] text-hub-text-dim">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-[10px] text-hub-text-dim mt-0.5">{subtext}</p>}
    </div>
  )
}
