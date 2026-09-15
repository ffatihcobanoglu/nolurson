import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { History as HistoryIcon, Users, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CategoryBadge from '../components/CategoryBadge'
import type { Stream, Notification, NotificationSeen } from '../types'

export default function History() {
  const { stream } = useOutletContext<{ stream: Stream | null }>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [seensMap, setSeensMap] = useState<Record<string, NotificationSeen[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stream) return

    async function loadHistory() {
      if (!stream) return
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('stream_id', stream.id)
        .eq('is_dismissed', true)
        .order('created_at', { ascending: false })
        .limit(50)

      const notifs = (data || []) as Notification[]
      setNotifications(notifs)

      if (notifs.length > 0) {
        const ids = notifs.map((n) => n.id)
        const { data: seens } = await supabase
          .from('notification_seens')
          .select('*')
          .in('notification_id', ids)
          .order('seen_at', { ascending: false })

        const map: Record<string, NotificationSeen[]> = {}
        if (seens) {
          for (const s of seens as NotificationSeen[]) {
            if (!map[s.notification_id]) map[s.notification_id] = []
            map[s.notification_id].push(s)
          }
        }
        setSeensMap(map)
      }

      setLoading(false)
    }

    loadHistory()

    const channel = supabase
      .channel('history-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadHistory)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [stream?.id])

  if (!stream) return null

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <HistoryIcon size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Geçmiş Bildirimler</h1>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>
          "Gördüm" olarak işaretlenmiş bildirimler burada listelenir.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <span style={{ color: 'var(--text-2)', fontSize: '14px' }}>Yükleniyor...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <HistoryIcon size={40} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-2)', fontSize: '15px', fontWeight: 500, marginBottom: '4px' }}>
            Geçmiş bildirim yok
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>
            "Gördüm" işaretlenen bildirimler burada görünecek
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => {
            const seens = seensMap[notif.id] || []
            return (
              <div
                key={notif.id}
                style={{
                  background: 'var(--bg-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  opacity: 0.85,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CategoryBadge category={notif.category} size="md" />
                      {notif.confidence_score < 0.5 && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          fontSize: '11px', color: 'var(--warning)', fontWeight: 500,
                        }}>
                          <Shield size={11} /> Düşük güven
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--text-0)',
                      marginBottom: '4px',
                    }}>
                      {notif.topic_label}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: 'var(--text-1)',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} />
                        <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>
                          {notif.unique_user_count}
                        </span>
                        farklı kullanıcı
                      </span>
                      <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>
                        {new Date(notif.created_at).toLocaleString('tr-TR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {seens.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '12px', paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                    flexWrap: 'wrap',
                  }}>
                    {seens.map((seen) => (
                      <div key={seen.id} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px',
                        background: seen.is_trusted ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-3)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: seen.is_trusted ? 'var(--success)' : 'var(--text-2)',
                        fontWeight: 500,
                      }}>
                        {seen.is_trusted && <Shield size={10} />}
                        {seen.viewer_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
