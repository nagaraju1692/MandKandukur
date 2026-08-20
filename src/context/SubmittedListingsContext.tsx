import React, { createContext, useContext, useMemo } from 'react'
import { fetchJson } from '../services/api'
import { Business, useDirectory } from './DirectoryContext'
import { useAuth } from './AuthContext'

export type SubmittedListing = {
  id: string
  name: string
  nameTe?: string
  categoryName: string
  categoryId: string
  address: string
  latitude?: number | null
  longitude?: number | null
  phone: string
  ownerName?: string
  rooms?: string
  price?: string
  facing?: string
  description: string
  website: string
  image?: string
  gallery?: string[]
  submittedBy: string
  createdBy: string
  status: 'Approved' | 'Pending review' | 'Rejected' | 'Sold out'
}

type SubmittedListingsValue = {
  listings: SubmittedListing[]
  addListing: (listing: Omit<SubmittedListing, 'id' | 'status'> & { image?: string; gallery?: string[] }) => Promise<void>
  markSoldOut: (listingId: string) => Promise<void>
}

const SubmittedListingsContext = createContext<SubmittedListingsValue | undefined>(undefined)

export function SubmittedListingsProvider({ children }: { children: React.ReactNode }) {
  const { refreshBusinesses } = useDirectory()
  const { user } = useAuth()
  const [listings, setListings] = React.useState<SubmittedListing[]>([])

  React.useEffect(() => {
    if (!user) {
      setListings([])
      return
    }
    console.log('📋 Loading submissions for user:', user.phone)
    fetchJson<{ data: SubmittedListing[] }>(`/api/users/${user.phone}/submissions`, undefined, user.phone)
      .then((response) => {
        console.log('✅ Submissions loaded:', response.data.length)
        setListings(response.data)
      })
      .catch((error) => {
        console.error('❌ Failed to load submissions:', error.message)
        setListings([])
      })
  }, [user])

  const addListing = async (listing: Omit<SubmittedListing, 'id' | 'status'>) => {
    if (!user) throw new Error('Sign in before submitting a business')
    console.log('📤 Submitting business listing:', { name: listing.name, categoryId: listing.categoryId, address: listing.address })
    try {
      const response = await fetchJson<{ data: Business }>('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
      }, user.phone)
      console.log('✅ Business submitted successfully:', response.data)
      try { await refreshBusinesses() } catch (err) { console.warn('⚠️ Failed to refresh businesses after submission:', err) }
      const submissionsResponse = await fetchJson<{ data: SubmittedListing[] }>(`/api/users/${user.phone}/submissions`, undefined, user.phone)
      console.log('✅ Submissions refreshed:', submissionsResponse.data.length)
      setListings(submissionsResponse.data)
    } catch (error) {
      console.error('❌ Failed to submit business:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  const markSoldOut = async (listingId: string) => {
    if (!user) throw new Error('Sign in before updating a listing')
    console.log('🔄 Marking listing as sold out:', listingId)
    try {
      await fetchJson<{ data: Business }>(`/api/businesses/${encodeURIComponent(listingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Sold out' }),
      }, user.phone)
      console.log('✅ Listing marked as sold out')
      try { await refreshBusinesses() } catch (err) { console.warn('⚠️ Failed to refresh businesses:', err) }
      setListings((current) => current.map((listing) => listing.id === listingId ? { ...listing, status: 'Sold out' } : listing))
    } catch (error) {
      console.error('❌ Failed to mark listing as sold out:', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  const value = useMemo(() => ({ listings, addListing, markSoldOut }), [listings])
  return <SubmittedListingsContext.Provider value={value}>{children}</SubmittedListingsContext.Provider>
}

export function useSubmittedListings() {
  const context = useContext(SubmittedListingsContext)
  if (!context) throw new Error('useSubmittedListings must be used within SubmittedListingsProvider')
  return context
}
