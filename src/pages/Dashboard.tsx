import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Bell, TrendingUp, Users, Activity, BarChart3, Clock, ChevronRight, Radio, Zap, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CategoryBadge from '../components/CategoryBadge'
import { CATEGORY_LABELS } from '../types'
import { getSimulatorStats } from '../lib/mockChat'
import type { Stream, Notification, TopicHistoryItem, Role } from '../types'

export default function Dashboard() {
  const { stream, role } = useOutletContext<{ stream: Stream | null; role: Role }>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [topicHistory, setTopicHistory] = useState<TopicHistoryItem[]>([])
  const [stats, setStats] = useState({ totalMessages: 0, activeClusters: 0, totalNotifications: 0, dismissedCount: 0 })
  const [liveStats, setLiveStats] = useState({ uniqueChatters: 0, messagesLastWindow: 0, msgPerSec: 0, burstMode: false })
  const msgCountRef = useRef(0)
  const lastMsgCountRef = useRef(0)

  useEffect(() => {
    if (!stream) return

    async function loadData() {
      if (!stream) return

      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('stream_id', stream.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const { data: history } = await supabase
        .from('topic_history')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(20)

      const { count: msgCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', stream.id)

      const { count: clusterCount } = await supabase
        .from('clusters')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', stream.id)
        .eq('is_active', true)

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', stream.id)

      const { count: dismissedCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', stream.id)
        .eq('is_dismissed', true)

      setNotifications(notifs as Notification[] || [])
      setTopicHistory(history as TopicHistoryItem[] || [])
      setStats({
        totalMessages: msgCount || 0,
        activeClusters: clusterCount || 0,
        totalNotifications: notifCount || 0,
        dismissedCount: dismissedCount || 0,
      })

      // Count unique chatters in the last 2 minutes
      const since2min = new Date(Date.now() - 120 * 1000).toISOString()
      const { data: recentMsgs } = await supabase
        .from('chat_messages')
        .select('username, is_filtered')
        .eq('stream_id', stream.id)
        .gte('created_at', since2min)
      if (recentMsgs) {
        const unique = new Set(recentMsgs.filter((m: any) => !m.is_filtered).map((m: any) => m.username))
        const delta = (msgCount || 0) - lastMsgCountRef.current
        lastMsgCountRef.current = msgCount || 0
        setLiveStats({
          uniqueChatters: unique.size,
          messagesLastWindow: recentMsgs.length,
          msgPerSec: Math.max(0, delta / 3),
          burstMode: getSimulatorStats().burstMode,
        })
      }
    }

    loadData()

    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clusters' }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_history' }, loadData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [stream?.id])

  if (!stream) return null

  const statCards = [
    { label: 'Toplam Mesaj', value: stats.totalMessages, icon: Activity, color: 'var(--accent)' },
    { label: 'Benzersiz İzleyici (2dk)', value: liveStats.uniqueChatters, icon: Users, color: 'var(--primary)' },
    { label: 'Aktif Küme', value: stats.activeClusters, icon: TrendingUp, color: 'var(--primary-light)' },
    { label: 'Bildirim', value: stats.totalNotifications, icon: Bell, color: 'var(--warning)' },
    { label: 'Çözülen', value: stats.dismissedCount, icon: Users, color: 'var(--success)' },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          {role === 'creator' ? 'Yaratıcı Paneli' : role === 'streamer' ? 'Yayıncı Paneli' : 'Dashboard'}
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>
          {stream.title} — {new Date(stream.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} tarihinden beri yayında
        </p>
      </div>

      {/* Simulasyon canlı paneli */}
      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: liveStats.burstMode ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {liveStats.burstMode
              ? <Zap size={20} color="var(--error)" />
              : <Radio size={20} color="var(--accent)" />}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 500 }}>Simülasyon Durumu</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: liveStats.burstMode ? 'var(--error)' : 'var(--accent)' }}>
              {liveStats.burstMode ? 'Burst Modu (Yoğun)' : 'Normal Akış'}
            </div>
          </div>
        </div>
        <div style={{ height: '32px', width: '1px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="var(--text-2)" />
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-0)' }}>{liveStats.uniqueChatters}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', marginLeft: '4px' }}>benzersiz kullanıcı (son 2dk)</span>
          </div>
        </div>
        <div style={{ height: '32px', width: '1px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="var(--text-2)" />
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-0)' }}>{liveStats.messagesLastWindow}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', marginLeft: '4px' }}>mesaj (son 2dk)</span>
          </div>
        </div>
        <div style={{ height: '32px', width: '1px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--text-2)" />
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-0)' }}>{liveStats.msgPerSec.toFixed(1)}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)', marginLeft: '4px' }}>mesaj/sn</span>
          </div>
        </div>
        <div style={{
          marginLeft: 'auto', padding: '6px 12px',
          background: 'rgba(16,185,129,0.1)', borderRadius: '6px',
          fontSize: '12px', fontWeight: 600, color: 'var(--success)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s ease-in-out infinite' }} />
          1000 izleyicili simülasyon
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} style={{
              background: 'var(--bg-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{stat.label}</span>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${stat.color}1a`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={stat.color} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-0)' }}>{stat.value}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Bell size={16} color="var(--primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Son Bildirimler</h2>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '14px' }}>
                Henüz bildirim yok. Chat akışı başladığında bildirimler burada görünecek.
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => (
                <div key={notif.id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px',
                  opacity: notif.is_dismissed ? 0.5 : 1,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <CategoryBadge category={notif.category} />
                      {notif.is_dismissed && (
                        <span style={{ fontSize: '11px', color: 'var(--success)' }}>Görüldü</span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-0)' }}>
                      {notif.topic_label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                      {notif.unique_user_count} farklı kullanıcı
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {new Date(notif.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <BarChart3 size={16} color="var(--accent)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Konu Geçmişi</h2>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {topicHistory.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '14px' }}>
                Henüz konu geçmişi yok. Birden fazla yayın yapıldıkça burada tekrarlayan konular görünecek.
              </div>
            ) : (
              topicHistory.map((topic) => (
                <div key={topic.id} style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-0)' }}>
                      {topic.topic_label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {topic.hit_count} kez eşiği geçti
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: topic.hit_count >= 3 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-3)',
                    color: topic.hit_count >= 3 ? 'var(--error)' : 'var(--text-2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    {topic.hit_count >= 3 ? 'Tekrarlayan' : 'Yeni'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a
          href={`/report/${stream.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px',
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-1)',
            fontSize: '14px', fontWeight: 600,
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <BarChart3 size={16} />
          Yayın Sonu Özet Raporu
          <ChevronRight size={16} />
        </a>
      </div>
    </div>
  )
}
