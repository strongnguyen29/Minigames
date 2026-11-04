const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame, fakeEl } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/scene.js','js/mascot.js','js/shop.js','js/chat.js','js/chat-ui.js','js/firebase-config.js','js/sync.js','js/ui.js','js/pattern.js'];
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r)); };

/* Hẹn giờ giả + giọng giả: done của mỗi câu resolve sau voiceMs (Infinity = không bao giờ) */
function setup({ voiceMs = 100 } = {}) {
  let now = 0, timers = [], seq = 0;
  const st = (f, ms = 0) => { const id = ++seq; timers.push({ id, at: now + (ms || 0), f }); return id; };
  const ct = id => { timers = timers.filter(t => t.id !== id); };
  const g = loadGame(FILES, { setTimeout: st, clearTimeout: ct, storage: { be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai' }) } });
  const calls = [];
  g.ctx.__calls = calls;
  let pending = null;
  const delay = () => { pending && pending(false); return new Promise(r => { pending = r; if (voiceMs !== Infinity) st(() => { if (pending === r) { pending = null; r(true); } }, voiceMs); }); };
  g.ctx.__delay = delay;
  g.ctx.__stop = () => { const p = pending; pending = null; p && p(false); };
  g.run(`voice.line=grp=>{__calls.push(['line',grp]);const l=LINES[grp][0];return{line:l,done:__delay()}};
         voice.text=t=>{__calls.push(['text',t]);return __delay()};voice.stop=()=>{__calls.push(['stop']);__stop()};voice.busy=()=>false;`);
  /* nút đáp án giả, tạo lại cho mỗi câu hỏi */
  let btns = [], forQ = null;
  const app = g.get('app');
  app.querySelectorAll = s => {
    if (s !== '.ch') return [];
    const q = g.get('P&&P.q');
    if (q && q !== forQ) { forQ = q; btns = q.choices.map((c, i) => { const b = fakeEl('button'); b.dataset.i = String(i); return b; }); }
    return btns;
  };
  const tick = async ms => {
    const end = now + ms;
    for (;;) { timers.sort((a, b) => a.at - b.at); const t = timers[0]; if (!t || t.at > end) break; timers.shift(); now = t.at; t.f(); await flush(); }
    now = end; await flush();
  };
  const q = () => g.get('P&&P.q');
  const correctBtn = () => btns.find(b => q().choices[+b.dataset.i].key === q().correct);
  const wrongBtn = (k = 0) => btns.filter(b => q().choices[+b.dataset.i].key !== q().correct)[k];
  const img = g.ctx.document.querySelector('#mimg');
  return { g, calls, tick, q, correctBtn, wrongBtn, img, btns: () => btns };
}

test('bấm đáp án đúng hai lần chỉ tăng P.i một lần', async () => {
  const s = setup(); s.g.run("start('add',0)"); await s.tick(4000);
  const b = s.correctBtn(); b.onclick(); b.onclick(); await flush();
  assert.equal(s.g.get('P.i'), 1);
});
test('đúng thì Kuromi chuyển clap; câu sau đến khi câu khen xong nhưng không sớm hơn 950ms', async () => {
  const s = setup({ voiceMs: 100 }); s.g.run("start('add',0)"); await s.tick(4000);
  const q0 = s.q(); s.correctBtn().onclick(); await flush();
  assert.match(s.img.src, /clap/);
  assert.ok(s.calls.some(c => c[0] === 'line' && (c[1] === 'correct' || c[1] === 'combo')));
  await s.tick(900); assert.equal(s.q(), q0);
  await s.tick(100); assert.notEqual(s.q(), q0);
});
test('có explain thì đọc explain sau câu khen; giọng treo thì tối đa 6000ms mới sang câu sau', async () => {
  const s = setup({ voiceMs: Infinity }); s.g.run("start('count',1)"); await s.tick(4000);
  const q0 = s.q(); assert.ok(q0.explain); s.correctBtn().onclick(); await flush();
  await s.tick(5900); assert.equal(s.q(), q0);
  await s.tick(200); assert.notEqual(s.q(), q0);
});
test('explain được đọc bằng voice.text ngay sau câu khen', async () => {
  const s = setup({ voiceMs: 100 }); s.g.run("start('count',1)"); await s.tick(4000);
  const q0 = s.q(); s.correctBtn().onclick(); await s.tick(150);
  assert.ok(s.calls.some(c => c[0] === 'text' && c[1] === q0.explain));
});
test('sai lần 1: think + nhóm wrong; sai lần 2: nhóm hint + nút đúng có lớp hint', async () => {
  const s = setup(); s.g.run("start('add',1)"); await s.tick(4000);
  s.wrongBtn(0).onclick(); await flush();
  assert.match(s.img.src, /think/); assert.deepEqual([...s.calls.filter(c => c[0] === 'line').pop()], ['line','wrong']);
  s.wrongBtn(1).onclick(); await flush();
  assert.deepEqual([...s.calls.filter(c => c[0] === 'line').pop()], ['line','hint']);
  assert.ok(s.correctBtn().classList.contains('hint'));
});
test('bấm đáp án khi đang đọc đề thì gọi voice.stop trước khi phản ứng', async () => {
  const s = setup({ voiceMs: Infinity }); s.g.run("start('add',0)"); await s.tick(3500);
  s.calls.length = 0; s.wrongBtn(0).onclick();
  assert.deepEqual([...s.calls[0]], ['stop']);
});
test('mọi đề đều được đọc, kể cả câu chỉ có prompt (không có say)', async () => {
  const s = setup(); s.g.run("start('shape',0)");
  for (let i = 0; i < 6; i++) { await s.tick(4000); const q = s.q(); assert.ok(s.calls.some(c => c[0] === 'text' && c[1] === (q.say || q.prompt)), q.prompt); s.correctBtn().onclick(); }
});
test('rời màn (P=null) trong lúc chờ thì câu cũ không vẽ lại màn chơi', async () => {
  const s = setup({ voiceMs: 100 }); s.g.run("start('add',0)"); await s.tick(4000);
  s.correctBtn().onclick(); await flush();
  s.g.run('P=null'); const html = s.g.get('app.innerHTML');
  await s.tick(7000);
  assert.equal(s.g.get('P'), null); assert.equal(s.g.get('app.innerHTML'), html);
});

test('bấm đáp án trong lúc Kuromi nói câu mở màn thì không đọc lại đề đã trả lời', async () => {
  const s = setup({ voiceMs: 2000 }); s.g.run("start('add',0)"); await s.tick(500);
  const q0 = s.q(); s.correctBtn().onclick(); await s.tick(100);
  assert.ok(!s.calls.some(c => c[0] === 'text' && c[1] === (q0.say || q0.prompt)), 'đề đã trả lời bị đọc lại');
});
test('câu khen bị ngắt (bấm 🔊) thì không đọc tiếp dòng giải thích', async () => {
  const s = setup({ voiceMs: 500 }); s.g.run("start('count',1)"); await s.tick(4000);
  const q0 = s.q(); s.correctBtn().onclick(); await s.tick(100);
  s.g.run("say(P.q.say||P.q.prompt)"); await s.tick(100);
  assert.ok(!s.calls.some(c => c[0] === 'text' && c[1] === q0.explain));
});
test('kết quả: mở quà ngắt câu kết quả thì không phát câu huy hiệu đè lên', async () => {
  const s = setup({ voiceMs: 500 });
  s.g.run("P={g:'add',l:0,i:8,total:8,mistakes:0,seen:new Set(),token:0};S.badges=[];finish()"); await s.tick(100);
  s.g.run("openGift(()=>{})"); await s.tick(2000);
  assert.ok(!s.calls.some(c => c[0] === 'line' && c[1] === 'badge'));
});
test('kết quả: câu kết quả xong tự nhiên thì có huy hiệu mới được đọc', async () => {
  const s = setup({ voiceMs: 500 });
  s.g.run("P={g:'add',l:0,i:8,total:8,mistakes:0,seen:new Set(),token:0};S.badges=[];finish()"); await s.tick(2000);
  assert.ok(s.calls.some(c => c[0] === 'line' && c[1] === 'badge'));
});
test('nút ⬅️ của màn chơi ghi sẵn mã trò, không phụ thuộc P lúc bấm', async () => {
  const s = setup(); s.g.run("start('add',0)"); await s.tick(100);
  assert.match(s.g.get('app.innerHTML'), /levels\('add'\)/);
});
/* lớp phủ mở quà cần querySelector('.gbox') trả về phần tử */
const GIFT_DOM = "document.createElement=t=>{const e=fakeEl(t);e.querySelector=()=>fakeEl();return e}";
test('lần đầu 3 sao: hộp quà may mắn, màn 1 có 30% ra váy chưa có (không trừ sao)', async () => {
  const s = setup(); s.g.run(GIFT_DOM);
  s.g.run("P={g:'add',l:0,i:8,total:8,mistakes:0,seen:new Set(),token:0};finish()");
  assert.deepEqual([...s.g.get('S.luckyGifts')], [0]);
  s.g.run("P={g:'add',l:0,i:8,total:8,mistakes:0,seen:new Set(),token:0};finish()");
  assert.deepEqual([...s.g.get('S.luckyGifts')], [0], 'lần 3 sao thứ hai của cùng màn không thêm');
  s.g.run("Math.random=()=>0.1;openGift(()=>{});$('#gb').onclick()");
  assert.equal(s.g.get('S.owned.length'), 1); assert.equal(s.g.get('S.giftOwned.length'), 1);
  assert.equal(s.g.get('S.luckyGifts.length'), 0); assert.equal(s.g.get('balance()'), s.g.get('S.stars'));
  assert.ok(s.calls.some(c => c[0] === 'line' && c[1] === 'gift_dress'));
  s.g.run("openGift(()=>{});$('#gb').onclick()");
  assert.equal(s.g.get('S.owned.length'), 1, 'quà thường không ra váy');
});
test('hộp quà may mắn trượt 30% thì ra hình dán', async () => {
  const s = setup(); s.g.run(GIFT_DOM);
  s.g.run("P={g:'add',l:0,i:8,total:8,mistakes:0,seen:new Set(),token:0};finish();Math.random=()=>0.5;openGift(()=>{});$('#gb').onclick()");
  assert.equal(s.g.get('S.owned.length'), 0); assert.equal(s.g.get('S.stickers.length'), 1); assert.equal(s.g.get('S.luckyGifts.length'), 0);
});
test('tỷ lệ ra váy theo màn: màn 1 30%, mỗi màn sau +10%', async () => {
  const s = setup(); s.g.run(GIFT_DOM);
  assert.deepEqual([0, 1, 5].map(l => Math.round(s.g.get(`dressChance(${l})`) * 100)), [30, 40, 80]);
  s.g.run("P={g:'add',l:2,i:8,total:8,mistakes:0,seen:new Set(),token:0};finish();Math.random=()=>0.45;openGift(()=>{});$('#gb').onclick()");
  assert.equal(s.g.get('S.owned.length'), 1, 'màn 3 (50%) trúng với 0.45');
});
test('dữ liệu cũ luckyGifts dạng số được đổi thành danh sách màn 1', () => {
  const { loadGame } = require('./helpers/load');
  const g = loadGame(['js/core.js'], { storage: { be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', luckyGifts: 2 }) } });
  assert.deepEqual([...g.get('S.luckyGifts')], [0, 0]);
});
