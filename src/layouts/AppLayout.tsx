import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Radio, Settings as SettingsIcon, Activity, History as HistoryIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Stream } from '../types'
import { startChatSimulator, stopChatSimulator } from '../lib/mockChat'
import { startClusteringEngine } from '../lib/clustering'

export default function AppLayout() {
  const location = useLocation()
  const [stream, setStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let clusteringInterval: ReturnType<typeof setInterval> | null = null

    async function init() {
      // Use .limit(1) + index instead of maybeSingle to avoid errors with multiple active streams
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

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mod', label: 'Moderatör Paneli', icon: Radio },
    { to: '/history', label: 'Geçmiş', icon: HistoryIcon },
    { to: '/settings', label: 'Ayarlar', icon: SettingsIcon },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: '240px',
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Chat Analiz</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Yayıncı Asistanı</div>
          </div>
        </div>

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

        {stream && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px',
              background: 'var(--bg-2)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--error)',
                animation: 'pulse 2s ease-in-out infinite',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-0)' }}>Yayında</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stream.title}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-0)' }}>
        <Outlet context={{ stream }} />
      </main>
    </div>
  )
}
