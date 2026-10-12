import type { Mosque } from './settings'

// Nearby mosques come from OpenStreetMap (Overpass API, free, no key). Only the chosen point is sent, and only
// when the user taps "Find mosques near me". No public source has mosques' jamaat times, so the user enters those.
// Public Overpass mirrors are often busy, so try several, each with a timeout, then fall back to Nominatim.
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

export type NearbyMosque = { id: string; name: string; lat: number; lng: number; km: number; area?: string }

const km = (a: number, b: number, c: number, d: number) => {
  const r = (x: number) => (x * Math.PI) / 180
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

export async function findMosques(lat: number, lng: number, radius = 3000): Promise<NearbyMosque[]> {
  const q = `[out:json][timeout:15];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});out center 60;`
  const stop = new AbortController()
  setTimeout(() => stop.abort(), 15000)
  const signal = stop.signal
  const overpass = async (url: string) => {
    const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const els: El[] = (await res.json()).elements ?? []
    return els
      .map((e): NearbyMosque | null => {
        const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon
        if (la == null || lo == null) return null
        const t = e.tags ?? {}
        const name = t['name:en'] || t.name || 'Unnamed mosque'
        const area = t['addr:suburb'] || t['addr:street'] || t['addr:city']
        return { id: `osm-${e.type}-${e.id}`, name, lat: la, lng: lo, km: km(lat, lng, la, lo), area }
      })
      .filter((m): m is NearbyMosque => m !== null)
      .sort((a, b) => Number(a.name === 'Unnamed mosque') - Number(b.name === 'Unnamed mosque') || a.km - b.km)
      .slice(0, 20)
  }
  // Ask every mirror at once and take the first answer; Nominatim joins if none has answered after 6 s.
  const late = new Promise<NearbyMosque[]>((ok, no) => setTimeout(() => nominatim(lat, lng, radius, signal).then(ok, no), 6000))
  try { return await Promise.any([...ENDPOINTS.map(overpass), late]) }
  catch { throw new Error('Mosque search failed') }
  finally { stop.abort() }
}

async function nominatim(lat: number, lng: number, radius: number, signal: AbortSignal): Promise<NearbyMosque[]> {
  const d = radius / 111_000, dl = d / Math.cos((lat * Math.PI) / 180)
  const box = [lng - dl, lat + d, lng + dl, lat - d].map((n) => n.toFixed(5)).join(',')
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=mosque&format=jsonv2&limit=40&bounded=1&viewbox=${box}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const rows: { osm_type: string; osm_id: number; lat: string; lon: string; name?: string; display_name: string }[] = await res.json()
  return rows
    .map((x) => {
      const la = +x.lat, lo = +x.lon
      const parts = x.display_name.split(',').map((p) => p.trim())
      return { id: `osm-${x.osm_type}-${x.osm_id}`, name: x.name || parts[0] || 'Unnamed mosque', lat: la, lng: lo, km: km(lat, lng, la, lo), area: parts[1] }
    })
    .sort((a, b) => a.km - b.km)
    .slice(0, 20)
}

export const JAMAAT_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah'] as const
export const isValidJamaat = (v: string) => v === '' || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v) || /^\+\d{1,3}$/.test(v)

/** Jamaat time for a prayer on a date: fixed "HH:MM", or "+N" minutes after that day's adhan. */
export function jamaatAt(m: Mosque | undefined, prayer: string, adhan: Date): Date | null {
  if (!m) return null
  const key = prayer === 'dhuhr' && adhan.getDay() === 5 && m.jamaat.jumuah ? 'jumuah' : prayer
  const v = m.jamaat[key]?.trim()
  if (!v || !isValidJamaat(v)) return null
  if (v.startsWith('+')) return new Date(adhan.getTime() + Number(v.slice(1)) * 60_000)
  const [h, min] = v.split(':').map(Number)
  const d = new Date(adhan); d.setHours(h, min, 0, 0)
  return d
}
