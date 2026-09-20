import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Dashboard from './pages/Dashboard'
import ModPanel from './pages/ModPanel'
import History from './pages/History'
import Overlay from './pages/Overlay'
import Settings from './pages/Settings'
import StreamReport from './pages/StreamReport'
import RoleSelect from './pages/RoleSelect'
import AppLayout from './layouts/AppLayout'
import { useRole } from './lib/roleContext'
import type { Role } from './types'

function AppRoutes({ role, setRole, clearRole }: { role: Role | null; setRole: (r: Role) => void; clearRole: () => void }) {
  if (!role) {
    return <RoleSelect onSelect={setRole} />
  }

  return (
    <Routes>
      <Route element={<AppLayout role={role} onRoleChange={clearRole} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mod" element={<ModPanel />} />
        <Route path="/history" element={<History />} />
        {role === 'creator' && <Route path="/settings" element={<Settings />} />}
        <Route path="/report/:streamId" element={<StreamReport />} />
      </Route>
      <Route path="/overlay" element={<Overlay />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const [role, setRole, clearRole] = useRole()
  return (
    <BrowserRouter>
      <AppRoutes role={role} setRole={setRole} clearRole={clearRole} />
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
