/*
# Yayıncı Chat Analiz Aracı — Veritabanı Şeması

## Açıklama
Yayıncıların chat'te kaç farklı kullanıcının aynı konuyu konuştuğunu takip edip
eşik geçildiğinde bildirim gösteren uygulamanın veritabanı şeması.

## Yeni Tablolar
1. `streams` — Yayın oturumları (başlık, platform, durum, başlangıç/bitiş)
2. `chat_messages` — Chat mesajları (kullanıcı adı, metin, filtre durumu)
3. `clusters` — Anlamsal kümeleme sonuçları (konu etiketi, kategori, benzersiz kullanıcı sayısı, güven skoru)
4. `notifications` — Eşik geçildiğinde oluşan bildirimler
5. `notification_seens` — Bildirimi kimin "gördüm" işaretlediği (isim, avatar, güvenilir mod mi)
6. `settings` — Yayıncı ayarları (eşik modu, değeri, zaman penceresi, ses)
7. `trusted_moderators` — Güvenilir moderatör listesi
8. `topic_history` — Konu geçmişi (hangi yayında kaç kez eşiği geçti)

## Güvenlik
- Tüm tablolarda RLS açık.
- Uygulamada giriş ekranı yok (single-tenant demo) → `TO anon, authenticated` ile tüm CRUD açık.
- Veri paylaşılıyor/kasıtlı olarak public.
*/

-- 1. Streams
CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Yayın',
  platform text NOT NULL DEFAULT 'twitch',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_streams" ON streams;
CREATE POLICY "anon_crud_streams" ON streams FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  username text NOT NULL,
  text text NOT NULL,
  platform text NOT NULL DEFAULT 'twitch',
  is_filtered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_chat_messages" ON chat_messages;
CREATE POLICY "anon_crud_chat_messages" ON chat_messages FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_chat_messages_stream_id ON chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 3. Clusters
CREATE TABLE IF NOT EXISTS clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  topic_label text NOT NULL,
  category text NOT NULL DEFAULT 'chat',
  unique_user_count integer NOT NULL DEFAULT 0,
  confidence_score real NOT NULL DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_clusters" ON clusters;
CREATE POLICY "anon_crud_clusters" ON clusters FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clusters_stream_id ON clusters(stream_id);
CREATE INDEX IF NOT EXISTS idx_clusters_is_active ON clusters(is_active);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  topic_label text NOT NULL,
  category text NOT NULL DEFAULT 'chat',
  unique_user_count integer NOT NULL DEFAULT 0,
  confidence_score real NOT NULL DEFAULT 1.0,
  is_dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_notifications" ON notifications;
CREATE POLICY "anon_crud_notifications" ON notifications FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_stream_id ON notifications(stream_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_dismissed ON notifications(is_dismissed);

-- 5. Notification Seens (gördüm işaretleri)
CREATE TABLE IF NOT EXISTS notification_seens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  viewer_name text NOT NULL,
  viewer_avatar text,
  is_trusted boolean NOT NULL DEFAULT false,
  seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_seens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_notification_seens" ON notification_seens;
CREATE POLICY "anon_crud_notification_seens" ON notification_seens FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notification_seens_notification_id ON notification_seens(notification_id);

-- 6. Settings (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_mode text NOT NULL DEFAULT 'fixed',
  threshold_value real NOT NULL DEFAULT 10,
  threshold_min_users integer NOT NULL DEFAULT 3,
  window_seconds integer NOT NULL DEFAULT 120,
  sound_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_settings" ON settings;
CREATE POLICY "anon_crud_settings" ON settings FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Trusted Moderators
CREATE TABLE IF NOT EXISTS trusted_moderators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  avatar_url text,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trusted_moderators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_trusted_moderators" ON trusted_moderators;
CREATE POLICY "anon_crud_trusted_moderators" ON trusted_moderators FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. Topic History
CREATE TABLE IF NOT EXISTS topic_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_label text NOT NULL,
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  hit_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE topic_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_topic_history" ON topic_history;
CREATE POLICY "anon_crud_topic_history" ON topic_history FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_topic_history_topic_label ON topic_history(topic_label);

-- Insert default settings if not exists
INSERT INTO settings (threshold_mode, threshold_value, threshold_min_users, window_seconds, sound_enabled)
SELECT 'fixed', 10, 3, 120, true
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);