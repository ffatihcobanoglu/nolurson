/*
# Update default settings for 1000-viewer simulation

## Changes
- Update the existing default settings row to use percentage mode at 10%,
  matching a 1000-viewer channel where ~100 unique users message per 2 min window.
- threshold_min_users stays at 3 (minimum taban for low-participation moments).
- window_seconds stays at 120 (2 minute sliding window).
*/

UPDATE settings
SET
  threshold_mode = 'percentage',
  threshold_value = 10,
  threshold_min_users = 3,
  window_seconds = 120,
  sound_enabled = true,
  updated_at = now()
WHERE id = (SELECT id FROM settings LIMIT 1);
