import { businesses, categories } from '../data/localData'

export type WeatherReport = {
  temp: string
  condition: string
  humidity: string
  wind: string
  rainSoon: boolean
  rainMinutes: number | null
  updatedAt: string
}

export type GoldRate = {
  pricePerSavaram: number
  updatedAt: string
}

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
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
}

export async function fetchWeather(): Promise<WeatherReport> {
  const params = new URLSearchParams({
    latitude: '15.2154',
    longitude: '79.9072',
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    minutely_15: 'precipitation,weather_code',
    forecast_minutely_15: '2',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timezone: 'Asia/Kolkata',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

  if (!response.ok) throw new Error(`Weather request failed: ${response.status}`)

  const data = await response.json()
  const current = data.current
  const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
  const rainIndex = data.minutely_15?.time?.findIndex((time: string, index: number) => {
    const minutesFromNow = (new Date(time).getTime() - Date.now()) / 60000
    return minutesFromNow >= 0 && minutesFromNow <= 15 && (
      data.minutely_15.precipitation[index] > 0 || rainCodes.has(data.minutely_15.weather_code[index])
    )
  }) ?? -1
  const rainMinutes = rainIndex >= 0
    ? Math.max(1, Math.round((new Date(data.minutely_15.time[rainIndex]).getTime() - Date.now()) / 60000))
    : null

  return {
    temp: `${Math.round(current.temperature_2m)}°C`,
    condition: weatherConditions[current.weather_code] || 'Current conditions',
    humidity: `${Math.round(current.relative_humidity_2m)}% humidity`,
    wind: `${Math.round(current.wind_speed_10m)} km/h wind`,
    rainSoon: rainIndex >= 0,
    rainMinutes,
    updatedAt: current.time,
  }
}

export async function fetchGoldRate(): Promise<GoldRate> {
  const response = await fetch('https://api.gold-api.com/price/XAU/INR')

  if (!response.ok) throw new Error(`Gold rate request failed: ${response.status}`)

  const data = await response.json()
  const gramsPerTroyOunce = 31.1034768
  const savaramWeightInGrams = 8

  return {
    pricePerSavaram: Math.round((data.price / gramsPerTroyOunce) * savaramWeightInGrams),
    updatedAt: data.updatedAt,
  }
}

export async function fetchJson(path: string) {
  const url = new URL(path, 'http://localhost')
  const pathname = url.pathname

  if (pathname === '/api/categories') {
    return { data: categories }
  }

  if (pathname === '/api/businesses') {
    const categoryId = url.searchParams.get('categoryId')
    const filtered = categoryId
      ? (() => {
          const category = categories.find(c => c.id === categoryId)
          if (category?.name === 'Education') {
            const educationIds = categories.filter(c => c.parentId === categoryId).map(c => c.id)
            return businesses.filter(b => b.categoryId === categoryId || educationIds.includes(b.categoryId))
          }
          return businesses.filter(b => b.categoryId === categoryId)
        })()
      : businesses
    return { data: filtered }
  }

  if (pathname.startsWith('/api/businesses/')) {
    const id = pathname.replace('/api/businesses/', '')
    const business = businesses.find(b => b.id === id) || null
    return { data: business }
  }

  return { data: null }
}
