import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import BottomNav from './BottomNav'
import MobileHeader from './MobileHeader'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useSubmittedListings } from '../context/SubmittedListingsContext'
import { AdminActivityItem, AdminSummary, fetchAdminRecentActivity, fetchAdminSummary, fetchJson, uploadAdminAnnouncementImage } from '../services/api'
import FocusTextInput from '../ui/FocusTextInput'

type AdminAnnouncement = {
  id: string
  title: string
  detail: string
  description: string
  type: string
  image: string
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
}

type AdminBusiness = {
  id: string
  name: string
  categoryName: string
  address: string
  status?: string
  submittedBy?: string
  image?: string
  description?: string
  phone?: string
  website?: string
  categoryId?: string
  gallery?: string[]
}

type AdminFeedback = {
  id: string
  userPhone: string
  type: string
  subject: string
  contact?: string | null
  message: string
  adminReply?: string | null
  repliedAt?: string | null
  createdAt: string
}

type ListingStatusFilter = 'All' | 'Approved' | 'Pending review' | 'Rejected' | 'Sold out'

const emptyAnnouncementForm = {
  title: '',
  detail: '',
  description: '',
  type: 'general',
  image: '',
  startDate: '',
  endDate: '',
}

export default function Admin({ navigation }: any) {
  const { user, isSuperAdmin } = useAuth()
  const { t } = useLanguage()
  const { listings: mySubmissions } = useSubmittedListings()
  const [activeSection, setActiveSection] = useState<'announcements' | 'businesses' | 'feedback' | 'submissions' | 'analytics'>('announcements')

  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([])
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [feedbackItems, setFeedbackItems] = useState<AdminFeedback[]>([])
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null)
  const [recentActivity, setRecentActivity] = useState<AdminActivityItem[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [listingQuery, setListingQuery] = useState('')
  const [listingStatusFilter, setListingStatusFilter] = useState<ListingStatusFilter>('All')
  const [listingCategoryFilter, setListingCategoryFilter] = useState('All categories')
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  const [loading, setLoading] = useState(true)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null)
  const [webDeleteTarget, setWebDeleteTarget] = useState<AdminAnnouncement | null>(null)
  const [webBusinessDeleteTarget, setWebBusinessDeleteTarget] = useState<AdminBusiness | null>(null)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm)

  const [busyBusinessId, setBusyBusinessId] = useState<string | null>(null)
  const [busyFeedbackId, setBusyFeedbackId] = useState<string | null>(null)
  const [feedbackReplies, setFeedbackReplies] = useState<Record<string, string>>({})
  const [datePickerField, setDatePickerField] = useState<'startDate' | 'endDate' | null>(null)
  const [datePickerValue, setDatePickerValue] = useState(new Date())
  const [webDateInput, setWebDateInput] = useState<{ field: 'startDate' | 'endDate'; value: string } | null>(null)

  const isAnnouncementEditMode = useMemo(() => Boolean(editingAnnouncementId), [editingAnnouncementId])
  const listingCategories = useMemo(() => Array.from(new Set(businesses.map((business) => business.categoryName).filter(Boolean))).sort(), [businesses])
  const filteredBusinesses = useMemo(() => {
    const normalizedQuery = listingQuery.trim().toLowerCase()
    return businesses.filter((business) => {
      const matchesStatus = listingStatusFilter === 'All' || business.status === listingStatusFilter
      const matchesCategory = listingCategoryFilter === 'All categories' || business.categoryName === listingCategoryFilter
      const searchText = [business.name, business.categoryName, business.address, business.submittedBy].filter(Boolean).join(' ').toLowerCase()
      return matchesStatus && matchesCategory && (!normalizedQuery || searchText.includes(normalizedQuery))
    })
  }, [businesses, listingQuery, listingStatusFilter, listingCategoryFilter])

  const loadAdminData = async () => {
    if (!user?.phone) return
    setLoading(true)
    try {
      const [announcementResponse, businessResponse, feedbackResponse] = await Promise.all([
        fetchJson<{ data: AdminAnnouncement[] }>('/api/admin/announcements', undefined, user.phone),
        fetchJson<{ data: AdminBusiness[] }>('/api/admin/businesses', undefined, user.phone),
        fetchJson<{ data: AdminFeedback[] }>('/api/admin/feedback', undefined, user.phone),
      ])
      setAnnouncements(announcementResponse.data)
      setBusinesses(businessResponse.data)
      setFeedbackItems(feedbackResponse.data)
    } catch {
      setAnnouncements([])
      setBusinesses([])
      setFeedbackItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    loadAdminData()
  }, [isSuperAdmin, user?.phone])

  useEffect(() => {
    if (!isSuperAdmin || activeSection !== 'analytics' || !user?.phone) return
    setAnalyticsLoading(true)
    Promise.all([fetchAdminSummary(user.phone), fetchAdminRecentActivity(user.phone)])
      .then(([summaryResponse, activityResponse]) => {
        setAdminSummary(summaryResponse.data)
        setRecentActivity(activityResponse.data)
      })
      .catch(() => {
        setAdminSummary(null)
        setRecentActivity([])
      })
      .finally(() => setAnalyticsLoading(false))
  }, [isSuperAdmin, activeSection, user?.phone])

  // Show messages as an in-app banner instead of a native/browser alert popup.
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showAlert = (title: string, message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ title, message })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500)
  }

  const ensureAdminSession = () => {
    if (user?.phone) return true
    showAlert(t('Session expired', 'Session expired'), t('Please sign in again to continue.', 'Please sign in again to continue.'))
    return false
  }

  const updateAnnouncementForm = (field: keyof typeof emptyAnnouncementForm, value: string) => {
    setAnnouncementForm((current) => ({ ...current, [field]: value }))
  }

  const formatDateLabel = (value: string) => {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    const year = parsed.getFullYear()
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const toInputDateValue = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const openDatePicker = (field: 'startDate' | 'endDate') => {
    if (Platform.OS === 'web') {
      const current = announcementForm[field] || toInputDateValue(new Date())
      setWebDateInput({ field, value: current })
      return
    }

    const initialDate = announcementForm[field] ? new Date(announcementForm[field]) : new Date()
    setDatePickerValue(Number.isNaN(initialDate.getTime()) ? new Date() : initialDate)
    setDatePickerField(field)
  }

  const handleDatePicked = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setDatePickerField(null)
      return
    }

    const nextDate = selectedDate || datePickerValue
    setDatePickerValue(nextDate)
    if (datePickerField) {
      updateAnnouncementForm(datePickerField, toInputDateValue(nextDate))
    }

    if (Platform.OS !== 'ios') {
      setDatePickerField(null)
    }
  }

  const confirmWebDateInput = () => {
    if (!webDateInput) return
    const normalized = webDateInput.value.trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(new Date(normalized).getTime())) {
      showAlert(t('Invalid date', 'Invalid date'), t('Please enter date as YYYY-MM-DD.', 'Please enter date as YYYY-MM-DD.'))
      return
    }
    updateAnnouncementForm(webDateInput.field, normalized)
    setWebDateInput(null)
  }

  const resetAnnouncementForm = () => {
    setAnnouncementForm(emptyAnnouncementForm)
    setEditingAnnouncementId(null)
    setShowAnnouncementForm(false)
  }

  const pickAnnouncementImage = async () => {
    if (!ensureAdminSession()) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      showAlert(t('Permission needed', '?????? ?????'), t('Please allow gallery access to upload image.', '?????? ???????? ????????? ??????? ?????? ???????.'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
    })
    if (result.canceled || !result.assets?.[0]?.uri) return
    const selectedAsset = result.assets[0]

    setUploadingImage(true)
    try {
      const uploaded = await uploadAdminAnnouncementImage({
        uri: selectedAsset.uri,
        fileName: selectedAsset.fileName,
        mimeType: selectedAsset.mimeType,
      }, user.phone)
      updateAnnouncementForm('image', uploaded.data.image)
      showAlert(t('Image uploaded', '?????? ???????? ??????'), t('Image uploaded successfully.', '?????? ?????????? ???????? ??????.'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Unable to upload image now.', '????????? ?????? ???????? ???????????.')
      showAlert(t('Upload failed', '???????? ?????????'), message)
    } finally {
      setUploadingImage(false)
    }
  }

  const saveAnnouncement = async () => {
    if (!ensureAdminSession()) return
    const payload = {
      title: announcementForm.title.trim(),
      detail: announcementForm.detail.trim(),
      description: announcementForm.description.trim(),
      type: announcementForm.type.trim() || 'general',
      image: announcementForm.image.trim(),
      startDate: announcementForm.startDate.trim() || null,
      endDate: announcementForm.endDate.trim() || null,
    }

    if (!payload.title || !payload.detail || !payload.description || !payload.type || !payload.startDate || !payload.endDate) {
      showAlert(t('Missing fields', '??????? ???????? ????'), t('Title, detail, description, type, start date, and end date are required.', 'Title, detail, description, type, start date, and end date are required.'))
      return
    }
    const startMillis = new Date(payload.startDate).getTime()
    const endMillis = new Date(payload.endDate).getTime()
    if (Number.isNaN(startMillis) || Number.isNaN(endMillis)) {
      showAlert(t('Invalid dates', '??????? ??????'), t('Enter valid start and end dates.', '?????? ?????? ??????? ???? ???????? ?????? ????????.'))
      return
    }
    if (startMillis > endMillis) {
      showAlert(t('Date range error', '?????? ?????? ???????'), t('End date should be after start date.', '??????? ?????? ???????? ?????? ????? ???? ??????.'))
      return
    }

    setSavingAnnouncement(true)
    try {
      if (editingAnnouncementId) {
        const response = await fetchJson<{ data: AdminAnnouncement }>(`/api/admin/announcements/${encodeURIComponent(editingAnnouncementId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, user.phone)
        setAnnouncements((current) => current.map((item) => item.id === editingAnnouncementId ? response.data : item))
        await loadAdminData()
        showAlert(t('Updated', '???????? ??????'), t('Announcement updated successfully.', '????????????? ?????????? ???????? ??????.'))
      } else {
        const response = await fetchJson<{ data: AdminAnnouncement }>('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, user.phone)
        setAnnouncements((current) => [response.data, ...current])
        await loadAdminData()
        showAlert(t('Added', '????????????'), t('Announcement added successfully.', '????????????? ?????????? ????????????.'))
      }
      setShowAnnouncementForm(false)
      setEditingAnnouncementId(null)
      setAnnouncementForm(emptyAnnouncementForm)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Unable to save announcement now.', '????????? ????????????? ???? ???????????.')
      showAlert(t('Save failed', '???? ?????????'), message)
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const startAnnouncementEdit = (announcement: AdminAnnouncement) => {
    const fallbackStartDate = toInputDateValue(new Date())
    const resolvedStartDate = announcement.startDate ? formatDateLabel(announcement.startDate) : fallbackStartDate
    const resolvedEndDate = announcement.endDate ? formatDateLabel(announcement.endDate) : resolvedStartDate

    setEditingAnnouncementId(announcement.id)
    setAnnouncementForm({
      title: announcement.title || '',
      detail: announcement.detail || '',
      description: announcement.description || '',
      type: announcement.type || 'general',
      image: announcement.image || '',
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
    })
    setShowAnnouncementForm(true)
    setActiveSection('announcements')
  }

  const executeAnnouncementDelete = async (announcement: AdminAnnouncement) => {
    setDeletingAnnouncementId(announcement.id)
    try {
      await fetchJson<{ success: boolean }>(`/api/admin/announcements/${encodeURIComponent(announcement.id)}`, { method: 'DELETE' }, user.phone)
      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id))
      await loadAdminData()
      if (editingAnnouncementId === announcement.id) resetAnnouncementForm()
      setWebDeleteTarget(null)
      showAlert(t('Deleted', 'Deleted'), t('Announcement deleted successfully.', 'Announcement deleted successfully.'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Unable to delete announcement now.', 'Unable to delete announcement now.')
      showAlert(t('Delete failed', 'Delete failed'), message)
    } finally {
      setDeletingAnnouncementId(null)
    }
  }

  const deleteAnnouncement = (announcement: AdminAnnouncement) => {
    if (!ensureAdminSession()) return
    if (deletingAnnouncementId === announcement.id) return

    if (Platform.OS === 'web') {
      setWebDeleteTarget(announcement)
      return
    }

    const deleteMessage = `${t('Are you sure you want to delete this announcement?', 'Are you sure you want to delete this announcement?')}\n\n${announcement.title}`

    Alert.alert(
      t('Confirm to delete', 'Confirm to delete'),
      deleteMessage,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => {
            void executeAnnouncementDelete(announcement)
          },
        },
      ],
    )
  }

  const updateBusinessStatus = async (businessId: string, status: 'Approved' | 'Rejected' | 'Pending review' | 'Sold out') => {
    if (!ensureAdminSession()) return
    setBusyBusinessId(businessId)
    try {
      const response = await fetchJson<{ data: AdminBusiness }>(`/api/businesses/${encodeURIComponent(businessId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }, user.phone)
      setBusinesses((current) => current.map((item) => item.id === businessId ? response.data : item))
    } catch {
      showAlert(t('Update failed', '???????? ?????????'), t('Unable to update listing status now.', '????????? ????????? ??????? ???????? ???????????.'))
    } finally {
      setBusyBusinessId(null)
    }
  }

  const executeBusinessDelete = async (business: AdminBusiness) => {
    setBusyBusinessId(business.id)
    try {
      await fetchJson<{ success: boolean }>(`/api/businesses/${encodeURIComponent(business.id)}`, { method: 'DELETE' }, user?.phone)
      setBusinesses((current) => current.filter((item) => item.id !== business.id))
      setWebBusinessDeleteTarget(null)
      showAlert(t('Deleted', 'Deleted'), t('Listing deleted successfully.', 'Listing deleted successfully.'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Unable to delete listing now.', 'Unable to delete listing now.')
      showAlert(t('Delete failed', 'Delete failed'), message)
    } finally {
      setBusyBusinessId(null)
    }
  }

  const deleteBusiness = (business: AdminBusiness) => {
    if (!ensureAdminSession()) return
    if (busyBusinessId === business.id) return

    if (Platform.OS === 'web') {
      setWebBusinessDeleteTarget(business)
      return
    }

    Alert.alert(
      t('Delete listing', '????????? ??????????'),
      business.name,
      [
        { text: t('Cancel', '?????'), style: 'cancel' },
        {
          text: t('Delete', '??????????'),
          style: 'destructive',
          onPress: () => void executeBusinessDelete(business),
        },
      ],
    )
  }

  const deleteFeedback = (item: AdminFeedback) => {
    if (!ensureAdminSession()) return
    Alert.alert(
      t('Delete feedback', '??????????? ??????????'),
      item.subject,
      [
        { text: t('Cancel', '?????'), style: 'cancel' },
        {
          text: t('Delete', '??????????'),
          style: 'destructive',
          onPress: async () => {
            setBusyFeedbackId(item.id)
            try {
              await fetchJson<{ success: boolean }>(`/api/admin/feedback/${encodeURIComponent(item.id)}`, { method: 'DELETE' }, user.phone)
              setFeedbackItems((current) => current.filter((feedback) => feedback.id !== item.id))
            } catch {
              showAlert(t('Delete failed', '???????? ?????????'), t('Unable to delete feedback now.', '????????? ??????????? ???????????????.'))
            } finally {
              setBusyFeedbackId(null)
            }
          },
        },
      ],
    )
  }

  const replyToFeedback = async (item: AdminFeedback) => {
    const reply = (feedbackReplies[item.id] || '').trim()
    if (!reply || !user?.phone) return
    setBusyFeedbackId(item.id)
    try {
      const response = await fetchJson<{ data: AdminFeedback }>(`/api/admin/feedback/${encodeURIComponent(item.id)}/reply`, { method: 'PATCH', body: JSON.stringify({ reply }) }, user.phone)
      setFeedbackItems((current) => current.map((currentItem) => currentItem.id === item.id ? response.data : currentItem))
      setFeedbackReplies((current) => ({ ...current, [item.id]: '' }))
    } catch {
      showAlert(t('Reply failed', 'Reply failed'), t('Unable to save the reply.', 'Unable to save the reply.'))
    } finally {
      setBusyFeedbackId(null)
    }
  }

  if (!isSuperAdmin) {
    return (
      <View style={styles.screen}>
        <MobileHeader navigation={navigation} />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{t('Admin access required', '??????? ???????? ?????')}</Text>
          <Text style={styles.emptyCopy}>{t('Only admin users can open this page.', '? ?????? ??????? ??????? ??????? ???????.')}</Text>
        </View>
        <BottomNav navigation={navigation} active="Admin" />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          <Text style={styles.toastMessage}>{toast.message}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headingRow}>
          <Pressable style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>?</Text></Pressable>
          <View>
            <Text style={styles.kicker}>{t('ADMIN', '???????')}</Text>
            <Text style={styles.title}>{t('Operations Console', '????????? ???????')}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
          {[
            { key: 'announcements', label: t('Announcements', '????????????????') },
            { key: 'businesses', label: t('Listings', '????????????') },
            { key: 'feedback', label: t('Feedback', '???????????') },
            { key: 'submissions', label: t('My submissions', 'నా సమర్పణలు') },
            { key: 'analytics', label: t('Analytics', 'Analytics') },
          ].map((tab) => (
            <Pressable key={tab.key} style={[styles.tabButton, activeSection === tab.key && styles.tabActive]} onPress={() => setActiveSection(tab.key as 'announcements' | 'businesses' | 'feedback' | 'submissions' | 'analytics')}>
              <Text style={[styles.tabText, activeSection === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {activeSection === 'announcements' && (
          <>
            {showAnnouncementForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>{isAnnouncementEditMode ? t('Edit announcement', '????????????? ????? ??????') : t('Create announcement', '????????????? ???????????')}</Text>
                {([
                  ['title', 'Title'],
                  ['detail', 'Short detail'],
                  ['type', 'Type (optional)'],
                ] as const).map(([field, label]) => (
                  <FocusTextInput
                    key={field}
                    style={styles.input}
                    placeholder={t(label, label)}
                    value={announcementForm[field]}
                    onChangeText={(value) => updateAnnouncementForm(field, value)}
                    autoCapitalize="none"
                  />
                ))}
                <View style={styles.dateRow}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>{t('Start date *', 'Start date *')}</Text>
                    <Pressable style={styles.datePickerButton} onPress={() => openDatePicker('startDate')}>
                      <Text style={styles.datePickerText}>{announcementForm.startDate ? formatDateLabel(announcementForm.startDate) : t('Choose date', 'Choose date')}</Text>
                      <Text style={styles.datePickerIcon}>📅</Text>
                    </Pressable>
                  </View>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateLabel}>{t('End date *', 'End date *')}</Text>
                    <Pressable style={styles.datePickerButton} onPress={() => openDatePicker('endDate')}>
                      <Text style={styles.datePickerText}>{announcementForm.endDate ? formatDateLabel(announcementForm.endDate) : t('Choose date', 'Choose date')}</Text>
                      <Text style={styles.datePickerIcon}>📅</Text>
                    </Pressable>
                  </View>
                </View>
                {datePickerField && (
                  <DateTimePicker
                    value={datePickerValue}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDatePicked}
                  />
                )}
                {datePickerField && Platform.OS === 'ios' ? (
                  <Pressable style={styles.iosDateDone} onPress={() => setDatePickerField(null)}>
                    <Text style={styles.iosDateDoneText}>{t('Done', 'Done')}</Text>
                  </Pressable>
                ) : null}
                <Pressable style={[styles.uploadButton, uploadingImage && styles.disabled]} onPress={pickAnnouncementImage} disabled={uploadingImage}>
                  <Text style={styles.uploadButtonText}>{uploadingImage ? t('Uploading image...', '?????? ???????? ????????...') : t('Choose image from gallery', '??????? ????? ?????? ?????????')}</Text>
                </Pressable>
                <FocusTextInput
                  style={styles.input}
                  placeholder={t('Image URL (optional)', 'Image URL (optional)')}
                  value={announcementForm.image}
                  onChangeText={(value) => updateAnnouncementForm('image', value)}
                  autoCapitalize="none"
                />
                {announcementForm.image ? <Image source={{ uri: announcementForm.image }} style={styles.preview} resizeMode="cover" /> : null}
                <FocusTextInput
                  style={[styles.input, styles.textarea]}
                  placeholder={t('Description', '?????')}
                  value={announcementForm.description}
                  onChangeText={(value) => updateAnnouncementForm('description', value)}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.actionRow}>
                  <Pressable style={[styles.saveButton, savingAnnouncement && styles.disabled]} onPress={saveAnnouncement} disabled={savingAnnouncement}>
                    <Text style={styles.saveText}>{savingAnnouncement ? t('Saving...', '???? ????????...') : isAnnouncementEditMode ? t('Update', '????????') : t('Publish', '????????????')}</Text>
                  </Pressable>
                  <Pressable style={styles.cancelButton} onPress={resetAnnouncementForm}>
                    <Text style={styles.cancelText}>{t('Cancel', '?????')}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {!showAnnouncementForm && (
              <View style={styles.listCard}>
                <View style={styles.inlineTitleRow}>
                  <Text style={styles.formTitle}>{t('All announcements', '????? ????????????????')}</Text>
                  <Pressable style={styles.smallAction} onPress={() => {
                    setAnnouncementForm(emptyAnnouncementForm)
                    setEditingAnnouncementId(null)
                    setShowAnnouncementForm(true)
                  }}>
                    <Text style={styles.smallActionText}>{t('Add announcement', 'Add announcement')}</Text>
                  </Pressable>
                </View>
                {loading ? <Text style={styles.emptyCopy}>{t('Loading...', '???? ????????...')}</Text> : announcements.length === 0 ? <Text style={styles.emptyCopy}>{t('No announcements found.', '???????????????? ????.')}</Text> : announcements.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowDetail}>{item.detail}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable style={styles.editBtn} onPress={() => startAnnouncementEdit(item)}><Text style={styles.editText}>{t('Edit', '?????')}</Text></Pressable>
                      <Pressable
                        style={[styles.deleteBtn, deletingAnnouncementId === item.id && styles.disabled]}
                        onPress={() => deleteAnnouncement(item)}
                        disabled={deletingAnnouncementId === item.id}
                        hitSlop={8}
                      >
                        <Text style={styles.deleteText}>{deletingAnnouncementId === item.id ? t('Deleting...', 'Deleting...') : t('Delete', '??????????')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeSection === 'businesses' && (
          <View style={styles.listCard}>
            <View style={styles.inlineTitleRow}>
              <Text style={styles.formTitle}>{t('All listings', '????? ????????????')}</Text>
              <Pressable style={styles.smallAction} onPress={() => navigation.navigate('SubmitBusiness')}>
                <Text style={styles.smallActionText}>{t('Add new', '??????? ?????????')}</Text>
              </Pressable>
            </View>
            <FocusTextInput
              style={styles.listingSearch}
              placeholder={t('Search listings', 'Search listings')}
              placeholderTextColor="#73798E"
              value={listingQuery}
              onChangeText={setListingQuery}
            />
            <Pressable style={styles.categoryFilterButton} onPress={() => setShowCategoryFilter(true)}>
              <Text style={styles.categoryFilterLabel}>{t('Category', 'Category')}</Text>
              <Text style={styles.categoryFilterValue} numberOfLines={1}>{listingCategoryFilter}</Text>
              <Text style={styles.categoryFilterArrow}>⌄</Text>
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listingFilters}>
              {(['All', 'Pending review', 'Approved', 'Rejected', 'Sold out'] as ListingStatusFilter[]).map((status) => (
                <Pressable key={status} style={[styles.listingFilterButton, listingStatusFilter === status && styles.listingFilterButtonActive]} onPress={() => setListingStatusFilter(status)}>
                  <Text style={[styles.listingFilterText, listingStatusFilter === status && styles.listingFilterTextActive]}>{status}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {!loading && businesses.length > 0 ? <Text style={styles.listingCount}>{filteredBusinesses.length} {t('of', 'of')} {businesses.length} {t('listings', 'listings')}</Text> : null}
            {loading ? <Text style={styles.emptyCopy}>{t('Loading...', '???? ????????...')}</Text> : businesses.length === 0 ? <Text style={styles.emptyCopy}>{t('No listings found.', '???????????? ????.')}</Text> : filteredBusinesses.length === 0 ? <Text style={styles.emptyCopy}>{t('No listings match these filters.', 'No listings match these filters.')}</Text> : filteredBusinesses.map((item) => (
              <View key={item.id} style={styles.largeRow}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowDetail}>{item.categoryName} � {item.status || 'N/A'}</Text>
                  <Text style={styles.rowDetail}>{item.address}</Text>
                </View>
                <View style={styles.statusRow}>
                  {(['Approved', 'Rejected', 'Pending review', 'Sold out'] as const).map((statusValue) => (
                    <Pressable key={statusValue} style={[styles.statusBtn, item.status === statusValue && styles.statusBtnActive, busyBusinessId === item.id && styles.disabled]} disabled={busyBusinessId === item.id} onPress={() => updateBusinessStatus(item.id, statusValue)}>
                      <Text style={[styles.statusText, item.status === statusValue && styles.statusTextActive]}>{statusValue}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.rowActions}>
                  <Pressable style={styles.editBtn} onPress={() => navigation.navigate('SubmitBusiness', { mode: 'edit', business: item })}><Text style={styles.editText}>{t('Edit', '?????')}</Text></Pressable>
                  <Pressable style={[styles.deleteBtn, busyBusinessId === item.id && styles.disabled]} disabled={busyBusinessId === item.id} onPress={() => deleteBusiness(item)}><Text style={styles.deleteText}>{t('Delete', '??????????')}</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'feedback' && (
          <View style={styles.listCard}>
            <Text style={styles.formTitle}>{t('Feedback and complaints', '??????????? ????? ??????????')}</Text>
            {loading ? <Text style={styles.emptyCopy}>{t('Loading...', '???? ????????...')}</Text> : feedbackItems.length === 0 ? <Text style={styles.emptyCopy}>{t('No feedback found.', '??????????? ????.')}</Text> : feedbackItems.map((item) => (
              <View key={item.id} style={styles.largeRow}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.subject}</Text>
                  <Text style={styles.rowDetail}>{item.type} � {item.userPhone}</Text>
                  <Text style={styles.rowDetail}>{item.message}</Text>
                  {item.adminReply ? <Text style={styles.replyText}>{t('Admin reply:', 'Admin reply:')} {item.adminReply}</Text> : null}
                </View>
                <View style={styles.rowActions}>
                  <FocusTextInput
                    style={styles.replyInput}
                    placeholder={t('Write a reply', 'Write a reply')}
                    value={feedbackReplies[item.id] || ''}
                    onChangeText={(value) => setFeedbackReplies((current) => ({ ...current, [item.id]: value }))}
                    multiline
                  />
                  <Pressable style={[styles.replyButton, busyFeedbackId === item.id && styles.disabled]} disabled={busyFeedbackId === item.id} onPress={() => replyToFeedback(item)}><Text style={styles.replyButtonText}>{busyFeedbackId === item.id ? t('Sending...', 'Sending...') : t('Reply', 'Reply')}</Text></Pressable>
                  <Pressable style={[styles.deleteBtn, busyFeedbackId === item.id && styles.disabled]} disabled={busyFeedbackId === item.id} onPress={() => deleteFeedback(item)}><Text style={styles.deleteText}>{t('Delete', '??????????')}</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'submissions' && (
          <View style={styles.listCard}>
            <Text style={styles.formTitle}>{t('My submissions', 'నా సమర్పణలు')}</Text>
            {mySubmissions.length === 0 ? <Text style={styles.emptyCopy}>{t('You have not submitted any listings yet.', 'You have not submitted any listings yet.')}</Text> : mySubmissions.map((item) => (
              <View key={item.id} style={styles.largeRow}>
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowDetail}>{item.categoryName} � {item.status}</Text>
                  <Text style={styles.rowDetail}>{item.address}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'analytics' && (
          <View style={styles.listCard}>
            <Text style={styles.formTitle}>{t('Analytics', 'Analytics')}</Text>
            {analyticsLoading ? <Text style={styles.emptyCopy}>{t('Loading...', '???? ????????...')}</Text> : (
              <>
                <View style={styles.statsGrid}>
                  {[
                    { label: t('Installed devices (30d)', 'Installed devices (30d)'), value: adminSummary?.installed_devices },
                    { label: t('Total users', 'Total users'), value: adminSummary?.total_users },
                    { label: t('Total businesses', 'Total businesses'), value: adminSummary?.total_businesses },
                    { label: t('Total reviews', 'Total reviews'), value: adminSummary?.total_reviews },
                    { label: t('Total feedback', 'Total feedback'), value: adminSummary?.total_feedback },
                    { label: t('Super admins', 'Super admins'), value: adminSummary?.super_admins },
                  ].map((stat) => (
                    <View key={stat.label} style={styles.statCard}>
                      <Text style={styles.statValue}>{stat.value ?? '—'}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.formTitle, styles.recentActivityTitle]}>{t('Recent activity', 'Recent activity')}</Text>
                {recentActivity.length === 0 ? <Text style={styles.emptyCopy}>{t('No recent activity.', 'No recent activity.')}</Text> : recentActivity.map((item, index) => (
                  <View key={`${item.type}-${item.entity_id}-${index}`} style={styles.row}>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{item.type} · {item.label}</Text>
                      <Text style={styles.rowDetail}>{new Date(item.created_at).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
      {Platform.OS === 'web' && webDateInput ? (
        <View style={styles.webDateOverlay}>
          <View style={styles.webDateCard}>
            <Text style={styles.webDateTitle}>{t('Select date', 'తేదీని ఎంచుకోండి')}</Text>
            <Text style={styles.webDateMessage}>{t('Use format YYYY-MM-DD', 'YYYY-MM-DD ఆకృతిని ఉపయోగించండి')}</Text>
            <FocusTextInput
              style={styles.webDateInput}
              value={webDateInput.value}
              onChangeText={(value) => setWebDateInput((current) => current ? { ...current, value } : current)}
              autoCapitalize="none"
              placeholder="YYYY-MM-DD"
            />
            <View style={styles.webDateActions}>
              <Pressable style={styles.webDateCancelButton} onPress={() => setWebDateInput(null)}>
                <Text style={styles.webDateCancelText}>{t('Cancel', 'రద్దు చేయండి')}</Text>
              </Pressable>
              <Pressable style={styles.webDateConfirmButton} onPress={confirmWebDateInput}>
                <Text style={styles.webDateConfirmText}>{t('Set Date', 'తేదీని సెట్ చేయండి')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      <Modal visible={showCategoryFilter} transparent animationType="fade" onRequestClose={() => setShowCategoryFilter(false)}>
        <Pressable style={styles.categoryFilterOverlay} onPress={() => setShowCategoryFilter(false)}>
          <View style={styles.categoryFilterMenu}>
            <Text style={styles.categoryFilterTitle}>{t('Choose category', 'వర్గాన్ని ఎంచుకోండి')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {['All categories', ...listingCategories].map((category) => (
                <Pressable key={category} style={[styles.categoryFilterOption, listingCategoryFilter === category && styles.categoryFilterOptionActive]} onPress={() => { setListingCategoryFilter(category); setShowCategoryFilter(false) }}>
                  <Text style={[styles.categoryFilterOptionText, listingCategoryFilter === category && styles.categoryFilterOptionTextActive]}>{category}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
      {Platform.OS === 'web' && webDeleteTarget ? (
        <View style={styles.webDeleteOverlay}>
          <View style={styles.webDeleteCard}>
            <Text style={styles.webDeleteTitle}>{t('Confirm to delete', 'తొలగింపును నిర్ధారించండి')}</Text>
            <Text style={styles.webDeleteMessage}>{t('Are you sure you want to delete this announcement?', 'ఈ ప్రకటనను తొలగించాలనుకుంటున్నారా?')}</Text>
            <Text style={styles.webDeleteItem}>{webDeleteTarget.title}</Text>
            <View style={styles.webDeleteActions}>
              <Pressable style={styles.webDeleteCancelButton} onPress={() => setWebDeleteTarget(null)}>
                <Text style={styles.webDeleteCancelText}>{t('No', 'వద్దు')}</Text>
              </Pressable>
              <Pressable
                style={[styles.webDeleteConfirmButton, deletingAnnouncementId === webDeleteTarget.id && styles.disabled]}
                onPress={() => void executeAnnouncementDelete(webDeleteTarget)}
                disabled={deletingAnnouncementId === webDeleteTarget.id}
              >
                <Text style={styles.webDeleteConfirmText}>{deletingAnnouncementId === webDeleteTarget.id ? t('Deleting...', 'తొలగిస్తోంది...') : t('Yes, Delete', 'అవును, తొలగించండి')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      {Platform.OS === 'web' && webBusinessDeleteTarget ? (
        <View style={styles.webDeleteOverlay}>
          <View style={styles.webDeleteCard}>
            <Text style={styles.webDeleteTitle}>{t('Confirm to delete', 'తొలగింపును నిర్ధారించండి')}</Text>
            <Text style={styles.webDeleteMessage}>{t('Are you sure you want to delete this listing?', 'ఈ లిస్టింగ్‌ను తొలగించాలనుకుంటున్నారా?')}</Text>
            <Text style={styles.webDeleteItem}>{webBusinessDeleteTarget.name}</Text>
            <View style={styles.webDeleteActions}>
              <Pressable style={styles.webDeleteCancelButton} onPress={() => setWebBusinessDeleteTarget(null)}>
                <Text style={styles.webDeleteCancelText}>{t('No', 'వద్దు')}</Text>
              </Pressable>
              <Pressable
                style={[styles.webDeleteConfirmButton, busyBusinessId === webBusinessDeleteTarget.id && styles.disabled]}
                onPress={() => void executeBusinessDelete(webBusinessDeleteTarget)}
                disabled={busyBusinessId === webBusinessDeleteTarget.id}
              >
                <Text style={styles.webDeleteConfirmText}>{busyBusinessId === webBusinessDeleteTarget.id ? 'Deleting...' : 'Yes, Delete'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      <BottomNav navigation={navigation} active="Admin" />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAEAF9' },
  toast: { marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CFE0D8', backgroundColor: '#EAF7EF' },
  toastTitle: { color: '#1F2235', fontSize: 13, fontWeight: '800' },
  toastMessage: { marginTop: 2, color: '#3E4355', fontSize: 12 },
  content: { padding: 16, paddingBottom: 120 },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 20, backgroundColor: '#FFFFFF' },
  backText: { color: '#2F2F43', fontSize: 22 },
  kicker: { color: '#5B52D1', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 2, color: '#1F2235', fontSize: 23, fontWeight: '800' },
  sectionTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, borderWidth: 1, borderColor: '#D7DBED', backgroundColor: '#FFF' },
  tabActive: { borderColor: '#7166E5', backgroundColor: '#F0EEFF' },
  tabText: { color: '#656E87', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#4F47B8' },
  formCard: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E3E5F1', backgroundColor: '#FFF' },
  formTitle: { color: '#1F2235', fontSize: 15, fontWeight: '800', marginBottom: 8 },
  input: { marginTop: 8, borderWidth: 1, borderColor: '#E4E7F3', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, color: '#1F2235', backgroundColor: '#F8F9FF', fontSize: 13 },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dateCol: { flex: 1 },
  dateLabel: { color: '#4A5270', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  datePickerButton: { minHeight: 42, borderWidth: 1, borderColor: '#E4E7F3', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, backgroundColor: '#F8F9FF' },
  datePickerText: { color: '#1F2235', fontSize: 13, fontWeight: '600', flex: 1 },
  datePickerIcon: { marginLeft: 8, fontSize: 16 },
  iosDateDone: { marginTop: 8, alignSelf: 'flex-end', borderWidth: 1, borderColor: '#D2D8F3', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F7FF' },
  iosDateDoneText: { color: '#4F59B7', fontSize: 12, fontWeight: '800' },
  textarea: { minHeight: 92 },
  uploadButton: { marginTop: 8, minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: '#C7CBE6', backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  uploadButtonText: { color: '#4C52B8', fontSize: 12, fontWeight: '800' },
  preview: { width: '100%', height: 140, marginTop: 8, borderRadius: 10, backgroundColor: '#E6E8F5' },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  saveButton: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#514BD5' },
  saveText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  cancelButton: { flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DADCE8', backgroundColor: '#FFF' },
  cancelText: { color: '#545C76', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  listCard: { marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E3E5F1', backgroundColor: '#FFF' },
  inlineTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listingSearch: { minHeight: 42, marginTop: 8, borderWidth: 1, borderColor: '#E4E7F3', borderRadius: 8, paddingHorizontal: 11, color: '#1F2235', backgroundColor: '#F8F9FF', fontSize: 13 },
  categoryFilterButton: { minHeight: 42, marginTop: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E4E7F3', borderRadius: 8, paddingHorizontal: 11, backgroundColor: '#F8F9FF' },
  categoryFilterLabel: { marginRight: 8, color: '#656E87', fontSize: 11, fontWeight: '800' },
  categoryFilterValue: { flex: 1, color: '#1F2235', fontSize: 13, fontWeight: '600' },
  categoryFilterArrow: { marginLeft: 8, color: '#4F47B8', fontSize: 18, lineHeight: 20 },
  categoryFilterOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(22, 24, 41, 0.35)' },
  categoryFilterMenu: { maxHeight: '65%', padding: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: '#FFF' },
  categoryFilterTitle: { marginBottom: 8, color: '#1F2235', fontSize: 16, fontWeight: '800' },
  categoryFilterOption: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F1F6', paddingHorizontal: 8 },
  categoryFilterOptionActive: { backgroundColor: '#F0EEFF' },
  categoryFilterOptionText: { color: '#3E4355', fontSize: 14, fontWeight: '600' },
  categoryFilterOptionTextActive: { color: '#4F47B8', fontWeight: '800' },
  listingFilters: { gap: 7, paddingVertical: 9 },
  listingFilterButton: { minHeight: 32, justifyContent: 'center', borderWidth: 1, borderColor: '#D7DBED', borderRadius: 8, paddingHorizontal: 10, backgroundColor: '#FFF' },
  listingFilterButtonActive: { borderColor: '#7166E5', backgroundColor: '#F0EEFF' },
  listingFilterText: { color: '#656E87', fontSize: 11, fontWeight: '700' },
  listingFilterTextActive: { color: '#4F47B8' },
  listingCount: { marginBottom: 5, color: '#70778E', fontSize: 11, fontWeight: '600' },
  smallAction: { borderWidth: 1, borderColor: '#D2D8F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F5F7FF' },
  smallActionText: { color: '#4F59B7', fontSize: 11, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F1F5' },
  largeRow: { gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F1F5' },
  rowCopy: { flex: 1 },
  rowTitle: { color: '#2D2F3D', fontSize: 13, fontWeight: '800' },
  rowDetail: { marginTop: 2, color: '#666C7D', fontSize: 11, lineHeight: 16 },
  replyText: { marginTop: 8, color: '#3F4FA3', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  replyInput: { minHeight: 48, marginTop: 4, borderWidth: 1, borderColor: '#D7DBED', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: '#1F2235', backgroundColor: '#F8F9FF', fontSize: 12 },
  replyButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#C9C6F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F0EEFF' },
  replyButtonText: { color: '#4F47B8', fontSize: 11, fontWeight: '800' },
  rowActions: { flexDirection: 'row', gap: 6 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusBtn: { borderWidth: 1, borderColor: '#D7DBED', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#FFF' },
  statusBtnActive: { borderColor: '#7166E5', backgroundColor: '#F0EEFF' },
  statusText: { color: '#656E87', fontSize: 10, fontWeight: '700' },
  statusTextActive: { color: '#4F47B8' },
  editBtn: { borderWidth: 1, borderColor: '#CCD3F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F3F5FF' },
  editText: { color: '#4F59B7', fontSize: 11, fontWeight: '800' },
  deleteBtn: { borderWidth: 1, borderColor: '#E8C9CC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFF6F7' },
  deleteText: { color: '#B34D5E', fontSize: 11, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { minWidth: '30%', flexGrow: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E3E5F1', backgroundColor: '#F8F9FF' },
  statValue: { color: '#1F2235', fontSize: 20, fontWeight: '800' },
  statLabel: { marginTop: 4, color: '#656E87', fontSize: 11, fontWeight: '600' },
  recentActivityTitle: { marginTop: 16 },
  webDateOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(22, 24, 41, 0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, zIndex: 55 },
  webDateCard: { width: '100%', maxWidth: 460, borderRadius: 14, borderWidth: 1, borderColor: '#E3E5F1', backgroundColor: '#FFF', padding: 16 },
  webDateTitle: { color: '#1F2235', fontSize: 18, fontWeight: '800' },
  webDateMessage: { marginTop: 8, color: '#4A5270', fontSize: 13 },
  webDateInput: { marginTop: 12, borderWidth: 1, borderColor: '#E4E7F3', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, color: '#1F2235', backgroundColor: '#F8F9FF', fontSize: 14 },
  webDateActions: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  webDateCancelButton: { minWidth: 90, minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: '#D7DBED', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  webDateCancelText: { color: '#5C657D', fontSize: 13, fontWeight: '800' },
  webDateConfirmButton: { minWidth: 100, minHeight: 38, borderRadius: 10, backgroundColor: '#514BD5', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  webDateConfirmText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  webDeleteOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(22, 24, 41, 0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, zIndex: 50 },
  webDeleteCard: { width: '100%', maxWidth: 460, borderRadius: 14, borderWidth: 1, borderColor: '#E3E5F1', backgroundColor: '#FFF', padding: 16 },
  webDeleteTitle: { color: '#1F2235', fontSize: 18, fontWeight: '800' },
  webDeleteMessage: { marginTop: 10, color: '#4A5270', fontSize: 14 },
  webDeleteItem: { marginTop: 10, color: '#2D2F3D', fontSize: 15, fontWeight: '700' },
  webDeleteActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  webDeleteCancelButton: { minWidth: 90, minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: '#D7DBED', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  webDeleteCancelText: { color: '#5C657D', fontSize: 13, fontWeight: '800' },
  webDeleteConfirmButton: { minWidth: 110, minHeight: 38, borderRadius: 10, backgroundColor: '#B34D5E', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  webDeleteConfirmText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingBottom: 80 },
  emptyTitle: { color: '#1F2235', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { marginTop: 8, color: '#6D7285', fontSize: 13, textAlign: 'center' },
})
