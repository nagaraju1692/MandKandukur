import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

// Update to match your GitHub repo that hosts APK releases.
const GITHUB_OWNER = 'nagaraju1692'
const GITHUB_REPO = 'Kandukur-mobile-apk'
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
const DISMISSED_VERSION_KEY = 'mana-kandukur-dismissed-update-version'
const LAST_CHECK_KEY = 'mana-kandukur-last-update-check'
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000 // avoid hitting GitHub's unauthenticated rate limit

export type AppUpdateInfo = {
  version: string
  downloadUrl: string
  releaseNotes: string
  releaseUrl: string
}

function normalizeVersion(tag: string): string {
  return tag.trim().replace(/^v/i, '')
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map((part) => parseInt(part, 10) || 0)
  const partsB = b.split('.').map((part) => parseInt(part, 10) || 0)
  const length = Math.max(partsA.length, partsB.length)
  for (let i = 0; i < length; i += 1) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0)
    if (diff !== 0) return diff
  }
  return 0
}

export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version || '0.0.0'
}

export async function fetchLatestUpdate(): Promise<AppUpdateInfo | null> {
  const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY)
  if (lastCheck && Date.now() - Number(lastCheck) < CHECK_INTERVAL_MS) return null
  await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()))

  const response = await fetch(RELEASES_API_URL, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) throw new Error(`GitHub releases request failed: ${response.status}`)
  const release = await response.json()

  const latestVersion = normalizeVersion(release.tag_name || '')
  if (!latestVersion) return null

  const currentVersion = getCurrentAppVersion()
  if (compareVersions(latestVersion, currentVersion) <= 0) return null

  const apkAsset = (release.assets || []).find((asset: { name: string; browser_download_url: string }) =>
    asset.name.toLowerCase().endsWith('.apk'))
  if (!apkAsset) return null

  return {
    version: latestVersion,
    downloadUrl: apkAsset.browser_download_url,
    releaseNotes: release.body || '',
    releaseUrl: release.html_url,
  }
}

export { DISMISSED_VERSION_KEY }
