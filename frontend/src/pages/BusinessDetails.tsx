import React, {useEffect,useState} from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { fetchJson } from '../services/api'
import getCategoryImage from '../utils/categoryImages'

export default function BusinessDetails(){
  const { id } = useParams<{id:string}>()
  const navigate = useNavigate()
  const [b,setB] = useState<any>(null)
  const { favorites = [], toggleFavorite, user } = useOutletContext<{
    favorites: string[]
    toggleFavorite: (id: string) => void
    user: { name: string; phone: string } | null
  }>()
  const categoryFallbackImage = getCategoryImage(b?.categoryName)

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget
    if (target.src !== categoryFallbackImage) {
      target.onerror = null
      target.src = categoryFallbackImage
    }
  }

  const handleDirections = () => {
    if (!b?.address) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`, '_blank', 'noopener,noreferrer')
  }

  const handleShare = async () => {
    if (!b) return
    const shareText = `${b.name} - ${b.address}`
    if (navigator.share) {
      try {
        await navigator.share({ title: b.name, text: shareText, url: window.location.href })
      } catch (error) {
        navigator.clipboard?.writeText(window.location.href)
      }
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }
  
  useEffect(()=>{ 
    if(id) fetchJson(`/api/businesses/${id}`).then(r=>setB(r.data)) 
  },[id])
  
  if(!b) return (
    <div className="mobile-content">
      <div className="loading-state">Loading...</div>
    </div>
  )
  
  return (
    <div className="business-details-container">
      <div className="business-details-header">
        <div className="business-details-image">
          <img src={b.image || getCategoryImage(b.categoryName)} alt={b.name} onError={handleImageError} />
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        </div>
      </div>

      <div className="business-info-header">
        <h2 className="business-details-title">{b.name}</h2>
        <div className="business-details-meta">
          <span>{b.categoryName}</span>
          <span className="status-badge">Open</span>
        </div>
        <div className="rating-section">
          <span className="star">⭐⭐⭐⭐⭐</span>
          <span>4.3 (88 reviews)</span>
        </div>
      </div>

      <div className="details-action-bar">
        <button className="action-btn" onClick={() => window.location.href=`tel:${b.phone}`}>
          <span className="action-icon">📞</span>
          Call
        </button>
        <button className="action-btn" onClick={handleDirections}>
          <span className="action-icon">📍</span>
          Directions
        </button>
        <button className="action-btn" onClick={handleShare}>
          <span className="action-icon">🔗</span>
          Share
        </button>
        <button className="action-btn" onClick={() => toggleFavorite(b.id)}>
          <span className="action-icon">{favorites.includes(b.id) ? '♥' : '♡'}</span>
          {favorites.includes(b.id) ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="details-content">
        <div className="details-section">
          <h3>About this place</h3>
          <p>{b.description || 'Discover everything this business has to offer. Visit us for an exceptional experience.'}</p>
        </div>

        {b.phone && (
          <div className="details-section">
            <h3>Contact Information</h3>
            <p>📞 <strong>{b.phone}</strong></p>
            {b.address && <p>📍 {b.address}</p>}
            {b.website && <p>🌐 <a href={b.website} target="_blank" rel="noreferrer">{b.website}</a></p>}
          </div>
        )}

        <div className="details-section">
          <h3>Popular Services</h3>
          <div className="service-tags">
            <span className="service-tag">General Services</span>
            <span className="service-tag">Consultation</span>
            <span className="service-tag">Support</span>
            <span className="service-tag">Premium</span>
            <span className="service-tag">Extended Hours</span>
          </div>
        </div>

        <div className="details-section">
          <h3>Hours</h3>
          <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
          <p>Saturday: 9:00 AM - 2:00 PM</p>
          <p>Sunday: Closed</p>
        </div>

        <div className="details-section">
          <h3>{`Photos (${(b.gallery || []).length || 4})`}</h3>
          <div className="photo-gallery">
            {(b.gallery || []).slice(0, 4).map((image: string, index: number) => (
              <img
                key={`${b.id}-${index}`}
                src={image || categoryFallbackImage}
                alt={`${b.name} gallery ${index + 1}`}
                className="photo-thumb"
                onError={handleImageError}
              />
            ))}
          </div>
        </div>

        <div style={{marginTop: '24px', marginBottom: '32px'}}>
          <button className="btn">Write a Review</button>
        </div>
      </div>
    </div>
  )
}
