import { useState, useEffect } from 'react'
import { Eye, Users, Shield, Check, Crown, Radio } from 'lucide-react'
import CategoryBadge from './CategoryBadge'
import { supabase } from '../lib/supabase'
import { CATEGORY_COLORS, ROLE_COLORS } from '../types'
import type { Notification, NotificationSeen, Role } from '../types'

interface Props {
  notification: Notification
  viewerName: string
  role: Role
  isTrusted: boolean
  isStreamer?: boolean
  onSeen?: (notifId: string) => void
  variant?: 'panel' | 'overlay'
}

const ROLE_ICONS: Record<Role, typeof Crown> = {
  creator: Crown,
  streamer: Radio,
  moderator: Shield,
}

function SeenChip({ seen }: { seen: NotificationSeen }) {
  const color = ROLE_COLORS[seen.viewer_role] || 'var(--text-2)'
  const Icon = ROLE_ICONS[seen.viewer_role] || Eye
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px',
      background: `${color}15`,
      borderRadius: '6px',
      fontSize: '11px',
      color,
      fontWeight: 500,
    }}>
      <Icon size={10} />
      {seen.viewer_name}
    </div>
  )
}

export default function NotificationCard({ notification, viewerName, role, isTrusted, isStreamer = false, onSeen, variant = 'panel' }: Props) {
  const [seens, setSeens] = useState<NotificationSeen[]>([])
  const [dismissed, setDismissed] = useState(notification.is_dismissed)
  const [localSeen, setLocalSeen] = useState(false)

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
    if (dismissed || localSeen) return

    const { data: existing } = await supabase
      .from('notification_seens')
      .select('id')
      .eq('notification_id', notification.id)
      .eq('viewer_name', viewerName)
      .maybeSingle()

    if (existing) {
      setLocalSeen(true)
      return
    }

    const { error } = await supabase.from('notification_seens').insert({
      notification_id: notification.id,
      viewer_name: viewerName,
      is_trusted: isTrusted,
      viewer_role: role,
    })

    if (error) return

    // Optimistic: add local seen chip immediately
    const tempSeen: NotificationSeen = {
      id: 'temp-' + Date.now(),
      notification_id: notification.id,
      viewer_name: viewerName,
      viewer_avatar: null,
      is_trusted: isTrusted,
      viewer_role: role,
      seen_at: new Date().toISOString(),
    }
    setSeens(prev => [tempSeen, ...prev])
    setLocalSeen(true)

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
  const catColor = CATEGORY_COLORS[notification.category]
  const hasSeen = localSeen || seens.some(s => s.viewer_name === viewerName)

  return (
    <div style={{
      background: isOverlay ? 'rgba(18, 20, 26, 0.92)' : `linear-gradient(135deg, ${catColor}0d, var(--bg-2))`,
      border: `1px solid ${isOverlay ? 'rgba(255,255,255,0.08)' : `${catColor}33`}`,
      borderRadius: isOverlay ? '10px' : 'var(--radius)',
      padding: isOverlay ? '12px 14px' : '16px',
      animation: 'scaleIn 250ms ease-out',
      backdropFilter: isOverlay ? 'blur(8px)' : 'none',
      opacity: dismissed ? 0.5 : 1,
      transition: 'var(--transition)',
      borderLeft: `3px solid ${catColor}`,
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
            disabled={hasSeen}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: hasSeen ? `${ROLE_COLORS[role]}20` : 'var(--primary)',
              color: hasSeen ? ROLE_COLORS[role] : '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'var(--transition)',
              flexShrink: 0,
              border: hasSeen ? `1px solid ${ROLE_COLORS[role]}40` : 'none',
            }}
            onMouseEnter={(e) => { if (!hasSeen) e.currentTarget.style.background = 'var(--primary-dark)' }}
            onMouseLeave={(e) => { if (!hasSeen) e.currentTarget.style.background = 'var(--primary)' }}
          >
            {hasSeen ? <Check size={14} /> : <Eye size={14} />}
            {hasSeen ? 'Görüldü' : 'Gördüm'}
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
            <SeenChip key={seen.id} seen={seen} />
          ))}
        </div>
      )}
    </div>
  )
}
