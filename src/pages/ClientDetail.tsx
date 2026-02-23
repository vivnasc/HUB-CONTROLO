import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Scale, TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ClientData {
  user: { id: string; nome: string | null; email: string }
  vitalis: any | null
  intake: any | null
  recentCheckins: any[]
  conversations: any[]
}

export default function ClientDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    load()
  }, [userId])

  async function load() {
    setLoading(true)

    const [
      { data: user },
      { data: vitalis },
      { data: intake },
      { data: checkins },
      { data: conversations },
    ] = await Promise.all([
      supabase.from('users').select('id, nome, email').eq('id', userId!).single(),
      supabase.from('vitalis_clients').select('*').eq('user_id', userId!).maybeSingle(),
      supabase.from('vitalis_intake').select('nome, email, idade, sexo, peso_actual, peso_meta, objectivo_principal, altura_cm').eq('user_id', userId!).maybeSingle(),
      supabase.from('vitalis_checkins').select('*').eq('user_id', userId!).order('created_at', { ascending: false }).limit(10),
      supabase.from('messenger_conversations').select('id, canal, origem, last_message, last_message_at, unread_coach').eq('user_id', userId!).eq('status', 'activa'),
    ])

    setData({
      user: user || { id: userId!, nome: null, email: '' },
      vitalis,
      intake,
      recentCheckins: checkins || [],
      conversations: conversations || [],
    })
    setLoading(false)
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hub-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  const { user, vitalis, intake, recentCheckins, conversations } = data
  const name = user.nome || intake?.nome || user.email.split('@')[0]
  const pesoActual = vitalis?.peso_actual || intake?.peso_actual
  const pesoMeta = vitalis?.peso_meta || intake?.peso_meta
  const pesoInicial = vitalis?.peso_inicial || intake?.peso_actual
  const progresso = pesoInicial && pesoActual ? (pesoInicial - pesoActual).toFixed(1) : null
  const aPerder = pesoActual && pesoMeta ? (pesoActual - pesoMeta).toFixed(1) : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/clientes')}
          className="p-1 text-hub-text-dim hover:text-hub-text transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="w-12 h-12 rounded-full bg-hub-accent/20 flex items-center justify-center text-lg font-bold text-hub-accent">
          {name[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold text-hub-text">{name}</h1>
          <p className="text-xs text-hub-text-dim">{user.email}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-6">
        {conversations.map((conv: any) => (
          <button
            key={conv.id}
            onClick={() => navigate(`/messenger/${conv.id}`)}
            className="flex items-center gap-1.5 bg-hub-accent/10 border border-hub-accent/20 rounded-xl px-3 py-2 text-xs text-hub-accent font-medium hover:bg-hub-accent/20 transition-colors"
          >
            <MessageCircle size={14} />
            Mensagem
            {conv.unread_coach > 0 && (
              <span className="bg-hub-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {conv.unread_coach}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      {vitalis && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-hub-surface rounded-xl p-3 border border-hub-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Scale size={14} className="text-hub-accent" />
              <span className="text-[10px] text-hub-text-dim">Peso actual</span>
            </div>
            <p className="text-xl font-bold text-hub-text">
              {pesoActual ? `${pesoActual}kg` : '--'}
            </p>
          </div>

          <div className="bg-hub-surface rounded-xl p-3 border border-hub-border">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={14} className="text-hub-success" />
              <span className="text-[10px] text-hub-text-dim">Perdido</span>
            </div>
            <p className="text-xl font-bold text-hub-success">
              {progresso && Number(progresso) > 0 ? `-${progresso}kg` : '--'}
            </p>
          </div>

          <div className="bg-hub-surface rounded-xl p-3 border border-hub-border">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-hub-warning" />
              <span className="text-[10px] text-hub-text-dim">Falta perder</span>
            </div>
            <p className="text-xl font-bold text-hub-warning">
              {aPerder && Number(aPerder) > 0 ? `${aPerder}kg` : pesoActual && pesoMeta && Number(aPerder) <= 0 ? 'Meta!' : '--'}
            </p>
          </div>

          <div className="bg-hub-surface rounded-xl p-3 border border-hub-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={14} className="text-hub-text-muted" />
              <span className="text-[10px] text-hub-text-dim">Fase</span>
            </div>
            <p className="text-sm font-bold text-hub-text capitalize">
              {vitalis.fase_actual || '--'}
            </p>
          </div>
        </div>
      )}

      {/* Client info */}
      {intake && (
        <div className="bg-hub-surface rounded-xl p-4 border border-hub-border mb-4">
          <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider mb-3">Dados</h3>
          <div className="space-y-2">
            {[
              { label: 'Objectivo', value: intake.objectivo_principal },
              { label: 'Idade', value: intake.idade ? `${intake.idade} anos` : null },
              { label: 'Altura', value: intake.altura_cm ? `${intake.altura_cm}cm` : null },
              { label: 'Peso meta', value: pesoMeta ? `${pesoMeta}kg` : null },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-hub-text-dim">{label}</span>
                <span className="text-xs text-hub-text font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent checkins */}
      {recentCheckins.length > 0 && (
        <div className="bg-hub-surface rounded-xl p-4 border border-hub-border">
          <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider mb-3">
            Check-ins recentes
          </h3>
          <div className="space-y-2">
            {recentCheckins.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-xs text-hub-text-dim">
                  {new Date(c.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex items-center gap-3">
                  {c.peso && <span className="text-xs text-hub-text font-medium">{c.peso}kg</span>}
                  {c.humor && <span className="text-xs">{c.humor}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
