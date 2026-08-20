import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchJson } from '../services/api'
import { useAuth } from './AuthContext'

type Review = {
  id: string
  businessId: string
  userPhone: string
  rating: number
  comment: string
  createdAt: string
}

type ReviewContextValue = {
  getReviewStats: (businessId: string) => { rating: number; count: number }
  getReviews: (businessId: string) => Review[]
  submitReview: (businessId: string, rating: number, comment: string) => Promise<void>
  loading: boolean
  error: string | null
  retry: () => Promise<void>
}

const ReviewContext = createContext<ReviewContextValue | undefined>(undefined)

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchJson<{ data: Review[] }>('/api/reviews')
      setReviews(response.data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReviews() }, [])

  const getReviewStats = (businessId: string) => {
    const businessReviews = reviews.filter((review) => review.businessId === businessId)
    if (businessReviews.length === 0) return { rating: 0, count: 0 }
    const average = businessReviews.reduce((total, review) => total + review.rating, 0) / businessReviews.length
    return { rating: Number(average.toFixed(1)), count: businessReviews.length }
  }

  const getReviews = (businessId: string) => reviews.filter((review) => review.businessId === businessId)

  const submitReview = async (businessId: string, rating: number, comment: string) => {
    if (!user) throw new Error('Sign in before submitting a review')
    const response = await fetchJson<{ data: Review }>(`/api/businesses/${encodeURIComponent(businessId)}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPhone: user.phone, rating, comment }),
    }, user.phone)
    setReviews((current) => [...current, response.data])
  }

  const value = useMemo(() => ({ getReviewStats, getReviews, submitReview, loading, error, retry: loadReviews }), [reviews, loading, error])
  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>
}

export function useReviews() {
  const context = useContext(ReviewContext)
  if (!context) throw new Error('useReviews must be used within ReviewProvider')
  return context
}
