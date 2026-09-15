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
import AppLayout from './layouts/AppLayout'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mod" element={<ModPanel />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report/:streamId" element={<StreamReport />} />
        </Route>
        <Route path="/overlay" element={<Overlay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
