ALTER TABLE notification_seens ADD COLUMN IF NOT EXISTS viewer_role text NOT NULL DEFAULT 'moderator';
