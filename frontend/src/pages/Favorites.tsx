import React, { useEffect, useState } from 'react'
import { Link, useOutletContext, useNavigate } from 'react-router-dom'
import { fetchJson } from '../services/api'
import { Language, getCategoryName, t } from '../i18n'
import getCategoryImage from '../utils/categoryImages'

type FavoritesContext = {
  language: Language
  favorites: string[]
  user: { name: string; phone: string } | null
  toggleFavorite: (id: string) => void
  isLoggedIn: boolean
  logout: () => void
  openLoginModal: () => void
}

const fallbackHospitalImage = 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80'

export default function Favorites() {
  const { language, favorites, user, toggleFavorite, isLoggedIn, logout, openLoginModal } = useOutletContext<FavoritesContext>()
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState<any[]>([])

  useEffect(() => {
    fetchJson('/api/businesses').then((res) => {
      const allBusinesses = res.data || []
      setBusinesses(allBusinesses.filter((b: any) => favorites.includes(b.id)))
    })
  }, [favorites])

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget
    if (target.src !== fallbackHospitalImage) {
      target.onerror = null
      target.src = fallbackHospitalImage
    }
  }

  return (
    <div className="favorites-screen">
      <header className="favorites-header">
        <button className="favorites-back" type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <div>
          <p>My list</p>
          <h2>{t('favorites', language)}</h2>
        </div>
        <span className="favorites-count">{isLoggedIn ? favorites.length : 0}</span>
      </header>

      {!isLoggedIn ? (
        <section className="favorites-guest">
          <div className="favorites-guest-icon" aria-hidden="true">♥</div>
          <p className="favorites-kicker">Your saved places</p>
          <h3>Keep your favourites close</h3>
          <p>Sign in to save local businesses and find them here whenever you need them.</p>
          <button className="favorites-primary" type="button" onClick={openLoginModal}>Sign in to continue</button>
          <button className="favorites-secondary" type="button" onClick={() => navigate('/categories')}>Browse categories</button>
        </section>
      ) : (
        <>
          <div className="favorites-user-row">
            <span><b>{user?.name?.charAt(0).toUpperCase()}</b>{user?.name}</span>
            <button type="button" onClick={logout}>Logout</button>
          </div>

          {businesses.length === 0 ? (
            <section className="favorites-guest compact">
              <div className="favorites-guest-icon" aria-hidden="true">♥</div>
              <h3>No favourites saved yet</h3>
              <p>Tap the heart on any local listing to add it here.</p>
              <button className="favorites-primary" type="button" onClick={() => navigate('/categories')}>Explore categories</button>
            </section>
          ) : (
            <div className="business-list favorites-list">
              {businesses.map((b: any) => (
                <div key={b.id} className="business-card favorite-card">
                  <div className="business-card-image">
                    <img src={b.image || getCategoryImage(b.categoryName)} alt={b.name} onError={handleImageError} />
                    <button
                      type="button"
                      className="favorite-badge active"
                      onClick={() => toggleFavorite(b.id)}
                      aria-label={`Remove ${b.name} from favourites`}
                    >
                      ♥
                    </button>
                  </div>
                  <div className="business-card-content">
                    <div className="business-name">{b.name}</div>
                    <div className="business-meta">
                      <span className="business-category">{getCategoryName(b.categoryName, language)}</span>
                    </div>
                    <div className="business-address">📍 {b.address}</div>
                    <Link to={`/business/${b.id}`} className="view-details-link">View details →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
