import { supabase } from './supabase'
import type { Category, Settings } from '../types'

interface RawMessage {
  id: string
  username: string
  text: string
  is_filtered: boolean
  created_at: string
}

interface TopicMatch {
  label: string
  category: Category
  keywords: string[]
}

const TOPIC_RULES: TopicMatch[] = [
  { label: 'Ses kısık', category: 'complaint', keywords: ['ses', 'volume', 'audio', 'duyulmuyor', 'duyamıyorum', 'kısık', 'düşük', 'dusuk', 'kisik', 'açarmısın', 'acarmisin', 'yükselt', 'yukselt', 'gelmiyo', 'az geliyor', 'low'] },
  { label: 'Gecikme/Lag', category: 'complaint', keywords: ['lag', 'gecikme', 'gecikiyo', 'geçikme', 'geçikiyo', 'takılıyo', 'takiliyo', 'donuyo', 'donma', 'buffering', 'takılma', 'stream lag'] },
  { label: 'Kalite düşük', category: 'complaint', keywords: ['kalite', 'quality', 'piksel', 'pixel', 'blurry', 'resolution', '720', 'kötü', 'kötü'] },
  { label: 'Oyun değiştir', category: 'request', keywords: ['oyun', 'game', 'değiştir', 'degistir', 'change', 'sıkıldık', 'yeni oyun', 'baska'] },
  { label: 'Şarkı isteği', category: 'request', keywords: ['sarkı', 'sarki', 'şarkı', 'song', 'muzik', 'müzik', 'söylesene', 'soylesene', 'soyler', 'söyler', 'play'] },
  { label: 'Ne oynuyorsun?', category: 'question', keywords: ['ne oynuyo', 'ne oynuyon', 'what game', 'hangi oyun', 'what are you', 'oyun adı', 'oyun adi', 'bu ne', 'game name', 'ne oynıyon'] },
  { label: 'Selam', category: 'chat', keywords: ['selam', 'hello', 'merhaba', 'hey', 'selamun', 'hi', 'naber', 'nasılsın', 'nasil', 'iyi yayınlar', 'iyi yayinlar'] },
  { label: 'GG', category: 'chat', keywords: ['gg', 'wp', 'iyi oyun', 'good game', 'well played', 'gg ez'] },
  { label: 'Kekw', category: 'chat', keywords: ['kekw', 'lulw', 'omegalul', 'pepega', 'catjam', 'peepo', 'pog'] },
]

function matchTopic(text: string): TopicMatch | null {
  const lower = text.toLowerCase()
  let bestMatch: TopicMatch | null = null
  let bestScore = 0

  for (const rule of TOPIC_RULES) {
    let score = 0
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = rule
    }
  }

  return bestMatch
}

function calculateConfidenceScore(usernames: string[]): number {
  const uniqueUsers = new Set(usernames)
  if (uniqueUsers.size === 0) return 0
  if (uniqueUsers.size === 1) return 0.3
  if (uniqueUsers.size <= 3) return 0.6
  if (uniqueUsers.size <= 8) return 0.8
  return 0.95
}

export async function runClusteringCycle(streamId: string, settings: Settings): Promise<void> {
  const windowSeconds = settings.window_seconds
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString()

  const { data: recentMessages, error } = await supabase
    .from('chat_messages')
    .select('id, username, text, is_filtered, created_at')
    .eq('stream_id', streamId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) {
    console.error('Clustering fetch error:', error)
    return
  }

  if (!recentMessages || recentMessages.length === 0) return

  const unfiltered = recentMessages.filter((m: RawMessage) => !m.is_filtered)
  if (unfiltered.length === 0) return

  const topicGroups = new Map<string, { usernames: Set<string>; messages: RawMessage[]; category: Category }>()

  for (const msg of unfiltered) {
    const topic = matchTopic(msg.text)
    if (!topic) continue

    const existing = topicGroups.get(topic.label)
    if (existing) {
      existing.usernames.add(msg.username)
      existing.messages.push(msg)
    } else {
      topicGroups.set(topic.label, {
        usernames: new Set([msg.username]),
        messages: [msg],
        category: topic.category,
      })
    }
  }

  const totalUniqueUsers = new Set(unfiltered.map((m: RawMessage) => m.username)).size
  const minUsers = settings.threshold_min_users

  // Fetch ALL active clusters for this stream at once (avoid N+1 queries)
  const { data: activeClusters } = await supabase
    .from('clusters')
    .select('id, topic_label')
    .eq('stream_id', streamId)
    .eq('is_active', true)

  // Build a map: topic_label -> cluster_id (only keep the first one per topic)
  const clusterByTopic = new Map<string, string>()
  if (activeClusters) {
    for (const c of activeClusters as { id: string; topic_label: string }[]) {
      if (!clusterByTopic.has(c.topic_label)) {
        clusterByTopic.set(c.topic_label, c.id)
      }
    }
  }

  // Fetch ALL undismissed notifications for this stream at once
  const { data: activeNotifs } = await supabase
    .from('notifications')
    .select('id, cluster_id, topic_label')
    .eq('stream_id', streamId)
    .eq('is_dismissed', false)

  // Build a map: topic_label -> notification_id (only keep the first one per topic)
  const notifByTopic = new Map<string, string>()
  if (activeNotifs) {
    for (const n of activeNotifs as { id: string; cluster_id: string; topic_label: string }[]) {
      if (!notifByTopic.has(n.topic_label)) {
        notifByTopic.set(n.topic_label, n.id)
      }
    }
  }

  const activeTopicLabels = [...topicGroups.keys()]

  for (const [topicLabel, group] of topicGroups) {
    const uniqueCount = group.usernames.size
    if (uniqueCount < minUsers) continue

    const confidence = calculateConfidenceScore([...group.usernames])

    let clusterId: string
    const existingClusterId = clusterByTopic.get(topicLabel)

    if (existingClusterId) {
      clusterId = existingClusterId
      await supabase
        .from('clusters')
        .update({
          unique_user_count: uniqueCount,
          confidence_score: confidence,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', clusterId)
    } else {
      const { data: newCluster, error: insertError } = await supabase
        .from('clusters')
        .insert({
          stream_id: streamId,
          topic_label: topicLabel,
          category: group.category,
          unique_user_count: uniqueCount,
          confidence_score: confidence,
          is_active: true,
        })
        .select('id')
        .single()

      if (insertError || !newCluster) {
        console.error('Cluster insert error:', insertError)
        continue
      }
      clusterId = newCluster.id
      clusterByTopic.set(topicLabel, clusterId)
    }

    let thresholdMet = false
    if (settings.threshold_mode === 'fixed') {
      thresholdMet = uniqueCount >= settings.threshold_value
    } else {
      const percentageThreshold = Math.max(
        (totalUniqueUsers * settings.threshold_value) / 100,
        minUsers
      )
      thresholdMet = uniqueCount >= percentageThreshold
    }

    if (thresholdMet && confidence >= 0.3) {
      const existingNotifId = notifByTopic.get(topicLabel)

      if (!existingNotifId) {
        const { data: newNotif } = await supabase
          .from('notifications')
          .insert({
            cluster_id: clusterId,
            stream_id: streamId,
            topic_label: topicLabel,
            category: group.category,
            unique_user_count: uniqueCount,
            confidence_score: confidence,
            is_dismissed: false,
          })
          .select('id')
          .single()
        if (newNotif) {
          notifByTopic.set(topicLabel, newNotif.id)
        }
      } else {
        await supabase
          .from('notifications')
          .update({
            unique_user_count: uniqueCount,
            confidence_score: confidence,
          })
          .eq('id', existingNotifId)
      }
    }
  }

  // Deactivate clusters whose topics are no longer in the active window
  if (activeClusters) {
    for (const c of activeClusters as { id: string; topic_label: string }[]) {
      if (!activeTopicLabels.includes(c.topic_label)) {
        await supabase
          .from('clusters')
          .update({ is_active: false })
          .eq('id', c.id)
      }
    }
  }
}

export function startClusteringEngine(streamId: string, settings: Settings): ReturnType<typeof setInterval> {
  return setInterval(() => {
    runClusteringCycle(streamId, settings)
  }, 3000)
}
