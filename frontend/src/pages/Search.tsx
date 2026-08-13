import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchJson } from '../services/api'
import { Language, getCategoryName, t } from '../i18n'
import { useOutletContext } from 'react-router-dom'
import getCategoryImage from '../utils/categoryImages'

const fallbackImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'

const editDistance = (left: string, right: string): number => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}

const isSimilarWord = (queryWord: string, recordWord: string): boolean => {
  if (recordWord.includes(queryWord) || queryWord.includes(recordWord)) return true
  if (queryWord.length < 4 || recordWord.length < 4) return false
  const allowedDistance = queryWord.length >= 8 ? 2 : 1
  return editDistance(queryWord, recordWord) <= allowedDistance
}

export default function Search() {
  const { language, favorites = [], toggleFavorite, openLoginModal, user } = useOutletContext<any>()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    fetchJson('/api/businesses').then(res => {
      const all = res.data || []
      setBusinesses(all)
    })
  }, [])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults(businesses)
      return
    }
    const filtered = businesses.filter(b => {
      const searchableText = `${b.name || ''} ${b.address || ''} ${b.categoryName || ''}`.toLowerCase()
      if (searchableText.includes(q)) return true

      const queryWords = q.split(/\s+/).filter(Boolean)
      const recordWords = searchableText.split(/[^a-z0-9]+/).filter(Boolean)
      return queryWords.every(queryWord => recordWords.some(recordWord => isSimilarWord(queryWord, recordWord)))
    })
    setResults(filtered)
  }, [query, businesses])

  return (
    <div className="mobile-content">
      <div className="page-topbar">
        <button className="back-btn compact" type="button" onClick={() => navigate(-1)} aria-label="Go back">←</button>
        <div className="page-topbar-title-wrap">
          <p className="page-topbar-label">Search</p>
          <h2>Find places</h2>
        </div>
      </div>

      <div className="search-container">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              placeholder={t('searchPlaceholder', language)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 28px' }}>
        <div className="business-list">
          {results.map(b => (
            <Link key={b.id} to={`/business/${b.id}`} className="business-card">
              <div className="business-card-image">
                <img src={b.image || getCategoryImage(b.categoryName)} alt={b.name} onError={(e: any) => (e.currentTarget.src = getCategoryImage(b.categoryName))} />
                <button
                  type="button"
                  className={`favorite-badge ${favorites.includes(b.id) ? 'active' : ''}`}
                  onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); if (!user) return openLoginModal(); toggleFavorite(b.id) }}
                  aria-label={favorites.includes(b.id) ? `Remove ${b.name} from favourites` : `Save ${b.name} to favourites`}
                >
                  {favorites.includes(b.id) ? '♥' : '♡'}
                </button>
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
          {results.length === 0 && (
            <div className="empty-state">No results</div>
          )}
        </div>
      </div>
    </div>
  )
}
