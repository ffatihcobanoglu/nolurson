import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Radio, Eye, Shield, User, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import NotificationCard from '../components/NotificationCard'
import type { Stream, Notification, Role } from '../types'

export default function ModPanel() {
  const { stream, role } = useOutletContext<{ stream: Stream | null; role: Role }>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [viewerName, setViewerName] = useState('')
  const [isTrusted, setIsTrusted] = useState(false)
  const [isStreamer, setIsStreamer] = useState(false)
  const [trustedMods, setTrustedMods] = useState<string[]>([])
  const [streamerName, setStreamerName] = useState('')

  useEffect(() => {
    async function loadTrustedMods() {
      const { data } = await supabase
        .from('trusted_moderators')
        .select('username')
      if (data) setTrustedMods(data.map((d: any) => d.username))

      const { data: settings } = await supabase
        .from('settings')
        .select('streamer_username')
        .maybeSingle()
      if (settings?.streamer_username) setStreamerName(settings.streamer_username)
    }
    loadTrustedMods()
  }, [])

  useEffect(() => {
    if (!stream) return

    async function loadNotifications() {
      if (!stream) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('stream_id', stream.id)
        .eq('is_dismissed', false)
        .order('unique_user_count', { ascending: false })
        .limit(5)
      if (data) setNotifications(data as Notification[])
    }

    loadNotifications()

    const channel = supabase
      .channel('mod-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadNotifications)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_seens' }, loadNotifications)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [stream?.id])

  useEffect(() => {
    if (viewerName && trustedMods.includes(viewerName)) {
      setIsTrusted(true)
    } else {
      setIsTrusted(false)
    }
    if (streamerName && viewerName.toLowerCase() === streamerName.toLowerCase()) {
      setIsStreamer(true)
    } else {
      setIsStreamer(false)
    }
  }, [viewerName, trustedMods, streamerName])

  const roleIsStreamer = role === 'streamer' || role === 'creator'
  const roleIsTrusted = role === 'creator'

  if (!stream) return null

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Radio size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Moderatör Paneli</h1>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>
          Aktif bildirimleri görüp "Gördüm" olarak işaretleyin. En çok kullanıcı tarafından konuşulan konular üstte sıralanır.
        </p>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px',
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '24px',
      }}>
        <User size={18} color="var(--text-2)" />
        <input
          type="text"
          placeholder="Kullanıcı adınız"
          value={viewerName}
          onChange={(e) => setViewerName(e.target.value)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '14px', color: 'var(--text-0)',
          }}
        />
        {viewerName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px', fontWeight: 600,
            background: (isStreamer || roleIsStreamer) ? 'rgba(245, 158, 11, 0.15)' : (isTrusted || roleIsTrusted) ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-3)',
            color: (isStreamer || roleIsStreamer) ? 'var(--warning)' : (isTrusted || roleIsTrusted) ? 'var(--success)' : 'var(--text-2)',
          }}>
            {(isStreamer || roleIsStreamer) ? <Crown size={12} /> : (isTrusted || roleIsTrusted) ? <Shield size={12} /> : <Eye size={12} />}
            {(isStreamer || roleIsStreamer) ? 'Yayıncı' : (isTrusted || roleIsTrusted) ? 'Güvenilir Mod' : 'Normal Mod'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}>
            <Radio size={40} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: 'var(--text-2)', fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
              Aktif bildirim yok
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>
              Eşik geçildiğinde bildirimler burada görünecek
            </div>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              viewerName={viewerName || 'Anonim'}
              role={role}
              isTrusted={isTrusted || roleIsTrusted}
              isStreamer={isStreamer || roleIsStreamer}
            />
          ))
        )}
      </div>
    </div>
  )
}
