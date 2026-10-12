import { useEffect, useState } from 'react'
import { CalendarPlus, Square, Volume2, Bell, BellOff, ChevronLeft, ChevronRight, MapPin, Printer } from 'lucide-react'
import { fmtTime, hijri, METHODS, nextPrayer, PRAYERS, PRAYER_LABEL, regionCalc, schedule } from '../lib/prayer'
import MosquePanel from '../components/MosquePanel'
import { setSettings, useSettings } from '../lib/settings'
import { ADHAN_CREDIT, notificationSupport, playAdhan, stopAdhan } from '../lib/notify'
import { downloadIcs } from '../lib/ics'
import LocationPicker from '../components/LocationPicker'
import { useT, type StrKey } from '../lib/i18n'
import SalahTracker from '../components/SalahTracker'

export default function Prayer() {
  const s = useSettings()
  const t = useT()
  const [offset, setOffset] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [editLoc, setEditLoc] = useState(false)
  const [perm, setPerm] = useState(notificationSupport)
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id) }, [])

  const date = new Date(now); date.setDate(now.getDate() + offset)
  const r = schedule(s, date)
  const next = offset === 0 ? nextPrayer(s, now) : null
  const rec = regionCalc(s.location?.label)

  async function toggleNotify() {
    if (s.notify) { setSettings({ notify: false }); return }
    if (perm === 'unsupported') return
    const p = perm === 'granted' ? 'granted' : await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') setSettings({ notify: true })
  }

  return (
    <div className="fade-in space-y-5">
      <h1 className="h-page">{t('salah')}</h1>
      <SalahTracker />

      {!s.location || editLoc ? (
        <section className="card space-y-3 p-5">
          <p className="font-semibold">Where are you?</p>
          <p className="text-sm text-muted">Times are calculated locally on your device. Your location never leaves it.</p>
          <LocationPicker />
          {s.location && <button className="btn-ghost w-full" onClick={() => setEditLoc(false)}>Done</button>}
        </section>
      ) : (
        <>
          <button onClick={() => setEditLoc(true)} className="chip hover:text-ink"><MapPin size={12} />{s.location.label || `${s.location.lat.toFixed(2)}, ${s.location.lng.toFixed(2)}`} · change</button>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line p-3">
              <button className="icon-btn" onClick={() => setOffset(offset - 1)} aria-label="Previous day"><ChevronLeft /></button>
              <div className="text-center">
                <p className="font-semibold">{offset === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                <p className="text-xs text-muted">{hijri(date, s.hijriOffset)}</p>
              </div>
              <button className="icon-btn" onClick={() => setOffset(offset + 1)} aria-label="Next day"><ChevronRight /></button>
            </div>
            <ul>
              {r && PRAYERS.map((p) => {
                const isNext = next?.name === p && next.at.toDateString() === date.toDateString()
                const past = offset === 0 && r.times[p] < now
                return (
                  <li key={p} className={`flex items-center justify-between px-5 py-4 transition ${isNext ? 'bg-brand text-brand-ink' : ''} ${past && !isNext ? 'opacity-50' : ''}`}>
                    <span className={`font-medium ${p === 'sunrise' && !isNext ? 'text-muted' : ''}`}>{p === 'dhuhr' && date.getDay() === 5 ? t('jumuah') : t(p as StrKey)}</span>
                    <span className="text-end">
                      <span className="block text-lg font-semibold tabular-nums">{fmtTime(r.times[p])}</span>
                      {r.fromMosque[p] && <span className={`block text-xs tabular-nums ${isNext ? 'text-brand-ink/80' : 'text-muted'}`}>Adhan {fmtTime(r.adhan[p])}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
            {r?.mosque && <p className="border-t border-line px-5 py-2 text-xs text-muted">Showing jamaat times of <b>{r.mosque.name}</b>{PRAYERS.some((p) => p !== 'sunrise' && !r.fromMosque[p]) ? '; prayers without a jamaat time show the calculated adhan time' : ''}.</p>}
            {r && (
              <p className="border-t border-line px-5 py-3 text-xs text-muted">
                Middle of the night {fmtTime(r.sunnah.middleOfTheNight)} · Last third {fmtTime(r.sunnah.lastThirdOfTheNight)}
              </p>
            )}
          </section>
          <MonthTable />
          <MosquePanel />
        </>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

      <section className="card space-y-4 p-5">
        <p className="font-semibold">Calculation</p>
        <label className="block text-sm">
          <span className="text-muted">Method</span>
          <select className="input mt-1" value={s.method} onChange={(e) => setSettings({ method: e.target.value })}>
            <option value="auto">Auto: {METHODS[rec.method]} (used in your region)</option>
            {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <div className="text-sm">
          <span className="text-muted">Asr</span>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button onClick={() => setSettings({ madhab: 'auto' })} className={`${s.madhab === 'auto' ? 'btn' : 'btn-ghost'} col-span-2 h-auto min-h-10 whitespace-normal text-center text-sm leading-tight`}>
              Auto ({rec.madhab === 'Hanafi' ? 'Hanafi' : 'Standard'}, as in your region)
            </button>
            {(['Shafi', 'Hanafi'] as const).map((m) => (
              <button key={m} onClick={() => setSettings({ madhab: m })} className={`${m === s.madhab ? 'btn' : 'btn-ghost'} h-auto min-h-10 whitespace-normal text-center text-sm leading-tight`}>
                {m === 'Shafi' ? 'Standard (Shafi, Maliki, Hanbali)' : 'Hanafi'}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted">Times still a few minutes off from your local mosque? Use the adjustments below, or add your mosque's jamaat times.</p>
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">Manual adjustments (minutes)</summary>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {PRAYERS.map((p) => (
              <label key={p} className="text-xs text-muted">{PRAYER_LABEL[p]}
                <input type="number" className="input mt-1 py-2" value={s.adjustments[p] ?? 0}
                  onChange={(e) => setSettings({ adjustments: { ...s.adjustments, [p]: Number(e.target.value) || 0 } })} />
              </label>
            ))}
          </div>
        </details>
      </section>

      <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-4 lg:self-start">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Prayer reminders</p>
          <p className="mt-1 text-sm text-muted">
            {perm === 'unsupported'
              ? 'This browser does not support notifications.'
              : 'Uses your browser’s notifications. Reminders fire while Sirat Path is open or running in the background; browsers may not deliver them after the app is fully closed.'}
          </p>
          {perm === 'denied' && <p className="mt-1 text-sm text-red-500">Notifications are blocked in browser settings.</p>}
          {!s.location && <p className="mt-1 text-sm text-gold">Set your location first to turn reminders on.</p>}
        </div>
        <button className={`${s.notify ? 'btn' : 'btn-ghost'} w-full shrink-0 sm:w-auto`} onClick={toggleNotify} disabled={perm === 'unsupported' || perm === 'denied' || !s.location}>
          {s.notify ? <Bell size={16} /> : <BellOff size={16} />}Reminders {s.notify ? 'on' : 'off'}
        </button>
      </section>
        <section className="card space-y-4 p-5 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Adhan sound</p>
              <p className="text-sm text-muted">Play the adhan when a reminder fires (while the app is open). <span className="break-words text-xs">{ADHAN_CREDIT}.</span></p>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-2">
              <button className="btn-ghost justify-center px-3" onClick={() => playAdhan().catch(() => alert('Could not play — check your connection.'))}><Volume2 size={16} />Preview</button>
              <button className="btn-ghost justify-center px-3" onClick={stopAdhan}><Square size={14} />Stop</button>
              <button className={`${s.adhan ? 'btn' : 'btn-ghost'} justify-center px-3`} onClick={() => setSettings({ adhan: !s.adhan })}>{s.adhan ? 'On' : 'Off'}</button>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Reminders even when the app is closed</p>
              <p className="text-sm text-muted">Add the next 30 days of prayer times to your phone’s calendar. Your calendar app raises the alarm — no internet or server needed. Re-export monthly or after changing location.</p>
            </div>
            <button className="btn w-full shrink-0 justify-center sm:w-auto" disabled={!s.location} onClick={() => downloadIcs(s, 30, 0)}><CalendarPlus size={16} />Add to calendar</button>
          </div>
        </section>
      </div>
    </div>
  )
}

function MonthTable() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  const now = new Date()
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return (
    <section className="card overflow-hidden print:border-0">
      <div className="flex items-center gap-2 p-4 print:hidden">
        <button className="flex-1 text-left font-semibold" onClick={() => setOpen(!open)}>
          {open ? '▾' : '▸'} Monthly timetable · {now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </button>
        {open && <button className="btn-ghost py-1.5" onClick={() => window.print()}><Printer size={15} />Print</button>}
      </div>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm tabular-nums">
            <thead className="bg-surface-2 text-xs uppercase text-muted">
              <tr><th className="px-3 py-2 text-left">Date</th>{PRAYERS.map((p) => <th key={p} className="px-2 py-2">{PRAYER_LABEL[p]}</th>)}</tr>
            </thead>
            <tbody>
              {Array.from({ length: days }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth(), i + 1, 12)
                const r = schedule(s, d)
                const isToday = d.toDateString() === now.toDateString()
                return (
                  <tr key={i} className={`border-t border-line ${isToday ? 'bg-brand/10 font-semibold' : ''} ${d.getDay() === 5 ? 'text-brand' : ''}`}>
                    <td className="px-3 py-2 text-left">{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</td>
                    {r && PRAYERS.map((p) => <td key={p} className="px-2 py-2 text-center">{fmtTime(r.times[p])}</td>)}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
