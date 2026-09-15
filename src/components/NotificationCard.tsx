import { useState, useEffect } from 'react'
import { Eye, Users, Shield, Check } from 'lucide-react'
import CategoryBadge from './CategoryBadge'
import { supabase } from '../lib/supabase'
import type { Notification, NotificationSeen } from '../types'

interface Props {
  notification: Notification
  viewerName: string
  isTrusted: boolean
  isStreamer?: boolean
  onSeen?: (notifId: string) => void
  variant?: 'panel' | 'overlay'
}

export default function NotificationCard({ notification, viewerName, isTrusted, isStreamer = false, onSeen, variant = 'panel' }: Props) {
  const [seens, setSeens] = useState<NotificationSeen[]>([])
  const [dismissed, setDismissed] = useState(notification.is_dismissed)

  useEffect(() => {
    async function loadSeens() {
      const { data } = await supabase
        .from('notification_seens')
        .select('*')
        .eq('notification_id', notification.id)
        .order('seen_at', { ascending: false })
      if (data) setSeens(data as NotificationSeen[])
    }
    loadSeens()

    const channel = supabase
      .channel(`notif-${notification.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_seens', filter: `notification_id=eq.${notification.id}` },
        () => loadSeens()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [notification.id])

  async function handleSeen() {
    if (dismissed) return

    const { data: existing } = await supabase
      .from('notification_seens')
      .select('id')
      .eq('notification_id', notification.id)
      .eq('viewer_name', viewerName)
      .maybeSingle()

    if (existing) return

    await supabase.from('notification_seens').insert({
      notification_id: notification.id,
      viewer_name: viewerName,
      is_trusted: isTrusted,
    })

    if (isTrusted || isStreamer) {
      await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notification.id)
      setDismissed(true)
    }

    onSeen?.(notification.id)
  }

  if (dismissed && variant === 'panel') return null

  const isOverlay = variant === 'overlay'

  return (
    <div style={{
      background: isOverlay ? 'rgba(18, 20, 26, 0.92)' : 'var(--bg-2)',
      border: `1px solid ${isOverlay ? 'rgba(255,255,255,0.08)' : 'var(--border)'}`,
      borderRadius: isOverlay ? '10px' : 'var(--radius)',
      padding: isOverlay ? '12px 14px' : '16px',
      animation: 'scaleIn 250ms ease-out',
      backdropFilter: isOverlay ? 'blur(8px)' : 'none',
      opacity: dismissed ? 0.5 : 1,
      transition: 'var(--transition)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CategoryBadge category={notification.category} size={isOverlay ? 'sm' : 'md'} />
            {notification.confidence_score < 0.5 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '11px', color: 'var(--warning)', fontWeight: 500,
              }}>
                <Shield size={11} /> Düşük güven
              </span>
            )}
          </div>
          <div style={{
            fontSize: isOverlay ? '14px' : '16px',
            fontWeight: 700,
            color: 'var(--text-0)',
            marginBottom: '4px',
          }}>
            {notification.topic_label}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: isOverlay ? '12px' : '13px',
            color: 'var(--text-1)',
          }}>
            <Users size={isOverlay ? 12 : 14} />
            <span style={{ fontWeight: 600, color: 'var(--primary-light)' }}>
              {notification.unique_user_count}
            </span>
            farklı kullanıcı bu konuyu konuşuyor
          </div>
        </div>

        {!isOverlay && (
          <button
            onClick={handleSeen}
            disabled={dismissed}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: dismissed ? 'var(--bg-3)' : 'var(--primary)',
              color: dismissed ? 'var(--text-3)' : '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'var(--transition)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (!dismissed) e.currentTarget.style.background = 'var(--primary-dark)' }}
            onMouseLeave={(e) => { if (!dismissed) e.currentTarget.style.background = 'var(--primary)' }}
          >
            {dismissed ? <Check size={14} /> : <Eye size={14} />}
            {dismissed ? 'Görüldü' : 'Gördüm'}
          </button>
        )}
      </div>

      {seens.length > 0 && !isOverlay && (
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
}
