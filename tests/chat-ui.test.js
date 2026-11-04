const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');

/* Phát hiện bé ngừng nói: mỗi lần push(rms, ms) cho một đoạn âm thanh dài ms; trả 'stop' | 'nospeech' | null */
function vad(opts = {}) {
  const g = loadGame(['js/core.js', 'js/chat.js', 'js/chat-ui.js']);
  g.ctx.__o = opts;
  return g.get('chatVad(__o)');
}
const LOUD = 0.1, QUIET = 0.001;
test('chatVad: bé nói rồi im đủ 1,5 giây thì stop', () => {
  const v = vad();
  assert.equal(v.push(LOUD, 500), null);
  assert.equal(v.push(QUIET, 1000), null);
  assert.equal(v.push(QUIET, 500), 'stop');
});
test('chatVad: im ngắn giữa chừng (ngập ngừng) thì không stop, nói tiếp thì đếm lại', () => {
  const v = vad();
  v.push(LOUD, 500);
  assert.equal(v.push(QUIET, 1400), null);
  assert.equal(v.push(LOUD, 300), null);
  assert.equal(v.push(QUIET, 1400), null);
  assert.equal(v.push(QUIET, 200), 'stop');
});
test('chatVad: im từ đầu quá 8 giây thì nospeech', () => {
  const v = vad();
  assert.equal(v.push(QUIET, 7900), null);
  assert.equal(v.push(QUIET, 200), 'nospeech');
});
test('chatVad: im lúc đầu rồi mới nói thì không nospeech', () => {
  const v = vad();
  v.push(QUIET, 3000); v.push(LOUD, 500);
  assert.equal(v.push(QUIET, 6000), 'stop');
});
test('chatVad: nói liên tục thì dừng ở giới hạn tối đa', () => {
  const v = vad({ maxMs: 3000 });
  assert.equal(v.push(LOUD, 2900), null);
  assert.equal(v.push(LOUD, 200), 'stop');
});

/* micro + AudioContext giả: getUserMedia trả luồng khi gọi release() (hoặc ngay nếu không đợi) */
function micGame({ wait = false } = {}) {
  const g = loadGame(['js/core.js', 'js/chat.js', 'js/chat-ui.js']);
  g.run(`var __stopped=0,__release;
    class FakeAC{constructor(){this.sampleRate=16000;this.destination={}}resume(){}close(){}
      createMediaStreamSource(){return{connect(){},disconnect(){}}}
      createScriptProcessor(){return{connect(){},disconnect(){}}}}
    window.AudioContext=FakeAC;
    navigator.mediaDevices={getUserMedia:()=>new Promise(r=>{const s={getTracks:()=>[{stop(){__stopped++}}]};
      ${wait ? '__release=()=>r(s)' : 'r(s)'}})};`);
  return g;
}
test('chatRecStart: thu được thì trả true và chatRecStop trả mẫu âm thanh', async () => {
  const g = micGame();
  assert.equal(await g.get('chatRecStart()'), true);
  const r = g.get('chatRecStop()');
  assert.equal(r.rate, 16000); assert.ok(r.ms >= 0 && r.samples.length === 0);
  assert.equal(g.get('__stopped'), 1);
});
test('chatRecording() đúng khi đang thu: để nhạc nền biết mà hạ âm lượng', async () => {
  const g = micGame();
  assert.equal(g.get('chatRecording()'), false);
  await g.get('chatRecStart()');
  assert.equal(g.get('chatRecording()'), true);
  g.run('chatRecStop()');
  assert.equal(g.get('chatRecording()'), false);
});
test('thu âm bị giới hạn độ dài: mẫu vượt TALK_MAX_S giây bị bỏ', async () => {
  const g = micGame();
  g.run('TALK_MAX_S=1');
  g.run(`var __procs=[];AudioContext.prototype.createScriptProcessor=function(){const p={connect(){},disconnect(){}};__procs.push(p);return p}`);
  await g.get('chatRecStart()');
  const chunk = () => ({ inputBuffer: { getChannelData: () => new Float32Array(16000) } });
  g.ctx.__c = chunk();
  g.run('__procs[0].onaudioprocess(__c);__procs[0].onaudioprocess(__c);__procs[0].onaudioprocess(__c)');
  assert.equal(g.get('chatRecStop().samples.length'), 16000);
});
test('chatRecStart: bé thả tay trước khi có quyền micro thì trả false và đóng luồng đến muộn', async () => {
  const g = micGame({ wait: true });
  const p = g.get('chatRecStart()');
  g.run('chatRecStop()'); g.run('__release()');
  assert.equal(await p, false);
  assert.equal(g.get('__stopped'), 1);
  assert.equal(g.get('chatRecStop()'), null);
});

test('chatRecStart: máy không có micro thì ném ChatError mic; chatRecStop khi chưa thu trả null', async () => {
  const g = loadGame(['js/core.js', 'js/chat.js', 'js/chat-ui.js']);
  const kind = await g.get('chatRecStart()').then(() => null, e => e.kind);
  assert.equal(kind, 'mic');
  assert.equal(g.get('chatRecStop()'), null);
});

/* Bộ xử lý âm thanh giả: tiêm từng đoạn 4096 mẫu ở 16 kHz (256 ms) với biên độ amp */
async function vadGame() {
  const g = micGame();
  g.run(`var __procs=[];AudioContext.prototype.createScriptProcessor=function(){const p={connect(){},disconnect(){}};__procs.push(p);return p}`);
  const events = [];
  g.ctx.__auto = r => events.push(r);
  await g.get('chatRecStart({onAuto:__auto})');
  const feed = (amp, n = 1) => { g.ctx.__c = { inputBuffer: { getChannelData: () => new Float32Array(4096).fill(amp) } }; for (let i = 0; i < n; i++) g.run('__procs[0].onaudioprocess(__c)'); };
  return { g, events, feed };
}
test('chatRecStart: bé nói rồi im thì gọi onAuto("stop") đúng một lần', async () => {
  const { events, feed } = await vadGame();
  feed(0.1, 4); feed(0.0, 8);
  assert.deepEqual(events, ['stop']);
  feed(0.0, 8);
  assert.deepEqual(events, ['stop']);
});
test('chatRecStart: im từ đầu thì gọi onAuto("nospeech")', async () => {
  const { events, feed } = await vadGame();
  feed(0.0, 40);
  assert.deepEqual(events, ['nospeech']);
});
