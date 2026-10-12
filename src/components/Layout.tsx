import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  BarChart3, BookHeart, Brain, History, BookMarked, BookOpen, CalendarDays, Clock, Compass, Download, GraduationCap, HandCoins, HandHeart,
  Home, Info, LayoutGrid, Library, ListChecks, MessageCircleQuestion, Moon, NotebookPen, Plane, ScrollText, Search,
  Settings, Smile, Sparkles, Star, Sun, Target, WifiOff, UserRound,
} from 'lucide-react'
import AudioBar from './AudioBar'
import Logo from './Logo'
const CommandPalette = lazy(() => import('./CommandPalette'))
import { setSettings, useSettings } from '../lib/settings'
import { fmtTime, nextPrayer, PRAYER_LABEL } from '../lib/prayer'
import { useInstall } from '../lib/install'
import { useRouteMeta } from '../lib/seo'
import { useOnline } from '../lib/online'
import { useT, type StrKey } from '../lib/i18n'

type NavItem = { to: string; k: StrKey; icon: typeof Home; end?: boolean }

const MOBILE_NAV: NavItem[] = [
  { to: '/', k: 'home', icon: Home, end: true },
  { to: '/quran', k: 'quran', icon: BookOpen },
  { to: '/prayer', k: 'salah', icon: Clock },
  { to: '/duas', k: 'duas', icon: HandHeart },
  { to: '/more', k: 'more', icon: LayoutGrid },
]

export const SIDEBAR: { group: StrKey; items: NavItem[] }[] = [
  { group: 'read', items: [
    { to: '/', k: 'home', icon: Home, end: true },
    { to: '/quran', k: 'quran', icon: BookOpen },
    { to: '/hadith', k: 'hadith', icon: ScrollText },
    { to: '/ask', k: 'ask', icon: MessageCircleQuestion },
    { to: '/search', k: 'search', icon: Search },
  ] },
  { group: 'worship', items: [
    { to: '/prayer', k: 'salah', icon: Clock },
    { to: '/duas', k: 'duas', icon: HandHeart },
    { to: '/azkar', k: 'azkar', icon: BookHeart },
    { to: '/dhikr', k: 'dhikr', icon: Sparkles },
    { to: '/qibla', k: 'qibla', icon: Compass },
    { to: '/qada', k: 'qada', icon: History },
    { to: '/ramadan', k: 'ramadan', icon: Moon },
    { to: '/hajj', k: 'hajj', icon: Plane },
    { to: '/zakat', k: 'zakat', icon: HandCoins },
  ] },
  { group: 'grow', items: [
    { to: '/learn', k: 'learn', icon: GraduationCap },
    { to: '/names', k: 'names', icon: Star },
    { to: '/habits', k: 'habits', icon: ListChecks },
    { to: '/journal', k: 'journal', icon: NotebookPen },
    { to: '/khatm', k: 'khatm', icon: Target },
    { to: '/hifz', k: 'hifz', icon: Brain },
    { to: '/insights', k: 'insights', icon: BarChart3 },
    { to: '/calendar', k: 'calendar', icon: CalendarDays },
    { to: '/kids', k: 'kids', icon: Smile },
    { to: '/library', k: 'library', icon: Library },
    { to: '/saved', k: 'saved', icon: BookMarked },
  ] },
  { group: 'app', items: [
    { to: '/account', k: 'account', icon: UserRound },
    { to: '/settings', k: 'settings', icon: Settings },
    { to: '/about', k: 'sources', icon: Info },
  ] },
]

function useMinuteNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id) }, [])
  return now
}

export default function Layout({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState(false)
  const settings = useSettings()
  const t = useT()
  const now = useMinuteNow()
  const next = nextPrayer(settings, now)
  const install = useInstall()
  const online = useOnline()
  const { pathname } = useLocation()
  useRouteMeta(pathname)
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); setPalette(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh md:ps-64">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col border-e border-line bg-surface/70 backdrop-blur-xl md:flex">
        <Link to="/" className="flex h-[72px] items-center gap-2.5 px-5"><Logo size={34} /><span className="leading-tight"><span className="block text-lg font-bold">Sirat Path</span><span className="block text-[11px] text-muted">{t('tagline')}</span></span></Link>
        <button onClick={() => setPalette(true)} className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-muted transition hover:border-brand">
          <Search size={15} /> {t('search')}… <kbd className="ms-auto rounded border border-line px-1.5 text-[10px]">Ctrl K</kbd>
        </button>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2" aria-label="Sidebar">
          {SIDEBAR.map((g) => (
            <div key={g.group}>
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted/70">{t(g.group)}</p>
              {g.items.map(({ to, k, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-[7px] text-sm transition ${isActive ? 'bg-brand text-brand-ink font-semibold shadow-sm' : 'text-muted hover:bg-surface-2 hover:text-ink'}`}>
                  <Icon size={17} />{t(k)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line p-4">
          {next && (
            <Link to="/prayer" className="hero pattern block rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-wider text-accent">{t('nextPrayer')} · {PRAYER_LABEL[next.name]}</p>
              <p className="text-xl font-bold tabular-nums">{fmtTime(next.at)}</p>
            </Link>
          )}
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 px-2" onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? 'Light' : 'Dark'}
            </button>
            {install && <button className="btn flex-1 px-2" onClick={install}><Download size={16} />Install</button>}
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold"><Logo /> Sirat Path</Link>
          {install && <button className="chip ms-3 text-brand" onClick={install}><Download size={12} />Install</button>}
          <button className="icon-btn ms-auto" onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })} aria-label="Toggle theme">
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button className="icon-btn" onClick={() => setPalette(true)} aria-label={t('search')}><Search size={20} /></button>
        </div>
      </header>

      {!online && (
        <div role="status" className="sticky top-14 z-20 flex items-center justify-center gap-2 bg-gold/15 px-4 py-1.5 text-xs font-medium text-gold md:top-0">
          <WifiOff size={13} />{t('offline')}
        </div>
      )}

      <main key={pathname} className="page-in mx-auto max-w-6xl px-4 pb-40 pt-5 md:px-8 md:pb-28 md:pt-8">{children}</main>

      <AudioBar />
      {palette && <Suspense fallback={null}><CommandPalette onClose={() => setPalette(false)} /></Suspense>}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Primary">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map(({ to, k, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] transition active:scale-90 ${isActive ? 'text-brand font-semibold' : 'text-muted'}`}>
              {({ isActive }) => (<>
                <span className={`grid h-7 w-12 place-items-center rounded-full transition ${isActive ? 'bg-brand/15' : ''}`}><Icon size={20} /></span>{t(k)}
              </>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
