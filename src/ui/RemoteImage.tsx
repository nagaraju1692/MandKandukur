import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ImageProps, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { colors } from './theme'

type RemoteImageStatus = 'loading' | 'loaded' | 'error'

type RemoteImageProps = {
  source: ImageSourcePropType
  fallbackSource?: ImageSourcePropType
  style?: StyleProp<ViewStyle>
  resizeMode?: ImageProps['resizeMode']
  fallbackContent?: React.ReactNode
}

function getSourceKey(source: ImageSourcePropType) {
  if (typeof source === 'number') return `local:${source}`
  if (Array.isArray(source)) return source.map(getSourceKey).join('|')
  return source.uri || 'empty'
}

export default function RemoteImage({ source, fallbackSource, style, resizeMode = 'cover', fallbackContent }: RemoteImageProps) {
  const sourceKey = getSourceKey(source)
  const [status, setStatus] = useState<RemoteImageStatus>('loading')
  const [effectiveSource, setEffectiveSource] = useState(source)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    setEffectiveSource(source)
    setUsingFallback(false)
    setStatus('loading')
  }, [sourceKey])

  const handleError = () => {
    if (fallbackSource && !usingFallback) {
      setEffectiveSource(fallbackSource)
      setUsingFallback(true)
      setStatus('loading')
      return
    }
    setStatus('error')
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.placeholder}>
        {status === 'loading' ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        {status === 'error' ? fallbackContent ?? <View style={styles.errorMark} /> : null}
      </View>
      {status !== 'error' ? (
        <Image
          source={effectiveSource}
          style={styles.image}
          resizeMode={resizeMode}
          onLoadStart={() => setStatus('loading')}
          onLoad={() => setStatus('loaded')}
          onError={handleError}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E7E9FA',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7E9FA',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  errorMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D9DDEB',
  },
})