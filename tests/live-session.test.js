const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const plain = x => JSON.parse(JSON.stringify(x));
const game = () => loadGame(['js/core.js', 'js/chat.js', 'js/live.js']);

/* ---- Phiên Live (WebSocket giả) ---- */
class FakeWS {
  constructor(url) { FakeWS.last = this; this.url = url; this.sent = []; this.closed = false; }
  send(s) { this.sent.push(JSON.parse(s)); }
  close() { this.closed = true; }
  open() { this.onopen(); }
  msg(o) { return this.onmessage({ data: JSON.stringify(o) }); }
  shut(code, reason) { return this.onclose({ code, reason }); }
}
const b64 = a => Buffer.from(a).toString('base64');
const audioMsg = bytes => ({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: b64(bytes) } }] } } });
function session(opts = {}) {
  const g = game(), plays = [], texts = []; let starts = 0, stopped = 0;
  g.ctx.__opts = {
    key: 'K', WS: FakeWS,
    speaker: { play: b => plays.push(Array.from(b)), stop: () => { stopped++; }, idle: () => Promise.resolve(true), active: () => false },
    onAudioStart: () => { starts++; }, onText: t => texts.push(t), ...opts
  };
  const s = g.get('liveOpen(__opts)');
  return { g, s, ws: FakeWS.last, plays, texts, starts: () => starts, stopped: () => stopped };
}
const settle = () => new Promise(r => setTimeout(r, 5));
const kindOf = p => p.then(() => null, e => e.kind);

test('liveOpen: mở WebSocket tới Live bằng khoá, mở xong thì gửi thông điệp setup', () => {
  const { ws } = session();
  assert.ok(ws.url.includes('BidiGenerateContent?key=K'));
  ws.open();
  assert.equal(ws.sent.length, 1);
  assert.equal(ws.sent[0].setup.model, 'models/gemini-2.5-flash-native-audio-latest');
});
test('âm thanh gửi trước setupComplete được giữ lại rồi gửi đủ, đúng thứ tự; sau đó gửi ngay', async () => {
  const { s, ws } = session();
  ws.open();
  s.sendPcm(new Int16Array([1, 2, 3])); s.sendPcm(new Int16Array([4, 5]));
  assert.equal(ws.sent.length, 1);
  await ws.msg({ setupComplete: {} });
  assert.equal(ws.sent.length, 3);
  const a = ws.sent[1].realtimeInput.audio;
  assert.equal(a.mimeType, 'audio/pcm;rate=16000');
  assert.equal(a.data, Buffer.from(new Int16Array([1, 2, 3]).buffer).toString('base64'));
  s.sendPcm(new Int16Array([9]));
  assert.equal(ws.sent.length, 4);
});
test('endAudio gửi audioStreamEnd (sau khi đã gửi hết âm thanh đang giữ)', async () => {
  const { s, ws } = session();
  ws.open(); s.sendPcm(new Int16Array([1])); s.endAudio();
  await ws.msg({ setupComplete: {} });
  assert.equal(ws.sent.at(-1).realtimeInput.audioStreamEnd, true);
  assert.ok(ws.sent.at(-2).realtimeInput.audio);
});
test('tiếng trả lời: onAudioStart gọi một lần, mỗi mẩu được phát', async () => {
  const { ws, plays, starts } = session();
  ws.open(); await ws.msg({ setupComplete: {} });
  await ws.msg(audioMsg([1, 0, 2, 0])); await ws.msg(audioMsg([3, 0]));
  assert.equal(starts(), 1);
  assert.deepEqual(plays, [[1, 0, 2, 0], [3, 0]]);
});
test('chép lời đầu ra cộng dồn gửi onText; turnComplete thì phiên kết thúc với heard và reply, đóng kết nối', async () => {
  const { s, ws, texts } = session();
  ws.open(); await ws.msg({ setupComplete: {} });
  await ws.msg({ serverContent: { inputTranscription: { text: 'con mèo ' } } });
  await ws.msg({ serverContent: { inputTranscription: { text: 'kêu sao' } } });
  await ws.msg(audioMsg([1, 0]));
  await ws.msg({ serverContent: { outputTranscription: { text: 'Mèo kêu ' } } });
  await ws.msg({ serverContent: { outputTranscription: { text: 'meo meo!' } } });
  assert.deepEqual(plain(texts), ['Mèo kêu ', 'Mèo kêu meo meo!']);
  await ws.msg({ serverContent: { turnComplete: true } });
  const r = plain(await s.turn);
  assert.equal(r.reply, 'Mèo kêu meo meo!'); assert.equal(r.heard, 'con mèo kêu sao'); assert.equal(r.gotAudio, true);
  assert.equal(ws.closed, true);
});
test('đọc được cả khung dạng Blob (có .text())', async () => {
  const { ws, plays } = session();
  ws.open();
  await ws.onmessage({ data: { text: async () => JSON.stringify({ setupComplete: {} }) } });
  await ws.onmessage({ data: { text: async () => JSON.stringify(audioMsg([7, 0])) } });
  assert.deepEqual(plays, [[7, 0]]);
});
test('turnComplete mà không có tiếng nào: lỗi format (nghe không rõ)', async () => {
  const { s, ws } = session();
  ws.open(); await ws.msg({ setupComplete: {} });
  await ws.msg({ serverContent: { turnComplete: true } });
  assert.equal(await kindOf(s.turn), 'format');
});
test('đóng kết nối trước khi có tiếng: lý do về API key là key, còn lại là live', async () => {
  const a = session(); a.ws.open(); a.ws.shut(1007, 'API key not valid. Please pass a valid API key.');
  assert.equal(await kindOf(a.s.turn), 'key');
  const b = session(); b.ws.open(); b.ws.shut(1011, 'Internal error');
  assert.equal(await kindOf(b.s.turn), 'live');
});
test('đóng kết nối sau khi đã có tiếng nhưng trước turnComplete: coi là xong một phần, không lỗi', async () => {
  const { s, ws } = session();
  ws.open(); await ws.msg({ setupComplete: {} }); await ws.msg(audioMsg([1, 0]));
  ws.shut(1006, '');
  const r = plain(await s.turn);
  assert.equal(r.gotAudio, true); assert.equal(r.partial, true);
});
test('bé nói xong mà quá LIVE_REPLY_MS không có tiếng: lỗi net (để rơi về đường cũ)', { timeout: 3000 }, async () => {
  const { g, s, ws } = session(); g.run('LIVE_REPLY_MS=20');
  ws.open(); await ws.msg({ setupComplete: {} });
  s.endAudio();
  assert.equal(await kindOf(s.turn), 'net');
  assert.equal(ws.closed, true);
});
test('setup mãi không xong (quá LIVE_CONNECT_MS): lỗi live', { timeout: 3000 }, async () => {
  const { g } = session();
  g.run('LIVE_CONNECT_MS=20');
  const s2 = g.get('liveOpen(__opts)');
  assert.equal(await kindOf(s2.turn), 'live');
});
test('close(): huỷ phiên, ngắt tiếng đang phát, đóng kết nối, turn bị cancelled', async () => {
  const { s, ws, stopped } = session();
  ws.open(); await ws.msg({ setupComplete: {} });
  s.close();
  assert.equal(await kindOf(s.turn), 'cancelled');
  assert.equal(ws.closed, true); assert.equal(stopped(), 1);
});
test('lỗi gửi (ws.send ném) trước khi có tiếng: lỗi live', async () => {
  const { s, ws } = session();
  ws.open(); await ws.msg({ setupComplete: {} });
  ws.send = () => { throw new Error('boom'); };
  s.sendPcm(new Int16Array([1]));
  assert.equal(await kindOf(s.turn), 'live');
});

/* ---- Loa phát tiếng Live (PCM 24 kHz) ---- */
function speakerGame() {
  const g = game(), starts = [], srcs = [], bufs = [];
  class FakeCtx {
    constructor() { this.currentTime = 0; this.destination = {}; }
    resume() {}
    createBuffer(ch, n, rate) { const d = new Float32Array(n); bufs.push(d); return { duration: n / rate, getChannelData: () => d }; }
    createBufferSource() { const s = { connect() {}, start: t => starts.push(t), stop() {} }; srcs.push(s); return s; }
  }
  g.ctx.__c = new FakeCtx();
  return { g, sp: g.get('liveSpeaker(()=>__c)'), starts, srcs, bufs };
}
test('liveSpeaker: đổi PCM 16-bit sang Float32 và phát các mẩu nối liền nhau không hở', () => {
  const { sp, starts, bufs } = speakerGame();
  const pcm = new Uint8Array(new Int16Array(2400).fill(16384).buffer);
  sp.play(pcm); sp.play(pcm);
  assert.ok(Math.abs(bufs[0][0] - 0.5) < 1e-6);
  assert.ok(Math.abs(starts[1] - (starts[0] + 0.1)) < 1e-6);
});
test('liveSpeaker: idle() xong khi mọi mẩu phát hết; stop() ngắt và idle() trả false', async () => {
  const { sp, srcs } = speakerGame();
  const pcm = new Uint8Array(new Int16Array(240).buffer);
  sp.play(pcm); sp.play(pcm);
  assert.equal(sp.active(), true);
  let done = null; sp.idle().then(v => { done = v; });
  srcs[0].onended(); await settle(); assert.equal(done, null);
  srcs[1].onended(); await settle(); assert.equal(done, true);
  const b = speakerGame(); b.sp.play(pcm);
  const p = b.sp.idle(); b.sp.stop();
  assert.equal(await p, false); assert.equal(b.sp.active(), false);
});
