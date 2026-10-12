// Checks continuous recitation (auto-advance, surah rollover, lock-screen handlers) and the Hifz / Qada pages.
import { chromium } from 'playwright'

const U = process.env.U ?? 'http://localhost:4173'
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
let fail = 0
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) fail++ }

await page.goto(`${U}/quran/112`)
await page.waitForTimeout(2500)
await page.getByRole('button', { name: /Play surah/ }).click()
await page.waitForFunction(() => navigator.mediaSession?.playbackState === 'playing', null, { timeout: 20000 }).catch(() => {})
const handlers = await page.evaluate(() => 'mediaSession' in navigator && navigator.mediaSession.playbackState)
check(handlers === 'playing', `mediaSession playbackState = ${handlers}`)

// Simulate the screen locking: the page goes hidden, then the ayah ends. Playback must move on by itself.
await page.evaluate(() => {
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
})
// Jump to the last ayah of 112 and let it finish naturally → should roll into 113:1.
await page.getByRole('button', { name: 'Next ayah' }).dispatchEvent('click')
await page.getByRole('button', { name: 'Next ayah' }).dispatchEvent('click')
await page.getByRole('button', { name: 'Next ayah' }).dispatchEvent('click')
await page.waitForFunction(() => document.body.innerText.includes('112:4'), null, { timeout: 15000 })
await page.waitForFunction(() => document.body.innerText.includes('113:1'), null, { timeout: 30000 }).then(
  () => check(true, 'rolled from 112:4 into 113:1 on its own while hidden'),
  () => check(false, 'did not continue into the next surah'),
)
const warmed = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => r.name.includes('/113002.mp3')).length)
check(warmed > 0, 'next ayah prefetched')

await page.goto(`${U}/hifz`)
await page.getByRole('button', { name: 'Not started' }).first().click()
await page.getByRole('button', { name: 'Learning', exact: true }).first().click()
check(await page.getByText('Revise next').isVisible(), 'Hifz: memorised surah appears under Revise next')

await page.goto(`${U}/qada`)
await page.getByPlaceholder('Number of days').fill('3')
await page.getByRole('button', { name: 'Add', exact: true }).click()
await page.getByRole('button', { name: 'Made up one Fajr' }).click()
const total = await page.locator('p.text-4xl').innerText()
check(total === '14', `Qada total after 3 days − 1 = ${total}`)
await page.screenshot({ path: process.env.SHOT ?? 'qada.png' })

check(errors.length === 0, `no page errors ${errors.join(' | ')}`)
await browser.close()
process.exit(fail ? 1 : 0)
