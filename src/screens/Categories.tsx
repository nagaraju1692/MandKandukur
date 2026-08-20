import React, { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import BottomNav from './BottomNav'
import getCategoryImage from '../utils/categoryImages'
import MobileHeader from './MobileHeader'
import { useLanguage } from '../context/LanguageContext'
import { useDirectory } from '../context/DirectoryContext'
import { useAuth } from '../context/AuthContext'
import DirectoryState from './DirectoryState'
import { colors } from '../ui/theme'
import RemoteImage from '../ui/RemoteImage'

// Map old category names to new subcategory names for backward compatibility
const categoryNameMappings: Record<string, string[]> = {
  'Finance & Utilities': ['Banks'],
  Health: ['Hospitals', 'Hospitals & Clinics', 'Medical shops', 'Medical Shops', 'Diagnostic Labs', 'Diagnostic Lab Centers', 'Diagnosis Labs', 'Radiology Scans', 'Radiology Scan Centers', 'Scan Centers'],
  Emergency: ['Police station', 'Police Station', '108', '108 Emergency', 'Fire station', 'Fire Station'],
  'Police Station': ['Police station', 'Police Station'],
  '108 Emergency': ['108', '108 Emergency', '108 Ambulance'],
  'Fire Station': ['Fire station', 'Fire Station'],
}

const icons: Record<string, string> = {
  Education: '🎓', 'Education & Institutions': '🎓', 'Medical shops': '💊', Restaurants: '🍽️', 'Restaurants & Hotels': '🍽️',
  Lodges: '🏨', 'Bus stand': '🚌', 'Police station': '🚔', 'Police Station': '🚔', '108 Emergency': '🚑', 'Fire Station': '🚒', Emergency: '🚨', Health: '🏥', 'Hospitals & Clinics': '🏥', 'Medical Shops': '💊', 'Diagnostic Lab Centers': '🧪', 'Radiology Scan Centers': '🩻', Temples: '🛕',
  'Movie Theaters': '🎬', 'Shopping clothes': '🛍️', 'Retail marts': '🛒',
  'Beauty clinics': '💆', 'RealEstate': '🏠', 'Agricultural info': '🌾',
  'Real Estate': '🏘️', Agriculture: '🌾', 'Food & Meat Markets': '🥬', 'Rental Transport': '🚚',
  'Tourist Places': '🗺️', 'Rental Houses': '🏠', 'Construction Materials': '🧱', 'Government Offices': '🏛️',
  'Buy & Sell': '🏷️', 'Cars for Sale': '🚗', 'Bikes for Sale': '🏍️', 'Tractors for Sale': '🚜', 'Other Items for Sale': '🏷️',
  'Common Utilities': '🧰', 'ATM Centers': '🏧', 'Petrol Pumps': '⛽', 'Gas Centers': '🔥', 'EV Charging Stations': '🔌', 'Public Toilets': '🚻',
  'Cold Storages': '❄️', 'Manpower Services': '🛠️', 'Show Rooms': '🏬', 'Bike & Car Mechanics': '🔧',
  'Plot for Sale': '📐', 'House or Apartment for Sale': '🏠', 'Land for Sale': '🌱', 'Tobacco Boards': '🌿', 'Vegetable Markets': '🥕',
  'Fish Markets': '🐟', 'Fruit Markets': '🍎', 'Mutton Shops': '🍖', 'Chicken Shops': '🍗', 'Sweet Shops': '🍬',
  'Cars for Rent': '🚗', 'Autos for Rent': '🛺', 'Lorries for Rent': '🚛', 'Tractors for Rent': '🚜', 'JCBs for Rent': '🏗️',
  'Rallapadu Reservoir': '🌊', Malakonda: '⛰️', Swagameswaram: '🛕', Sand: '⛱️', Kankara: '🪨', Cement: '🏗️', Bricks: '🧱',
  'MRO Office': '🏢', 'Municipality Office': '🏛️', 'Registration Office': '📄', Mestri: '👷',
  'Training Institutions': '🎓', 'Computer Training': '💻', 'Spoken English': '🗣️', 'Driving Schools': '🚗', 'Skill Development': '🧰',
  Plumber: '🔧', Electricians: '⚡', 'Tiles Work': '◼️', 'False Ceiling': '🏠', 'Bore Points': '💧', 'Bike Show Rooms': '🏍️',
  'Car Show Rooms': '🚘', 'Vehicle Wash': '🚿',
  'Shops & Local Businesses': '🏪',
  'Home & Technical Services': '🛠️',
  'Government & Public Services': '🏛️',
  'Education & Training': '🎓', 'Education & Sports Training Centers': '🎓',
  'Travel & Transport': '🚍',
  'Religious & Miscellaneous': '🧘',
  'Tourism & Attractions': '🌍',
  'Finance & Utilities': '🏦',
  'Book Stores': '📚', 'Photo Studios': '📷', 'Courier Services': '📦', 'Kids Toys & Cycles': '🚲',
  'Vehicle Battery Shops': '🔋', 'Key & Lock Repair': '🔑', 'Painting & Hardware': '🎨', 'Dry Fruit Stores': '🥭',
  'Mobile & Accessories': '📱', 'Fireworks & Crackers': '✨', 'Iron & Grill Suppliers': '⚒️', 'Clothing & Tailors': '👕',
  'Carpentry Services': '🪚', 'AC Services': '❄️', 'Washing Machine Repair': '🧺', 'Event Caterers': '🍽️',
  'WiFi & Internet Services': '📡', 'Tractor Mechanics': '🔧',
  'MeeSeva Centers': '🏢', 'Aadhaar Centers': '🆔', 'Sachivalayams': '🏛️', 'Court & Legal Services': '⚖️', 'Electricity & Water Offices': '⚡',
  'Sports Coaching': '⚽', 'Tuition Centers': '📖', 'Dance Academies': '💃',
  'APSRTC Bus Stand': '🚌', 'Private Travels': '🚐', 'Railway Station': '🚂',
  'Priests & Poojaris': '🙏', 'Swimming Pools': '🏊', 'Other Services': '⚙️',
  'Ramayapatnam Beach': '🏖️', 'Pakala Lake': '🌊', 'Etha Mokkala': '⛰️', 'Chirala Beach': '🏖️',
  'Banks & ATMs': '🏧', 'Insurance Offices': '📋',
}

function getCategoryFallbackIcon(name: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes('book')) return '📚'
  if (normalized.includes('cloth')) return '👕'
  if (normalized.includes('courier') || normalized.includes('delivery')) return '📦'
  if (normalized.includes('dry')) return '🥭'
  if (normalized.includes('fire')) return '✨'
  if (normalized.includes('iron') || normalized.includes('grill')) return '⚒️'
  if (normalized.includes('medical') || normalized.includes('clinic')) return '💊'
  if (normalized.includes('bus') || normalized.includes('travel')) return '🚌'
  if (normalized.includes('hotel') || normalized.includes('restaurant')) return '🍽️'
  if (normalized.includes('school') || normalized.includes('education') || normalized.includes('institution')) return '🎓'
  if (normalized.includes('bank') || normalized.includes('atm')) return '🏧'
  if (normalized.includes('real') || normalized.includes('house') || normalized.includes('estate')) return '🏠'
  if (normalized.includes('shop') || normalized.includes('store')) return '🏪'
  return '📍'
}


const categoryPriority = [
  'Education', 'Education & Institutions', 'Health', 'Restaurants', 'Restaurants & Hotels', 'Real Estate', 'Agriculture',
  'Food & Meat Markets', 'Rental Transport', 'Rental Houses', 'Construction Materials',
  'Buy & Sell',
  'Common Utilities',
  'Training Institutions', 'Government Offices', 'Manpower Services', 'Show Rooms',
  'Bike & Car Mechanics', 'Tourist Places', 'Cold Storages', 'Lodges',
  'Police station', 'Temples', 'Beauty clinics', 'Movie Theaters', 'Shopping clothes',
  'Retail marts', 'Wine shops', 'Jewellery shops',
  // Main parent categories
  'Shops & Local Businesses',
  'Home & Technical Services',
  'Government & Public Services',
  'Emergency',
  'Health',
  'Education & Sports Training Centers',
  'Travel & Transport',
  'Religious & Miscellaneous',
  'Tourism & Attractions',
  'Finance & Utilities',
  // Health subcategories
  'Hospitals & Clinics', 'Medical Shops', 'Diagnostic Lab Centers', 'Radiology Scan Centers',
  // Shops & Local Businesses subcategories
  'Book Stores', 'Photo Studios', 'Courier Services', 'Kids Toys & Cycles',
  'Vehicle Battery Shops', 'Key & Lock Repair', 'Painting & Hardware', 'Dry Fruit Stores',
  'Mobile & Accessories', 'Fireworks & Crackers', 'Iron & Grill Suppliers', 'Clothing & Tailors',
  // Home & Technical Services subcategories
  'Carpentry Services', 'AC Services', 'Washing Machine Repair', 'Event Caterers',
  'WiFi & Internet Services', 'Tractor Mechanics',
  // Government & Public Services subcategories
  'MeeSeva Centers', 'Aadhaar Centers', 'Sachivalayams', 'Court & Legal Services', 'Electricity & Water Offices',
  // Emergency subcategories
  'Police Station', '108 Emergency', 'Fire Station',
  // Education & Sports Training Centers subcategories
  'Sports Coaching', 'Tuition Centers', 'Dance Academies',
  // Travel & Transport subcategories
  'APSRTC Bus Stand', 'Private Travels', 'Railway Station',
  // Religious & Miscellaneous subcategories
  'Priests & Poojaris', 'Swimming Pools', 'Other Services',
  // Tourism & Attractions subcategories
  'Ramayapatnam Beach', 'Pakala Lake', 'Etha Mokkala', 'Chirala Beach',
  // Finance & Utilities subcategories
  'Banks & ATMs', 'Insurance Offices',
]

function CategoryThumbnail({ name }: { name: string }) {
  return (
    <RemoteImage
      source={{ uri: getCategoryImage(name) }}
      style={styles.image}
      resizeMode="cover"
      fallbackContent={<View style={styles.categoryIconFallback}><Text style={styles.categoryIconText}>{icons[name] || getCategoryFallbackIcon(name)}</Text></View>}
    />
  )
}

export default function Categories({ navigation }: any) {
  const { t, category: categoryLabel } = useLanguage()
  const { categories, businesses, loading, error, retry } = useDirectory()
  const { favorites, isLoggedIn } = useAuth()
  const [listingFilter, setListingFilter] = useState<'all' | 'withListings' | 'empty' | 'favorites'>('all')
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const rootCategories = categories
    .filter(category => {
      if (category.parentId) return false
      if (category.name === 'Banks' || category.name === 'Bus stand' || category.name === 'Police station' || category.name === 'Police Station' || category.name === 'Tourist Places' || category.name === 'Hospitals' || category.name === 'Hospitals & Clinics' || category.name === 'Medical shops' || category.name === 'Medical Shops') return false
      const childIds = categories.filter((child) => child.parentId === category.id).map((child) => child.id)
      const mappedCategoryNames = categoryNameMappings[category.name] || []
      const categoryBusinesses = businesses.filter((business) => 
        business.categoryId === category.id || 
        childIds.includes(business.categoryId) ||
        mappedCategoryNames.includes(business.categoryName)
      )
      const duplicateHasMoreListings = categories.some((candidate) => {
        if (candidate.id === category.id || candidate.name !== category.name || candidate.parentId !== category.parentId) return false
        const candidateChildIds = categories.filter((child) => child.parentId === candidate.id).map((child) => child.id)
        const candidateMappedNames = categoryNameMappings[candidate.name] || []
        const candidateCount = businesses.filter((business) => candidate.id === business.categoryId || candidateChildIds.includes(business.categoryId) || candidateMappedNames.includes(business.categoryName)).length
        return candidateCount > categoryBusinesses.length
      })
      if (duplicateHasMoreListings) return false
      if (listingFilter === 'favorites') return categoryBusinesses.some((business) => favorites.includes(business.id))
      return listingFilter === 'all' || (listingFilter === 'withListings' ? categoryBusinesses.length > 0 : categoryBusinesses.length === 0)
    })
    .sort((first, second) => {
      const hasFavorite = (category: typeof first) => {
        const childIds = categories.filter((child) => child.parentId === category.id).map((child) => child.id)
        const mappedCategoryNames = categoryNameMappings[category.name] || []
        return businesses.some((business) => 
          favorites.includes(business.id) && 
          (business.categoryId === category.id || 
           childIds.includes(business.categoryId) ||
           mappedCategoryNames.includes(business.categoryName))
        )
      }
      if (isLoggedIn && hasFavorite(first) !== hasFavorite(second)) return hasFavorite(first) ? -1 : 1
      const firstPriority = categoryPriority.indexOf(first.name)
      const secondPriority = categoryPriority.indexOf(second.name)
      return (firstPriority < 0 ? Number.MAX_SAFE_INTEGER : firstPriority) - (secondPriority < 0 ? Number.MAX_SAFE_INTEGER : secondPriority)
    })

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <View style={styles.pageHeader}>
        <Pressable style={styles.pageBack} onPress={() => navigation.goBack()}><Text style={styles.pageBackText}>←</Text></Pressable>
        <View style={styles.pageHeaderCopy}>
          <Text style={styles.pageKicker}>{t('CATEGORIES', 'వర్గాలు')}</Text>
          <Text style={styles.pageTitle}>{t('Categories', 'వర్గాలు')}</Text>
        </View>
        <Pressable style={styles.filterButton} onPress={() => setShowFilterOptions(true)} accessibilityLabel={t('Filter categories', 'Filter categories')}>
          <Text style={styles.filterButtonText}>≡</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DirectoryState loading={loading} error={error} onRetry={retry} />
        <View style={styles.list}>
          {rootCategories.map((category) => {
            const childIds = categories.filter((child) => child.parentId === category.id).map((child) => child.id)
            const mappedCategoryNames = categoryNameMappings[category.name] || []
            const count = businesses.filter((business) => 
              business.categoryId === category.id || 
              childIds.includes(business.categoryId) || 
              mappedCategoryNames.includes(business.categoryName)
            ).length

            return (
              <Pressable
                key={category.id}
                style={styles.card}
                onPress={() => { setSelectedCategoryId(category.id); navigation.navigate(category.name === 'APSRTC Bus Stand' ? 'BusTimetable' : 'Businesses', category.name === 'APSRTC Bus Stand' ? undefined : { categoryId: category.id }) }}
              >
                <View style={[styles.categoryImageWrap, selectedCategoryId === category.id && styles.categoryImageWrapSelected]}>
                  <CategoryThumbnail name={category.name} />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.name}>{categoryLabel(category.name)}</Text>
                  <Text style={styles.count}>{count} {t('Listings', 'లిస్టింగ్‌లు')}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
      <Modal visible={showFilterOptions} transparent animationType="fade" onRequestClose={() => setShowFilterOptions(false)}>
        <Pressable style={styles.filterOverlay} onPress={() => setShowFilterOptions(false)}>
          <View style={styles.filterMenu}>
            <Text style={styles.filterTitle}>{t('Filter categories', 'Filter categories')}</Text>
            {([
              ['all', t('All categories', 'All categories')],
              ['withListings', t('With listings', 'With listings')],
              ['favorites', t('Favorites', 'Favorites')],
              ['empty', t('Empty categories', 'Empty categories')],
            ] as const).map(([value, label]) => (
              <Pressable key={value} style={[styles.filterOption, listingFilter === value && styles.filterOptionActive]} onPress={() => { setListingFilter(value); setShowFilterOptions(false) }}>
                <Text style={[styles.filterOptionText, listingFilter === value && styles.filterOptionTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <BottomNav navigation={navigation} active="Categories" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageHeader: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EFEAFE',
  },
  pageBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 18,
    backgroundColor: '#E1D9FF',
  },
  pageBackText: {
    color: '#4A4AD5',
    fontSize: 22,
    lineHeight: 24,
    textAlign: 'center',
  },
  pageHeaderCopy: {
    flex: 1,
  },
  filterButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#E1D9FF' },
  filterButtonText: { color: '#4A4AD5', fontSize: 23, fontWeight: '800', lineHeight: 25 },
  filterOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24, 25, 43, 0.38)' },
  filterMenu: { padding: 18, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: '#FFF' },
  filterTitle: { marginBottom: 8, color: '#1F2235', fontSize: 16, fontWeight: '800' },
  filterOption: { minHeight: 46, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F1F6', paddingHorizontal: 8 },
  filterOptionActive: { backgroundColor: '#F0EEFF' },
  filterOptionText: { color: '#3E4355', fontSize: 14, fontWeight: '600' },
  filterOptionTextActive: { color: '#4F47B8', fontWeight: '800' },
  pageKicker: {
    color: '#5B52D1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pageTitle: {
    marginTop: 2,
    color: '#2F2F43',
    fontSize: 22,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
  },
  list: { gap: 12 },
  card: {
    minHeight: 104,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16,
    shadowColor: '#8C5B4B',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryImageWrap: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E7E9FA',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#EFE0D8',
  },
  categoryImageWrapSelected: { borderWidth: 2, borderColor: '#514BD5' },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryIconFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFE0D8' },
  categoryIconText: { fontSize: 26 },
  cardBody: { flex: 1,
  },
  name: {
    color: '#1F2235',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
    flex: 1,
  },
  arrow: {
    color: '#2C2E3F',
    fontSize: 30,
    fontWeight: '400',
  },
  count: {
    marginTop: 4,
    color: '#6D7288',
    fontSize: 12,
    fontWeight: '700',
  },
})