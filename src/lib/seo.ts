// Per-route <title>, description and canonical link. Google renders the SPA, so these get indexed per page.
import { useEffect } from 'react'
import { SITE } from './share'

const BRAND = 'Sirat Path'
const DEFAULT_DESC = 'Free, ad-free Islamic companion app: Quran with translation and audio, prayer times with adhan, Qibla compass, duas, hadith, azkar and more. Works offline.'

const PAGES: Record<string, [string, string]> = {
  '/': ['Sirat Path — Free Islamic App: Quran, Prayer Times, Qibla & Duas', DEFAULT_DESC],
  '/quran': ['Read Quran Online — All 114 Surahs with Translation & Audio', 'Read the Holy Quran online with Arabic text, English and Urdu translation, tajweed colours and audio recitation for all 114 surahs. Free and offline.'],
  '/prayer': ['Prayer Times & Adhan Reminders for Your City', 'Accurate Namaz / Salah prayer times for your location with adhan notifications, Hanafi and Shafi Asr, and a prayer tracker.'],
  '/qibla': ['Qibla Direction Finder — Online Qibla Compass', 'Find the Qibla direction to the Kaaba in Makkah from anywhere with a live compass and map.'],
  '/duas': ['Daily Duas from Quran & Sunnah — Arabic, Transliteration, Translation', 'Authentic duas from the Quran and Sunnah with Arabic, transliteration and translation, including Ayatul Kursi and Masnoon duas.'],
  '/azkar': ['Morning & Evening Azkar (Adhkar)', 'Morning and evening azkar with counters, Arabic text, transliteration and translation.'],
  '/dhikr': ['Digital Tasbih Counter — Dhikr', 'Free online tasbih counter for SubhanAllah, Alhamdulillah, Allahu Akbar and custom dhikr.'],
  '/hadith': ['Hadith Collections — Bukhari, Muslim & More', 'Browse authentic hadith from Sahih al-Bukhari, Sahih Muslim and other collections with Arabic and English.'],
  '/names': ['99 Names of Allah with Meanings', 'The 99 beautiful names of Allah (Asma ul Husna) with Arabic, transliteration and meanings.'],
  '/calendar': ['Islamic Hijri Calendar', 'Hijri calendar with today\'s Islamic date and important Islamic events.'],
  '/ramadan': ['Ramadan Sehri & Iftar Times and Tracker', 'Sehri and iftar times, fasting tracker and Ramadan duas.'],
  '/zakat': ['Zakat Calculator', 'Calculate your zakat on gold, silver, cash and assets with the current nisab.'],
  '/hajj': ['Hajj & Umrah Guide Step by Step', 'Step-by-step Hajj and Umrah guide with duas for each rite.'],
  '/ask': ['Ask Islamic Questions — AI Assistant', 'Ask questions about Islam and get answers with references from the Quran and Hadith.'],
  '/learn': ['Learn Islam — Free Lessons', 'Short free lessons on the basics of Islam, salah, wudu and more.'],
  '/kids': ['Islamic Learning for Kids', 'Fun Islamic learning for children: short surahs, duas and stories.'],
  '/khatm': ['Quran Khatm Planner', 'Plan and track finishing the whole Quran.'],
  '/hifz': ['Hifz Tracker', 'Track the surahs you are memorising and revise them regularly.'],
  '/qada': ['Qada Prayer Tracker', 'Keep count of missed prayers and make them up.'],
  '/habits': ['Islamic Habit Tracker', 'Track daily good deeds and Islamic habits.'],
  '/library': ['Islamic Library', 'Islamic reading library.'],
  '/about': ['About Sirat Path', DEFAULT_DESC],
}

function setMeta(sel: string, attr: string, value: string) {
  document.querySelector(sel)?.setAttribute(attr, value)
}

export function applyMeta(title: string, desc = DEFAULT_DESC, path = location.pathname) {
  document.title = title.includes(BRAND) ? title : `${title} | ${BRAND}`
  setMeta('meta[name="description"]', 'content', desc)
  setMeta('meta[property="og:title"]', 'content', document.title)
  setMeta('meta[property="og:description"]', 'content', desc)
  setMeta('meta[property="og:url"]', 'content', SITE + path)
  setMeta('link[rel="canonical"]', 'href', SITE + path)
}

/** Route-level defaults. Pages with richer data (a surah) call usePageMeta themselves. */
export function useRouteMeta(pathname: string) {
  useEffect(() => {
    if (/^\/quran\/\d+/.test(pathname)) return
    const base = '/' + (pathname.split('/')[1] ?? '')
    const [t, d] = PAGES[pathname] ?? PAGES[base] ?? [BRAND, DEFAULT_DESC]
    applyMeta(t, d, pathname)
  }, [pathname])
}

export function usePageMeta(title: string | undefined, desc?: string) {
  useEffect(() => { if (title) applyMeta(title, desc) }, [title, desc])
}
