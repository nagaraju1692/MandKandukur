import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'
import { useDirectory } from './DirectoryContext'
import { fetchWeather, registerPushToken, WeatherReport } from '../services/api'
import { useAuth } from './AuthContext'

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
  expiresAt?: number
}

type NotificationContextValue = {
  notifications: MobileNotification[]
  clearNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)
const dismissedKey = 'mana-kandukur-mobile-dismissed-notifications'
const clearedAtKey = 'mana-kandukur-mobile-notifications-cleared-at'
const deviceIdKey = 'mana-kandukur-device-id'
const rainAlertNotifiedKey = 'mana-kandukur-mobile-rain-alert-notified'
const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])

function isRainHour(hour: { code: number; precipitationProbability?: number; precipitation?: number }) {
  if (rainCodes.has(hour.code)) return true
  if (typeof hour.precipitation === 'number' && hour.precipitation > 0) return true
  if (typeof hour.precipitationProbability === 'number' && hour.precipitationProbability >= 40) return true
  return false
}

function parseHourTimeMs(time: string | Date) {
  if (time instanceof Date) return time.getTime()
  return new Date(time).getTime()
}

function formatRainTime(time: string | Date) {
  return new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function isNotificationExpired(notification: MobileNotification, now: number) {
  return typeof notification.expiresAt === 'number' && Number.isFinite(notification.expiresAt) && notification.expiresAt <= now
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
  const isRainingNow = parseHourTimeMs(start.time) <= now && (parseHourTimeMs(start.time) + 60 * 60 * 1000 >= now)
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

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    })

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

        const currentPermissions = await Notifications.getPermissionsAsync()
        const permissions = currentPermissions.granted
          ? currentPermissions
          : await Notifications.requestPermissionsAsync()
        if (!active || !permissions.granted) return

        let deviceId = await AsyncStorage.getItem(deviceIdKey)
        if (!deviceId) {
          deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          await AsyncStorage.setItem(deviceIdKey, deviceId)
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId
        const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data
        await registerPushToken(token, deviceId, Platform.OS, user?.phone)
      } catch {
        // Notifications are optional; startup and in-app notifications must continue working.
      }
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      setCurrentTime(Date.now())
    })
    setupNotifications()
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active && response) setCurrentTime(Date.now())
    }).catch(() => undefined)

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
        if (active) setDismissedLoaded(true)
      }
    }).catch(() => {
      if (active) setDismissedLoaded(true)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setCurrentTime(Date.now())
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (!dismissedLoaded) return
    AsyncStorage.setItem(dismissedKey, JSON.stringify(dismissed)).catch(() => undefined)
  }, [dismissed, dismissedLoaded])

  useEffect(() => {
    let active = true
        const loadRainAlert = async () => {
      try {
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
  }, [])

    useEffect(() => {
    const upcomingExpiries: number[] = []
    const now = Date.now()

    if (rainNotification?.expiresAt && rainNotification.expiresAt > now) {
      upcomingExpiries.push(rainNotification.expiresAt)
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
      setCurrentTime(Date.now())
      if (rainNotification?.expiresAt && rainNotification.expiresAt <= Date.now()) {
        setRainNotification(null)
      }
    }, timeUntilExpiry)

    return () => clearTimeout(expiryTimer)
  }, [announcements, rainNotification])

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
      && !isNotificationExpired(rainNotification, currentTime)
      && !dismissed.includes(rainNotification.id) ? [rainNotification] : []
    return [...weatherNotifications, ...announcementNotifications]
  }, [announcements, clearedAt, currentTime, dismissed, dismissedLoaded, rainNotification])

  const clearNotifications = useCallback(async () => {
    const ids = notifications.map((item) => item.id)
    const clearedTimestamp = Date.now()
    setDismissed((current) => Array.from(new Set([...current, ...ids])))
    setClearedAt(clearedTimestamp)
    await AsyncStorage.setItem(clearedAtKey, String(clearedTimestamp)).catch(() => undefined)
    setCurrentTime(clearedTimestamp)
  }, [notifications])

  const value = useMemo(() => ({ notifications, clearNotifications }), [clearNotifications, notifications])
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}
