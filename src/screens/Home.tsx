import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { AppState, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions, Linking } from 'react-native'
import BottomNav from './BottomNav'
import { getBusinessImage, getCategoryImage } from '../utils/categoryImages'
import MobileHeader from './MobileHeader'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { useReviews } from '../context/ReviewContext'
import { useNearby } from '../context/NearbyContext'
import { useDirectory } from '../context/DirectoryContext'
import DirectoryState from './DirectoryState'
import { colors } from '../ui/theme'
import { fetchGoldRate, fetchWeather, GoldRate, WeatherReport } from '../services/api'
import { fetchCricketMatchDetails, fetchLiveCricketMatches, formatCricketDateTime, formatCompactCricketDateTime, CricketMatch } from '../services/cricketApi'
import FocusTextInput from '../ui/FocusTextInput'
import { fetchLatestUpdate, AppUpdateInfo, DISMISSED_VERSION_KEY } from '../services/updateCheck'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { useVoiceSearch } from '../ui/useVoiceSearch'
import RemoteImage from '../ui/RemoteImage'

const bundledCategoryFallback = require('../assets/manakundur-app-icon.png')

const homeCategoryIds = ['1', '4', '21', '22', '6', 'health']
const weatherImageUrl = 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&w=700&q=85'
const weatherModeImages = {
  rain: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=700&q=85',
  cloud: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=700&q=85',
  heat: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85',
  morning: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=85',
  afternoon: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=700&q=85',
  evening: 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?auto=format&fit=crop&w=700&q=85',
}







const goldImageUrl = 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=700&q=85'
const announcementCardGap = 12
const cricketCardGap = 10
const popularGroups = [
  ['hospitals-clinics', 'Hospitals', 'Hospitals & Clinics'],
  ['medical-shops', 'Medical shops', 'Medical Shops'],
  ['restaurants-hotels', 'Restaurants', 'Restaurants & Hotels'],
]
const rainCodes = new Set([53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])

function formatTeamScore(score?: string): string {
  if (!score || typeof score !== 'string') return '—'
  const trimmed = score.trim()
  if (!trimmed || /^(ns|na|n\/a|not started|scheduled|—|-)$/i.test(trimmed)) {
    return '—'
  }
  return score
}

function isRainHour(hour: { code: number; precipitationProbability?: number; precipitation?: number }) {
  const hasPrecip = typeof hour.precipitation === 'number' && hour.precipitation >= 0.5
  const hasHighProb = typeof hour.precipitationProbability === 'number' && hour.precipitationProbability >= 50 && rainCodes.has(hour.code)
  if (typeof hour.precipitationProbability === 'number' && hour.precipitationProbability < 40 && (!hour.precipitation || hour.precipitation < 0.5)) {
    return false
  }
  return hasPrecip || hasHighProb || (hour.precipitationProbability == null && hour.precipitation == null && rainCodes.has(hour.code))
}

function parseHourTimeMs(time: string | Date) {
  if (time instanceof Date) return time.getTime()
  return new Date(time).getTime()
}

function formatRainHour(time: string | Date) {
  return new Date(time).toLocaleTimeString([], {
    hour: 'numeric',
  })
}

function getRainWindow(weather: WeatherReport | null, t: (en: string, te: string) => string) {
  if (!weather?.hourly || weather.hourly.length === 0) return null
  const now = Date.now()
  const upcomingHours = weather.hourly
    .map((hour, index) => ({ hour, index }))
    .filter(({ hour }) => parseHourTimeMs(hour.time) + 30 * 60 * 1000 >= now)

  const rainStartPos = upcomingHours.findIndex(({ hour }) => isRainHour(hour))
  if (rainStartPos < 0) return null

  const rainStartIndex = upcomingHours[rainStartPos].index
  let rainEndIndex = rainStartIndex
  while (
    rainEndIndex + 1 < weather.hourly.length &&
    isRainHour(weather.hourly[rainEndIndex + 1])
  ) {
    rainEndIndex += 1
  }

  const startHour = weather.hourly[rainStartIndex]
  const endHour = weather.hourly[rainEndIndex]
  const startTimeStr = formatRainHour(startHour.time)
  const endTimeDate = new Date(parseHourTimeMs(endHour.time) + 60 * 60 * 1000)
  const endTimeStr = formatRainHour(endTimeDate)

  const startMs = parseHourTimeMs(startHour.time)
  const endMs = parseHourTimeMs(endHour.time) + 60 * 60 * 1000
  const timeRange = `${startTimeStr} – ${endTimeStr}`

  return {
    timeRange,
    startMs,
    endMs,
    badgeText: t(`Rain: ${timeRange}`, `వర్షం: ${startTimeStr} – ${endTimeStr}`),
    modalText: t(`Rain expected between ${startTimeStr} to ${endTimeStr}`, `${startTimeStr} నుండి ${endTimeStr} మధ్య వర్షం పడే అవకాశం ఉంది`),
  }
}

function localPopularBusinesses(businesses: any[]) {
  return popularGroups.flatMap((group) => businesses.filter((business) => group.includes(business.categoryId) || group.includes(business.categoryName)))
}

function weatherIcon(code: number) {
  if (code >= 95) return '⛈'
  if (code >= 61 || (code >= 51 && code <= 57) || (code >= 80 && code <= 82)) return '🌧'
  if (code >= 2) return '☁'
  return '☀'
}

function normalizeFormatName(raw?: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()
  if (lower === 'cricket' || lower === 'cricket match') return ''

  if (/\b(one day international|one day|one-day|odi)\b/i.test(trimmed)) {
    return 'ODI'
  }
  if (/\b(twenty20 international|twenty20 i|twenty20|t20i|t20)\b/i.test(trimmed)) {
    return 'T20'
  }
  if (/\b(test match|test)\b/i.test(trimmed)) {
    return 'TEST'
  }
  return trimmed
}

function getFormatBadgeStyle(format?: string) {
  const normalized = (format || '').toUpperCase()
  if (
    normalized.includes('WOMEN') ||
    normalized.includes('WOMAN') ||
    normalized.includes('W-T20') ||
    normalized.includes('W-ODI') ||
    normalized.includes('WT20') ||
    normalized.includes('WODI') ||
    normalized.includes('W-TEST') ||
    normalized.includes('WTEST')
  ) {
    return { bg: '#FFE4E6', text: '#BE123C', border: '#FECDD3' }
  }
  if (normalized.includes('T20I') || normalized.includes('TWENTY20 INTERNATIONAL') || normalized.includes('TWENTY20 I')) {
    return { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' }
  }
  if (normalized.includes('T20') || normalized.includes('TWENTY20') || normalized.includes('IPL')) {
    return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' }
  }
  if (normalized.includes('ODI') || normalized.includes('ONE DAY') || normalized.includes('ONE-DAY')) {
    return { bg: '#E0F2FE', text: '#0369A1', border: '#7DD3FC' }
  }
  if (normalized.includes('TEST')) {
    return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' }
  }
  return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }
}

function isHourInRainWindow(time: string | Date, rainWindow: ReturnType<typeof getRainWindow>) {
  if (!rainWindow) return false
  const hourMs = parseHourTimeMs(time)
  return hourMs >= rainWindow.startMs && hourMs < rainWindow.endMs
}

function getWeatherMode(weather: WeatherReport | null, time: Date) {
  const hourlyCodes = weather?.hourly.map((hour) => hour.code) || []
  const currentCode = weather?.daily[0]?.code ?? 0
  if (hourlyCodes.some((code) => code >= 51 && code <= 99) || (currentCode >= 51 && currentCode <= 99)) return 'rain' as const
  if (currentCode >= 1 && currentCode <= 3) return 'cloud' as const
  if (weather && Number.parseInt(weather.temp, 10) >= 35) return 'heat' as const
  const hour = time.getHours()
  if (hour < 12) return 'morning' as const
  if (hour < 17) return 'afternoon' as const
  return 'evening' as const
}

function HomeCategoryImage({ name }: { name: string }) {
  return <RemoteImage source={{ uri: getCategoryImage(name) }} fallbackSource={bundledCategoryFallback} style={styles.categoryImage} resizeMode="cover" fallbackContent={<View style={styles.categoryImageFallback}><Ionicons name="image-outline" size={34} color="#E9D7E9" /></View>} />
}

export default function Home({ navigation }: any) {
  const { favorites, toggleFavorite, isLoggedIn } = useAuth()
  const { getReviewStats } = useReviews()
  const { distances, ready, ensureAddresses, sortNearest, location } = useNearby()
  const { t, category: categoryLabel, businessName } = useLanguage()
  const { refreshNotifications } = useNotifications()
  const { businesses, categories, announcements: updates, loading, error, retry } = useDirectory()
  const cards = homeCategoryIds.map((id) => categories.find((category) => category.id === id)).filter((category): category is NonNullable<typeof category> => Boolean(category))
  const categoryListingCount = (categoryId: string) => {
    const categoryIds = new Set([categoryId])
    let hasNewCategory = true
    while (hasNewCategory) {
      hasNewCategory = false
      categories.forEach((category) => {
        if (category.parentId && categoryIds.has(category.parentId) && !categoryIds.has(category.id)) {
          categoryIds.add(category.id)
          hasNewCategory = true
        }
      })
    }
    return businesses.filter((business) => categoryIds.has(business.categoryId)).length
  }
    const [search, setSearch] = useState('')
  const [weather, setWeather] = useState<WeatherReport | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gold, setGold] = useState<GoldRate | null>(null)
  const [cricketMatches, setCricketMatches] = useState<CricketMatch[]>([])
  const [cricketError, setCricketError] = useState<string | null>(null)
  const [selectedCricketMatch, setSelectedCricketMatch] = useState<CricketMatch | null>(null)
  const [activeCricketTab, setActiveCricketTab] = useState('live')
  const [utilityLoading, setUtilityLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUtility, setSelectedUtility] = useState<'weather' | 'gold' | null>(null)
  const [popularBusinesses, setPopularBusinesses] = useState<any[]>([])
  const [selectedUpdate, setSelectedUpdate] = useState<typeof updates[number] | null>(null)
  const [appUpdate, setAppUpdate] = useState<AppUpdateInfo | null>(null)
  const [dismissedUpdateVersion, setDismissedUpdateVersion] = useState<string | null>(null)
  const [selectedUpdateCardId, setSelectedUpdateCardId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const submitSearch = (value: string) => {
    const trimmed = value.trim()
    if (trimmed) navigation.navigate('Search', { query: trimmed })
  }
  const { recognizing, handleVoiceSearch } = useVoiceSearch({
    t,
    onResult: (transcript, isFinal) => {
      setSearch(transcript)
      if (isFinal) submitSearch(transcript)
    },
  })
    const announcementRailRef = useRef<ScrollView | null>(null)
  const announcementIndexRef = useRef(0)
  const cricketRailRef = useRef<ScrollView | null>(null)
  const cricketAutoDirectionRef = useRef<1 | -1>(1)
  const [activeCricketIndex, setActiveCricketIndex] = useState(0)
  const [isCricketInteracting, setIsCricketInteracting] = useState(false)
  const { width } = useWindowDimensions()
  const isPhone = width < 600
  const horizontalPadding = isPhone ? 18 : 24
  const categoryCardWidth = (width - horizontalPadding * 2 - 12) / 2
  const announcementCardWidth = isPhone ? (width - horizontalPadding * 2 - announcementCardGap) / 2 : 252
  const availableCricketWidth = width - horizontalPadding * 2 - (width >= 600 ? 68 : 0)
  const cricketCardWidth = Math.max(140, (availableCricketWidth - cricketCardGap) / 2)
  const weatherMode = getWeatherMode(weather, currentTime)
  const rainWindow = getRainWindow(weather, t)

  const formatMatchStatus = useCallback((status: string, isLive: boolean, isUpcoming: boolean) => {
    const rawStatus = (status || '').trim()
    const lower = rawStatus.toLowerCase()

    if (lower === 'ns' || lower === 'scheduled' || lower === 'not started' || lower === 'upcoming' || (isUpcoming && (!rawStatus || lower === 'upcoming'))) {
      return ''
    }
    if (isLive && (lower === 'live' || lower === 'in progress' || !rawStatus)) {
      return t('Live Now', 'లైవ్')
    }
    if (rawStatus) {
      return rawStatus
    }
    if (isLive) {
      return t('Live Now', 'లైవ్')
    }
    return ''
  }, [t])

  const openBusiness = (businessId: string) => {
    setSelectedBusinessId(businessId)
    navigation.navigate('BusinessDetails', { id: businessId })
  }
  const popularNearYou = popularGroups.flatMap((group) => sortNearest(
    popularBusinesses.filter((business) => group.includes(business.categoryId) || group.includes(business.categoryName)),
  ).slice(0, 2))

  useEffect(() => { setPopularBusinesses(localPopularBusinesses(businesses)) }, [businesses])

  // Check for app updates on mount
  useEffect(() => {
    let active = true
    const checkForUpdates = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(DISMISSED_VERSION_KEY)
        setDismissedUpdateVersion(dismissed)
        const update = await fetchLatestUpdate()
        if (active && update && update.version !== dismissed) {
          setAppUpdate(update)
        }
      } catch (error) {
        console.log('Update check failed:', error)
      }
    }
    checkForUpdates()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

            const loadUtilities = useCallback(async () => {
    try {
      const [weatherResult, goldResult, cricketResult] = await Promise.allSettled([
        fetchWeather(location),
        fetchGoldRate(),
        fetchLiveCricketMatches(),
      ])
      if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value)
      if (goldResult.status === 'fulfilled') setGold(goldResult.value)
      if (cricketResult.status === 'fulfilled') {
        setCricketMatches(cricketResult.value)
        setCricketError(null)
      } else {
        setCricketError(t('Cricket scores are unavailable right now.', 'ప్రస్తుతం క్రికెట్ స్కోర్లు అందుబాటులో లేవు.'))
      }
    } finally {
      setUtilityLoading(false)
    }
  }, [location])

  useEffect(() => {
    loadUtilities()
  }, [loadUtilities])

  useEffect(() => {
    let active = true
    const refreshGoldRate = async () => {
      try {
        const rate = await fetchGoldRate()
        if (active) setGold(rate)
      } catch {
        // Keep the last displayed rate when a refresh is unavailable.
      }
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshGoldRate()
    })
    const timer = setInterval(refreshGoldRate, 60 * 1000)
    return () => {
      active = false
      subscription.remove()
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (cricketMatches.length < 2 || isCricketInteracting) return
    const maxIndex = Math.max(0, cricketMatches.length - 2)
    if (maxIndex === 0) return
    const timer = setInterval(() => {
      let nextIndex = activeCricketIndex + cricketAutoDirectionRef.current
      if (nextIndex >= maxIndex) {
        cricketAutoDirectionRef.current = -1
        nextIndex = maxIndex
      } else if (nextIndex <= 0) {
        cricketAutoDirectionRef.current = 1
        nextIndex = 0
      }
      cricketRailRef.current?.scrollTo({
        x: nextIndex * (cricketCardWidth + cricketCardGap),
        animated: true,
      })
      setActiveCricketIndex(nextIndex)
    }, 3000)
    return () => clearInterval(timer)
  }, [activeCricketIndex, cricketCardGap, cricketCardWidth, cricketMatches.length, isCricketInteracting])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.allSettled([loadUtilities(), retry?.(), refreshNotifications()])
    } finally {
      setRefreshing(false)
    }
  }, [loadUtilities, refreshNotifications, retry])

  const activeAnnouncements = useMemo(() => {
    const now = Date.now()
    return updates.filter((announcement) => {
      const startDate = announcement.startDate ? new Date(announcement.startDate).getTime() : null
      const endDate = announcement.endDate ? new Date(announcement.endDate).getTime() : null
      return (startDate === null || startDate <= now) && (endDate === null || endDate >= now)
    })
  }, [updates])

  const announcementItems = activeAnnouncements.slice(0, 6)

  useEffect(() => {
    announcementIndexRef.current = 0
    announcementRailRef.current?.scrollTo({ x: 0, animated: false })
    if (announcementItems.length <= 1) return
    const step = announcementCardWidth + announcementCardGap
    const timer = setInterval(() => {
      announcementIndexRef.current = (announcementIndexRef.current + 1) % announcementItems.length
      announcementRailRef.current?.scrollTo({ x: announcementIndexRef.current * step, animated: true })
    }, 3000)
    return () => clearInterval(timer)
  }, [announcementItems.length])

  useEffect(() => { if (ready) ensureAddresses(popularBusinesses.map((business) => ({ id: business.id, address: business.address, latitude: business.latitude, longitude: business.longitude }))) }, [popularBusinesses.length, ready, ensureAddresses])

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />

      <ScrollView
        style={styles.contentWrap}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D35B50']} tintColor="#D35B50" />}
      >
        <DirectoryState loading={loading} error={error} onRetry={retry} />
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <FocusTextInput
            style={styles.searchInput}
            placeholder={t('Search...', 'శోధించండి...')}
            placeholderTextColor="#5F6070"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => submitSearch(search)}
            underlineColorAndroid="transparent"
            selectionColor="#D35B50"
          />
          <Pressable
            style={[styles.voiceButton, recognizing && styles.voiceButtonActive]}
            onPress={handleVoiceSearch}
            accessibilityRole="button"
            accessibilityLabel={recognizing ? t('Stop voice search', 'వాయిస్ శోధనను ఆపండి') : t('Search by voice', 'వాయిస్‌తో శోధించండి')}
            accessibilityState={{ busy: recognizing }}
          >
            <Ionicons name={recognizing ? 'stop' : 'mic'} size={19} color={recognizing ? '#FFFFFF' : '#D35B50'} />
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>{weather?.locationName || t('Kandukur, Andhra Pradesh', 'కందుకూరు, ఆంధ్రప్రదేశ్')}</Text>
        </View>

                <View style={styles.utilityRow}>
          <Pressable style={styles.utilityCard} onPress={() => setSelectedUtility('weather')}>
            <RemoteImage source={{ uri: weatherModeImages[weatherMode] || weatherImageUrl }} style={styles.utilityImage} resizeMode="cover" />
            <View style={styles.utilityCopy}>
              <Text style={[styles.utilityLabel, styles.weatherLabel]}>{t('TODAY’S WEATHER', 'ఈరోజు వాతావరణం')}</Text>
              <Text style={styles.weatherTime}>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={[styles.utilityValue, styles.weatherValue]}>{weather?.temp || (utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Unavailable', 'అందుబాటులో లేదు'))}</Text>
              <Text style={styles.weatherStatus} numberOfLines={1}>{weather ? `${weatherIcon(weather.daily[0]?.code ?? 0)} ${weather.condition}` : t('Weather status unavailable', 'వాతావరణ సమాచారం అందుబాటులో లేదు')}</Text>
              <Text style={[styles.utilityText, rainWindow && styles.rainSummaryText]} numberOfLines={1}>{rainWindow ? `🌧 ${rainWindow.badgeText}` : (weather ? `${weather.locationName ? weather.locationName + ' · ' : ''}${weather.humidity}` : t('Live location', 'లైవ్ లొకేషన్'))}</Text>
            </View>
          </Pressable>
                                        <Pressable style={styles.utilityCard} onPress={() => setSelectedUtility('gold')}>
            <RemoteImage source={{ uri: goldImageUrl }} style={styles.utilityImage} resizeMode="cover" />
            <View style={styles.utilityCopy}>
              <Text style={[styles.utilityLabel, styles.goldLabel]}>{t('GOLD RATE TODAY', 'ఈరోజు బంగారం ధర')}</Text>
              <Text style={styles.goldRateValue}>{gold ? `₹${gold.pricePerSavaram22K.toLocaleString('en-IN')}` : utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Unavailable', 'అందుబాటులో లేదు')}</Text>
              <Text style={styles.utilityText}>{t('22K · 8g (Savaram)', '22K · 8 గ్రాములు (సవరం)')}</Text>
            </View>
          </Pressable>
        </View>














                {(cricketMatches.length > 0 || cricketError) && (
                  <View style={styles.cricketSection}>
                    {cricketMatches.length > 0 ? <View style={styles.sectionHeading}>
                      <View style={styles.cricketHeadingRow}>
                        <View style={styles.cricketIconWrap}>
                          <Ionicons name="trophy" size={14} color="#D97706" />
                        </View>
                        <Text style={styles.sectionTitle}>{t('Cricket Scores', 'క్రికెట్ స్కోర్లు')}</Text>
                        {cricketMatches.some((m) => m.isLive) && (
                          <View style={styles.cricketHeaderLiveBadge}>
                            <View style={styles.cricketLiveDot} />
                            <Text style={styles.cricketHeaderLiveText}>{t('LIVE', 'లైవ్')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.updateCount}>{cricketMatches.length} {t('matches', 'మ్యాచ్‌లు')}</Text>
                    </View> : null}
                    {cricketMatches.length === 0 ? (
                      <View style={styles.cricketCommentaryEmpty}>
                        <Ionicons name="information-circle-outline" size={18} color="#64748B" />
                        <Text style={styles.cricketCommentaryEmptyText}>{cricketError || t('No matches from yesterday, today, or upcoming fixtures are available.', 'నిన్నటి, ఈరోజు లేదా రాబోయే మ్యాచ్‌లు అందుబాటులో లేవు.')}</Text>
                      </View>
                    ) : null}
                    {cricketMatches.length > 0 && <>
                    <View style={styles.cricketRailWrap}>
                      {width >= 600 && (
                        <Pressable
                          style={[styles.cricketRailArrow, activeCricketIndex === 0 && styles.cricketRailArrowDisabled]}
                          disabled={activeCricketIndex === 0}
                          onPress={() => {
                            const nextIndex = Math.max(0, activeCricketIndex - 1)
                            cricketRailRef.current?.scrollTo({ x: nextIndex * (cricketCardWidth + cricketCardGap), animated: true })
                            setActiveCricketIndex(nextIndex)
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t('Previous matches', 'మునుపటి మ్యాచ్‌లు')}
                        >
                          <Ionicons name="chevron-back" size={16} color="#475569" />
                        </Pressable>
                      )}
                      <ScrollView
                        ref={cricketRailRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cricketRail}
                        decelerationRate="fast"
                        snapToInterval={cricketCardWidth + cricketCardGap}
                        snapToAlignment="start"
                        nestedScrollEnabled={true}
                        directionalLockEnabled={true}
                        onScrollBeginDrag={() => setIsCricketInteracting(true)}
                        onScrollEndDrag={() => setIsCricketInteracting(false)}
                        scrollEventThrottle={16}
                        onScroll={(event) => {
                          const step = cricketCardWidth + cricketCardGap
                          const offset = Math.max(0, event.nativeEvent.contentOffset.x)
                          const maxIdx = Math.max(0, cricketMatches.length - 2)
                          const newIdx = Math.max(0, Math.min(maxIdx, Math.round(offset / step)))
                          setActiveCricketIndex((current) => current === newIdx ? current : newIdx)
                        }}
                        onMomentumScrollEnd={(event) => {
                          const step = cricketCardWidth + cricketCardGap
                          const offset = event.nativeEvent.contentOffset.x
                          const maxIdx = Math.max(0, cricketMatches.length - 2)
                          const newIdx = Math.max(0, Math.min(maxIdx, Math.round(offset / step)))
                          setActiveCricketIndex(newIdx)
                        }}
                      >
                      {cricketMatches.map((match) => {
                        const matchTime = formatCompactCricketDateTime(match.dateTime || match.startTime) || match.startTime || match.dateTime
                        const formatType = normalizeFormatName(match.matchType)
                        const formatStyle = getFormatBadgeStyle(formatType)
                        const showFormat = Boolean(formatType)

                        const cleanSeries = normalizeFormatName(match.series)
                        const showSeries = Boolean(cleanSeries && cleanSeries.toLowerCase() !== formatType.toLowerCase())
                        const seriesStyle = getFormatBadgeStyle(cleanSeries)
                        const isUpcoming = match.state === 'upcoming'
                        const statusText = formatMatchStatus(match.status, match.isLive, isUpcoming)

                        return (
                          <Pressable
                            key={match.id}
                            style={[
                              styles.cricketCard,
                              { width: cricketCardWidth },
                              match.isLive && styles.cricketCardLive,
                              isUpcoming && styles.cricketCardUpcoming,
                            ]}
                            onPress={() => {
                              setSelectedCricketMatch(match)
                              setActiveCricketTab(match.isLive ? 'live' : 'info')
                              fetchCricketMatchDetails(match.id).then((details) => {
                                setSelectedCricketMatch((current) => current?.id === match.id ? { ...current, ...details } : current)
                              }).catch(() => {
                                // The list response remains usable when detail data is unavailable.
                              })
                            }}
                          >
                            {match.isLive ? (
                              <View style={styles.cricketCardTopLiveBar} />
                            ) : isUpcoming ? (
                              <View style={styles.cricketCardTopUpcomingBar} />
                            ) : (
                              <View style={styles.cricketCardTopDefaultBar} />
                            )}

                            <View style={styles.cricketCardHeader}>
                              <View style={styles.cricketHeaderTagsGroup}>
                                {showFormat ? (
                                  <View style={[styles.cricketFormatBadge, { backgroundColor: formatStyle.bg, borderColor: formatStyle.border }]}>
                                    <Text style={[styles.cricketFormatText, { color: formatStyle.text }]}>{formatType}</Text>
                                  </View>
                                ) : null}
                                {showSeries ? (
                                  <View style={[styles.cricketSeriesBadge, { backgroundColor: seriesStyle.bg, borderColor: seriesStyle.border }]}>
                                    <Ionicons name="trophy" size={10} color={seriesStyle.text} style={styles.cricketSeriesIcon} />
                                    <Text style={[styles.cricketSeriesText, { color: seriesStyle.text }]} numberOfLines={1}>{cleanSeries}</Text>
                                  </View>
                                ) : null}
                              </View>
                              {match.isLive ? (
                                <View style={styles.cricketLiveBadge}>
                                  <View style={styles.cricketLiveDot} />
                                  <Text style={styles.cricketLiveText}>{t('LIVE', 'లైవ్')}</Text>
                                </View>
                              ) : isUpcoming ? (
                                <View style={styles.cricketUpcomingBadge}>
                                  <Ionicons name="calendar-outline" size={10} color="#0284C7" style={styles.cricketUpcomingIcon} />
                                  <Text style={styles.cricketUpcomingText}>{t('Upcoming', 'రాబోయేది')}</Text>
                                </View>
                              ) : match.state === 'completed' ? (
                                <View style={styles.cricketEndedBadge}>
                                  <Text style={styles.cricketEndedText}>{match.dayLabel === 'yesterday' ? t('Yesterday · Completed', 'నిన్న · ముగిసింది') : t('Completed', 'ముగిసింది')}</Text>
                                </View>
                              ) : null}
                            </View>

                            {matchTime ? (
                              <View style={[
                                styles.cricketTimeHighlightPill,
                                match.isLive && styles.cricketTimeHighlightPillLive,
                                isUpcoming && styles.cricketTimeHighlightPillUpcoming,
                              ]}>
                                <Ionicons
                                  name="time"
                                  size={12}
                                  color={match.isLive ? '#DC2626' : isUpcoming ? '#0284C7' : '#64748B'}
                                />
                                <Text style={[
                                  styles.cricketTimeHighlightText,
                                  match.isLive && styles.cricketTimeHighlightTextLive,
                                  isUpcoming && styles.cricketTimeHighlightTextUpcoming,
                                ]} numberOfLines={1}>
                                  {matchTime}
                                </Text>
                              </View>
                            ) : null}

                            <Text style={styles.cricketMatchTitle} numberOfLines={1}>{match.title}</Text>

                            <View style={styles.cricketTeamsContainer}>
                              <View style={styles.cricketTeamRow}>
                                <View style={styles.cricketTeamNameRow}>
                                  <View style={[styles.cricketTeamAvatar, { backgroundColor: match.team1.color || '#1E40AF' }]}>
                                    <Text style={styles.cricketTeamAvatarText}>{(match.team1.shortName || match.team1.name).slice(0, 3).toUpperCase()}</Text>
                                  </View>
                                  <Text style={styles.cricketTeamName} numberOfLines={1}>
                                    {match.team1.shortName || match.team1.name}
                                  </Text>
                                </View>
                                <View style={styles.cricketScoreWrap}>
                                  <Text style={[styles.cricketScore, formatTeamScore(match.team1.score) === '—' && styles.cricketScoreEmpty]}>
                                    {formatTeamScore(match.team1.score)}
                                  </Text>
                                  {match.team1.overs ? (
                                    <Text style={styles.cricketOvers}>({match.team1.overs})</Text>
                                  ) : null}
                                </View>
                              </View>

                              <View style={styles.cricketTeamRow}>
                                <View style={styles.cricketTeamNameRow}>
                                  <View style={[styles.cricketTeamAvatar, { backgroundColor: match.team2.color || '#B91C1C' }]}>
                                    <Text style={styles.cricketTeamAvatarText}>{(match.team2.shortName || match.team2.name).slice(0, 3).toUpperCase()}</Text>
                                  </View>
                                  <Text style={styles.cricketTeamName} numberOfLines={1}>
                                    {match.team2.shortName || match.team2.name}
                                  </Text>
                                </View>
                                <View style={styles.cricketScoreWrap}>
                                  <Text style={[styles.cricketScore, formatTeamScore(match.team2.score) === '—' && styles.cricketScoreEmpty]}>
                                    {formatTeamScore(match.team2.score)}
                                  </Text>
                                  {match.team2.overs ? (
                                    <Text style={styles.cricketOvers}>({match.team2.overs})</Text>
                                  ) : null}
                                </View>
                              </View>
                            </View>

                            {statusText ? (
                              <View style={[
                                styles.cricketStatusRow,
                                match.isLive && styles.cricketStatusRowLive,
                                isUpcoming && styles.cricketStatusRowUpcoming,
                              ]}>
                                <Text style={[
                                  styles.cricketStatusText,
                                  match.isLive && styles.cricketStatusLiveText,
                                  isUpcoming && styles.cricketStatusUpcomingText,
                                ]} numberOfLines={1}>
                                  {statusText}
                                </Text>
                                <Ionicons name="chevron-forward" size={13} color={match.isLive ? '#DC2626' : isUpcoming ? '#0284C7' : '#9CA3AF'} />
                              </View>
                            ) : null}
                          </Pressable>
                        )
                      })}
                      </ScrollView>
                      {width >= 600 && (
                        <Pressable
                          style={[styles.cricketRailArrow, activeCricketIndex >= Math.max(0, cricketMatches.length - 2) && styles.cricketRailArrowDisabled]}
                          disabled={activeCricketIndex >= Math.max(0, cricketMatches.length - 2)}
                          onPress={() => {
                            const maxIndex = Math.max(0, cricketMatches.length - 2)
                            const nextIndex = Math.min(maxIndex, activeCricketIndex + 1)
                            cricketRailRef.current?.scrollTo({ x: nextIndex * (cricketCardWidth + cricketCardGap), animated: true })
                            setActiveCricketIndex(nextIndex)
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t('Next matches', 'తదుపరి మ్యాచ్‌లు')}
                        >
                          <Ionicons name="chevron-forward" size={16} color="#475569" />
                        </Pressable>
                      )}
                    </View>

                    {cricketMatches.length > 1 && (
                      <View style={styles.cricketRailFooter}>
                        <Text style={styles.cricketSwipeHint}>{t('Swipe to see more matches', 'మరిన్ని మ్యాచ్‌ల కోసం స్వైప్ చేయండి')}</Text>
                        <View style={styles.cricketPaginationDots}>
                        {cricketMatches.map((m, idx) => (
                          <Pressable
                            key={m.id}
                            onPress={() => {
                              const step = cricketCardWidth + cricketCardGap
                              cricketRailRef.current?.scrollTo({ x: idx * step, animated: true })
                              setActiveCricketIndex(idx)
                            }}
                            style={[
                              styles.cricketPaginationDot,
                              idx === activeCricketIndex && styles.cricketPaginationDotActive,
                              idx === activeCricketIndex && m.isLive && styles.cricketPaginationDotLive,
                            ]}
                          />
                        ))}
                        </View>
                      </View>
                    )}
                    </>}
                  </View>
                )}

























































































        {activeAnnouncements.length > 0 && (
          <>
            <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('Latest in Kandukur', 'కందుకూరులో తాజా సమాచారం')}</Text><Text style={styles.updateCount}>{activeAnnouncements.length} {t('updates', 'అప్‌డేట్లు')}</Text></View>
            <ScrollView
              ref={announcementRailRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.updateRail}
              onMomentumScrollEnd={(event) => {
                const step = announcementCardWidth + announcementCardGap
                const offset = event.nativeEvent.contentOffset.x
                announcementIndexRef.current = Math.max(0, Math.round(offset / step))
              }}
            >
              {announcementItems.map((update) => (
                <Pressable
                  key={update.id}
                  style={[styles.updateRailCard, { width: announcementCardWidth }, selectedUpdateCardId === String(update.id) && styles.cardImageSelected]}
                  onPress={() => { setSelectedUpdateCardId(String(update.id)); setSelectedUpdate(update) }}
                >
                  <RemoteImage source={{ uri: update.image }} style={styles.updateImage} resizeMode="cover" />
                  <View style={styles.updateShade} />
                  <View style={styles.updateCopy}><Text style={styles.updateTitle}>{update.title}</Text><Text style={styles.updateDetail}>{update.detail}</Text><Text style={styles.updateLocation}>{t('Kandukur, Andhra Pradesh', 'కందుకూరు, ఆంధ్రప్రదేశ్')}</Text></View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('Explore Categories', 'వర్గాలను అన్వేషించండి')}</Text><Pressable style={styles.viewAllButton} onPress={() => navigation.navigate('Categories')}><Text style={styles.viewAll}>{t('View all', 'అన్నీ చూడండి')}</Text></Pressable></View>

        <View style={styles.categoryGrid}>
          {cards.slice(0, 6).map((category) => (
            <Pressable
              key={category.id}
              style={[styles.categoryCard, { width: categoryCardWidth }, selectedCategoryId === category.id && styles.cardImageSelected]}
              onPress={() => { setSelectedCategoryId(category.id); navigation.navigate('Businesses', { categoryId: category.id }) }}
            >
              <HomeCategoryImage name={category.name} />
              <View style={styles.categoryShade} />
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryName} numberOfLines={2}>{categoryLabel(category.name)}</Text>
                <Text style={styles.categoryCount}>{categoryListingCount(category.id)} {t('Listings', 'లిస్టింగ్‌లు')}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('Popular Near You', 'మీకు సమీపంలోని ప్రసిద్ధ ప్రదేశాలు')}</Text><Pressable style={styles.viewAllButton} onPress={() => navigation.navigate('Categories')}><Text style={styles.viewAll}>{t('View all', 'అన్నీ చూడండి')}</Text></Pressable></View>
        <View style={styles.popularList}>
          {popularNearYou.map((business) => {
            const isFavorite = favorites.includes(business.id)
            const reviewStats = getReviewStats(business.id)
            const imageSource = getBusinessImage(business.image, business.categoryName)
            return (
              <Pressable key={business.id} style={styles.businessCard} onPress={() => openBusiness(business.id)}>
                <Pressable style={[styles.businessImageWrap, selectedBusinessId === business.id && styles.cardImageSelected]} onPress={() => openBusiness(business.id)}>
                  <RemoteImage source={imageSource} style={styles.businessImage} resizeMode="cover" />
                  <View style={styles.openBadge}><Text style={styles.openText}>{t('Open', 'తెరిచి ఉంది')}</Text></View>
                  <Pressable
                    style={styles.favoriteBadge}
                    onPress={(event) => {
                      event.stopPropagation()
                      if (isLoggedIn) toggleFavorite(business.id)
                      else navigation.navigate('Profile')
                    }}
                  >
                    <Text style={[styles.favoriteText, isFavorite && styles.favoriteActive]}>{isFavorite ? '♥' : '♡'}</Text>
                  </Pressable>
                </Pressable>
                <View style={styles.businessContent}>
                  <Text style={styles.businessName}>{businessName(business.name, business.nameTe)}</Text>
                  <View style={styles.businessMeta}><Text style={styles.businessCategory}>{categoryLabel(business.categoryName)}</Text><Text style={styles.trending}>{t('Trending', 'ట్రెండింగ్')}</Text></View>
                  <Text style={styles.rating}>⭐ {reviewStats.rating.toFixed(1)} <Text style={styles.reviewCount}>({reviewStats.count} {t('reviews', 'సమీక్షలు')})</Text></Text>
                  <Text style={styles.businessAddress}>📍 {business.address}</Text><Text style={styles.businessDistance}>{(distances[business.id] ?? distances[business.address]) !== undefined ? `${((distances[business.id] ?? distances[business.address]) as number).toFixed(1)} ${t('km away', 'కి.మీ దూరంలో')}` : t('Finding distance…', 'దూరాన్ని కనుగొంటున్నాము…')}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
      <Modal visible={selectedUtility !== null} transparent animationType="fade" onRequestClose={() => setSelectedUtility(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.utilityModal}>
                        <View style={styles.utilityModalHero}>
              <RemoteImage source={{ uri: selectedUtility === 'weather' ? (weatherModeImages[weatherMode] || weatherImageUrl) : goldImageUrl }} style={styles.utilityModalHeroImage} resizeMode="cover" />
              <View style={styles.utilityModalHeroShade} />
              <Pressable style={styles.utilityModalClose} onPress={() => setSelectedUtility(null)}><Text style={styles.utilityModalCloseText}>×</Text></Pressable>
                            <View style={styles.utilityModalHeroCopy}>
                <Text style={styles.utilityModalKicker}>{selectedUtility === 'weather' ? t('Today’s weather', 'ఈరోజు వాతావరణం') : t('Gold rate today', 'ఈరోజు బంగారం ధర')}</Text>
                <Text style={styles.utilityModalHeroValue}>{selectedUtility === 'weather' ? (weather?.temp || t('Unavailable', 'అందుబాటులో లేదు')) : (gold ? `₹${gold.pricePerSavaram22K.toLocaleString('en-IN')}` : t('Unavailable', 'అందుబాటులో లేదు'))}</Text>
                <Text style={styles.utilityModalHeroDetail}>{selectedUtility === 'weather' ? (weather ? `${weather.condition}${rainWindow ? ` · 🌧 ${rainWindow.timeRange}` : ` · ${weather.humidity}`}` : t('Live location', 'లైవ్ లొకేషన్')) : t('22K · 8g (Savaram)', '22K · 8 గ్రాములు (సవరం)')}</Text>
              </View>
            </View>
            {selectedUtility === 'weather' ? (
              weather ? <ScrollView style={styles.weatherDetails} showsVerticalScrollIndicator={false}>
                {rainWindow && (
                  <View style={styles.rainAlertCard}>
                    <Text style={styles.rainAlertIcon}>🌧</Text>
                    <View style={styles.rainAlertContent}>
                      <Text style={styles.rainAlertTitle}>{t('Rain Advisory', 'వర్షం సూచన')}</Text>
                      <Text style={styles.rainAlertMessage}>{rainWindow.modalText}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.weatherSummary}><Text style={styles.weatherSummaryIcon}>{weatherIcon(weather.daily[0]?.code ?? 0)}</Text><Text style={styles.weatherSummaryText}>{weather.wind}</Text><Text style={styles.weatherSummaryText}>{weather.humidity}</Text></View>
                <Text style={styles.forecastHeading}>{t('Hourly forecast', 'గంటల వారీ అంచనా')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyRail}>{weather.hourly.map((hour) => {
                  const rainForHour = rainCodes.has(hour.code) || isHourInRainWindow(hour.time, rainWindow)
                  return (
                    <View key={hour.time} style={[styles.hourlyItem, rainForHour && styles.hourlyItemRain]}>
                      {rainForHour && <View style={styles.hourlyRainMarker} />}
                      <Text style={[styles.forecastTime, rainForHour && styles.forecastTimeRain]}>{formatRainHour(hour.time)}</Text>
                      {rainForHour ? (
                        <View style={styles.hourlyRainIconBadge}>
                          <Ionicons name="rainy" size={20} color="#E0F7FF" />
                        </View>
                      ) : (
                        <Text style={styles.forecastIcon}>{weatherIcon(hour.code)}</Text>
                      )}
                      <Text style={[styles.forecastTemp, rainForHour && styles.forecastTempRain]}>{hour.temp}°</Text>
                    </View>
                  )
                })}</ScrollView>
                <Text style={styles.forecastHeading}>{t('7-day forecast', '7 రోజుల అంచనా')}</Text>
                <View style={styles.dailyList}>{weather.daily.map((day) => <View key={day.date} style={styles.dailyItem}><Text style={styles.dailyDay}>{new Date(day.date).toLocaleDateString([], { weekday: 'short' })}</Text><Text style={styles.forecastIcon}>{weatherIcon(day.code)}</Text><Text style={styles.dailyTemp}>{day.max}° <Text style={styles.dailyMin}>{day.min}°</Text></Text></View>)}</View>
                <Text style={styles.utilityModalFoot}>{(weather.locationName ? `${weather.locationName} · ` : '') + t('Updated', 'నవీకరించబడింది')} {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </ScrollView> : <Text style={styles.utilityModalEmpty}>{utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Weather unavailable right now.', 'ప్రస్తుతం వాతావరణ సమాచారం అందుబాటులో లేదు.')}</Text>
            ) : (
                                                        gold ? <View style={styles.goldModalBody}>
        <View style={styles.goldModalRate}><Text style={styles.goldModalLabel}>{t('24K · 8g (Savaram)', '24K · 8 గ్రాములు (సవరం)')}</Text><Text style={styles.goldModalValue}>₹{(gold.pricePerSavaram || (gold.pricePerGram24K ? gold.pricePerGram24K * 8 : 0)).toLocaleString('en-IN')}</Text></View>
        <View style={styles.goldModalRate}><Text style={styles.goldModalLabel}>{t('22K · 8g (Savaram)', '22K · 8 గ్రాములు (సవరం)')}</Text><Text style={styles.goldModalValue}>₹{(gold.pricePerSavaram22K || (gold.pricePerGram22K ? gold.pricePerGram22K * 8 : 0)).toLocaleString('en-IN')}</Text></View>
        <View style={styles.goldModalRate}><Text style={styles.goldModalLabel}>{t('18K · 8g (Savaram)', '18K · 8 గ్రాములు (సవరం)')}</Text><Text style={styles.goldModalValue}>₹{(gold.pricePerSavaram18K || (gold.pricePerGram18K ? gold.pricePerGram18K * 8 : 0)).toLocaleString('en-IN')}</Text></View>
        <Text style={styles.utilityModalFoot}>{t('Daily market rate · Updated', 'రోజువారీ మార్కెట్ రేటు · నవీకరించబడింది')} {gold.updatedAt ? new Date(gold.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('today', 'ఈరోజు')}</Text>
      </View> : <Text style={styles.utilityModalEmpty}>{utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Gold rate unavailable right now.', 'ప్రస్తుతం బంగారం ధర అందుబాటులో లేదు.')}</Text>
            )}
          </View>
        </View>
      </Modal>
            <Modal visible={selectedUpdate !== null} transparent animationType="fade" onRequestClose={() => setSelectedUpdate(null)}>
        <View style={styles.modalBackdrop}>
          {selectedUpdate && (
            <View style={styles.announcementModal}>
              <RemoteImage source={{ uri: selectedUpdate.image }} style={styles.announcementModalImage} resizeMode="cover" />
              <View style={styles.announcementModalBody}>
                <View style={styles.announcementModalTop}>
                  <Text style={styles.announcementType}>{selectedUpdate.type}</Text>
                  <Pressable style={styles.modalClose} onPress={() => setSelectedUpdate(null)}><Text style={styles.modalCloseText}>×</Text></Pressable>
                </View>
                <Text style={styles.announcementModalTitle}>{selectedUpdate.title}</Text>
                <Text style={styles.announcementModalDetail}>{selectedUpdate.detail}</Text>
                <Text style={styles.announcementModalDescription}>{selectedUpdate.description}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
            <Modal visible={selectedCricketMatch !== null} transparent animationType="fade" onRequestClose={() => setSelectedCricketMatch(null)}>
        <View style={styles.modalBackdrop}>
          {selectedCricketMatch ? (
            <View style={styles.cricketModal}>
              <View style={styles.cricketModalHero}>
                <View style={styles.cricketModalHeroHeader}>
                  <View style={styles.cricketModalBadgeRow}>
                    {(() => {
                      const modalFormatType = normalizeFormatName(selectedCricketMatch.matchType)
                      const modalSeries = normalizeFormatName(selectedCricketMatch.series)
                      const showModalSeries = Boolean(modalSeries && modalSeries.toLowerCase() !== modalFormatType.toLowerCase())
                      const modalFormatStyle = getFormatBadgeStyle(modalFormatType)

                      return (
                        <>
                          {modalFormatType ? (
                            <View style={[styles.cricketFormatBadge, { backgroundColor: modalFormatStyle.bg, borderColor: modalFormatStyle.border }]}>
                              <Text style={[styles.cricketFormatText, { color: modalFormatStyle.text }]}>{modalFormatType}</Text>
                            </View>
                          ) : null}
                          {showModalSeries ? (
                            <View style={styles.cricketModalSeriesPill}>
                              <Text style={styles.cricketModalSeriesText}>{modalSeries}</Text>
                            </View>
                          ) : null}
                        </>
                      )
                    })()}
                    {selectedCricketMatch.isLive ? (
                      <View style={styles.cricketLiveBadge}>
                        <View style={styles.cricketLiveDot} />
                        <Text style={styles.cricketLiveText}>{t('LIVE', 'లైవ్')}</Text>
                      </View>
                    ) : selectedCricketMatch.state === 'upcoming' ? (
                      <View style={styles.cricketEndedPill}>
                        <Text style={styles.cricketEndedPillText}>{t('Upcoming', 'రాబోయేది')}</Text>
                      </View>
                    ) : (
                      <View style={styles.cricketEndedPill}>
                        <Text style={styles.cricketEndedPillText}>{selectedCricketMatch.dayLabel === 'yesterday' ? t('Yesterday · Completed', 'నిన్న · ముగిసింది') : t('Completed', 'ముగిసింది')}</Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('Close match details', 'మ్యాచ్ వివరాలను మూసివేయండి')}
                    hitSlop={8}
                    style={styles.cricketModalClose}
                    onPress={() => setSelectedCricketMatch(null)}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>

                <Text style={styles.cricketModalHeroTitle}>{selectedCricketMatch.title}</Text>
                {selectedCricketMatch.venue ? (
                  <View style={styles.cricketModalHeroVenueRow}>
                    <Ionicons name="location-sharp" size={13} color="#94A3B8" />
                    <Text style={styles.cricketModalHeroVenueText}>{selectedCricketMatch.venue}</Text>
                  </View>
                ) : null}
                <View style={styles.cricketModalMetaRow}>
                  {selectedCricketMatch.matchNumber ? <Text style={styles.cricketModalMetaText}>{selectedCricketMatch.matchNumber}</Text> : null}
                  {selectedCricketMatch.group ? <Text style={styles.cricketModalMetaText}>{selectedCricketMatch.group}</Text> : null}
                  {(selectedCricketMatch.dateTime || selectedCricketMatch.startTime) ? (
                    <View style={styles.cricketModalTimeHighlight}>
                      <Ionicons name="time" size={12} color="#38BDF8" />
                      <Text style={styles.cricketModalTimeHighlightText}>{formatCricketDateTime(selectedCricketMatch.dateTime || selectedCricketMatch.startTime) || selectedCricketMatch.startTime}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <ScrollView style={styles.cricketModalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.cricketModalScoreCard}>
                  <View style={styles.cricketModalTeamRow}>
                    <View style={styles.cricketModalTeamInfo}>
                      <View style={[styles.cricketTeamAvatarBig, { backgroundColor: selectedCricketMatch.team1.color || '#1E40AF' }]}>
                        <Text style={styles.cricketTeamAvatarBigText}>{(selectedCricketMatch.team1.shortName || selectedCricketMatch.team1.name).slice(0, 3).toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={styles.cricketModalTeamName}>{selectedCricketMatch.team1.name}</Text>
                        <Text style={styles.cricketModalTeamShort}>{selectedCricketMatch.team1.shortName}</Text>
                      </View>
                    </View>
                    <View style={styles.cricketModalScoreWrap}>
                      <Text style={[styles.cricketModalScore, formatTeamScore(selectedCricketMatch.team1.score) === '—' && styles.cricketScoreEmpty]}>{formatTeamScore(selectedCricketMatch.team1.score)}</Text>
                      {selectedCricketMatch.team1.overs ? (
                        <Text style={styles.cricketModalOvers}>({selectedCricketMatch.team1.overs})</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cricketModalDivider} />

                  <View style={styles.cricketModalTeamRow}>
                    <View style={styles.cricketModalTeamInfo}>
                      <View style={[styles.cricketTeamAvatarBig, { backgroundColor: selectedCricketMatch.team2.color || '#B91C1C' }]}>
                        <Text style={styles.cricketTeamAvatarBigText}>{(selectedCricketMatch.team2.shortName || selectedCricketMatch.team2.name).slice(0, 3).toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={styles.cricketModalTeamName}>{selectedCricketMatch.team2.name}</Text>
                        <Text style={styles.cricketModalTeamShort}>{selectedCricketMatch.team2.shortName}</Text>
                      </View>
                    </View>
                    <View style={styles.cricketModalScoreWrap}>
                      <Text style={[styles.cricketModalScore, formatTeamScore(selectedCricketMatch.team2.score) === '—' && styles.cricketScoreEmpty]}>{formatTeamScore(selectedCricketMatch.team2.score)}</Text>
                      {selectedCricketMatch.team2.overs ? (
                        <Text style={styles.cricketModalOvers}>({selectedCricketMatch.team2.overs})</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {Boolean(formatMatchStatus(selectedCricketMatch.status, selectedCricketMatch.isLive, selectedCricketMatch.state === 'upcoming')) && (
                  <View style={[styles.cricketModalStatusBanner, selectedCricketMatch.isLive ? styles.cricketModalStatusBannerLive : styles.cricketModalStatusBannerDone]}>
                    <Ionicons name={selectedCricketMatch.isLive ? 'flash' : 'checkmark-circle'} size={15} color={selectedCricketMatch.isLive ? '#DC2626' : '#059669'} />
                    <Text style={[styles.cricketModalStatusText, selectedCricketMatch.isLive ? styles.cricketModalStatusTextLive : styles.cricketModalStatusTextDone]}>
                      {formatMatchStatus(selectedCricketMatch.status, selectedCricketMatch.isLive, selectedCricketMatch.state === 'upcoming')}
                    </Text>
                  </View>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cricketTabs}>
                  {[
                    ['info', 'Info'], ['live', 'Live'], ['scorecard', 'Scorecard'], ['squads', 'Squads'], ['full-commentary', 'Full Commentary'],
                  ].map(([tab, label], index) => (
                    <Pressable key={`${label}-${index}`} style={[styles.cricketTab, activeCricketTab === tab && styles.cricketTabActive]} onPress={() => setActiveCricketTab(tab)}>
                      <Text style={[styles.cricketTabText, activeCricketTab === tab && styles.cricketTabTextActive]}>{label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {activeCricketTab === 'scorecard' && selectedCricketMatch.innings?.length ? (
                  <View style={styles.cricketInningsCard}>
                    <Text style={styles.cricketInningsHeading}>{t('Scorecard', 'స్కోర్‌కార్డ్')}</Text>
                    {selectedCricketMatch.innings.map((inning, index) => (
                      <View key={`${inning.team}-${index}`} style={styles.cricketInningsRow}>
                        <View style={styles.cricketInningsTeam}>
                          <Text style={styles.cricketInningsTeamName} numberOfLines={1}>{inning.team}</Text>
                          <Text style={styles.cricketInningsMeta}>{inning.overs !== '—' ? `${inning.overs} ov` : t('Overs unavailable', 'ఓవర్లు అందుబాటులో లేవు')}</Text>
                        </View>
                        <View style={styles.cricketInningsScore}>
                          <Text style={styles.cricketInningsRuns}>{inning.score}</Text>
                          {inning.runRate ? <Text style={styles.cricketInningsMeta}>RR {inning.runRate}</Text> : null}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {activeCricketTab === 'scorecard' && !selectedCricketMatch.innings?.length ? (
                  <View style={styles.cricketCommentaryEmpty}><Ionicons name="stats-chart-outline" size={18} color="#64748B" /><Text style={styles.cricketCommentaryEmptyText}>{t('Detailed scorecard data is not available in this feed.', 'ఈ ఫీడ్‌లో వివరమైన స్కోర్‌కార్డ్ అందుబాటులో లేదు.')}</Text></View>
                ) : null}

                {activeCricketTab === 'info' ? (
                  <View style={styles.cricketInfoCard}>
                    <Text style={styles.cricketInPlayHeading}>{t('Match information', 'మ్యాచ్ సమాచారం')}</Text>
                    {selectedCricketMatch.series ? <Text style={styles.cricketInfoLine}><Text style={styles.cricketInfoLabel}>{t('Series', 'సిరీస్')}</Text>{selectedCricketMatch.series}</Text> : null}
                    {selectedCricketMatch.venue ? <Text style={styles.cricketInfoLine}><Text style={styles.cricketInfoLabel}>{t('Venue', 'వేదిక')}</Text>{selectedCricketMatch.venue}</Text> : null}
                    {selectedCricketMatch.dateTime || selectedCricketMatch.startTime ? <Text style={styles.cricketInfoLine}><Text style={styles.cricketInfoLabel}>{t('Date and time', 'తేదీ మరియు సమయం')}</Text>{formatCricketDateTime(selectedCricketMatch.dateTime || selectedCricketMatch.startTime)}</Text> : null}
                    {selectedCricketMatch.playerOfMatch ? <View style={styles.cricketPlayerCard}><Ionicons name="trophy-outline" size={18} color="#D97706" /><View><Text style={styles.cricketInPlayRole}>{t('Player of the Match', 'మ్యాచ్ ప్లేయర్')}</Text><Text style={styles.cricketInPlayName}>{selectedCricketMatch.playerOfMatch}</Text></View></View> : null}
                  </View>
                ) : null}

                {(activeCricketTab === 'live' || activeCricketTab === 'full-commentary') && !selectedCricketMatch.isLive ? (
                  <View style={styles.cricketCommentaryEmpty}><Ionicons name="time-outline" size={18} color="#64748B" /><Text style={styles.cricketCommentaryEmptyText}>{t('This match is not live. Commentary will appear here when the feed provides it.', 'ఈ మ్యాచ్ లైవ్‌లో లేదు. ఫీడ్‌లో అందుబాటులో ఉన్నప్పుడు కామెంటరీ ఇక్కడ కనిపిస్తుంది.')}</Text></View>
                ) : null}

                {selectedCricketMatch.isLive && selectedCricketMatch.cricbuzzUrl ? (
                  <Pressable
                    accessibilityRole="link"
                    style={styles.cricketLiveFeedButton}
                    onPress={() => Linking.openURL(selectedCricketMatch.cricbuzzUrl as string)}
                  >
                    <Ionicons name="radio-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.cricketLiveFeedButtonText}>{t('Open live commentary', 'లైవ్ కామెంటరీ తెరవండి')}</Text>
                    <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                  </Pressable>
                ) : null}

                {activeCricketTab === 'live' && (selectedCricketMatch.currentBatter || selectedCricketMatch.currentBowler) && (
                  <View style={styles.cricketInPlayContainer}>
                    <Text style={styles.cricketInPlayHeading}>{t('Live In-Play', 'లైవ్ ఆట')}</Text>
                    {selectedCricketMatch.currentBatter ? (
                      <View style={styles.cricketInPlayCard}>
                        <View style={styles.cricketInPlayIconBat}>
                          <Ionicons name="flash" size={14} color="#D97706" />
                        </View>
                        <View style={styles.cricketInPlayContent}>
                          <Text style={styles.cricketInPlayRole}>{t('Batting', 'బ్యాటింగ్')}</Text>
                          <Text style={styles.cricketInPlayName}>{selectedCricketMatch.currentBatter}</Text>
                        </View>
                      </View>
                    ) : null}

                    {selectedCricketMatch.currentBowler ? (
                      <View style={styles.cricketInPlayCard}>
                        <View style={styles.cricketInPlayIconBowl}>
                          <Ionicons name="baseball" size={14} color="#2563EB" />
                        </View>
                        <View style={styles.cricketInPlayContent}>
                          <Text style={styles.cricketInPlayRole}>{t('Bowling', 'బౌలింగ్')}</Text>
                          <Text style={styles.cricketInPlayName}>{selectedCricketMatch.currentBowler}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                )}

                {(activeCricketTab === 'live' || activeCricketTab === 'full-commentary') && selectedCricketMatch.isLive && (selectedCricketMatch.recentBalls?.length || selectedCricketMatch.commentary?.length) ? (
                  <View style={styles.cricketCommentarySection}>
                    <View style={styles.cricketCommentaryHeadingRow}>
                      <Text style={styles.cricketInPlayHeading}>{t('Live commentary', 'లైవ్ కామెంటరీ')}</Text>
                      <View style={styles.cricketCommentaryLivePill}>
                        <View style={styles.cricketLiveDot} />
                        <Text style={styles.cricketCommentaryLiveText}>{t('LIVE', 'లైవ్')}</Text>
                      </View>
                    </View>
                    {selectedCricketMatch.recentBalls?.length ? (
                      <View style={styles.cricketRecentBalls}>
                        {selectedCricketMatch.recentBalls.slice(-6).map((ball, index) => (
                          <View key={`${ball}-${index}`} style={[styles.cricketBall, ball === 'W' && styles.cricketBallWicket, (ball === '4' || ball === '6') && styles.cricketBallBoundary]}>
                            <Text style={styles.cricketBallText}>{ball}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {selectedCricketMatch.commentary?.slice(0, 6).map((item, index) => (
                      <View key={`${item.over}-${index}`} style={styles.cricketCommentaryItem}>
                        <Text style={[styles.cricketCommentaryOver, item.isWicket && styles.cricketCommentaryWicket]}>{item.over}</Text>
                        <Text style={styles.cricketCommentaryText}>{item.comm}</Text>
                      </View>
                    ))}
                  </View>
                ) : (activeCricketTab === 'live' || activeCricketTab === 'full-commentary') && selectedCricketMatch.isLive ? (
                  <View style={styles.cricketCommentaryEmpty}>
                    <Ionicons name="radio-outline" size={18} color="#64748B" />
                    <Text style={styles.cricketCommentaryEmptyText}>{t('Live ball-by-ball commentary is not available in this feed yet.', 'ఈ ఫీడ్‌లో బాల్-బై-బాల్ లైవ్ కామెంటరీ ఇంకా అందుబాటులో లేదు.')}</Text>
                  </View>
                ) : null}

                {!['live', 'info', 'scorecard', 'full-commentary'].includes(activeCricketTab) ? (
                  <View style={styles.cricketCommentaryEmpty}><Ionicons name="information-circle-outline" size={18} color="#64748B" /><Text style={styles.cricketCommentaryEmptyText}>{t('This tab is not available in the current cricket feed.', 'ప్రస్తుత క్రికెట్ ఫీడ్‌లో ఈ ట్యాబ్ అందుబాటులో లేదు.')}</Text></View>
                ) : null}

                {selectedCricketMatch.summary ? (
                  <View style={styles.cricketModalSummaryBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#475569" style={{ marginTop: 1 }} />
                    <Text style={styles.cricketModalSummaryText}>{selectedCricketMatch.summary}</Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>
      <BottomNav navigation={navigation} active="Home" />
      <Modal visible={appUpdate !== null && appUpdate?.version !== dismissedUpdateVersion} transparent animationType="fade" onRequestClose={() => setAppUpdate(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.updateModal}>
            <View style={styles.updateModalHeader}>
              <Text style={styles.updateModalTitle}>🎉 {t('New Update Available', 'క్రొత్త అప్‌డేట్ అందుబాటులో ఉంది')}</Text>
              <Pressable onPress={async () => {
                if (appUpdate?.version) {
                  await AsyncStorage.setItem(DISMISSED_VERSION_KEY, appUpdate.version)
                  setDismissedUpdateVersion(appUpdate.version)
                }
                setAppUpdate(null)
              }}>
                <Text style={styles.updateModalClose}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.updateModalVersion}>{t('Version', 'సంస్కరణ')} {appUpdate?.version}</Text>
            <Text style={styles.updateModalNotes}>{appUpdate?.releaseNotes || t('Check GitHub for details', 'వివరాల కోసం GitHub ను చెక్ చేయండి')}</Text>
            <View style={styles.updateModalActions}>
              <Pressable
                style={styles.updateModalButton}
                onPress={() => appUpdate?.downloadUrl && Linking.openURL(appUpdate.downloadUrl)}
              >
                <Text style={styles.updateModalButtonText}>{t('Download APK', 'APK డౌన్‌లోడ్ చేయండి')}</Text>
              </Pressable>
              <Pressable
                style={[styles.updateModalButton, styles.updateModalButtonSecondary]}
                onPress={() => appUpdate?.releaseUrl && Linking.openURL(appUpdate.releaseUrl)}
              >
                <Text style={styles.updateModalButtonTextSecondary}>{t('View Release', 'విడుదల చూడండి')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 26,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: '#4A4AD5',
  },
  brand: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 46,
  },
  phoneBrand: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  tagline: {
    marginTop: 8,
    color: '#E0E0FF',
    fontSize: 23,
    fontWeight: '500',
    lineHeight: 32,
  },
  phoneTagline: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
  },
  contentWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },
  searchBar: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: '#D9CFC7', backgroundColor: '#FFFDFB', shadowColor: '#2C2621', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  searchIcon: { marginRight: 10, fontSize: 18 },
  searchInput: { flex: 1, height: 42, paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0, outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent', backgroundColor: 'transparent', color: '#2D2F43', fontSize: 15, fontWeight: '600' },
  voiceButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  voiceButtonActive: { backgroundColor: '#D35B50' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(24, 24, 32, 0.56)' },
  modalClose: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#F3F0EB' },
  modalCloseText: { color: '#5C5A57', fontSize: 24, lineHeight: 26 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 12 },
  locationPin: { marginRight: 8, fontSize: 15 },
  locationText: { color: '#3C3D4C', fontSize: 14, fontWeight: '600' },
  utilityRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 4 },
  utilityCard: { flex: 1, minHeight: 154, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.8)', shadowColor: '#493A4D', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  utilityImage: { width: '100%', height: 68 },
  utilityCopy: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 8, backgroundColor: '#FFF' },
  utilityLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
  weatherLabel: { color: '#197A83' },
  goldLabel: { color: '#9A6500' },
  utilityValue: { marginTop: 2, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  weatherValue: { color: '#164F58' },
  weatherTime: { color: '#4A5660', fontSize: 11, lineHeight: 14, fontWeight: '800', marginBottom: 2 },
  weatherStatus: { color: '#45616A', fontSize: 10, lineHeight: 13, fontWeight: '700', marginBottom: 2 },
  utilityText: { marginTop: 1, color: '#5D5860', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  rainSummaryText: { color: '#0284C7', fontWeight: '800' },
  rainAlertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#EAF5FF' },
  rainAlertIcon: { fontSize: 18 },
  rainAlertContent: { flex: 1 },
  rainAlertTitle: { color: '#0C4A6E', fontSize: 12, fontWeight: '800' },
  rainAlertMessage: { marginTop: 2, color: '#1E4E66', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  goldRateValue: { marginTop: 2, color: '#805100', fontSize: 18, fontWeight: '900' },
  utilityModal: { width: '100%', maxWidth: 340, maxHeight: '88%', overflow: 'hidden', borderRadius: 18, backgroundColor: colors.surface },
  utilityModalHero: { height: 238, position: 'relative', backgroundColor: '#25202A' },
  utilityModalHeroImage: { width: '100%', height: '100%' },
  utilityModalHeroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 8, 18, 0.3)' },
  utilityModalClose: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.9)' },
  utilityModalCloseText: { color: '#352D38', fontSize: 23, lineHeight: 25 },
  utilityModalHeroCopy: { position: 'absolute', right: 0, bottom: 0, left: 0, paddingHorizontal: 16, paddingTop: 32, paddingBottom: 15, backgroundColor: 'rgba(18, 8, 20, 0.52)' },
  utilityModalKicker: { color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  utilityModalHeroValue: { marginTop: 4, color: '#FFF', fontSize: 27, fontWeight: '900' },
  utilityModalHeroDetail: { marginTop: 3, color: '#F3ECF3', fontSize: 11, fontWeight: '700' },
  utilityModalEmpty: { padding: 20, color: colors.muted, fontSize: 14, fontWeight: '700' },
  utilityModalFoot: { marginTop: 14, marginBottom: 4, color: colors.muted, fontSize: 10 },
  weatherDetails: { maxHeight: 330, paddingHorizontal: 16, paddingTop: 12 },
  weatherSummary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  weatherSummaryIcon: { marginRight: 2, fontSize: 23 },
  weatherSummaryText: { flex: 1, color: colors.muted, fontSize: 10, fontWeight: '700' },
  goldModalBody: { padding: 16 },
  goldModalRate: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  goldModalLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  goldModalValue: { color: '#805100', fontSize: 18, fontWeight: '900' },
  forecastHeading: { marginTop: 18, color: colors.text, fontSize: 13, fontWeight: '800' },
  hourlyRail: { gap: 8, paddingTop: 10, paddingBottom: 4 },
  hourlyItem: { position: 'relative', width: 58, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', backgroundColor: '#FFF8EC' },
  hourlyItemRain: { paddingVertical: 6, borderColor: '#0284C7', backgroundColor: '#DDF7FF' },
  hourlyRainMarker: { position: 'absolute', top: 0, left: 12, right: 12, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: '#06B6D4' },
  forecastTime: { color: colors.muted, fontSize: 10 },
  forecastTimeRain: { color: '#075985', fontWeight: '900' },
  forecastIcon: { marginTop: 7, fontSize: 20 },
  hourlyRainIconBadge: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginTop: 5, borderRadius: 14, borderWidth: 1, borderColor: '#0EA5E9', backgroundColor: '#0284C7' },
  forecastTemp: { marginTop: 5, color: colors.text, fontSize: 12, fontWeight: '800' },
  forecastTempRain: { marginTop: 4, color: '#064E7A', fontWeight: '900' },
  dailyList: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  dailyItem: { minHeight: 38, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0EEF2' },
  dailyDay: { width: 52, color: colors.text, fontSize: 12, fontWeight: '700' },
  dailyTemp: { marginLeft: 'auto', color: colors.text, fontSize: 12, fontWeight: '800' },
  dailyMin: { color: colors.muted, fontWeight: '500' },
  announcementModal: { width: '100%', maxWidth: 480, overflow: 'hidden', borderRadius: 22, backgroundColor: '#FFFDFB' },
  announcementModalImage: { width: '100%', height: 220, backgroundColor: '#222' },
  announcementModalBody: { padding: 20 },
  announcementModalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  announcementType: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, color: '#9A542D', backgroundColor: '#FFE5BE', fontSize: 12, fontWeight: '800' },
  announcementModalTitle: { marginTop: 16, color: '#302C2A', fontSize: 24, fontWeight: '800', lineHeight: 30 },
  announcementModalDetail: { marginTop: 7, color: '#D35B50', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  announcementModalDescription: { marginTop: 16, color: '#5F5B58', fontSize: 15, lineHeight: 23 },
  silver: { color: '#5661B8', fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: '#202332', fontSize: 20, fontWeight: '800' },
  updateCount: { color: '#414352', fontSize: 12, fontWeight: '700' },
  viewAllButton: { minWidth: 76, minHeight: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#B45855', backgroundColor: 'rgba(255,255,255,0.5)' },
  viewAll: { color: '#A44745', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  updateRail: { gap: 12, paddingRight: 8 },
  updateRailCard: { width: 252, height: 166, overflow: 'hidden', borderRadius: 18, borderWidth: 2, borderColor: '#58D5D2', backgroundColor: '#222' },
  updateCard: { width: '100%', overflow: 'hidden', borderRadius: 18, borderWidth: 2, borderColor: '#58D5D2', backgroundColor: '#222' },
  updateCardTall: { height: 188 },
  updateCardShort: { height: 148 },
  updateImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  updateShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  updateCopy: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  updateTitle: { color: '#FFF', fontSize: 14, lineHeight: 17, fontWeight: '800' },
  updateDetail: { marginTop: 5, color: '#FFF', fontSize: 11 },
  updateLocation: { marginTop: 3, color: '#E6E6E6', fontSize: 10 },
  eyebrow: {
    color: '#2D2F43',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phoneEyebrow: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  title: {
    marginTop: 8,
    color: '#1F2235',
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.1,
    lineHeight: 54,
  },
  phoneTitle: {
    marginTop: 5,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: { height: 166, overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: '#8D6B96', backgroundColor: '#241329' },
  categoryImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  categoryImageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A294D' },
  categoryShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 8, 24, 0.12)' },
  categoryCopy: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, paddingTop: 26, paddingBottom: 12, backgroundColor: 'rgba(15, 5, 18, 0.24)' },
  categoryName: { color: '#FFF', fontSize: 17, fontWeight: '800', lineHeight: 21, textShadowColor: 'rgba(0, 0, 0, 0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  categoryCount: { marginTop: 3, color: '#F0E8F0', fontSize: 11, fontWeight: '700', textShadowColor: 'rgba(0, 0, 0, 0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  imageWrap: {
    height: 88,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E7E9FA',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  popularList: { gap: 14, paddingBottom: 8 },
  businessCard: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: '#E8D4CB', backgroundColor: '#FFFDFB', shadowColor: '#8C5B4B', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  businessImageWrap: { height: 220, position: 'relative', backgroundColor: '#E7E9FA', borderBottomWidth: 1, borderBottomColor: '#F0E0D8' },
  cardImageSelected: { borderWidth: 2, borderColor: '#514BD5' },
  businessImage: { width: '100%', height: '100%' },
  openBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(93, 141, 81, 0.6)' },
  openText: { color: '#E8F5E3', fontSize: 10, fontWeight: '800' },
  favoriteBadge: { position: 'absolute', top: 8, left: 8, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(255,253,251,0.62)' },
  favoriteText: { color: '#E4585D', fontSize: 18 },
  favoriteActive: { color: '#E34E5B' },
  businessContent: { padding: 14, borderTopWidth: 0 },
  businessName: { color: '#2D2A2B', fontSize: 18, fontWeight: '800', lineHeight: 23 },
  businessMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9 },
  businessCategory: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, color: '#C95E49', backgroundColor: '#FFF0E9', fontSize: 12, fontWeight: '800' },
  trending: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, color: '#BD694D', backgroundColor: '#FFF0E3', fontSize: 12, fontWeight: '800' },
  rating: { marginTop: 10, color: '#D89B00', fontSize: 14, fontWeight: '800' },
  reviewCount: { color: '#5E5A5A', fontWeight: '500' },
  businessAddress: { marginTop: 9, color: '#676263', fontSize: 13, lineHeight: 18 },
  businessDistance: { marginTop: 4, color: '#4D8052', fontSize: 11, fontWeight: '700' },
  updateModal: { marginHorizontal: 20, paddingVertical: 24, paddingHorizontal: 18, backgroundColor: '#FFF', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  updateModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  updateModalTitle: { flex: 1, color: '#202332', fontSize: 18, fontWeight: '800' },
  updateModalClose: { color: '#999', fontSize: 28, fontWeight: '300' },
  updateModalVersion: { color: '#5661B8', fontSize: 14, fontWeight: '800', marginBottom: 12 },
  updateModalNotes: { color: '#5F5B58', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  updateModalActions: { flexDirection: 'column', gap: 10 },
    updateModalButton: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#5661B8', borderRadius: 10, alignItems: 'center' },
  updateModalButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  updateModalButtonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#5661B8' },
  updateModalButtonTextSecondary: { color: '#5661B8', fontSize: 16, fontWeight: '800' },
  cricketSection: { marginTop: 6, marginBottom: 6 },
  cricketHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cricketIconWrap: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#FEF3C7' },
  cricketHeaderLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: '#FEE2E2' },
  cricketHeaderLiveText: { color: '#DC2626', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  cricketSectionIcon: { fontSize: 20 },
  cricketRailWrap: { flexDirection: 'row', alignItems: 'center' },
  cricketRail: { gap: cricketCardGap, paddingRight: 4, paddingVertical: 4 },
  cricketRailArrow: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  cricketRailArrowDisabled: { opacity: 0.35 },
  cricketRailFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24, marginTop: 2 },
  cricketSwipeHint: { color: '#7C8496', fontSize: 10, fontWeight: '700' },
  cricketPaginationDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cricketPaginationDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  cricketPaginationDotActive: { width: 18, backgroundColor: '#3B82F6' },
  cricketPaginationDotLive: { backgroundColor: '#EF4444' },
  cricketCard: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: 'hidden',
  },
  cricketCardLive: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cricketCardUpcoming: {
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cricketCardTopLiveBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 3.5,
    backgroundColor: '#EF4444',
  },
  cricketCardTopUpcomingBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 3.5,
    backgroundColor: '#0284C7',
  },
  cricketCardTopDefaultBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 3.5,
    backgroundColor: '#CBD5E1',
  },
  cricketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 6,
    marginTop: 2,
  },
  cricketHeaderTagsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    marginRight: 4,
  },
  cricketFormatBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  cricketFormatText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cricketSeriesBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cricketSeriesIcon: {
    marginRight: 2,
  },
  cricketSeriesText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
  },
  cricketLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cricketLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EF4444',
  },
  cricketLiveText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cricketUpcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  cricketUpcomingIcon: {
    marginRight: 2,
  },
  cricketUpcomingText: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cricketTimeBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
  },
  cricketEndedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cricketEndedText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
  },
  cricketStartTimeText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
  },
  cricketTimeHighlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  cricketTimeHighlightPillLive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  cricketTimeHighlightPillUpcoming: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  cricketTimeHighlightText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
  },
  cricketTimeHighlightTextLive: {
    color: '#B91C1C',
  },
  cricketTimeHighlightTextUpcoming: {
    color: '#0369A1',
  },
  cricketMatchTitle: {
    marginBottom: 10,
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  cricketTeamsContainer: {
    gap: 10,
    marginVertical: 4,
  },
  cricketTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cricketTeamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  cricketTeamAvatar: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cricketTeamAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cricketTeamDot: { width: 8, height: 8, borderRadius: 4 },
  cricketTeamDotBig: { width: 12, height: 12, borderRadius: 6 },
  cricketTeamName: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  cricketScoreWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 5, justifyContent: 'flex-end' },
  cricketScore: { color: '#0F172A', fontSize: 14, fontWeight: '900' },
  cricketScoreEmpty: { color: '#94A3B8', fontWeight: '600' },
  cricketOvers: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  cricketStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cricketStatusRowLive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderTopWidth: 1,
    marginTop: 10,
  },
  cricketStatusRowUpcoming: {
    backgroundColor: '#F0F9FF',
    borderColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderTopWidth: 1,
    marginTop: 10,
  },
  cricketStatusText: { flex: 1, color: '#475569', fontSize: 11, fontWeight: '700' },
  cricketStatusLiveText: { color: '#DC2626', fontWeight: '800' },
  cricketStatusUpcomingText: { color: '#0284C7', fontWeight: '800' },
  cricketModal: { width: '100%', maxWidth: 440, maxHeight: '85%', overflow: 'hidden', borderRadius: 20, backgroundColor: '#FFFFFF', padding: 20 },
  cricketModalHero: { marginHorizontal: -20, marginTop: -20, marginBottom: 14, padding: 20, paddingTop: 18, backgroundColor: '#172033' },
  cricketModalHeroHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cricketModalSeriesPill: { maxWidth: 170, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E0E7FF' },
  cricketModalSeriesText: { color: '#3730A3', fontSize: 10, fontWeight: '800' },
  cricketModalTypePill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, backgroundColor: '#334155' },
  cricketModalTypeText: { color: '#E2E8F0', fontSize: 10, fontWeight: '800' },
  cricketEndedPill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: '#334155' },
  cricketEndedPillText: { color: '#CBD5E1', fontSize: 10, fontWeight: '800' },
  cricketModalClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginTop: -4, marginRight: -4, borderRadius: 17, backgroundColor: '#334155' },
  cricketModalHeroTitle: { marginTop: 15, color: '#FFFFFF', fontSize: 19, lineHeight: 25, fontWeight: '900' },
  cricketModalHeroVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  cricketModalHeroVenueText: { flex: 1, color: '#CBD5E1', fontSize: 11, fontWeight: '600' },
  cricketModalMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  cricketModalMetaText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  cricketModalTimeHighlight: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#1E293B' },
  cricketModalTimeHighlightText: { color: '#38BDF8', fontSize: 11, fontWeight: '800' },
  cricketModalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  cricketModalTitleWrap: { flex: 1, marginRight: 12 },
  cricketModalBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
  cricketModalSeries: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  cricketModalType: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F3F4F6', color: '#4B5563', fontSize: 11, fontWeight: '800' },
  cricketModalTitle: { color: '#111827', fontSize: 17, fontWeight: '900', lineHeight: 22 },
  cricketModalBody: { maxHeight: 380 },
  cricketModalScoreCard: { padding: 14, borderRadius: 14, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12 },
  cricketInningsCard: { marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  cricketInningsHeading: { marginBottom: 8, color: '#1E293B', fontSize: 13, fontWeight: '900' },
  cricketInningsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  cricketInningsTeam: { flex: 1, marginRight: 12 },
  cricketInningsTeamName: { color: '#334155', fontSize: 12, fontWeight: '800' },
  cricketInningsMeta: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '600' },
  cricketInningsScore: { alignItems: 'flex-end' },
  cricketInningsRuns: { color: '#0F172A', fontSize: 15, fontWeight: '900' },
  cricketModalTeamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  cricketModalTeamInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  cricketTeamAvatarBig: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  cricketTeamAvatarBigText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  cricketModalTeamName: { color: '#111827', fontSize: 15, fontWeight: '800' },
  cricketModalTeamShort: { marginTop: 2, color: '#64748B', fontSize: 10, fontWeight: '700' },
  cricketModalScoreWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  cricketModalScore: { color: '#111827', fontSize: 16, fontWeight: '900' },
  cricketModalOvers: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  cricketModalDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 },
  cricketModalStatusBanner: { padding: 10, borderRadius: 10, backgroundColor: '#FEF3C7', marginBottom: 12 },
  cricketModalStatusBannerLive: { backgroundColor: '#FEF2F2' },
  cricketModalStatusBannerDone: { backgroundColor: '#ECFDF5' },
  cricketModalStatusText: { color: '#92400E', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  cricketModalStatusTextLive: { color: '#B91C1C' },
  cricketModalStatusTextDone: { color: '#047857' },
  cricketLiveFeedButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 10, backgroundColor: '#DC2626' },
  cricketLiveFeedButtonText: { flex: 1, color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  cricketInPlayContainer: { marginBottom: 4 },
  cricketInPlayHeading: { color: '#1E293B', fontSize: 13, fontWeight: '900' },
  cricketInPlayCard: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC' },
  cricketInPlayIconBat: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FEF3C7' },
  cricketInPlayIconBowl: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#DBEAFE' },
  cricketInPlayContent: { flex: 1 },
  cricketInPlayRole: { color: '#64748B', fontSize: 10, fontWeight: '800' },
  cricketInPlayName: { marginTop: 2, color: '#1E293B', fontSize: 12, fontWeight: '800' },
  cricketCommentarySection: { marginTop: 14 },
  cricketCommentaryHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cricketCommentaryLivePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FEE2E2' },
  cricketCommentaryLiveText: { color: '#DC2626', fontSize: 9, fontWeight: '900' },
  cricketRecentBalls: { flexDirection: 'row', gap: 7, marginTop: 9, marginBottom: 6 },
  cricketBall: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#E2E8F0' },
  cricketBallBoundary: { backgroundColor: '#DBEAFE' },
  cricketBallWicket: { backgroundColor: '#FEE2E2' },
  cricketBallText: { color: '#334155', fontSize: 11, fontWeight: '900' },
  cricketCommentaryItem: { flexDirection: 'row', gap: 9, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cricketCommentaryOver: { width: 30, color: '#64748B', fontSize: 11, fontWeight: '900' },
  cricketCommentaryWicket: { color: '#DC2626' },
  cricketCommentaryText: { flex: 1, color: '#475569', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  cricketCommentaryEmpty: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, padding: 12, borderRadius: 10, backgroundColor: '#F1F5F9' },
  cricketCommentaryEmptyText: { flex: 1, color: '#64748B', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  cricketModalDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  cricketModalDetailLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  cricketModalDetailValue: { color: '#111827', fontSize: 13, fontWeight: '800', flex: 1 },
  cricketModalSummaryBox: { marginTop: 10, padding: 12, borderRadius: 10, backgroundColor: '#F3F4F6' },
  cricketModalSummaryText: { color: '#4B5563', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  cricketModalVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, paddingBottom: 4 },
  cricketModalVenueText: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  cricketTabs: { gap: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 14 },
  cricketTab: { paddingBottom: 7 },
  cricketTabActive: { borderBottomWidth: 2, borderBottomColor: '#DC2626' },
  cricketTabText: { color: '#64748B', fontSize: 11, fontWeight: '800' },
  cricketTabTextActive: { color: '#DC2626' },
  cricketInfoCard: { padding: 14, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  cricketInfoLine: { marginTop: 10, color: '#334155', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  cricketInfoLabel: { color: '#64748B', fontWeight: '800' },
  cricketPlayerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
})
