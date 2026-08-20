import React from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Constants from 'expo-constants'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import { useLanguage } from '../context/LanguageContext'

export default function About({ navigation }: any) {
  const { t } = useLanguage()
  const version = Constants.expoConfig?.version || '1.0.0'

  const highlights = [
    { icon: '🏬', title: t('Local directory', 'స్థానిక డైరెక్టరీ'), copy: t('Discover shops, services, and businesses around Kandukur.', 'కందుకూరు చుట్టుపక్కల దుకాణాలు, సేవలు మరియు వ్యాపారాలను కనుగొనండి.') },
    { icon: '📢', title: t('Announcements', 'ప్రకటనలు'), copy: t('Stay updated with local openings, events, and offers.', 'స్థానిక ప్రారంభాలు, కార్యక్రమాలు మరియు ఆఫర్‌లతో అప్‌డేట్‌గా ఉండండి.') },
    { icon: '📍', title: t('Nearby search', 'సమీప శోధన'), copy: t('Find the closest listings sorted by your live location.', 'మీ ప్రస్తుత స్థానం ఆధారంగా సమీప జాబితాలను కనుగొనండి.') },
    { icon: '⭐', title: t('Reviews & favorites', 'సమీక్షలు & ఇష్టమైనవి'), copy: t('Rate businesses and save your favorites for quick access.', 'వ్యాపారాలను రేట్ చేసి, త్వరిత యాక్సెస్ కోసం ఇష్టమైనవిగా సేవ్ చేయండి.') },
  ]

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Pressable style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></Pressable>
          <View>
            <Text style={styles.kicker}>{t('ABOUT', 'గురించి')}</Text>
            <Text style={styles.title}>{t('About Mana Kandukur', 'మనా కందుకూరు గురించి')}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.mark}><Text style={styles.markText}>MK</Text></View>
          <Text style={styles.heroTitle}>Mana Kandukur</Text>
          <Text style={styles.heroCopy}>
            {t(
              'Mana Kandukur is a community directory app built to bring every local business, service, and update in Kandukur to your fingertips.',
              'మనా కందుకూరు అనేది కందుకూరులోని ప్రతి స్థానిక వ్యాపారం, సేవ మరియు అప్‌డేట్‌ను మీకు అందుబాటులో తెచ్చే ఒక కమ్యూనిటీ డైరెక్టరీ యాప్.',
            )}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('What you can do', 'మీరు ఏమి చేయవచ్చు')}</Text>
          <View style={styles.list}>
            {highlights.map((item) => (
              <View key={item.title} style={styles.row}>
                <Text style={styles.rowIcon}>{item.icon}</Text>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowDetail}>{item.copy}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Get in touch', 'సంప్రదించండి')}</Text>
          <View style={styles.list}>
            <Pressable style={styles.row} onPress={() => navigation.navigate('Feedback')}>
              <Text style={styles.rowIcon}>✉️</Text>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{t('Feedback & complaints', 'అభిప్రాయం మరియు ఫిర్యాదులు')}</Text>
                <Text style={styles.rowDetail}>{t('Tell us how we can improve the app.', 'యాప్‌ను మెరుగుపరచడానికి మీ అభిప్రాయం చెప్పండి.')}</Text>
              </View>
            </Pressable>
            <Pressable style={styles.row} onPress={() => Linking.openURL('https://github.com/nagaraju1692/Kandukur-mobile-apk')}>
              <Text style={styles.rowIcon}>⬇️</Text>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{t('Latest app releases', 'తాజా యాప్ విడుదలలు')}</Text>
                <Text style={styles.rowDetail}>{t('Download the newest APK builds on GitHub.', 'GitHubలో తాజా APK బిల్డ్‌లను డౌన్‌లోడ్ చేయండి.')}</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionText}>{t('Version', 'వెర్షన్')} {version}</Text>
      </ScrollView>
      <BottomNav navigation={navigation} active="Profile" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAEAF9' },
  content: { padding: 18, paddingBottom: 120 },
  heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRadius: 21, backgroundColor: '#FFFDFB' },
  backText: { color: '#302C2A', fontSize: 24 },
  kicker: { color: '#5B55D9', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { maxWidth: 280, marginTop: 3, color: '#202332', fontSize: 22, fontWeight: '800' },
  heroCard: { alignItems: 'center', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' },
  mark: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A4AD5' },
  markText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  heroTitle: { marginTop: 12, color: '#202332', fontSize: 20, fontWeight: '800' },
  heroCopy: { marginTop: 10, color: '#5D6279', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  section: { marginTop: 18 },
  sectionTitle: { marginBottom: 10, color: '#202332', fontSize: 15, fontWeight: '800' },
  list: { borderRadius: 14, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1EDEA' },
  rowIcon: { fontSize: 20, lineHeight: 24 },
  rowCopy: { flex: 1 },
  rowTitle: { color: '#302C2A', fontSize: 14, fontWeight: '800' },
  rowDetail: { marginTop: 3, color: '#6D7285', fontSize: 12, lineHeight: 17 },
  versionText: { marginTop: 22, color: '#8A8FA3', fontSize: 12, textAlign: 'center' },
})
