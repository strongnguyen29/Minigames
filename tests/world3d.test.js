const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/world3d.js'];
const BIG = { rx: 100, rz: 100 };

/* gọi w3Move nhiều lần, trả về danh sách các điểm đã đi qua */
function walk(g, from, to, step, obs, bound, radius, n) {
  g.ctx.__args = { from, to, step, obs, bound, radius, n };
  return JSON.parse(g.run(`(() => { const a = __args; let p = {x: a.from.x, z: a.from.z}, r, path = [];
    for (let i = 0; i < a.n; i++) { r = w3Move(p, a.to, a.step, a.obs, a.bound, a.radius); p = {x: r.x, z: r.z}; path.push(r); }
    return JSON.stringify(path); })()`));
}

test('đi thẳng tới đích', () => {
  const path = walk(loadGame(FILES), { x: 0, z: 0 }, { x: 1, z: 0 }, .4, [], BIG, .3, 3);
  const last = path[2];
  assert.ok(Math.abs(last.x - 1) < 1e-9 && Math.abs(last.z) < 1e-9);
  assert.equal(last.arrived, true);
  assert.equal(path[0].arrived, false);
});
test('không xuyên vật cản', () => {
  const path = walk(loadGame(FILES), { x: 0, z: 0 }, { x: 4, z: 0 }, .4, [{ x: 2, z: 0, r: 1 }], BIG, .3, 50);
  for (const p of path) assert.ok(Math.hypot(p.x - 2, p.z) >= 1.3 - 1e-6, JSON.stringify(p));
});
test('trượt quanh vật cản khi đích lệch', () => {
  const path = walk(loadGame(FILES), { x: 0, z: .5 }, { x: 4, z: .5 }, .4, [{ x: 2, z: 0, r: 1 }], BIG, .3, 100);
  for (const p of path) assert.ok(Math.hypot(p.x - 2, p.z) >= 1.3 - 1e-6);
  assert.ok(path[99].x > 3, JSON.stringify(path[99]));
});
test('không ra ngoài biên', () => {
  const path = walk(loadGame(FILES), { x: 0, z: 0 }, { x: 20, z: 0 }, .4, [], { rx: 5, rz: 3 }, .3, 100);
  for (const p of path) assert.ok(p.x <= 5 - .3 + 1e-6, JSON.stringify(p));
  assert.equal(path[99].arrived, true);
});
test('nạp file không cần Three', () => {
  const g = loadGame(FILES);
  assert.equal(g.get('typeof w3Move'), 'function');
  assert.equal(g.get('typeof w3Load'), 'function');
  assert.equal(g.get('typeof w3Create'), 'function');
  assert.equal(g.get('typeof w3Santa'), 'function');
  assert.equal(g.get('typeof w3Supported'), 'function');
  assert.equal(g.get('typeof THREE'), 'undefined');
});
test('w3Supported thả ngữ cảnh WebGL sau khi thử', () => {
  const g = loadGame(FILES);
  g.run(`var __lost=0;document.createElement=()=>({getContext:k=>k==='webgl2'?{getExtension:n=>n==='WEBGL_lose_context'?{loseContext(){__lost++}}:null}:null})`);
  assert.equal(g.get('w3Supported()'), true);
  assert.equal(g.get('__lost'), 1);
  g.run(`document.createElement=()=>({getContext:()=>({})})`);   // không có tiện ích: không lỗi
  assert.equal(g.get('w3Supported()'), true);
  g.run(`document.createElement=()=>({getContext:()=>null})`);
  assert.equal(g.get('w3Supported()'), false);
});
