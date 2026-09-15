import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CategoryBadge from '../components/CategoryBadge'
import type { Notification } from '../types'

export default function Overlay() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [streamId, setStreamId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: stream } = await supabase
        .from('streams')
        .select('id')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .maybeSingle()

      if (stream) {
        setStreamId(stream.id)
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('stream_id', stream.id)
          .eq('is_dismissed', false)
          .order('unique_user_count', { ascending: false })
          .limit(5)
        if (notifs) setNotifications(notifs as Notification[])
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!streamId) return

    const channel = supabase
      .channel('overlay')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `stream_id=eq.${streamId}` },
        async () => {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('stream_id', streamId)
            .eq('is_dismissed', false)
            .order('unique_user_count', { ascending: false })
            .limit(5)
          if (data) setNotifications(data as Notification[])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [streamId])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      width: '320px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
      fontFamily: 'Inter, sans-serif',
    }}>
      {notifications.map((notif, index) => (
        <div
          key={notif.id}
          style={{
            background: 'rgba(10, 11, 15, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '12px 14px',
            backdropFilter: 'blur(12px)',
            animation: 'scaleIn 250ms ease-out',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            opacity: 1 - index * 0.15,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <CategoryBadge category={notif.category} />
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#f0f2f8',
            marginBottom: '4px',
          }}>
            {notif.topic_label}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '12px',
            color: '#c4c9d6',
          }}>
            <Users size={12} />
            <span style={{ fontWeight: 700, color: '#818cf8' }}>
              {notif.unique_user_count}
            </span>
            farklı kullanıcı
          </div>
        </div>
      ))}
    </div>
  )
}
