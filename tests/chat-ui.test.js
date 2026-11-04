const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');

/* Hẹn giờ giả: chỉ chạy khi test gọi fire() */
function gesture(opts = {}) {
  const g = loadGame(['js/core.js', 'js/chat.js', 'js/chat-ui.js']);
  const log = [], timers = new Map(); let n = 0;
  g.ctx.__cb = {
    onTap: () => log.push('tap'), onHold: () => log.push('hold'), onRelease: () => log.push('release'),
    setT: fn => { timers.set(++n, fn); return n; }, clearT: id => timers.delete(id), ...opts
  };
  const h = g.get('holdGesture({holdMs:350,...__cb})');
  return { h, log, fire: () => { [...timers.values()].forEach(f => f()); timers.clear(); }, timers };
}

test('holdGesture: chạm nhanh chỉ gọi onTap', () => {
  const { h, log, timers } = gesture();
  h.down(); h.up();
  assert.deepEqual(log, ['tap']); assert.equal(timers.size, 0);
});
test('holdGesture: giữ qua ngưỡng gọi onHold một lần, thả thì onRelease và không onTap', () => {
  const { h, log, fire } = gesture();
  h.down(); fire(); h.up();
  assert.deepEqual(log, ['hold', 'release']);
});
test('holdGesture: cancel giữa lúc đang giữ thì onRelease một lần', () => {
  const { h, log, fire } = gesture();
  h.down(); fire(); h.cancel(); h.cancel(); h.up();
  assert.deepEqual(log, ['hold', 'release']);
});
test('holdGesture: cancel trước ngưỡng thì không gọi gì', () => {
  const { h, log, timers } = gesture();
  h.down(); h.cancel();
  assert.deepEqual(log, []); assert.equal(timers.size, 0);
});
test('holdGesture: down hai lần liên tiếp không tạo hai hẹn giờ', () => {
  const { h, log, fire, timers } = gesture();
  h.down(); h.down();
  assert.equal(timers.size, 1);
  fire();
  assert.deepEqual(log, ['hold']);
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
