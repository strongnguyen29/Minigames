const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/live.js','js/chat-ui.js','js/sync.js','js/ui.js'];
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
  g.run(`navigator.mediaDevices={getUserMedia(){}};CHAT_HEARD_MS=0;chatUseLive=false;
    var __rec=[],__said=[],__pokes=0,__clips=[];
    var __opts=null;chatRecStart=async(o)=>{__rec.push('start');__opts=o;return true};
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

const waitTick = () => new Promise(r => setTimeout(r, 30));
test('trang chủ có nút trò chuyện khi máy có micro, không có khi không', () => {
  const g = chat();
  g.run('home()');
  const html = g.get('app.innerHTML');
  assert.ok(html.includes('id="talkbtn"') && html.includes('aria-label="Trò chuyện với Kuromi"'));
  const g2 = chat(); g2.run('navigator.mediaDevices=undefined;home()');
  assert.ok(!g2.get('app.innerHTML').includes('talkbtn'));
});
test('chạm vào Kuromi vẫn là "chọc": không bị chiếm, không thu âm', () => {
  const g = chat();
  const before = g.img.onclick;
  g.run('home()');
  assert.equal(g.img.onclick, before);
  assert.deepEqual(plain(g.get('__rec')), []);
});
test('chatToggle: chạm lần 1 bắt đầu nghe, chạm lần 2 gửi đi', async () => {
  const g = chat();
  await g.get('chatToggle()');
  assert.equal(g.get('chatState'), 'listening');
  assert.equal(g.kuromi.classList.contains('listening'), true);
  await g.get('chatToggle()');
  assert.equal(g.get('chatState'), 'idle');
  assert.equal(g.get('talkLeft()'), 9);
  assert.deepEqual(plain(g.get('__clips')), ['Bằng hai nha!']);
});
test('bé ngừng nói thì tự gửi, không cần chạm lần nữa', async () => {
  const g = chat();
  await g.get('chatToggle()');
  g.run('__opts.onAuto("stop")');
  await waitTick();
  assert.equal(g.get('talkLeft()'), 9);
  assert.equal(g.get('chatState'), 'idle');
});
test('bé không nói gì (nospeech): Kuromi nhắc nói lại, không gửi, không trừ câu', async () => {
  let calls = 0;
  const g = chat({ fetchImpl: async () => { calls++; throw new Error('x'); } });
  await g.get('chatToggle()');
  g.run('__opts.onAuto("nospeech")');
  await waitTick();
  assert.equal(calls, 0);
  assert.ok(g.get('__said').includes('talk_unheard'));
  assert.equal(g.get('chatState'), 'idle');
  assert.equal(g.kuromi.classList.contains('listening'), false);
  assert.equal(g.get('talkLeft()'), 10);
});
test('đang chờ Gemini (thinking) thì chạm nút bị bỏ qua', async () => {
  let release; const gate = new Promise(r => { release = r; });
  const g = chat({ fetchImpl: async url => { await gate; return okFetch(url); } });
  await g.get('chatToggle()');
  const p = g.get('chatToggle()');
  await waitTick();
  assert.equal(g.get('chatState'), 'thinking');
  await g.get('chatToggle()');
  assert.equal(g.get('chatState'), 'thinking');
  assert.deepEqual(plain(g.get('__rec')), ['start']);
  release(); await p;
  assert.equal(g.get('chatState'), 'idle');
});
test('chạm nút là mở khoá âm thanh ngay (cử chỉ thật, cần cho iPhone)', async () => {
  const g = chat();
  g.run('var __unl=0;voice.unlock=()=>{__unl++}');
  await g.get('chatToggle()');
  assert.equal(g.get('__unl'), 1);
});
test('rời trang chủ: về trạng thái idle', async () => {
  const g = chat();
  await g.get('chatToggle()');
  g.run('go(()=>{})');
  assert.equal(g.get('chatState'), 'idle');
});

test('nút nằm trong khung Kuromi, ngay trước ảnh nhân vật (trên đầu / bên cạnh), không còn là ô trong lưới', () => {
  const g = chat();
  g.run('home()');
  const html = g.get('app.innerHTML');
  const btn = html.indexOf('id="talkbtn"'), img = html.indexOf('id="mimg"'), grid = html.indexOf('class="hgrid"');
  assert.ok(btn > -1 && btn < img, 'nút phải đứng trước ảnh Kuromi');
  assert.ok(btn < grid, 'nút không nằm trong lưới trò chơi');
  assert.ok(html.includes('hasbtn'));
});
test('nút là icon (bong bóng thoại + sóng âm) kèm dòng chữ nhỏ "Trò chuyện với Kuromi nhé!" (CSS chỉ hiện từ tablet trở lên)', () => {
  const g = chat();
  g.run('home()');
  const html = g.get('app.innerHTML');
  const m = /<button class="talkbtn"[\s\S]*?<\/button>/.exec(html);
  assert.ok(m, 'có nút talkbtn');
  assert.ok(m[0].includes('<svg') && m[0].includes('class="bar'));
  assert.ok(m[0].includes('aria-label="Trò chuyện với Kuromi"'));
  assert.ok(m[0].includes('<span class="tt" id="talktxt">Trò chuyện với Kuromi nhé!</span>'));
});
test('dòng chữ cạnh icon đổi theo trạng thái', async () => {
  const g = chat();
  g.run('home()');
  await g.get('chatToggle()');
  assert.equal(g.get('$("#talktxt").textContent'), 'Kuromi đang nghe… chạm để gửi');
  await g.get('chatToggle()');
  assert.equal(g.get('$("#talktxt").textContent'), 'Trò chuyện với Kuromi nhé!');
});
test('nút đổi trạng thái bằng class: listening khi đang nghe, thinking khi chờ Gemini', async () => {
  let release; const gate = new Promise(r => { release = r; });
  const g = chat({ fetchImpl: async url => { await gate; return okFetch(url); } });
  g.run('home()');
  const btn = g.get('$("#talkbtn")');
  await g.get('chatToggle()');
  assert.equal(btn.classList.contains('listening'), true);
  const p = g.get('chatToggle()');
  await waitTick();
  assert.equal(btn.classList.contains('listening'), false);
  assert.equal(btn.classList.contains('thinking'), true);
  release(); await p;
  assert.equal(btn.classList.contains('thinking'), false);
});

/* ---- Đường Live (liveOpen giả) ---- */
function liveChat(o = {}) {
  const g = chat(o);
  g.run(`chatUseLive=true;
    var __live={sent:[],ended:0,closed:0};
    liveOpen=(opts)=>{__live.opts=opts;
      __live.turn=new Promise((res,rej)=>{__live.res=res;__live.rej=rej});__live.turn.catch(()=>{});
      return{turn:__live.turn,sendPcm(x){__live.sent.push(x.length)},endAudio(){__live.ended++},
        close(){__live.closed++;__live.rej(new ChatError("cancelled"))},speaking:()=>false}}`);
  return g;
}
const REPLY = { heard: 'con mèo', reply: 'Meo meo!', gotAudio: true };
const fetchCount = () => { const f = async () => { f.n++; throw new Error('x'); }; f.n = 0; return f; };

test('Live: chạm nút nói, chạm lại để gửi sớm; lượt xong thì trừ một câu, không đụng đường chat cũ', async () => {
  const f = fetchCount(), g = liveChat({ fetchImpl: f });
  await g.get('chatToggle()');
  assert.equal(g.get('chatState'), 'listening');
  g.ctx.__c = new Float32Array(4800).fill(0.1);
  g.run('__opts.onChunk(__c,48000)');
  assert.deepEqual(plain(g.get('__live.sent')), [1600]);
  const p = g.get('chatToggle()');
  await waitTick();
  assert.equal(g.get('__live.ended'), 1);
  g.run('__live.opts.onText("Meo")');
  assert.equal(g.get('$("#mbub").textContent'), 'Meo');
  g.ctx.__r = REPLY; g.run('__live.res(__r)');
  await p;
  assert.equal(g.get('talkLeft()'), 9);
  assert.equal(f.n, 0);
  assert.equal(g.get('chatState'), 'idle');
});
test('Live: server đã trả lời trước khi bé chạm lần hai: tự dừng thu âm, không gửi audioStreamEnd, trừ một câu', async () => {
  const g = liveChat();
  await g.get('chatToggle()');
  g.run('__live.opts.onAudioStart()');
  await waitTick();
  assert.equal(g.get('chatState'), 'thinking');
  assert.equal(g.get('__live.ended'), 0);
  g.ctx.__c = new Float32Array(4800).fill(0.1);
  g.run('__opts.onChunk(__c,48000)');
  assert.deepEqual(plain(g.get('__live.sent')), []);
  g.ctx.__r = REPLY; g.run('__live.res(__r)');
  await waitTick();
  assert.equal(g.get('talkLeft()'), 9);
  assert.equal(g.get('chatState'), 'idle');
});
test('Live lỗi trước khi có tiếng: rơi về chat + TTS cũ bằng đoạn âm thanh đã thu, trừ đúng một câu', async () => {
  const g = liveChat();
  await g.get('chatToggle()');
  const p = g.get('chatToggle()');
  await waitTick();
  g.run('__live.rej(new ChatError("live"))');
  await p;
  assert.deepEqual(plain(g.get('__clips')), ['Bằng hai nha!']);
  assert.equal(g.get('talkLeft()'), 9);
});
test('Live báo khoá sai: mở hộp nhập key, không rơi về đường cũ, không trừ câu', async () => {
  const f = fetchCount(), g = liveChat({ fetchImpl: f });
  await g.get('chatToggle()');
  const p = g.get('chatToggle()');
  await waitTick();
  g.run('__live.rej(new ChatError("key"))');
  await p;
  assert.ok(g.modals().some(h => h.includes('ba mẹ')));
  assert.equal(f.n, 0); assert.equal(g.get('talkLeft()'), 10);
});
test('rời trang chủ giữa chừng: đóng phiên Live, không trừ câu, không rơi về đường cũ', async () => {
  const f = fetchCount(), g = liveChat({ fetchImpl: f });
  await g.get('chatToggle()');
  g.run('go(()=>{})');
  assert.equal(g.get('__live.closed'), 1);
  assert.equal(g.get('chatState'), 'idle');
  assert.equal(f.n, 0); assert.equal(g.get('talkLeft()'), 10);
});
test('Live trả lời xong nhưng bé đã rời trang: không trừ câu', async () => {
  const g = liveChat();
  await g.get('chatToggle()');
  const p = g.get('chatToggle()');
  await waitTick();
  g.run('go(()=>{})');
  g.ctx.__r = REPLY; g.run('try{__live.res(__r)}catch(e){}');
  await p;
  assert.equal(g.get('talkLeft()'), 10);
});
test('bé im suốt (nospeech) hoặc thu quá ngắn: đóng phiên Live, không trừ câu', async () => {
  const g = liveChat();
  await g.get('chatToggle()');
  g.run('__opts.onAuto("nospeech")');
  await waitTick();
  assert.equal(g.get('__live.closed'), 1);
  assert.ok(g.get('__said').includes('talk_unheard'));
  const g2 = liveChat({ ms: 100, samples: 1600 });
  await g2.get('chatToggle()'); await g2.get('chatToggle()');
  assert.equal(g2.get('__live.closed'), 1); assert.equal(g2.get('talkLeft()'), 10);
});
test('Live: Kuromi vui khi nói (nét mặt happy trong lúc trả lời)', async () => {
  const g = liveChat();
  await g.get('chatToggle()');
  g.run('__live.opts.onAudioStart()');
  await waitTick();
  g.run('__live.opts.onText("Meo meo!")');
  assert.match(g.get('$("#mimg").src'), /happy/);
});

test('chạm liên tục lúc đang xin quyền micro: chatBegin cũ trả về muộn không đóng phiên Live mới và không bật hiệu ứng nghe nhầm', async () => {
  const g = liveChat();
  let resolveA;
  g.ctx.__pendingA = new Promise(r => { resolveA = r; });
  g.run(`var __n=0;chatRecStart=async(o)=>{__n++;__opts=o;if(__n===1)return __pendingA;return true};chatRecStop=()=>null`);
  const p1 = g.get('chatToggle()');            // chatBegin A đang chờ micro
  await waitTick();
  await g.get('chatToggle()');                 // chạm lần 2: chatEnd, chưa thu được gì → idle, đóng phiên A
  assert.equal(g.get('chatState'), 'idle');
  const p3 = g.get('chatToggle()');            // chạm lần 3: chatBegin B
  await p3;
  assert.equal(g.get('chatState'), 'listening');
  const closedBefore = g.get('__live.closed');
  resolveA(false); await p1;                   // A trả về muộn
  assert.equal(g.get('chatState'), 'listening');
  assert.equal(g.get('__live.closed'), closedBefore, 'không được đóng phiên của B');
});
test('Live đã nói thì nét mặt vui không bị đổi lại thành "đang nghĩ"', async () => {
  const g = liveChat();
  await g.get('chatToggle()');
  g.run('__live.opts.onAudioStart()');
  await waitTick();
  assert.match(g.get('$("#mimg").src'), /happy/);
});
