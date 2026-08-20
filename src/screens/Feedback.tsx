import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { fetchJson } from '../services/api'
import FocusTextInput from '../ui/FocusTextInput'

type UserFeedback = { id: string; type: string; subject: string; message: string; adminReply?: string | null; createdAt: string }

export default function Feedback({ navigation }: any) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [type, setType] = useState<'Feedback' | 'Complaint'>('Feedback')
  const [form, setForm] = useState({ subject: '', contact: '', message: '' })
  const [messages, setMessages] = useState<UserFeedback[]>([])
  const [historyError, setHistoryError] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const loadMessages = () => {
    if (!user?.phone) return
    fetchJson<{ data: UserFeedback[] }>('/api/feedback/mine', undefined, user.phone).then((response) => { setMessages(response.data); setHistoryError('') }).catch(() => setHistoryError(t('Unable to load previous messages.', 'మునుపటి సందేశాలను లోడ్ చేయలేకపోయాము.')))
  }
  useEffect(() => { loadMessages() }, [user?.phone])
  const submit = async () => {
    if (form.subject.trim().length < 3 || form.message.trim().length < 10) { setError(t('Add a subject and at least 10 characters in your message.', 'విషయం మరియు కనీసం 10 అక్షరాల సందేశం నమోదు చేయండి.')); return }
    if (!user) { setError(t('Sign in before sending a message.', 'సందేశం పంపే ముందు సైన్ ఇన్ చేయండి.')); return }
    setIsSubmitting(true)
    try {
      const response = await fetchJson<{ data: UserFeedback }>('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type }) }, user.phone)
      setError(''); setForm({ subject: '', contact: '', message: '' }); setMessages((current) => [response.data, ...current]); setSubmitted(true); loadMessages()
    } catch { setError(t('Unable to send your message. Please try again.', 'మీ సందేశం పంపలేకపోయాము. మళ్లీ ప్రయత్నించండి.')) } finally { setIsSubmitting(false) }
  }
  return <View style={styles.screen}>
    <MobileHeader navigation={navigation} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}><Pressable style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></Pressable><View><Text style={styles.kicker}>{t('SUPPORT', 'మద్దతు')}</Text><Text style={styles.title}>{t('Feedback & complaints', 'అభిప్రాయం మరియు ఫిర్యాదులు')}</Text></View></View>
      {submitted ? <View style={styles.success}><Text style={styles.successIcon}>✓</Text><Text style={styles.successTitle}>{t('Thank you for reaching out', 'సంప్రదించినందుకు ధన్యవాదాలు')}</Text><Text style={styles.successCopy}>{t('Your message was saved. Our team will review it shortly.', 'మీ సందేశం సేవ్ చేయబడింది. మా బృందం త్వరలో పరిశీలిస్తుంది.')}</Text><Pressable style={styles.primary} onPress={() => setSubmitted(false)}><Text style={styles.primaryText}>{t('Send another message', 'మరో సందేశం పంపండి')}</Text></Pressable></View> : <View style={styles.card}>
        <Text style={styles.intro}>{t('Tell us how we can improve Mana Kandukur.', 'మనా కందుకూరును మెరుగుపరచడానికి మీ అభిప్రాయం చెప్పండి.')}</Text>
        <Text style={styles.label}>{t('Message type', 'సందేశ రకం')}</Text>
        <View style={styles.typeRow}>{(['Feedback', 'Complaint'] as const).map((item) => <Pressable key={item} style={[styles.typeButton, type === item && styles.typeActive]} onPress={() => setType(item)}><Text style={[styles.typeText, type === item && styles.typeActiveText]}>{t(item, item === 'Complaint' ? 'ఫిర్యాదు' : 'అభిప్రాయం')}</Text></Pressable>)}</View>
        <Text style={styles.label}>{t('Subject', 'విషయం')} *</Text><FocusTextInput style={styles.input} placeholder={t('Enter a subject', 'విషయం నమోదు చేయండి')} placeholderTextColor="#888" value={form.subject} onChangeText={(value) => update('subject', value)} />
        <Text style={styles.label}>{t('Contact number', 'సంప్రదింపు నంబర్')}</Text><FocusTextInput style={styles.input} placeholder={t('Optional mobile number', 'ఐచ్ఛిక మొబైల్ నంబర్')} placeholderTextColor="#888" value={form.contact} onChangeText={(value) => update('contact', value)} keyboardType="phone-pad" />
        <Text style={styles.label}>{t('Message', 'సందేశం')} *</Text><FocusTextInput style={[styles.input, styles.multiline]} placeholder={t('Write your message...', 'మీ సందేశాన్ని రాయండి...')} placeholderTextColor="#888" value={form.message} onChangeText={(value) => update('message', value)} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.primary, isSubmitting && styles.disabled]} disabled={isSubmitting} onPress={submit}><Text style={styles.primaryText}>{isSubmitting ? t('Sending...', 'పంపుతోంది...') : t('Send message', 'సందేశం పంపండి')}</Text></Pressable>
      </View>}
      {historyError ? <Text style={styles.error}>{historyError}</Text> : null}
      {messages.length > 0 ? <View style={styles.historyCard}><Text style={styles.historyTitle}>{t('Your messages', 'మీ సందేశాలు')}</Text>{messages.map((item) => <View key={item.id} style={styles.historyItem}><Text style={styles.historySubject}>{item.subject}</Text><Text style={styles.historyMeta}>{item.type} · {new Date(item.createdAt).toLocaleDateString()}</Text><Text style={styles.historyMessage}>{item.message}</Text>{item.adminReply ? <Text style={styles.adminReply}>{t('Admin reply:', 'అడ్మిన్ సమాధానం:')} {item.adminReply}</Text> : <Text style={styles.waitingReply}>{t('Awaiting admin reply', 'అడ్మిన్ సమాధానం కోసం వేచి ఉంది')}</Text>}</View>)}</View> : null}
    </ScrollView>
    <BottomNav navigation={navigation} active="Profile" />
  </View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAEAF9' }, content: { padding: 18, paddingBottom: 120 }, heading: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRadius: 21, backgroundColor: '#FFFDFB' }, backText: { color: '#302C2A', fontSize: 24 }, kicker: { color: '#5B55D9', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, title: { maxWidth: 280, marginTop: 3, color: '#202332', fontSize: 25, fontWeight: '800' }, card: { padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' }, intro: { color: '#5D6279', fontSize: 14, lineHeight: 20, marginBottom: 8 }, label: { marginTop: 14, color: '#3F414D', fontSize: 13, fontWeight: '800' }, typeRow: { flexDirection: 'row', gap: 10, marginTop: 8 }, typeButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1' }, typeActive: { borderColor: '#D35B50', backgroundColor: '#FFF0E9' }, typeText: { color: '#5C554F', fontSize: 12, fontWeight: '700' }, typeActiveText: { color: '#C95E49' }, input: { minHeight: 48, marginTop: 7, paddingHorizontal: 13, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1', backgroundColor: '#FFFCFA', color: '#302C2A', fontSize: 14 }, multiline: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' }, error: { marginTop: 8, color: '#C7414F', fontSize: 11 }, primary: { alignItems: 'center', marginTop: 20, paddingVertical: 14, borderRadius: 8, backgroundColor: '#514BD5' }, primaryText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, disabled: { opacity: 0.55 }, success: { alignItems: 'center', padding: 28, borderRadius: 14, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' }, successIcon: { width: 58, height: 58, borderRadius: 29, color: '#FFF', backgroundColor: '#5D9B65', fontSize: 36, lineHeight: 58, textAlign: 'center' }, successTitle: { marginTop: 16, color: '#302C2A', fontSize: 20, fontWeight: '800', textAlign: 'center' }, successCopy: { marginTop: 8, color: '#6B6B73', fontSize: 13, lineHeight: 19, textAlign: 'center' }, historyCard: { marginTop: 16, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' }, historyTitle: { color: '#302C2A', fontSize: 16, fontWeight: '800' }, historyItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE8E3' }, historySubject: { color: '#302C2A', fontSize: 13, fontWeight: '800' }, historyMeta: { marginTop: 3, color: '#77716D', fontSize: 10, fontWeight: '700' }, historyMessage: { marginTop: 5, color: '#55504C', fontSize: 12, lineHeight: 17 }, adminReply: { marginTop: 8, color: '#4F47B8', fontSize: 12, lineHeight: 17, fontWeight: '700' }, waitingReply: { marginTop: 8, color: '#9B8A7E', fontSize: 11, fontStyle: 'italic' },
})
