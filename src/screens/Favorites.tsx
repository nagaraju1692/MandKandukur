import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import { useLanguage } from '../context/LanguageContext'
import { useNearby } from '../context/NearbyContext'
import { useDirectory } from '../context/DirectoryContext'
import { getBusinessImage } from '../utils/categoryImages'
import RemoteImage from '../ui/RemoteImage'
import { colors } from '../ui/theme'

const favoriteIcons: Record<string, string> = {
  Education: '🎓', 'Education & Institutions': '🎓', Hospitals: '✚', 'Hospitals & Clinics': '🏥', 'Medical shops': '✦', 'Medical Shops': '💊', 'Diagnostic Lab Centers': '🧪', 'Radiology Scan Centers': '🩻', Restaurants: '🍽️', 'Restaurants & Hotels': '🍽️',
  Lodges: '▣', 'Bus stand': '▤', 'Police station': '⌁', 'Police Station': '🚔', '108 Emergency': '🚑', 'Fire Station': '🚒', Emergency: '🚨', Temples: '🛕',
  Banks: '₹', 'Movie Theaters': '▶', 'Shopping clothes': '◈', 'Retail marts': '▦',
  'Beauty clinics': '✧', 'Real Estate': '🏘️', Agriculture: '🌾',
  'Food & Meat Markets': '🥬', 'Rental Transport': '🚚', 'Tourist Places': '🗺️',
  'Rental Houses': '🏠', 'Construction Materials': '🧱', 'Government Offices': '🏛️',
  'Buy & Sell': '🏷️', 'Cars for Sale': '🚗', 'Bikes for Sale': '🏍️', 'Tractors for Sale': '🚜', 'Other Items for Sale': '🏷️',
  'Common Utilities': '🧰', 'ATM Centers': '🏧', 'Petrol Pumps': '⛽', 'Gas Centers': '🔥', 'EV Charging Stations': '🔌', 'Public Toilets': '🚻',
  'Cold Storages': '❄️', 'Manpower Services': '🛠️', 'Show Rooms': '🏬',
  'Bike & Car Mechanics': '🔧', 'Plot for Sale': '📐', 'House or Apartment for Sale': '🏠', 'Land for Sale': '🌱',
  'Tobacco Boards': '🌿', 'Vegetable Markets': '🥕', 'Fish Markets': '🐟',
  'Fruit Markets': '🍎', 'Mutton Shops': '🍖', 'Chicken Shops': '🍗', 'Sweet Shops': '🍬',
  'Cars for Rent': '🚗', 'Autos for Rent': '🛺', 'Lorries for Rent': '🚛', 'Tractors for Rent': '🚜', 'JCBs for Rent': '🏗️', 'RealEstate': '▣',
  'Training Institutions': '🎓', 'Computer Training': '💻', 'Spoken English': '🗣️', 'Driving Schools': '🚗', 'Skill Development': '🧰',
  Plumber: '🔧', Electricians: '⚡', 'Tiles Work': '◼️', 'False Ceiling': '🏠', 'Bore Points': '💧', 'Vehicle Wash': '🚿',
}

export default function Favorites({ navigation }: any) {
  const { favorites, isLoggedIn, user } = useAuth()
  const { t, category: categoryLabel, businessName } = useLanguage()
  const { distances, ready, ensureAddresses, sortNearest } = useNearby()
  const { businesses } = useDirectory()
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<string | null>(null)
  const savedBusinesses = businesses.filter((business) => favorites.includes(business.id))
  React.useEffect(() => { if (ready) ensureAddresses(savedBusinesses.map((business) => ({ id: business.id, address: business.address, latitude: business.latitude, longitude: business.longitude }))) }, [savedBusinesses.length, ready])

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <View style={styles.pageHeader}>
      <Pressable style={styles.pageBack} onPress={() => navigation.goBack()}><Text style={styles.pageBackText}>←</Text></Pressable>
      <View style={styles.pageHeaderCopy}>
        <View style={styles.pageTitleRow}>
          <View style={styles.pageIconBadge}><Text style={styles.pageIconText}>♥</Text></View>
          <View>
            <Text style={styles.pageKicker}>{t('MY LIST', 'నా జాబితా')}</Text>
            <Text style={styles.pageTitle}>{t('Favorites', 'ఇష్టమైనవి')}</Text>
          </View>
        </View>
      </View>
        <View style={styles.countBubble}><Text style={styles.countBubbleText}>{favorites.length}</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isLoggedIn || savedBusinesses.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.heart}><Text style={styles.heartText}>♥</Text></View>
            <Text style={styles.heading}>{isLoggedIn ? t('No favourites saved yet', 'ఇంకా ఇష్టమైనవి సేవ్ కాలేదు') : t('Build your local list', 'మీ స్థానిక జాబితాను రూపొందించండి')}</Text>
            <Text style={styles.copy}>{isLoggedIn ? t('Tap the heart on any local listing to add it here.', 'స్థానిక లిస్టింగ్‌లోని హార్ట్‌ను నొక్కి ఇక్కడ జోడించండి.') : t('Open Profile to sign in, then save useful local businesses for later.', 'ప్రొఫైల్ తెరిచి సైన్ ఇన్ చేసి ఉపయోగకరమైన వ్యాపారాలను సేవ్ చేయండి.')}</Text>
            <Pressable style={styles.button} onPress={() => navigation.navigate(isLoggedIn ? 'Categories' : 'Profile')}>
              <Text style={styles.buttonText}>{isLoggedIn ? t('Browse categories', 'వర్గాలను చూడండి') : t('Open profile', 'ప్రొఫైల్ తెరవండి')}</Text>
            </Pressable>
          </View>
        ) : (
          sortNearest(savedBusinesses).map((business) => (
            <Pressable key={business.id} style={styles.businessCard} onPress={() => { setSelectedBusinessId(business.id); navigation.navigate('BusinessDetails', { id: business.id }) }}>
              <View style={[styles.businessImageWrap, selectedBusinessId === business.id && styles.businessImageWrapSelected]}>
                <RemoteImage
                  source={getBusinessImage(business.image, business.categoryName)}
                  style={styles.businessImage}
                  resizeMode="cover"
                  fallbackContent={<View style={styles.businessIconFallback}><Text style={styles.businessIconText}>{favoriteIcons[business.categoryName || ''] || business.categoryName?.charAt(0) || '📍'}</Text></View>}
                />
              </View>
              <View style={styles.businessBody}>
                <Text style={styles.businessName}>{businessName(business.name, business.nameTe)}</Text>
                <Text style={styles.businessCategory}>{categoryLabel(business.categoryName)}</Text>
                <Text style={styles.businessAddress}>{business.address}</Text><Text style={styles.businessDistance}>{(distances[business.id] ?? distances[business.address]) !== undefined ? `${((distances[business.id] ?? distances[business.address]) as number).toFixed(1)} ${t('km away', 'కి.మీ దూరంలో')}` : t('Finding distance…', 'దూరాన్ని కనుగొంటున్నాము…')}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
      <BottomNav navigation={navigation} active="Favorites" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pageHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#EFEAFE' },
  pageBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 18, backgroundColor: '#E1D9FF' },
  pageBackText: { color: '#4A4AD5', fontSize: 22, lineHeight: 24, textAlign: 'center' },
  pageHeaderCopy: { flex: 1, marginLeft: 0 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center' },
  pageIconBadge: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 15, backgroundColor: '#E1D9FF' },
  pageIconText: { color: '#4A4AD5', fontSize: 16, lineHeight: 18 },
  pageKicker: { color: '#5B52D1', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pageTitle: { marginTop: 2, color: '#2F2F43', fontSize: 22, fontWeight: '800' },
  countBubble: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#E1D9FF' },
  countBubbleText: { color: '#4A4AD5', fontSize: 12, fontWeight: '800' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userAvatar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#5B55D9' },
  userAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  userName: { flex: 1, marginLeft: 10, color: '#303043', fontSize: 15, fontWeight: '800' },
  logout: { color: '#E34E5B', fontSize: 13, fontWeight: '800' },
  kicker: { color: '#D8D7FF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 3, color: '#FFF', fontSize: 32, fontWeight: '800' },
  content: { paddingBottom: 120 },
  emptyCard: { minHeight: 250, marginHorizontal: 0, paddingHorizontal: 24, paddingVertical: 34, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#DDE2F5', backgroundColor: '#FFF' },
  heart: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#FFECEF' },
  heartText: { color: '#E34E5B', fontSize: 25 },
  label: { marginTop: 15, color: '#5B55D9', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heading: { marginTop: 18, color: '#202332', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  copy: { marginTop: 9, color: '#737385', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  button: { minWidth: 120, minHeight: 36, marginTop: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#DCCFE0', backgroundColor: '#1A061D' },
  buttonText: { color: '#FFF', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  businessCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.82)', shadowColor: '#8C5B4B', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  businessImageWrap: { width: 96, height: 96, borderRadius: 14, overflow: 'hidden', marginRight: 12, backgroundColor: '#EEF0FF', borderWidth: 1, borderColor: '#E7D7D0' },
  businessImageWrapSelected: { borderWidth: 2, borderColor: '#514BD5' },
  businessImage: { width: '100%', height: '100%' },
  businessIconFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF0FF' },
  businessIconText: { color: '#514BD5', fontSize: 18, fontWeight: '800' },
  businessBody: { flex: 1 },
  businessName: { color: '#202332', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  businessCategory: { marginTop: 3, color: '#5D5EE8', fontSize: 11, fontWeight: '700' },
  businessAddress: { marginTop: 4, color: '#636B82', fontSize: 11, lineHeight: 16 },
  businessDistance: { marginTop: 3, color: '#4D8052', fontSize: 11, fontWeight: '700' },
  arrow: { color: '#2A2B3A', fontSize: 28, marginLeft: 8 },
})