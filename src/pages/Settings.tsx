import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Shield, Plus, X, Volume2, VolumeX, Users, Percent, Hash, Crown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Settings as SettingsType, TrustedModerator } from '../types'

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [trustedMods, setTrustedMods] = useState<TrustedModerator[]>([])
  const [newMod, setNewMod] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle()
      if (s) setSettings(s as SettingsType)

      const { data: mods } = await supabase
        .from('trusted_moderators')
        .select('*')
        .order('added_at', { ascending: false })
      if (mods) setTrustedMods(mods as TrustedModerator[])
    }
    load()
  }, [])

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    await supabase
      .from('settings')
      .update({
        threshold_mode: settings.threshold_mode,
        threshold_value: settings.threshold_value,
        threshold_min_users: settings.threshold_min_users,
        window_seconds: settings.window_seconds,
        sound_enabled: settings.sound_enabled,
        streamer_username: settings.streamer_username,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)
    setSaving(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  async function addMod() {
    if (!newMod.trim()) return
    const { data } = await supabase
      .from('trusted_moderators')
      .insert({ username: newMod.trim() })
      .select('*')
      .single()
    if (data) {
      setTrustedMods([data as TrustedModerator, ...trustedMods])
      setNewMod('')
    }
  }

  async function removeMod(id: string) {
    await supabase.from('trusted_moderators').delete().eq('id', id)
    setTrustedMods(trustedMods.filter(m => m.id !== id))
  }

  if (!settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ color: 'var(--text-2)' }}>Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <SettingsIcon size={24} color="var(--primary)" />
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Ayarlar</h1>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>
          Eşik değerlerini ve güvenilir moderatörleri buradan yönetin.
        </p>
      </div>

      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Eşik Ayarları</h2>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '10px' }}>
            Eşik Modu
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setSettings({ ...settings, threshold_mode: 'fixed' })}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                padding: '14px',
                background: settings.threshold_mode === 'fixed' ? 'var(--primary)' : 'var(--bg-2)',
                border: `1px solid ${settings.threshold_mode === 'fixed' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: settings.threshold_mode === 'fixed' ? '#fff' : 'var(--text-1)',
                fontSize: '14px', fontWeight: 600,
                transition: 'var(--transition)',
              }}
            >
              <Hash size={16} /> Sabit Sayı
            </button>
            <button
              onClick={() => setSettings({ ...settings, threshold_mode: 'percentage' })}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                padding: '14px',
                background: settings.threshold_mode === 'percentage' ? 'var(--primary)' : 'var(--bg-2)',
                border: `1px solid ${settings.threshold_mode === 'percentage' ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: settings.threshold_mode === 'percentage' ? '#fff' : 'var(--text-1)',
                fontSize: '14px', fontWeight: 600,
                transition: 'var(--transition)',
              }}
            >
              <Percent size={16} /> Yüzde
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
            {settings.threshold_mode === 'fixed' ? 'Eşik Değeri (kişi sayısı)' : 'Eşik Yüzdesi (%)'}
          </label>
          <input
            type="number"
            value={settings.threshold_value}
            min={settings.threshold_mode === 'fixed' ? 1 : 1}
            max={settings.threshold_mode === 'fixed' ? 500 : 100}
            onChange={(e) => setSettings({ ...settings, threshold_value: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: '15px', color: 'var(--text-0)',
              outline: 'none', transition: 'var(--transition)',
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
            {settings.threshold_mode === 'fixed'
              ? `${settings.threshold_value} farklı kullanıcı aynı konuyu konuşunca bildirim oluşur`
              : `Aktif penceredeki tüm yorumcuların %${settings.threshold_value}'i aynı konuyu konuşunca bildirim oluşur`}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
              Minimum Kişi Sayısı
            </label>
            <input
              type="number"
              value={settings.threshold_min_users}
              min={1}
              max={50}
              onChange={(e) => setSettings({ ...settings, threshold_min_users: parseInt(e.target.value) || 1 })}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: '15px', color: 'var(--text-0)',
                outline: 'none', transition: 'var(--transition)',
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
              En az bu kadar kişi olmalı
            </p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
              Zaman Penceresi (sn)
            </label>
            <input
              type="number"
              value={settings.window_seconds}
              min={30}
              max={600}
              onChange={(e) => setSettings({ ...settings, window_seconds: parseInt(e.target.value) || 120 })}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: '15px', color: 'var(--text-0)',
                outline: 'none', transition: 'var(--transition)',
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
              Son {settings.window_seconds} saniyedeki mesajlar
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'var(--bg-2)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {settings.sound_enabled ? <Volume2 size={18} color="var(--accent)" /> : <VolumeX size={18} color="var(--text-3)" />}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Sesli Uyarı</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Kritik eşik geçildiğinde ses efekti</div>
            </div>
          </div>
          <button
            onClick={() => setSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: settings.sound_enabled ? 'var(--primary)' : 'var(--bg-3)',
              position: 'relative', transition: 'var(--transition)',
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: settings.sound_enabled ? '23px' : '3px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: '#fff', transition: 'var(--transition)',
            }} />
          </button>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          style={{
            width: '100%', padding: '14px',
            background: savedFlash ? 'var(--success)' : 'var(--primary)',
            color: '#fff', borderRadius: 'var(--radius-sm)',
            fontSize: '15px', fontWeight: 700,
            transition: 'var(--transition)',
          }}
        >
          {saving ? 'Kaydediliyor...' : savedFlash ? 'Kaydedildi!' : 'Ayarları Kaydet'}
        </button>
      </div>

      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Crown size={18} color="var(--warning)" />
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Yayıncı Adı</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px' }}>
          Yayıncı adını girin. Bu isimle giriş yapan kişi de bildirimleri "Gördüm" olarak geçmişe taşıyabilir.
        </p>
        <input
          type="text"
          placeholder="Yayıncı kullanıcı adı"
          value={settings.streamer_username}
          onChange={(e) => setSettings({ ...settings, streamer_username: e.target.value })}
          style={{
            width: '100%', padding: '12px 14px',
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text-0)',
            outline: 'none', transition: 'var(--transition)',
          }}
        />
      </div>

      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Shield size={18} color="var(--success)" />
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Güvenilir Moderatörler</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px' }}>
          Güvenilir moderatörler "Gördüm" dediğinde bildirim herkesin ekranından kalkar.
          Normal moderatörlerin "Gördüm"ü sadece kendi ekranını etkiler.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Moderatör kullanıcı adı"
            value={newMod}
            onChange={(e) => setNewMod(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMod()}
            style={{
              flex: 1, padding: '12px 14px',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text-0)',
              outline: 'none', transition: 'var(--transition)',
            }}
          />
          <button
            onClick={addMod}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '12px 16px',
              background: 'var(--primary)', color: '#fff',
              borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 600,
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
          >
            <Plus size={16} /> Ekle
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {trustedMods.length === 0 ? (
            <div style={{
              padding: '24px', textAlign: 'center',
              background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-3)', fontSize: '14px',
            }}>
              Henüz güvenilir moderatör yok
            </div>
          ) : (
            trustedMods.map((mod) => (
              <div key={mod.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--bg-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Shield size={14} color="var(--success)" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{mod.username}</span>
                </div>
                <button
                  onClick={() => removeMod(mod.id)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-3)', transition: 'var(--transition)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--error)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
