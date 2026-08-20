import React, { useEffect, useRef, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useNotifications } from '../context/NotificationContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions } from 'react-native'

export default function MobileHeader({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { notifications, clearNotifications } = useNotifications()
  const { width } = useWindowDimensions()
  const isCompact = width < 430
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[number] | null>(null)
  const previousNotificationCount = useRef(notifications.length)

  useEffect(() => {
    if (showNotifications && previousNotificationCount.current > 0 && notifications.length === 0) {
      setShowNotifications(false)
      setSelectedNotification(null)
    }
    if (selectedNotification && !notifications.some((notification) => notification.id === selectedNotification.id)) {
      setSelectedNotification(null)
    }
    previousNotificationCount.current = notifications.length
  }, [notifications, selectedNotification, showNotifications])

  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={styles.brandBlock}>
        <View style={styles.mark}><Text style={styles.markText}>MK</Text></View>
        <View style={styles.brandCopy}>
          <Text style={styles.brand} numberOfLines={1} ellipsizeMode="tail">Mana Kandukur</Text>
          <View style={styles.agriStrip}>
            <Text style={styles.agriItem}>🌾</Text>
            <Text style={styles.agriItem}>🌿</Text>
            <Text style={styles.agriItem}>🌶️</Text>
            <Text style={styles.agriItem}>🌱</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {!isCompact && <Image
          source={{ uri: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=160&q=80' }}
          style={styles.agriImage}
        />}
        <View style={styles.languageToggle}>
          {(['en', 'te'] as const).map((item) => (
            <Pressable key={item} style={[styles.language, language === item && styles.activeLanguage]} onPress={() => setLanguage(item)}>
              <Text style={[styles.languageText, language === item && styles.activeLanguageText]}>{item === 'en' ? 'English' : 'తెలుగు'}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileText}>👤</Text>
          <Text style={styles.profileName} numberOfLines={1}>{user?.name?.split(' ')[0] || t('Login', 'లాగిన్')}</Text>
        </Pressable>
        <Pressable
          style={styles.notificationButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('Open notifications', 'నోటిఫికేషన్‌లను తెరవండి')}
          onPress={() => setShowNotifications(true)}
        >
          <Text style={styles.bell}>🔔</Text>
          {notifications.length > 0 && !showNotifications && <View style={styles.notificationDot} />}
        </Pressable>
      </View>

      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.notificationBackdrop}>
          <View style={styles.notificationPanel}>
            <View style={styles.notificationHeading}>
              <View>
                <Text style={styles.notificationTitle}>{t('Notifications', 'నోటిఫికేషన్లు')}</Text>
                <Text style={styles.notificationCount}>{notifications.length} {t('recent updates', 'తాజా అప్‌డేట్లు')}</Text>
              </View>
              <View style={styles.notificationActions}>
                <Pressable style={styles.clearButton} onPress={clearNotifications}><Text style={styles.clearText}>{t('Clear', 'క్లియర్')}</Text></Pressable>
                <Pressable onPress={() => setShowNotifications(false)}><Text style={styles.close}>×</Text></Pressable>
              </View>
            </View>
            <ScrollView style={styles.notificationList} contentContainerStyle={styles.notificationListContent}>
              {notifications.length === 0 ? <Text style={styles.emptyNotifications}>{t('No new notifications.', 'కొత్త నోటిఫికేషన్‌లు లేవు.')}</Text> : notifications.map((notification, index) => (
                <Pressable
                  key={`${notification.title}-${index}`}
                  style={styles.notificationCard}
                  onPress={() => setSelectedNotification(notification)}
                  accessibilityRole="button"
                >
                  <Text style={styles.notificationCardTitle}>{notification.title}</Text>
                  <Text style={styles.notificationCardMessage}>{notification.message}</Text>
                  <Text style={styles.notificationCardTime}>{notification.time}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={selectedNotification !== null} transparent animationType="fade" onRequestClose={() => setSelectedNotification(null)}>
        <View style={styles.notificationBackdrop}>
          {selectedNotification && (
            <View style={styles.announcementModal}>
              {selectedNotification.image ? <Image source={{ uri: selectedNotification.image }} style={styles.announcementImage} resizeMode="cover" /> : null}
              <View style={styles.announcementBody}>
                <View style={styles.updateModalTop}>
                <Text style={styles.updateBadge}>{selectedNotification.type}</Text>
                <Pressable style={styles.updateClose} onPress={() => setSelectedNotification(null)}><Text style={styles.updateCloseText}>×</Text></Pressable>
              </View>
              <Text style={styles.updateTitle}>{selectedNotification.announcementTitle}</Text>
              <Text style={styles.updateMeta}>{selectedNotification.detail}</Text>
              <Text style={styles.updateDescription}>{selectedNotification.description}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { position: 'relative', zIndex: 10, minHeight: 62, paddingBottom: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#B088C8' },
  brandBlock: { flex: 1, minWidth: 105, flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  mark: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 7, backgroundColor: 'rgba(255,255,255,0.20)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  markText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  brandCopy: { flexShrink: 1, minWidth: 0 },
  brand: { flexShrink: 1, maxWidth: 104, color: '#FFF', fontSize: 17, lineHeight: 20, fontWeight: '800' },
  agriStrip: { flexDirection: 'row', marginTop: 4 },
  agriItem: { width: 18, height: 18, borderRadius: 9, overflow: 'hidden', textAlign: 'center', fontSize: 10, lineHeight: 18, marginRight: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  actions: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  agriImage: { width: 30, height: 30, borderRadius: 10, marginRight: 6 },
  languageToggle: { flexDirection: 'row', gap: 4 },
  language: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 7, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E9E3EA', backgroundColor: '#FFFFFF' },
  activeLanguage: { borderColor: '#8B82E8', backgroundColor: '#FAF9FF' },
  languageText: { color: '#686071', fontSize: 11, fontWeight: '800' },
  activeLanguageText: { color: '#514BD5' },
  profileButton: { maxWidth: 82, minWidth: 64, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: 9, borderWidth: 1, borderColor: '#E9E3EA', backgroundColor: '#FFFFFF', shadowColor: '#35283A', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  profileText: { fontSize: 15, marginRight: 4 },
  profileName: { maxWidth: 51, color: '#625A68', fontSize: 11, fontWeight: '800' },
  notificationButton: { position: 'relative', width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: '#E9E3EA', backgroundColor: '#FFFFFF', shadowColor: '#35283A', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  bell: { fontSize: 18 },
  notificationDot: { position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF4F5E', borderWidth: 1, borderColor: '#FFF' },
  notificationBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(25, 24, 25, 0.58)' },
  notificationPanel: { width: '100%', maxWidth: 440, maxHeight: '82%', padding: 16, borderRadius: 22, backgroundColor: '#FFFDFB' },
  notificationHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  notificationTitle: { color: '#302C2A', fontSize: 21, fontWeight: '800' },
  notificationCount: { marginTop: 4, color: '#77716D', fontSize: 13 },
  notificationActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: '#F1D4C5', backgroundColor: '#FFF8F1' },
  clearText: { color: '#D35B50', fontSize: 12, fontWeight: '800' },
  close: { color: '#5C5A57', fontSize: 28, lineHeight: 30 },
  notificationList: { maxHeight: 470 },
  notificationListContent: { gap: 10, paddingBottom: 2 },
  notificationCard: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F1D9CB', backgroundColor: '#FFF5EA' },
  notificationCardTitle: { color: '#38302C', fontSize: 14, fontWeight: '800' },
  notificationCardMessage: { marginTop: 5, color: '#5D554F', fontSize: 12, lineHeight: 17 },
  notificationCardTime: { marginTop: 8, color: '#8A7C73', fontSize: 11 },
  emptyNotifications: { padding: 24, color: '#77716D', fontSize: 13, textAlign: 'center' },
  announcementModal: { width: '100%', maxWidth: 420, overflow: 'hidden', borderRadius: 22, backgroundColor: '#FFFDFB' },
  announcementImage: { width: '100%', height: 210, backgroundColor: '#222' },
  announcementBody: { padding: 20 },
  updateModalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  updateBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, color: '#42647D', backgroundColor: '#DDF0FA', fontSize: 11, fontWeight: '800' },
  updateClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F0EB' },
  updateCloseText: { color: '#5C5A57', fontSize: 23, lineHeight: 26 },
  updateTitle: { marginTop: 23, color: '#302C2A', fontSize: 25, fontWeight: '800', lineHeight: 31 },
  updateMeta: { marginTop: 12, color: '#D35B50', fontSize: 14, fontWeight: '700' },
  updateDescription: { marginTop: 18, color: '#5F5B58', fontSize: 15, lineHeight: 23 },
  updateSource: { marginTop: 22, color: '#77716D', fontSize: 12 },
})
