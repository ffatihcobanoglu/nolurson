import { supabase } from './supabase'
import type { Category } from '../types'

interface TopicTemplate {
  label: string
  category: Category
  variations: string[]
  weight: number
}

const TOPICS: TopicTemplate[] = [
  {
    label: 'Ses kısık',
    category: 'complaint',
    weight: 3,
    variations: [
      'ses cok kisik', 'sesi duyamıyorum', 'ses düşük', 'ses az geliyor',
      'volume too low', 'ses kısık galiba', 'sesi açarmısın', 'duyulmuyor ses',
      'ses cok dusuk', 'audio low', 'ses gelmiyo', 'sesi yükselt',
      'sesi duyamıyorum abi', 'ses çok az', 'volume is low', 'ses yetersiz',
      'duyulmuyor', 'ses kısık sanırım', 'sesi acarmisin', 'audio quiet',
    ],
  },
  {
    label: 'Gecikme/Lag',
    category: 'complaint',
    weight: 2.5,
    variations: [
      'lag var', 'gecikme var', 'stream lagging', 'takılıyo', 'donuyo',
      'buffering', 'takılma var', 'gecikiyo yayın', 'lag issue', 'donma var',
      'yayın takılıyor', 'stream freeze', 'gecikme yasıyorum', 'lagging hard',
    ],
  },
  {
    label: 'Kalite düşük',
    category: 'complaint',
    weight: 2,
    variations: [
      'kalite düşük', 'quality bad', 'piksel piksel', 'blurry', 'kalite kötü',
      'resolution low', '720 pls', 'kalite yetersiz', 'pixelated',
      'görüntü bozuk', 'quality is bad', '1080 pls', 'kalite cok kotu',
    ],
  },
  {
    label: 'Oyun değiştir',
    category: 'request',
    weight: 2,
    variations: [
      'baska oyun oyna', 'oyun degistir', 'change game pls', ' başka oyun',
      'sıkıldık bu oyundan', 'yeni oyun ac', 'game change', 'oyun degis',
      'baska birsey oyna', 'change the game', 'sıkıldım', 'oyun sıkıcı',
    ],
  },
  {
    label: 'Şarkı isteği',
    category: 'request',
    weight: 1.5,
    variations: [
      'sarkı calarmısın', 'song request', 'muzik istek', 'şarkı söylesene',
      'play a song', 'müzik aç', 'sarki soyler misin', 'song pls',
      'müzik çalar mısın', 'play some music', 'sarki istek',
    ],
  },
  {
    label: 'Ne oynuyorsun?',
    category: 'question',
    weight: 1.5,
    variations: [
      'ne oynuyon', 'what game is this', 'hangi oyun', 'what are you playing',
      'oyun adı ne', 'bu ne oyunu', 'game name?', 'ne oynıyon',
      'what is this game', 'oyunun adı ne', 'which game',
    ],
  },
  {
    label: 'Selam',
    category: 'chat',
    weight: 1,
    variations: [
      'selam', 'hello', 'merhaba', 'hey', 'selamun aleyküm', 'hi',
      'naber', 'nasılsın', 'iyi yayınlar', 'selamlar', 'hey how are you',
    ],
  },
  {
    label: 'GG',
    category: 'chat',
    weight: 0.8,
    variations: [
      'gg', 'gg wp', 'iyi oyun', 'good game', 'gg ez', 'gg well played',
    ],
  },
  {
    label: 'Kekw',
    category: 'chat',
    weight: 0.5,
    variations: [
      'KEKW', 'LULW', 'OMEGALUL', 'pepega', 'catjam', 'peepo', 'POG',
    ],
  },
]

// Generate 1000 unique usernames
function generateUsernames(): string[] {
  const prefixes = [
    'ahmet', 'mehmet', 'zeynep', 'burak', 'ayse', 'can', 'elif', 'emre',
    'fatma', 'murat', 'selin', 'yusuf', 'deniz', 'berra', 'kaan', 'dilara',
    'onur', 'sude', 'baris', 'nisanur', 'cemil', 'gamze', 'kerem', 'lale',
    'umut', 'sema', 'ferhat', 'derya', 'tolga', 'merve', 'ali', 'huriye',
    'serkan', 'pelin', 'ozge', 'batuhan', 'arda', 'busra', 'necmiye', 'serdar',
    'tugce', 'mert', 'ebru', 'cuneyt', 'sevda', 'halil', 'yasemin', 'berkay',
    'caner', 'gizem', 'recep', 'sinem', 'okan', 'yavuz', 'duygu', 'taha',
    'sevki', 'nurcan', 'ercan', 'sezen', 'hakan', 'yelda', 'ozan', 'cengiz',
    'banu', 'idil', 'sebnem', 'tunay', 'aleyna', 'berk', 'cagla', 'demet',
    'engin', 'filiz', 'gokhan', 'hande', 'ilker', 'jale', 'kadir', 'lutfi',
    'makbule', 'nihat', 'onder', 'perihan', 'riza', 'sermin', 'tufan', 'ufuk',
    'vedat', 'yildirim', 'zuhal', 'aslı', 'bora', 'ceyda', 'doruk', 'esra',
  ]
  const suffixes = [
    '06', '34', '35', '16', '42', '99', '23', '98', '06_', 'x', 'y', 'a',
    'k', 'pro', 'tr', 'istanbul', 'ankara', 'izmir', 'bursa', 'antalya',
    '_y', '_x', '_a', '_k', '_tr', '_pro', '_06', '_42', 'bey', 'hanim',
    '_can', 'star', 'gaming', 'tv', 'live', 'play', 'gg', 'tr06', '1998',
    '2000', '2005', '_06_', 'xx', 'offical', 'real', 'the', 'its', 'just',
  ]

  const names = new Set<string>()
  let idx = 0
  while (names.size < 1000) {
    const p = prefixes[idx % prefixes.length]
    const s = suffixes[Math.floor(Math.random() * suffixes.length)]
    const num = Math.floor(Math.random() * 999)
    names.add(`${p}_${s}${num}`)
    idx++
  }
  return [...names]
}

const USERNAMES = generateUsernames()

const SPAM_MESSAGES = [
  'KEKW KEKW KEKW', 'spam spam spam', 'AAAAAAAAAAAA',
  '111111111', '++++++++++', '!!!!!!!!!!',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedPick(): TopicTemplate {
  const total = TOPICS.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  for (const t of TOPICS) {
    r -= t.weight
    if (r <= 0) return t
  }
  return TOPICS[0]
}

// Track which users have messaged recently to simulate 100 unique users per 2 min
const recentUsers = new Map<string, number>() // username -> last message timestamp
const activeUserPool: string[] = []
const MAX_ACTIVE_USERS = 100 // target: ~100 unique users per 2 min window

function pickUsername(): string {
  // 70% chance: pick from active pool (returning users)
  // 30% chance: pick a new user from the full list
  if (activeUserPool.length > 0 && Math.random() < 0.7) {
    return pick(activeUserPool)
  }
  // Add a new user to the pool
  const newUser = pick(USERNAMES)
  if (!activeUserPool.includes(newUser)) {
    activeUserPool.push(newUser)
    // Keep pool at a reasonable size
    if (activeUserPool.length > MAX_ACTIVE_USERS) {
      activeUserPool.shift()
    }
  }
  return newUser
}

export function generateMessage() {
  const isSpam = Math.random() < 0.05
  if (isSpam) {
    return {
      username: pickUsername(),
      text: pick(SPAM_MESSAGES),
      isFiltered: true,
      topicLabel: null as string | null,
      category: null as Category | null,
    }
  }

  const isEmoteOnly = Math.random() < 0.1
  if (isEmoteOnly) {
    return {
      username: pickUsername(),
      text: pick(['KEKW', 'LULW', 'POGGERS', 'pepega', 'catjam', 'PepeLaugh']),
      isFiltered: true,
      topicLabel: null as string | null,
      category: null as Category | null,
    }
  }

  const topic = weightedPick()
  return {
    username: pickUsername(),
    text: pick(topic.variations),
    isFiltered: false,
    topicLabel: topic.label,
    category: topic.category,
  }
}

export function generateBatch(count: number) {
  const messages = []
  for (let i = 0; i < count; i++) {
    messages.push(generateMessage())
  }
  return messages
}

let simulatorInterval: ReturnType<typeof setInterval> | null = null
let burstMode = false
let elapsedSeconds = 0

export function startChatSimulator(streamId: string, onMessage?: (msg: ReturnType<typeof generateMessage>) => void) {
  stopChatSimulator()
  elapsedSeconds = 0

  // Target: ~100 unique users per 2 minutes (120 seconds)
  // That's ~50 unique users per minute, ~0.83 per second
  // With 70% returning users, total messages ~1.2 per second
  // Interval: 1 second, ~1-2 messages per tick
  simulatorInterval = setInterval(async () => {
    elapsedSeconds++

    // Gradual ramp-up: first 10 seconds slower, then normal
    let count: number
    if (elapsedSeconds < 10) {
      count = 1
    } else if (burstMode) {
      count = 4 + Math.floor(Math.random() * 4)
    } else {
      // Average ~1.2 messages per second to hit ~100 unique users in 2 min
      count = Math.random() < 0.8 ? 1 : 2
    }

    const messages = generateBatch(count)

    // Batch insert for performance
    const rows = messages.map(msg => ({
      stream_id: streamId,
      username: msg.username,
      text: msg.text,
      platform: 'twitch',
      is_filtered: msg.isFiltered,
    }))

    const { error } = await supabase.from('chat_messages').insert(rows)
    if (error) console.error('Chat batch insert error:', error)

    for (const msg of messages) {
      onMessage?.(msg)
    }
  }, 1000)

  // Trigger a burst at 30 seconds (simulates a moment of high activity)
  setTimeout(() => {
    burstMode = true
    setTimeout(() => { burstMode = false }, 10000)
  }, 30000)

  // Second burst at 90 seconds
  setTimeout(() => {
    burstMode = true
    setTimeout(() => { burstMode = false }, 8000)
  }, 90000)
}

export function stopChatSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval)
    simulatorInterval = null
  }
}

export function triggerBurst() {
  burstMode = true
  setTimeout(() => { burstMode = false }, 10000)
}

export function getSimulatorStats() {
  return {
    totalUsernames: USERNAMES.length,
    activeUsers: activeUserPool.length,
    elapsedSeconds,
    burstMode,
  }
}
