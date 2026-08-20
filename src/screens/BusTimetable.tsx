import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import FocusTextInput from '../ui/FocusTextInput'
import { fetchJson } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { colors } from '../ui/theme'

type BusRoute = {
  id: string
  origin: string
  destination: string
  destinationTe?: string | null
  destinationType: 'Village' | 'City'
  serviceType: string
  departureTime: string
  days: string
  notes?: string | null
}

type MandalVillage = {
  id: string
  name: string
  distanceKm?: number | null
  pincode?: string | null
}

const serviceOptions = ['All', 'APSRTC', 'Express', 'Non-AC', 'AC']

function formatTime(time: string) {
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}

export default function BusTimetable({ navigation }: any) {
  const { language, t } = useLanguage()
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [villages, setVillages] = useState<MandalVillage[]>([])
  const [search, setSearch] = useState('')
  const [destinationFilter, setDestinationFilter] = useState('All')
  const [destinationType, setDestinationType] = useState<'All' | 'Village' | 'City'>('All')
  const [serviceType, setServiceType] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const loadRoutes = async () => {
    setLoading(true)
    setError(null)
    try {
      const [routeResponse, villageResponse] = await Promise.all([
        fetchJson<{ data: BusRoute[] }>('/api/bus-routes'),
        fetchJson<{ data: MandalVillage[] }>('/api/mandal-villages'),
      ])
      setRoutes(routeResponse.data)
      setVillages(villageResponse.data)
    } catch {
      setError(t('Unable to load bus timings.', 'బస్సు సమయాలను లోడ్ చేయలేకపోయాము.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRoutes() }, [])

  const visibleRoutes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return routes.filter((route) => {
      const destination = language === 'te' && route.destinationTe ? route.destinationTe : route.destination
      const matchesSearch = !normalizedSearch || `${route.destination} ${route.destinationTe || ''} ${route.serviceType}`.toLowerCase().includes(normalizedSearch)
      const matchesDestination = destinationFilter === 'All' || route.destination === destinationFilter
      const matchesType = destinationType === 'All' || route.destinationType === destinationType
      const matchesService = serviceType === 'All' || route.serviceType === serviceType
      return Boolean(destination) && matchesSearch && matchesDestination && matchesType && matchesService
    })
  }, [routes, search, destinationFilter, destinationType, serviceType, language])

  const availableServices = useMemo(() => serviceOptions.filter((option) => option === 'All' || routes.some((route) => route.serviceType === option)), [routes])
  const destinations = useMemo(() => Array.from(new Set(routes.map((route) => route.destination))).sort(), [routes])
  const selectVillage = (village: MandalVillage) => {
    setSearch('')
    setDestinationFilter(village.name)
    setDestinationType('Village')
    setServiceType('All')
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{t('KANDUKUR BUS STAND', 'కందుకూరు బస్ స్టాండ్')}</Text>
          <Text style={styles.title}>{t('Bus Timetable', 'బస్సు సమయ పట్టిక')}</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.originBar}><Text style={styles.originLabel}>{t('DEPARTURES FROM', 'బయలుదేరే స్థలం')}</Text><Text style={styles.originValue}>{t('Kandukur Bus Stand', 'కందుకూరు బస్ స్టాండ్')}</Text></View>
        <FocusTextInput style={styles.search} value={search} onChangeText={setSearch} placeholder={t('Search destination, e.g. Kanigiri', 'గమ్యస్థానాన్ని శోధించండి, ఉదా: కనిగిరి')} placeholderTextColor="#77798A" />

        <Text style={styles.filterLabel}>{t('Choose destination', 'గమ్యస్థానాన్ని ఎంచుకోండి')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{['All', ...destinations].map((destination) => <Pressable key={destination} style={[styles.chip, destinationFilter === destination && styles.chipActive]} onPress={() => setDestinationFilter(destination)}><Text style={[styles.chipText, destinationFilter === destination && styles.chipTextActive]}>{destination === 'All' ? t('All destinations', 'అన్ని గమ్యస్థానాలు') : language === 'te' ? routes.find((route) => route.destination === destination)?.destinationTe || destination : destination}</Text></Pressable>)}</ScrollView>

        <Text style={styles.filterLabel}>{t('Destination type', 'గమ్యస్థాన రకం')}</Text>
        <View style={styles.chips}>{(['All', 'Village', 'City'] as const).map((option) => <Pressable key={option} style={[styles.chip, destinationType === option && styles.chipActive]} onPress={() => setDestinationType(option)}><Text style={[styles.chipText, destinationType === option && styles.chipTextActive]}>{option === 'All' ? t('All', 'అన్నీ') : option === 'Village' ? t('Villages', 'గ్రామాలు') : t('Cities', 'నగరాలు')}</Text></Pressable>)}</View>

        <Text style={styles.filterLabel}>{t('Service type', 'సర్వీస్ రకం')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{availableServices.map((option) => <Pressable key={option} style={[styles.chip, serviceType === option && styles.chipActive]} onPress={() => setServiceType(option)}><Text style={[styles.chipText, serviceType === option && styles.chipTextActive]}>{option === 'All' ? t('All services', 'అన్ని సర్వీసులు') : option}</Text></Pressable>)}</ScrollView>

        <Text style={styles.count}>{visibleRoutes.length} {t('departures found', 'బయలుదేరే సర్వీసులు కనుగొనబడ్డాయి')}</Text>
        {loading ? <Text style={styles.status}>{t('Loading bus timings…', 'బస్సు సమయాలు లోడ్ అవుతున్నాయి…')}</Text> : error ? <View style={styles.empty}><Text style={styles.status}>{error}</Text><Pressable style={styles.retry} onPress={loadRoutes}><Text style={styles.retryText}>{t('Retry', 'మళ్లీ ప్రయత్నించండి')}</Text></Pressable></View> : visibleRoutes.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>{t('No published departures yet', 'ఇంకా ప్రచురించిన బయలుదేరే సమయాలు లేవు')}</Text><Text style={styles.status}>{t('Timings are published after verification at Kandukur Bus Stand.', 'కందుకూరు బస్ స్టాండ్ వద్ద ధృవీకరణ తర్వాత సమయాలు ప్రచురించబడతాయి.')}</Text></View> : visibleRoutes.map((route) => <View key={route.id} style={styles.routeCard}><View style={styles.timeBlock}><Text style={styles.time}>{formatTime(route.departureTime)}</Text><Text style={styles.days}>{route.days}</Text></View><View style={styles.routeCopy}><Text style={styles.destination}>{language === 'te' && route.destinationTe ? route.destinationTe : route.destination}</Text><View style={styles.routeMeta}><Text style={styles.service}>{route.serviceType}</Text><Text style={styles.destinationType}>{route.destinationType === 'Village' ? t('Village', 'గ్రామం') : t('City', 'నగరం')}</Text></View>{route.notes ? <Text style={styles.notes}>{route.notes}</Text> : null}</View></View>)}

        {villages.length > 0 && <><Text style={styles.villageHeading}>{t('Kandukur Mandal Villages', 'కందుకూరు మండల గ్రామాలు')}</Text><Text style={styles.villageSubheading}>{t('Tap a village to see departures from Kandukur', 'కందుకూరు నుండి బయలుదేరే బస్సులను చూడటానికి గ్రామాన్ని ఎంచుకోండి')}</Text><View style={styles.villageList}>{villages.map((village) => <Pressable key={village.id} style={styles.villageRow} onPress={() => selectVillage(village)}><View style={styles.villagePin}><Text style={styles.villagePinText}>📍</Text></View><View style={styles.villageCopy}><Text style={styles.villageName}>{village.name}</Text><Text style={styles.villageMeta}>{village.distanceKm !== null && village.distanceKm !== undefined ? `${village.distanceKm} ${t('km from Kandukur', 'కి.మీ కందుకూరు నుండి')}` : t('Distance not available', 'దూరం అందుబాటులో లేదు')}</Text></View>{village.pincode ? <Text style={styles.pincode}>{village.pincode}</Text> : null}<Text style={styles.villageArrow}>›</Text></Pressable>)}</View></>}
      </ScrollView>
      <BottomNav navigation={navigation} active="Categories" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#EFEAFE' },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 18, backgroundColor: '#E1D9FF' },
  backText: { color: '#4A4AD5', fontSize: 22, lineHeight: 24 },
  headerCopy: { flex: 1 },
  kicker: { color: '#5B52D1', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 2, color: '#2F2F43', fontSize: 22, fontWeight: '800' },
  content: { padding: 18, paddingBottom: 110 },
  originBar: { padding: 14, borderRadius: 10, backgroundColor: '#E9E9FF' },
  originLabel: { color: '#625B9D', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  originValue: { marginTop: 4, color: '#2F2F43', fontSize: 16, fontWeight: '800' },
  search: { height: 48, marginTop: 14, paddingHorizontal: 13, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1', color: '#302C2A', backgroundColor: '#FFFCFA', fontSize: 14 },
  filterLabel: { marginTop: 16, color: '#4F4B5B', fontSize: 12, fontWeight: '800' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8, paddingRight: 8 },
  chip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: '#DCDDEA', backgroundColor: '#F8F9FF' },
  chipActive: { borderColor: '#514BD5', backgroundColor: '#514BD5' },
  chipText: { color: '#555B70', fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  count: { marginTop: 20, color: '#666177', fontSize: 12, fontWeight: '700' },
  routeCard: { flexDirection: 'row', marginTop: 10, overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: '#E2DEED', backgroundColor: '#FFFDFB' },
  timeBlock: { width: 94, alignItems: 'center', justifyContent: 'center', padding: 14, backgroundColor: '#E9E9FF' },
  time: { color: '#3F38B7', fontSize: 16, fontWeight: '800' },
  days: { marginTop: 5, color: '#625B9D', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  routeCopy: { flex: 1, padding: 14 },
  destination: { color: '#28263B', fontSize: 16, fontWeight: '800' },
  routeMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  service: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, color: '#9A542D', backgroundColor: '#FFE5BE', fontSize: 10, fontWeight: '800' },
  destinationType: { color: '#527059', fontSize: 11, fontWeight: '700' },
  notes: { marginTop: 8, color: '#716B77', fontSize: 11, lineHeight: 16 },
  empty: { alignItems: 'center', marginTop: 16, padding: 24, borderRadius: 10, borderWidth: 1, borderColor: '#E2DEED', backgroundColor: '#FFFDFB' },
  emptyTitle: { color: '#343142', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  status: { color: '#716B77', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retry: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: '#514BD5' },
  retryText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  villageHeading: { marginTop: 26, color: '#2F2F43', fontSize: 18, fontWeight: '800' },
  villageSubheading: { marginTop: 4, color: '#716B77', fontSize: 12 },
  villageList: { marginTop: 10, gap: 8 },
  villageRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2DEED', backgroundColor: '#FFFDFB' },
  villagePin: { width: 28, alignItems: 'center' },
  villagePinText: { fontSize: 14 },
  villageCopy: { flex: 1, marginLeft: 5 },
  villageName: { color: '#343142', fontSize: 14, fontWeight: '800' },
  villageMeta: { marginTop: 3, color: '#716B77', fontSize: 11 },
  pincode: { color: '#514BD5', fontSize: 12, fontWeight: '800' },
  villageArrow: { marginLeft: 8, color: '#514BD5', fontSize: 23, lineHeight: 24 },
})
