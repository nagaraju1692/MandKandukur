import React from 'react'
import { Alert } from 'react-native'
import Constants from 'expo-constants'
import type {
  ExpoSpeechRecognitionErrorEvent,
  ExpoSpeechRecognitionModule,
  ExpoSpeechRecognitionResultEvent,
} from 'expo-speech-recognition'

type Translate = (en: string, te: string) => string
type SpeechRecognitionModule = typeof ExpoSpeechRecognitionModule
type SpeechRecognitionSubscription = { remove: () => void }

type VoiceSearchOptions = {
  t: Translate
  onResult: (transcript: string, isFinal: boolean) => void
}

export function useVoiceSearch({ t, onResult }: VoiceSearchOptions) {
  const [recognizing, setRecognizing] = React.useState(false)
  const subscriptions = React.useRef<SpeechRecognitionSubscription[]>([])

  const clearSubscriptions = () => {
    subscriptions.current.forEach((subscription) => subscription.remove())
    subscriptions.current = []
  }

  React.useEffect(() => clearSubscriptions, [])

  const handleVoiceSearch = async () => {
    const unavailableMessage = () => Alert.alert(
      t('Voice search unavailable', 'వాయిస్ శోధన అందుబాటులో లేదు'),
      t('Please try again or type your search.', 'మళ్లీ ప్రయత్నించండి లేదా మీ శోధనను టైప్ చేయండి.'),
    )

    if (recognizing) {
      const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: SpeechRecognitionModule }
      ExpoSpeechRecognitionModule.stop()
      return
    }

    try {
      if (Constants.appOwnership === 'expo') {
        unavailableMessage()
        return
      }

      const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: SpeechRecognitionModule }
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        unavailableMessage()
        return
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(t('Microphone permission needed', 'మైక్రోఫోన్ అనుమతి అవసరం'), t('Allow microphone and speech recognition access to use voice search.', 'వాయిస్ శోధన కోసం మైక్రోఫోన్ మరియు వాయిస్ గుర్తింపు అనుమతిని అనుమతించండి.'))
        return
      }

      clearSubscriptions()
      subscriptions.current = [
        ExpoSpeechRecognitionModule.addListener('start', () => setRecognizing(true)),
        ExpoSpeechRecognitionModule.addListener('end', () => setRecognizing(false)),
        ExpoSpeechRecognitionModule.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
          const transcript = event.results[0]?.transcript
          if (transcript) onResult(transcript, event.isFinal === true)
        }),
        ExpoSpeechRecognitionModule.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
          setRecognizing(false)
          Alert.alert(
            t('Voice search unavailable', 'వాయిస్ శోధన అందుబాటులో లేదు'),
            event.message || t('Please try again or type your search.', 'మళ్లీ ప్రయత్నించండి లేదా మీ శోధనను టైప్ చేయండి.'),
          )
        }),
      ]
      ExpoSpeechRecognitionModule.start({ lang: 'en-IN', interimResults: true, continuous: false })
    } catch {
      setRecognizing(false)
      unavailableMessage()
    }
  }

  return { recognizing, handleVoiceSearch }
}