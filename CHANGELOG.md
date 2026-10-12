# Changelog

Notable changes to Sirat Path. Dates are deployment dates; each push to `main` deploys to production.

## 2026-10-12
### Fixed
- **Prayer times now match local timetables by default.** A new **Auto** setting picks the calculation method and Asr rule used in the user's region (e.g. Karachi + Hanafi in Pakistan and India, Umm al-Qura in Saudi Arabia, ISNA in North America). Users still on the old Muslim World League / Shafi defaults are moved to Auto; manual choices are kept. Checked against AlAdhan for Lahore: every time within 1 minute.
- High-latitude rule applied automatically, so Fajr and Isha stay sensible in northern summers (e.g. the UK).
### Added
- **My mosque:** find nearby mosques (OpenStreetMap; the location is sent only on tap), pick one or add yours by name, and enter its jamaat times as fixed times or "+N minutes after adhan", including Jumuʿah. Jamaat times show beside each prayer, and adhan times can be calculated at the mosque's exact location.
- **Background recitation:** Quran audio keeps playing with the screen locked. Lock-screen and headphone controls (play, pause, next, previous) work, the next two ayahs are preloaded, and playback continues into the next surah (switchable in Settings → Recitation). The sleep timer also stops playback while the screen is locked.
- **Hifz Tracker** (`/hifz`): mark surahs as learning or memorised, with a "revise next" list ordered by the longest time since revision.
- **Qada Tracker** (`/qada`): a count of missed prayers per salah, plus "add whole days". Witr is included for the Hanafi madhab.
- **Jumuʿah reminder** on Home on Fridays: read Surah al-Kahf (al-Hakim, al-Bayhaqi; sahih per al-Albani).

## 2026-10-10
### Added
- **Urdu hadith translations** with an English / اردو / Both switch for Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasaʾi, Ibn Majah and Muwatta. Included in offline downloads.
- Project documentation: PRD, SRS, design, data model, deployment, privacy policy, terms of use, security policy, test plan, project report, `CLAUDE.md`, license.
### Changed
- Content review: the Duas icon is now raised open palms (🤲) instead of folded "praying hands"; the Kids icon and the family emoji no longer show faces of people.
- 99 Names: paired names (e.g. Ad-Ḍārr with An-Nāfiʿ, Al-Muʿizz with Al-Mudhill) are shown together on the Home card, and flashcards note the pairing. Al-Majīd and Al-Mājid are now spelled distinctly.
### Fixed
- **Sunan an-Nasaʾi and Ibn Majah failed to load**, because jsDelivr returned 403 for that package. Hadith now fall back to the GitHub mirror.

## 2026-10-08
### Added
- English / Urdu / Both / Off translation switch in the Quran reader, with a choice of Urdu translator.
- Prominent green WhatsApp share buttons on ayahs, hadith, duas and Home. Bigger action icons.
- SEO: per-page titles and descriptions, Open Graph and Twitter previews, JSON-LD, `sitemap.xml`, `robots.txt`.
- Install banner (Android prompt and iOS steps) with a share invitation.
- Vercel Web Analytics.
- Automatic cloud sync (start, focus, reconnect, periodic, after edits).
### Fixed
- Blank white screen after returning from WhatsApp. WhatsApp now opens directly through the app scheme instead of leaving a wa.me tab behind.
- Overflow of dua actions on narrow screens. Responsive fixes on prayer reminders, Qibla and Ask.

## 2026-10-07
### Added
- Offline download manager for hadith collections, translations and recitation packs. Persistent storage, plus offline fallbacks for Ask, Hadith and the Qibla map.
- Qibla: true-north correction (WMM 2025), tilt and rotation compensation, turn guidance, and a great-circle map.
- New app icon; 3D feature icons (Fluent Emoji, MIT).
### Fixed
- Sheets clipped inside cards (they now render through a portal).
- Supabase table grants for the `authenticated` role.

## 2026-10-06
### Added
- First release: offline-first Quran PWA (reader, audio, search, prayer times, Qibla, duas, dhikr, khatm).
- Today dashboard, three themes, Salah tracker, azkar, sourced duas, hadith, Learn, Ramadan, Zakat, Hajj, journal, habits, kids mode, library, and English/Urdu/Arabic UI with RTL.
- Study tools: tajweed, word-by-word, tafsir, Urdu translations.
- Ask Islam with citation validation; cloud AI through a secure Groq proxy; optional on-device AI.
- Optional Supabase accounts and sync, plus an admin review queue.
- Automatic service-worker updates for installed apps.
- Project renamed from "Noor" to **Sirat Path**.
