const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/world3d.js', 'js/tet-models.js'];

/* THREE giả tối thiểu: đủ để dựng cây đối tượng, không vẽ gì; canvas giả có ngữ cảnh 2D nuốt mọi lệnh */
const PRE = `
var __ctx2d = new Proxy({}, { get: (o, k) => k in o ? o[k] : () => ({ addColorStop() {} }), set: (o, k, v) => (o[k] = v, true) });
var __mkEl = document.createElement;
document.createElement = t => { const el = __mkEl(t); if (t === 'canvas') el.getContext = () => __ctx2d; return el; };
function __v3() { return { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; },
  setScalar(s) { this.x = this.y = this.z = s; return this; }, multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; } }; }
class __Obj { constructor() { this.position = __v3(); this.rotation = __v3(); this.scale = __v3().setScalar(1); this.children = []; this.userData = {}; }
  add(...c) { this.children.push(...c); return this; } }
var THREE = {
  Group: class extends __Obj {}, Mesh: class extends __Obj { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; } },
  CanvasTexture: class { constructor(img) { this.image = img; } }, SRGBColorSpace: 'srgb', DoubleSide: 2
};
for (const n of ['BoxGeometry', 'CylinderGeometry', 'ConeGeometry', 'SphereGeometry', 'TorusGeometry', 'PlaneGeometry', 'CircleGeometry', 'IcosahedronGeometry', 'DodecahedronGeometry', 'OctahedronGeometry', 'CapsuleGeometry'])
  THREE[n] = class { constructor(...a) { this.args = a; } };
for (const n of ['MeshStandardMaterial', 'MeshLambertMaterial', 'MeshBasicMaterial'])
  THREE[n] = class { constructor(o) { Object.assign(this, o); } };
`;
const SCENE = ['house', 'gate', 'lanternString', 'peach', 'apricot', 'kumquat', 'bamboo', 'tree', 'pot', 'banhStack', 'stage', 'altar'];
const CHARS = ['ongdo', 'seller', 'lion', 'goat'];
const GOODS = ['fruit', 'banh', 'flower', 'lantern', 'couplet'];
const ITEMS = ['lixi', 'banh', 'quat', 'lantern', 'mai'];

test('tetKit có đủ hàm, mỗi hàm trả nhóm có con', () => {
  const g = loadGame(FILES, { pre: PRE });
  g.run('var K = tetKit(THREE)');
  const call = expr => { const o = g.get(expr); assert.ok(o && o.children.length > 0, expr); return o; };
  for (const n of SCENE.concat(CHARS)) call(`K.${n}(${n === 'gate' ? "'Làng Tết 2027'" : n === 'lanternString' ? '6' : ''})`);
  for (const s of GOODS) call(`K.stall('${s}')`);
  for (const id of ITEMS) call(`K.item('${id}')`);
});
test('nồi bánh chưng có lửa lập loè qua tick', () => {
  const g = loadGame(FILES, { pre: PRE });
  g.run('var P = tetKit(THREE).pot()');
  assert.equal(g.get('typeof P.userData.tick'), 'function');
  g.run('P.userData.tick(1.3)');
});
test('chữ trên cổng lấy từ tham số text', () => {
  const g = loadGame(FILES, { pre: PRE });
  g.run(`var __txt = []; __ctx2d.fillText = s => __txt.push(s); tetKit(THREE).gate('Chào Xuân')`);
  assert.ok(g.get('__txt.join("|")').includes('Chào Xuân'));
});
test('gọi tetKit hai lần ra hai bộ material khác nhau', () => {
  const g = loadGame(FILES, { pre: PRE });
  const mats = expr => { g.run(`var __m = new Set(); (function walk(o){ if (o.material) __m.add(o.material); o.children.forEach(walk); })(${expr})`); return g.get('__m'); };
  g.run('var A = tetKit(THREE), B = tetKit(THREE)');
  const a = mats('A.house()'), b = mats('B.house()');
  assert.ok(a.size > 0);
  for (const m of a) assert.ok(!b.has(m), 'material bị dùng chung giữa hai kit');
  /* trong cùng một kit, cùng màu thì cùng material */
  const a2 = mats('A.house()');
  for (const m of a2) assert.ok(a.has(m), 'cùng kit phải dùng lại material');
});
