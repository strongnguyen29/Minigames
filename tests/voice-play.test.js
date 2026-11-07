const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/questions.js','js/rewards.js','js/pattern.js','js/lines.js','audio/voice/manifest.js','js/voice.js'];

/* Audio giả (một phần tử dùng lại): ghi lại src khi play, gọi onended sau 1ms (hoặc onerror nếu src nằm trong bad) */
function setup({ have = [], bad = [], noTTS = false, voiceOn = true } = {}) {
  const played = [], rates = [];
  class FakeAudio {
    constructor(src) { this.src = src || ''; }
    play() { const src = this.src; played.push(src); rates.push(this.playbackRate); setTimeout(() => { if (this.src === src) (bad.includes(src) ? this.onerror : this.onended)?.(); }, 1); return Promise.resolve(); }
    pause() {}
  }
  const g = loadGame(FILES, { Audio: FakeAudio, noTTS });
  g.run(`VOICE_FILES.length=0;VOICE_FILES.push(...${JSON.stringify(have)});S.voice=${voiceOn};`);
  return { g, v: g.get('voice'), played, rates, tts: g.ctx.__tts };
}
const ALL = ['num_5','p_cong','num_7','p_bang_may'];

test('LINES: mỗi nhóm 3–5 câu (nhóm làng Giáng Sinh, làng Tết 1–5), id duy nhất, emo hợp lệ, đủ 83 nhóm', () => {
  const { g } = setup(); const L = g.get('LINES'); const ids = new Set();
  for (const [grp, arr] of Object.entries(L)) {
    assert.ok(arr.length >= (/^(xmas|tet)_/.test(grp) ? 1 : 3) && arr.length <= 5, grp);
    for (const x of arr) { assert.ok(!ids.has(x.id), x.id); ids.add(x.id);
      assert.ok(['neutral','happy','think','clap'].includes(x.emo), x.id); assert.ok(x.text && x.tone, x.id); }
  }
  assert.equal(Object.keys(L).length, 83);
});
test('voice.text phát đủ mẩu khi có file', async () => {
  const { v, played, tts } = setup({ have: ALL });
  await v.text('5 cộng 7 bằng mấy?');
  assert.deepEqual(played, ALL.map(i => `audio/voice/${i}.mp3`));
  assert.equal(tts.length, 0);
});
test('câu hỏi phát file nhanh 1.5 lần, câu thoại cố định giữ tốc độ gốc', async () => {
  const { g, v, rates } = setup({ have: ALL });
  await v.text('5 cộng 7 bằng mấy?');
  assert.deepEqual(rates, ALL.map(() => 1.5));
  g.run(`VOICE_FILES.push(...LINES.correct.map(x=>x.id))`);
  await v.line('correct').done;
  assert.equal(rates.at(-1), 1);
});
test('thiếu một mẩu thì đọc cả câu bằng giọng máy', async () => {
  const { v, played, tts } = setup({ have: ['num_5','p_cong','p_bang_may'] });
  await v.text('5 cộng 7 bằng mấy?');
  assert.deepEqual(played, []); assert.equal(tts[0].text, '5 cộng 7 bằng mấy?');
  assert.ok(tts[0].pitch === 1.3 && Math.abs(tts[0].rate - 1.14) < 1e-9 && tts[0].lang === 'vi-VN');
});
test('file lỗi giữa chừng thì dừng phát mẩu và đọc cả câu bằng giọng máy', async () => {
  const { v, played, tts } = setup({ have: ALL, bad: ['audio/voice/p_cong.mp3'] });
  await v.text('5 cộng 7 bằng mấy?');
  assert.deepEqual(played, ['audio/voice/num_5.mp3','audio/voice/p_cong.mp3']);
  assert.equal(tts.length, 1); assert.equal(tts[0].text, '5 cộng 7 bằng mấy?');
});
test('câu cố định: có file thì phát file, không thì giọng máy đọc chữ đã bỏ emoji', async () => {
  const { g, v, played, tts } = setup();
  const r = v.line('correct'); assert.ok(r.line.text); await r.done;
  assert.equal(played.length, 0); assert.equal(tts.length, 1); assert.doesNotMatch(tts[0].text, /\p{Extended_Pictographic}/u);
  g.run(`VOICE_FILES.push(...LINES.correct.map(x=>x.id))`);
  const r2 = v.line('correct'); await r2.done;
  assert.deepEqual(played, [`audio/voice/${r2.line.id}.mp3`]);
});
test('line không lặp lại câu vừa nói của cùng nhóm', () => {
  const { v } = setup(); let prev = v.line('correct').line.id;
  for (let i = 0; i < 30; i++) { const id = v.line('correct').line.id; assert.notEqual(id, prev); prev = id; }
});
test('câu mới dừng câu cũ, promise cũ vẫn resolve', async () => {
  const { v } = setup({ have: ALL });
  const a = v.text('5 cộng 7 bằng mấy?'); const b = v.line('correct').done;
  await a; await b;
});
test('voice.stop resolve câu đang phát', async () => {
  const { v, played } = setup({ have: ALL });
  const a = v.text('5 cộng 7 bằng mấy?'); v.stop(); await a;
  await new Promise(r => setTimeout(r, 20)); assert.ok(played.length <= 1);
});
test('S.voice=false thì không phát gì, promise resolve ngay', async () => {
  const { v, played, tts } = setup({ have: ALL, voiceOn: false });
  await v.text('5 cộng 7 bằng mấy?'); await v.line('correct').done;
  assert.equal(played.length + tts.length, 0);
});
test('không có speechSynthesis thì vẫn resolve, không ném lỗi', async () => {
  const { v } = setup({ noTTS: true }); await v.text('5 cộng 7 bằng mấy?'); await v.line('hint').done;
});
test('voiceWait tôn trọng min và max', async () => {
  const { g } = setup(); const voiceWait = g.get('voiceWait');
  const t0 = Date.now(); await voiceWait(new Promise(() => {}), 10, 60); assert.ok(Date.now() - t0 >= 55);
  const t1 = Date.now(); await voiceWait(Promise.resolve(), 40, 1000); assert.ok(Date.now() - t1 >= 35);
});
test('promise của câu: xong tự nhiên → true, bị ngắt → false', async () => {
  const { v } = setup({ have: ALL });
  const a = v.text('5 cộng 7 bằng mấy?'); v.stop();
  assert.equal(await a, false);
  assert.equal(await v.text('5 cộng 7 bằng mấy?'), true);
  assert.equal(await v.line('correct').done, true);
});
test('voice.busy() đúng khi đang có câu phát', async () => {
  const { v } = setup({ have: ALL });
  assert.equal(v.busy(), false);
  const a = v.text('5 cộng 7 bằng mấy?'); assert.equal(v.busy(), true);
  await a; assert.equal(v.busy(), false);
});
test('giọng máy đọc emoji thành chữ (không bỏ mất từ)', async () => {
  const { v, tts } = setup();
  await v.text('Có bao nhiêu 🍎 ?');
  assert.match(tts[0].text, /quả táo/);
});
test('giọng máy chọn giọng tiếng Việt có sẵn trên máy (ưu tiên vi-VN)', async () => {
  const { g, v, tts } = setup();
  g.run(`speechSynthesis.getVoices=()=>[{name:'Samantha',lang:'en-US'},{name:'Linh',lang:'vi-VN'},{name:'An',lang:'vi'}]`);
  await v.text('Bé ơi');
  assert.equal(tts[0].voice && tts[0].voice.name, 'Linh');
});
test('máy không có giọng tiếng Việt thì không gán voice, vẫn đọc với lang vi-VN', async () => {
  const { g, v, tts } = setup();
  g.run(`speechSynthesis.getVoices=()=>[{name:'Samantha',lang:'en-US'}]`);
  await v.text('Bé ơi');
  assert.equal(tts[0].voice, undefined); assert.equal(tts[0].lang, 'vi-VN');
});
test('lời thoại xưng "bạn", không gọi "bé" (trừ "bé hơn" nghĩa là nhỏ hơn)', () => {
  const { g } = setup(); const bad = [];
  for (const arr of Object.values(g.get('LINES'))) for (const x of arr)
    if (/(^|[^\p{L}])[Bb]é(?!\p{L})(?! hơn)/u.test(x.text)) bad.push(x.id + ': ' + x.text);
  assert.deepEqual(bad, []);
});

test('LINES có đủ nhóm câu cho tính năng nói chuyện với Kuromi', () => {
  const { g } = setup(); const L = g.get('LINES');
  for (const k of ['talk_hint', 'talk_unheard', 'talk_limit', 'talk_error', 'talk_nomic']) assert.ok(L[k] && L[k].length === 3, k);
});
const WAV = () => new Uint8Array(48);
test('voice.clip phát âm thanh Gemini qua phần tử Audio dùng chung', async () => {
  const { g, v, played, tts } = setup();
  g.ctx.__w = WAV();
  assert.equal(await g.get('voice.clip(__w,"Chào bé")'), true);
  assert.equal(played.length, 1); assert.match(played[0], /^blob:/); assert.equal(tts.length, 0);
});
test('voice.clip không có wav thì đọc bằng giọng máy', async () => {
  const { v, played, tts } = setup();
  assert.equal(await v.clip(null, 'Chào bé'), true);
  assert.equal(played.length, 0); assert.equal(tts[0].text, 'Chào bé');
});
test('voice.clip: phát lỗi thì rơi về giọng máy', async () => {
  const { g, tts } = setup({ bad: [] });
  g.run(`Audio=class{constructor(){this.src=''}play(){setTimeout(()=>this.onerror&&this.onerror(),1);return Promise.resolve()}pause(){}}`);
  g.ctx.__w = WAV();
  assert.equal(await g.get('voice.clip(__w,"Chào bé")'), true);
  assert.equal(tts[0].text, 'Chào bé');
});
test('stop() cắt clip và promise resolve false', async () => {
  const { g, v } = setup();
  g.run(`Audio=class{constructor(){this.src=''}play(){return Promise.resolve()}pause(){}}`);
  g.ctx.__w = WAV();
  const p = g.get('voice.clip(__w,"Chào bé")'); v.stop();
  assert.equal(await p, false);
});
test('tắt giọng thì clip resolve ngay, không phát', async () => {
  const { g, played, tts } = setup({ voiceOn: false });
  g.ctx.__w = WAV();
  assert.equal(await g.get('voice.clip(__w,"Chào bé")'), true);
  assert.equal(played.length + tts.length, 0);
});
