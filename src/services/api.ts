import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type WeatherHourlyItem = {
  time: string
  temp: number
  code: number
  precipitationProbability?: number
  precipitation?: number
}

export type WeatherReport = {
  temp: string
  currentCode?: number
  code?: number
  condition: string
  humidity: string
  wind: string
  precipitation?: number
  updatedAt: string
  locationName?: string
  latitude?: number
  longitude?: number
  hourly: WeatherHourlyItem[]
  daily: Array<{ date: string; max: number; min: number; code: number }>
}

export type GoldRate = {
  pricePerGram18K: number
  pricePerGram22K: number
  pricePerGram24K: number
  pricePerSavaram18K: number
  pricePerSavaram22K: number
  pricePerSavaram: number
  updatedAt: string
}

type StoredGoldRate = {
  date: string
  rate: GoldRate
}

const GOLD_RATE_STORAGE_KEY = '@manakandukur_gold_rate_v3'
const GOLD_RATE_REFRESH_HOUR = 10
const FALLBACK_22K_RATE = 14130
const HYDERABAD_GOLD_RATE_URL = 'https://www.goodreturns.in/gold-rates/hyderabad.html'

const weatherConditions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  85: 'Light snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
}

function normalizeWeatherTime(time: string, utcOffsetSeconds: number) {
  const localTimestamp = Date.parse(`${time}Z`)
  if (!Number.isFinite(localTimestamp) || !Number.isFinite(utcOffsetSeconds)) return time
  return new Date(localTimestamp - utcOffsetSeconds * 1000).toISOString()
}

export async function fetchWeather(coords?: { latitude: number; longitude: number } | null): Promise<WeatherReport> {
  const latitude = coords?.latitude != null && Number.isFinite(coords.latitude) ? coords.latitude : 15.2154
  const longitude = coords?.longitude != null && Number.isFinite(coords.longitude) ? coords.longitude : 79.9072
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability,precipitation',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    forecast_days: '7',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: 'auto',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)
  const data = await response.json()
  const utcOffsetSeconds = Number(data.utc_offset_seconds)
  const toAbsoluteTime = (time: string) => normalizeWeatherTime(time, utcOffsetSeconds)
  const hourlyTimes: string[] = (data.hourly?.time || []).map(toAbsoluteTime)
  const currentTime = typeof data.current?.time === 'string' ? toAbsoluteTime(data.current.time) : new Date().toISOString()
  const currentMs = new Date(currentTime).getTime()
  // Include the active current hour (the hour interval that encompasses currentMs)
  let firstUpcomingHour = hourlyTimes.findIndex((time) => new Date(time).getTime() + 60 * 60 * 1000 > currentMs)
  if (firstUpcomingHour < 0) firstUpcomingHour = 0
  const hourlyWindow = hourlyTimes.slice(firstUpcomingHour, firstUpcomingHour + 24)

  let locationName: string | undefined
  try {
    const resolved = await reverseGeocodeCoordinates(latitude, longitude)
    if (resolved) {
      locationName = resolved
    }
  } catch {
    // Gracefully handle geocoding error
  }

    const rawCurrentCode = Number(data.current?.weather_code ?? 0)
  const currentPrecip = Number(data.current?.precipitation ?? data.current?.rain ?? data.current?.showers ?? 0)
  const isRainCode = (rawCurrentCode >= 51 && rawCurrentCode <= 67) || (rawCurrentCode >= 80 && rawCurrentCode <= 99)

  // Check the active current hour and nearby upcoming hour
  const activeHourCode = hourlyWindow.length > 0 ? Number(data.hourly.weather_code[firstUpcomingHour] ?? 0) : 0
  const activeHourPrecip = hourlyWindow.length > 0 ? Number(data.hourly.precipitation?.[firstUpcomingHour] ?? 0) : 0
  const isActiveHourRain = (activeHourCode >= 51 && activeHourCode <= 67) || (activeHourCode >= 80 && activeHourCode <= 99) || activeHourPrecip > 0

  let currentCode = rawCurrentCode
  if (isRainCode) {
    currentCode = rawCurrentCode
  } else if (currentPrecip > 0) {
    currentCode = currentPrecip >= 5.0 ? 65 : (currentPrecip >= 1.0 ? 63 : (currentPrecip >= 0.3 ? 61 : 51))
  } else if (isActiveHourRain) {
    currentCode = (activeHourCode >= 51 && activeHourCode <= 99) ? activeHourCode : (activeHourPrecip >= 1.0 ? 63 : 51)
  }

  return {
    temp: `${Math.round(data.current.temperature_2m)}°C`,
    currentCode,
    code: currentCode,
    condition: weatherConditions[currentCode] || 'Current conditions',
    humidity: `${Math.round(data.current.relative_humidity_2m)}% humidity`,
    wind: `${Math.round(data.current.wind_speed_10m)} km/h wind`,
    precipitation: currentPrecip,
    updatedAt: currentTime,
    locationName,
    latitude,
    longitude,
    hourly: hourlyWindow.map((time) => {
      const sourceIndex = hourlyTimes.indexOf(time)
      const rawHourlyCode = data.hourly.weather_code[sourceIndex]
      const hourlyPrecip = data.hourly.precipitation ? data.hourly.precipitation[sourceIndex] : undefined
      const isHourlyRainCode = (rawHourlyCode >= 51 && rawHourlyCode <= 67) || (rawHourlyCode >= 80 && rawHourlyCode <= 99)
      const effectiveHourlyCode = isHourlyRainCode
        ? rawHourlyCode
        : (typeof hourlyPrecip === 'number' && hourlyPrecip > 0)
          ? (hourlyPrecip >= 5.0 ? 65 : hourlyPrecip >= 1.0 ? 63 : 61)
          : rawHourlyCode
      return {
        time,
        temp: Math.round(data.hourly.temperature_2m[sourceIndex]),
        code: effectiveHourlyCode,
        precipitationProbability: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[sourceIndex] : undefined,
        precipitation: hourlyPrecip,
      }
    }),
    daily: (data.daily?.time || []).map((date: string, index: number) => ({
      date,
      max: Math.round(data.daily.temperature_2m_max[index]),
      min: Math.round(data.daily.temperature_2m_min[index]),
      code: data.daily.weather_code[index],
    })),
  }
}

export async function fetchGoldRate(): Promise<GoldRate> {
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  let stored: StoredGoldRate | null = null

  try {
    const rawStoredRate = await AsyncStorage.getItem(GOLD_RATE_STORAGE_KEY)
    if (rawStoredRate) stored = JSON.parse(rawStoredRate) as StoredGoldRate
  } catch {
    // Use the online value or fallback when local storage is unavailable.
  }

  const isAfterRefreshTime = now.getHours() >= GOLD_RATE_REFRESH_HOUR
  if (stored?.rate && (!isAfterRefreshTime || stored.date === date)) return stored.rate

  if (!isAfterRefreshTime) {
    return stored?.rate || buildGoldRate(FALLBACK_22K_RATE, new Date().toISOString())
  }

  try {
    const response = await fetch(HYDERABAD_GOLD_RATE_URL)
    if (!response.ok) throw new Error(`Hyderabad gold rate request failed: ${response.status}`)
    const page = await response.text()
    const rateMatch = page.match(/id=["']22K-price["'][^>]*>(?:&#x20b9;|₹)?\s*([\d,]+)/i)
    const pricePerGram22K = rateMatch ? Number(rateMatch[1].replace(/,/g, '')) : NaN
    if (!Number.isFinite(pricePerGram22K) || pricePerGram22K <= 0) {
      throw new Error('Hyderabad gold rate was not found')
    }

    const rate = buildGoldRate(pricePerGram22K, new Date().toISOString())
    await AsyncStorage.setItem(GOLD_RATE_STORAGE_KEY, JSON.stringify({ date, rate } satisfies StoredGoldRate))
    return rate
  } catch {
    return stored?.rate || buildGoldRate(FALLBACK_22K_RATE, new Date().toISOString())
  }
}

function buildGoldRate(pricePerGram22K: number, updatedAt: string): GoldRate {
  const pricePerGram24K = Math.round(pricePerGram22K * 24 / 22)
  const pricePerGram18K = Math.round(pricePerGram22K * 18 / 22)

  return {
    pricePerGram18K,
    pricePerGram22K,
    pricePerGram24K,
    pricePerSavaram18K: pricePerGram18K * 8,
    pricePerSavaram22K: pricePerGram22K * 8,
    pricePerSavaram: pricePerGram24K * 8,
    updatedAt,
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

const GEOCODE_STORAGE_KEY = '@manakandukur_geocode_cache_v1'
const REVERSE_GEOCODE_STORAGE_KEY = '@manakandukur_reverse_geocode_cache_v2'
const GEOCODE_MIN_INTERVAL_MS = 1100

// In-memory caches for synchronous instant lookups.
// Storing null prevents repeated failed network lookups for non-geocodable addresses.
const geocodeMemoryCache = new Map<string, { latitude: number; longitude: number } | null>()
const reverseGeocodeMemoryCache = new Map<string, string | null>()

// In-flight promise caches to deduplicate concurrent requests for identical keys
const inFlightGeocodePromises = new Map<string, Promise<{ latitude: number; longitude: number } | null>>()
const inFlightReverseGeocodePromises = new Map<string, Promise<string | null>>()

let isGeocodeCacheHydrated = false
const hydratePromise: Promise<void> = (async () => {
  try {
    const [storedGeocode, storedReverse] = await Promise.all([
      AsyncStorage.getItem(GEOCODE_STORAGE_KEY),
      AsyncStorage.getItem(REVERSE_GEOCODE_STORAGE_KEY),
    ])
    if (storedGeocode) {
      const parsed = JSON.parse(storedGeocode) as Record<string, { latitude: number; longitude: number } | null>
      Object.entries(parsed).forEach(([k, v]) => {
        if (!geocodeMemoryCache.has(k)) {
          geocodeMemoryCache.set(k, v)
        }
      })
    }
    if (storedReverse) {
      const parsed = JSON.parse(storedReverse) as Record<string, string | null>
      Object.entries(parsed).forEach(([k, v]) => {
        if (!reverseGeocodeMemoryCache.has(k)) {
          reverseGeocodeMemoryCache.set(k, v)
        }
      })
    }
  } catch {
    // Ignore storage errors
  } finally {
    isGeocodeCacheHydrated = true
  }
})()

let saveGeocodeTimeout: ReturnType<typeof setTimeout> | null = null
function scheduleSaveGeocodeCache() {
  if (saveGeocodeTimeout) return
  saveGeocodeTimeout = setTimeout(async () => {
    saveGeocodeTimeout = null
    try {
      const obj: Record<string, { latitude: number; longitude: number } | null> = {}
      geocodeMemoryCache.forEach((v, k) => { obj[k] = v })
      await AsyncStorage.setItem(GEOCODE_STORAGE_KEY, JSON.stringify(obj))
    } catch {
      // Ignore storage errors
    }
  }, 2000)
}

let saveReverseGeocodeTimeout: ReturnType<typeof setTimeout> | null = null
function scheduleSaveReverseGeocodeCache() {
  if (saveReverseGeocodeTimeout) return
  saveReverseGeocodeTimeout = setTimeout(async () => {
    saveReverseGeocodeTimeout = null
    try {
      const obj: Record<string, string | null> = {}
      reverseGeocodeMemoryCache.forEach((v, k) => { obj[k] = v })
      await AsyncStorage.setItem(REVERSE_GEOCODE_STORAGE_KEY, JSON.stringify(obj))
    } catch {
      // Ignore storage errors
    }
  }, 2000)
}

function normalizeAddressKey(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeCoordsKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`
}

// Nominatim's free API allows at most 1 request/second. Serialize every caller through
// one global queue so concurrent screens can't collectively exceed that limit.
let geocodeQueue: Promise<unknown> = Promise.resolve()

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !address.trim()) return null
  const normalized = normalizeAddressKey(address)

  // 1. Check synchronous in-memory cache
  if (geocodeMemoryCache.has(normalized)) {
    return geocodeMemoryCache.get(normalized) ?? null
  }

  // 2. Wait for hydration if pending, then re-check
  if (!isGeocodeCacheHydrated) {
    await hydratePromise.catch(() => undefined)
    if (geocodeMemoryCache.has(normalized)) {
      return geocodeMemoryCache.get(normalized) ?? null
    }
  }

  // 3. Fallback coordinates check
  const fallback = fallbackCoordinatesByAddress(address)
  if (fallback) {
    geocodeMemoryCache.set(normalized, fallback)
    scheduleSaveGeocodeCache()
    return fallback
  }

  // 4. Return in-flight promise if one is already pending
  const inFlight = inFlightGeocodePromises.get(normalized)
  if (inFlight) {
    return inFlight
  }

  // 5. Run request via rate-limiting queue
  const requestPromise = (async () => {
    const result = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      geocodeQueue = geocodeQueue.then(async () => {
        try {
          if (geocodeMemoryCache.has(normalized)) {
            resolve(geocodeMemoryCache.get(normalized) ?? null)
            return
          }
          const params = new URLSearchParams({ format: 'jsonv2', limit: '1', q: `${address}, Andhra Pradesh, India` })
          const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
            headers: { Accept: 'application/json', 'User-Agent': 'ManaKandukurMobile/1.0' },
          })
          if (!response.ok) {
            resolve(fallback)
            return
          }
          const results = await response.json()
          if (!Array.isArray(results) || !results[0]) {
            resolve(fallback)
            return
          }
          const lat = Number(results[0].lat)
          const lon = Number(results[0].lon)
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            resolve({ latitude: lat, longitude: lon })
          } else {
            resolve(fallback)
          }
        } catch {
          resolve(fallback)
        } finally {
          await new Promise((r) => setTimeout(r, GEOCODE_MIN_INTERVAL_MS))
        }
      }).catch(() => {
        resolve(fallback)
      })
    })

    geocodeMemoryCache.set(normalized, result)
    scheduleSaveGeocodeCache()
    inFlightGeocodePromises.delete(normalized)
    return result
  })()

  inFlightGeocodePromises.set(normalized, requestPromise)
  return requestPromise
}

function joinLocalityAndRegion(locality: string | null | undefined, region: string | null | undefined): string | null {
  const place = (locality || '').trim()
  const state = (region || '').trim()
  if (!place) return state || null
  if (!state) return place
  if (place.toLowerCase().includes(state.toLowerCase())) return place
  return `${place}, ${state}`
}

export async function reverseGeocodeCoordinates(latitude: number, longitude: number): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null

  const key = normalizeCoordsKey(latitude, longitude)

  // 1. Check in-memory cache
  if (reverseGeocodeMemoryCache.has(key)) {
    return reverseGeocodeMemoryCache.get(key) ?? null
  }

  // 2. Wait for hydration if pending
  if (!isGeocodeCacheHydrated) {
    await hydratePromise.catch(() => undefined)
    if (reverseGeocodeMemoryCache.has(key)) {
      return reverseGeocodeMemoryCache.get(key) ?? null
    }
  }

  // 3. Check in-flight promise
  const inFlight = inFlightReverseGeocodePromises.get(key)
  if (inFlight) {
    return inFlight
  }

  const requestPromise = (async () => {
    let resolvedName: string | null = null

    // 1. Try native expo-location reverse geocoding on device
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (results && results.length > 0) {
        const place = results[0]
        const locality = place.district || place.subregion || place.city || place.name || place.street
        resolvedName = joinLocalityAndRegion(locality, place.region)
      }
    } catch {
      // Continue to web/fallback fetch
    }

    // 2. Try fast & reliable free reverse geocode API (BigDataCloud)
    if (!resolvedName) {
      try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          const locality = data.locality || data.city || data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name
          resolvedName = joinLocalityAndRegion(locality, data.principalSubdivision)
        }
      } catch {
        // Continue to Nominatim
      }
    }

    // 3. Fallback Nominatim with rate-limit queue
    if (!resolvedName) {
      resolvedName = await new Promise<string | null>((resolve) => {
        geocodeQueue = geocodeQueue.then(async () => {
          try {
            const params = new URLSearchParams({ format: 'jsonv2', lat: String(latitude), lon: String(longitude) })
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
              headers: { Accept: 'application/json', 'User-Agent': 'ManaKandukurMobile/1.0' },
            })
            if (!response.ok) {
              resolve(null)
              return
            }
            const result = await response.json()
            const locality = result?.address?.village || result?.address?.suburb || result?.address?.town || result?.address?.city || result?.address?.road
            resolve(joinLocalityAndRegion(locality, result?.address?.state) || result?.display_name || null)
          } catch {
            resolve(null)
          } finally {
            await new Promise((r) => setTimeout(r, GEOCODE_MIN_INTERVAL_MS))
          }
        }).catch(() => {
          resolve(null)
        })
      })
    }

    reverseGeocodeMemoryCache.set(key, resolvedName)
    scheduleSaveReverseGeocodeCache()
    inFlightReverseGeocodePromises.delete(key)
    return resolvedName
  })()

  inFlightReverseGeocodePromises.set(key, requestPromise)
  return requestPromise
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

const DEFAULT_API_URL = 'https://mmanakandukur-backend-dah2a4aafecacbff.indiasouthcentral-01.azurewebsites.net'
export const apiBaseUrl = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

export async function fetchJson<T>(path: string, options?: RequestInit, userPhone?: string | null): Promise<T> {
  if (!apiBaseUrl) throw new Error('EXPO_PUBLIC_API_URL is not configured')
  const headers = new Headers(options?.headers)
  if (userPhone) headers.set('x-user-phone', userPhone)
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
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

export async function recordAppUsage(deviceId: string, options?: {
  userPhone?: string | null
  userName?: string | null
  deviceName?: string | null
  location?: string | null
  appVersion?: string | null
  platform?: string | null
}) {
  if (!apiBaseUrl) return
  try {
    await fetchJson<{ data: { id: string; deviceId: string; visitedAt: string } }>('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        userPhone: options?.userPhone || null,
        userName: options?.userName || null,
        deviceName: options?.deviceName || null,
        location: options?.location || null,
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
  user_name?: string | null
  userName?: string | null
  user_phone?: string | null
  userPhone?: string | null
  device_name?: string | null
  deviceName?: string | null
  location?: string | null
  platform?: string | null
}

export async function fetchAdminSummary(userPhone: string) {
  return fetchJson<{ data: AdminSummary }>('/api/admin/summary', undefined, userPhone)
}

export async function fetchAdminRecentActivity(userPhone: string) {
  return fetchJson<{ data: AdminActivityItem[] }>('/api/admin/recent-activity', undefined, userPhone)
}

export default fetchJson
