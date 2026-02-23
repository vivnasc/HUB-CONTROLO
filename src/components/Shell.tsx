import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Activity, MessageCircle, Users, BarChart3 } from 'lucide-react'
import { useUnreadCount } from '../hooks/useUnreadCount'

const tabs = [
  { to: '/', icon: Activity, label: 'Feed', exact: true },
  { to: '/messenger', icon: MessageCircle, label: 'Messenger' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/resumo', icon: BarChart3, label: 'Resumo' },
]

export default function Shell() {
  const location = useLocation()
  const unreadCount = useUnreadCount()

  // Hide tab bar in chat view
  const inChat = location.pathname.match(/^\/messenger\/[^/]+$/)

  return (
    <div className="min-h-screen bg-hub-bg flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {!inChat && (
        <nav className="fixed bottom-0 inset-x-0 bg-hub-surface/95 backdrop-blur-lg border-t border-hub-border safe-bottom z-50">
          <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
            {tabs.map(({ to, icon: Icon, label }) => {
              const isActive = to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to)

              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative"
                >
                  <div className="relative">
                    <Icon
                      size={22}
                      className={isActive ? 'text-hub-accent' : 'text-hub-text-dim'}
                    />
                    {label === 'Messenger' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-hub-danger text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? 'text-hub-accent' : 'text-hub-text-dim'
                    }`}
                  >
                    {label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
