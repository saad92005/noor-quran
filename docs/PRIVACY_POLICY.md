# Privacy Policy

**Effective date:** 10 October 2026
**App:** Sirat Path (https://siratpath.vercel.app)

Sirat Path is a free Islamic companion app. It's built to collect as little as possible: most of what you do in the app never leaves your device. This policy explains exactly what is collected, why, and what choices you have.

## 1. The short version

- **No account is needed.** In guest mode, your bookmarks, notes, prayer log, journal, habits and settings stay only on your device.
- **No ads, and your data is never sold or shared for marketing.**
- **We use privacy-friendly, cookie-free visit statistics** (Vercel Web Analytics) to count page views.
- **If you create an account,** your app data is stored in our database so it can sync between your devices. You can delete your account at any time.

## 2. Information stored only on your device

Unless you sign in, this information is stored only in your browser's storage (IndexedDB and localStorage) and is never sent to us:

- Quran bookmarks, notes, reading progress and Khatm plans
- Prayer tracker, azkar, tasbih counts, habits, Ramadan tracker and Learn progress
- **Your private journal**
- App settings, including **your location** (used only to calculate prayer times and the Qibla on your device)

Clearing your browser data or uninstalling the app deletes it. Use **Settings → Your data → Export** to export a copy first.

## 3. Information we collect

| What | When | Why | Where it's stored |
|---|---|---|---|
| **Anonymous visit statistics:** page viewed, referring site, country, browser, OS and device type | Every visit | To understand which features are used and how people find the app | Vercel Web Analytics. It uses no cookies and doesn't identify you across sites |
| **Account details:** email address and, with Google sign-in, your name and Google account ID | Only if you create an account | To sign you in | Supabase (our database provider) |
| **Synced app data:** everything listed in section 2, *including your journal and the location in your settings* | Only while you're signed in | So your data is the same on every device | Supabase, protected so only your account can read it (Row Level Security) |
| **Content reports:** the item you report and your message | Only if you submit a report | So an admin can correct errors in duas and hadith | Supabase; visible to you and the app's administrators |
| **Ask Islam questions:** the question you type and the Quran references found for it | Only when you use Ask in Cloud mode | To generate an answer from those verses | Sent through our server to Groq, the AI provider. We don't store questions. Groq handles them under its own policy. Personal data such as your journal is **never** sent |

Ask Islam also has an **On-device** mode. In that mode, questions are processed entirely in your browser and nothing is sent.

## 4. Content loaded from other services

To keep the app small, some content is downloaded only when you open it. Like any website, these services receive your IP address and a standard browser request. They don't receive any of your personal app data.

| Service | Content |
|---|---|
| quran.com API | Urdu translations, tafsir, word-by-word, tajweed |
| jsDelivr and GitHub (raw.githubusercontent.com) | Hadith collections |
| EveryAyah.com | Quran recitation audio |
| OpenStreetMap | Map tiles on the Qibla map |
| Wikimedia Commons | Adhan audio |
| Google | Google sign-in, only if you choose it |

## 5. Permissions

The app asks for these permissions, and only when you use the feature:

- **Location:** for prayer times and Qibla. You can choose a city instead.
- **Mosque search (optional):** when you tap "Find mosques near me" on the Salah page, your current point is sent to OpenStreetMap services (Overpass / Nominatim) to list nearby mosques. Nothing is sent unless you tap it.
- **Notifications:** for prayer reminders.
- **Motion and orientation sensors:** for the Qibla compass.

You can turn any of these off in your browser or phone settings.

## 6. How long we keep data

- **Synced data and account details:** kept until you delete your account.
- **Content reports:** kept until they're resolved, then removed or kept for correction records. They are disconnected from you if you delete your account.
- **Analytics:** aggregated and kept under Vercel's retention period.

## 7. Your choices and rights

- **Use guest mode.** No account means nothing is stored on our servers.
- **Export** your data at any time from Settings → Your data → Export.
- **Delete your account** from the Account page. This permanently deletes your account and all synced data from our database.
- **Correct or access** your data. You can see all of it inside the app. For anything else, contact us (section 10).

## 8. Security

We use HTTPS everywhere and database-level access rules, so each account can read only its own rows. Server keys are never placed in the app. No system is perfectly secure, so please keep your password private. See [SECURITY.md](SECURITY.md) for technical details.

## 9. Children

Sirat Path includes a Kids mode for use with a parent. Children should not create an account without a parent's or guardian's permission. We don't knowingly collect personal information from children under 13. If you believe a child has created an account, contact us and we'll delete it.

## 10. Contact and changes

For questions or deletion requests, open an issue at https://github.com/saad92005/sirat-path/issues or use the Report button in the app.

If this policy changes, we'll update the effective date above. Significant changes will be announced in the app.
