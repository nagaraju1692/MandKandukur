import React, { useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { buildGoogleMapsDirectionsUrl, fetchJson } from '../services/api'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { getBusinessImage } from '../utils/categoryImages'
import { useReviews } from '../context/ReviewContext'
import { useNearby } from '../context/NearbyContext'
import { useSubmittedListings } from '../context/SubmittedListingsContext'
import { useDirectory } from '../context/DirectoryContext'
import DirectoryState from './DirectoryState'
import { colors } from '../ui/theme'
import FocusTextInput from '../ui/FocusTextInput'
import RemoteImage from '../ui/RemoteImage'

const subcategoryIcons: Record<string, string> = {
  Education: '🎓', 'Education & Institutions': '🎓', 'Degree colleges': '🎓', 'Engineering colleges': '🎓', Intermediate: '🎓', 'Polytechnic colleges': '🎓', Schools: '🎓', Hospitals: '✚', 'Hospitals & Clinics': '🏥', 'Medical shops': '✦', 'Medical Shops': '💊', 'Diagnostic Lab Centers': '🧪', 'Radiology Scan Centers': '🩻', Restaurants: '🍽️', 'Restaurants & Hotels': '🍽️', Lodges: '▣', 'Bus stand': '▤',
  'Police station': '⌁', 'Police Station': '🚔', '108 Emergency': '🚑', 'Fire Station': '🚒', Temples: '🛕', Banks: '🏦', 'Banks & ATMs': '🏧', 'Movie Theaters': '▶', 'Shopping clothes': '◈', 'Retail marts': '▦',
  'Beauty clinics': '✧', 'Real Estate': '🏘️', Agriculture: '🌾', 'Food & Meat Markets': '🥬', 'Rental Transport': '🚚',
  'Tourist Places': '🗺️', 'Rental Houses': '🏠', 'Construction Materials': '🧱', 'Government Offices': '🏛️', 'Buy & Sell': '🏷️',
  'Common Utilities': '🧰', 'ATM Centers': '🏧', 'Petrol Pumps': '⛽', 'Gas Centers': '🔥', 'EV Charging Stations': '🔌', 'Public Toilets': '🚻',
  'Cold Storages': '❄️', 'Manpower Services': '🛠️', 'Show Rooms': '🏬', 'Bike & Car Mechanics': '🔧',
  'Plot for Sale': '📐', 'House or Apartment for Sale': '🏠', 'Land for Sale': '🌱', 'Tobacco Boards': '🌿', 'Vegetable Markets': '🥕',
  'Fish Markets': '🐟', 'Fruit Markets': '🍎', 'Mutton Shops': '🍖', 'Chicken Shops': '🍗', 'Sweet Shops': '🍬',
  'Cars for Rent': '🚗', 'Autos for Rent': '🛺', 'Lorries for Rent': '🚛', 'Tractors for Rent': '🚜', 'JCBs for Rent': '🏗️', 'Cars for Sale': '🚗', 'Bikes for Sale': '🏍️', 'Tractors for Sale': '🚜', 'Other Items for Sale': '🏷️',
  'Rallapadu Reservoir': '🌊', Malakonda: '⛰️', Swagameswaram: '🛕', Sand: '⛱️', Kankara: '🪨', Cement: '🏗️', Bricks: '🧱',
  'MRO Office': '🏢', 'Municipality Office': '🏛️', 'Registration Office': '📄', Mestri: '👷', Plumber: '🔧', Electricians: '⚡',
  'Tiles Work': '◼️', 'False Ceiling': '🏠', 'Bore Points': '💧', 'Bike Show Rooms': '🏍️', 'Car Show Rooms': '🚘', 'Vehicle Wash': '🚿',
  'Computer Training': '💻', 'Spoken English': '🗣️', 'Driving Schools': '🚗', 'Skill Development': '🧰',
  'Training Institutions': '🎓', 'RealEstate': '▣', 'Agricultural info': '🌾', 'School': '🎓', 'College': '🎓',
  'Book Stores': '📚', 'Photo Studios': '📷', 'Courier Services': '📦', 'Kids Toys & Cycles': '🚲',
  'Vehicle Battery Shops': '🔋', 'Key & Lock Repair': '🔑', 'Painting & Hardware': '🎨', 'Dry Fruit Stores': '🥭',
  'Mobile & Accessories': '📱', 'Fireworks & Crackers': '✨', 'Iron & Grill Suppliers': '⚒️', 'Clothing & Tailors': '👕',
  'Carpentry Services': '🪚', 'AC Services': '❄️', 'Washing Machine Repair': '🧺', 'Event Caterers': '🍽️',
  'WiFi & Internet Services': '📡', 'Tractor Mechanics': '🔧', 'MeeSeva Centers': '🏢', 'Aadhaar Centers': '🆔',
  'Sachivalayams': '🏛️', 'Court & Legal Services': '⚖️', 'Electricity & Water Offices': '⚡', 'Sports Coaching': '⚽',
  'Tuition Centers': '📖', 'Dance Academies': '💃', 'APSRTC Bus Stand': '🚌', 'Private Travels': '🚐',
  'Railway Station': '🚂', 'Priests & Poojaris': '🙏', 'Swimming Pools': '🏊', 'Other Services': '⚙️',
  'Ramayapatnam Beach': '🏖️', 'Pakala Lake': '🌊', 'Etha Mokkala': '⛰️', 'Chirala Beach': '🏖️', 'Insurance Offices': '📋',
}

const directPostingCategoryNames = new Set(['Real Estate', 'Rental Transport', 'Construction Materials', 'Buy & Sell'])

// Map old category names to new subcategory names for backward compatibility
const categoryNameMappings: Record<string, string[]> = {
  'Finance & Utilities': ['Banks'],
  'Banks & ATMs': ['Banks'],
}

const getSubcategoryIcon = (name: string) => {
  const trimmed = (name || '').trim()
  if (!trimmed) return '📌'
  const exact = subcategoryIcons[trimmed]
  if (exact) return exact
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ')
  const match = Object.entries(subcategoryIcons).find(([key]) => key.toLowerCase().replace(/\s+/g, ' ') === normalized)
  return match ? match[1] : '📌'
}

export default function Businesses({ navigation, route }: any) {
  const { t, category: categoryLabel, businessName } = useLanguage()
  const { favorites, toggleFavorite, isLoggedIn, user } = useAuth()
  const { getReviewStats } = useReviews()
  const { distances, ready, ensureAddresses, sortNearest, location } = useNearby()
  const { markSoldOut } = useSubmittedListings()
  const { businesses, categories, loading, error, retry } = useDirectory()
  const [sortMode, setSortMode] = useState<'nearest' | 'rating' | 'newest'>('newest')
  const [minRating, setMinRating] = useState(0)
  const [distanceFilter, setDistanceFilter] = useState(20)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [busRouteCount, setBusRouteCount] = useState<number | null>(null)
  const categoryId = route.params?.categoryId || null
  const category = categories.find(item => item.id === categoryId)
  const parentCategory = categories.find(item => item.id === category?.parentId)
  const supportsDirectPosting = Boolean(category && (directPostingCategoryNames.has(category.name) || directPostingCategoryNames.has(parentCategory?.name || '')))
  const isBuyAndSellCategory = category?.name === 'Buy & Sell' || parentCategory?.name === 'Buy & Sell'
  const subcategoryIds = categoryId ? categories.filter(item => item.parentId === categoryId).map(item => item.id) : []
  const mappedCategoryNames = category?.name ? (categoryNameMappings[category.name] || []) : []
  const mappedCategoryIds = mappedCategoryNames.length > 0 ? categories.filter(item => mappedCategoryNames.includes(item.name)).map(item => item.id) : []
  const allBusinesses: any[] = businesses
  const selectedBusinesses: any[] = allBusinesses.filter(
    business => !categoryId || business.categoryId === categoryId || subcategoryIds.includes(business.categoryId) || mappedCategoryIds.includes(business.categoryId) || mappedCategoryNames.includes(business.categoryName),
  )
  const filteredBusinesses = selectedBusinesses.filter((business) => {
    const reviewStats = getReviewStats(business.id)
    const distance = distances[business.id] ?? distances[business.address]
    const withinDistance = distance === undefined || distance <= distanceFilter
    const hasMinRating = reviewStats.rating >= minRating
    return withinDistance && hasMinRating
  })
  const orderedBusinesses = (() => {
    const cloned = filteredBusinesses.slice()
    if (sortMode === 'rating') {
      return cloned.sort((first, second) => {
        const firstRating = getReviewStats(first.id).rating
        const secondRating = getReviewStats(second.id).rating
        return secondRating - firstRating
      })
    }
    if (sortMode === 'newest') return cloned.sort((first, second) => new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime())
    return sortNearest(cloned)
  })()
  React.useEffect(() => { if (ready) ensureAddresses(selectedBusinesses.map((business) => ({ id: business.id, address: business.address, latitude: business.latitude, longitude: business.longitude }))) }, [selectedBusinesses.length, categoryId, ready])

  const childCategories = categories.filter(item => item.parentId === categoryId)
  React.useEffect(() => {
    if (category?.name !== 'Travel & Transport') {
      setBusRouteCount(null)
      return
    }
    let active = true
    fetchJson<{ data: unknown[] }>('/api/bus-routes')
      .then((response) => { if (active) setBusRouteCount(response.data.length) })
      .catch(() => { if (active) setBusRouteCount(null) })
    return () => { active = false }
  }, [category?.name])

  if (childCategories.length > 0) {
    return (
      <View style={styles.container}>
        <MobileHeader navigation={navigation} />
        <View style={styles.subHeader}>
          <Pressable style={styles.headerBack} onPress={() => navigation.goBack()}><Text style={styles.headerBackText}>←</Text></Pressable>
          <Text style={styles.headerTitle}>{categoryLabel(category?.name || t('Categories', 'వర్గాలు'))}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {childCategories.map(item => {
            const mappedCategoryNames = categoryNameMappings[item.name] || []
            const childCount = businesses.filter((business) => 
              business.categoryId === item.id || 
              mappedCategoryNames.includes(business.categoryName)
            ).length
            return (
            <Pressable
              key={item.id}
              style={styles.listRow}
              onPress={() => item.name === 'APSRTC Bus Stand'
                ? navigation.navigate('BusTimetable')
                : navigation.push('Businesses', { categoryId: item.id })}
            >
              <View style={styles.subcategoryIcon}><Text style={styles.subcategoryIconText}>{getSubcategoryIcon(item.name)}</Text></View>
              <View style={styles.subcategoryCopy}><Text style={styles.listRowText}>{categoryLabel(item.name)}</Text><Text style={styles.subcategoryCount}>{item.name === 'APSRTC Bus Stand' && busRouteCount !== null ? busRouteCount : childCount} {t('Listings', 'లిస్టింగ్‌లు')}</Text></View>
              <Text style={styles.listArrow}>›</Text>
            </Pressable>
            )
          })}
        </ScrollView>
        <BottomNav navigation={navigation} active="Categories" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MobileHeader navigation={navigation} />
      <View style={styles.subHeader}>
        <Pressable style={styles.headerBack} onPress={() => navigation.goBack()}><Text style={styles.headerBackText}>←</Text></Pressable>
        <View style={styles.headerCopy}><Text style={styles.headerKicker}>{t('DIRECTORY', 'డైరెక్టరీ')}</Text><Text style={styles.headerTitle}>{categoryLabel(category?.name || t('All Listings', 'అన్ని లిస్టింగ్‌లు'))}</Text></View>
        {supportsDirectPosting ? <Pressable style={styles.postButton} onPress={() => navigation.navigate('SubmitBusiness', { categoryId })}><Text style={styles.postButtonText}>+</Text></Pressable> : <Text style={styles.headerCount}>{selectedBusinesses.length} {t('Listings', 'లిస్టింగ్‌లు')}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <DirectoryState loading={loading} error={error} onRetry={retry} />
        <View style={styles.filterBar}>
          <View style={styles.filterChipRow}>
            {(['nearest', 'rating', 'newest'] as const).map((mode) => (
              <Pressable key={mode} style={[styles.filterChip, sortMode === mode && styles.filterChipActive]} onPress={() => setSortMode(mode)}>
                <Text style={[styles.filterChipText, sortMode === mode && styles.filterChipTextActive]}>{mode === 'nearest' ? t('Nearest', 'సమీపం') : mode === 'rating' ? t('Rating', 'రేటింగ్') : t('Newest', 'తాజా')}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{t('Min rating', 'కనిష్ఠ రేటింగ్')}: {minRating.toFixed(1)}</Text>
            <FocusTextInput value={String(minRating)} keyboardType="numeric" onChangeText={(value) => setMinRating(Math.min(5, Math.max(0, Number(value || 0))))} style={styles.sliderInput} />
          </View>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{t('Distance limit', 'దూర పరిమితి')}: {distanceFilter} km</Text>
            <FocusTextInput value={String(distanceFilter)} keyboardType="numeric" onChangeText={(value) => setDistanceFilter(Math.min(100, Math.max(1, Number(value || 1))))} style={styles.sliderInput} />
          </View>
        </View>
        {orderedBusinesses.map((business) => (
          <Pressable
            key={business.id}
            style={styles.card}
            onPress={() => { setSelectedBusinessId(business.id); navigation.navigate('BusinessDetails', { id: business.id }) }}
          >
            <View style={styles.cardMain}><View style={[styles.businessImageWrap, selectedBusinessId === business.id && styles.businessImageWrapSelected]}><RemoteImage source={getBusinessImage(business.image, business.categoryName)} style={styles.businessImage} resizeMode="cover" /></View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}><Text style={styles.cardTitle}>{businessName(business.name, business.nameTe)}</Text><Pressable style={styles.cardIconButton} onPress={() => isLoggedIn ? toggleFavorite(business.id) : navigation.navigate('Profile')}><Text style={styles.favorite}>{favorites.includes(business.id) ? '♥' : '♡'}</Text></Pressable><Pressable style={styles.cardIconButton} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`)}><Text style={styles.pin}>📍</Text></Pressable></View>
              <View style={styles.ratingRow}><Text style={styles.rating}>{getReviewStats(business.id).rating.toFixed(1)}</Text><Text style={styles.stars}>★★★★★</Text><Text style={styles.reviews}>({getReviewStats(business.id).count})</Text><Text style={styles.typePill}>{categoryLabel(business.categoryName)}</Text></View>
              {supportsDirectPosting && <><Text style={styles.marketplacePrice}>Price: {business.price || 'Not specified'}</Text><Text style={styles.marketplaceRooms}>{isBuyAndSellCategory ? 'Seller' : 'Owner / agent'}: {business.phone}</Text>{business.facing ? <Text style={styles.marketplaceRooms}>Facing: {business.facing}</Text> : null}</>}
              {!supportsDirectPosting && <Text style={styles.cardPhone}>{business.phone || 'N/A'}</Text>}
              {business.status === 'Sold out' && <Text style={[styles.openStatus, styles.soldOutStatus]}>{t('Sold out', 'అమ్ముడైంది')}</Text>}
              <Text style={styles.cardAddress}>{business.address}</Text>
              <Text style={styles.cardDistance}>{(distances[business.id] ?? distances[business.address]) !== undefined ? `📍 ${((distances[business.id] ?? distances[business.address]) as number).toFixed(1)} ${t('km away', 'కి.మీ దూరంలో')}` : `📍 ${t('Finding distance…', 'దూరాన్ని కనుగొంటున్నాము…')}`}</Text>
              <Text style={styles.cardDescription} numberOfLines={3}>{business.description}</Text>
            </View></View>
            <View style={styles.cardActions}><Pressable style={styles.directionButton} onPress={() => Linking.openURL(buildGoogleMapsDirectionsUrl({ latitude: business.latitude, longitude: business.longitude, address: business.address }, location ?? undefined))}><Text style={styles.directionText}>{t('Directions', 'దిశలు')}</Text></Pressable><Pressable style={styles.websiteButton} onPress={() => business.website && business.website !== 'N/A' ? Linking.openURL(business.website) : Alert.alert(t('Website unavailable', 'వెబ్‌సైట్ అందుబాటులో లేదు'), t('This listing does not have a website.', 'ఈ లిస్టింగ్‌కు వెబ్‌సైట్ లేదు.'))}><Text style={styles.websiteText}>{t('Website', 'వెబ్‌సైట్')}</Text></Pressable>{business.submittedBy === user?.phone && business.status !== 'Sold out' && <Pressable style={styles.soldOutButton} onPress={() => markSoldOut(business.id)}><Text style={styles.soldOutText}>{t('Mark sold out', 'అమ్ముడైనట్లు గుర్తించండి')}</Text></Pressable>}</View>
          </Pressable>
        ))}

        {selectedBusinesses.length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{t('No listings available yet.', 'ఇంకా లిస్టింగ్‌లు అందుబాటులో లేవు.')}</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav navigation={navigation} active="Categories" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  subHeader: { minHeight: 72, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEAFE' },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 18, backgroundColor: '#E1D9FF' },
  headerBackText: { color: '#4A4AD5', fontSize: 22, lineHeight: 24, textAlign: 'center' },
  kicker: {
    color: '#5B52D1',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#2F2F43',
    marginTop: 0,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  headerCopy: { flex: 1 },
  headerKicker: { color: '#5B52D1', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  headerCount: { color: '#4A4AD5', fontSize: 11, fontWeight: '800', marginLeft: 8 },
  postButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#514BD5' },
  postButtonText: { color: '#FFFFFF', fontSize: 25, fontWeight: '500', lineHeight: 28 },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 110,
  },
  card: {
    padding: 11,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#8C5B4B',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  businessImageWrap: { width: 128, height: 148, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E9E3EA', backgroundColor: '#F7F4F8', marginRight: 12 },
  businessImageWrapSelected: { borderWidth: 2, borderColor: '#514BD5' },
  businessImage: { width: '100%', height: '100%' },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIcon: {
    color: '#2F2F44',
    fontSize: 25,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  cardTitle: {
    flex: 1,
    color: '#202332',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  cardMeta: {
    marginTop: 4,
    color: '#5D5EE8',
    fontSize: 14,
    fontWeight: '700',
  },
  cardIconButton: { width: 30, height: 30, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E9E3EA', backgroundColor: '#FFFFFF' },
  favorite: { color: '#E4585D', fontSize: 19, lineHeight: 22 },
  pin: { fontSize: 15, lineHeight: 19 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 7, gap: 4 },
  rating: { color: '#D89B00', fontSize: 12, fontWeight: '800' },
  stars: { color: '#D89B00', fontSize: 11 },
  reviews: { color: '#5E5A5A', fontSize: 11 },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#F0DCD4', color: '#B85845', backgroundColor: '#FFF8F5', fontSize: 9, fontWeight: '800' },
  filterBar: { marginBottom: 18, padding: 10, borderRadius: 12, backgroundColor: '#FFFDFB', borderWidth: 1, borderColor: '#E5E5F2' },
  filterChipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#F0F2FF', borderWidth: 1, borderColor: '#D9DDF8' },
  filterChipActive: { backgroundColor: '#514BD5', borderColor: '#514BD5' },
  filterChipText: { color: '#2F2F41', fontSize: 11, fontWeight: '800' },
  filterChipTextActive: { color: '#FFF' },
  sliderRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderLabel: { color: '#4F4F5F', fontSize: 12, fontWeight: '700' },
  sliderInput: { width: 80, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#DCE0F2', backgroundColor: '#F7F8FF', color: '#2D2F43', textAlign: 'center' },
  cardPhone: { marginTop: 5, color: '#636B82', fontSize: 11 },
  marketplaceOwner: { marginTop: 6, color: '#3F4154', fontSize: 11, fontWeight: '700' },
  marketplacePrice: { marginTop: 3, color: '#4D8052', fontSize: 12, fontWeight: '800' },
  marketplaceRooms: { marginTop: 3, color: '#636B82', fontSize: 11 },
  openStatus: { marginTop: 4, color: '#4D8052', fontSize: 11, fontWeight: '800' },
  soldOutStatus: { color: '#C4515B' },
  cardAddress: {
    marginTop: 7,
    color: '#636B82',
    fontSize: 11,
    lineHeight: 16,
  },
  cardDistance: { marginTop: 4, color: '#4D8052', fontSize: 11, fontWeight: '700' },
  cardDescription: { marginTop: 6, color: '#4F515F', fontSize: 11, lineHeight: 16 },
  cardArrow: {
    color: '#2A2B3A',
    fontSize: 32,
    fontWeight: '400',
    marginLeft: 8,
  },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0EBF1' },
  directionButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#AAA4E8', backgroundColor: '#FFFFFF' },
  directionText: { color: '#514BD5', fontSize: 12, fontWeight: '800' },
  websiteButton: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E3DCE5', backgroundColor: '#FFFFFF' },
  websiteText: { color: '#302C2A', fontSize: 13, fontWeight: '800' },
  soldOutButton: { flexBasis: '100%', minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F0DCD4', backgroundColor: '#FFF8F5' },
  soldOutText: { color: '#C4515B', fontSize: 12, fontWeight: '800' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 86,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#545C7A',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listRowText: {
    flex: 1,
    color: '#1F2235',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  subcategoryIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderRadius: 14, backgroundColor: '#F8E8DE', borderWidth: 1, borderColor: '#EAD6C6' },
  subcategoryIconText: { fontSize: 25 },
  subcategoryCopy: { flex: 1, justifyContent: 'center' },
  subcategoryCount: { marginTop: 4, color: '#6D7288', fontSize: 12, fontWeight: '700' },
  listArrow: {
    color: '#2A2B3A',
    fontSize: 30,
    fontWeight: '400',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#5B6279',
    fontSize: 16,
    fontWeight: '600',
  },
})
