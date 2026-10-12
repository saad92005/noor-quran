// Auto method matches an independent source (AlAdhan, Karachi + Hanafi) for Lahore; mosque search + jamaat display.
import { chromium } from 'playwright'

const U = process.env.U ?? 'http://localhost:4173'
let fail = 0
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) fail++ }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Karachi', locale: 'en-GB' })
// An existing user from before this change, still on the old MWL/Shafi defaults.
await ctx.addInitScript(() => {
  if (!localStorage.getItem('sirat-settings')) localStorage.setItem('sirat-settings', JSON.stringify({
    onboarded: true, method: 'MuslimWorldLeague', madhab: 'Shafi', location: { lat: 31.5204, lng: 74.3587, label: 'Lahore, Pakistan' },
  }))
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${U}/prayer`)
await page.waitForSelector('text=Jumuʿah, text=Dhuhr', { timeout: 15000 }).catch(() => {})

const st = await page.evaluate(() => JSON.parse(localStorage.getItem('sirat-settings')))
check(st.method === 'auto' && st.madhab === 'auto', `old defaults migrated to auto (${st.method}/${st.madhab})`)
check(await page.getByText('Auto: University of Islamic Sciences, Karachi').count() > 0, 'Auto resolves to Karachi for Lahore')

const d = new Date()
const ref = await (await fetch(`https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}?latitude=31.5204&longitude=74.3587&method=1&school=1&timezonestring=Asia/Karachi`)).json()
const rows = await page.locator('section.card ul li').allInnerTexts()
const toMin = (t) => { const m = t.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i); let h = +m[1]; if (m[3]) h = (h % 12) + (/pm/i.test(m[3]) ? 12 : 0); return h * 60 + +m[2] }
for (const [i, key] of ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].entries()) {
  const ours = toMin(rows[i].split('\n')[1]), theirs = toMin(ref.data.timings[key])
  check(Math.abs(ours - theirs) <= 2, `${key}: app ${rows[i].split('\n')[1]} vs AlAdhan ${ref.data.timings[key]}`)
}

await page.getByRole('button', { name: 'Find mosques near me' }).click()
const first = page.locator('ul.max-h-80 li button').first()
await first.waitFor({ timeout: 40000 })
const n = await page.locator('ul.max-h-80 li').count()
check(n >= 3, `found ${n} nearby mosques, first: ${(await first.innerText()).replace(/\n/g, ' · ')}`)
await first.click()
await page.getByRole('textbox', { name: 'Fajr' }).fill('+20')
await page.getByRole('textbox', { name: 'Isha' }).fill('21:00')
const shown = await page.locator('section.card ul li').allInnerTexts()
check(/Jamaat/.test(shown[0]), `Fajr row shows jamaat: ${shown[0].replace(/\n/g, ' ')}`)
check(/Jamaat (9:00 pm|21:00)/i.test(shown[5]), `Isha row shows 9:00 pm jamaat: ${shown[5].replace(/\n/g, ' ')}`)
await page.screenshot({ path: process.env.SHOT ?? 'prayer.png', fullPage: false })
await page.locator('section.card ul').first().screenshot({ path: (process.env.SHOT ?? 'prayer.png').replace('.png', '-list.png') })

check(errors.length === 0, `no page errors ${errors.join(' | ')}`)
await browser.close()
process.exit(fail ? 1 : 0)
