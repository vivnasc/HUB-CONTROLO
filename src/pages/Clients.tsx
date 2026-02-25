import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, ChevronRight } from 'lucide-react'
import { seteEcosClient, animaClient, veusClient, pitchClient, PRODUCTS, PRODUCT_TABS } from '../lib/products'
import type { Produto } from '../types/database'

interface ClientRow {
  id: string
  nome: string | null
  email: string
  subscription_status: string | null
  peso_actual: number | null
  peso_meta: number | null
  data_inicio: string | null
  produto: Produto
  produto_label: string
  extra: string | null
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activo', cls: 'bg-hub-success/20 text-hub-success' },
  trial: { label: 'Trial', cls: 'bg-blue-500/20 text-blue-300' },
  tester: { label: 'Tester', cls: 'bg-purple-500/20 text-purple-300' },
  pending: { label: 'Pendente', cls: 'bg-hub-warning/20 text-hub-warning' },
  expired: { label: 'Expirado', cls: 'bg-hub-danger/20 text-hub-danger' },
  cancelled: { label: 'Cancelado', cls: 'bg-hub-text-dim/20 text-hub-text-dim' },
  free: { label: 'Free', cls: 'bg-hub-text-dim/20 text-hub-text-dim' },
  inactive: { label: 'Inactivo', cls: 'bg-hub-text-dim/20 text-hub-text-dim' },
  accepted: { label: 'Aceite', cls: 'bg-hub-success/20 text-hub-success' },
  confirmed: { label: 'Confirmado', cls: 'bg-hub-success/20 text-hub-success' },
}

type ProdutoFilter = 'todos' | Produto

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [produtoFilter, setProdutoFilter] = useState<ProdutoFilter>('todos')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const allClients: ClientRow[] = []

    const results = await Promise.allSettled([
      loadSeteEcosClients(),
      animaClient ? loadAnimaClients() : Promise.resolve([]),
      veusClient ? loadVeusClients() : Promise.resolve([]),
      pitchClient ? loadPitchClients() : Promise.resolve([]),
    ])

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allClients.push(...result.value)
      }
    }

    setClients(allClients)
    setLoading(false)
  }

  const filtered = clients.filter((c) => {
    const matchSearch = !search || (c.nome || c.email).toLowerCase().includes(search.toLowerCase())
    const matchProduto = produtoFilter === 'todos' || c.produto === produtoFilter
    return matchSearch && matchProduto
  })

  const countByProduto = (p: Produto) => clients.filter((c) => c.produto === p).length

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
            {clients.length} total
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

      {/* Product filter — from registry */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {PRODUCT_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setProdutoFilter(key as ProdutoFilter)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              produtoFilter === key
                ? 'bg-hub-accent text-hub-bg'
                : 'bg-hub-surface text-hub-text-muted hover:text-hub-text'
            }`}
          >
            {label}
            {key !== 'todos' && (
              <span className="ml-1 opacity-60">{countByProduto(key as Produto)}</span>
            )}
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
            const config = PRODUCTS[client.produto]
            const clickable = config.hasDetailPage

            return (
              <button
                key={`${client.produto}-${client.id}`}
                onClick={() => {
                  if (clickable) navigate(`/clientes/${client.id}`)
                }}
                className={`w-full text-left bg-hub-surface rounded-xl p-3.5 hover:bg-hub-card transition-colors ${
                  clickable ? 'cursor-pointer' : 'cursor-default'
                }`}
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
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {client.extra && (
                        <span className="text-[10px] text-hub-text-dim">{client.extra}</span>
                      )}
                    </div>
                  </div>
                  {clickable && (
                    <ChevronRight size={16} className="text-hub-text-dim flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Data loaders (each uses its own Supabase client) ---

async function loadSeteEcosClients(): Promise<ClientRow[]> {
  const rows: ClientRow[] = []
  const sb = seteEcosClient

  const [{ data: vitalis }, { data: aurea }] = await Promise.all([
    sb
      .from('vitalis_clients')
      .select('*, users!vitalis_clients_user_id_fkey(id, nome, email)')
      .order('created_at', { ascending: false }),
    sb
      .from('aurea_clients')
      .select('*, users!aurea_clients_user_id_fkey(id, nome, email)')
      .order('created_at', { ascending: false }),
  ])

  const seenIds = new Set<string>()

  for (const c of vitalis || []) {
    const u = (c as any).users
    const id = u?.id || c.user_id
    seenIds.add(id)
    rows.push({
      id,
      nome: u?.nome || null,
      email: u?.email || '',
      subscription_status: c.subscription_status,
      peso_actual: c.peso_actual,
      peso_meta: c.peso_meta,
      data_inicio: c.data_inicio,
      produto: 'sete_ecos',
      produto_label: 'Vitalis',
      extra: c.peso_actual ? `${c.peso_actual}kg` : null,
    })
  }

  for (const c of aurea || []) {
    const u = (c as any).users
    const id = u?.id || c.user_id
    if (seenIds.has(id)) continue
    rows.push({
      id,
      nome: u?.nome || null,
      email: u?.email || '',
      subscription_status: c.subscription_status,
      peso_actual: null,
      peso_meta: null,
      data_inicio: c.data_inicio || null,
      produto: 'sete_ecos',
      produto_label: 'Aurea',
      extra: null,
    })
  }

  return rows
}

async function loadAnimaClients(): Promise<ClientRow[]> {
  if (!animaClient) return []
  const { data } = await animaClient
    .from('users')
    .select('id, email, subscription_tier, subscription_status, created_at')
    .not('subscription_tier', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  return (data || []).map((u: any) => ({
    id: u.id,
    nome: null,
    email: u.email,
    subscription_status: u.subscription_status || u.subscription_tier,
    peso_actual: null,
    peso_meta: null,
    data_inicio: u.created_at,
    produto: 'anima' as Produto,
    produto_label: u.subscription_tier,
    extra: u.subscription_tier ? `Tier: ${u.subscription_tier}` : null,
  }))
}

async function loadVeusClients(): Promise<ClientRow[]> {
  if (!veusClient) return []
  const { data } = await veusClient
    .from('profiles')
    .select('id, email, has_book_access, has_mirrors_access, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return (data || []).map((p: any) => {
    const accesses: string[] = []
    if (p.has_book_access) accesses.push('Livro')
    if (p.has_mirrors_access) accesses.push('Espelhos')
    return {
      id: p.id,
      nome: null,
      email: p.email || '',
      subscription_status: p.has_mirrors_access ? 'active' : p.has_book_access ? 'active' : 'free',
      peso_actual: null,
      peso_meta: null,
      data_inicio: p.created_at,
      produto: 'veus' as Produto,
      produto_label: 'Véus',
      extra: accesses.length > 0 ? accesses.join(' + ') : null,
    }
  })
}

async function loadPitchClients(): Promise<ClientRow[]> {
  if (!pitchClient) return []
  const { data } = await pitchClient
    .from('profile_shares')
    .select('*')
    .eq('role', 'therapist')
    .in('status', ['accepted', 'pending'])
    .order('created_at', { ascending: false })
    .limit(50)

  return (data || []).map((s: any) => {
    const pd = s.profile_data || {}
    const prog = s.progress_data || {}
    return {
      id: s.id,
      nome: pd.name || 'Criança',
      email: '',
      subscription_status: s.status,
      peso_actual: null,
      peso_meta: null,
      data_inicio: s.created_at,
      produto: 'pitch' as Produto,
      produto_label: 'PITCH',
      extra: prog.totalStars ? `${prog.totalStars} estrelas` : null,
    }
  })
}
