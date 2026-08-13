import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchJson } from '../services/api'
import { Language, getCategoryName, t } from '../i18n'
import { useOutletContext } from 'react-router-dom'
import getCategoryImage from '../utils/categoryImages'

const educationIcons: Record<string, string> = {
  'Engineering colleges': '🛠️',
  'Degree colleges': '🎓',
  Intermediate: '📘',
  'Polytechnic colleges': '🏭',
  Schools: '🏫',
}

export default function Businesses() {
  const { language, favorites = [], toggleFavorite } = useOutletContext<{
    language: Language
    favorites: string[]
    toggleFavorite: (id: string) => void
  }>()
  const [searchParams] = useSearchParams()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState('All Listings')
  const navigate = useNavigate()

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget
    const categoryFallbackImage = getCategoryImage(target.dataset.category)
    if (target.src !== categoryFallbackImage) {
      target.onerror = null
      target.src = categoryFallbackImage
    }
  }

  useEffect(() => {
    const categoryId = searchParams.get('categoryId')
    const fetchPath = categoryId ? `/api/businesses?categoryId=${categoryId}` : '/api/businesses'

    Promise.all([
      fetchJson(fetchPath),
      fetchJson('/api/categories'),
    ]).then(([businessRes, categoryRes]) => {
      setBusinesses(businessRes.data || [])
      setCategories(categoryRes.data || [])

      if (categoryId) {
        const category = (categoryRes.data || []).find((item: any) => item.id === categoryId)
        setCategoryName(category?.name || 'All Listings')
      } else {
        setCategoryName('All Listings')
      }
    })
  }, [searchParams])

  const isEducationRoot = categoryName === 'Education' || searchParams.get('categoryId') === '1'
  const isHospitalRoot = categoryName === 'Hospitals' || searchParams.get('categoryId') === '2'
  const isMedicalShopRoot = categoryName === 'Medical shops' || searchParams.get('categoryId') === '3'
  const isRestaurantRoot = categoryName === 'Restaurants' || searchParams.get('categoryId') === '4'
  const isFoodHotelRoot = categoryName === 'Food Hotels' || searchParams.get('categoryId') === '5'
  const educationSubcategories = categories.filter((item: any) => item.parentId === '1')

  const getBusinessHours = (b: any) => {
    if (b.hours) return b.hours
    if (b.categoryId === '3') {
      if (b.name.toLowerCase().includes('24')) return 'Open 24 hours'
      if (b.name.toLowerCase().includes('apollo')) return 'Open • Closes 11 pm'
      if (b.name.toLowerCase().includes('medplus')) return 'Open • Closes 11 pm'
      if (b.name.toLowerCase().includes('sree') || b.name.toLowerCase().includes('rama')) return 'Open • Closes 10 pm'
      return 'Open • Closes 10 pm'
    }
    if (b.categoryId === '4' || b.categoryId === '5') {
      if (b.name.toLowerCase().includes('family') || b.name.toLowerCase().includes('restaurant')) return 'Open • Closes 10 pm'
      return 'Open • Closes 11 pm'
    }
    return 'Open 24 hours'
  }

  if (isEducationRoot) {
    return (
      <div className="mobile-content">
        <div className="page-topbar">
          <button className="back-btn compact" type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
          <div className="page-topbar-title-wrap">
            <p className="page-topbar-label">Directory</p>
            <h2>{getCategoryName('Education', language)}</h2>
          </div>
          <Link to="/categories" className="view-all small">{t('changeCategory', language)}</Link>
        </div>

        <div className="education-segment-list">
          {educationSubcategories.map((item: any) => {
            const subCount = businesses.filter((b: any) => b.categoryId === item.id).length
            return (
              <Link
                key={item.id}
                to={`/businesses?categoryId=${item.id}`}
                className="education-segment-item"
              >
                <div className="education-segment-info">
                  <div className="education-segment-icon">{educationIcons[item.name] || '📚'}</div>
                  <div className="education-segment-text">
                    <div className="education-segment-name">{getCategoryName(item.name, language)}</div>
                    <div className="education-segment-count">{subCount} {t('listings', language)}</div>
                  </div>
                </div>
                <div className="category-list-arrow">›</div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  if (isHospitalRoot || isMedicalShopRoot || isRestaurantRoot || isFoodHotelRoot) {
    return (
      <div className="mobile-content">
        <div className="page-topbar">
          <button className="back-btn compact" type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
          <div className="page-topbar-title-wrap">
            <p className="page-topbar-label">Directory</p>
            <h2>{getCategoryName(
              isMedicalShopRoot ? 'Medical shops' :
              isRestaurantRoot ? 'Restaurants' :
              isFoodHotelRoot ? 'Food Hotels' : 'Hospitals',
              language
            )}</h2>
          </div>
          <Link to="/categories" className="view-all small">{t('changeCategory', language)}</Link>
        </div>

        <div className="hospital-search-list">
          {businesses.map((b: any) => (
            <div key={b.id} className="hospital-search-item">
              <div className="hospital-search-main">
                <div className="hospital-search-thumb">
                  <img src={b.image || getCategoryImage(b.categoryName)} data-category={b.categoryName} alt={b.name} onError={handleImageError} />
                </div>
                <div className="hospital-search-copy">
                  <div className="hospital-search-title-row">
                    <h3>{b.name}</h3>
                    <button
                      type="button"
                      className={`favorite-badge ${favorites.includes(b.id) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(b.id)}
                      aria-label={favorites.includes(b.id) ? `Remove ${b.name} from favourites` : `Save ${b.name} to favourites`}
                    >
                      {favorites.includes(b.id) ? '♥' : '♡'}
                    </button>
                    <button type="button" className="hospital-pin-btn" aria-label="Directions">📍</button>
                  </div>

                  <div className="hospital-search-rating-row">
                    <span className="rating-score">{b.rating || '4.0'}</span>
                    <span className="stars">★★★★★</span>
                    <span className="review-count">({b.reviews || 279})</span>
                    <span className="pill">{isRestaurantRoot || isFoodHotelRoot ? 'Restaurant' : isMedicalShopRoot ? 'Pharmacy' : 'Hospital'}</span>
                  </div>

                  <div className="hospital-search-phone">{b.phone}</div>
                  <div className="hospital-search-status">{getBusinessHours(b)}</div>
                  <p className="hospital-search-description">{b.description}</p>
                </div>
              </div>
              <div className="hospital-search-actions">
                <button type="button" className="direction-btn">Directions</button>
                <button type="button" className="website-btn">Website</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-content">
      <div className="page-topbar">
        <button className="back-btn compact" type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <div className="page-topbar-title-wrap">
          <p className="page-topbar-label">Directory</p>
          <h2>{getCategoryName(categoryName, language)}</h2>
        </div>
        <Link to="/categories" className="view-all small">{t('changeCategory', language)}</Link>
      </div>

      <div className="business-list">
        {businesses.map(b => (
          <Link key={b.id} to={`/business/${b.id}`} className="business-card">
            <div className="business-card-image">
              <img src={b.image || getCategoryImage(b.categoryName)} data-category={b.categoryName} alt={b.name} onError={handleImageError} />
            </div>
            <div className="business-card-content">
              <div className="business-name">{b.name}</div>
              <div className="business-meta">
                <span className="business-category">{getCategoryName(b.categoryName, language)}</span>
              </div>
              <div className="business-address">📍 {b.address}</div>
            </div>
          </Link>
        ))}
        {businesses.length === 0 && (
          <div className="empty-state">{t('noListingsFound', language)}</div>
        )}
      </div>
    </div>
  )
}
