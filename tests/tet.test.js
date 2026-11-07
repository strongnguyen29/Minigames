const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/shop.js','js/xmas-quiz.js','js/tet-quiz.js','js/village.js','js/xmas.js','js/tet.js'];
const load = opts => loadGame(FILES, opts);
const plain = x => JSON.parse(JSON.stringify(x));
const NPCS = ['ongdo','seller','lion','goat'];
const TOPICS = ['food','flower','custom','manners','zodiac','tao','math'];
/* chuỗi ngày dạng 'Y-M-D' cách '2027-2-6' n ngày (tính theo UTC như dayNum) */
const dayAfter = n => { const d = new Date(Date.UTC(2027, 1, 6 + n)); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); };

test('kho câu Tết hợp lệ', () => {
  const q = plain(load().get('TET_QUIZ'));
  assert.ok(q.length >= 80 && q.length <= 100, String(q.length));
  const ids = q.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id, i) => {
    assert.match(id, /^tq\d{3}$/);
    assert.equal(id, 'tq' + String(i + 1).padStart(3, '0'));
  });
  for (const x of q) {
    assert.equal(x.c.length, 3, x.id);
    assert.equal(new Set(x.c).size, 3, x.id);
    assert.ok(Number.isInteger(x.a) && x.a >= 0 && x.a <= 2, x.id);
    assert.ok(x.q.length <= 80, x.id);
    assert.ok(x.q.split(/\s+/).length <= 15, x.id);
    assert.ok(TOPICS.includes(x.t), x.id);
  }
  for (const t of TOPICS) assert.ok(q.filter(x => x.t === t).length >= 5, t);
});
test('câu đố không có "năm nay" và không gọi năm Mùi là Cừu', () => {
  for (const x of plain(load().get('TET_QUIZ'))) {
    for (const s of [x.q, ...x.c]) {
      const l = s.toLowerCase();
      assert.ok(!l.includes('năm nay'), x.id + ' ' + s);
      assert.ok(!l.includes('cừu'), x.id + ' ' + s);
    }
  }
});
test('kế hoạch Tết tất định và khác Noel cùng ngày', () => {
  const a = plain(load().get("TET_V.plan('2027-2-6')"));
  const b = plain(load().get("TET_V.plan('2027-2-6')"));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.ok(NPCS.includes(a.quest));
  const ids = Object.values(a.quiz).flat().map(x => x.id);
  assert.equal(ids.length, 9);
  ids.forEach(id => assert.ok(id.startsWith('tq'), id));
  const x = plain(load().get("xmasPlan('2027-2-6')"));
  const xids = new Set(Object.values(x.quiz).flat().map(q => q.id));
  ids.forEach(id => assert.ok(!xids.has(id), id));
});
test('không lặp câu trong các ngày đầu', () => {
  const g = load();
  const days = Math.floor(g.get('TET_QUIZ.length') / 9);
  assert.equal(g.get(`dayNum('${dayAfter(1)}')-dayNum('2027-2-6')`), 1);
  const seen = [];
  for (let i = 0; i < days; i++) {
    const p = plain(g.get(`TET_V.plan('${dayAfter(i)}')`));
    Object.values(p.quiz).flat().forEach(q => seen.push(q.id));
  }
  assert.equal(seen.length, days * 9);
  assert.equal(new Set(seen).size, seen.length);
});
test('làng Tết ghi vào S.tet, không đụng S.xmas', () => {
  const g = load();
  g.run('var today=dayStr(new Date()); S.stars=0; xmasState();');
  for (const n of NPCS) g.run(`TET_V.complete('${n}',3,today)`);
  assert.equal(g.get('S.stars'), 15);
  assert.equal(g.get('S.tet.bonus'), true);
  assert.deepEqual(plain(g.get('S.xmas.done')), []);
  assert.equal(g.get('xmasProgress().done'), 0);
});
test('đủ nhóm lời làng Tết', () => {
  const g = loadGame(['js/lines.js']);
  const groups = ['tet_outfit','tet_enter','tet_quiz','tet_quest','tet_found','tet_all_done'];
  for (const n of NPCS) groups.push(`tet_${n}_hi`, `tet_${n}_thanks`);
  assert.equal(groups.length, 14);
  for (const k of groups) assert.ok(g.get(`LINES['${k}']`) && g.get(`LINES['${k}'].length`) >= 1, k);
  assert.equal(g.get('LINE_VOICES.tet_ongdo_hi'), '1wg2wOjdEWKA7yQD8Kca');
  assert.equal(g.get('LINE_VOICES.tet_ongdo_thanks'), '1wg2wOjdEWKA7yQD8Kca');
  for (const k of g.get('Object.keys(LINE_VOICES)')) assert.ok(g.get(`LINES['${k}']`), k);
});
test('dữ liệu năm và nhân vật Tết', () => {
  const g = load();
  assert.deepEqual(plain(g.get('TET_YEAR')), { year: 2027, canchi: 'Đinh Mùi', animal: 'Dê', sign: 'Làng Tết 2027' });
  assert.deepEqual(plain(g.get('TET_NPCS')).map(n => n.id), NPCS);
  assert.deepEqual(plain(g.get('TET_ITEMS')).map(n => n.id), ['lixi','banh','quat','lantern','mai']);
  assert.equal(g.get('TET_SPOTS.length'), 14);
});
