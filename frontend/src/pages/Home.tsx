import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchGoldRate, fetchJson, fetchWeather, GoldRate, WeatherReport } from '../services/api'
import { Language, getCategoryName, t } from '../i18n'
import { useOutletContext } from 'react-router-dom'
import getCategoryImage from '../utils/categoryImages'
import { announcements, Announcement } from '../data/announcements'

const categoryIcons: {[key: string]: string} = {
  Education: '🎓',
  'Engineering colleges': '🛠️',
  'Degree colleges': '🎓',
  Intermediate: '📘',
  'Polytechnic colleges': '🏭',
  Schools: '🏫',
  Hospitals: '🏥',
  'Medical shops': '💊',
  Restaurants: '🍽️',
  'Food Hotels': '🏨',
  Lodges: '🛏️',
  'Bus stand': '🚌',
  'Police station': '🚓',
  Theaters: '🎬',
  Temples: '🛕',
  Banks: '🏦',
  'Beauty clinics': '💆',
  'Movie Theaters': '🎬',
  'Shopping clothes': '🛍️',
  'Retail marts': '🛒',
  'Wine shops': '🍷',
  'Clothing Shops': '👕',
  'Jewellery shops': '💎',
  'Jewellery Shops': '💎',
  'Vegetable Markets': '🥬',
  'Chicken Shops': '🐔',
  'Mutton Shops': '🍖',
  Shopping: '🛍️',
  'Bus Stops': '🚌',
  'Real Estate': '🏘️',
}

const fallbackHospitalImage = 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80'

const fallbackWeather: WeatherReport = {
  temp: '32°C',
  condition: 'Sunny',
  humidity: '48% humidity',
  wind: '8 km/h wind',
  rainSoon: false,
  rainMinutes: null,
  updatedAt: new Date().toISOString(),
}

const fallbackGoldRate: GoldRate = {
  pricePerSavaram: 6940 * 8,
  updatedAt: '',
}

const getAnnouncementCopy = (announcement: Announcement, language: Language) => ({
  title: language === 'te' ? announcement.titleTe : announcement.title,
  date: language === 'te' ? announcement.dateTe : announcement.date,
  location: language === 'te' ? announcement.locationTe : announcement.location,
  details: language === 'te' ? announcement.detailsTe : announcement.details,
})

const weatherConditionTranslations: Record<string, string> = {
  Sunny: 'ఎండగా ఉంది',
  'Clear sky': 'ఆకాశం నిర్మలంగా ఉంది',
  'Mainly clear': 'ఎక్కువగా నిర్మలంగా ఉంది',
  'Partly cloudy': 'పాక్షికంగా మేఘావృతం',
  Overcast: 'మేఘావృతం',
  Foggy: 'పొగమంచు',
  'Light drizzle': 'తేలికపాటి జల్లులు',
  Drizzle: 'జల్లులు',
  'Heavy drizzle': 'భారీ జల్లులు',
  'Light rain': 'తేలికపాటి వర్షం',
  Rain: 'వర్షం',
  'Heavy rain': 'భారీ వర్షం',
  'Rain showers': 'వర్షపు జల్లులు',
  'Heavy rain showers': 'భారీ వర్షపు జల్లులు',
  Thunderstorm: 'ఉరుములతో కూడిన వర్షం',
}

export default function Home(){
  const { language, favorites = [], toggleFavorite, user, showNotifications = false } = useOutletContext<{
    language: Language
    favorites: string[]
    toggleFavorite: (id: string) => void
    user: { name: string; phone: string } | null
    showNotifications?: boolean
  }>()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [weatherReport, setWeatherReport] = useState<WeatherReport>(fallbackWeather)
  const [goldRate, setGoldRate] = useState<GoldRate>(fallbackGoldRate)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [selectedInfo, setSelectedInfo] = useState<'weather' | 'gold' | null>(null)
  const announcementRailRef = useRef<HTMLDivElement>(null)

  const scrollAnnouncements = (direction: number) => {
    announcementRailRef.current?.scrollBy({ left: direction * 170, behavior: 'smooth' })
  }

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget
    if (target.src !== fallbackHospitalImage) {
      target.onerror = null
      target.src = fallbackHospitalImage
    }
  }

  useEffect(()=>{
    fetchJson('/api/categories').then(res=>setCategories(res.data||[]))
    fetchJson('/api/businesses').then(res=>setBusinesses(res.data||[]))
  },[])

  useEffect(() => {
    let isMounted = true

    const loadWeather = async () => {
      try {
        const report = await fetchWeather()
        if (isMounted) setWeatherReport(report)
      } catch {
        // Keep the last successful report when the weather service is unavailable.
      }
    }

    loadWeather()
    const refreshId = window.setInterval(loadWeather, 120000)

    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadGoldRate = async () => {
      try {
        const rate = await fetchGoldRate()
        if (isMounted) setGoldRate(rate)
      } catch {
        // Keep the last successful rate when the market service is unavailable.
      }
    }

    let refreshTimeoutId: number

    const scheduleNextMorningRefresh = () => {
      const nextRefresh = new Date()
      nextRefresh.setHours(7, 0, 0, 0)
      if (nextRefresh <= new Date()) nextRefresh.setDate(nextRefresh.getDate() + 1)
      refreshTimeoutId = window.setTimeout(() => {
        loadGoldRate()
        scheduleNextMorningRefresh()
      }, nextRefresh.getTime() - Date.now())
    }

    loadGoldRate()
    scheduleNextMorningRefresh()

    return () => {
      isMounted = false
      window.clearTimeout(refreshTimeoutId)
    }
  }, [])

  const topCategories = categories.filter(c => !c.parentId)

  const restaurantBusinesses = businesses.filter(b => b.categoryId === '4').slice(0, 3)
  const hospitalBusinesses = businesses.filter(b => b.categoryId === '2').slice(0, 2)
  const medicalBusinesses = businesses.filter(b => b.categoryId === '3').slice(0, 2)
  const featuredBusinesses = [...restaurantBusinesses, ...hospitalBusinesses, ...medicalBusinesses]

  const silverPerKg = 98000
  const silverPerKgDisplay = `₹${silverPerKg.toLocaleString('en-IN')} / ${t('kilogram', language)}`
  const marketRates = {
    gold: `₹${goldRate.pricePerSavaram.toLocaleString('en-IN')}`,
    silver: silverPerKgDisplay,
    note: t('locationShort', language),
  }

  const handleSearch = (queryValue: string) => {
    const cleaned = queryValue.trim()
    if (cleaned) {
      navigate(`/search?q=${encodeURIComponent(cleaned)}`)
    }
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSearch(searchValue)
  }

  const selectedAnnouncementCopy = selectedAnnouncement
    ? getAnnouncementCopy(selectedAnnouncement, language)
    : null
  const displayedWeatherCondition = language === 'te'
    ? weatherConditionTranslations[weatherReport.condition] ?? weatherReport.condition
    : weatherReport.condition
  const weatherHumidityValue = weatherReport.humidity.replace(' humidity', '')
  const weatherWindValue = weatherReport.wind.replace(' wind', '')
  const displayedHumidity = language === 'te'
    ? `${weatherHumidityValue} ${t('humidity', language)}`
    : weatherReport.humidity
  const displayedWind = language === 'te'
    ? `${weatherWindValue} ${t('wind', language)}`
    : weatherReport.wind
  const goldUpdatedDate = goldRate.updatedAt
    ? new Intl.DateTimeFormat(language === 'te' ? 'te-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(goldRate.updatedAt))
    : '--'
  const weatherUpdatedDate = weatherReport.updatedAt
    ? new Intl.DateTimeFormat(language === 'te' ? 'te-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(weatherReport.updatedAt))
    : '--'

  return (
    <div className="mobile-content">
      {!showNotifications && (
        <div className="search-container content-padding-top">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                placeholder={`${t('search', language)}...`}
                value={searchValue}
                onChange={(event) => {
                  const value = event.target.value
                  setSearchValue(value)
                  if (value.trim()) handleSearch(value)
                }}
              />
            </div>
          </form>
        </div>
      )}

      <div className="location-tag">
        <span className="location-dot">📍</span>
        <span>{t('location', language)}</span>
      </div>

      <div className="info-strip">
        <button type="button" className="info-tile info-tile-action weather-tile" onClick={() => setSelectedInfo('weather')}>
          <div className="info-label">🌤️ {t('weather', language)}</div>
          <div className="info-main">{weatherReport.temp}</div>
          <div className="info-sub">{displayedWeatherCondition} · {displayedHumidity}</div>
          <div className="info-sub">{displayedWind}</div>
        </button>
        <button type="button" className="info-tile info-tile-action metal-tile" onClick={() => setSelectedInfo('gold')}>
          <div className="info-label">🥇 🥈 {t('rates', language)}</div>
          <div className="info-main">{t('gold', language)}: {marketRates.gold} <span className="rate-unit">/ {t('savaram', language)}</span></div>
          <div className="info-sub"><span className="silver-rate-name">{t('silver', language)}</span>: {marketRates.silver} · {marketRates.note}</div>
        </button>
      </div>

      <div className="section-header announcements-section-header">
        <h2>{t('latestInKandukur', language)}</h2>
        <span className="announcement-count">{announcements.length} {t('updates', language)}</span>
      </div>
      <div className="announcement-rail-wrap">
        <button
          type="button"
          className="announcement-scroll-button"
          onClick={() => scrollAnnouncements(-1)}
          aria-label="Show earlier announcements"
        >
          ‹
        </button>
        <div className="announcement-rail" ref={announcementRailRef} aria-label="Latest movie and shop announcements">
          {announcements.map((announcement) => (
            (() => {
              const copy = getAnnouncementCopy(announcement, language)
              return (
            <button
              key={announcement.id}
              type="button"
              className="announcement-card"
              onClick={() => setSelectedAnnouncement(announcement)}
            >
              <img src={announcement.image} alt="" />
              <span className="announcement-card-content">
                <strong>{copy.title}</strong>
                <small>{copy.date}</small>
                <small>{copy.location}</small>
              </span>
            </button>
              )
            })()
          ))}
        </div>
        <button
          type="button"
          className="announcement-scroll-button"
          onClick={() => scrollAnnouncements(1)}
          aria-label="Show newer announcements"
        >
          ›
        </button>
      </div>

      <div className="section-header">
        <h2>{t('exploreCategories', language)}</h2>
        <Link to="/categories" className="view-all">{t('viewAll', language)} →</Link>
      </div>
      <div className="category-grid">
        {topCategories.slice(0,6).map(c => {
          const icon = categoryIcons[c.name] || '📌'
          const isEducation = c.name === 'Education'
          const childCategoryIds = categories.filter(item => item.parentId === c.id).map(item => item.id)
          const count = c.name === 'Education'
            ? businesses.filter(b => childCategoryIds.includes(b.categoryId)).length
            : businesses.filter(b => b.categoryId === c.id).length

          return (
            <Link
              key={c.id}
              to={`/businesses?categoryId=${c.id}`}
              className={`category-card ${isEducation ? 'featured' : ''}`}
            >
              <div className="category-icon">{icon}</div>
              <div className="category-name">{getCategoryName(c.name, language)}</div>
              <div className="category-count">{count} {t('listings', language)}</div>
            </Link>
          )
        })}
      </div>

      <div className="section-header">
        <h2>{t('popularNearYou', language)}</h2>
        <Link to="/businesses" className="view-all">{t('viewAll', language)} →</Link>
      </div>
      <div className="business-list">
        {featuredBusinesses.map(b => (
          <div key={b.id} className="business-card">
            <div className="business-card-image">
              <Link to={`/business/${b.id}`} className="business-image-link">
                <img src={b.image || getCategoryImage(b.categoryName)} alt={b.name} onError={handleImageError} />
              </Link>
              <div className="business-card-status">{t('open', language)}</div>
              <button
                type="button"
                className={`favorite-badge ${favorites.includes(b.id) ? 'active' : ''}`}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  toggleFavorite(b.id)
                }}
                aria-label={favorites.includes(b.id) ? `Remove ${b.name} from favourites` : `Save ${b.name} to favourites`}
              >
                {favorites.includes(b.id) ? '♥' : '♡'}
              </button>
            </div>
            <div className="business-card-content">
              <Link to={`/business/${b.id}`} className="business-card-link">
                <div className="business-name">{b.name}</div>
              </Link>
              <div className="business-meta">
                <span className="business-category">{getCategoryName(b.categoryName, language)}</span>
                <span className="trend-chip">Trending</span>
              </div>
              <div className="business-rating">
                <span className="star">⭐ 4.3</span>
                <span>(88 reviews)</span>
              </div>
              <div className="business-address">📍 {b.address}</div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnnouncement && (
        <div className="announcement-modal-backdrop" onClick={() => setSelectedAnnouncement(null)}>
          <article className="announcement-modal" onClick={(event) => event.stopPropagation()}>
            <img src={selectedAnnouncement.image} alt="" />
            <div className="announcement-modal-content">
              <div className="announcement-modal-heading">
                <span className={`announcement-type ${selectedAnnouncement.type}`}>
                  {selectedAnnouncement.type === 'movie' ? t('movie', language) : t('shop', language)}
                </span>
                <button
                  type="button"
                  className="announcement-modal-close"
                  onClick={() => setSelectedAnnouncement(null)}
                  aria-label="Close announcement details"
                >
                  ×
                </button>
              </div>
              <h3>{selectedAnnouncementCopy?.title}</h3>
              <p className="announcement-modal-meta">{selectedAnnouncementCopy?.date} · {selectedAnnouncementCopy?.location}</p>
              <p>{selectedAnnouncementCopy?.details}</p>
            </div>
          </article>
        </div>
      )}

      {selectedInfo && (
        <div className="announcement-modal-backdrop" onClick={() => setSelectedInfo(null)}>
          <article className="info-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="announcement-modal-heading">
              <span className={`announcement-type ${selectedInfo === 'weather' ? 'weather' : 'gold'}`}>
                {selectedInfo === 'weather' ? `🌤️ ${t('weatherDetails', language)}` : `🥇 ${t('goldRateDetails', language)}`}
              </span>
              <button type="button" className="announcement-modal-close" onClick={() => setSelectedInfo(null)} aria-label="Close details">×</button>
            </div>
            {selectedInfo === 'weather' ? (
              <>
                <h3>{weatherReport.temp} · {displayedWeatherCondition}</h3>
                <p className="info-detail-row">{t('humidity', language)}: {weatherHumidityValue}</p>
                <p className="info-detail-row">{t('wind', language)}: {weatherWindValue}</p>
                <p className="info-detail-row">{t('updatedAt', language)}: {weatherUpdatedDate}</p>
                <p className={`rain-outlook ${weatherReport.rainSoon ? 'rain-expected' : 'rain-clear'}`}>
                  <span className="rain-outlook-label">{t('rainOutlook', language)}</span>
                  <strong>{weatherReport.rainSoon
                    ? t('rainExpected', language).replace('{minutes}', String(weatherReport.rainMinutes ?? 15))
                    : t('noRainExpected', language)}</strong>
                </p>
                <p className="info-detail-source">{t('liveKandukurWeather', language)}</p>
              </>
            ) : (
              <>
                <h3>{marketRates.gold} <span className="rate-unit">/ {t('savaram', language)}</span></h3>
                <p className="info-detail-row">{t('silver', language)}: {marketRates.silver}</p>
                <p className="info-detail-row">{t('locationLabel', language)}: {marketRates.note}</p>
                <p className="info-detail-row">{t('updatedAt', language)}: {goldUpdatedDate}</p>
                <p className="info-detail-source">{t('liveGoldMarketRate', language)}</p>
              </>
            )}
          </article>
        </div>
      )}
    </div>
  )
}
