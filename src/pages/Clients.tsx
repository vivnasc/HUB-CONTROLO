import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ClientRow {
  id: string
  nome: string | null
  email: string
  subscription_status: string | null
  peso_actual: number | null
  peso_meta: number | null
  data_inicio: string | null
  produto: string
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activo', cls: 'bg-hub-success/20 text-hub-success' },
  trial: { label: 'Trial', cls: 'bg-blue-500/20 text-blue-300' },
  tester: { label: 'Tester', cls: 'bg-purple-500/20 text-purple-300' },
  pending: { label: 'Pendente', cls: 'bg-hub-warning/20 text-hub-warning' },
  expired: { label: 'Expirado', cls: 'bg-hub-danger/20 text-hub-danger' },
  cancelled: { label: 'Cancelado', cls: 'bg-hub-text-dim/20 text-hub-text-dim' },
}

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const allClients: ClientRow[] = []

    // Vitalis clients
    const { data: vitalis } = await supabase
      .from('vitalis_clients')
      .select('*, users!vitalis_clients_user_id_fkey(id, nome, email)')
      .order('created_at', { ascending: false })

    for (const c of vitalis || []) {
      const u = (c as any).users
      allClients.push({
        id: u?.id || c.user_id,
        nome: u?.nome || null,
        email: u?.email || '',
        subscription_status: c.subscription_status,
        peso_actual: c.peso_actual,
        peso_meta: c.peso_meta,
        data_inicio: c.data_inicio,
        produto: 'Vitalis',
      })
    }

    // Aurea clients
    const { data: aurea } = await supabase
      .from('aurea_clients')
      .select('*, users!aurea_clients_user_id_fkey(id, nome, email)')
      .order('created_at', { ascending: false })

    for (const c of aurea || []) {
      const u = (c as any).users
      // Don't duplicate if already in Vitalis
      if (!allClients.find(x => x.id === u?.id)) {
        allClients.push({
          id: u?.id || c.user_id,
          nome: u?.nome || null,
          email: u?.email || '',
          subscription_status: c.subscription_status,
          peso_actual: null,
          peso_meta: null,
          data_inicio: c.data_inicio || null,
          produto: 'Aurea',
        })
      }
    }

    setClients(allClients)
    setLoading(false)
  }

  const filtered = clients.filter((c) => {
    const matchSearch = !search || (c.nome || c.email).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.subscription_status === filter
    return matchSearch && matchFilter
  })

  const activeCount = clients.filter(c => ['active', 'trial', 'tester'].includes(c.subscription_status || '')).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-hub-accent/20 flex items-center justify-center">
          <Users size={20} className="text-hub-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-hub-text">Clientes</h1>
          <p className="text-[11px] text-hub-text-dim">
            {activeCount} activo{activeCount !== 1 ? 's' : ''} &middot; {clients.length} total
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-hub-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar cliente..."
          className="w-full bg-hub-surface border border-hub-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-hub-text placeholder-hub-text-dim outline-none focus:border-hub-accent transition-colors"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'active', label: 'Activos' },
          { key: 'trial', label: 'Trial' },
          { key: 'tester', label: 'Testers' },
          { key: 'expired', label: 'Expirados' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-hub-accent text-white'
                : 'bg-hub-surface text-hub-text-muted hover:bg-hub-card'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Client list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-hub-surface rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-hub-card" />
                <div className="flex-1">
                  <div className="h-4 bg-hub-card rounded w-1/3 mb-2" />
                  <div className="h-3 bg-hub-card rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-hub-text-muted text-sm">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((client) => {
            const status = STATUS_STYLES[client.subscription_status || ''] || STATUS_STYLES.cancelled
            const name = client.nome || client.email.split('@')[0]
            const progresso = client.peso_actual && client.peso_meta
              ? ((client.peso_actual - client.peso_meta) > 0 ? `${client.peso_actual}kg` : `${client.peso_actual}kg`)
              : null

            return (
              <button
                key={`${client.id}-${client.produto}`}
                onClick={() => navigate(`/clientes/${client.id}`)}
                className="w-full text-left bg-hub-surface rounded-xl p-3.5 hover:bg-hub-card transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-hub-card flex items-center justify-center text-sm font-bold text-hub-text-muted flex-shrink-0">
                    {name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-hub-text truncate">{name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-hub-accent">{client.produto}</span>
                      {progresso && (
                        <span className="text-[10px] text-hub-text-dim">&middot; {progresso}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-hub-text-dim flex-shrink-0" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
