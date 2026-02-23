import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { isCoach } from '../lib/coach'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  loading: boolean
  authorized: boolean
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  authorized: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    loading: true,
    authorized: false,
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      setState(prev => ({ ...prev, loading: false }))
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout)
      setState({
        session,
        loading: false,
        authorized: isCoach(session?.user?.email),
      })
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
