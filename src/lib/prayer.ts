import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, Qibla, SunnahTimes } from 'adhan'
import type { Settings } from './settings'

export const METHODS: Record<string, string> = {
  MuslimWorldLeague: 'Muslim World League',
  Karachi: 'University of Islamic Sciences, Karachi',
  Egyptian: 'Egyptian General Authority',
  UmmAlQura: 'Umm al-Qura, Makkah',
  NorthAmerica: 'ISNA (North America)',
  Dubai: 'Dubai',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  MoonsightingCommittee: 'Moonsighting Committee',
  Singapore: 'Singapore',
  Turkey: 'Diyanet, Turkey',
  Tehran: 'Tehran',
}

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
export type PrayerName = (typeof PRAYERS)[number]
export const PRAYER_LABEL: Record<PrayerName, string> = {
  fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
}

// Method and Asr juristic setting most mosques use in each region, so "Auto" matches local timetables.
type Calc = { method: string; madhab: 'Shafi' | 'Hanafi' }
const BY_COUNTRY: [RegExp, Calc][] = [
  [/pakistan|india|bangladesh|afghanistan/i, { method: 'Karachi', madhab: 'Hanafi' }],
  [/saudi|yemen|oman|bahrain/i, { method: 'UmmAlQura', madhab: 'Shafi' }],
  [/egypt|sudan|libya|syria|lebanon|iraq|jordan|palestine/i, { method: 'Egyptian', madhab: 'Shafi' }],
  [/emirates|uae/i, { method: 'Dubai', madhab: 'Shafi' }],
  [/qatar/i, { method: 'Qatar', madhab: 'Shafi' }],
  [/kuwait/i, { method: 'Kuwait', madhab: 'Shafi' }],
  [/turkey|türkiye/i, { method: 'Turkey', madhab: 'Hanafi' }],
  [/malaysia|singapore|indonesia|brunei/i, { method: 'Singapore', madhab: 'Shafi' }],
  [/iran/i, { method: 'Tehran', madhab: 'Shafi' }],
  [/usa|united states|canada/i, { method: 'NorthAmerica', madhab: 'Shafi' }],
  [/united kingdom|uk|england|scotland|wales|ireland/i, { method: 'MoonsightingCommittee', madhab: 'Hanafi' }],
]
const BY_TZ: [RegExp, Calc][] = [
  [/Asia\/(Karachi|Kolkata|Calcutta|Dhaka|Kabul)/, BY_COUNTRY[0][1]],
  [/Asia\/(Riyadh|Aden|Muscat|Bahrain)/, BY_COUNTRY[1][1]],
  [/Africa\/(Cairo|Khartoum|Tripoli)|Asia\/(Damascus|Beirut|Baghdad|Amman|Gaza|Hebron)/, BY_COUNTRY[2][1]],
  [/Asia\/Dubai/, BY_COUNTRY[3][1]], [/Asia\/Qatar/, BY_COUNTRY[4][1]], [/Asia\/Kuwait/, BY_COUNTRY[5][1]],
  [/Europe\/Istanbul/, BY_COUNTRY[6][1]],
  [/Asia\/(Kuala_Lumpur|Singapore|Jakarta|Makassar|Brunei)/, BY_COUNTRY[7][1]],
  [/Asia\/Tehran/, BY_COUNTRY[8][1]],
  [/^America\//, BY_COUNTRY[9][1]],
  [/Europe\/(London|Dublin)/, BY_COUNTRY[10][1]],
]
const FALLBACK: Calc = { method: 'MuslimWorldLeague', madhab: 'Shafi' }

/** Recommended calculation for a place: from the city label's country, else the device time zone. */
export function regionCalc(label?: string): Calc {
  const country = label?.split(',').pop()?.trim()
  if (country && !/^(my location|custom|mosque)/i.test(label!)) {
    const hit = BY_COUNTRY.find(([re]) => re.test(country))
    if (hit) return hit[1]
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  return BY_TZ.find(([re]) => re.test(tz))?.[1] ?? FALLBACK
}

/** The method and Asr setting actually in use, resolving "auto". */
export function resolveCalc(s: Pick<Settings, 'method' | 'madhab' | 'location'>): Calc {
  const rec = regionCalc(s.location?.label)
  return { method: s.method === 'auto' ? rec.method : s.method, madhab: s.madhab === 'auto' ? rec.madhab : s.madhab }
}

/** Computed fully on-device with the open-source `adhan` library — no API call. */
export function computeTimes(s: Settings, date = new Date()) {
  if (!s.location) return null
  const coords = new Coordinates(s.location.lat, s.location.lng)
  const calc = resolveCalc(s)
  const factory = (CalculationMethod as unknown as Record<string, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>>)[calc.method]
    ?? CalculationMethod.MuslimWorldLeague
  const params = factory()
  params.madhab = calc.madhab === 'Hanafi' ? Madhab.Hanafi : Madhab.Shafi
  // Far north/south, Fajr and Isha twilight may never happen in summer; use the recommended fallback rule.
  params.highLatitudeRule = HighLatitudeRule.recommended(coords)
  Object.assign(params.adjustments, s.adjustments)
  const times = new PrayerTimes(coords, date, params)
  return { times, sunnah: new SunnahTimes(times) }
}

export function nextPrayer(s: Settings, now = new Date()) {
  const today = computeTimes(s, now)
  if (!today) return null
  for (const p of PRAYERS) {
    if (p === 'sunrise') continue
    if (today.times[p] > now) return { name: p, at: today.times[p] }
  }
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  return { name: 'fajr' as PrayerName, at: computeTimes(s, tomorrow)!.times.fajr }
}

export const qiblaBearing = (lat: number, lng: number) => Qibla(new Coordinates(lat, lng))

export const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function fmtCountdown(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60
  return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
}

/** Hijri date via the browser's built-in Umm al-Qura calendar — no library, no API. */
export function hijri(date: Date, offsetDays = 0) {
  const d = new Date(date); d.setDate(d.getDate() + offsetDays)
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  } catch {
    return new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  }
}
