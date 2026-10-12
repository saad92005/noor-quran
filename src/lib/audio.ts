import { useSyncExternalStore } from 'react'
import { getQuran } from './quran'
import { getSettings } from './settings'

// Per-ayah recitations streamed from EveryAyah.com (free public recitation archive).
// Nothing is bundled; the service worker caches files only after the user plays/downloads them.
export const RECITERS: Record<string, string> = {
  Alafasy_128kbps: 'Mishary Rashid Alafasy',
  Abdul_Basit_Murattal_192kbps: 'Abdul Basit (Murattal)',
  Husary_128kbps: 'Mahmoud Khalil Al-Husary',
  Minshawy_Murattal_128kbps: 'Mohamed Siddiq Al-Minshawi',
  'Abdurrahmaan_As-Sudais_192kbps': 'Abdurrahman As-Sudais',
}

export const ayahUrl = (reciter: string, s: number, a: number) =>
  `https://everyayah.com/data/${reciter}/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`

type State = { s: number; a: number; playing: boolean; loading: boolean; error: string | null } | null

let state: State = null
let plays = 0
const listeners = new Set<() => void>()
const el = typeof Audio !== 'undefined' ? new Audio() : null
const emit = () => listeners.forEach((l) => l())
const set = (p: Partial<NonNullable<State>>) => { state = state ? { ...state, ...p } : null; emit() }

if (el) {
  el.preload = 'auto'
  el.addEventListener('playing', () => { set({ playing: true, loading: false, error: null }); session('playing'); prefetchNext() })
  el.addEventListener('pause', () => { set({ playing: false }); session('paused') })
  el.addEventListener('waiting', () => set({ loading: true }))
  el.addEventListener('error', () => set({ playing: false, loading: false, error: 'Audio unavailable — check your connection.' }))
  el.addEventListener('ended', () => {
    const q = getQuran()
    if (!state || !q) return
    if (sleepAt && Date.now() >= sleepAt) { setSleep(0); set({ playing: false }); return }
    // Repeat each ayah N times (memorisation)
    if (++plays < getSettings().repeat) { el.currentTime = 0; el.play().catch(() => {}); return }
    const surah = q.surahs[state.s - 1]
    // Keep going without user input so recitation continues with the screen locked.
    if (state.a < surah.ayas) play(state.s, state.a + 1)
    else if (getSettings().continueSurahs && state.s < 114) play(state.s + 1, 1)
    else { set({ playing: false }); session('none') }
  })
  // Lock-screen / notification / headphone controls.
  if ('mediaSession' in navigator) {
    const h: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => { el.play().catch(() => {}) }],
      ['pause', () => el.pause()],
      ['stop', () => stop()],
      ['nexttrack', () => skip(1)],
      ['previoustrack', () => skip(-1)],
    ]
    for (const [a, fn] of h) { try { navigator.mediaSession.setActionHandler(a, fn) } catch { /* unsupported action */ } }
  }
}

function session(s: MediaSessionPlaybackState) {
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = s
}

/** Warm the cache with the next two ayahs so playback doesn't stall on the network while the phone is locked. */
const warmed = new Set<string>()
function prefetchNext() {
  const q = getQuran()
  if (!state || !q || !navigator.onLine) return
  let { s, a } = state
  for (let i = 0; i < 2; i++) {
    if (a < q.surahs[s - 1].ayas) a++
    else if (s < 114) { s++; a = 1 } else return
    const url = ayahUrl(getSettings().reciter, s, a)
    if (warmed.has(url)) continue
    warmed.add(url)
    fetch(url).catch(() => warmed.delete(url))
  }
}

export function play(s: number, a: number) {
  if (!el) return
  state = { s, a, playing: false, loading: true, error: null }
  emit()
  plays = 0
  el.src = ayahUrl(getSettings().reciter, s, a)
  el.playbackRate = getSettings().playbackRate
  el.play().catch(() => set({ loading: false }))
  if ('mediaSession' in navigator) {
    const q = getQuran()
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${q?.surahs[s - 1].tname ?? 'Surah'} ${s}:${a}`,
      artist: RECITERS[getSettings().reciter],
      album: 'Sirat Path',
      artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    })
  }
}

export function toggle() {
  if (!el || !state) return
  if (el.paused) el.play().catch(() => {})
  else el.pause()
}

export function stop() { el?.pause(); state = null; emit(); session('none') }

export function skip(dir: 1 | -1) {
  const q = getQuran()
  if (!state || !q) return
  const a = state.a + dir
  if (a >= 1 && a <= q.surahs[state.s - 1].ayas) play(state.s, a)
  else if (dir === 1 && state.s < 114) play(state.s + 1, 1)
  else if (dir === -1 && state.s > 1) play(state.s - 1, q.surahs[state.s - 2].ayas)
}

export function useAudio() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
}

/** Download a whole surah's audio into Cache Storage for offline listening. */
export async function downloadSurah(s: number, onProgress: (done: number, total: number) => void) {
  const q = getQuran()
  if (!q) return
  const total = q.surahs[s - 1].ayas
  const cache = await caches.open('quran-audio')
  const reciter = getSettings().reciter
  let done = 0
  for (let a = 1; a <= total; a++) {
    const url = ayahUrl(reciter, s, a)
    if (!(await cache.match(url))) {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed on ayah ${a}`)
      await cache.put(url, res)
    }
    onProgress(++done, total)
  }
}

export async function isSurahDownloaded(s: number) {
  const q = getQuran()
  if (!q || !('caches' in window)) return false
  const cache = await caches.open('quran-audio')
  const reciter = getSettings().reciter
  const last = await cache.match(ayahUrl(reciter, s, q.surahs[s - 1].ayas))
  const first = await cache.match(ayahUrl(reciter, s, 1))
  return Boolean(first && last)
}

export function setRate(r: number) { if (el) el.playbackRate = r }

// Sleep timer — pauses playback after N minutes.
let sleepTimer: ReturnType<typeof setTimeout> | null = null
let sleepAt: number | null = null
export function setSleep(minutes: number) {
  if (sleepTimer) clearTimeout(sleepTimer)
  sleepTimer = null; sleepAt = null
  if (minutes > 0) {
    sleepAt = Date.now() + minutes * 60_000
    sleepTimer = setTimeout(() => { el?.pause(); sleepAt = null; emit() }, minutes * 60_000)
  }
  emit()
}
export const getSleepAt = () => sleepAt
