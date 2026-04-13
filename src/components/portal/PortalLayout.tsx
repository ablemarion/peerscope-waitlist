import { type ReactNode } from 'react'
import { Logo } from '../shared'

type NavItem = {
  label: string
  path: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/portal/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    path: '/portal/clients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    label: 'Projects',
    path: '/portal/projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4h14M2 9h10M2 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M16.5 15.5l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/portal/reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="1" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 6h8M5 9h8M5 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

interface PortalLayoutProps {
  children: ReactNode
  currentPath: string
  role?: string
}

export function PortalLayout({ children, currentPath, role }: PortalLayoutProps) {
  const isClientViewer = role === 'client_viewer'
  const visibleNavItems = isClientViewer
    ? NAV_ITEMS.filter((item) => item.path === '/portal/reports')
    : NAV_ITEMS
  function navigate(path: string) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="flex h-screen bg-[#F5F5F0] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[#0D0F1A] flex flex-col border-r border-white/5">
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Logo dark />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="2" fill="#6366f1" />
              </svg>
            </div>
            <span className="text-xs text-white/40 font-sans">Agency Portal</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Portal navigation">
          {visibleNavItems.map((item) => {
            const isActive = currentPath === item.path || (currentPath === '/portal' && item.path === '/portal/dashboard')
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left',
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 font-medium'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-white/30'}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1 h-4 rounded-full bg-indigo-400" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-medium">
              A
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/60 truncate">Agency</p>
              <p className="text-[10px] text-white/30 truncate">admin@agency.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center px-6 bg-white border-b border-gray-200 flex-shrink-0">
          <h1 className="text-sm font-medium text-gray-900">
            {NAV_ITEMS.find(i => i.path === currentPath)?.label ?? (isClientViewer ? 'Reports' : 'Dashboard')}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Live
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
