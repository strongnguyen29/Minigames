/* Chạy thử toàn bộ app trên 3 khung màn hình, chụp ảnh từng màn vào tests/e2e/shots/.
   Cần Google Chrome đã cài (Playwright dùng channel 'chrome'). Chạy: npm run e2e */
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
import { serve, ROOT } from './serve.mjs';

const SHOTS = path.join(ROOT, 'tests/e2e/shots'); fs.mkdirSync(SHOTS, { recursive: true });
const VIEWS = [['1024x768', 1024, 768], ['1280x800', 1280, 800], ['360x740', 360, 740]];
const KEY = 'be_vui_hoc_toan_v1';
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); };

async function open(browser, url, w, h, saved) {
  /* reducedMotion: các nút bồng bềnh vô hạn thì Playwright không bao giờ thấy nút "đứng yên" để bấm;
     đồng thời kiểm tra luôn chế độ giảm chuyển động */
  const pg = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
  pg.setDefaultTimeout(8000);
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  if (saved) await pg.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', 1); } }, [KEY, JSON.stringify(saved)]);
  await pg.goto(url);
  return { pg, errs };
}
const noHScroll = async (pg, tag) => check(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}: cuộn ngang`);
const mascotIs = async (pg, emo, tag, sel = '#mimg') => {
  const src = await pg.locator(sel).first().getAttribute('src');
  check(src && src.includes(emo), `${tag}: Kuromi phải là ${emo}, đang là ${src}`);
};
const shot = (pg, name) => pg.screenshot({ path: path.join(SHOTS, name + '.png') });
const tap = async (pg, sel) => { await pg.locator(sel).first().click(); await pg.waitForTimeout(350); };

async function run(browser, url, [name, w, h]) {
  const { pg, errs } = await open(browser, url, w, h);
  const step = async (label, fn) => { try { await fn(); } catch (e) { fails.push(`${name} ${label}: ${e.message.split('\n')[0]}`); } };

  await step('mở đầu', async () => {
    await pg.waitForSelector('.splash.ready .start', { timeout: 10000 });
    await shot(pg, `${name}-01-splash`);
    await pg.locator('.splash .start').click();
    await pg.waitForSelector('.wel #nm');
  });
  await step('nhập tên', async () => {
    await pg.fill('#nm', 'Mai'); await pg.locator('.av2').nth(6).click();
    await noHScroll(pg, `${name} nhập tên`); await shot(pg, `${name}-02-welcome`);
    await tap(pg, '#go');
    /* tắt giọng để chạy nhanh (giọng máy trong trình duyệt không có tiếng có thể chậm) */
    await pg.evaluate(() => { S.voice = false; save(); });
  });
  await step('trang chủ', async () => {
    await pg.waitForSelector('.hgrid .gc'); await pg.waitForTimeout(700);
    check(await pg.title() === 'Vương Quốc Vui Vẻ', `${name}: tên app (title) chưa đổi`);
    await noHScroll(pg, `${name} trang chủ`); await shot(pg, `${name}-03-home`);
  });
  await step('màn chơi', async () => {
    await pg.locator('.hgrid .gc').nth(2).click();            // Gộp số
    await pg.waitForSelector('.lvn'); await pg.waitForTimeout(600);
    await tap(pg, '.lvn[data-i="0"]');
    await pg.waitForSelector('.ch'); await pg.waitForTimeout(500);
    const hs = await pg.$$eval('.ch', bs => bs.map(b => b.getBoundingClientRect().height));
    check(hs.every(x => x >= 80), `${name}: nút đáp án thấp hơn 80px (${hs.join(',')})`);
    await noHScroll(pg, `${name} màn chơi`); await shot(pg, `${name}-04-play`);
    const idx = await pg.evaluate(() => P.q.choices.findIndex(c => c.key !== P.q.correct));
    await pg.locator('.ch').nth(idx).click(); await pg.waitForTimeout(200);
    await mascotIs(pg, 'think', `${name} chọn sai`);
    for (let i = 0; i < 8; i++) {
      await pg.waitForFunction(() => P && !P.locked && document.querySelectorAll('.ch').length, null, { timeout: 15000 });
      const k = await pg.evaluate(() => P.q.choices.findIndex(c => c.key === P.q.correct));
      await pg.locator('.ch').nth(k).click(); await pg.waitForTimeout(150);
      if (i === 0) { await mascotIs(pg, 'clap', `${name} chọn đúng`); await shot(pg, `${name}-05-correct`); }
    }
  });
  await step('kết quả', async () => {
    await pg.waitForSelector('.res', { timeout: 20000 }); await pg.waitForTimeout(2600);
    await mascotIs(pg, 'clap', `${name} kết quả 2–3 sao`);
    await noHScroll(pg, `${name} kết quả`); await shot(pg, `${name}-06-result`);
  });
  await step('mở quà', async () => {
    await tap(pg, '#rgift'); await pg.waitForSelector('.gift-ov #gb');
    await mascotIs(pg, 'happy', `${name} mở quà`, '.gift-ov .gmas');
    await tap(pg, '#gb'); await pg.waitForTimeout(600); await shot(pg, `${name}-07-gift`);
    await tap(pg, '#ok');
    await tap(pg, '.res .btn[aria-label="Về nhà"]'); await pg.waitForSelector('.hgrid');
  });
  await step('bộ sưu tập', async () => {
    await pg.locator('.hgrid .gc').last().click(); await pg.waitForSelector('.atab');
    for (const [i, t] of ['stickers', 'wardrobe', 'badges'].entries()) {
      await pg.locator('.atab').nth(i).click(); await pg.waitForTimeout(400);
      await noHScroll(pg, `${name} bộ sưu tập ${t}`); await shot(pg, `${name}-08-album-${t}`);
    }
    await tap(pg, '.ttl .back');
  });
  await step('tiệm', async () => {
    await pg.waitForSelector('.hgrid'); await pg.locator('.hgrid .gc').nth(-2).click();
    await pg.waitForSelector('.shopl'); await pg.waitForTimeout(800);
    await noHScroll(pg, `${name} tiệm`); await shot(pg, `${name}-09-shop`);
    await tap(pg, '.ttl .back');
  });
  await step('cờ caro', async () => {
    await pg.waitForSelector('.hgrid'); await pg.locator('.hgrid .gc').nth(-3).click();
    await pg.waitForSelector('#caro'); await pg.waitForTimeout(500);
    await noHScroll(pg, `${name} caro`); await shot(pg, `${name}-10-caro`);
    await tap(pg, '.ttl .back');
  });
  await step('cài đặt', async () => {
    await pg.waitForSelector('.hgrid'); await tap(pg, '.top .me');
    await noHScroll(pg, `${name} cài đặt`); await shot(pg, `${name}-11-settings`);
    await tap(pg, '#cl');
  });
  await step('mức bị khoá', async () => {
    await pg.locator('.hgrid .gc').nth(0).click(); await pg.waitForSelector('.lvn.lock');
    await pg.locator('.lvn.lock').first().click(); await pg.waitForTimeout(250);
    await mascotIs(pg, 'think', `${name} bấm mức khoá`);
    await noHScroll(pg, `${name} chọn mức`); await shot(pg, `${name}-12-levels`);
  });
  errs.forEach(e => fails.push(`${name} lỗi console: ${e}`));
  await pg.close();
}

/* Dữ liệu cũ (chỉ có nút âm thanh chung, đang tắt) phải được giữ nguyên */
async function oldData(browser, url) {
  const saved = { name: 'Mai', avatar: '🐱', stars: 40, spent: 15, owned: ['fashion/pink-dress'], stickers: ['🐶'], sound: false, best: { 'add-0': 3 }, badges: ['first'] };
  const { pg, errs } = await open(browser, url, 1024, 768, saved);
  try {
    await pg.waitForSelector('.splash.ready .start', { timeout: 10000 }); await pg.locator('.splash .start').click();
    await pg.waitForSelector('.hgrid'); await tap(pg, '.top .me');
    const off = await pg.$$eval('.tg', ts => ts.map(t => t.classList.contains('off')));
    check(off.length === 2 && off.every(Boolean), `dữ liệu cũ: công tắc phải tắt cả hai (${off})`);
    const s = await pg.evaluate(() => [balance(), S.owned.join(), S.stickers.join()]);
    check(s[0] === 25 && s[1] === 'fashion/pink-dress' && s[2] === '🐶', `dữ liệu cũ bị thay đổi: ${s}`);
  } catch (e) { fails.push('dữ liệu cũ: ' + e.message.split('\n')[0]); }
  errs.forEach(e => fails.push(`dữ liệu cũ lỗi console: ${e}`));
  await pg.close();
}

const { srv, url } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
for (const v of VIEWS) await run(browser, url, v);
await oldData(browser, url);
await browser.close(); srv.close();
if (fails.length) { console.log('THẤT BẠI:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`ĐẠT: ${VIEWS.length} khung màn hình + dữ liệu cũ, ảnh ở tests/e2e/shots/`);
