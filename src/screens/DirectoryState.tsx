import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../ui/theme'
import { useLanguage } from '../context/LanguageContext'

export default function DirectoryState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  const { t } = useLanguage()
  if (!loading && !error) return null
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <Text style={styles.icon}>!</Text>}
      <Text style={styles.title}>{loading ? t('Loading local listings…', 'స్థానిక లిస్టింగ్‌లు లోడ్ అవుతున్నాయి…') : t('We could not load the directory', 'డైరెక్టరీని లోడ్ చేయలేకపోయాము')}</Text>
      {!loading && <Text style={styles.message}>{error || t('Check your connection and try again.', 'మీ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.')}</Text>}
      {!loading && <Pressable style={styles.button} onPress={onRetry}><Text style={styles.buttonText}>{t('Retry', 'మళ్లీ ప్రయత్నించండి')}</Text></Pressable>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.section, marginTop: spacing.section, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  icon: { width: 34, height: 34, borderRadius: 17, color: '#FFF', backgroundColor: colors.danger, fontSize: 22, fontWeight: '800', lineHeight: 34, textAlign: 'center' },
  title: { marginTop: 10, color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  message: { marginTop: 6, color: colors.muted, fontSize: 12, textAlign: 'center' },
  button: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, backgroundColor: colors.primary },
  buttonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
})
