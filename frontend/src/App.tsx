import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Language, languages, t } from './i18n'
import { fetchGoldRate, fetchWeather } from './services/api'
import { announcements } from './data/announcements'
import './styles.css'

type UserProfile = {
  name: string
  phone: string
}

type NotificationItem = {
  id: string
  title: string
  message: string
  timestamp: string
}

const defaultNotifications: NotificationItem[] = [
  {
    id: '3',
    title: 'New category added',
    message: 'Medical shops and bus stand listings are updated.',
    timestamp: '1 hr ago',
  },
  ...announcements.map((announcement) => ({
    id: `announcement-${announcement.id}`,
    title: announcement.type === 'movie' ? 'New movie update' : 'New shop opening',
    message: `${announcement.title} · ${announcement.date}.`,
    timestamp: 'New',
  })),
]

function getNotificationCopy(notification: NotificationItem, language: Language) {
  if (notification.id === 'heat-alert') {
    return {
      title: language === 'te' ? 'అధిక వేడి హెచ్చరిక' : 'High heat alert',
      message: language === 'te'
        ? 'చాలా వేడి వాతావరణం ఉండే అవకాశం ఉంది. నీరు ఎక్కువగా తాగి, తీవ్రమైన ఎండను తప్పించుకోండి.'
        : 'Very hot weather is expected. Please stay hydrated and avoid strong sunlight.',
    }
  }

  if (notification.id === 'gold-rate-alert') {
    return {
      title: language === 'te' ? 'బంగారం ధర అప్‌డేట్' : 'Gold rate update',
      message: language === 'te' ? 'ఈరోజు తాజా బంగారం ధర అందుబాటులో ఉంది.' : 'Today\'s latest gold rate is now available.',
    }
  }

  if (notification.id === 'rain-alert') {
    return {
      title: language === 'te' ? 'వర్ష హెచ్చరిక' : 'Rain alert',
      message: language === 'te'
        ? 'సుమారు 15 నిమిషాల్లో వర్షం పడే అవకాశం ఉంది. గొడుగు తీసుకెళ్లండి.'
        : 'Rain may begin in about 15 minutes. Please carry an umbrella and plan your travel accordingly.',
    }
  }

  if (notification.id === '1') {
    return { title: language === 'te' ? 'వాతావరణ అప్‌డేట్' : notification.title, message: language === 'te' ? 'కందుకూరులో ప్రస్తుత వాతావరణ సమాచారం అందుబాటులో ఉంది.' : notification.message }
  }

  if (notification.id === '2') {
    return { title: language === 'te' ? 'బంగారం ధర హెచ్చరిక' : notification.title, message: language === 'te' ? 'ఈరోజు కొత్త బంగారం ధర ప్రచురించబడింది.' : notification.message }
  }

  if (notification.id === '3') {
    return { title: language === 'te' ? 'కొత్త వర్గం అప్‌డేట్' : notification.title, message: language === 'te' ? 'మెడికల్ షాపులు మరియు బస్ స్టాండ్ లిస్టింగ్లు అప్‌డేట్ చేయబడ్డాయి.' : notification.message }
  }

  const announcement = announcements.find(item => `announcement-${item.id}` === notification.id)
  if (announcement) {
    const title = language === 'te' ? announcement.titleTe : announcement.title
    const date = language === 'te' ? announcement.dateTe : announcement.date
    return {
      title: language === 'te'
        ? (announcement.type === 'movie' ? 'కొత్త సినిమా అప్‌డేట్' : 'కొత్త షాప్ ప్రారంభం')
        : (announcement.type === 'movie' ? 'New movie update' : 'New shop opening'),
      message: `${title} · ${date}.`,
    }
  }

  return { title: notification.title, message: notification.message }
}

function getNotificationIcon(notification: NotificationItem): string | null {
  if (notification.id === 'rain-alert') return '☔'
  if (notification.id === 'heat-alert') return '☀️'
  if (notification.id === 'gold-rate-alert') return '🥇'
  return null
}

export default function App(){
  const location = useLocation()
  const navigate = useNavigate()
  const [showAgriIcons, setShowAgriIcons] = useState<boolean>(() => {
    const v = localStorage.getItem('manakandukur-showAgriIcons')
    return v === null ? true : v === 'true'
  })
  const [language, setLanguage] = useState<Language>('en')
  const [favorites, setFavorites] = useState<string[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null)
  const [loginName, setLoginName] = useState('')
  const [loginPhone, setLoginPhone] = useState('')
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const lastWeatherAlert = useRef<string | null>(
    localStorage.getItem('manakandukur-last-weather-alert') || null,
  )

  const publishGoldNotification = async () => {
    try {
      await fetchGoldRate()
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem('manakandukur-gold-notification-date', today)
      setNotifications(current => current.some(item => item.id === 'gold-rate-alert')
        ? current
        : [...current, {
            id: 'gold-rate-alert',
            title: 'Gold rate alert',
            message: 'Today\'s latest gold rate is now available.',
            timestamp: 'Today, 7:00 AM',
          }]
      )
    } catch {
      // Leave notifications unchanged when the market service is unavailable.
    }
  }

  useEffect(() => {
    let isMounted = true

    const checkWeatherAlert = async () => {
      try {
        const weather = await fetchWeather()
        if (!isMounted) return

        const temperature = Number.parseFloat(weather.temp)
        const heavySun = temperature >= 38 && ['Clear sky', 'Mainly clear', 'Sunny'].includes(weather.condition)
        const alertId = weather.rainSoon ? 'rain-alert' : heavySun ? 'heat-alert' : null
        const alert = weather.rainSoon
          ? {
              id: 'rain-alert',
              title: 'Rain alert',
              message: `Rain may begin in about ${weather.rainMinutes ?? 15} minutes. Please carry an umbrella and plan your travel accordingly.`,
              timestamp: 'Just now',
            }
          : heavySun
            ? {
                id: 'heat-alert',
                title: 'High heat alert',
                message: 'Very hot weather is expected. Please stay hydrated and avoid strong sunlight.',
                timestamp: 'Just now',
              }
            : null

        if (alertId !== lastWeatherAlert.current) {
          lastWeatherAlert.current = alertId
          localStorage.setItem('manakandukur-last-weather-alert', alertId || 'clear')
          setNotifications(current => {
            const weatherNotifications = current.filter(item => item.id !== 'rain-alert' && item.id !== 'heat-alert')
            return alert ? [...weatherNotifications, alert] : weatherNotifications
          })
        }
      } catch {
        // Keep the existing notifications when the weather service is unavailable.
      }
    }

    checkWeatherAlert()
    const refreshId = window.setInterval(checkWeatherAlert, 120000)

    return () => {
      isMounted = false
      window.clearInterval(refreshId)
    }
  }, [])

  useEffect(() => {
    let refreshTimeoutId: number

    const scheduleGoldNotification = () => {
      const nextRefresh = new Date()
      nextRefresh.setHours(7, 0, 0, 0)
      if (nextRefresh <= new Date()) nextRefresh.setDate(nextRefresh.getDate() + 1)
      refreshTimeoutId = window.setTimeout(() => {
        publishGoldNotification()
        scheduleGoldNotification()
      }, nextRefresh.getTime() - Date.now())
    }

    const today = new Date().toISOString().slice(0, 10)
    if (new Date().getHours() >= 7 && localStorage.getItem('manakandukur-gold-notification-date') !== today) {
      publishGoldNotification()
    }
    scheduleGoldNotification()

    return () => window.clearTimeout(refreshTimeoutId)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('manakandukur-language') as Language | null
    if (saved === 'en' || saved === 'te') setLanguage(saved)

    const savedFavorites = JSON.parse(localStorage.getItem('manakandukur-favorites') || '[]') as string[]
    if (Array.isArray(savedFavorites)) setFavorites(savedFavorites)

    const savedUser = localStorage.getItem('manakandukur-user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as UserProfile)
      } catch {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('manakandukur-language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('manakandukur-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    if (user) localStorage.setItem('manakandukur-user', JSON.stringify(user))
    else localStorage.removeItem('manakandukur-user')
  }, [user])

  const isHome = location.pathname === '/'
  const isSearch = location.pathname === '/search'
  const isCategories = location.pathname === '/categories'
  const isFavorites = location.pathname === '/favorites'
  const isProfile = location.pathname === '/profile'

  const openLoginModal = () => {
    setShowLoginModal(true)
  }

  useEffect(() => {
    localStorage.setItem('manakandukur-showAgriIcons', String(showAgriIcons))
  }, [showAgriIcons])

  const toggleFavorite = (businessId: string) => {
    if (!user) {
      setPendingFavoriteId(businessId)
      setShowLoginModal(true)
      return
    }

    setFavorites(current => (
      current.includes(businessId)
        ? current.filter(id => id !== businessId)
        : [...current, businessId]
    ))
  }

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const name = loginName.trim()
    const phone = loginPhone.trim()

    if (!name || !phone) return

    const profile = { name, phone }
    setUser(profile)
    setLoginName('')
    setLoginPhone('')
    setShowLoginModal(false)

    if (pendingFavoriteId) {
      setFavorites(current => (current.includes(pendingFavoriteId) ? current : [...current, pendingFavoriteId]))
      setPendingFavoriteId(null)
    }
  }

  const logout = () => {
    setUser(null)
    setFavorites([])
    setPendingFavoriteId(null)
    setShowLoginModal(false)
    setShowNotifications(false)
  }

  const profileLabel = user ? `👤 ${user.name.split(' ')[0]}` : 'Login'

  const toggleNotifications = () => {
    setShowNotifications(current => !current)
    if (showLoginModal) setShowLoginModal(false)
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const outletContext = useMemo(() => ({
    language,
    favorites,
    user,
    toggleFavorite,
    isLoggedIn: !!user,
    logout,
    openLoginModal,
    showAgriIcons,
    setShowAgriIcons,
    showNotifications,
  }), [language, favorites, user, showNotifications])

  return (
    <div className="mobile-container">
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <div className="brand-mark" aria-hidden="true">MK</div>
          <div className="brand-copy">
            <h1>Mana Kandukur</h1>
            {showAgriIcons && (
              <div className="agri-strip" aria-label="Local agriculture highlights">
                <span className="agri-item" title="Paddy">🌾</span>
                <span className="agri-item tobacco tobacco-field" title="Tobacco field" aria-label="Tobacco field">🌿</span>
                <span className="agri-item" title="Chilli">🌶️</span>
                <span className="agri-item" title="Cotton">🌱</span>
              </div>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="header-center-icon" aria-label="Kandukur agriculture">
            <img
              src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=160&q=80"
              alt=""
            />
          </button>
          <div className="language-toggle" aria-label="Language toggle">
            {languages.map(item => (
              <button
                key={item.code}
                className={`lang-btn ${language === item.code ? 'active' : ''}`}
                onClick={() => setLanguage(item.code)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="profile-login-btn"
            type="button"
            title={user ? user.name : 'Login to your account'}
            onClick={() => (user ? navigate('/profile') : openLoginModal())}
          >
            {profileLabel}
          </button>
          <button
            type="button"
            className="mobile-header-icon"
            aria-label="Notifications"
            aria-expanded={showNotifications}
            onClick={toggleNotifications}
          >
            <span className="bell-dot" aria-hidden="true">🔔</span>
            {notifications.length > 0 && !showNotifications && (
              <span className="notification-badge" aria-label="Unread notifications" />
            )}
          </button>
        </div>
      </header>
      <div className="mobile-content">
        <Outlet context={outletContext} />
      </div>
      <nav className="mobile-nav">
        <Link to="/" className={`nav-item ${isHome ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span>{t('home', language)}</span>
        </Link>
        <Link to="/search" className={`nav-item ${isSearch ? 'active' : ''}`}>
          <span className="nav-icon">🔍</span>
          <span>{t('search', language)}</span>
        </Link>
        <Link to="/categories" className={`nav-item ${isCategories ? 'active' : ''}`}>
          <span className="nav-icon">📂</span>
          <span>{t('categories', language)}</span>
        </Link>
        <Link to="/favorites" className={`nav-item ${isFavorites ? 'active' : ''}`}>
          <span className="nav-icon">❤️</span>
          <span>{t('favorites', language)}</span>
        </Link>
        <Link to="/profile" className={`nav-item ${isProfile ? 'active' : ''}`}>
          <span className="nav-icon">👤</span>
          <span>{t('profile', language)}</span>
        </Link>
      </nav>

      {showLoginModal && (
        <div className="login-modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(event) => event.stopPropagation()}>
            <div className="login-modal-header">
              <div>
                <span className="login-emblem" aria-hidden="true">MK</span>
                <h3>Mana Kandukur</h3>
                <p>Discover everything local</p>
              </div>
              <button type="button" className="login-close" onClick={() => setShowLoginModal(false)}>×</button>
            </div>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <label>
                <span>Your name</span>
                <input
                  type="text"
                  value={loginName}
                  onChange={(event) => setLoginName(event.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </label>
              <label>
                <span>Mobile number</span>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(event) => setLoginPhone(event.target.value)}
                  placeholder="Enter mobile number"
                  required
                />
              </label>
              <button type="submit" className="btn login-submit">Continue</button>
              <p className="login-terms">By continuing, you agree to our Terms & Privacy Policy.</p>
            </form>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="notifications-backdrop" onClick={() => setShowNotifications(false)}>
          <div className="notifications-panel" onClick={(event) => event.stopPropagation()}>
            <div className="notifications-header">
              <div>
                <h3>Notifications</h3>
                <p>{notifications.length} recent updates</p>
              </div>
              <div className="notifications-header-actions">
                <button
                  type="button"
                  className="notifications-clear"
                  onClick={clearNotifications}
                  disabled={notifications.length === 0}
                >
                  {t('clear', language)}
                </button>
                <button type="button" className="notifications-close" onClick={() => setShowNotifications(false)}>×</button>
              </div>
            </div>
            <div className="notifications-list">
              {notifications.length === 0 ? (
                <p className="notifications-empty">{t('noNewNotifications', language)}</p>
              ) : notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className="notification-item"
                  onClick={() => setSelectedNotification(notification)}
                >
                  {getNotificationIcon(notification) && (
                    <div className="notification-icon">{getNotificationIcon(notification)}</div>
                  )}
                  <div className="notification-body">
                    <strong>{getNotificationCopy(notification, language).title}</strong>
                    <p>{getNotificationCopy(notification, language).message}</p>
                    <small>{notification.timestamp}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedNotification && (
        <div className="announcement-modal-backdrop" onClick={() => setSelectedNotification(null)}>
          <article className="info-detail-modal notification-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="announcement-modal-heading">
              <span className="announcement-type weather">{getNotificationIcon(selectedNotification) || 'Update'}</span>
              <button
                type="button"
                className="announcement-modal-close"
                onClick={() => setSelectedNotification(null)}
                aria-label="Close notification details"
              >
                ×
              </button>
            </div>
            <h3>{getNotificationCopy(selectedNotification, language).title}</h3>
            {(() => {
              const announcement = announcements.find(item => `announcement-${item.id}` === selectedNotification.id)
              if (announcement) {
                const title = language === 'te' ? announcement.titleTe : announcement.title
                const date = language === 'te' ? announcement.dateTe : announcement.date
                const location = language === 'te' ? announcement.locationTe : announcement.location
                const details = language === 'te' ? announcement.detailsTe : announcement.details
                return (
                  <>
                    <p className="info-detail-row">{date}</p>
                    <p className="info-detail-row">{location}</p>
                    <p className="info-detail-description">{details}</p>
                    <p className="info-detail-source">{title}</p>
                  </>
                )
              }

              return (
                <>
                  <p className="info-detail-description">{getNotificationCopy(selectedNotification, language).message}</p>
                  <p className="info-detail-source">{selectedNotification.timestamp}</p>
                </>
              )
            })()}
          </article>
        </div>
      )}


    </div>
  )
}
