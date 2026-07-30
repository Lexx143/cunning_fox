// Скриншоты для Google Play: эмуляция телефона и планшета
import { chromium, devices } from 'playwright';

const OUT = 'resources/screenshots';
const BASE = 'http://localhost:8791';
const phone = devices['Pixel 7'];
const tablet = { viewport: { width: 800, height: 1280 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const shots = [
    { dev: phone,  name: 'phone-ru-board',    q: 'shot=board&lang=ru' },
    { dev: phone,  name: 'phone-ru-suspects', q: 'shot=suspects&lang=ru' },
    { dev: phone,  name: 'phone-ru-dice',     q: 'shot=dice&lang=ru' },
    { dev: phone,  name: 'phone-ru-decoder',  q: 'shot=decoder&lang=ru' },
    { dev: phone,  name: 'phone-en-board',    q: 'shot=board&lang=en' },
    { dev: phone,  name: 'phone-en-suspects', q: 'shot=suspects&lang=en' },
    { dev: tablet, name: 'tablet-ru-board',    q: 'shot=board&lang=ru' },
    { dev: tablet, name: 'tablet-ru-suspects', q: 'shot=suspects&lang=ru' },
];

const browser = await chromium.launch();
for (const s of shots) {
    const ctx = await browser.newContext({ ...s.dev, locale: 'ru-RU' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?${s.q}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3500); // preload + анимации (лупа и т.п.)
    await page.screenshot({ path: `${OUT}/${s.name}.png` });
    console.log('shot', s.name);
    await ctx.close();
}
await browser.close();
