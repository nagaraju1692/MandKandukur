import React, {useEffect,useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchJson } from '../services/api'
import { Language, getCategoryName, t } from '../i18n'
import { useOutletContext } from 'react-router-dom'
import getCategoryImage from '../utils/categoryImages'
import fallbackCategoryImage from '../images/TRR_GDC_main.jpg'

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

export default function Categories(){
  const { language } = useOutletContext<{ language: Language }>()
  const [categories,setCategories]=useState<any[]>([])
  const [businesses,setBusinesses]=useState<any[]>([])
  const [isEducationExpanded, setIsEducationExpanded] = useState(false)
  const navigate = useNavigate()

  const handleCategoryImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    if (image.src !== fallbackCategoryImage) {
      image.onerror = null
      image.src = fallbackCategoryImage
    }
  }

  useEffect(()=>{
    Promise.all([
      fetchJson('/api/categories'),
      fetchJson('/api/businesses'),
    ]).then(([catRes, busRes]) => {
      setCategories(catRes.data || [])
      setBusinesses(busRes.data || [])
    })
  },[])

  const educationCategories = categories.filter(c => c.parentId === '1')
  const otherCategories = categories.filter(c => !c.parentId && c.name !== 'Education')
  
  return (
    <div className="mobile-content">
      <div className="page-topbar">
        <button className="back-btn compact" type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <div className="page-topbar-title-wrap">
          <p className="page-topbar-label">Explore</p>
          <h2>{t('allCategories', language)}</h2>
        </div>
        <Link to="/" className="view-all small">Home</Link>
      </div>
      <div className="category-list">
        <div className="category-group education-group">
          <button
            type="button"
            className="category-group-header"
            onClick={() => setIsEducationExpanded(!isEducationExpanded)}
            aria-expanded={isEducationExpanded}
          >
            <div className="category-group-info">
              <div className="category-list-icon category-list-image-wrap">
                <img src={getCategoryImage('Education')} alt="" onError={handleCategoryImageError} />
                <span>🎓</span>
              </div>
              <div className="category-group-text">
                <div className="category-group-title">{getCategoryName('Education', language)}</div>
                <div className="category-group-count">{educationCategories.length} {t('listings', language)}</div>
              </div>
            </div>
            <div className="category-list-arrow">{isEducationExpanded ? '˄' : '›'}</div>
          </button>

          {isEducationExpanded && (
            <div className="category-sublist">
              {educationCategories.map(c => {
                const icon = categoryIcons[c.name] || '📌'
                const count = businesses.filter(b => b.categoryId === c.id).length

                return (
                  <Link
                    key={c.id}
                    to={`/businesses?categoryId=${c.id}`}
                    className="category-subitem"
                  >
                    <div className="category-subitem-info">
                      <div className="category-subitem-icon category-list-image-wrap">
                        <img src={getCategoryImage(c.name)} alt="" onError={handleCategoryImageError} />
                        <span>{icon}</span>
                      </div>
                      <div className="category-subitem-name">{getCategoryName(c.name, language)}</div>
                    </div>
                    <span className="category-subitem-count">{count}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {otherCategories.map(c=>{
          const icon = categoryIcons[c.name] || '📌'
          const count = businesses.filter(b => b.categoryId === c.id).length
          return (
            <Link
              key={c.id}
              to={`/businesses?categoryId=${c.id}`}
              className="category-list-item"
            >
              <div className="category-list-info">
                <div className="category-list-icon category-list-image-wrap">
                  <img src={getCategoryImage(c.name)} alt="" onError={handleCategoryImageError} />
                  <span>{icon}</span>
                </div>
                <div className="category-list-text">
                  <div className="category-list-name">{getCategoryName(c.name, language)}</div>
                  <div className="category-list-count">{count} {t('listings', language)}</div>
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
