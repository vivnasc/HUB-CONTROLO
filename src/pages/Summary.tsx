import { useState, useEffect } from 'react'
import { BarChart3, Scale, MessageCircle, AlertTriangle, Users, TrendingDown, RefreshCw, BookOpen, Brain, Gamepad2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DailySummary {
  // Global
  messagesUnread: number
  alertsPending: number
  // Sete Ecos
  seteEcos: {
    totalClients: number
    activeClients: number
    checkinsToday: number
    weighInsToday: number
    weightLosses: { nome: string; delta: number }[]
    noCheckIn: { nome: string }[]
  }
  // ANIMA
  anima: {
    totalUsers: number
    activeUsers: number
    sessionsThisWeek: number
    breakthroughs: number
  }
  // Véus
  veus: {
    totalReaders: number
    pendingPayments: number
    pendingCodes: number
    chaptersThisWeek: number
  }
  // PITCH
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

    // All queries in parallel, each failing silently
    const [
      seteEcosRes,
      globalRes,
      animaRes,
      veusRes,
      pitchRes,
    ] = await Promise.allSettled([
      loadSeteEcos(today),
      loadGlobal(),
      loadAnima(weekAgo),
      loadVeus(weekAgo),
      loadPitch(),
    ])

    const seteEcos = seteEcosRes.status === 'fulfilled' ? seteEcosRes.value : {
      totalClients: 0, activeClients: 0, checkinsToday: 0, weighInsToday: 0, weightLosses: [], noCheckIn: [],
    }
    const global = globalRes.status === 'fulfilled' ? globalRes.value : { messagesUnread: 0, alertsPending: 0 }
    const anima = animaRes.status === 'fulfilled' ? animaRes.value : { totalUsers: 0, activeUsers: 0, sessionsThisWeek: 0, breakthroughs: 0 }
    const veus = veusRes.status === 'fulfilled' ? veusRes.value : { totalReaders: 0, pendingPayments: 0, pendingCodes: 0, chaptersThisWeek: 0 }
    const pitch = pitchRes.status === 'fulfilled' ? pitchRes.value : { activeChildren: 0, pendingShares: 0 }

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

          {/* SETE ECOS */}
          <SectionHeader icon={<Scale size={14} />} label="Sete Ecos" color="text-purple-300" bgColor="bg-purple-500/20" />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <StatCard icon={<Users size={14} />} label="Activos" value={summary.seteEcos.activeClients} subtext={`${summary.seteEcos.totalClients} total`} color="text-purple-300" />
            <StatCard icon={<Scale size={14} />} label="Check-ins hoje" value={summary.seteEcos.checkinsToday} subtext={`${summary.seteEcos.weighInsToday} com peso`} color="text-hub-success" />
          </div>
          {summary.seteEcos.weightLosses.length > 0 && (
            <div className="bg-hub-surface rounded-xl p-3.5 border border-hub-border mb-2">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} className="text-hub-success" />
                <span className="text-[10px] text-hub-text-dim uppercase tracking-wider font-semibold">Perdas de peso</span>
              </div>
              <div className="space-y-1.5">
                {summary.seteEcos.weightLosses.map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-hub-text">{w.nome}</span>
                    <span className="text-xs font-bold text-hub-success">-{w.delta}kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {summary.seteEcos.noCheckIn.length > 0 && (
            <div className="bg-hub-surface rounded-xl p-3.5 border border-hub-border mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-hub-warning" />
                <span className="text-[10px] text-hub-text-dim uppercase tracking-wider font-semibold">Sem check-in hoje ({summary.seteEcos.noCheckIn.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {summary.seteEcos.noCheckIn.map((c, i) => (
                  <span key={i} className="text-[10px] bg-hub-warning/10 text-hub-warning px-2 py-0.5 rounded-lg">{c.nome}</span>
                ))}
              </div>
            </div>
          )}

          {/* ANIMA */}
          <SectionHeader icon={<Brain size={14} />} label="ANIMA" color="text-emerald-300" bgColor="bg-emerald-500/20" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={<Users size={14} />} label="Activos" value={summary.anima.activeUsers} subtext={`${summary.anima.totalUsers} total`} color="text-emerald-300" />
            <StatCard icon={<Brain size={14} />} label="Sessões semana" value={summary.anima.sessionsThisWeek} subtext={`${summary.anima.breakthroughs} breakthroughs`} color="text-emerald-300" />
          </div>

          {/* VÉUS */}
          <SectionHeader icon={<BookOpen size={14} />} label="Os Sete Véus" color="text-sky-300" bgColor="bg-sky-500/20" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={<Users size={14} />} label="Leitoras" value={summary.veus.totalReaders} subtext={`${summary.veus.chaptersThisWeek} caps/semana`} color="text-sky-300" />
            <StatCard icon={<AlertTriangle size={14} />} label="Pendentes" value={summary.veus.pendingPayments + summary.veus.pendingCodes} subtext={`${summary.veus.pendingPayments} pag. + ${summary.veus.pendingCodes} códigos`} color="text-sky-300" alert={(summary.veus.pendingPayments + summary.veus.pendingCodes) > 0} />
          </div>

          {/* PITCH */}
          <SectionHeader icon={<Gamepad2 size={14} />} label="PITCH" color="text-amber-300" bgColor="bg-amber-500/20" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCard icon={<Users size={14} />} label="Crianças" value={summary.pitch.activeChildren} color="text-amber-300" />
            <StatCard icon={<AlertTriangle size={14} />} label="Partilhas pend." value={summary.pitch.pendingShares} color="text-amber-300" alert={summary.pitch.pendingShares > 0} />
          </div>
        </>
      )}
    </div>
  )
}

// --- Data loading helpers ---

async function loadGlobal() {
  const [unreadConvs, { count: alertsPending }] = await Promise.all([
    supabase.from('messenger_conversations').select('unread_coach').eq('status', 'activa').gt('unread_coach', 0),
    supabase.from('vitalis_alerts').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])
  const messagesUnread = (unreadConvs.data || []).reduce((sum, c: any) => sum + (c.unread_coach || 0), 0)
  return { messagesUnread, alertsPending: alertsPending || 0 }
}

async function loadSeteEcos(today: string) {
  const [
    { count: totalClients },
    { count: activeClients },
    { data: checkinsToday },
    { data: allClients },
  ] = await Promise.all([
    supabase.from('vitalis_clients').select('*', { count: 'exact', head: true }),
    supabase.from('vitalis_clients').select('*', { count: 'exact', head: true }).in('subscription_status', ['active', 'trial', 'tester']),
    supabase.from('vitalis_checkins').select('id, peso, user_id').gte('created_at', `${today}T00:00:00`),
    supabase.from('vitalis_clients').select('user_id, peso_actual, peso_inicial, users!vitalis_clients_user_id_fkey(nome)').in('subscription_status', ['active', 'trial', 'tester']),
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
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: sessionsThisWeek },
    { count: breakthroughs },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).not('subscription_tier', 'is', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').not('subscription_tier', 'is', null),
    supabase.from('user_sessions').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('user_insights').select('*', { count: 'exact', head: true }).eq('insight_type', 'breakthrough').gte('created_at', weekAgo),
  ])
  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    sessionsThisWeek: sessionsThisWeek || 0,
    breakthroughs: breakthroughs || 0,
  }
}

async function loadVeus(weekAgo: string) {
  const [
    { count: totalReaders },
    { count: pendingPayments },
    { count: pendingCodes },
    { count: chaptersThisWeek },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('livro_code_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reading_progress').select('*', { count: 'exact', head: true }).eq('completed', true).gte('updated_at', weekAgo),
  ])
  return {
    totalReaders: totalReaders || 0,
    pendingPayments: pendingPayments || 0,
    pendingCodes: pendingCodes || 0,
    chaptersThisWeek: chaptersThisWeek || 0,
  }
}

async function loadPitch() {
  const [
    { count: activeChildren },
    { count: pendingShares },
  ] = await Promise.all([
    supabase.from('profile_shares').select('*', { count: 'exact', head: true }).eq('role', 'therapist').eq('status', 'accepted'),
    supabase.from('profile_shares').select('*', { count: 'exact', head: true }).eq('role', 'therapist').eq('status', 'pending'),
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
