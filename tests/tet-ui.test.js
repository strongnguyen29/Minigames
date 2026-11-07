const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/chat-ui.js','js/chores.js','js/chores-ui.js',
  'js/sync.js','js/ui.js','js/xmas-quiz.js','js/tet-quiz.js','js/village.js','js/xmas.js','js/tet.js','js/world3d.js','js/tet-models.js',
  'js/village-ui.js','js/xmas-ui.js','js/tet-ui.js'];
const PRE = 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;';
const STORE = { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', voice: false, sfx: false, music: false }) };
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));

function setup() {
  const g = loadGame(FILES, { pre: PRE, storage: STORE });
  /* world giả: không cần WebGL */
  g.run(`var __marks={};vilWorld={dispose(){},walkTo(){},onTap(){},onPickup(){},onFrame(){},
    setMark(id,t){__marks[id]=t}};VIL_NEXT_MS=0;`);
  return g;
}

test('không có WebGL thì báo Làng Tết đang ngủ', () => {
  const g = loadGame(FILES, { pre: PRE, storage: STORE });
  g.run('w3Supported=()=>false;tetVillage()');
  assert.match(g.get('app.innerHTML'), /xfail/);
  assert.match(g.get('app.innerHTML'), /Làng Tết/);
});

test('màn chọn đồ làng Tết', () => {
  const g = loadGame(FILES, { pre: PRE, storage: STORE });
  g.run('tetHome()');
  const h = g.get('app.innerHTML');
  assert.match(h, /id="xgo"/);
  assert.ok(h.includes('🧧'));
  assert.ok(h.includes('Làng Tết'));
});

test('đố trong làng Tết cộng sao vào S.tet', async () => {
  const g = setup();
  g.run('vilCfg=TET_UI;vilReady=true');
  const id = g.get('Object.keys(TET_V.plan(TET_V.state().day).quiz)[0]');
  g.run(`tetTalk('${id}')`);
  assert.ok(g.get('vilSess'), 'phải mở phiên đố');
  const q0 = g.get('vilSess.qs[0].q');
  assert.match(g.get('vilSess.qs[0].id'), /^tq/);
  assert.ok(g.get("document.querySelector('#xdlg').innerHTML").includes(g.get('esc(vilSess.qs[0].q)')), q0);
  for (let k = 0; k < 3; k++) { g.run('vilChoose(vilSess.qs[vilSess.i].correct)'); await tick(); }
  assert.ok(g.get('S.tet.done').includes(id));
  assert.equal(g.get('S.xmas.done.length'), 0);
});

test('chuyển làng không mang trạng thái theo', () => {
  const g = setup();
  g.run('vilCfg=XMAS_UI;vilQuestDay.xmas=xmasState().day;vilPicks={1:"…"};w3Supported=()=>false');
  g.run('go(tetVillage)');
  assert.equal(g.get('vilSess'), null);
  assert.equal(g.get('Object.keys(vilPicks).length'), 0);
  assert.equal(g.get('vilCfg===TET_UI'), true);
  assert.equal(g.get('S.tet.found.length'), 0);
  assert.equal(g.get('vilQuestOn()'), false);
});

test('sang ngày mới dựng lại làng Tết', async () => {
  const g = setup();
  /* setTimeout giả chạy ngay để khỏi chờ 1,5 giây */
  g.run('vilCfg=TET_UI;vilReady=true;vilPlanCur=TET_V.plan("2000-1-1");w3Supported=()=>false;setTimeout=(f)=>{f();return 1}');
  g.run("tetTalk('ongdo')");
  assert.equal(g.get('vilCfg===TET_UI'), true);
  const h = g.get('app.innerHTML');
  assert.ok(/vil-tet/.test(h) || (/xfail/.test(h) && /Làng Tết/.test(h)), h.slice(0, 200));
});

test('thẻ trang chủ có Làng Tết với tiến độ riêng', () => {
  const g = loadGame(FILES, { pre: PRE, storage: STORE });
  g.run('var __p=TET_V.plan(TET_V.state().day);TET_V.complete(Object.keys(__p.quiz)[0],3,__p.day)');
  g.run('home()');
  const cards = g.get("[...app.innerHTML.matchAll(/<button class=\"gc[^>]*>([\\s\\S]*?)<\\/button>/g)].map(m=>m[1])");
  const tet = cards.find(c => c.includes('Làng Tết')), xmas = cards.find(c => c.includes('Làng Giáng Sinh'));
  assert.ok(tet, 'thiếu thẻ Làng Tết');
  assert.ok(tet.includes('1/4'), tet);
  assert.ok(xmas && xmas.includes('0/4'), xmas);
  assert.ok(g.get('app.innerHTML').includes('🧧'));
});

test('chỗ giấu và nhân vật nằm trong biên', () => {
  const g = loadGame(FILES, { pre: PRE });
  const M = JSON.parse(g.get('JSON.stringify(TET_MAP)'));
  const spots = JSON.parse(g.get('JSON.stringify(TET_SPOTS)'));
  const around = JSON.parse(g.get('JSON.stringify(TET_UI.around)'));
  assert.equal(spots.length, 14);
  assert.deepEqual(M.bound, { rx: 24, rz: 16 });
  assert.deepEqual(Object.keys(M.npcs), ['ongdo', 'seller', 'lion', 'goat']);
  const npcs = Object.entries(M.npcs).map(([id, n]) => ({ id, ...n }));
  const inB = p => (p.x / M.bound.rx) ** 2 + (p.z / M.bound.rz) ** 2 < .85;
  for (const p of spots.concat(npcs)) assert.ok(inB(p), 'ngoài biên ' + JSON.stringify(p));
  for (const n of npcs) assert.ok(inB(n.meet), n.id + ' meet ngoài biên');
  for (const s of spots) {
    const tag = JSON.stringify(s);
    assert.ok(Math.hypot(s.x - around.x, s.z - around.z) > around.r, 'trong vòng chợ ' + tag);
    for (const n of npcs) assert.ok(Math.hypot(s.x - n.x, s.z - n.z) >= 1.5, `gần ${n.id}: ${tag}`);
  }
});
