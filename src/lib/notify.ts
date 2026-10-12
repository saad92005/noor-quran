import { useEffect } from 'react'
import { schedule, PRAYERS, PRAYER_LABEL } from './prayer'
import { getSettings, useSettings } from './settings'

// Adhan recording by Andrewler, CC BY-SA 4.0, via Wikimedia Commons (streamed, not bundled).
export const ADHAN_URL = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/8/86/Azan.ogg/Azan.ogg.mp3'
export const ADHAN_CREDIT = 'Adhan recording: Andrewler, CC BY-SA 4.0, via Wikimedia Commons'
let adhanEl: HTMLAudioElement | null = null
export function playAdhan() {
  adhanEl?.pause()
  adhanEl = new Audio(ADHAN_URL)
  return adhanEl.play()
}
export function stopAdhan() { adhanEl?.pause(); adhanEl = null }

export const notificationSupport = () => {
  if (!('Notification' in window)) return 'unsupported' as const
  return Notification.permission
}

/**
 * Prayer reminders using the browser Notification API (no push service, no cost).
 * Honest limitation: these fire while the app is open or kept in the background by the browser.
 * Browsers do not let a free, server-less PWA schedule notifications after it has been closed.
 */
export function usePrayerNotifications() {
  const { notify, location } = useSettings()
  useEffect(() => {
    if (!notify || !location || notificationSupport() !== 'granted') return
    const fired = new Set<string>()
    const tick = async () => {
      const r = schedule(getSettings())
      if (!r) return
      const now = Date.now()
      for (const p of PRAYERS) {
        if (p === 'sunrise') continue
        const at = r.times[p].getTime()
        const key = `${p}-${at}`
        if (now >= at && now - at < 90_000 && !fired.has(key)) {
          fired.add(key)
          const body = r.fromMosque[p] ? `Jamaat for ${PRAYER_LABEL[p]} at ${r.mosque!.name}.` : `It is time for ${PRAYER_LABEL[p]}.`
          const reg = await navigator.serviceWorker?.getRegistration()
          if (reg) reg.showNotification('Sirat Path — Prayer time', { body, icon: '/icon-192.png', tag: key })
          else new Notification('Sirat Path — Prayer time', { body, icon: '/icon-192.png' })
          if (getSettings().adhan) playAdhan().catch(() => { /* browser blocked autoplay */ })
        }
      }
    }
    const id = setInterval(tick, 20_000)
    tick()
    return () => clearInterval(id)
  }, [notify, location])
}
