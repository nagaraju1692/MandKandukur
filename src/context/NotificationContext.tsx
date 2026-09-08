import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import { useDirectory } from './DirectoryContext'
import { fetchWeather, registerPushToken, WeatherReport } from '../services/api'
import { configureNotificationHandler, registerForPushNotificationsAsync } from '../services/pushNotifications'
import { fetchLatestUpdate } from '../services/updateCheck'
import { useAuth } from './AuthContext'

// Fallback page when a user taps a "new version" push but the GitHub
// release fetch is rate-limited or fails.
const RELEASES_PAGE_URL = 'https://github.com/nagaraju1692/Kandukur-mobile-apk/releases/latest'

export type MobileNotification = {
  id: string
  title: string
  message: string
  time: string
  type: string
  announcementTitle: string
  detail: string
  description: string
  image?: string
  expiresAt?: number | string
}

type NotificationContextValue = {
  notifications: MobileNotification[]
  clearNotifications: () => Promise<void>
  dismissNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)
const dismissedKey = 'mana-kandukur-mobile-dismissed-notifications'
const clearedAtKey = 'mana-kandukur-mobile-notifications-cleared-at'
const deviceIdKey = 'mana-kandukur-device-id'
const rainAlertNotifiedKey = 'mana-kandukur-mobile-rain-alert-notified'
const rainAlertExpiresAtKey = 'mana-kandukur-mobile-rain-alert-expires-at'
const rainCodes = new Set([53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])

function isRainHour(hour: { code: number; precipitationProbability?: number; precipitation?: number }) {
  if (typeof hour.precipitation === 'number' && hour.precipitation < 0.3) {
    return false
  }
  if (typeof hour.precipitationProbability === 'number' && hour.precipitationProbability < 50 && (!hour.precipitation || hour.precipitation < 0.5)) {
    return false
  }
  const hasPrecip = typeof hour.precipitation === 'number' && hour.precipitation >= 0.5
  const hasHighProb = typeof hour.precipitationProbability === 'number' && hour.precipitationProbability >= 50 && rainCodes.has(hour.code)
  return hasPrecip || hasHighProb || (hour.precipitationProbability == null && hour.precipitation == null && rainCodes.has(hour.code))
}

function parseHourTimeMs(time: string | Date) {
  if (time instanceof Date) return time.getTime()
  return new Date(time).getTime()
}

// Always render in Kandukur's timezone (Asia/Kolkata) — the underlying instant is a correct
// absolute epoch, but without a fixed timeZone this formats using the VIEWING DEVICE's local
// timezone, so a browser/device set to a different timezone than IST shows the wrong hour label.
function formatRainTime(time: string | Date) {
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

function parseTimestamp(value: unknown) {
  const numericValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(numericValue)) return NaN
  return Math.abs(numericValue) < 100_000_000_000 ? numericValue * 1000 : numericValue
}

function isWeatherNotification(notification: MobileNotification) {
  return notification.type.toLowerCase() === 'weather'
    || /\b(rain|weather)\b/i.test(`${notification.title} ${notification.message} ${notification.announcementTitle}`)
}

function getLegacyWeatherExpiry(notification: MobileNotification, now: number) {
  const directExpiry = parseTimestamp(notification.expiresAt)
  if (Number.isFinite(directExpiry)) return directExpiry

  const datedId = notification.id.match(/weather-rain-[\w-]+-(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})/i)
  if (datedId) {
    const start = new Date(`${datedId[1]}T${datedId[2]}:00`).getTime()
    if (Number.isFinite(start)) return start + 60 * 60 * 1000
  }

  const timeRange = `${notification.message} ${notification.detail}`.match(/(?:now|\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)\s*(?:-|to|until|and)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i)
  if (!timeRange) return NaN

  let hour = Number(timeRange[1]) % 12
  if (/p/i.test(timeRange[3])) hour += 12
  const end = new Date(now)
  end.setHours(hour, Number(timeRange[2] || 0), 0, 0)
  return end.getTime()
}

export function isExpiredWeatherNotification(notification: MobileNotification, now = Date.now()) {
  if (!isWeatherNotification(notification)) return false
  const expiresAt = getLegacyWeatherExpiry(notification, now)
  return Number.isFinite(expiresAt) && expiresAt <= now
}

function isNotificationExpired(notification: MobileNotification, now: number) {
  const expiresAt = parseTimestamp(notification.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt <= now
}

async function removeDeliveredRainAlerts() {
  if (Platform.OS === 'web') return
  try {
    const presented = await Notifications.getPresentedNotificationsAsync()
    await Promise.all(presented
      .filter((notification) => (notification.request.content.data as { type?: string } | undefined)?.type === 'rain')
      .map((notification) => Notifications.dismissNotificationAsync(notification.request.identifier)))
  } catch {
    // A missing platform notification API must not interrupt in-app notifications.
  }
}

function createRainNotification(weather: WeatherReport): MobileNotification | null {
  const now = Date.now()
  const locName = weather.locationName || 'Your area'
  const upcomingHours = (weather.hourly || [])
    .map((hour, index) => ({ hour, index }))
    .filter(({ hour }) => parseHourTimeMs(hour.time) + 60 * 60 * 1000 >= now)

  const rainStartPosition = upcomingHours.findIndex(({ hour }) => isRainHour(hour))
  const rainStart = rainStartPosition < 0 ? -1 : upcomingHours[rainStartPosition].index
  if (rainStart < 0) return null

  let rainEnd = rainStart
  while (rainEnd + 1 < weather.hourly.length
    && parseHourTimeMs(weather.hourly[rainEnd + 1].time) >= now
    && isRainHour(weather.hourly[rainEnd + 1])) {
    rainEnd += 1
  }
  const start = weather.hourly[rainStart]
  const end = weather.hourly[rainEnd]
  const dateKey = start.time.slice(0, 10)
  const startTime = new Date(start.time)
  const rainEndTime = new Date(parseHourTimeMs(end.time) + 60 * 60 * 1000)
  const isCurrentlyRaining = (typeof weather.precipitation === 'number' && weather.precipitation >= 0.3) || (typeof weather.currentCode === 'number' && rainCodes.has(weather.currentCode))
  const isRainingNow = isCurrentlyRaining && parseHourTimeMs(start.time) <= now && (parseHourTimeMs(start.time) + 60 * 60 * 1000 >= now)
  const timeRange = isRainingNow ? `Now to ${formatRainTime(rainEndTime)}` : `${formatRainTime(startTime)} to ${formatRainTime(rainEndTime)}`
  const expiresAt = rainEndTime.getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null

  const idSlug = locName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return {
    id: `weather-rain-${idSlug}-${dateKey}-${start.time.slice(11, 16)}`,
    title: `Rain alert · ${locName}`,
    message: isRainingNow
      ? `Raining now in ${locName} until ${formatRainTime(rainEndTime)} (${weather.temp}, ${weather.condition}).`
      : `Rain expected in ${locName} between ${timeRange} (${weather.temp}, ${weather.condition}).`,
    time: 'Weather alert',
    type: 'Weather',
    announcementTitle: isRainingNow ? `Raining now in ${locName}` : `Rain expected in ${locName}`,
    detail: `Possible rain: ${timeRange} · Current temp: ${weather.temp}`,
    description: `Current live weather report for ${locName}: ${weather.condition}, ${weather.temp}, ${weather.humidity}, ${weather.wind}. If travelling outside, please take rain protection and ride carefully.`,
    image: 'https://images.unsplash.com/photo-1501691223387-dd0500403074?auto=format&fit=crop&w=1200&q=80',
    expiresAt,
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState<string[]>([])
  const [dismissedLoaded, setDismissedLoaded] = useState(false)
  const [clearedAt, setClearedAt] = useState<number | null>(null)
  const [rainNotification, setRainNotification] = useState<MobileNotification | null>(null)
  const { announcements } = useDirectory()
  const { user } = useAuth()
  const rainNotificationInFlight = useRef<string | null>(null)

  useEffect(() => {
    if (Platform.OS === 'web') return

    configureNotificationHandler()

    let active = true
    const setupNotifications = async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('announcements', {
            name: 'Announcements and weather',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
          })
        }

        let deviceId = await AsyncStorage.getItem(deviceIdKey)
        if (!deviceId) {
          deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          await AsyncStorage.setItem(deviceIdKey, deviceId)
        }

        // Requests permission, creates the "updates" channel and persists the token.
        const token = await registerForPushNotificationsAsync()
        if (!active || !token) return
        await registerPushToken(token, deviceId, Platform.OS, user?.phone)
      } catch {
        // Notifications are optional; startup and in-app notifications must continue working.
      }
    }

    // Tapping a "new version" push notification reuses the in-app update flow:
    // fetch the latest GitHub release and open the APK download URL.
    const handleNotificationResponse = async (response: Notifications.NotificationResponse | null) => {
      if (!response) return
      setCurrentTime(Date.now())
      const data = response.notification.request.content.data as { type?: string } | undefined
      if (data?.type !== 'update') return
      try {
        const update = await fetchLatestUpdate()
        await Linking.openURL(update?.downloadUrl || RELEASES_PAGE_URL)
      } catch {
        Linking.openURL(RELEASES_PAGE_URL).catch(() => undefined)
      }
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponse(response)
    })
    setupNotifications()
    // Handle a cold start triggered by tapping the notification while the app was closed.
    Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse).catch(() => undefined)

    return () => {
      active = false
      responseSubscription.remove()
    }
  }, [user?.phone])

  useEffect(() => {
    let active = true
    Promise.all([AsyncStorage.getItem(dismissedKey), AsyncStorage.getItem(clearedAtKey)]).then(([value, clearedValue]) => {
      if (!active) return
      try {
        const parsed = value ? JSON.parse(value) : []
        if (Array.isArray(parsed)) setDismissed(parsed)
      } catch {
        setDismissed([])
      } finally {
        const parsedClearedAt = clearedValue ? Number(clearedValue) : NaN
        if (Number.isFinite(parsedClearedAt)) setClearedAt(parsedClearedAt)
        if (active) {
          setCurrentTime(Date.now())
          setDismissedLoaded(true)
        }
      }
    }).catch(() => {
      if (active) {
        setCurrentTime(Date.now())
        setDismissedLoaded(true)
      }
    })
    return () => { active = false }
  }, [])

  const refreshNotifications = useCallback(async () => {
    const now = Date.now()
    setCurrentTime(now)
    setRainNotification((current) => current && isExpiredWeatherNotification(current, now) ? null : current)

    try {
      const [rainAlertId, storedExpiry] = await Promise.all([
        AsyncStorage.getItem(rainAlertNotifiedKey),
        AsyncStorage.getItem(rainAlertExpiresAtKey),
      ])
      const expiresAt = storedExpiry ? Number(storedExpiry) : NaN
      if (rainAlertId && (!Number.isFinite(expiresAt) || expiresAt <= now)) {
        await removeDeliveredRainAlerts()
        await AsyncStorage.multiRemove([rainAlertNotifiedKey, rainAlertExpiresAtKey])
      }
    } catch {
      // Storage cleanup is best-effort; in-app expiry remains available.
    }
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotifications()
    })
    return () => subscription.remove()
  }, [refreshNotifications])

  useEffect(() => {
    if (!dismissedLoaded) return
    AsyncStorage.setItem(dismissedKey, JSON.stringify(dismissed)).catch(() => undefined)
  }, [dismissed, dismissedLoaded])

  useEffect(() => {
    let active = true
        const loadRainAlert = async () => {
      try {
        await refreshNotifications()
        let coords: { latitude: number; longitude: number } | null = null
        try {
          const permission = await Location.getForegroundPermissionsAsync()
          if (permission.granted) {
            const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null)
            if (lastKnown?.coords) {
              coords = { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude }
            } else {
              const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null)
              if (current?.coords) {
                coords = { latitude: current.coords.latitude, longitude: current.coords.longitude }
              }
            }
          }
        } catch {
          // Gracefully fallback
        }

        const weather = await fetchWeather(coords)
        if (active) {
          setCurrentTime(Date.now())
          const nextRainNotification = createRainNotification(weather)
          setRainNotification(nextRainNotification)
          if (nextRainNotification && Platform.OS !== 'web' && rainNotificationInFlight.current !== nextRainNotification.id) {
            rainNotificationInFlight.current = nextRainNotification.id
            try {
              const notifiedRainId = await AsyncStorage.getItem(rainAlertNotifiedKey)
              if (notifiedRainId !== nextRainNotification.id) {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: nextRainNotification.title,
                    body: nextRainNotification.message,
                    data: { type: 'rain', notificationId: nextRainNotification.id },
                    sound: 'default',
                  },
                  trigger: null,
                })
                await AsyncStorage.setItem(rainAlertNotifiedKey, nextRainNotification.id)
                await AsyncStorage.setItem(rainAlertExpiresAtKey, String(nextRainNotification.expiresAt))
              }
            } catch {
              // A local alert failure should not hide the in-app weather notification.
            } finally {
              rainNotificationInFlight.current = null
            }
          }
        }
      } catch {
        if (active) setRainNotification(null)
      }
    }
    loadRainAlert()
    const refresh = setInterval(loadRainAlert, 5 * 60 * 1000)
    return () => {
      active = false
      clearInterval(refresh)
    }
  }, [refreshNotifications])

    useEffect(() => {
    const upcomingExpiries: number[] = []
    const now = Date.now()
    const rainExpiry = rainNotification ? getLegacyWeatherExpiry(rainNotification, now) : NaN

    if (Number.isFinite(rainExpiry) && rainExpiry > now) {
      upcomingExpiries.push(rainExpiry)
    }

    announcements.forEach((announcement) => {
      if (announcement.endDate) {
        const end = new Date(announcement.endDate).getTime()
        if (Number.isFinite(end) && end > now) {
          upcomingExpiries.push(end)
        }
      }
      if (announcement.startDate) {
        const start = new Date(announcement.startDate).getTime()
        if (Number.isFinite(start) && start > now) {
          upcomingExpiries.push(start)
        }
      }
    })

    if (upcomingExpiries.length === 0) return

    const nextExpiry = Math.min(...upcomingExpiries)
    const timeUntilExpiry = Math.max(0, nextExpiry - Date.now())

    const expiryTimer = setTimeout(() => {
      void refreshNotifications()
    }, timeUntilExpiry)

    return () => clearTimeout(expiryTimer)
  }, [announcements, rainNotification, refreshNotifications])

  const notifications = useMemo(() => {
    if (!dismissedLoaded) return []
    const announcementNotifications = announcements.filter((announcement) => {
      if (dismissed.includes(`announcement-${announcement.id}`)) return false
      const startDate = announcement.startDate ? new Date(announcement.startDate).getTime() : null
      const endDate = announcement.endDate ? new Date(announcement.endDate).getTime() : null
      if (startDate !== null && Number.isFinite(startDate) && startDate > currentTime) return false
      if (endDate !== null && Number.isFinite(endDate) && endDate <= currentTime) return false
      if (clearedAt === null || !announcement.createdAt) return true
      return new Date(announcement.createdAt).getTime() > clearedAt
    }).map((announcement) => {
      const endDate = announcement.endDate ? new Date(announcement.endDate).getTime() : undefined
      const expiresAt = typeof endDate === 'number' && Number.isFinite(endDate) ? endDate : undefined
      return {
        id: `announcement-${announcement.id}`,
        title: announcement.title,
        message: `${announcement.detail}.`,
        time: 'New',
        type: announcement.type,
        announcementTitle: announcement.title,
        detail: announcement.detail,
        description: announcement.description,
        image: announcement.image,
        expiresAt,
      }
    })
    const weatherNotifications = rainNotification
      && !isExpiredWeatherNotification(rainNotification, currentTime)
      && !dismissed.includes(rainNotification.id) ? [rainNotification] : []
    return [...weatherNotifications, ...announcementNotifications]
      .filter((notification) => !isExpiredWeatherNotification(notification, currentTime))
  }, [announcements, clearedAt, currentTime, dismissed, dismissedLoaded, rainNotification])

  const clearNotifications = useCallback(async () => {
    const ids = notifications.map((item) => item.id)
    const clearedTimestamp = Date.now()
    setDismissed((current) => Array.from(new Set([...current, ...ids])))
    setClearedAt(clearedTimestamp)
    await AsyncStorage.setItem(clearedAtKey, String(clearedTimestamp)).catch(() => undefined)
    setCurrentTime(clearedTimestamp)
  }, [notifications])

  const dismissNotification = useCallback(async (id: string) => {
    setDismissed((current) => Array.from(new Set([...current, id])))
  }, [])

  const value = useMemo(() => ({ notifications, clearNotifications, dismissNotification, refreshNotifications }), [clearNotifications, dismissNotification, notifications, refreshNotifications])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
