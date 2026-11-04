const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/chat-ui.js','js/sync.js','js/ui.js'];
const KEY = 'be_vui_hoc_toan_v1', DEVICE_KEY = 'be_vui_device_v1';
const GOOD = { heard: 'một cộng một', reply: 'Bằng hai nha!', emotion: 'happy' };
const gem = o => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] } }] });
const TTS_OK = { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;rate=24000', data: 'AQID' } }] } }] };
const okFetch = async url => ({ ok: true, status: 200, json: async () => (/tts/.test(url) ? TTS_OK : gem(GOOD)) });

/* Dựng game với micro, mascotSay, voice.clip và thu âm giả; ms = thời lượng "thu" */
function chat({ key = 'AIza-test', local = {}, fetchImpl = okFetch, ms = 2000, samples = 32000 } = {}) {
  const storage = { [DEVICE_KEY]: 'A', [KEY]: JSON.stringify(Object.assign({ name: 'Mai', voice: false }, local)) };
  const kuromi = { classList: { _s: new Set(), toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } } };
  const img = { parentNode: kuromi, classList: kuromi.classList, onclick: () => {}, setPointerCapture() {}, style: {} };
  const g = loadGame(FILES, { storage, pre: 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;', query: s => (s === '#mimg' ? img : null) });
  if (key) g.run(`setGeminiKey("${key}")`);
  g.run(`navigator.mediaDevices={getUserMedia(){}};CHAT_HEARD_MS=0;CHAT_RETRY_MS=0;
    var __rec=[],__said=[],__pokes=0,__clips=[];
    chatRecStart=async()=>{__rec.push('start');return true};
    chatRecStop=()=>({samples:new Float32Array(${samples}),rate:16000,ms:${ms}});
    chatRecCancel=()=>{__rec.push('cancel')};
    mascotSay=(gr,o)=>{__said.push(gr);return Promise.resolve(true)};
    mascotPoke=()=>{__pokes++};
    voice.clip=async(w,t)=>{__clips.push(t);return true};`);
  g.ctx.fetch = fetchImpl;
  g.modals = () => g.ctx.document.body.children.filter(m => m.className === 'modal' && m.isConnected).map(m => m.innerHTML);
  g.img = img; g.kuromi = kuromi;
  return g;
}
const plain = x => JSON.parse(JSON.stringify(x));
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

test('chưa có key: chatBegin mở hộp nhờ ba mẹ nhập key, không thu âm', async () => {
  const g = chat({ key: '' });
  assert.equal(await g.get('chatBegin()'), false);
  assert.ok(g.modals().some(h => h.includes('ba mẹ')));
  assert.deepEqual(plain(g.get('__rec')), []);
});
test('hết câu hôm nay: nói talk_limit và mở bảng đổi sao, không thu âm', async () => {
  const g = chat({ local: { stars: 20, talk: { day: today(), used: 10, paid: 0 } } });
  assert.equal(await g.get('chatBegin()'), false);
  assert.ok(g.get('__said').includes('talk_limit'));
  assert.ok(g.modals().some(h => h.includes('+5 câu') && h.includes('5 ⭐')));
  assert.deepEqual(plain(g.get('__rec')), []);
});
test('chạm nhanh vào Kuromi là poke: không thu âm, không trừ câu', () => {
  const g = chat();
  g.run('chatAttach()');
  g.img.onpointerdown({ preventDefault() {}, pointerId: 1 }); g.img.onpointerup({});
  assert.equal(g.get('__pokes'), 1);
  assert.deepEqual(plain(g.get('__rec')), []);
  assert.equal(g.get('talkLeft()'), 10);
});
test('chatAttach tắt onclick mặc định và chặn menu chuột phải', () => {
  const g = chat();
  g.run('chatAttach()');
  assert.equal(g.img.onclick, null);
  let prevented = false; g.img.oncontextmenu({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});
test('thu quá ngắn: không gửi Gemini, không trừ câu', async () => {
  let calls = 0;
  const g = chat({ ms: 100, samples: 1600, fetchImpl: async () => { calls++; throw new Error('x'); } });
  await g.get('chatBegin()'); await g.get('chatEnd()');
  assert.equal(calls, 0); assert.equal(g.get('talkLeft()'), 10);
});
test('luồng thành công: hiện chữ trả lời, trừ một câu, nhớ hội thoại, phát clip', async () => {
  const g = chat();
  assert.equal(await g.get('chatBegin()'), true);
  assert.equal(g.kuromi.classList.contains('listening'), true);
  await g.get('chatEnd()');
  assert.equal(g.kuromi.classList.contains('listening'), false);
  assert.equal(g.get('talkLeft()'), 9);
  assert.equal(g.get('chatHist.length'), 2);
  assert.deepEqual(plain(g.get('__clips')), ['Bằng hai nha!']);
  assert.equal(g.get('$("#mbub").textContent'), 'Bằng hai nha!');
});
test('micro bị từ chối: nói talk_nomic, không gửi, không trừ, gỡ hiệu ứng nghe', async () => {
  const g = chat();
  g.run('chatRecStart=async()=>{throw new ChatError("mic")}');
  assert.equal(await g.get('chatBegin()'), false);
  assert.ok(g.get('__said').includes('talk_nomic'));
  assert.equal(g.kuromi.classList.contains('listening'), false);
  assert.equal(g.get('talkLeft()'), 10);
});
test('bé thả tay trước khi có quyền micro (chatRecStart trả false): không bật hiệu ứng nghe', async () => {
  const g = chat();
  g.run('chatRecStart=async()=>false');
  assert.equal(await g.get('chatBegin()'), false);
  assert.equal(g.kuromi.classList.contains('listening'), false);
});
test('rời trang chủ khi đang chờ Gemini: bỏ kết quả, không phát, không trừ câu', async () => {
  let release; const gate = new Promise(r => { release = r; });
  const g = chat({ fetchImpl: async url => { await gate; return okFetch(url); } });
  await g.get('chatBegin()');
  const p = g.get('chatEnd()');
  g.run('go(()=>{})');
  release(); await p;
  assert.deepEqual(plain(g.get('__clips')), []);
  assert.equal(g.get('chatHist.length'), 0);
  assert.equal(g.get('talkLeft()'), 10);
  assert.ok(plain(g.get('__rec')).includes('cancel'));
});
test('key sai: nói talk_error và mở lại hộp nhập key, không trừ câu', async () => {
  const g = chat({ fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({}) }) });
  await g.get('chatBegin()'); await g.get('chatEnd()');
  assert.ok(g.get('__said').includes('talk_error'));
  assert.ok(g.modals().some(h => h.includes('ba mẹ')));
  assert.equal(g.get('talkLeft()'), 10);
});
test('Gemini không nghe rõ (heard rỗng): nói talk_unheard, không trừ câu', async () => {
  const g = chat({ fetchImpl: async () => ({ ok: true, status: 200, json: async () => gem({ heard: '', reply: 'Ừ', emotion: 'happy' }) }) });
  await g.get('chatBegin()'); await g.get('chatEnd()');
  assert.ok(g.get('__said').includes('talk_unheard'));
  assert.equal(g.get('talkLeft()'), 10);
});
test('hộp nhập key: lưu key, chỉ hiện 4 ký tự cuối, xoá được', () => {
  const g = chat({ key: '' });
  g.run('chatKeyModal()');
  g.get('$("#gk")').value = 'AIza-' + 'x'.repeat(30) + 'WXYZ';
  g.run('$("#gs").onclick()');
  assert.equal(g.get('geminiKey().endsWith("WXYZ")'), true);
  g.run('chatKeyModal()');
  assert.ok(g.modals().some(h => h.includes('WXYZ') && !h.includes('xxxxxxxx')));
  g.run('$("#gd").onclick()');
  assert.equal(g.get('geminiKey()'), '');
});
test('hộp nhập key: key quá ngắn thì không lưu', () => {
  const g = chat({ key: '' });
  g.run('chatKeyModal()');
  g.get('$("#gk")').value = 'abc';
  g.run('$("#gs").onclick()');
  assert.equal(g.get('geminiKey()'), '');
});
test('bảng đổi câu: gói đúng giá, thiếu sao thì không đổi, đủ sao thì đổi', () => {
  const g = chat({ local: { stars: 5 } });
  g.run('chatBuyModal()');
  assert.ok(g.modals().some(h => h.includes('+15 câu') && h.includes('12 ⭐')));
  g.run('$("#gb1").onclick()');
  assert.equal(g.get('talkLeft()'), 10);
  g.run('$("#gb0").onclick()');
  assert.equal(g.get('talkLeft()'), 15);
});
test('trang chủ: lần đầu nói câu hướng dẫn talk_hint, lần sau nói câu home', () => {
  const g = chat();
  g.run('home()'); g.run('home()');
  assert.deepEqual(plain(g.get('__said.filter(x=>x==="talk_hint"||x==="home")')), ['talk_hint', 'home']);
});
test('cài đặt có dòng Khoá Gemini và số câu còn lại hôm nay', () => {
  const g = chat();
  g.run('settings()');
  const html = g.modals().join('');
  assert.ok(html.includes('Khoá Gemini') && html.includes('Còn 10 câu'));
});

test('ghi âm trống dù giữ lâu (micro không gửi mẫu, hay gặp trên iPhone): nói talk_nomic, không gửi, không trừ', async () => {
  let calls = 0;
  const g = chat({ samples: 0, fetchImpl: async () => { calls++; throw new Error('x'); } });
  await g.get('chatBegin()'); await g.get('chatEnd()');
  assert.equal(calls, 0);
  assert.ok(g.get('__said').includes('talk_nomic'));
  assert.equal(g.get('talkLeft()'), 10);
});
test('độ dài kiểm tra theo mẫu âm thanh thật, không theo đồng hồ: mẫu quá ngắn thì không gửi', async () => {
  let calls = 0;
  const g = chat({ ms: 3000, samples: 800, fetchImpl: async () => { calls++; throw new Error('x'); } });
  await g.get('chatBegin()'); await g.get('chatEnd()');
  assert.equal(calls, 0);
});
test('nhấn xuống Kuromi là mở khoá âm thanh ngay (cử chỉ thật, cần cho iPhone)', () => {
  const g = chat();
  g.run('var __unl=0;voice.unlock=()=>{__unl++};chatAttach()');
  g.img.onpointerdown({ preventDefault() {}, pointerId: 1 });
  assert.equal(g.get('__unl'), 1);
  g.img.onpointerup({});
});
