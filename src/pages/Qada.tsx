import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { setSettings, useSettings } from '../lib/settings'

const BASE = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export default function Qada() {
  const { qada, madhab } = useSettings()
  const prayers = madhab === 'Hanafi' ? [...BASE, 'Witr'] : BASE
  const [days, setDays] = useState(0)
  const total = prayers.reduce((n, p) => n + (qada[p] ?? 0), 0)
  const change = (p: string, d: number) => setSettings({ qada: { ...qada, [p]: Math.max(0, (qada[p] ?? 0) + d) } })
  const addDays = () => {
    if (days <= 0) return
    setSettings({ qada: { ...qada, ...Object.fromEntries(prayers.map((p) => [p, (qada[p] ?? 0) + days])) } })
    setDays(0)
  }

  return (
    <div className="fade-in mx-auto max-w-lg space-y-5">
      <h1 className="h-page">Qada Tracker</h1>
      <p className="text-muted">Keep count of missed (qada) prayers you still owe, and tap − each time you make one up.</p>

      <div className="card p-5 text-center">
        <p className="text-4xl font-bold tabular-nums">{total}</p>
        <p className="text-sm text-muted">{total ? 'prayers left to make up' : 'Nothing owed. Alhamdulillah'}</p>
      </div>

      <ul className="card divide-y divide-line">
        {prayers.map((p) => (
          <li key={p} className="flex items-center gap-3 p-4">
            <span className="flex-1 font-medium">{p}</span>
            <button className="icon-btn" aria-label={`Made up one ${p}`} onClick={() => change(p, -1)} disabled={!qada[p]}><Minus size={18} /></button>
            <span className="w-12 text-center text-lg font-semibold tabular-nums">{qada[p] ?? 0}</span>
            <button className="icon-btn" aria-label={`Add a missed ${p}`} onClick={() => change(p, 1)}><Plus size={18} /></button>
          </li>
        ))}
      </ul>

      <section className="card space-y-3 p-5">
        <p className="font-semibold">Add whole days</p>
        <p className="text-sm text-muted">Missed a stretch of days? Add that many of each prayer at once.</p>
        <div className="flex gap-2">
          <input type="number" min={0} inputMode="numeric" className="input min-w-0 flex-1" value={days || ''} placeholder="Number of days"
            onChange={(e) => setDays(Math.max(0, Math.floor(+e.target.value)))} />
          <button className="btn" onClick={addDays} disabled={days <= 0}>Add</button>
        </div>
      </section>

      <p className="text-xs text-muted">
        Witr is listed when your madhab is set to Hanafi in Salah settings. Scholars differ on how to estimate and order missed
        prayers, so ask a local scholar about your own situation.
      </p>
    </div>
  )
}
