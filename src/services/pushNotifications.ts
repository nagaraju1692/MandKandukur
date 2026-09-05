import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'

// Android notification channels used by this app.
export const UPDATES_CHANNEL_ID = 'updates'

const PUSH_TOKEN_KEY = 'mana-kandukur-expo-push-token'

/**
 * Show notifications as banners/sound while the app is in the foreground.
 * Called once from NotificationProvider on app start.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

/** Returns the Expo push token persisted on this device, if registration already ran. */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Requests notification permission, creates the Android "updates" channel,
 * fetches the Expo push token (using the EAS projectId from app config) and
 * persists it in AsyncStorage so it can later be sent to the backend.
 *
 * NOTE: For standalone APK builds, Android push requires FCM — place
 * google-services.json in the project root and set "android.googleServicesFile"
 * (and upload the FCM server key / service account to EAS) or tokens will not
 * receive messages when the app is closed.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(UPDATES_CHANNEL_ID, {
        name: 'App updates',
        description: 'Notifications about new ManaKandukur app versions',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      })
    }

    const currentPermissions = await Notifications.getPermissionsAsync()
    const permissions = currentPermissions.granted
      ? currentPermissions
      : await Notifications.requestPermissionsAsync()
    if (!permissions.granted) return null

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
    return token
  } catch {
    // Push registration is optional; the app must keep working without it.
    return null
  }
}
