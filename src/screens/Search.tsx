import React, { useMemo, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import { getBusinessImage } from '../utils/categoryImages'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useNearby } from '../context/NearbyContext'
import { useDirectory } from '../context/DirectoryContext'
import { buildGoogleMapsDirectionsUrl } from '../services/api'
import { colors } from '../ui/theme'
import FocusTextInput from '../ui/FocusTextInput'
import { useVoiceSearch } from '../ui/useVoiceSearch'

export default function Search({ navigation, route }: any) {
  const [query, setQuery] = useState(route.params?.query || '')
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)
  const { favorites, toggleFavorite, isLoggedIn } = useAuth()
  const { t, category: categoryLabel, businessName } = useLanguage()
  const { distances, ready, ensureAddresses, sortNearest, location } = useNearby()
  const { businesses } = useDirectory()
  const { recognizing, handleVoiceSearch } = useVoiceSearch({ t, onResult: (transcript) => setQuery(transcript) })

  React.useEffect(() => {
    setQuery(route.params?.query || '')
  }, [route.params?.query])

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return businesses.slice(0, 30)
    return businesses.filter((business) => `${business.name} ${business.categoryName} ${business.address}`.toLowerCase().includes(normalized)).slice(0, 30)
  }, [businesses, query])
  React.useEffect(() => { if (ready) ensureAddresses(results.map((business) => ({ id: business.id, address: business.address, latitude: business.latitude, longitude: business.longitude }))) }, [results, ready, ensureAddresses])

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.pageHeading}><Pressable style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></Pressable><View><Text style={styles.kicker}>{t('SEARCH', 'శోధన')}</Text><Text style={styles.title}>{t('Find places', 'ప్రదేశాలను కనుగొనండి')}</Text></View></View>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <FocusTextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('Search businesses, categories...', 'వ్యాపారాలు, వర్గాలను శోధించండి...')}
            placeholderTextColor="#77798A"
            style={styles.input}
            underlineColorAndroid="transparent"
            selectionColor="#D35B50"
          />
          <Pressable
            style={[styles.voiceButton, recognizing && styles.voiceButtonActive]}
            onPress={handleVoiceSearch}
            accessibilityRole="button"
            accessibilityLabel={recognizing ? t('Stop voice search', 'వాయిస్ శోధనను ఆపండి') : t('Search by voice', 'వాయిస్‌తో శోధించండి')}
            accessibilityState={{ busy: recognizing }}
          >
            <Ionicons name={recognizing ? 'stop' : 'mic'} size={21} color={recognizing ? '#FFFFFF' : '#D35B50'} />
          </Pressable>
        </View>

        {query.trim() && results.length === 0 && <Text style={styles.empty}>{t('No matching places found.', 'సరిపోలే ప్రదేశాలు కనుగొనబడలేదు.')}</Text>}
        {sortNearest(results).map((business) => (
          <Pressable key={business.id} style={styles.resultCard} onPress={() => { setSelectedResultId(business.id); navigation.navigate('BusinessDetails', { id: business.id }) }}>
            <View style={[styles.resultImageWrap, selectedResultId === business.id && styles.resultImageWrapSelected]}><Image source={getBusinessImage(business.image, business.categoryName)} style={styles.image} /><Pressable style={styles.favoriteButton} onPress={() => isLoggedIn ? toggleFavorite(business.id) : navigation.navigate('Profile')}><Text style={[styles.favorite, favorites.includes(business.id) && styles.favoriteActive]}>{favorites.includes(business.id) ? '♥' : '♡'}</Text></Pressable></View>
            <View style={styles.resultBody}><Text style={styles.name}>{businessName(business.name, business.nameTe)}</Text><Text style={styles.category}>{categoryLabel(business.categoryName)}</Text><Text style={styles.address}>📍 {business.address}</Text><Text style={styles.distance}>{(distances[business.id] ?? distances[business.address]) !== undefined ? `${((distances[business.id] ?? distances[business.address]) as number).toFixed(1)} ${t('km away', 'కి.మీ దూరంలో')}` : t('Finding distance…', 'దూరాన్ని కనుగొంటున్నాము…')}</Text><Pressable onPress={() => Linking.openURL(buildGoogleMapsDirectionsUrl({ latitude: business.latitude, longitude: business.longitude, address: business.address }, location ?? undefined))}><Text style={styles.linkText}>{t('Directions', 'దిశలు')}</Text></Pressable></View>
          </Pressable>
        ))}
      </ScrollView>
      <BottomNav navigation={navigation} active="Search" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingBottom: 120 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', minHeight: 62, marginBottom: 16, paddingHorizontal: 2 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderRadius: 22, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' },
  backText: { color: '#302C2A', fontSize: 24, lineHeight: 27, textAlign: 'center' },
  kicker: { color: '#5B55D9', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 3, color: '#202332', fontSize: 29, fontWeight: '800', lineHeight: 34 },
  searchBar: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingHorizontal: 18, borderRadius: 29, borderWidth: 1, borderColor: '#D9CFC7', backgroundColor: '#FFFDFB', shadowColor: '#2C2621', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  searchIcon: { marginRight: 9, fontSize: 18 },
  input: { flex: 1, height: 46, paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0, outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent', backgroundColor: 'transparent', color: '#252637', fontSize: 14, fontWeight: '600' },
  voiceButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  voiceButtonActive: { backgroundColor: '#D35B50' },
  empty: { marginTop: 25, color: '#55596D', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  resultCard: { overflow: 'hidden', marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, shadowColor: '#8C5B4B', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  resultImageWrap: { height: 202, position: 'relative', backgroundColor: '#E7E9FA' },
  resultImageWrapSelected: { borderWidth: 2, borderColor: '#514BD5' },
  image: { width: '100%', height: '100%' },
  favoriteButton: { position: 'absolute', top: '50%', right: -1, width: 38, height: 48, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 20, borderBottomLeftRadius: 20, backgroundColor: '#FFFDFB' },
  favorite: { color: '#E4585D', fontSize: 24 },
  favoriteActive: { color: '#E34E5B' },
  resultBody: { padding: 14, paddingTop: 13 },
  name: { color: '#202332', fontSize: 17, fontWeight: '800', lineHeight: 23 },
  category: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13, color: '#C95E49', backgroundColor: '#FFF0E9', fontSize: 11, fontWeight: '800' },
  address: { marginTop: 10, color: '#636B82', fontSize: 12, lineHeight: 18 },
  distance: { marginTop: 3, color: '#4D8052', fontSize: 11, fontWeight: '700' },
  linkText: { marginTop: 6, color: '#3D6BFF', fontSize: 12, fontWeight: '800' },
})
