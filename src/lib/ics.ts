import { schedule, PRAYER_LABEL, PRAYERS } from './prayer'
import type { Settings } from './settings'

// Exports upcoming prayer times as an iCalendar file. The phone's own calendar then raises the
// alarms — this works even when the PWA is closed, with no push server and no cost.
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function prayerIcs(s: Settings, days = 30, alarmMinutes = 0) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sirat Path//Prayer Times//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Sirat Path — Prayer times']
  const start = new Date(); start.setHours(12, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const r = schedule(s, d)
    if (!r) continue
    for (const p of PRAYERS) {
      if (p === 'sunrise') continue
      const at = r.times[p]
      const name = p === 'dhuhr' && d.getDay() === 5 ? 'Jumuʿah' : PRAYER_LABEL[p]
      lines.push('BEGIN:VEVENT', `UID:${p}-${stamp(at)}@siratpath`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(at)}`,
        `DTEND:${stamp(new Date(at.getTime() + 15 * 60_000))}`, `SUMMARY:🕌 ${name}`, `DESCRIPTION:${name}${r.fromMosque[p] ? ` jamaat — ${r.mosque!.name}` : ` — ${s.location?.label ?? ''}`} (Sirat Path)`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${name}`, `TRIGGER:-PT${alarmMinutes}M`, 'END:VALARM', 'END:VEVENT')
    }
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(s: Settings, days = 30, alarmMinutes = 0) {
  const url = URL.createObjectURL(new Blob([prayerIcs(s, days, alarmMinutes)], { type: 'text/calendar' }))
  Object.assign(document.createElement('a'), { href: url, download: 'sirat-path-prayer-times.ics' }).click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
