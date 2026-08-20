import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const baseItems = [
  { route: 'Home', icon: '🏠', label: 'Home' },
  { route: 'Search', icon: '🔍', label: 'Search' },
  { route: 'Categories', icon: '📂', label: 'Categories' },
  { route: 'Favorites', icon: '❤️', label: 'Favorites' },
  { route: 'Profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav({ navigation, active }: { navigation: any; active: string }) {
  const { isSuperAdmin } = useAuth()
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const labels: Record<string, string> = { Home: t('Home', 'హోమ్'), Search: t('Search', 'శోధన'), Categories: t('Categories', 'వర్గాలు'), Favorites: t('Favorites', 'ఇష్టమైనవి'), Profile: t('Profile', 'ప్రొఫైల్'), Admin: t('Admin', 'అడ్మిన్') }
  const items = isSuperAdmin ? [...baseItems, { route: 'Admin', icon: '🛠️', label: 'Admin' }] : baseItems
  return (
    <View style={[styles.navArea, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {items.map((item) => (
          <Pressable
            key={item.route}
            style={[styles.item, active === item.route && styles.activeItem]}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={[styles.iconWrap, active === item.route && styles.activeIconWrap]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={[styles.label, active === item.route && styles.activeText]}>{labels[item.route]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  navArea: {
    paddingTop: 6,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'transparent',
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E9E3EA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#35283A',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  activeItem: {
    borderColor: '#8B82E8',
    backgroundColor: '#FAF9FF',
  },
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F7F4F8',
  },
  activeIconWrap: {
    backgroundColor: '#ECE9FF',
  },
  icon: {
    fontSize: 21,
    lineHeight: 24,
  },
  label: {
    marginTop: 3,
    color: '#686071',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeText: {
    color: '#514BD5',
  },
})
