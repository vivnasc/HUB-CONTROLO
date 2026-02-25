import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Scale, Brain, BookOpen, Gamepad2, type LucideIcon } from 'lucide-react'
import type { Produto } from '../types/database'

// --- Product definition ---

export interface ProductConfig {
  key: Produto
  label: string
  color: string        // Tailwind badge classes
  iconColor: string    // Tailwind text color for section headers
  iconBg: string       // Tailwind bg color for section headers
  Icon: LucideIcon
  hasDetailPage: boolean
  hasAlertActions: boolean
  hasRealtime: boolean
}

// Single source of truth for all product metadata
export const PRODUCTS: Record<Produto, ProductConfig> = {
  sete_ecos: {
    key: 'sete_ecos',
    label: 'Sete Ecos',
    color: 'bg-purple-500/20 text-purple-300',
    iconColor: 'text-purple-300',
    iconBg: 'bg-purple-500/20',
    Icon: Scale,
    hasDetailPage: true,
    hasAlertActions: true,
    hasRealtime: true,
  },
  anima: {
    key: 'anima',
    label: 'ANIMA',
    color: 'bg-emerald-500/20 text-emerald-300',
    iconColor: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
    Icon: Brain,
    hasDetailPage: false,
    hasAlertActions: false,
    hasRealtime: false,
  },
  veus: {
    key: 'veus',
    label: 'Os Sete Véus',
    color: 'bg-sky-500/20 text-sky-300',
    iconColor: 'text-sky-300',
    iconBg: 'bg-sky-500/20',
    Icon: BookOpen,
    hasDetailPage: false,
    hasAlertActions: true,
    hasRealtime: false,
  },
  pitch: {
    key: 'pitch',
    label: 'PITCH',
    color: 'bg-amber-500/20 text-amber-300',
    iconColor: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
    Icon: Gamepad2,
    hasDetailPage: false,
    hasAlertActions: false,
    hasRealtime: false,
  },
}

export const PRODUCT_LIST = Object.values(PRODUCTS)

// Tabs helper — "Todos" + each product
export const PRODUCT_TABS: { key: 'todos' | Produto; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  ...PRODUCT_LIST.map((p) => ({ key: p.key, label: p.label })),
]

// --- Multi-project Supabase clients ---

// Main client (Sete Ecos) — uses anon key + auth (coach login)
export const seteEcosClient: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'hub-controlo-auth',
      storage: window.localStorage,
    },
  }
)

// External project clients — service role keys, no auth needed
function createExternalClient(urlEnv: string, keyEnv: string): SupabaseClient | null {
  const url = import.meta.env[urlEnv]
  const key = import.meta.env[keyEnv]
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const animaClient = createExternalClient('VITE_ANIMA_SUPABASE_URL', 'VITE_ANIMA_SUPABASE_KEY')
export const veusClient = createExternalClient('VITE_VEUS_SUPABASE_URL', 'VITE_VEUS_SUPABASE_KEY')
export const pitchClient = createExternalClient('VITE_PITCH_SUPABASE_URL', 'VITE_PITCH_SUPABASE_KEY')

// Map product key to its Supabase client
export function getClient(produto: Produto): SupabaseClient | null {
  switch (produto) {
    case 'sete_ecos': return seteEcosClient
    case 'anima': return animaClient
    case 'veus': return veusClient
    case 'pitch': return pitchClient
  }
}

// Resolve origin string to product label (for messenger)
export function origemLabel(origem: string): string {
  if (origem === 'sete_ecos') return PRODUCTS.sete_ecos.label
  if (origem === 'sete_veus') return PRODUCTS.veus.label
  return origem
}

export function origemColor(origem: string): string {
  if (origem === 'sete_ecos') return PRODUCTS.sete_ecos.color
  if (origem === 'sete_veus') return PRODUCTS.veus.color
  return 'bg-hub-surface text-hub-text-muted'
}
