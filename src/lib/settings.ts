import { useSyncExternalStore } from 'react'

export type Mosque = {
  id: string; name: string; lat?: number; lng?: number
  /** Per prayer: fixed "HH:MM", or "+N" minutes after the adhan time. */
  jamaat: Record<string, string>
}

export type Settings = {
  theme: 'light' | 'dark' | 'system'
  arabicSize: number
  showTranslation: boolean
  reciter: string
  method: string
  /** Asr juristic setting; 'auto' follows the region. */
  madhab: 'Shafi' | 'Hanafi' | 'auto'
  location: { lat: number; lng: number; label: string } | null
  hijriOffset: number
  adjustments: Record<string, number>
  lastRead: { s: number; a: number } | null
  notify: boolean
  readMode: 'verse' | 'mushaf'
  playbackRate: number
  repeat: number
  sidebarSurahs: boolean
  accent: 'emerald' | 'lavender' | 'teal'
  lang: 'en' | 'ur' | 'ar'
  name: string
  dailyAyahGoal: number
  sound: boolean
  onboarded: boolean
  secondTranslation: number
  /** Preferred Urdu translator (quran.com id), remembered while Urdu is switched off. */
  urduId: number
  /** Hadith translation shown under the Arabic. */
  hadithLang: 'en' | 'ur' | 'both'
  tajweed: boolean
  adhan: boolean
  /** Keep reciting into the next surah when one finishes. */
  continueSurahs: boolean
  /** Missed (qada) prayers still owed, per prayer. */
  qada: Record<string, number>
  /** Mosques the user follows; jamaat times are entered by the user (no public source exists). */
  mosques: Mosque[]
  mosqueId: string | null
  /** Use the selected mosque's jamaat times throughout the app (Home, Salah, reminders, calendar). */
  mosqueTimes: boolean
  prayerV2: boolean
  /** Hifz progress per surah number: learning or memorised, plus the last revision day. */
  hifz: Record<string, { st: 'learning' | 'done'; rev?: string }>
}

const DEFAULTS: Settings = {
  theme: 'system', arabicSize: 30, showTranslation: true, reciter: 'Alafasy_128kbps',
  method: 'auto', madhab: 'auto', location: null, hijriOffset: 0,
  adjustments: {}, lastRead: null, notify: false,
  readMode: 'verse', playbackRate: 1, repeat: 1, sidebarSurahs: true,
  accent: 'emerald', lang: 'en', name: '', dailyAyahGoal: 20, sound: false, onboarded: false, secondTranslation: 0, urduId: 234, hadithLang: 'en', tajweed: false, adhan: false,
  continueSurahs: true, qada: {}, hifz: {}, mosques: [], mosqueId: null, mosqueTimes: true, prayerV2: true,
}

const KEY = 'sirat-settings'
let current: Settings = read()
const listeners = new Set<() => void>()

function read(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    // Older versions defaulted to MWL + Shafi, which is wrong for much of South Asia. Move untouched defaults to Auto.
    if (Object.keys(saved).length && !saved.prayerV2) {
      if (saved.method === 'MuslimWorldLeague' || saved.method === undefined) saved.method = 'auto'
      if (saved.madhab === 'Shafi' || saved.madhab === undefined) saved.madhab = 'auto'
      saved.prayerV2 = true
      try { localStorage.setItem(KEY, JSON.stringify(saved)) } catch { /* storage unavailable */ }
    }
    return { ...DEFAULTS, ...saved }
  } catch { return DEFAULTS }
}

export function setSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* storage unavailable */ }
  listeners.forEach((l) => l())
}

export const getSettings = () => current

export function useSettings() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => current,
  )
}
