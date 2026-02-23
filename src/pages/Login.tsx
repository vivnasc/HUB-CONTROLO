import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isCoach } from '../lib/coach'
import { useAuth } from '../contexts/AuthContext'
import { Shield } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { authorized } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already authenticated coach
  if (authorized) {
    navigate('/', { replace: true })
    return null
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isCoach(email)) {
      setError('Acesso restrito.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou password incorrectos.')
      setLoading(false)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-hub-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-hub-accent/20 flex items-center justify-center mb-4">
            <Shield size={32} className="text-hub-accent" />
          </div>
          <h1 className="text-xl font-bold text-hub-text">HUB Controlo</h1>
          <p className="text-hub-text-dim text-sm mt-1">Cabine de pilotagem</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-4 py-3 text-hub-text placeholder-hub-text-dim text-sm outline-none focus:border-hub-accent transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-hub-surface border border-hub-border rounded-xl px-4 py-3 text-hub-text placeholder-hub-text-dim text-sm outline-none focus:border-hub-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-hub-danger text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-hub-accent hover:bg-hub-accent-light text-white font-medium rounded-xl py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
