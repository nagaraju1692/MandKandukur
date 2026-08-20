import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from './src/screens/Home';
import Businesses from './src/screens/Businesses';
import BusinessDetails from './src/screens/BusinessDetails';
import Categories from './src/screens/Categories';
import Favorites from './src/screens/Favorites';
import Profile from './src/screens/Profile';
import Search from './src/screens/Search';
import Admin from './src/screens/Admin';
import About from './src/screens/About';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ReviewProvider } from './src/context/ReviewContext';
import { NearbyProvider } from './src/context/NearbyContext';
import { SubmittedListingsProvider } from './src/context/SubmittedListingsContext';
import SubmitBusiness from './src/screens/SubmitBusiness';
import Feedback from './src/screens/Feedback';
import BusTimetable from './src/screens/BusTimetable';
import { DirectoryProvider } from './src/context/DirectoryContext';
import { useDirectory } from './src/context/DirectoryContext';
import { useLanguage } from './src/context/LanguageContext';
import { recordAppUsage } from './src/services/api';
import { fetchLatestUpdate } from './src/services/updateCheck';

enableScreens();

const Stack = createNativeStackNavigator();

function MaintenanceGate() {
  const { error, loading, retry } = useDirectory()
  const { t } = useLanguage()
  if (loading || !error) return null

  return (
    <View style={styles.maintenanceOverlay}>
      <View style={styles.maintenanceCard}>
        <Text style={styles.maintenanceIcon}>!</Text>
        <Text style={styles.maintenanceTitle}>{t('App temporarily unavailable', 'యాప్ తాత్కాలికంగా అందుబాటులో లేదు')}</Text>
        <Text style={styles.maintenanceMessage}>{t('We are performing maintenance. Please try again shortly.', 'నిర్వహణ పనులు జరుగుతున్నాయి. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.')}</Text>
        <Pressable style={styles.maintenanceButton} onPress={() => void retry()}>
          <Text style={styles.maintenanceButtonText}>{t('Try again', 'మళ్లీ ప్రయత్నించండి')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

function UsageTracker() {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false

    const registerUsage = async () => {
      try {
        let deviceId = await AsyncStorage.getItem('mana-kandukur-device-id')
        if (!deviceId) {
          deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          await AsyncStorage.setItem('mana-kandukur-device-id', deviceId)
        }

        if (!cancelled) {
          await recordAppUsage(deviceId, {
            userPhone: user?.phone,
            userName: user?.name,
            appVersion: Constants.expoConfig?.version,
            platform: Platform.OS,
          })
        }
      } catch {
        // Ignore analytics errors to keep app startup non-blocking.
      }
    }

    registerUsage()
    return () => { cancelled = true }
  }, [user?.phone])

  return null
}

function AppRoot() {
  useEffect(() => {
    let cancelled = false

    const checkForUpdate = async () => {
      try {
        const update = await fetchLatestUpdate()
        if (!update || cancelled) return

        Alert.alert(
          'Update available',
          `A new version (${update.version}) of ManaKandukur is ready to install.`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Update now', onPress: () => Linking.openURL(update.downloadUrl) },
          ],
        )
      } catch {
        // Ignore update-check failures to keep app startup non-blocking.
      }
    }

    checkForUpdate()

    return () => { cancelled = true }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
        <UsageTracker />
        <DirectoryProvider>
          <LanguageProvider>
            <MaintenanceGate />
            <NotificationProvider>
            <ReviewProvider>
                <NearbyProvider>
                    <SubmittedListingsProvider>
                    <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="Search" component={Search} />
                <Stack.Screen name="Categories" component={Categories} />
                <Stack.Screen name="Businesses" component={Businesses} />
                <Stack.Screen name="BusinessDetails" component={BusinessDetails} />
                <Stack.Screen name="Favorites" component={Favorites} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="Admin" component={Admin} />
                <Stack.Screen name="About" component={About} />
                <Stack.Screen name="SubmitBusiness" component={SubmitBusiness} />
                <Stack.Screen name="Feedback" component={Feedback} />
                <Stack.Screen name="BusTimetable" component={BusTimetable} />
              </Stack.Navigator>
                    </NavigationContainer>
                    </SubmittedListingsProvider>
                </NearbyProvider>
            </ReviewProvider>
            </NotificationProvider>
          </LanguageProvider>
        </DirectoryProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return <AppRoot />
}

const styles = StyleSheet.create({
  maintenanceOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#EAEAF9' },
  maintenanceCard: { width: '100%', maxWidth: 360, alignItems: 'center', padding: 28, borderRadius: 18, borderWidth: 1, borderColor: '#E3D8D3', backgroundColor: '#FFFDFB' },
  maintenanceIcon: { width: 48, height: 48, borderRadius: 24, color: '#FFF', backgroundColor: '#C95661', fontSize: 30, fontWeight: '900', lineHeight: 48, textAlign: 'center' },
  maintenanceTitle: { marginTop: 16, color: '#202332', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  maintenanceMessage: { marginTop: 8, color: '#656A7B', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  maintenanceButton: { marginTop: 18, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 9, backgroundColor: '#514BD5' },
  maintenanceButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
})
