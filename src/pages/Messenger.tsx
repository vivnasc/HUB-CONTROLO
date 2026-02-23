import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Search } from 'lucide-react'
import { getConversations, subscribeToConversations, timeAgo } from '../lib/messenger'
import { supabase } from '../lib/supabase'
import type { MessengerConversation } from '../types/database'

export default function Messenger() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<MessengerConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    try {
      const data = await getConversations()
      setConversations(data)
    } catch {
      // Might not be connected to Supabase yet
    }
    setLoading(false)
  }

  useEffect(() => {
    load()

    const channel = subscribeToConversations(() => load())
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = search
    ? conversations.filter((c) => {
        const name = (c.users as any)?.nome || (c.users as any)?.email || ''
        return name.toLowerCase().includes(search.toLowerCase())
      })
    : conversations

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-hub-accent/20 flex items-center justify-center">
          <MessageCircle size={20} className="text-hub-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-hub-text">Messenger</h1>
          <p className="text-[11px] text-hub-text-dim">
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-hub-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar cliente..."
          className="w-full bg-hub-surface border border-hub-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-hub-text placeholder-hub-text-dim outline-none focus:border-hub-accent transition-colors"
        />
      </div>

      {/* Conversations list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-hub-surface rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-hub-card" />
                <div className="flex-1">
                  <div className="h-4 bg-hub-card rounded w-1/3 mb-2" />
                  <div className="h-3 bg-hub-card rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-hub-surface flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={28} className="text-hub-text-dim" />
          </div>
          <p className="text-hub-text-muted text-sm">
            {search ? 'Nenhuma conversa encontrada' : 'Sem conversas'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((conv) => {
            const user = conv.users as any
            const name = user?.nome || user?.email?.split('@')[0] || 'Cliente'
            const hasUnread = conv.unread_coach > 0

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/messenger/${conv.id}`)}
                className={`w-full text-left rounded-xl p-3.5 transition-colors ${
                  hasUnread ? 'bg-hub-accent/10 border border-hub-accent/20' : 'bg-hub-surface hover:bg-hub-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    hasUnread ? 'bg-hub-accent text-white' : 'bg-hub-card text-hub-text-muted'
                  }`}>
                    {name[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-hub-text' : 'text-hub-text'}`}>
                        {name}
                      </p>
                      <span className="text-[10px] text-hub-text-dim flex-shrink-0 ml-2">
                        {conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${hasUnread ? 'text-hub-text-muted font-medium' : 'text-hub-text-dim'}`}>
                        {conv.last_sender_type === 'coach' && (
                          <span className="text-hub-accent">Tu: </span>
                        )}
                        {conv.last_message || 'Sem mensagens'}
                      </p>
                      {hasUnread && (
                        <span className="bg-hub-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                          {conv.unread_coach > 9 ? '9+' : conv.unread_coach}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Origin badge */}
                <div className="flex items-center gap-1.5 mt-2 ml-[52px]">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    conv.origem === 'sete_ecos'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {conv.origem === 'sete_ecos' ? 'Sete Ecos' : 'Sete Véus'}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    conv.canal === 'pessoal'
                      ? 'bg-hub-accent/20 text-hub-accent-light'
                      : 'bg-hub-success/20 text-hub-success'
                  }`}>
                    {conv.canal === 'pessoal' ? 'Pessoal' : 'Chatbot'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
