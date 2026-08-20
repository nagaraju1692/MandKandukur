import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as Location from 'expo-location'
import { geocodeAddress } from '../services/api'

type Coordinates = { latitude: number; longitude: number }
type NearbyContextValue = {
  ready: boolean
  location: Coordinates | null
  distances: Record<string, number>
  ensureAddresses: (addresses: Array<string | { id: string; address: string; latitude?: number | null; longitude?: number | null }>) => void
  sortNearest: <T extends { id: string; address: string }>(items: T[]) => T[]
}

const NearbyContext = createContext<NearbyContextValue | undefined>(undefined)

function distanceInKm(origin: Coordinates, target: Coordinates) {
  const earthRadius = 6371
  const latitudeDelta = (target.latitude - origin.latitude) * Math.PI / 180
  const longitudeDelta = (target.longitude - origin.longitude) * Math.PI / 180
  const originLatitude = origin.latitude * Math.PI / 180
  const targetLatitude = target.latitude * Math.PI / 180
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(originLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function NearbyProvider({ children }: { children: React.ReactNode }) {
  const [origin, setOrigin] = useState<Coordinates | null>(null)
  const [distances, setDistances] = useState<Record<string, number>>({})
  const [addressCache, setAddressCache] = useState<Record<string, Coordinates>>({})
  const [ready, setReady] = useState(false)
  const originRef = useRef(origin)
  const addressCacheRef = useRef(addressCache)
  const distancesRef = useRef(distances)

  const fallbackOrigin: Coordinates = { latitude: 15.2154, longitude: 79.9072 }

  useEffect(() => { originRef.current = origin }, [origin])
  useEffect(() => { addressCacheRef.current = addressCache }, [addressCache])
  useEffect(() => { distancesRef.current = distances }, [distances])

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined
    const startTracking = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync()
        if (permission.status !== 'granted') {
          setOrigin({ latitude: 15.2154, longitude: 79.9072 })
          return
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 100, timeInterval: 60000 },
          (nextPosition) => setOrigin({ latitude: nextPosition.coords.latitude, longitude: nextPosition.coords.longitude }),
        )
      } catch {
        setOrigin({ latitude: 15.2154, longitude: 79.9072 })
      } finally {
        setReady(true)
      }
    }
    startTracking()
    return () => subscription?.remove()
  }, [])

  useEffect(() => {
    if (!origin && !addressCacheRef.current) return
    const currentOrigin = origin ?? fallbackOrigin
    const nextDistances = { ...distancesRef.current }
    Object.entries(addressCacheRef.current).forEach(([key, coordinates]) => {
      if (!coordinates) return
      const distance = distanceInKm(currentOrigin, coordinates)
      nextDistances[key] = distance
    })
    distancesRef.current = nextDistances
    setDistances(nextDistances)
  }, [origin])

  const ensureAddresses = useCallback((addresses: Array<string | { id: string; address: string; latitude?: number | null; longitude?: number | null }>) => {
    const currentOrigin = originRef.current ?? fallbackOrigin

    const entries = addresses.map((entry) => typeof entry === 'string' ? { id: entry, address: entry } : entry)
    const unique = entries.filter((entry) => {
      if (!entry.address) return false
      const idKey = entry.id ?? entry.address
      return !addressCacheRef.current[idKey] && !addressCacheRef.current[entry.address]
    })
    if (unique.length === 0) return

    Promise.all(unique.map(async (entry) => {
      if (entry.latitude != null && entry.longitude != null) {
        return { id: entry.id, address: entry.address, coordinates: { latitude: entry.latitude, longitude: entry.longitude } }
      }
      return { id: entry.id, address: entry.address, coordinates: await geocodeAddress(entry.address) }
    }))
      .then((results) => {
        const nextCache = { ...addressCacheRef.current }
        const nextDistances = { ...distancesRef.current }
        results.forEach(({ id, address, coordinates }) => {
          if (!coordinates) return
          const key = id || address
          nextCache[key] = coordinates
          nextCache[address] = coordinates
          const distance = distanceInKm(currentOrigin, coordinates)
          nextDistances[key] = distance
          nextDistances[address] = distance
        })
        setAddressCache(nextCache)
        setDistances(nextDistances)
      })
      .catch(() => undefined)
  }, [])

  const sortNearest = useCallback(<T extends { id: string; address: string }>(items: T[]) => items.slice().sort((first, second) => {
    const firstDistance = distances[first.id] ?? distances[first.address]
    const secondDistance = distances[second.id] ?? distances[second.address]
    if (firstDistance !== undefined && secondDistance !== undefined) return firstDistance - secondDistance
    if (firstDistance !== undefined) return -1
    if (secondDistance !== undefined) return 1
    return Number(!first.address.toLowerCase().includes('kandukur')) - Number(!second.address.toLowerCase().includes('kandukur'))
  }), [distances])

  const value = useMemo(() => ({ ready, location: origin, distances, ensureAddresses, sortNearest }), [ready, origin, distances, ensureAddresses, sortNearest])
  return <NearbyContext.Provider value={value}>{children}</NearbyContext.Provider>
}

export function useNearby() {
  const context = useContext(NearbyContext)
  if (!context) throw new Error('useNearby must be used within NearbyProvider')
  return context
}
