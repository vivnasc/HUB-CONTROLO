import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Shell from './components/Shell'
import Feed from './pages/Feed'
import Messenger from './pages/Messenger'
import Chat from './pages/Chat'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Summary from './pages/Summary'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, authorized } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hub-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-hub-accent border-t-transparent animate-spin" />
          <p className="text-hub-text-muted text-sm">A carregar...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Feed />} />
        <Route path="messenger" element={<Messenger />} />
        <Route path="messenger/:conversaId" element={<Chat />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="clientes/:userId" element={<ClientDetail />} />
        <Route path="resumo" element={<Summary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
