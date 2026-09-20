export type Role = 'creator' | 'streamer' | 'moderator'

export type ThresholdMode = 'fixed' | 'percentage'

export type Category = 'complaint' | 'request' | 'question' | 'chat'

export type StreamStatus = 'active' | 'ended'

export interface Stream {
  id: string
  title: string
  platform: string
  status: StreamStatus
  started_at: string
  ended_at: string | null
}

export interface ChatMessage {
  id: string
  stream_id: string
  username: string
  text: string
  platform: string
  is_filtered: boolean
  created_at: string
}

export interface Cluster {
  id: string
  stream_id: string
  topic_label: string
  category: Category
  unique_user_count: number
  confidence_score: number
  is_active: boolean
  first_seen_at: string
  last_seen_at: string
  created_at: string
}

export interface Notification {
  id: string
  cluster_id: string
  stream_id: string
  topic_label: string
  category: Category
  unique_user_count: number
  confidence_score: number
  is_dismissed: boolean
  created_at: string
}

export interface NotificationSeen {
  id: string
  notification_id: string
  viewer_name: string
  viewer_avatar: string | null
  is_trusted: boolean
  viewer_role: Role
  seen_at: string
}

export interface Settings {
  id: string
  threshold_mode: ThresholdMode
  threshold_value: number
  threshold_min_users: number
  window_seconds: number
  sound_enabled: boolean
  streamer_username: string
  updated_at: string
}

export interface TrustedModerator {
  id: string
  username: string
  avatar_url: string | null
  added_at: string
}

export interface TopicHistoryItem {
  id: string
  topic_label: string
  stream_id: string
  hit_count: number
  first_seen_at: string
  last_seen_at: string
}

export const CATEGORY_LABELS: Record<Category, string> = {
  complaint: 'Şikayet',
  request: 'İstek',
  question: 'Soru',
  chat: 'Sohbet',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  complaint: '#ef4444',
  request: '#3b82f6',
  question: '#f59e0b',
  chat: '#10b981',
}

export const CATEGORY_ICONS: Record<Category, string> = {
  complaint: 'AlertTriangle',
  request: 'MessageSquarePlus',
  question: 'HelpCircle',
  chat: 'MessageCircle',
}

export const ROLE_COLORS: Record<Role, string> = {
  creator: '#f59e0b',
  streamer: '#6366f1',
  moderator: '#10b981',
}

export const ROLE_LABELS: Record<Role, string> = {
  creator: 'Yaratıcı',
  streamer: 'Yayıncı',
  moderator: 'Moderatör',
}
