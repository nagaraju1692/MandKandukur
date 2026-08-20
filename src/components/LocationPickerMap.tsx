import { Platform } from 'react-native'
import LocationPickerMapNative from './LocationPickerMap.native'
import LocationPickerMapWeb from './LocationPickerMap.web'

export type { LocationPickerMapProps } from './LocationPickerMap.native'

export default Platform.OS === 'web' ? LocationPickerMapWeb : LocationPickerMapNative
