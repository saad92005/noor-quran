import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, RotateCcw } from 'lucide-react'
import { today } from '../lib/db'
import { useQuran } from '../lib/quran'
import { setSettings, useSettings } from '../lib/settings'
import Loading from '../components/Loading'

type Filter = 'all' | 'learning' | 'done'
const daysAgo = (d?: string) => (d ? Math.round((Date.parse(today()) - Date.parse(d)) / 864e5) : null)

export default function Hifz() {
  const { data, error } = useQuran()
  const { hifz } = useSettings()
  const [filter, setFilter] = useState<Filter>('all')

  const stats = useMemo(() => {
    if (!data) return null
    const done = data.surahs.filter((s) => hifz[s.n]?.st === 'done')
    // Longest-unrevised first, so nothing memorised is forgotten.
    const due = [...done].sort((a, b) => (hifz[a.n].rev ?? '').localeCompare(hifz[b.n].rev ?? '')).slice(0, 3)
    return { count: done.length, ayahs: done.reduce((n, s) => n + s.ayas, 0), due }
  }, [data, hifz])

  if (!data || !stats) return <Loading error={error} />

  const cycle = (n: number) => {
    const cur = hifz[n]?.st
    const next = { ...hifz }
    if (!cur) next[n] = { st: 'learning' }
    else if (cur === 'learning') next[n] = { st: 'done', rev: today() }
    else delete next[n]
    setSettings({ hifz: next })
  }
  const revised = (n: number) => setSettings({ hifz: { ...hifz, [n]: { st: 'done', rev: today() } } })
  const list = data.surahs.filter((s) => filter === 'all' || hifz[s.n]?.st === filter)

  return (
    <div className="fade-in mx-auto max-w-2xl space-y-5">
      <h1 className="h-page">Hifz Tracker</h1>
      <p className="text-muted">Mark the surahs you are memorising and the ones you know, then keep them fresh with regular revision.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center"><p className="text-3xl font-bold tabular-nums">{stats.count}</p><p className="text-xs text-muted">surahs memorised</p></div>
        <div className="card p-4 text-center"><p className="text-3xl font-bold tabular-nums">{stats.ayahs}</p><p className="text-xs text-muted">of 6236 ayahs</p></div>
      </div>

      {stats.due.length > 0 && (
        <section className="card space-y-2 p-5">
          <p className="font-semibold">Revise next</p>
          {stats.due.map((s) => {
            const ago = daysAgo(hifz[s.n].rev)
            return (
              <div key={s.n} className="flex items-center gap-3">
                <Link to={`/quran/${s.n}`} className="min-w-0 flex-1 truncate font-medium">{s.n}. {s.tname}</Link>
                <span className="shrink-0 text-xs text-muted">{ago === null ? 'not yet' : ago === 0 ? 'today' : `${ago}d ago`}</span>
                <button className="btn-ghost shrink-0 px-3 py-1.5 text-xs" onClick={() => revised(s.n)}><RotateCcw size={14} />Revised</button>
              </div>
            )
          })}
        </section>
      )}

      <div className="flex gap-2" role="radiogroup" aria-label="Filter">
        {(['all', 'learning', 'done'] as Filter[]).map((f) => (
          <button key={f} role="radio" aria-checked={filter === f} onClick={() => setFilter(f)} className={filter === f ? 'btn' : 'btn-ghost'}>
            {f === 'all' ? 'All' : f === 'learning' ? 'Learning' : 'Memorised'}
          </button>
        ))}
      </div>

      <ul className="card divide-y divide-line">
        {list.map((s) => {
          const st = hifz[s.n]?.st
          return (
            <li key={s.n} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/quran/${s.n}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.n}. {s.tname}</p>
                <p className="text-xs text-muted">{s.ayas} ayahs</p>
              </Link>
              <button onClick={() => cycle(s.n)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${st === 'done' ? 'bg-brand text-brand-ink' : st === 'learning' ? 'border border-brand text-brand' : 'border border-line text-muted'}`}>
                {st === 'done' ? <span className="inline-flex items-center gap-1"><Check size={13} />Memorised</span> : st === 'learning' ? 'Learning' : 'Not started'}
              </button>
            </li>
          )
        })}
        {list.length === 0 && <li className="p-6 text-center text-sm text-muted">Nothing here yet. Tap “Not started” on a surah to begin.</li>}
      </ul>
    </div>
  )
}
