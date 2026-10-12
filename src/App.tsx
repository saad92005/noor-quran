import { lazy, Suspense, useEffect } from 'react'
import Loading from './components/Loading'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
const SurahList = lazy(() => import('./pages/SurahList'))
const Reader = lazy(() => import('./pages/Reader'))
const SearchPage = lazy(() => import('./pages/Search'))
const Prayer = lazy(() => import('./pages/Prayer'))
const QiblaPage = lazy(() => import('./pages/Qibla'))
const Duas = lazy(() => import('./pages/Duas'))
const DhikrPage = lazy(() => import('./pages/Dhikr'))
const Khatm = lazy(() => import('./pages/Khatm'))
const Saved = lazy(() => import('./pages/Saved'))
const SettingsPage = lazy(() => import('./pages/Settings'))
const More = lazy(() => import('./pages/More'))
const About = lazy(() => import('./pages/About'))
const Ask = lazy(() => import('./pages/Ask'))
const Names = lazy(() => import('./pages/Names'))
const CalendarPage = lazy(() => import('./pages/Calendar'))
const Insights = lazy(() => import('./pages/Insights'))
const Azkar = lazy(() => import('./pages/Azkar'))
const Hadith = lazy(() => import('./pages/Hadith'))
const Learn = lazy(() => import('./pages/Learn'))
const Ramadan = lazy(() => import('./pages/Ramadan'))
const Zakat = lazy(() => import('./pages/Zakat'))
const Hajj = lazy(() => import('./pages/Hajj'))
const Journal = lazy(() => import('./pages/Journal'))
const Habits = lazy(() => import('./pages/Habits'))
const Kids = lazy(() => import('./pages/Kids'))
const Library = lazy(() => import('./pages/Library'))
const Account = lazy(() => import('./pages/Account'))
const Admin = lazy(() => import('./pages/Admin'))
const Qada = lazy(() => import('./pages/Qada'))
const Hifz = lazy(() => import('./pages/Hifz'))
import { useSettings } from './lib/settings'
import { isRtl } from './lib/i18n'
import { usePrayerNotifications } from './lib/notify'

export default function App() {
  const settings = useSettings()
  const { pathname } = useLocation()

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#08130f' : '#f6f3ec')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  useEffect(() => {
    const el = document.documentElement
    el.dataset.accent = settings.accent
    el.lang = settings.lang
    el.dir = isRtl(settings.lang) ? 'rtl' : 'ltr'
  }, [settings.accent, settings.lang])

  useEffect(() => { if (!pathname.startsWith('/quran/')) window.scrollTo(0, 0) }, [pathname])

  usePrayerNotifications()

  return (
    <Layout>
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quran" element={<SurahList />} />
          <Route path="/quran/:surah" element={<Reader />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/prayer" element={<Prayer />} />
          <Route path="/qibla" element={<QiblaPage />} />
          <Route path="/duas" element={<Duas />} />
          <Route path="/dhikr" element={<DhikrPage />} />
          <Route path="/khatm" element={<Khatm />} />
          <Route path="/qada" element={<Qada />} />
          <Route path="/hifz" element={<Hifz />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/names" element={<Names />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/azkar" element={<Azkar />} />
          <Route path="/hadith" element={<Hadith />} />
          <Route path="/hadith/:collection" element={<Hadith />} />
          <Route path="/hadith/:collection/:section" element={<Hadith />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:course" element={<Learn />} />
          <Route path="/learn/:course/:lesson" element={<Learn />} />
          <Route path="/ramadan" element={<Ramadan />} />
          <Route path="/zakat" element={<Zakat />} />
          <Route path="/hajj" element={<Hajj />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/library" element={<Library />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/more" element={<More />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  )
}
