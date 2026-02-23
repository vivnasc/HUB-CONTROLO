import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, User } from 'lucide-react'
import {
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToMessages,
  formatTime,
  formatDate,
} from '../lib/messenger'
import { supabase } from '../lib/supabase'
import type { MessengerMessage, MessengerConversation } from '../types/database'

export default function Chat() {
  const { conversaId } = useParams<{ conversaId: string }>()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<MessengerMessage[]>([])
  const [conv, setConv] = useState<MessengerConversation | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!conversaId) return

    async function load() {
      const [{ data: convData }, msgs] = await Promise.all([
        supabase
          .from('messenger_conversations')
          .select('*, users!messenger_conversations_user_id_fkey(nome, email)')
          .eq('id', conversaId!)
          .single(),
        getMessages(conversaId!),
      ])

      setConv(convData as any)
      setMessages(msgs)
      setLoading(false)

      await markAsRead(conversaId!)
    }

    load()

    const channel = subscribeToMessages(conversaId!, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.sender_type === 'user') {
        markAsRead(conversaId!)
      }
    })

    return () => { supabase.removeChannel(channel) }
  }, [conversaId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const content = text.trim()
    if (!content || sending || !conversaId) return

    setSending(true)
    setText('')

    try {
      const msg = await sendMessage(conversaId, content)
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    } catch {
      setText(content)
    }

    setSending(false)
    inputRef.current?.focus()
  }

  const user = (conv?.users as any)
  const name = user?.nome || user?.email?.split('@')[0] || 'Cliente'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-hub-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-hub-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-hub-surface/95 backdrop-blur-lg border-b border-hub-border">
        <div className="max-w-lg mx-auto flex items-center gap-3 p-3">
          <button
            onClick={() => navigate('/messenger')}
            className="p-1 text-hub-text-dim hover:text-hub-text transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-full bg-hub-accent/20 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-hub-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-hub-text truncate">{name}</p>
            <p className="text-[10px] text-hub-text-dim">
              {conv?.origem === 'sete_ecos' ? 'Sete Ecos' : 'Sete Véus'} &middot; {conv?.canal}
            </p>
          </div>
          <button
            onClick={() => conv && navigate(`/clientes/${(conv.users as any)?.id || conv.user_id}`)}
            className="text-[11px] text-hub-accent font-medium px-2 py-1 rounded-lg hover:bg-hub-accent/10 transition-colors"
          >
            Perfil
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-3 py-4 space-y-1.5">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-hub-text-dim text-sm">Nenhuma mensagem ainda</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isCoach = msg.sender_type === 'coach'
            const isSystem = msg.tipo === 'sistema'
            const prevMsg = messages[idx - 1]
            const showDate = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString()

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center py-2">
                  <span className="text-[11px] text-hub-text-dim bg-hub-surface px-3 py-1 rounded-full">
                    {msg.conteudo}
                  </span>
                </div>
              )
            }

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center py-3">
                    <span className="text-[10px] text-hub-text-dim bg-hub-surface px-3 py-1 rounded-full">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                )}

                <div className={`flex ${isCoach ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                      isCoach
                        ? 'bg-hub-accent text-white rounded-br-md'
                        : 'bg-hub-surface text-hub-text rounded-bl-md border border-hub-border'
                    }`}
                  >
                    {msg.conteudo && (
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.conteudo}
                      </p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 ${isCoach ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${isCoach ? 'text-white/60' : 'text-hub-text-dim'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                      {isCoach && (
                        <svg
                          className={`w-3 h-3 ${msg.lida ? 'text-blue-300' : 'text-white/40'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-hub-surface/95 backdrop-blur-lg border-t border-hub-border safe-bottom">
        <div className="max-w-lg mx-auto flex items-end gap-2 p-3">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Escreve uma mensagem..."
            maxLength={1000}
            className="flex-1 bg-hub-card border border-hub-border rounded-2xl px-4 py-2.5 text-sm text-hub-text placeholder-hub-text-dim outline-none focus:border-hub-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl bg-hub-accent flex items-center justify-center text-white flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
