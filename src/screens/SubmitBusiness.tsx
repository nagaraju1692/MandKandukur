import React, { useEffect, useState } from 'react'
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useSubmittedListings } from '../context/SubmittedListingsContext'
import { useDirectory } from '../context/DirectoryContext'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import { colors } from '../ui/theme'
import { geocodeAddress, reverseGeocodeCoordinates, uploadAdminBusinessImage, uploadMarketplaceImage } from '../services/api'
import FocusTextInput from '../ui/FocusTextInput'
import LocationPickerModal from '../components/LocationPickerModal'

function normalizeGallery(gallery: unknown): string[] {
  if (Array.isArray(gallery)) return gallery.filter((image): image is string => typeof image === 'string' && Boolean(image.trim()))
  if (typeof gallery !== 'string') return []
  try {
    const parsed = JSON.parse(gallery)
    if (Array.isArray(parsed)) return parsed.filter((image): image is string => typeof image === 'string' && Boolean(image.trim()))
  } catch {
    // Legacy records can contain comma-separated image URLs.
  }
  return gallery.split(',').map((image) => image.trim()).filter(Boolean)
}

function createListingForm(business: any, phone?: string) {
  return {
    name: business?.name || '',
    nameTe: business?.nameTe || '',
    ownerName: business?.ownerName || business?.name || '',
    categoryId: business?.categoryId || '',
    categoryName: business?.categoryName || '',
    address: business?.address || '',
    phone: business?.phone || phone || '',
    rooms: business?.rooms || '',
    price: business?.price || '',
    facing: business?.facing || '',
    description: business?.description || '',
    website: business?.website || '',
    image: business?.image || '',
    galleryInput: normalizeGallery(business?.gallery).join(', '),
  }
}

const marketplaceCategoryNames = new Set(['Real Estate', 'Rental Transport', 'Construction Materials', 'Buy & Sell'])

export default function SubmitBusiness({ navigation, route }: any) {
  const { user, isSuperAdmin } = useAuth()
  const { t, category: categoryLabel } = useLanguage()
  const { addListing } = useSubmittedListings()
  const { categories, businesses, refreshBusinesses } = useDirectory()
  const routeBusiness = route?.params?.business
  const preselectedCategory = categories.find((category) => category.id === route?.params?.categoryId)
  const listingCategory = preselectedCategory || categories.find((category) => category.id === routeBusiness?.categoryId)
  const listingParentCategory = categories.find((category) => category.id === listingCategory?.parentId)
  const isMarketplaceListing = Boolean(listingCategory && (marketplaceCategoryNames.has(listingCategory.name) || marketplaceCategoryNames.has(listingParentCategory?.name || '')))
  const isPropertyListing = listingCategory?.name === 'Real Estate' || listingParentCategory?.name === 'Real Estate'
  const selectedCategoryParentId = preselectedCategory?.parentId || preselectedCategory?.id
  const availableCategories = preselectedCategory
    ? categories.filter((category) => category.parentId === selectedCategoryParentId)
    : categories
  const editingBusiness = businesses.find((business) => business.id === routeBusiness?.id) || routeBusiness
  const [form, setForm] = useState(() => createListingForm(editingBusiness, isMarketplaceListing ? undefined : user?.phone))
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [currentCoordinates, setCurrentCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [manualLatitude, setManualLatitude] = useState('')
  const [manualLongitude, setManualLongitude] = useState('')
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  useEffect(() => {
    if (user?.phone && !isMarketplaceListing) setForm((current) => ({ ...current, phone: user.phone }))
  }, [user?.phone, isMarketplaceListing])

  useEffect(() => {
    if (editingBusiness?.latitude != null && editingBusiness?.longitude != null) {
      const nextCoordinates = { latitude: Number(editingBusiness.latitude), longitude: Number(editingBusiness.longitude) }
      setCurrentCoordinates(nextCoordinates)
      setManualLatitude(String(nextCoordinates.latitude))
      setManualLongitude(String(nextCoordinates.longitude))
    }
  }, [editingBusiness?.id, editingBusiness?.latitude, editingBusiness?.longitude])

  useEffect(() => {
    if (!currentCoordinates) {
      setManualLatitude('')
      setManualLongitude('')
      return
    }

    setManualLatitude((previous) => previous === '' ? String(currentCoordinates.latitude) : previous)
    setManualLongitude((previous) => previous === '' ? String(currentCoordinates.longitude) : previous)
  }, [currentCoordinates])

  useEffect(() => {
    if (!editingBusiness) return
    setForm(createListingForm(editingBusiness, isMarketplaceListing ? undefined : user?.phone))
  }, [editingBusiness?.id, editingBusiness?.image, JSON.stringify(normalizeGallery(editingBusiness?.gallery)), user?.phone, isMarketplaceListing])

  useEffect(() => {
    if (editingBusiness || !preselectedCategory) return
    setForm((current) => current.categoryId ? current : { ...current, categoryId: preselectedCategory.id, categoryName: preselectedCategory.name })
  }, [editingBusiness, preselectedCategory?.id])

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const galleryImages = form.galleryInput.split(',').map((value) => value.trim()).filter(Boolean)
  const formFields: Array<[keyof typeof form, string]> = isMarketplaceListing
    ? [['name', 'Title'], ['phone', isPropertyListing ? 'Owner / agent mobile number' : 'Seller mobile number'], ['address', 'Area / location'], ['price', 'Price'], ...(isPropertyListing ? [['facing', 'Plot facing (East, West, North, or South)'] as [keyof typeof form, string]] : [])]
    : [['name', 'Business name'], ['address', 'Location / address'], ['phone', 'Mobile number'], ['website', 'Website (optional)']]

  const getFieldText = (field: string, label: string) => {
    const translations: Record<string, string> = {
      name: 'పేరు',
      phone: 'మొబైల్ నంబర్',
      address: 'ప్రాంతం / స్థానం',
      price: 'ధర',
      facing: 'ప్లాట్ ముఖదిశ',
      website: 'వెబ్‌సైట్ (ఐచ్ఛికం)',
    }
    return t(label, translations[field] || label)
  }

  const getFieldPlaceholder = (field: string, label: string) => {
    const translations: Record<string, string> = {
      name: 'పేరు నమోదు చేయండి',
      phone: 'మొబైల్ నంబర్ నమోదు చేయండి',
      address: 'ప్రాంతం / స్థానం నమోదు చేయండి',
      price: 'ధర నమోదు చేయండి',
      facing: 'ప్లాట్ ముఖదిశ నమోదు చేయండి',
      website: 'వెబ్‌సైట్ నమోదు చేయండి',
    }
    return t(label, translations[field] || label)
  }

  const getKeyboardType = (field: string) => {
    if (field === 'phone') return 'phone-pad'
    if (field === 'price') return 'numeric'
    if (field === 'website') return 'url'
    return 'default'
  }

  const useCurrentLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert(t('Location permission needed', 'Location permission needed'), t('Please allow location access so the business can be mapped to the correct spot.', 'Please allow location access so the business can be mapped to the correct spot.'))
        return
      }

      setIsFetchingLocation(true)
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const nextCoordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude }
      setCurrentCoordinates(nextCoordinates)
      setManualLatitude(String(nextCoordinates.latitude))
      setManualLongitude(String(nextCoordinates.longitude))
      
      const reverseGeocodedAddress = await reverseGeocodeCoordinates(nextCoordinates.latitude, nextCoordinates.longitude)
      if (reverseGeocodedAddress) {
        update('address', reverseGeocodedAddress)
      }
      
      Alert.alert(t('Location captured', 'Location captured'), t('This business location has been saved with your current coordinates.', 'This business location has been saved with your current coordinates.'))
    } catch (error) {
      Alert.alert(t('Unable to detect location', 'Unable to detect location'), error instanceof Error ? error.message : t('Try again after checking your device location settings.', 'Try again after checking your device location settings.'))
    } finally {
      setIsFetchingLocation(false)
    }
  }

  const updateManualCoordinates = async (field: 'latitude' | 'longitude', value: string) => {
    const nextValue = value.trim()
    const latitudeSource = manualLatitude !== '' ? Number(manualLatitude) : (currentCoordinates?.latitude ?? 0)
    const longitudeSource = manualLongitude !== '' ? Number(manualLongitude) : (currentCoordinates?.longitude ?? 0)
    const currentLatitude = field === 'latitude' ? Number(nextValue) : latitudeSource
    const currentLongitude = field === 'longitude' ? Number(nextValue) : longitudeSource

    if (field === 'latitude') setManualLatitude(nextValue)
    else setManualLongitude(nextValue)

    if (!nextValue || !Number.isFinite(currentLatitude) || !Number.isFinite(currentLongitude)) return
    if (Math.abs(currentLatitude) > 90 || Math.abs(currentLongitude) > 180) return

    setCurrentCoordinates({ latitude: currentLatitude, longitude: currentLongitude })
    
    const reverseGeocodedAddress = await reverseGeocodeCoordinates(currentLatitude, currentLongitude)
    if (reverseGeocodedAddress) {
      update('address', reverseGeocodedAddress)
    }
  }

  const openGoogleMapsPicker = async () => {
    setShowLocationPicker(true)
  }

  const handleLocationPickerSelect = async (latitude: number, longitude: number) => {
    setCurrentCoordinates({ latitude, longitude })
    setManualLatitude(String(latitude))
    setManualLongitude(String(longitude))
    
    const reverseGeocodedAddress = await reverseGeocodeCoordinates(latitude, longitude)
    if (reverseGeocodedAddress) {
      update('address', reverseGeocodedAddress)
    }
  }

  const previewCurrentLocation = () => {
    if (!currentCoordinates) return
    const { latitude, longitude } = currentCoordinates
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    Linking.openURL(url)
  }

  const pickListingImages = async (target: 'cover' | 'gallery') => {
    if (!user?.phone || (!isSuperAdmin && !isMarketplaceListing)) return
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(t('Permission needed', 'Permission needed'), t('Allow gallery access to select listing photos.', 'Allow gallery access to select listing photos.'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: target === 'gallery',
      selectionLimit: target === 'gallery' ? Math.max(1, 10 - galleryImages.length) : 1,
      quality: 0.85,
    })
    if (result.canceled || result.assets.length === 0) return

    setIsUploadingImages(true)
    try {
      const uploadImage = isSuperAdmin ? uploadAdminBusinessImage : uploadMarketplaceImage
      const uploadedImages = await Promise.all(result.assets.map((asset) => uploadImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      }, user.phone)))
      const imageUrls = uploadedImages.map((uploaded) => uploaded.data.image)
      if (target === 'cover') update('image', imageUrls[0])
      else update('galleryInput', [...galleryImages, ...imageUrls].slice(0, 10).join(', '))
    } catch (error) {
      Alert.alert(t('Upload failed', 'Upload failed'), error instanceof Error ? error.message : t('Unable to upload photos right now.', 'Unable to upload photos right now.'))
    } finally {
      setIsUploadingImages(false)
    }
  }

  const removeGalleryImage = (imageUrl: string) => {
    update('galleryInput', galleryImages.filter((image) => image !== imageUrl).join(', '))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {}
    if (isMarketplaceListing) {
      if (!form.price.trim()) nextErrors.price = t('Enter the price.', 'Enter the price.')
    } else if (!/^[A-Za-z0-9][A-Za-z0-9 .,'-]{1,49}$/.test(form.name.trim())) nextErrors.name = t('Enter a valid business name.', 'Enter a valid business name.')
    if (!form.categoryId) nextErrors.categoryName = t('Choose a category.', 'Choose a category.')
    if (form.address.trim().length < 5) nextErrors.address = t('Enter a complete location.', 'Enter a complete location.')
    if (!/^\d{10,11}$/.test(form.phone.replace(/\D/g, ''))) nextErrors.phone = t('Enter a valid 10- or 11-digit contact number.', 'Enter a valid 10- or 11-digit contact number.')
    if (!isMarketplaceListing && form.description.trim().length < 10) nextErrors.description = t('Add at least 10 characters about your service.', 'Add at least 10 characters about your service.')
    if (form.website.trim() && !/^https?:\/\//i.test(form.website.trim())) nextErrors.website = t('Website must start with http:// or https://.', 'Website must start with http:// or https://.')
    if (form.image.trim() && !/^https?:\/\//i.test(form.image.trim())) nextErrors.image = t('Image URL must start with http:// or https://.', 'Image URL must start with http:// or https://.')
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = async () => {
    if (!validate() || !user) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const trimmedAddress = form.address.trim()
      const addressChanged = !editingBusiness || editingBusiness.address !== trimmedAddress
      const coordinates = currentCoordinates ?? (addressChanged ? await geocodeAddress(trimmedAddress) : null)
      const payload = {
        ...form,
        phone: form.phone,
        description: isMarketplaceListing ? form.description.trim() || `For sale: ${form.name.trim()}. Price: ${form.price.trim()}.${form.facing ? ` Facing: ${form.facing}.` : ''}` : form.description,
        submittedBy: user.phone,
        createdBy: user.phone,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        gallery: form.galleryInput.split(',').map((value) => value.trim()).filter(Boolean),
      }
      if (editingBusiness && (isSuperAdmin || editingBusiness.submittedBy === user.phone)) {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://mmanakandukur-backend-dah2a4aafecacbff.indiasouthcentral-01.azurewebsites.net'}/api/businesses/${encodeURIComponent(editingBusiness.id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-phone': user.phone,
          },
          body: JSON.stringify({
            name: payload.name,
            nameTe: payload.nameTe,
            categoryId: payload.categoryId,
            categoryName: payload.categoryName,
            address: payload.address,
            ...(addressChanged || currentCoordinates ? { latitude: payload.latitude, longitude: payload.longitude } : {}),
            phone: payload.phone,
            description: payload.description,
            ownerName: isMarketplaceListing ? '' : payload.ownerName,
            rooms: isMarketplaceListing ? '' : payload.rooms,
            price: payload.price,
            facing: payload.facing,
            website: payload.website,
            image: payload.image,
            gallery: payload.gallery,
          }),
        })
        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(result.error || 'Unable to update listing.')
        }
        await refreshBusinesses()
      } else {
        await addListing({ ...payload, submittedBy: user.phone, createdBy: user.phone })
      }
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('Unable to submit listing. Try again.', 'Unable to submit listing. Try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headingRow}><Pressable style={styles.back} onPress={() => navigation.goBack()}><Text style={styles.backText}>←</Text></Pressable><View><Text style={styles.kicker}>{t('DIRECTORY', 'డైరెక్టరీ')}</Text><Text style={styles.title}>{isMarketplaceListing ? t('Post an item', 'వస్తువును పోస్ట్ చేయండి') : t('Submit a business', 'వ్యాపారాన్ని సమర్పించండి')}</Text></View></View>
        {!user ? (
          <View style={styles.success}><Text style={styles.successTitle}>{t('Sign in required', 'Sign in required')}</Text><Text style={styles.successCopy}>{t('Please sign in from Profile before submitting a local business.', 'Please sign in from Profile before submitting a local business.')}</Text><Pressable style={styles.primary} onPress={() => navigation.navigate('Profile')}><Text style={styles.primaryText}>{t('Open Profile', 'Open Profile')}</Text></Pressable></View>
        ) : submitted ? (
          <View style={styles.success}><Text style={styles.successIcon}>✓</Text><Text style={styles.successTitle}>{editingBusiness ? t('Listing updated', 'Listing updated') : t('Submitted for review', 'Submitted for review')}</Text><Text style={styles.successCopy}>{editingBusiness ? t('Your changes are saved.', 'Your changes are saved.') : t('Your business information was saved and will be reviewed before publishing.', 'Your business information was saved and will be reviewed before publishing.')}</Text><Pressable style={styles.primary} onPress={() => navigation.navigate('Home')}><Text style={styles.primaryText}>{t('Back to Home', 'Back to Home')}</Text></Pressable></View>
        ) : (
          <View style={styles.formCard}>
            <LocationPickerModal visible={showLocationPicker} initialLatitude={currentCoordinates?.latitude} initialLongitude={currentCoordinates?.longitude} onLocationSelected={handleLocationPickerSelect} onClose={() => setShowLocationPicker(false)} />
            <Text style={styles.intro}>{editingBusiness ? t('Update this listing and refresh the images.', 'Update this listing and refresh the images.') : t('Add your shop or service so local people can find you.', 'Add your shop or service so local people can find you.')}</Text>
            {formFields.map(([field, label]) => {
              const isAddressField = field === 'address'
              const isWebsiteField = field === 'website'
              const fieldLabel = getFieldText(field, label)
              const fieldPlaceholder = getFieldPlaceholder(field, label)

              return isAddressField ? (
                <View key={field} style={styles.field}>
                  <Text style={styles.fieldLabel}>{fieldLabel} *</Text>
                  <FocusTextInput style={[styles.input, errors[field] && styles.inputError]} placeholder={fieldPlaceholder} placeholderTextColor="#888" value={form[field]} onChangeText={(value) => update(field, value)} keyboardType={getKeyboardType(field)} autoCapitalize={isWebsiteField ? 'none' : 'words'} />
                  <View style={styles.locationCaptureRow}>
                    <Pressable style={[styles.locationButton, isFetchingLocation && styles.disabled]} disabled={isFetchingLocation} onPress={useCurrentLocation}>
                      <Text style={styles.locationButtonText}>{isFetchingLocation ? t('Detecting...', 'Detecting...') : t('Use current location', 'Use current location')}</Text>
                    </Pressable>
                    <Pressable style={styles.locationButton} onPress={openGoogleMapsPicker}>
                      <Text style={styles.locationButtonText}>{t('Choose on map', 'Choose on map')}</Text>
                    </Pressable>
                    {currentCoordinates && (
                      <>
                        <Text style={styles.locationStatus}>{t('Map pin saved', 'Map pin saved')}: {currentCoordinates.latitude.toFixed(5)}, {currentCoordinates.longitude.toFixed(5)}</Text>
                        <Pressable style={styles.locationPreviewButton} onPress={previewCurrentLocation}>
                          <Text style={styles.locationPreviewText}>{t('Preview map pin', 'Preview map pin')}</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                  <View style={styles.locationCoordinateGrid}>
                    <View style={styles.locationCoordinateField}>
                      <Text style={styles.locationCoordinateLabel}>{t('Latitude', 'Latitude')}</Text>
                      <FocusTextInput style={styles.locationCoordinateInput} placeholder="15.2154" placeholderTextColor="#888" value={manualLatitude} onChangeText={(value) => { void updateManualCoordinates('latitude', value) }} keyboardType="decimal-pad" />
                    </View>
                    <View style={styles.locationCoordinateField}>
                      <Text style={styles.locationCoordinateLabel}>{t('Longitude', 'Longitude')}</Text>
                      <FocusTextInput style={styles.locationCoordinateInput} placeholder="79.9072" placeholderTextColor="#888" value={manualLongitude} onChangeText={(value) => { void updateManualCoordinates('longitude', value) }} keyboardType="decimal-pad" />
                    </View>
                  </View>
                  {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
                </View>
              ) : (
                <View key={field} style={styles.field}><Text style={styles.fieldLabel}>{fieldLabel}{field !== 'website' && field !== 'facing' ? ' *' : ''}</Text><FocusTextInput style={[styles.input, errors[field] && styles.inputError]} placeholder={fieldPlaceholder} placeholderTextColor="#888" value={form[field]} onChangeText={(value) => update(field, value)} keyboardType={getKeyboardType(field)} autoCapitalize={isWebsiteField ? 'none' : 'words'} />{errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}</View>
              )
            })}
            {isSuperAdmin && <View style={styles.field}><Text style={styles.fieldLabel}>{t('Telugu display name (optional)', 'తెలుగు ప్రదర్శన పేరు (ఐచ్ఛికం)')}</Text><FocusTextInput style={styles.input} placeholder={t('Enter the Telugu business name', 'తెలుగు వ్యాపార పేరు నమోదు చేయండి')} placeholderTextColor="#888" value={form.nameTe} onChangeText={(value) => update('nameTe', value)} /></View>}
            <View style={styles.field}><Text style={styles.fieldLabel}>{t('Category', 'Category')} *</Text><View style={styles.categoryOptions}>{availableCategories.map((category) => <Pressable key={category.id} style={[styles.categoryOption, form.categoryId === category.id && styles.categoryOptionActive]} onPress={() => setForm((current) => ({ ...current, categoryId: category.id, categoryName: category.name }))}><Text style={styles.categoryOptionText}>{categoryLabel(category.name)}</Text></Pressable>)}</View>{errors.categoryName && <Text style={styles.errorText}>{errors.categoryName}</Text>}</View>
            {(isSuperAdmin || isMarketplaceListing) ? <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('Main photo (optional)', 'ప్రధాన ఫోటో (ఐచ్ఛికం)')}</Text>
                {form.image ? <View style={styles.coverPreview}><Image source={{ uri: form.image }} style={styles.coverImage} /><Pressable style={styles.removePhoto} onPress={() => update('image', '')}><Text style={styles.removePhotoText}>{t('Remove', 'Remove')}</Text></Pressable></View> : null}
                <Pressable style={[styles.photoButton, isUploadingImages && styles.disabled]} disabled={isUploadingImages} onPress={() => pickListingImages('cover')}><Text style={styles.photoButtonText}>{isUploadingImages ? t('Uploading...', 'Uploading...') : t(form.image ? 'Replace main photo' : 'Choose main photo', form.image ? 'Replace main photo' : 'Choose main photo')}</Text></Pressable>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('Gallery photos (optional)', 'గ్యాలరీ ఫోటోలు (ఐచ్ఛికం)')} ({galleryImages.length}/10)</Text>
                {galleryImages.length > 0 ? <View style={styles.galleryGrid}>{galleryImages.map((imageUrl) => <View key={imageUrl} style={styles.galleryPreview}><Image source={{ uri: imageUrl }} style={styles.galleryImage} /><Pressable style={styles.galleryRemove} onPress={() => removeGalleryImage(imageUrl)}><Text style={styles.galleryRemoveText}>×</Text></Pressable></View>)}</View> : null}
                <Pressable style={[styles.photoButton, (isUploadingImages || galleryImages.length >= 10) && styles.disabled]} disabled={isUploadingImages || galleryImages.length >= 10} onPress={() => pickListingImages('gallery')}><Text style={styles.photoButtonText}>{isUploadingImages ? t('Uploading...', 'Uploading...') : t('Add gallery photos', 'Add gallery photos')}</Text></Pressable>
              </View>
            </> : !isMarketplaceListing && <>
              <View style={styles.field}><Text style={styles.fieldLabel}>{t('Main image URL', 'Main image URL')}</Text><FocusTextInput style={[styles.input, errors.image && styles.inputError]} placeholder={t('Paste a direct image URL', 'Paste a direct image URL')} placeholderTextColor="#888" value={form.image} onChangeText={(value) => update('image', value)} autoCapitalize="none" />{errors.image && <Text style={styles.errorText}>{errors.image}</Text>}</View>
              <View style={styles.field}><Text style={styles.fieldLabel}>{t('Gallery image URLs', 'Gallery image URLs')}</Text><FocusTextInput style={[styles.input, styles.multiline]} placeholder={t('Separate URLs with commas', 'Separate URLs with commas')} placeholderTextColor="#888" value={form.galleryInput} onChangeText={(value) => update('galleryInput', value)} multiline autoCapitalize="none" /></View>
            </>}
            {!isMarketplaceListing && <View style={styles.field}><Text style={styles.fieldLabel}>{t('Description', 'Description')} *</Text><FocusTextInput style={[styles.input, styles.multiline, errors.description && styles.inputError]} placeholder={t('Describe your products or services', 'Describe your products or services')} placeholderTextColor="#888" value={form.description} onChangeText={(value) => update('description', value)} multiline />{errors.description && <Text style={styles.errorText}>{errors.description}</Text>}</View>}
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            <Pressable style={[styles.primary, isSubmitting && styles.disabled]} disabled={isSubmitting} onPress={submit}><Text style={styles.primaryText}>{isSubmitting ? t(editingBusiness ? 'Updating...' : 'Submitting...', editingBusiness ? 'Updating...' : 'Submitting...') : t(editingBusiness ? 'Update listing' : 'Submit listing', editingBusiness ? 'Update listing' : 'Submit listing')}</Text></Pressable>
            <Text style={styles.note}>{t('Admins can choose, add, replace, or remove cover and gallery photos.', 'Admins can choose, add, replace, or remove cover and gallery photos.')}</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav navigation={navigation} active="Categories" />
    </View>
  )
}

const styles = StyleSheet.create({
  photoButton: { alignItems: 'center', marginTop: 8, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#514BD5', backgroundColor: '#F4F3FF' },
  photoButtonText: { color: '#514BD5', fontSize: 13, fontWeight: '800' },
  coverPreview: { position: 'relative', marginTop: 8 },
  coverImage: { width: '100%', height: 170, borderRadius: 8, backgroundColor: '#EEE' },
  removePhoto: { position: 'absolute', right: 8, bottom: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, backgroundColor: 'rgba(40, 32, 32, 0.8)' },
  removePhotoText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  galleryPreview: { position: 'relative' },
  galleryImage: { width: 82, height: 82, borderRadius: 8, backgroundColor: '#EEE' },
  galleryRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: 'rgba(40, 32, 32, 0.8)' },
  galleryRemoveText: { color: '#FFF', fontSize: 18, lineHeight: 20 },
  screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 18, paddingBottom: 120 }, headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderRadius: 21, backgroundColor: '#FFFDFB' }, backText: { color: '#302C2A', fontSize: 24 }, kicker: { color: '#5B55D9', fontSize: 12, fontWeight: '800', letterSpacing: 1 }, title: { marginTop: 3, color: '#202332', fontSize: 27, fontWeight: '800' }, formCard: { padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' }, intro: { color: '#5D6279', fontSize: 14, lineHeight: 21, marginBottom: 8 }, field: { marginTop: 12 }, fieldLabel: { color: '#3F414D', fontSize: 13, fontWeight: '800' }, input: { minHeight: 48, marginTop: 7, paddingHorizontal: 13, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1', color: '#302C2A', backgroundColor: '#FFFCFA', fontSize: 14 }, inputError: { borderColor: '#D65360', backgroundColor: '#FFF7F7' }, errorText: { marginTop: 4, color: '#C7414F', fontSize: 11, lineHeight: 15 }, multiline: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' }, locationCaptureRow: { marginTop: 8, gap: 8, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }, locationButton: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#514BD5', backgroundColor: '#F4F3FF' }, locationButtonText: { color: '#514BD5', fontSize: 12, fontWeight: '800' }, locationStatus: { color: '#2E7D32', fontSize: 11, fontWeight: '700' }, locationPreviewButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#2E7D32', backgroundColor: '#EAF7EE' }, locationPreviewText: { color: '#2E7D32', fontSize: 11, fontWeight: '800' }, locationCoordinateGrid: { flexDirection: 'row', marginTop: 10, gap: 10 }, locationCoordinateField: { flex: 1 }, locationCoordinateLabel: { color: '#3F414D', fontSize: 11, fontWeight: '700', marginBottom: 4 }, locationCoordinateInput: { minHeight: 42, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1', color: '#302C2A', backgroundColor: '#FFFCFA', fontSize: 13 }, primary: { alignItems: 'center', marginTop: 20, paddingVertical: 14, borderRadius: 8, backgroundColor: '#514BD5' }, disabled: { opacity: 0.45 }, primaryText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, note: { marginTop: 14, color: '#88817B', fontSize: 11, textAlign: 'center' }, success: { alignItems: 'center', padding: 28, borderRadius: 14, backgroundColor: '#FFFDFB' }, successIcon: { width: 58, height: 58, borderRadius: 29, color: '#FFF', backgroundColor: '#5D9B65', fontSize: 36, lineHeight: 58, textAlign: 'center' }, successTitle: { marginTop: 16, color: '#302C2A', fontSize: 20, fontWeight: '800', textAlign: 'center' }, successCopy: { marginTop: 8, color: '#6A645F', fontSize: 13, lineHeight: 19, textAlign: 'center' }, categoryOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, categoryOption: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD6D1', backgroundColor: '#FFFCFA' }, categoryOptionActive: { borderColor: '#514BD5', backgroundColor: '#E9E9FF' }, categoryOptionText: { color: '#3F414D', fontSize: 12, fontWeight: '700' },
})
