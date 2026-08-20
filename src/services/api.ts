export type WeatherReport = {
  temp: string
  condition: string
  humidity: string
  wind: string
  updatedAt: string
  hourly: Array<{ time: string; temp: number; code: number }>
  daily: Array<{ date: string; max: number; min: number; code: number }>
}

export type GoldRate = {
  pricePerSavaram22K: number
  pricePerSavaram: number
  updatedAt: string
}

const weatherConditions: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Foggy', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail',
}

export async function fetchWeather(): Promise<WeatherReport> {
  const params = new URLSearchParams({
    latitude: '15.2154', longitude: '79.9072',
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    forecast_days: '7',
    temperature_unit: 'celsius', wind_speed_unit: 'kmh', timezone: 'Asia/Kolkata',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)
  const data = await response.json()
  const hourlyTimes: string[] = data.hourly?.time || []
  const firstUpcomingHour = hourlyTimes.findIndex((time) => new Date(time).getTime() >= new Date(data.current.time).getTime())
  const hourlyWindow = hourlyTimes.slice(Math.max(0, firstUpcomingHour), Math.max(0, firstUpcomingHour) + 24)
  return {
    temp: `${Math.round(data.current.temperature_2m)}°C`,
    condition: weatherConditions[data.current.weather_code] || 'Current conditions',
    humidity: `${Math.round(data.current.relative_humidity_2m)}% humidity`,
    wind: `${Math.round(data.current.wind_speed_10m)} km/h wind`,
    updatedAt: data.current.time,
    hourly: hourlyWindow.map((time) => {
      const sourceIndex = hourlyTimes.indexOf(time)
      return { time, temp: Math.round(data.hourly.temperature_2m[sourceIndex]), code: data.hourly.weather_code[sourceIndex] }
    }),
    daily: (data.daily?.time || []).map((date: string, index: number) => ({ date, max: Math.round(data.daily.temperature_2m_max[index]), min: Math.round(data.daily.temperature_2m_min[index]), code: data.daily.weather_code[index] })),
  }
}

export async function fetchGoldRate(): Promise<GoldRate> {
  const response = await fetch('https://api.gold-api.com/price/XAU/INR')
  if (!response.ok) throw new Error(`Gold rate request failed: ${response.status}`)
  const data = await response.json()
  const pricePerGram24K = Math.round(data.price / 31.1034768)
  const pricePerGram22K = Math.round(pricePerGram24K * 22 / 24)
  return {
    pricePerSavaram22K: pricePerGram22K * 8,
    pricePerSavaram: pricePerGram24K * 8,
    updatedAt: data.updatedAt,
  }
}

function fallbackCoordinatesByAddress(address: string): { latitude: number; longitude: number } | null {
  const normalized = address.toLowerCase()

  if (normalized.includes('trr government degree college') || normalized.includes('trr degree')) {
    return { latitude: 15.2084, longitude: 79.8982 }
  }

  if (normalized.includes('gayatri degree college') || normalized.includes('gayatri')) {
    return { latitude: 15.2278, longitude: 79.9186 }
  }

  return null
}

// Nominatim's free API allows at most 1 request/second. Serialize every caller through
// one global queue so concurrent screens can't collectively exceed that limit.
let geocodeQueue: Promise<unknown> = Promise.resolve()
const GEOCODE_MIN_INTERVAL_MS = 1100

export function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const fallback = fallbackCoordinatesByAddress(address)
  if (!address || !address.trim()) return Promise.resolve(null)

  const run = geocodeQueue.then(async () => {
    try {
      const params = new URLSearchParams({ format: 'jsonv2', limit: '1', q: `${address}, Andhra Pradesh, India` })
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'ManaKandukurApp/1.0' },
      })
      if (!response.ok) return fallback
      const results = await response.json()
      if (!Array.isArray(results) || !results[0]) return fallback
      return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) }
    } catch {
      return fallback
    } finally {
      await new Promise((resolve) => setTimeout(resolve, GEOCODE_MIN_INTERVAL_MS))
    }
  })

  geocodeQueue = run.catch(() => undefined)
  return run
}

export function reverseGeocodeCoordinates(latitude: number, longitude: number): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return Promise.resolve(null)
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return Promise.resolve(null)

  const run = geocodeQueue.then(async () => {
    try {
      const params = new URLSearchParams({ format: 'jsonv2', lat: String(latitude), lon: String(longitude) })
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'ManaKandukurApp/1.0' },
      })
      if (!response.ok) return null
      const result = await response.json()
      return result?.address?.road || result?.address?.village || result?.address?.town || result?.address?.city || result?.display_name || null
    } catch {
      return null
    } finally {
      await new Promise((resolve) => setTimeout(resolve, GEOCODE_MIN_INTERVAL_MS))
    }
  })

  geocodeQueue = run.catch(() => undefined)
  return run
}

export function buildGoogleMapsDirectionsUrl(
  destination: { latitude: number | null | undefined; longitude: number | null | undefined; address?: string | null },
  origin?: { latitude: number; longitude: number } | null,
  travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving',
) {
  const destinationLatitude = Number(destination.latitude)
  const destinationLongitude = Number(destination.longitude)
  const hasCoordinates = destination.latitude != null
    && destination.longitude != null
    && Number.isFinite(destinationLatitude)
    && Number.isFinite(destinationLongitude)
    && Math.abs(destinationLatitude) <= 90
    && Math.abs(destinationLongitude) <= 180
    && !(destinationLatitude === 0 && destinationLongitude === 0)

  const originQuery = origin ? `${origin.latitude},${origin.longitude}` : ''
  const destinationQuery = hasCoordinates
    ? `${destinationLatitude},${destinationLongitude}`
    : `${destination.address || 'Kandukur'}, Andhra Pradesh, India`
  const params = new URLSearchParams({ api: '1', destination: destinationQuery, travelmode: travelMode })
  if (originQuery) params.set('origin', originQuery)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL

if (!apiBaseUrl) {
  console.warn('EXPO_PUBLIC_API_URL is not configured. Directory data cannot be loaded.')
}

export async function fetchJson<T>(path: string, options?: RequestInit, userPhone?: string | null): Promise<T> {
  if (!apiBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured')
  const headers = new Headers(options?.headers)
  if (userPhone) headers.set('x-user-phone', userPhone)
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const payload = await response.json() as { error?: string; message?: string }
      const details = payload?.error || payload?.message
      if (details) message = `${message} - ${details}`
    } catch {
      // Ignore JSON parsing errors for non-JSON error responses.
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export async function uploadAdminAnnouncementImage(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null },
  userPhone: string,
) {
  if (!apiBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured')
  const form = new FormData()
  const fallbackName = `announcement-${Date.now()}.jpg`
  const fallbackType = 'image/jpeg'

  if (typeof window !== 'undefined') {
    const fileResponse = await fetch(asset.uri)
    if (!fileResponse.ok) throw new Error('Unable to read selected image file')
    const blob = await fileResponse.blob()
    const fileName = asset.fileName || fallbackName
    const mimeType = asset.mimeType || blob.type || fallbackType
    form.append('image', blob, fileName)
    if (!mimeType && !(blob as any).type) {
      ;(form as any).append('imageType', fallbackType)
    }
  } else {
    form.append('image', {
      uri: asset.uri,
      name: asset.fileName || fallbackName,
      type: asset.mimeType || fallbackType,
    } as any)
  }

  const headers = new Headers()
  headers.set('x-user-phone', userPhone)

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/admin/uploads/announcement-image`, {
    method: 'POST',
    headers,
    body: form,
  })
  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const payload = await response.json() as { error?: string; message?: string }
      const details = payload?.error || payload?.message
      if (details) message = `${message} - ${details}`
    } catch {
      // Ignore JSON parsing errors for non-JSON error responses.
    }
    throw new Error(message)
  }
  return response.json() as Promise<{ data: { image: string; path: string } }>
}

export async function uploadAdminBusinessImage(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null },
  userPhone: string,
) {
  if (!apiBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured')
  const form = new FormData()
  const fallbackName = `business-${Date.now()}.jpg`
  const fallbackType = 'image/jpeg'

  if (typeof window !== 'undefined') {
    const fileResponse = await fetch(asset.uri)
    if (!fileResponse.ok) throw new Error('Unable to read selected image file')
    const blob = await fileResponse.blob()
    form.append('image', blob, asset.fileName || fallbackName)
  } else {
    form.append('image', {
      uri: asset.uri,
      name: asset.fileName || fallbackName,
      type: asset.mimeType || fallbackType,
    } as any)
  }

  const headers = new Headers()
  headers.set('x-user-phone', userPhone)
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/admin/uploads/business-image`, {
    method: 'POST',
    headers,
    body: form,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string; message?: string }
    throw new Error(payload.error || payload.message || `Image upload failed: ${response.status}`)
  }
  return response.json() as Promise<{ data: { image: string; path: string } }>
}

export async function uploadMarketplaceImage(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null },
  userPhone: string,
) {
  if (!apiBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured')
  const form = new FormData()
  const fallbackName = `marketplace-${Date.now()}.jpg`
  const fallbackType = 'image/jpeg'

  if (typeof window !== 'undefined') {
    const fileResponse = await fetch(asset.uri)
    if (!fileResponse.ok) throw new Error('Unable to read selected image file')
    const blob = await fileResponse.blob()
    form.append('image', blob, asset.fileName || fallbackName)
  } else {
    form.append('image', { uri: asset.uri, name: asset.fileName || fallbackName, type: asset.mimeType || fallbackType } as any)
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/uploads/marketplace-image`, {
    method: 'POST',
    headers: { 'x-user-phone': userPhone },
    body: form,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string; message?: string }
    throw new Error(payload.error || payload.message || `Image upload failed: ${response.status}`)
  }
  return response.json() as Promise<{ data: { image: string; path: string } }>
}

export async function recordAppUsage(deviceId: string, options?: { userPhone?: string | null; userName?: string | null; appVersion?: string | null; platform?: string | null }) {
  if (!apiBaseUrl) return
  try {
    await fetchJson<{ data: { id: string; deviceId: string; visitedAt: string } }>('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        userPhone: options?.userPhone || null,
        userName: options?.userName || null,
        appVersion: options?.appVersion || null,
        platform: options?.platform || null,
      }),
    })
  } catch {
    // Ignore analytics failures so app does not break for anonymous usage tracking.
  }
}

export async function registerPushToken(token: string, deviceId: string, platform: string, userPhone?: string | null) {
  return fetchJson<{ data: { id: string; token: string; deviceId: string; platform: string } }>('/api/devices/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, deviceId, platform }),
  }, userPhone)
}

export type AdminSummary = {
  total_users: number
  super_admins: number
  total_businesses: number
  installed_devices: number
  total_reviews: number
  total_feedback: number
}

export type AdminActivityItem = {
  type: 'review' | 'feedback' | 'usage'
  entity_id: string
  label: string
  created_at: string
}

export async function fetchAdminSummary(userPhone: string) {
  return fetchJson<{ data: AdminSummary }>('/api/admin/summary', undefined, userPhone)
}

export async function fetchAdminRecentActivity(userPhone: string) {
  return fetchJson<{ data: AdminActivityItem[] }>('/api/admin/recent-activity', undefined, userPhone)
}

export default fetchJson
