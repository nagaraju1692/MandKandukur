import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchJson } from './api'

export type CricketCommentaryItem = {
  over: string
  comm: string
  runs?: string
  isWicket?: boolean
  isFour?: boolean
  isSix?: boolean
}

export type CricketInning = {
  team: string
  score: string // e.g. "185/4"
  overs: string // e.g. "20.0"
  runRate?: string
  target?: string
}

export type CricketMatch = {
  id: string
  state: 'live' | 'upcoming' | 'completed'
  dayLabel?: 'yesterday' | 'today' | 'upcoming'
  title: string // e.g. "India vs Australia - 3rd T20I"
  series: string // e.g. "IPL 2025" or "ICC Champions Trophy"
  matchType: 'T20' | 'ODI' | 'TEST' | 'IPL'
  status: string // e.g. "IND won by 6 wickets" or "IND need 24 runs in 18 balls"
  venue: string
  isLive: boolean
  matchNumber?: string
  group?: string
  dateTime?: string
  playerOfMatch?: string
  startTime?: string
  cricbuzzUrl?: string
  team1: {
    name: string
    shortName: string
    color?: string
    flag?: string
    score?: string
    overs?: string
  }
  team2: {
    name: string
    shortName: string
    color?: string
    flag?: string
    score?: string
    overs?: string
  }
  summary?: string
  crr?: string
  rrr?: string
  partnership?: string
  recentBalls?: string[]
  currentBatter?: string
  currentNonStriker?: string
  currentBowler?: string
  innings?: CricketInning[]
  commentary?: CricketCommentaryItem[]
  scorecard?: unknown
  live?: unknown
}

function parseMatchDate(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = value < 10_000_000_000 ? value * 1000 : value
    const parsed = new Date(milliseconds)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  if (typeof value !== 'string' || !value.trim()) return undefined
  const trimmed = value.trim()
  const dateOnly = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/.exec(trimmed)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  const numericValue = Number(trimmed)
  if (Number.isFinite(numericValue)) return parseMatchDate(numericValue)

  const cleaned = trimmed.replace(/Sept\b/gi, 'Sep').replace(/\bIST\b/gi, '').trim()
  const parsed = new Date(cleaned)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function formatCricketDateTime(value: unknown) {
  const parsed = parseMatchDate(value)
  if (!parsed) return undefined
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).replace(/$/, ' IST')
}

export function formatCompactCricketDateTime(value: unknown) {
  const parsed = parseMatchDate(value)
  if (!parsed || Number.isNaN(parsed.getTime())) {
    if (typeof value === 'string' && value.trim()) {
      return value
        .replace(/\s*20\d\d,?\s*/, ', ')
        .replace(/\s*IST\b/i, '')
        .replace(/Sept\b/gi, 'Sep')
        .trim()
    }
    return undefined
  }
  const dateStr = parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).replace(/Sept\b/gi, 'Sep')
  const timeStr = parsed.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).toLowerCase()
  return `${dateStr}, ${timeStr}`
}

export function formatTeamScore(score?: string): string {
  if (!score || typeof score !== 'string') return '—'
  const trimmed = score.trim()
  if (!trimmed || /^(ns|na|n\/a|not started|scheduled|—|-)$/i.test(trimmed)) {
    return '—'
  }
  return score
}

function getMatchTimestamp(match: any) {
  const values = [match.scheduled_start, match.dateTimeGMT, match.dateTime, match.startTime, match.start_time, match.date, match.timestamp]
  for (const value of values) {
    const parsed = parseMatchDate(value)
    if (parsed) return parsed.getTime()
  }
  return undefined
}

function classifyMatch(match: any, timestamp?: number) {
  const status = String(match.status || '').trim().toLowerCase()
  const completedByStatus = /\b(completed|finished|won|won by|tied|draw|no result|abandoned|cancelled|canceled|match ended|innings defeat)\b/.test(status)
  const upcomingByStatus = /\b(not started|upcoming|starts? at|scheduled)\b/.test(status)
  const liveByStatus = /\b(live|in progress|innings break|stumps|day \d)\b/.test(status)
  const isCompleted = Boolean(match.matchEnded) || completedByStatus
  const isLive = !isCompleted && !upcomingByStatus && (Boolean(match.matchStarted) || liveByStatus)
  const isUpcoming = !isCompleted && !isLive
  const now = new Date()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime()
  const isStale = timestamp !== undefined && timestamp < yesterdayStart
  const matchDay = timestamp === undefined
    ? undefined
    : timestamp < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      ? 'yesterday' as const
      : timestamp < new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
        ? 'today' as const
        : 'upcoming' as const

  return {
    isLive,
    isUpcoming,
    isCompleted,
    // The current-matches endpoint can retain yesterday's completed records.
    dayLabel: isUpcoming ? 'upcoming' as const : matchDay,
    // Keep yesterday, today, and future provider records; discard older stale records.
    keep: isLive || !isStale,
  }
}

interface CricketCacheData {
  timestamp: number
  data: CricketMatch[]
}

const CRICKET_CACHE_KEY = '@mana_kandukur_cricket_matches_cache'
let inMemoryCricketCache: CricketCacheData | null = null

function isCacheValid(timestamp: number): boolean {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return false
  const now = Date.now()
  const age = now - timestamp
  if (age < 0) return false

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  if (age < TWENTY_FOUR_HOURS) return true

  const cachedDate = new Date(timestamp)
  const nowDate = new Date(now)
  return (
    cachedDate.getFullYear() === nowDate.getFullYear() &&
    cachedDate.getMonth() === nowDate.getMonth() &&
    cachedDate.getDate() === nowDate.getDate()
  )
}

const getTeamPairKey = (m: CricketMatch) =>
  [m.team1?.name || '', m.team2?.name || ''].map(s => s.toLowerCase().trim()).sort().join(' vs ')

export function filterUpcomingMatchesByTeamPair(matches: CricketMatch[]): CricketMatch[] {
  const seenUpcomingTeamPairs = new Set<string>()
  return matches.filter(m => {
    const isUpcoming = !m.isLive && m.state === 'upcoming'
    if (isUpcoming) {
      const key = getTeamPairKey(m)
      if (key && seenUpcomingTeamPairs.has(key)) {
        return false
      }
      if (key) {
        seenUpcomingTeamPairs.add(key)
      }
    }
    return true
  })
}

export async function fetchLiveCricketMatches(forceRefresh = false): Promise<CricketMatch[]> {
  if (forceRefresh) {
    inMemoryCricketCache = null
  } else {
    if (inMemoryCricketCache && isCacheValid(inMemoryCricketCache.timestamp)) {
      return filterUpcomingMatchesByTeamPair(inMemoryCricketCache.data)
    }
    try {
      const stored = await AsyncStorage.getItem(CRICKET_CACHE_KEY)
      if (stored) {
        const parsed: CricketCacheData = JSON.parse(stored)
        if (parsed && typeof parsed.timestamp === 'number' && Array.isArray(parsed.data)) {
          inMemoryCricketCache = parsed
          if (isCacheValid(parsed.timestamp)) {
            return filterUpcomingMatchesByTeamPair(parsed.data)
          }
        }
      }
    } catch (e) {
      console.log('Failed to read cricket cache from AsyncStorage:', e)
    }
  }

  try {
    const json = await fetchJson<{ data?: CricketMatch[]; meta?: { commentaryAvailable?: boolean } }>('/api/cricket/matches')
    if (!Array.isArray(json?.data)) throw new Error('Cricket API returned an invalid response')
    const rawMatches: CricketMatch[] = json.data.map((m: CricketMatch) => {
      const matchTimestamp = getMatchTimestamp(m)
      const formattedDateTime = formatCricketDateTime(matchTimestamp || m.dateTime || m.startTime)
      return {
        ...m,
        dateTime: formattedDateTime || m.dateTime,
        startTime: formattedDateTime || m.startTime || m.dateTime,
      }
    })

    const matches = filterUpcomingMatchesByTeamPair(rawMatches).slice(0, 8)

    const cacheObj: CricketCacheData = {
      timestamp: Date.now(),
      data: matches,
    }
    inMemoryCricketCache = cacheObj

    try {
      await AsyncStorage.setItem(CRICKET_CACHE_KEY, JSON.stringify(cacheObj))
    } catch (e) {
      console.log('Failed to save cricket cache to AsyncStorage:', e)
    }

    return matches
  } catch (error) {
    if (inMemoryCricketCache && Array.isArray(inMemoryCricketCache.data)) {
      return filterUpcomingMatchesByTeamPair(inMemoryCricketCache.data)
    }
    try {
      const stored = await AsyncStorage.getItem(CRICKET_CACHE_KEY)
      if (stored) {
        const parsed: CricketCacheData = JSON.parse(stored)
        if (parsed && Array.isArray(parsed.data)) {
          inMemoryCricketCache = parsed
          return filterUpcomingMatchesByTeamPair(parsed.data)
        }
      }
    } catch {
      // ignore storage error, proceed to throw network error
    }
    throw error
  }
}

export async function fetchCricketMatchDetails(matchId: string): Promise<CricketMatch> {
  const payload = await fetchJson<{ data?: CricketMatch & { scorecard?: unknown; live?: unknown } }>(`/api/cricket/matches/${encodeURIComponent(matchId)}`)
  if (!payload?.data) throw new Error('Cricket match details are unavailable')
  return payload.data
}

export async function fetchLiveCricketDetails(matchId: string) {
  const payload = await fetchJson<{ data?: unknown }>(`/api/cricket/live/${encodeURIComponent(matchId)}`)
  if (!payload?.data) throw new Error('Live cricket details are unavailable')
  return payload.data
}

export async function fetchCricketScorecard(matchId: string) {
  const payload = await fetchJson<{ data?: unknown }>(`/api/cricket/scorecards/${encodeURIComponent(matchId)}`)
  if (!payload?.data) throw new Error('Cricket scorecard is unavailable')
  return payload.data
}
