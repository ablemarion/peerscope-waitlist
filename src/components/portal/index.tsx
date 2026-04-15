import { useState, useEffect } from 'react'
import { PortalLayout } from './PortalLayout'
import { PortalDashboard } from './PortalDashboard'
import { PortalClients } from './PortalClients'
import { PortalProjects } from './PortalProjects'
import { PortalProjectDetail } from './PortalProjectDetail'
import { PortalReports } from './PortalReports'
import { PortalClientCompetitors } from './PortalClientCompetitors'
import { ClientPortal } from './ClientPortal'

type Page =
  | 'dashboard'
  | 'clients'
  | 'client-competitors'
  | 'projects'
  | 'project-detail'
  | 'reports'

function getPage(path: string): Page {
  // /portal/clients/:id/competitors — client competitor management
  if (/^\/portal\/clients\/[^/]+\/competitors$/.test(path)) return 'client-competitors'
  if (path.startsWith('/portal/clients')) return 'clients'
  if (path.startsWith('/portal/reports')) return 'reports'
  // /portal/projects/:id — detail view
  const projectDetail = path.match(/^\/portal\/projects\/([^/]+)$/)
  if (projectDetail) return 'project-detail'
  if (path.startsWith('/portal/projects')) return 'projects'
  return 'dashboard'
}

function getProjectId(path: string): string | null {
  const m = path.match(/^\/portal\/projects\/([^/]+)$/)
  return m ? m[1] : null
}

function getClientCompetitorsId(path: string): string | null {
  const m = path.match(/^\/portal\/clients\/([^/]+)\/competitors$/)
  return m ? m[1] : null
}

function normalisePath(path: string) {
  if (path === '/portal' || path === '/portal/') return '/portal/dashboard'
  return path
}

/** Extract role from the stored JWT without verifying signature (client-side only). */
function getSessionRole(): string | undefined {
  try {
    const raw = localStorage.getItem('peerscope_portal_jwt')
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
  const projectId = getProjectId(currentPath)
  const clientCompetitorsId = getClientCompetitorsId(currentPath)

  return (
    <PortalLayout currentPath={currentPath} role={role}>
      {page === 'dashboard' && <PortalDashboard />}
      {page === 'clients' && <PortalClients />}
      {page === 'client-competitors' && clientCompetitorsId && (
        <PortalClientCompetitors clientId={clientCompetitorsId} />
      )}
      {page === 'projects' && <PortalProjects />}
      {page === 'project-detail' && projectId && <PortalProjectDetail projectId={projectId} />}
      {page === 'reports' && <PortalReports />}
    </PortalLayout>
  )
}
