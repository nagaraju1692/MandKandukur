import React, { useEffect, useState } from 'react'
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLanguage } from '../context/LanguageContext'
// Metro resolves this import to the platform-specific map component.
// @ts-expect-error TypeScript does not apply React Native platform resolution.
import LocationPickerMap from './LocationPickerMap'

interface LocationPickerModalProps {
  visible: boolean
  initialLatitude?: number
  initialLongitude?: number
  onLocationSelected: (latitude: number, longitude: number) => void
  onClose: () => void
}

export default function LocationPickerModal({
  visible,
  initialLatitude,
  initialLongitude,
  onLocationSelected,
  onClose,
}: LocationPickerModalProps) {
  const { t } = useLanguage()
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialLatitude && initialLongitude ? { latitude: initialLatitude, longitude: initialLongitude } : null,
  )

  useEffect(() => {
    if (initialLatitude != null && initialLongitude != null) {
      setSelectedLocation({ latitude: initialLatitude, longitude: initialLongitude })
      return
    }

    if (!visible) {
      setSelectedLocation(null)
    }
  }, [visible, initialLatitude, initialLongitude])

  const handleMapPress = (event: any) => {
    const coordinate = event?.nativeEvent?.coordinate ?? event
    if (!coordinate || typeof coordinate.latitude !== 'number' || typeof coordinate.longitude !== 'number') return
    setSelectedLocation({ latitude: coordinate.latitude, longitude: coordinate.longitude })
  }

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert(t('Location required', 'Location required'), t('Please tap the map to select a location.', 'Please tap the map to select a location.'))
      return
    }
    onLocationSelected(selectedLocation.latitude, selectedLocation.longitude)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('Choose location on map', 'Choose location on map')}</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </Pressable>
        </View>

        <LocationPickerMap
          selectedLocation={selectedLocation}
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          selectedLabel={t('Selected location', 'Selected location')}
          onPress={handleMapPress}
        />

        <View style={styles.footer}>
          {selectedLocation && <Text style={styles.coordinateText}>{selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}</Text>}
          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t('Cancel', 'Cancel')}</Text>
            </Pressable>
            <Pressable style={[styles.confirmButton, !selectedLocation && styles.disabledButton]} disabled={!selectedLocation} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>{t('Use this location', 'Use this location')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E3D8D3', backgroundColor: '#FFFDFB' },
  headerTitle: { color: '#202332', fontSize: 16, fontWeight: '800' },
  closeButton: { fontSize: 24, color: '#302C2A', paddingHorizontal: 8 },
  map: { flex: 1 },
  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E3D8D3', backgroundColor: '#FFFDFB' },
  coordinateText: { color: '#2E7D32', fontSize: 12, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1', backgroundColor: '#FFFCFA', alignItems: 'center' },
  cancelButtonText: { color: '#302C2A', fontSize: 14, fontWeight: '800' },
  confirmButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#514BD5', alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  confirmButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
})
