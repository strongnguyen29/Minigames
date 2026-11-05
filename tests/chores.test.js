const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/chat-ui.js','js/chores.js'];
const PRE = 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;';
const setup = () => loadGame(FILES, { storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', voice: false }) }, pre: PRE });
const TODAY = 'new Date(2026,10,5)', YEST = 'choreDay(new Date(2026,10,4))', P = 'choreDay(new Date(2026,10,5))';
const NOW = 'new Date(2026,10,5,12)';

test('danh sách và chu kỳ', () => {
  const g = setup();
  assert.equal(g.get('CHORES.length'), 19); assert.equal(g.get('CHORES_WEEK.length'), 4); assert.equal(g.get('CHORES_EXTRA.length'), 2);
  assert.equal(g.get('CHORES.filter(c=>c.school).length'), 5);
  assert.equal(g.get('choreWeek(new Date(2026,10,8))'), '2026-11-2');
  assert.equal(g.get('choreWeek(new Date(2026,10,9))'), '2026-11-9');
  assert.equal(g.get('choresFor(new Date(2026,10,7)).length'), 14);
  assert.equal(g.get('choresFor(new Date(2026,10,5)).length'), 19);
});

test('báo rồi chấm: cộng sao một lần', () => {
  const g = setup();
  assert.equal(g.get(`choreReport('mac_do',${P})`), true);
  assert.equal(g.get(`choreStatus('mac_do',${P})`), 'wait');
  assert.equal(g.get(`choreReport('mac_do',${P})`), false);
  assert.equal(g.get('Object.keys(S.chore.log).length'), 1);
  assert.deepEqual(g.get(`JSON.parse(JSON.stringify(choreRate(choreKey('mac_do',${P}),4)))`), { stars: 4, box: false });
  assert.equal(g.get('S.stars'), 4); assert.equal(g.get(`choreCount('done')`), 1);
  assert.equal(g.get(`choreStatus('mac_do',${P})`), 'done');
  assert.equal(g.get(`choreRate(choreKey('mac_do',${P}),4)`), null);
  assert.equal(g.get('S.stars'), 4);
});

test('chấm việc của hôm qua và danh sách chờ', () => {
  const g = setup();
  g.run(`choreReport('mac_do',${YEST});choreReport('an_sang',${P})`);
  const pend = JSON.parse(JSON.stringify(g.get(`chorePending(${NOW})`)));
  assert.deepEqual(pend.map(p => [p.task, p.past]).sort(), [['an_sang', false], ['mac_do', true]]);
  g.run(`choreRate(choreKey('mac_do',${YEST}),3)`);
  assert.equal(g.get('S.stars'), 3);
  assert.equal(g.get(`choreStatus('mac_do',${P})`), 'todo');
  assert.equal(g.get(`chorePending(${NOW}).filter(p=>p.task==='mac_do').length`), 0);
});

test('chưa được: hôm nay báo lại được, hôm qua bị đóng', () => {
  const g = setup();
  g.run(`choreReport('mac_do',${P});choreReport('an_sang',${YEST})`);
  g.run(`choreRedo(choreKey('mac_do',${P}),${NOW});choreRedo(choreKey('an_sang',${YEST}),${NOW})`);
  assert.equal(g.get(`choreStatus('mac_do',${P})`), 'todo');
  assert.equal(g.get(`choreReport('mac_do',${P})`), true);
  assert.equal(g.get(`choreStatus('an_sang',${YEST})`), 'closed');
  assert.equal(g.get(`chorePending(${NOW}).some(p=>p.task==='an_sang')`), false);
  assert.equal(g.get(`choreReport('an_sang',${YEST})`), false);
  assert.equal(g.get('S.stars'), 0);
});

test('việc tuần: 5 sao được hộp quà', () => {
  const g = setup();
  const W = 'choreWeek(new Date(2026,10,5))';
  g.run(`choreReport('tuan_don_goc',${W});choreReport('tuan_hoc_tho',${W})`);
  assert.equal(g.get(`choreRate(choreKey('tuan_don_goc',${W}),4).box`), false);
  assert.equal(g.get(`choreCount('boxIn')`), 0);
  assert.equal(g.get(`choreRate(choreKey('tuan_hoc_tho',${W}),5).box`), true);
  assert.equal(g.get(`choreCount('boxIn')`), 1);
  assert.equal(g.get(`chorePending(${NOW}).length`), 0);
});

test('việc đột xuất: chống bấm đúp, đếm, chưa được', () => {
  const g = setup();
  const u1 = g.get(`choreReportExtra('diem10',1000)`);
  assert.ok(u1);
  assert.equal(g.get(`choreReportExtra('diem10',2500)`), null);
  const u2 = g.get(`choreReportExtra('diem10',4000)`);
  assert.ok(u2 && u2 !== u1);
  assert.equal(g.get('S.chore.extra.length'), 2);
  assert.equal(g.get(`choreRate('${u1}',5).stars`), 5);
  assert.equal(g.get(`choreCount('ten')`), 1);
  g.run(`choreRedo('${u2}')`);
  assert.equal(g.get(`S.chore.extra.find(x=>x.id==='${u2}').st`), 'closed');
  assert.equal(g.get(`chorePending(${NOW}).length`), 0);
});

test('bộ đếm huy hiệu', () => {
  const g = setup();
  g.run(`choreReport('di_ngu',${P});choreReport('an_toi',${P})`);
  const u = g.get(`choreReportExtra('vuot_thi',1000)`);
  g.run(`choreRate(choreKey('di_ngu',${P}),5);choreRate(choreKey('an_toi',${P}),3);choreRate('${u}',5)`);
  assert.equal(g.get(`choreCount('sleep')`), 1); assert.equal(g.get(`choreCount('dinner')`), 1);
  assert.equal(g.get(`choreCount('exam')`), 1); assert.equal(g.get(`choreCount('five')`), 2);
  assert.equal(g.get(`choreCount('done')`), 3);
});

test('buổi sáng trọn vẹn: ngày đi học và thứ Bảy', () => {
  for (const [d, n] of [['new Date(2026,10,5)', 7], ['new Date(2026,10,7)', 6]]) {
    const g = setup();
    assert.equal(g.get(`choresFor(${d}).filter(c=>c.grp==='sang').length`), n);
    const ids = JSON.parse(JSON.stringify(g.get(`choresFor(${d}).filter(c=>c.grp==='sang').map(c=>c.id)`)));
    const p = g.get(`choreDay(${d})`);
    ids.forEach((id, i) => {
      g.run(`choreReport('${id}','${p}');choreRate(choreKey('${id}','${p}'),3)`);
      assert.equal(g.get(`choreCount('morning')`), i === ids.length - 1 ? 1 : 0);
    });
  }
});

test('save cũ thiếu chore được bù', () => {
  const g = loadGame(FILES, { storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', chore: { log: { 'a@1-1-1': { st: 'wait' } } } }) }, pre: PRE });
  assert.deepEqual(JSON.parse(JSON.stringify(g.get('S.chore.extra'))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(g.get('S.chore.cnt'))), {});
  assert.equal(g.get(`Object.keys(S.chore.log).length`), 1);
});
