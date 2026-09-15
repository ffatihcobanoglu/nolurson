import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart3, Users, Check, Clock, ArrowLeft, Trophy, AlertCircle, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CategoryBadge from '../components/CategoryBadge'
import type { Notification, Stream, NotificationSeen } from '../types'

interface ReportItem {
  notification: Notification
  seens: NotificationSeen[]
}

export default function StreamReport() {
  const { streamId } = useParams<{ streamId: string }>()
  const [stream, setStream] = useState<Stream | null>(null)
  const [reportItems, setReportItems] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!streamId) return

      const { data: streamData } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .maybeSingle()
      if (streamData) setStream(streamData as Stream)

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('stream_id', streamId)
        .order('unique_user_count', { ascending: false })
        .limit(20)

      if (notifs) {
        const items: ReportItem[] = []
        for (const notif of notifs as Notification[]) {
          const { data: seens } = await supabase
            .from('notification_seens')
            .select('*')
            .eq('notification_id', notif.id)
            .order('seen_at', { ascending: false })
          items.push({ notification: notif, seens: (seens as NotificationSeen[]) || [] })
        }
        setReportItems(items)
      }

      setLoading(false)
    }
    load()
  }, [streamId])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ color: 'var(--text-2)' }}>Rapor hazırlanıyor...</div>
      </div>
    )
  }

  const top5 = reportItems.slice(0, 5)
  const resolvedCount = reportItems.filter(i => i.notification.is_dismissed).length
  const unresolvedCount = reportItems.length - resolvedCount

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: 'var(--text-2)', fontSize: '14px', marginBottom: '20px',
        transition: 'var(--transition)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-0)'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-2)'}
      >
        <ArrowLeft size={16} /> Dashboard'a Dön
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <BarChart3 size={24} color="var(--accent)" />
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Yayın Sonu Raporu</h1>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>
          {stream?.title} — {stream ? new Date(stream.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Trophy size={16} color="var(--warning)" />
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Toplam Konu</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800 }}>{reportItems.length}</div>
        </div>
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Check size={16} color="var(--success)" />
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Çözülen</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)' }}>{resolvedCount}</div>
        </div>
        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertCircle size={16} color="var(--error)" />
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Çözülmemiş</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--error)' }}>{unresolvedCount}</div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
        En Çok Konuşulan 5 Konu
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {top5.length === 0 ? (
          <div style={{
            padding: '40px', textAlign: 'center',
            background: 'var(--bg-1)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text-3)',
          }}>
            Bu yayında bildirilen konu yok
          </div>
        ) : (
          top5.map((item, index) => (
            <div key={item.notification.id} style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              display: 'flex', gap: '16px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: index === 0 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: 800,
                color: index === 0 ? 'var(--warning)' : 'var(--text-2)',
                flexShrink: 0,
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CategoryBadge category={item.notification.category} size="md" />
                  {item.notification.is_dismissed && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      fontSize: '12px', color: 'var(--success)', fontWeight: 600,
                    }}>
                      <Check size={12} /> Çözüldü
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                  {item.notification.topic_label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-2)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} />
                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{item.notification.unique_user_count}</span>
                    farklı kullanıcı
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {new Date(item.notification.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {item.seens.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '10px', flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Görenler:</span>
                    {item.seens.map(seen => (
                      <span key={seen.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        padding: '3px 8px', borderRadius: '6px',
                        fontSize: '11px', fontWeight: 500,
                        background: seen.is_trusted ? 'rgba(16,185,129,0.1)' : 'var(--bg-3)',
                        color: seen.is_trusted ? 'var(--success)' : 'var(--text-2)',
                      }}>
                        {seen.is_trusted && <Shield size={10} />}
                        {seen.viewer_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {reportItems.length > 5 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-1)' }}>
            Diğer Konular
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reportItems.slice(5).map((item) => (
              <div key={item.notification.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-1)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CategoryBadge category={item.notification.category} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.notification.topic_label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                    {item.notification.unique_user_count} kullanıcı
                  </span>
                  {item.notification.is_dismissed && <Check size={14} color="var(--success)" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
