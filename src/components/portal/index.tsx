import { useState, useEffect } from 'react'
import { PortalLayout } from './PortalLayout'
import { PortalDashboard } from './PortalDashboard'
import { PortalClients } from './PortalClients'
import { PortalProjects } from './PortalProjects'
import { ClientPortal } from './ClientPortal'

function PortalReports() {
  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Generated competitive intelligence reports for your clients.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300 mx-auto mb-3">
          <rect x="4" y="3" width="24" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M10 10h12M10 15h12M10 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-sm font-medium text-gray-700">No reports yet</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
          Reports will appear here after you generate them from a project.
        </p>
      </div>
    </div>
  )
}

function getPage(path: string) {
  if (path.startsWith('/portal/clients')) return 'clients'
  if (path.startsWith('/portal/projects')) return 'projects'
  if (path.startsWith('/portal/reports')) return 'reports'
  return 'dashboard'
}

function normalisePath(path: string) {
  if (path === '/portal' || path === '/portal/') return '/portal/dashboard'
  return path
}

/** Extract role from the stored JWT without verifying signature (client-side only). */
function getSessionRole(): string | undefined {
  try {
    const raw = localStorage.getItem('peerscope_session')
    if (!raw) return undefined
    const parts = raw.split('.')
    if (parts.length < 2) return undefined
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
    return typeof payload.role === 'string' ? payload.role : undefined
  } catch {
    return undefined
  }
}

export function Portal() {
  const [currentPath, setCurrentPath] = useState(() => normalisePath(window.location.pathname))
  const role = getSessionRole()

  useEffect(() => {
    function onPopState() {
      setCurrentPath(normalisePath(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // client_viewer gets the standalone ClientPortal view (no sidebar layout)
  if (role === 'client_viewer') {
    return <ClientPortal />
  }

  const page = getPage(currentPath)

  return (
    <PortalLayout currentPath={currentPath} role={role}>
      {page === 'dashboard' && <PortalDashboard />}
      {page === 'clients' && <PortalClients />}
      {page === 'projects' && <PortalProjects />}
      {page === 'reports' && <PortalReports />}
    </PortalLayout>
  )
}
