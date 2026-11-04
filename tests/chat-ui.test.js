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

test('chatRecStart: máy không có micro thì ném ChatError mic; chatRecStop khi chưa thu trả null', async () => {
  const g = loadGame(['js/core.js', 'js/chat.js', 'js/chat-ui.js']);
  const kind = await g.get('chatRecStart()').then(() => null, e => e.kind);
  assert.equal(kind, 'mic');
  assert.equal(g.get('chatRecStop()'), null);
});
