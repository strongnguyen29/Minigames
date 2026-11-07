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

async function open(browser, url, w, h, saved, pre) {
  /* reducedMotion: các nút bồng bềnh vô hạn thì Playwright không bao giờ thấy nút "đứng yên" để bấm;
     đồng thời kiểm tra luôn chế độ giảm chuyển động */
  const pg = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, reducedMotion: 'reduce' });
  pg.setDefaultTimeout(8000);
  const errs = [], reqs = [];
  pg.on('request', r => reqs.push(r.url()));
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  if (saved) await pg.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', 1); } }, [KEY, JSON.stringify(saved)]);
  if (pre) await pg.addInitScript(pre);
  /* kiểm thử không bao giờ chạm Firebase thật: luôn chạy như máy chưa điền cấu hình */
  await pg.route('**/js/firebase-config.js', r => r.fulfill({ contentType: 'application/javascript', body: 'const FIREBASE_CONFIG = null;' }));
  /* nhạc làng Tết ở R2 chỉ cho CORS github.io/localhost:8080: thay bằng file cục bộ, đỡ chạm mạng */
  await pg.route('**/*.r2.dev/**', r => r.fulfill({ contentType: 'audio/mp4', headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(path.join(ROOT, 'audio/music/kuromi-lofi.m4a')) }));
  await pg.goto(url);
  return { pg, errs, reqs };
}
const noHScroll = async (pg, tag) => check(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tag}: cuộn ngang`);
const mascotIs = async (pg, emo, tag, sel = '#mimg') => {
  const src = await pg.locator(sel).first().getAttribute('src');
  check(src && src.includes(emo), `${tag}: Kuromi phải là ${emo}, đang là ${src}`);
};
/* tâm mỗi nút phải bấm trúng chính nút đó (không bị Kuromi hay thứ khác che) */
const notCovered = async (pg, sel, tag) => {
  const bad = await pg.$$eval(sel, els => els.filter(el => {
    el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(hit && (el === hit || el.contains(hit)));
  }).length);
  check(bad === 0, `${tag}: ${bad} nút bị che`);
};
const shot = (pg, name) => pg.screenshot({ path: path.join(SHOTS, name + '.png') });
const tap = async (pg, sel) => { await pg.locator(sel).first().click(); await pg.waitForTimeout(350); };

async function run(browser, url, [name, w, h]) {
  const { pg, errs, reqs } = await open(browser, url, w, h);
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
  await step('làng giáng sinh', async () => {
    await pg.locator('.hgrid .gc', { hasText: 'Làng Giáng Sinh' }).click();
    await pg.waitForSelector('#xgo'); await pg.waitForTimeout(500);
    await notCovered(pg, '#xgo', `${name} làng chọn đồ`); await noHScroll(pg, `${name} làng chọn đồ`);
    await shot(pg, `${name}-xmas-pick`);
    await pg.locator('#xgo').click();
    await pg.waitForSelector('.vil canvas, .xfail', { timeout: 20000 }); await pg.waitForTimeout(1500);
    await shot(pg, `${name}-xmas-village`);
    if (await pg.locator('.vil canvas').count()) {
      await pg.evaluate(() => xmasTalk(Object.keys(xmasPlan(dayStr(new Date())).quiz)[0]));
      await pg.waitForSelector('#xdlg .ch'); await pg.waitForTimeout(500);
      await notCovered(pg, '#xdlg .ch', `${name} đố trong làng`); await noHScroll(pg, `${name} đố trong làng`);
      await shot(pg, `${name}-xmas-quiz`);
    } else fails.push(`${name}: làng 3D không dựng được (hiện .xfail)`);
    await tap(pg, '.ttl .back'); await pg.waitForSelector('.hgrid');
  });
  await step('làng tết', async () => {
    await pg.locator('.hgrid .gc', { hasText: 'Làng Tết' }).click();
    await pg.waitForSelector('#xgo'); await pg.waitForTimeout(500);
    await notCovered(pg, '#xgo', `${name} làng chọn đồ`); await noHScroll(pg, `${name} làng chọn đồ`);
    await shot(pg, `${name}-tet-pick`);
    await pg.locator('#xgo').click();
    await pg.waitForSelector('.vil canvas, .xfail', { timeout: 20000 }); await pg.waitForTimeout(1500);
    await shot(pg, `${name}-tet-village`);
    if (await pg.locator('.vil canvas').count()) {
      await pg.evaluate(() => tetTalk(Object.keys(TET_V.plan(dayStr(new Date())).quiz)[0]));
      await pg.waitForSelector('#xdlg .ch'); await pg.waitForTimeout(500);
      await notCovered(pg, '#xdlg .ch', `${name} đố trong làng`); await noHScroll(pg, `${name} đố trong làng`);
      await shot(pg, `${name}-tet-quiz`);
    } else fails.push(`${name}: làng 3D không dựng được (hiện .xfail)`);
    await tap(pg, '.ttl .back'); await pg.waitForSelector('.hgrid');
  });
  await step('màn chơi', async () => {
    await pg.locator('.hgrid .gc').nth(2).click();            // Gộp số
    await pg.waitForSelector('.lvn'); await pg.waitForTimeout(600);
    await tap(pg, '.lvn[data-i="0"]');
    await pg.waitForSelector('.ch'); await pg.waitForTimeout(500);
    await notCovered(pg, '.ch', `${name} nút đáp án`);
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
    await pg.waitForSelector('.hgrid'); await pg.locator('.hgrid .gc', { hasText: 'Tiệm công chúa' }).click();
    await pg.waitForSelector('.shopl'); await pg.waitForTimeout(800);
    /* cho bé sẵn vài váy (6 váy dạ hội) để kiểm tra cột "Kéo để mặc" không bị Kuromi che */
    await pg.evaluate(() => { S.owned = SHOP_ITEMS.filter(x => x.cat === 'gown').map(x => x.id); save(); shop(true); });
    await pg.waitForTimeout(400);
    await notCovered(pg, '.thumb.drag', `${name} váy của bé`);
    await noHScroll(pg, `${name} tiệm`); await shot(pg, `${name}-09-shop`);
    await tap(pg, '.ttl .back');
  });
  await step('tiệm âm thanh', async () => {
    await pg.waitForSelector('.hgrid'); await pg.locator('.hgrid .gc', { hasText: 'Tiệm âm thanh' }).click();
    await pg.waitForSelector('.rbar'); await pg.waitForTimeout(600);
    await notCovered(pg, '.ritem, .rbar button', `${name} tiệm âm thanh`);
    await noHScroll(pg, `${name} tiệm âm thanh`); await shot(pg, `${name}-09b-radio`);
    await tap(pg, '.ttl .back');
  });
  await step('công chúa chăm ngoan', async () => {
    await pg.waitForSelector('.hgrid'); await pg.locator('.hgrid .gc', { hasText: 'Công chúa chăm ngoan' }).click();
    await pg.waitForSelector('.chlist .crow'); await pg.waitForTimeout(500);
    const coin = async () => +(await pg.locator('.ttl .coin').innerText()).replace(/\D/g, '');
    const before = await coin();
    await tap(pg, '.crow .ctag.btn');                          // "Con xong rồi!" của việc đầu tiên
    await tap(pg, '.crow .ctag.wait');                         // "⏳ Chờ bố mẹ"
    await tap(pg, '.modal .rst[data-n="5"]'); await tap(pg, '#rok');
    await pg.waitForSelector('.modal #lq');
    await noHScroll(pg, `${name} câu khoá`); await shot(pg, `chores-lock-${name}`);
    /* đọc phép tính trên màn, tự tính đáp án rồi bấm phím */
    const q = (await pg.locator('#lq').innerText()).replace('= ?', '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const ans = Function(`return (${q})`)();
    for (const d of String(ans)) await pg.locator('.lkey').filter({ hasText: new RegExp(`^${d}$`) }).click();
    await tap(pg, '.lkey.ok'); await pg.waitForTimeout(300);
    check(await coin() === before + 5, `${name} chăm ngoan: số sao phải tăng 5 (${before} → ${await coin()})`);
    check(await pg.locator('.ttl .plock').count() === 1, `${name} chăm ngoan: thiếu nút 🔓 khi đang mở chế độ bố mẹ`);
    await notCovered(pg, '.crow .ctag.btn', `${name} chăm ngoan`);
    await noHScroll(pg, `${name} chăm ngoan`); await shot(pg, `chores-${name}`);
    await tap(pg, '.ttl .back');
  });
  await step('cờ caro', async () => {
    await pg.waitForSelector('.hgrid'); await pg.locator('.hgrid .gc', { hasText: 'Cờ caro' }).click();
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
  const ext = reqs.filter(u => /gstatic\.com|googleapis\.com/.test(u));
  check(ext.length === 0, `${name}: không đặt adapter mà vẫn gọi ra ngoài: ${ext.join(', ')}`);
  await pg.close();
}

/* Adapter giả cho trình duyệt: đăng nhập là thành công ngay; fail=true thì get/set luôn lỗi */
const fakeAdapter = (db, fail, signed) => `(() => {
  let cb, user = ${signed} ? { uid: 'u1', email: 'mai@mail.com' } : null; const db = ${JSON.stringify(db)};
  window.CLOUD_ADAPTER = {
    onAuth(c) { cb = c; c(user); },
    signIn() { user = { uid: 'u1', email: 'mai@mail.com' }; cb && cb(user); return Promise.resolve(); },
    signOut() { user = null; cb && cb(null); return Promise.resolve(); },
    get() { return ${fail} ? Promise.reject(new Error('mất mạng')) : Promise.resolve(db); },
    set() { return ${fail} ? Promise.reject(new Error('mất mạng')) : Promise.resolve(); }
  };
  if (${fail}) localStorage.getItem('be_vui_cloud_v1') || localStorage.setItem('be_vui_cloud_v1', '{"used":true}');
})();`;

/* Máy mới, mây đã có tiến độ: màn nhập tên → "Đã có tiến độ?" → thẳng trang chủ */
async function restore(browser, url, [name, w, h]) {
  const cloudSave = { name: 'Mai', avatar: '🐱', stars: 40, schema: 1, deviceId: 'khac' };
  const { pg, errs } = await open(browser, url, w, h, null, fakeAdapter(cloudSave, false));
  const tag = `lấy lại ${name}`;
  try {
    await pg.waitForSelector('.splash.ready .start', { timeout: 10000 }); await pg.locator('.splash .start').click();
    await pg.waitForSelector('#cget'); await pg.waitForSelector('.splash', { state: 'detached' }); await pg.waitForTimeout(900);
    check(await pg.locator('#cget').innerText() === 'Đã có tiến độ? Đăng nhập để lấy lại', `${tag}: chữ nút`);
    await noHScroll(pg, `${tag} nhập tên`); await notCovered(pg, '#cget, #go', `${tag} nhập tên`);
    await shot(pg, `${name}-09-welcome-cloud`);
    await pg.locator('#cget').click();
    await pg.waitForSelector('.hgrid');
    const top = await pg.locator('.top').innerText();
    check(/40/.test(top), `${tag}: thanh trên phải có 40 sao, đang là "${top.replace(/\n/g, ' ')}"`);
    await pg.waitForTimeout(500); await tap(pg, '.top .me'); await pg.waitForSelector('#csy');
    const box = await pg.locator('#cloud').innerText();
    check(/Đã sao lưu lúc \d\d:\d\d/.test(box) && box.includes('Đồng bộ ngay') && box.includes('Đăng xuất'), `${tag}: khối Sao lưu "${box}"`);
    await noHScroll(pg, `${tag} cài đặt`); await notCovered(pg, '#cloud .btn, #chg, #rst, #cl', `${tag} cài đặt`);
    await shot(pg, `${name}-09-settings-cloud`);
  } catch (e) { fails.push(`${tag}: ` + e.message.split('\n')[0]); }
  errs.forEach(e => fails.push(`${tag} lỗi console: ${e}`));
  await pg.close();
}

/* Mây lỗi (get/set luôn reject): chơi bình thường, không lỗi console, Cài đặt báo chưa sao lưu được */
async function cloudDown(browser, url) {
  const saved = { name: 'Mai', avatar: '🐱', stars: 3 };
  const { pg, errs } = await open(browser, url, 1024, 768, saved, fakeAdapter({}, true, true));
  try {
    await pg.waitForSelector('.splash.ready .start', { timeout: 10000 }); await pg.locator('.splash .start').click();
    await pg.waitForSelector('.hgrid'); await pg.evaluate(() => { S.voice = false; save(); });
    await pg.locator('.hgrid .gc').nth(2).click(); await pg.waitForSelector('.lvn'); await pg.waitForTimeout(600);
    await tap(pg, '.lvn[data-i="0"]'); await pg.waitForSelector('.ch'); await pg.waitForTimeout(400);
    const k = await pg.evaluate(() => P.q.choices.findIndex(c => c.key === P.q.correct));
    await pg.locator('.ch').nth(k).click(); await pg.waitForTimeout(3600);
    await pg.evaluate(() => go(home)); await pg.waitForSelector('.hgrid'); await tap(pg, '.top .me');
    await pg.waitForSelector('#cloud');
    const box = await pg.locator('#cloud').innerText();
    check(box.includes('Chưa sao lưu được, sẽ thử lại khi có mạng'), `mây lỗi: Cài đặt phải báo lỗi, đang là "${box}"`);
  } catch (e) { fails.push('mây lỗi: ' + e.message.split('\n')[0]); }
  errs.forEach(e => fails.push(`mây lỗi, lỗi console: ${e}`));
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
    check(off.length === 3 && off.every(Boolean), `dữ liệu cũ: công tắc phải tắt cả ba (${off})`);
    const s = await pg.evaluate(() => [balance(), S.owned.join(), S.stickers.join()]);
    check(s[0] === 25 && s[1] === 'fashion/pink-dress' && s[2] === '🐶', `dữ liệu cũ bị thay đổi: ${s}`);
  } catch (e) { fails.push('dữ liệu cũ: ' + e.message.split('\n')[0]); }
  errs.forEach(e => fails.push(`dữ liệu cũ lỗi console: ${e}`));
  await pg.close();
}

/* Ép hỏng WebGL: vào làng phải thấy màn dự phòng .xfail, không lỗi console, nút về nhà vẫn chạy */
async function noWebgl(browser, url) {
  const saved = { name: 'Mai', avatar: '🐱', stars: 3 };
  const { pg, errs } = await open(browser, url, 1024, 768, saved, 'HTMLCanvasElement.prototype.getContext=function(){return null}');
  try {
    await pg.waitForSelector('.splash.ready .start', { timeout: 10000 }); await pg.locator('.splash .start').click();
    await pg.waitForSelector('.hgrid'); await pg.evaluate(() => { S.voice = false; save(); });
    await pg.locator('.hgrid .gc', { hasText: 'Làng Giáng Sinh' }).click();
    await pg.waitForSelector('#xgo'); await pg.locator('#xgo').click();
    await pg.waitForSelector('.xfail', { timeout: 20000 });
    await noHScroll(pg, 'làng không WebGL'); await shot(pg, '1024x768-xmas-nowebgl');
    await tap(pg, '.ttl .back'); await pg.waitForSelector('.hgrid');
  } catch (e) { fails.push('làng không WebGL: ' + e.message.split('\n')[0]); }
  errs.forEach(e => fails.push(`làng không WebGL, lỗi console: ${e}`));
  await pg.close();
}

const { srv, url } = await serve();
const browser = await chromium.launch({ channel: 'chrome' });
for (const v of VIEWS) await run(browser, url, v);
await oldData(browser, url);
for (const v of [VIEWS[0], VIEWS[2]]) await restore(browser, url, v);
await cloudDown(browser, url);
await noWebgl(browser, url);
await browser.close(); srv.close();
if (fails.length) { console.log('THẤT BẠI:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`ĐẠT: ${VIEWS.length} khung màn hình + dữ liệu cũ, ảnh ở tests/e2e/shots/`);
