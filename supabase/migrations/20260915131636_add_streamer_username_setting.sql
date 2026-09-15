/*
# Add streamer_username to settings

1. Modified Tables
- `settings` — add `streamer_username` text column (default 'Yayıncı')
  This stores the stream owner's username. The streamer can dismiss
  notifications just like trusted moderators.

2. Security
- No new tables. RLS already enabled on settings.
- Existing anon_crud_settings policy covers the new column automatically.
*/

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS streamer_username text NOT NULL DEFAULT 'Yayıncı';
