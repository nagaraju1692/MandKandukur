import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, Linking } from 'react-native'
import BottomNav from './BottomNav'
import { getBusinessImage, getCategoryImage } from '../utils/categoryImages'
import MobileHeader from './MobileHeader'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useReviews } from '../context/ReviewContext'
import { useNearby } from '../context/NearbyContext'
import { useDirectory } from '../context/DirectoryContext'
import DirectoryState from './DirectoryState'
import { colors } from '../ui/theme'
import { fetchGoldRate, fetchWeather, GoldRate, WeatherReport } from '../services/api'
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
const popularGroups = [
  ['hospitals-clinics', 'Hospitals', 'Hospitals & Clinics'],
  ['medical-shops', 'Medical shops', 'Medical Shops'],
  ['restaurants-hotels', 'Restaurants', 'Restaurants & Hotels'],
]
const rainCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99])
const kandukurOffsetMs = (5 * 60 + 30) * 60 * 1000

function getKandukurTimeMs(time: string | Date) {
  if (time instanceof Date) return time.getTime()
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(time)
  if (!match) return new Date(time).getTime()
  const [, year, month, day, hour, minute] = match
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)) - kandukurOffsetMs
}

function formatRainHour(time: string | Date) {
  return new Date(getKandukurTimeMs(time)).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}

function getRainWindow(weather: WeatherReport | null, t: (en: string, te: string) => string) {
  if (!weather?.hourly || weather.hourly.length === 0) return null
  const now = Date.now()
  const upcomingHours = weather.hourly
    .map((hour, index) => ({ hour, index }))
    .filter(({ hour }) => getKandukurTimeMs(hour.time) + 60 * 60 * 1000 >= now)

  const rainStartPos = upcomingHours.findIndex(({ hour }) => rainCodes.has(hour.code))
  if (rainStartPos < 0) return null

  const rainStartIndex = upcomingHours[rainStartPos].index
  let rainEndIndex = rainStartIndex
  while (
    rainEndIndex + 1 < weather.hourly.length &&
    rainCodes.has(weather.hourly[rainEndIndex + 1].code)
  ) {
    rainEndIndex += 1
  }

  const startHour = weather.hourly[rainStartIndex]
  const endHour = weather.hourly[rainEndIndex]
  const startTimeStr = formatRainHour(startHour.time)
  const endTimeDate = new Date(getKandukurTimeMs(endHour.time) + 60 * 60 * 1000)
  const endTimeStr = formatRainHour(endTimeDate)

  const startMs = getKandukurTimeMs(startHour.time)
  const endMs = getKandukurTimeMs(endHour.time) + 60 * 60 * 1000
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

function isHourInRainWindow(time: string | Date, rainWindow: ReturnType<typeof getRainWindow>) {
  if (!rainWindow) return false
  const hourMs = getKandukurTimeMs(time)
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
  const { distances, ready, ensureAddresses, sortNearest } = useNearby()
  const { t, category: categoryLabel, businessName } = useLanguage()
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
  const [utilityLoading, setUtilityLoading] = useState(true)
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
  const { width } = useWindowDimensions()
  const isPhone = width < 600
  const horizontalPadding = isPhone ? 18 : 24
  const categoryCardWidth = (width - horizontalPadding * 2 - 12) / 2
  const announcementCardWidth = isPhone ? (width - horizontalPadding * 2 - announcementCardGap) / 2 : 252
  const weatherMode = getWeatherMode(weather, currentTime)
  const rainWindow = getRainWindow(weather, t)
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

  useEffect(() => {
    let active = true
    Promise.allSettled([fetchWeather(), fetchGoldRate()]).then(([weatherResult, goldResult]) => {
      if (!active) return
      if (weatherResult.status === 'fulfilled') setWeather(weatherResult.value)
      if (goldResult.status === 'fulfilled') setGold(goldResult.value)
      setUtilityLoading(false)
    })
    return () => { active = false }
  }, [])

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

      <ScrollView style={styles.contentWrap} contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]} showsVerticalScrollIndicator={false}>
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

        <View style={styles.locationRow}><Text style={styles.locationPin}>📍</Text><Text style={styles.locationText}>{t('Kandukur, Andhra Pradesh', 'కందుకూరు, ఆంధ్రప్రదేశ్')}</Text></View>

                <View style={styles.utilityRow}>
          <Pressable style={styles.utilityCard} onPress={() => setSelectedUtility('weather')}>
            <RemoteImage source={{ uri: weatherModeImages[weatherMode] || weatherImageUrl }} style={styles.utilityImage} resizeMode="cover" />
            <View style={styles.utilityCopy}>
              <Text style={[styles.utilityLabel, styles.weatherLabel]}>{t('TODAY’S WEATHER', 'ఈరోజు వాతావరణం')}</Text>
              <Text style={styles.weatherTime}>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={[styles.utilityValue, styles.weatherValue]}>{weather?.temp || (utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Unavailable', 'అందుబాటులో లేదు'))}</Text>
              <Text style={styles.weatherStatus} numberOfLines={1}>{weather ? `${weatherIcon(weather.daily[0]?.code ?? 0)} ${weather.condition}` : t('Weather status unavailable', 'వాతావరణ సమాచారం అందుబాటులో లేదు')}</Text>
              <Text style={[styles.utilityText, rainWindow && styles.rainSummaryText]} numberOfLines={1}>{rainWindow ? `🌧 ${rainWindow.badgeText}` : (weather ? weather.humidity : t('Kandukur area', 'కందుకూరు ప్రాంతం'))}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.utilityCard} onPress={() => setSelectedUtility('gold')}>
            <RemoteImage source={{ uri: goldImageUrl }} style={styles.utilityImage} resizeMode="cover" />
            <View style={styles.utilityCopy}>
              <Text style={[styles.utilityLabel, styles.goldLabel]}>{t('GOLD RATE TODAY', 'ఈరోజు బంగారం ధర')}</Text>
              <Text style={styles.goldRateValue}>{gold ? `₹${gold.pricePerSavaram22K.toLocaleString('en-IN')}` : utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Unavailable', 'అందుబాటులో లేదు')}</Text>
              <Text style={styles.utilityText}>{t('22K · 8g savaram', '22K · 8 గ్రాములు')}</Text>
            </View>
          </Pressable>
        </View>

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
                <Text style={styles.utilityModalHeroDetail}>{selectedUtility === 'weather' ? (weather ? `${weather.condition}${rainWindow ? ` · 🌧 ${rainWindow.timeRange}` : ` · ${weather.humidity}`}` : t('Kandukur area', 'కందుకూరు ప్రాంతం')) : t('22K · 8g savaram', '22K · 8 గ్రాములు')}</Text>
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
                <Text style={styles.utilityModalFoot}>{t('Kandukur area · Updated', 'కందుకూరు ప్రాంతం · నవీకరించబడింది')} {new Date(weather.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </ScrollView> : <Text style={styles.utilityModalEmpty}>{utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Weather unavailable right now.', 'ప్రస్తుతం వాతావరణ సమాచారం అందుబాటులో లేదు.')}</Text>
            ) : (
              gold ? <View style={styles.goldModalBody}><View style={styles.goldModalRate}><Text style={styles.goldModalLabel}>22K · 8g</Text><Text style={styles.goldModalValue}>₹{gold.pricePerSavaram22K.toLocaleString('en-IN')}</Text></View><View style={styles.goldModalRate}><Text style={styles.goldModalLabel}>24K · 8g</Text><Text style={styles.goldModalValue}>₹{gold.pricePerSavaram.toLocaleString('en-IN')}</Text></View><Text style={styles.utilityModalFoot}>{t('Daily market rate · Updated', 'రోజువారీ మార్కెట్ రేటు · నవీకరించబడింది')} {gold.updatedAt ? new Date(gold.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('today', 'ఈరోజు')}</Text></View> : <Text style={styles.utilityModalEmpty}>{utilityLoading ? t('Loading…', 'లోడ్ అవుతోంది…') : t('Gold rate unavailable right now.', 'ప్రస్తుతం బంగారం ధర అందుబాటులో లేదు.')}</Text>
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
  categoryCard: { height: 196, overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: '#8D6B96', backgroundColor: '#241329' },
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
})
