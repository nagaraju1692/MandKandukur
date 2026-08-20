import React, { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native'

export interface LocationPickerMapProps {
  selectedLocation: { latitude: number; longitude: number } | null
  initialLatitude?: number
  initialLongitude?: number
  selectedLabel: string
  onPress: (event: { latitude: number; longitude: number }) => void
}

export default function LocationPickerMap({
  selectedLocation,
  initialLatitude,
  initialLongitude,
  selectedLabel,
  onPress,
}: LocationPickerMapProps) {
  const baseLatitude = selectedLocation?.latitude ?? initialLatitude ?? 15.2154
  const baseLongitude = selectedLocation?.longitude ?? initialLongitude ?? 79.9072
  const [markerPosition, setMarkerPosition] = useState<ViewStyle>({ left: '50%', top: '50%' })

  const mapUri = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#f3efe9"/>
        <g fill="none" stroke="#d9d0ca" stroke-width="20" stroke-linecap="round" opacity="0.8">
          <path d="M-80 170 L300 40 L460 140 L820 0"/>
          <path d="M0 480 L280 310 L540 390 L850 300"/>
          <path d="M170 -80 L110 630"/>
          <path d="M520 -30 L620 650"/>
          <path d="M700 0 L760 620"/>
        </g>
        <g fill="none" stroke="#c8bcb3" stroke-width="10" opacity="0.7">
          <path d="M0 240 L250 150 L400 210 L800 140"/>
          <path d="M90 360 L350 420 L480 330 L760 420"/>
        </g>
        <g fill="#d6c8bb">
          <circle cx="180" cy="150" r="18"/>
          <circle cx="560" cy="180" r="16"/>
          <circle cx="320" cy="450" r="22"/>
          <circle cx="650" cy="330" r="20"/>
          <circle cx="470" cy="520" r="15"/>
        </g>
        <g fill="#b7a9a2" opacity="0.9">
          <rect x="120" y="80" width="90" height="50" rx="14"/>
          <rect x="550" y="430" width="110" height="52" rx="14"/>
        </g>
      </svg>
    `

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }, [])

  const handleTap = (event: any) => {
    const pageX = typeof event?.nativeEvent?.pageX === 'number' ? event.nativeEvent.pageX : undefined
    const pageY = typeof event?.nativeEvent?.pageY === 'number' ? event.nativeEvent.pageY : undefined
    const target = event?.currentTarget ?? event?.target
    const width = target?.clientWidth || 300
    const height = target?.clientHeight || 420

    const touchX = typeof pageX === 'number' ? pageX - (target?.getBoundingClientRect?.().left || 0) : width / 2
    const touchY = typeof pageY === 'number' ? pageY - (target?.getBoundingClientRect?.().top || 0) : height / 2

    const latitudeDelta = 0.2
    const longitudeDelta = 0.3
    const nextLatitude = baseLatitude + (0.5 - touchY / height) * latitudeDelta
    const nextLongitude = baseLongitude + (touchX / width - 0.5) * longitudeDelta

    setMarkerPosition({
      left: `${Math.min(Math.max((touchX / width) * 100, 8), 92)}%`,
      top: `${Math.min(Math.max((touchY / height) * 100, 12), 88)}%`,
    })

    onPress({
      latitude: Number(nextLatitude.toFixed(6)),
      longitude: Number(nextLongitude.toFixed(6)),
    })
  }

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <Image source={{ uri: mapUri }} style={styles.mapImage} resizeMode="cover" />

      <View style={[styles.marker, markerPosition]} pointerEvents="none">
        <View style={styles.markerDot} />
      </View>

      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.title}>Tap to choose a location</Text>
        <Text style={styles.text}>{selectedLabel}</Text>
        <Text style={styles.coords}>Current coordinates: {baseLatitude.toFixed(5)}, {baseLongitude.toFixed(5)}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F6F3F2',
    borderTopWidth: 1,
    borderTopColor: '#E3D8D3',
    overflow: 'hidden',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202332',
    marginTop: 26,
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    color: '#4B4B5A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  coords: {
    color: '#3D3D57',
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  marker: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#514BD5',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
})
