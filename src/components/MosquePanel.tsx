import { useState } from 'react'
import { Loader2, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import { findMosques, isValidJamaat, JAMAAT_KEYS, type NearbyMosque } from '../lib/mosques'
import { setSettings, useSettings, type Mosque } from '../lib/settings'

const LABEL: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', jumuah: 'Jumuʿah' }

/** Pick a local mosque and record its jamaat (congregation) times. */
export default function MosquePanel() {
  const s = useSettings()
  const [found, setFound] = useState<NearbyMosque[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const active = s.mosques.find((m) => m.id === s.mosqueId)

  async function search() {
    if (!s.location) return
    setBusy(true); setErr(null)
    try {
      let list = await findMosques(s.location.lat, s.location.lng)
      if (list.length < 3) list = await findMosques(s.location.lat, s.location.lng, 10000)
      setFound(list)
      if (!list.length) setErr('No mosques are mapped near this location. Add yours by name below.')
    } catch { setErr('Could not search right now. Check your connection, or add your mosque by name.') }
    setBusy(false)
  }

  function choose(m: Omit<Mosque, 'jamaat'>) {
    const existing = s.mosques.find((x) => x.id === m.id)
    // Calculate adhan times at the mosque itself, so "+N minutes after adhan" matches its board.
    const location = m.lat != null && m.lng != null ? { lat: m.lat, lng: m.lng, label: `Mosque: ${m.name}` } : s.location
    setSettings({ mosques: existing ? s.mosques : [...s.mosques, { ...m, jamaat: {} }], mosqueId: m.id, location, mosqueTimes: true })
    setFound(null)
  }

  const update = (patch: Partial<Mosque>) =>
    setSettings({ mosques: s.mosques.map((m) => (m.id === s.mosqueId ? { ...m, ...patch } : m)) })

  return (
    <section className="card space-y-4 p-5">
      <div>
        <p className="font-semibold">My mosque</p>
        <p className="text-sm text-muted">Choose the mosque you pray at. Its jamaat times then replace the calculated times everywhere in the app, and adhan times are calculated at the mosque. Enter its times once from its notice board.</p>
      </div>

      {s.mosques.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {s.mosques.map((m) => (
            <button key={m.id} onClick={() => setSettings({ mosqueId: m.id, ...(m.lat != null && m.lng != null ? { location: { lat: m.lat, lng: m.lng, label: `Mosque: ${m.name}` } } : {}) })} className={m.id === s.mosqueId ? 'btn py-1.5 text-sm' : 'btn-ghost py-1.5 text-sm'}>{m.name}</button>
          ))}
          <button onClick={() => setSettings({ mosqueId: null })} className={!s.mosqueId ? 'btn py-1.5 text-sm' : 'btn-ghost py-1.5 text-sm'}>None</button>
        </div>
      )}

      {active && (
        <div className="space-y-3 rounded-2xl border border-line p-4">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-semibold">{active.name}</p>
            <button className="icon-btn" aria-label="Remove mosque" onClick={() => setSettings({ mosques: s.mosques.filter((m) => m.id !== active.id), mosqueId: null })}><Trash2 size={16} /></button>
          </div>
          <p className="text-xs text-muted">Type a fixed time like <b>13:30</b> (24-hour), or <b>+15</b> for 15 minutes after the adhan. Leave blank to skip.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {JAMAAT_KEYS.map((k) => {
              const v = active.jamaat[k] ?? ''
              return (
                <label key={k} className="text-xs text-muted">{LABEL[k]}
                  <input className={`input mt-1 py-2 ${isValidJamaat(v) ? '' : 'border-red-500'}`} placeholder={k === 'maghrib' ? 'e.g. +5' : k === 'jumuah' ? 'e.g. 13:30' : 'e.g. +15'} value={v}
                    onChange={(e) => update({ jamaat: { ...active.jamaat, [k]: e.target.value.replace(/\s/g, '') } })} />
                </label>
              )
            })}
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            Use this mosque's times across the app (Home, Salah, reminders, calendar)
            <input type="checkbox" className="size-5 shrink-0 accent-[var(--brand)]" checked={s.mosqueTimes} onChange={(e) => setSettings({ mosqueTimes: e.target.checked })} />
          </label>
          {active.lat != null && active.lng != null && s.location?.label !== `Mosque: ${active.name}` && (
            <button className="btn-ghost w-full text-sm" onClick={() => setSettings({ location: { lat: active.lat!, lng: active.lng!, label: `Mosque: ${active.name}` } })}>
              <MapPin size={15} />Calculate adhan times at this mosque
            </button>
          )}
        </div>
      )}

      <button className="btn w-full" onClick={search} disabled={busy || !s.location}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}Find mosques near me
      </button>
      {!s.location && <p className="text-sm text-gold">Set your location first.</p>}
      {err && <p className="text-sm text-muted">{err}</p>}

      {found && found.length > 0 && (
        <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-2xl border border-line">
          {found.map((m) => (
            <li key={m.id}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2" onClick={() => choose(m)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{m.name}</span>
                  {m.area && <span className="block truncate text-xs text-muted">{m.area}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted tabular-nums">{m.km < 1 ? `${Math.round(m.km * 1000)} m` : `${m.km.toFixed(1)} km`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input className="input min-w-0 flex-1" placeholder="Or add a mosque by name" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn-ghost shrink-0" disabled={!manual.trim()} onClick={() => { choose({ id: `own-${Date.now()}`, name: manual.trim() }); setManual('') }}><Plus size={16} />Add</button>
      </div>
      <p className="text-xs text-muted">Mosque search uses OpenStreetMap: only your current point is sent, and only when you tap search.</p>
    </section>
  )
}
