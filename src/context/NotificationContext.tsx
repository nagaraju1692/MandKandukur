import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
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
const rainCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])
const kandukurOffsetMs = (5 * 60 + 30) * 60 * 1000

function getKandukurTimeMs(time: string | Date) {
  if (time instanceof Date) return time.getTime()
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(time)
  if (!match) return new Date(time).getTime()
  const [, year, month, day, hour, minute] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) - kandukurOffsetMs
}

function formatRainTime(time: string | Date) {
  return new Date(getKandukurTimeMs(time)).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

function isNotificationExpired(notification: MobileNotification, now: number) {
  return typeof notification.expiresAt === 'number' && Number.isFinite(notification.expiresAt) && notification.expiresAt <= now
}

function createRainNotification(weather: WeatherReport): MobileNotification | null {
  const now = Date.now()
  const upcomingHours = weather.hourly
    .map((hour, index) => ({ hour, index }))
    .filter(({ hour }) => getKandukurTimeMs(hour.time) >= now)
  const rainStartPosition = upcomingHours.findIndex(({ hour }) => rainCodes.has(hour.code))
  const rainStart = rainStartPosition < 0 ? -1 : upcomingHours[rainStartPosition].index
  if (rainStart < 0) return null

  let rainEnd = rainStart
  while (rainEnd + 1 < weather.hourly.length
    && getKandukurTimeMs(weather.hourly[rainEnd + 1].time) >= now
    && rainCodes.has(weather.hourly[rainEnd + 1].code)) rainEnd += 1
  const start = weather.hourly[rainStart]
  const end = weather.hourly[rainEnd]
  const dateKey = start.time.slice(0, 10)
  const rainEndTime = new Date(getKandukurTimeMs(end.time) + 60 * 60 * 1000)
  const timeRange = `${formatRainTime(start.time)} to ${formatRainTime(rainEndTime)}`
  const expiresAt = rainEndTime.getTime()
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null

  return {
    id: `weather-rain-${dateKey}`,
    title: 'Rain alert',
    message: `Rain may occur in Kandukur between ${timeRange}.`,
    time: 'Weather alert',
    type: 'Weather',
    announcementTitle: 'Rain expected in Kandukur',
    detail: `Possible rain: ${timeRange}`,
    description: 'If you are going outside, carry an umbrella. Prefer a car when possible; if travelling by bike, use rain gear and ride carefully.',
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
        const weather = await fetchWeather()
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
