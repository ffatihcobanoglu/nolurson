import { Crown, Radio, Shield, ChevronRight, Activity } from 'lucide-react'
import type { Role } from '../types'

interface Props {
  onSelect: (role: Role) => void
}

const ROLES: {
  id: Role
  title: string
  subtitle: string
  description: string
  icon: typeof Crown
  color: string
  bg: string
  border: string
}[] = [
  {
    id: 'creator',
    title: 'Yaratıcı',
    subtitle: 'Sahip / Geliştirici',
    description: 'Tüm ayarlara, istatistiklere ve moderatör yönetimine tam erişim. Sistemin tüm özelliklerini kullanabilir.',
    icon: Crown,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'streamer',
    title: 'Yayıncı',
    subtitle: 'Yayın Sahibi',
    description: 'Dashboard, bildirimler, geçmiş ve yayın sonu raporu. Ayarları görüntüleyebilir ama değiştiremez.',
    icon: Radio,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.3)',
  },
  {
    id: 'moderator',
    title: 'Moderatör',
    subtitle: 'Mod Paneli',
    description: 'Aktif bildirimleri görüp "Gördüm" olarak işaretleyebilir. Geçmiş ve raporları görüntüleyebilir.',
    icon: Shield,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
]

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      background: 'var(--bg-0)',
    }}>
      <div style={{ maxWidth: '860px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px', height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
          }}>
            <Activity size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
            Chat Analiz
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '16px' }}>
            Devam etmek için rolünüzü seçin
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          {ROLES.map((r) => {
            const Icon = r.icon
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '28px 24px',
                  background: r.bg,
                  border: `1px solid ${r.border}`,
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 12px 40px ${r.bg}`
                  e.currentTarget.style.borderColor = r.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = r.border
                }}
              >
                <div style={{
                  width: '48px', height: '48px',
                  borderRadius: '14px',
                  background: `${r.color}1a`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <Icon size={24} color={r.color} />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '2px' }}>
                  {r.title}
                </div>
                <div style={{ fontSize: '12px', color: r.color, fontWeight: 600, marginBottom: '12px' }}>
                  {r.subtitle}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
                  {r.description}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: r.color,
                }}>
                  Devam et
                  <ChevronRight size={16} />
                </div>
              </button>
            )
          })}
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '12px',
          color: 'var(--text-3)',
        }}>
          Rolünüz daha sonra menüden değiştirilebilir
        </p>
      </div>
    </div>
  )
}
