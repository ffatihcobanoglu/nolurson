import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Radio, Settings as SettingsIcon, Activity, History as HistoryIcon, Crown, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Stream, Role } from '../types'
import { startChatSimulator, stopChatSimulator } from '../lib/mockChat'
import { startClusteringEngine } from '../lib/clustering'

const ROLE_TABS: { id: Role; label: string; icon: typeof Crown; color: string }[] = [
  { id: 'creator', label: 'Yaratıcı', icon: Crown, color: '#f59e0b' },
  { id: 'streamer', label: 'Yayıncı', icon: Radio, color: '#6366f1' },
  { id: 'moderator', label: 'Moderatör', icon: Shield, color: '#10b981' },
]

function getNavItems(role: Role) {
  const base = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mod', label: 'Moderatör Paneli', icon: Radio },
    { to: '/history', label: 'Geçmiş', icon: HistoryIcon },
  ]
  if (role === 'creator') {
    return [...base, { to: '/settings', label: 'Ayarlar', icon: SettingsIcon }]
  }
  if (role === 'streamer') {
    return base
  }
  return [
    { to: '/mod', label: 'Moderatör Paneli', icon: Radio },
    { to: '/history', label: 'Geçmiş', icon: HistoryIcon },
  ]
}

export default function AppLayout() {
  const location = useLocation()
  const [role, setRole] = useState<Role>('creator')
  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let clusteringInterval: ReturnType<typeof setInterval> | null = null

    async function init() {
      const { data: activeStreams } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)

      let currentStream: Stream

      if (activeStreams && activeStreams.length > 0) {
        currentStream = activeStreams[0] as Stream
      } else {
        const { data: newStream, error: insertError } = await supabase
          .from('streams')
          .insert({
            title: 'Canlı Yayın',
            platform: 'twitch',
            status: 'active',
          })
          .select('*')
          .single()
        if (insertError || !newStream) {
          console.error('Failed to create stream:', insertError)
          setLoading(false)
          return
        }
        currentStream = newStream as Stream
      }

      setStream(currentStream)

      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle()

      if (settingsError || !settings) {
        console.error('Settings error:', settingsError)
        setLoading(false)
        return
      }

      startChatSimulator(currentStream.id)
      clusteringInterval = startClusteringEngine(currentStream.id, settings as any)

      setLoading(false)
    }
    init()

    return () => {
      stopChatSimulator()
      if (clusteringInterval) clearInterval(clusteringInterval)
    }
  }, [])

  // If role changes to moderator and we're on a page they can't see, redirect
  useEffect(() => {
    if (role === 'moderator' && location.pathname === '/') {
      window.history.replaceState({}, '', '/mod')
    }
  }, [role, location.pathname])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: 'var(--text-2)', fontSize: '14px' }}>Başlatılıyor...</span>
        </div>
      </div>
    )
  }

  const navItems = getNavItems(role)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top tab bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 24px',
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 0',
          marginRight: '24px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Chat Analiz</span>
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon
            const active = role === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setRole(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: active ? tab.color : 'var(--text-3)',
                  background: active ? `${tab.color}14` : 'transparent',
                  transition: 'var(--transition)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-1)' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <Icon size={15} />
                {tab.label}
                {active && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-14px',
                    left: '12px',
                    right: '12px',
                    height: '2px',
                    background: tab.color,
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {stream && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px',
            background: 'var(--bg-2)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'var(--error)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-0)' }}>Yayında</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{stream.title}</span>
          </div>
        )}
      </header>

      {/* Body: sidebar + content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: '220px',
          background: 'var(--bg-1)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to || (item.to === '/report' && location.pathname.startsWith('/report'))
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--text-0)' : 'var(--text-2)',
                    background: active ? 'var(--bg-3)' : 'transparent',
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-2)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-0)' }}>
          <Outlet context={{ stream, role }} />
        </main>
      </div>
    </div>
  )
}
