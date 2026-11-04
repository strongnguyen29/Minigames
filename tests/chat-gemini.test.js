const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const KEY = 'be_vui_hoc_toan_v1', DEVICE_KEY = 'be_vui_device_v1';
function setup({ key = 'AIza-test', local = {} } = {}) {
  const storage = { [DEVICE_KEY]: 'A', [KEY]: JSON.stringify(Object.assign({ name: 'Mai' }, local)) };
  const g = loadGame(['js/core.js', 'js/merge.js', 'js/chat.js'], { storage });
  if (key) g.run(`setGeminiKey(${JSON.stringify(key)})`);
  g.run('CHAT_RETRY_MS=0');
  return g;
}
const text = o => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(o) }] } }] });
const GOOD = { heard: 'một cộng một', reply: 'Bằng hai nha!', emotion: 'happy' };
const audio = b64 => ({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: b64 } }] } }] });
const PCM_B64 = Buffer.from([1, 2, 3, 4]).toString('base64');
/* fetch giả: chat trả về chatRes, TTS (URL có "tts") trả về ttsRes; ghi lại mọi request */
function fakeFetch({ chatRes = text(GOOD), ttsRes = audio(PCM_B64), chatStatus = 200, ttsFail = false, netFail = false } = {}) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (netFail) throw new TypeError('Failed to fetch');
    const tts = /tts/.test(url);
    if (tts && ttsFail) throw new TypeError('tts down');
    const status = tts ? 200 : chatStatus;
    return { ok: status < 400, status, json: async () => (tts ? ttsRes : chatRes) };
  };
  f.calls = calls;
  return f;
}
const ask = (g, f, history = []) => { g.ctx.__f = f; g.ctx.__h = history; return g.get('chatAsk({wavB64:"AAAA",history:__h,fetch:__f})'); };
const kindOf = p => p.then(() => null, e => e.kind);

test('chat thành công: trả reply, trừ một câu, khoá nằm ở header chứ không ở URL', async () => {
  const g = setup(), f = fakeFetch();
  const r = await ask(g, f);
  assert.equal(r.reply, 'Bằng hai nha!'); assert.equal(r.heard, 'một cộng một'); assert.equal(r.emotion, 'happy');
  assert.equal(Array.from(r.wav.slice(44)).join(), '1,2,3,4');
  assert.equal(g.get('talkLeft()'), 9);
  assert.equal(f.calls[0].init.headers['x-goog-api-key'], 'AIza-test');
  assert.ok(!f.calls[0].url.includes('AIza-test'));
});

test('body chat: systemInstruction, tối đa 12 mục lịch sử, lượt cuối có âm thanh WAV', async () => {
  const g = setup(), f = fakeFetch();
  const hist = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: 't' + i }));
  await ask(g, f, hist);
  const b = f.calls[0].body;
  assert.ok(b.systemInstruction.parts[0].text.includes('Kuromi'));
  assert.equal(b.contents.length, 13);
  assert.equal(b.contents[0].parts[0].text, 't8');
  const last = b.contents[12].parts[0].inlineData;
  assert.equal(last.mimeType, 'audio/wav'); assert.equal(last.data, 'AAAA');
  assert.equal(b.generationConfig.responseMimeType, 'application/json');
});

test('chat thành công nhưng TTS lỗi: vẫn có chữ, wav null, vẫn trừ một câu', async () => {
  const g = setup(), r = await ask(g, fakeFetch({ ttsFail: true }));
  assert.equal(r.reply, 'Bằng hai nha!'); assert.equal(r.wav, null);
  assert.equal(g.get('talkLeft()'), 9);
});

test('TTS trả sẵn WAV (RIFF) thì dùng nguyên, không bọc thêm', async () => {
  const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(40)]);
  const g = setup(), r = await ask(g, fakeFetch({ ttsRes: audio(wav.toString('base64')) }));
  assert.equal(r.wav.length, 44);
});

test('lỗi: 429 là quota, 403 là key, mạng đứt là net; đều không trừ câu', async () => {
  for (const [opt, kind] of [[{ chatStatus: 429 }, 'quota'], [{ chatStatus: 403 }, 'key'], [{ chatStatus: 400 }, 'net'], [{ netFail: true }, 'net'], [{ chatStatus: 500 }, 'net']]) {
    const g = setup();
    assert.equal(await kindOf(ask(g, fakeFetch(opt))), kind);
    assert.equal(g.get('talkLeft()'), 10);
  }
});

test('JSON hỏng, reply rỗng hoặc heard rỗng: format, không trừ câu, không gọi TTS', async () => {
  for (const chatRes of [{ candidates: [{ content: { parts: [{ text: 'xin chào' }] } }] }, text({ heard: 'a', reply: '', emotion: 'happy' }), text({ heard: '', reply: 'Ừ', emotion: 'happy' }), {}]) {
    const g = setup(), f = fakeFetch({ chatRes });
    assert.equal(await kindOf(ask(g, f)), 'format');
    assert.equal(g.get('talkLeft()'), 10);
    assert.equal(f.calls.length, 1);
  }
});

test('không có key: nokey, không gọi fetch', async () => {
  const g = setup({ key: '' }), f = fakeFetch();
  assert.equal(await kindOf(ask(g, f)), 'nokey');
  assert.equal(f.calls.length, 0);
});

test('hết câu: limit và không gọi fetch', async () => {
  const g = setup({ local: { talk: { day: new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate(), used: 10, paid: 0 } } });
  const f = fakeFetch();
  assert.equal(await kindOf(ask(g, f)), 'limit');
  assert.equal(f.calls.length, 0);
});

/* fetch giả trả lần lượt các mã trạng thái cho cuộc gọi chat */
function seqFetch(statuses) {
  const calls = []; let i = 0;
  const f = async (url, init) => {
    calls.push(url);
    if (/tts/.test(url)) return { ok: true, status: 200, json: async () => audio(PCM_B64) };
    const status = statuses[Math.min(i++, statuses.length - 1)];
    return { ok: status < 400, status, json: async () => text(GOOD) };
  };
  f.calls = calls; return f;
}
test('503 quá tải: thử lại rồi thành công, chỉ trừ một câu', async () => {
  const g = setup(); g.run('CHAT_RETRY_MS=0');
  const f = seqFetch([503, 503, 200]);
  const r = await ask(g, f);
  assert.equal(r.reply, 'Bằng hai nha!');
  assert.equal(f.calls.filter(u => !/tts/.test(u)).length, 3);
  assert.equal(g.get('talkLeft()'), 9);
});
test('503 liên tục: thử tối đa 3 lần rồi báo net, không trừ câu', async () => {
  const g = setup(); g.run('CHAT_RETRY_MS=0');
  const f = seqFetch([503]);
  assert.equal(await kindOf(ask(g, f)), 'net');
  assert.equal(f.calls.length, 3);
  assert.equal(g.get('talkLeft()'), 10);
});
test('Gemini phản hồi quá chậm: huỷ sau thời gian chờ và báo net, không trừ câu', { timeout: 3000 }, async () => {
  const g = setup(); g.run('CHAT_TIMEOUT_MS=20');
  g.ctx.AbortController = AbortController;
  /* treo mãi, chỉ dừng khi bị huỷ bằng signal */
  const f = (url, init) => new Promise((_, rej) => { if (init.signal) init.signal.addEventListener('abort', () => rej(new Error('aborted'))); });
  assert.equal(await kindOf(ask(g, f)), 'net');
  assert.equal(g.get('talkLeft()'), 10);
});
/* fetch giả: mỗi model TTS có một mã trạng thái riêng (theo thứ tự thử), chat luôn thành công */
function ttsFetch(statuses) {
  const used = [];
  const f = async url => {
    if (/tts/.test(url)) {
      used.push(url.split('/models/')[1].split(':')[0]);
      const s = statuses[Math.min(used.length - 1, statuses.length - 1)];
      return { ok: s < 400, status: s, json: async () => (s < 400 ? audio(PCM_B64) : {}) };
    }
    return { ok: true, status: 200, json: async () => text(GOOD) };
  };
  f.used = used; return f;
}
test('TTS lỗi liên tục: mỗi model chỉ thử một lần, hết danh sách thì wav null, vẫn trừ một câu', async () => {
  const g = setup(), f = ttsFetch([503]);
  const r = await ask(g, f);
  assert.equal(r.wav, null);
  assert.equal(f.used.length, g.get('TTS_MODELS.length'));
  assert.equal(new Set(f.used).size, f.used.length);
  assert.equal(g.get('talkLeft()'), 9);
});
test('TTS: model đầu hết hạn mức (429) thì thử model kế tiếp, có giọng Gemini', async () => {
  const g = setup(), f = ttsFetch([429, 200]);
  const r = await ask(g, f);
  assert.equal(f.used.length, 2);
  assert.equal(Array.from(r.wav.slice(44)).join(), '1,2,3,4');
});
test('TTS: key bị từ chối thì dừng ngay, không thử model khác', async () => {
  const g = setup(), f = ttsFetch([403]);
  const r = await ask(g, f);
  assert.equal(f.used.length, 1); assert.equal(r.wav, null);
});
test('TTS: quá ngân sách thời gian thì không thử thêm model', async () => {
  const g = setup(); g.run('TTS_BUDGET_MS=-1');
  const f = ttsFetch([429]);
  await ask(g, f);
  assert.equal(f.used.length, 1);
});
test('rời trang trong lúc chờ TTS: không trừ câu', async () => {
  const g = setup(); let alive = true;
  g.ctx.__alive = () => alive;
  const f = async url => {
    if (/tts/.test(url)) alive = false;
    return { ok: true, status: 200, json: async () => (/tts/.test(url) ? audio(PCM_B64) : text(GOOD)) };
  };
  g.ctx.__f = f; g.ctx.__h = [];
  assert.equal(await kindOf(g.get('chatAsk({wavB64:"AAAA",history:__h,alive:__alive,fetch:__f})')), 'cancelled');
  assert.equal(g.get('talkLeft()'), 10);
});
test('400 chỉ là key sai khi Gemini nói khoá không hợp lệ; 400 khác là net', async () => {
  const mk = msg => async () => ({ ok: false, status: 400, json: async () => ({ error: { message: msg, status: 'INVALID_ARGUMENT' } }) });
  assert.equal(await kindOf(ask(setup(), mk('API key not valid. Please pass a valid API key.'))), 'key');
  assert.equal(await kindOf(ask(setup(), mk('Request payload size exceeds the limit: 20971520 bytes.'))), 'net');
  assert.equal(await kindOf(ask(setup(), async () => ({ ok: false, status: 400, json: async () => { throw new Error('x'); } }))), 'net');
});
test('429 và 403 không thử lại', async () => {
  for (const s of [429, 403]) {
    const g = setup(); g.run('CHAT_RETRY_MS=0');
    const f = seqFetch([s]);
    await kindOf(ask(g, f));
    assert.equal(f.calls.length, 1);
  }
});

test('key lưu riêng, đọc lại được, xoá được và không nằm trong S', () => {
  const g = setup({ key: '' });
  assert.equal(g.get('geminiKey()'), '');
  g.run('setGeminiKey("abc123")');
  assert.equal(g.get('geminiKey()'), 'abc123');
  assert.ok(!JSON.stringify(g.get('JSON.stringify(S)')).includes('abc123'));
  assert.ok(![...g.ctx.__store.entries()].some(([k, v]) => k === KEY && String(v).includes('abc123')));
  g.run('setGeminiKey("")');
  assert.equal(g.get('geminiKey()'), '');
});
