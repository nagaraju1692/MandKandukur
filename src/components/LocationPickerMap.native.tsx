import React from 'react'
import { StyleSheet } from 'react-native'
import MapView, { Marker, MapPressEvent } from 'react-native-maps'

export interface LocationPickerMapProps {
  selectedLocation: { latitude: number; longitude: number } | null
  initialLatitude?: number
  initialLongitude?: number
  selectedLabel: string
  onPress: (event: MapPressEvent) => void
}

export default function LocationPickerMap({
  selectedLocation,
  initialLatitude,
  initialLongitude,
  selectedLabel,
  onPress,
}: LocationPickerMapProps) {
  const initialRegion = {
    latitude: selectedLocation?.latitude || initialLatitude || 15.2154,
    longitude: selectedLocation?.longitude || initialLongitude || 79.9072,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      onPress={onPress}
      showsUserLocation
      zoomEnabled
      scrollEnabled
    >
      {selectedLocation && <Marker coordinate={selectedLocation} title={selectedLabel} />}
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
})
