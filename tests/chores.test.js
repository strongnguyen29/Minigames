const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/pattern.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/chat-ui.js','js/chores.js'];
const PRE = 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;';
const setup = () => loadGame(FILES, { storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', voice: false }) }, pre: PRE });
const TODAY = 'new Date(2026,10,5)', YEST = 'choreDay(new Date(2026,10,4))', P = 'choreDay(new Date(2026,10,5))';
const plain = x => JSON.parse(JSON.stringify(x));
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

test('câu khoá: hợp lệ, đúng đáp án', () => {
  const g = setup();
  for (let i = 0; i < 2000; i++) {
    const q = JSON.parse(JSON.stringify(g.get('lockQuestion()')));
    const t = q.text.split(' ');
    const nums = t.filter((_, j) => j % 2 === 0), ops = t.filter((_, j) => j % 2 === 1);
    assert.equal(nums.length, 3, q.text);
    assert.ok(q.answer >= 10, q.text);
    assert.ok(ops.some(o => o === '+' || o === '−'), q.text);
    ops.forEach((o, j) => { if (o === '×' || o === '÷') { assert.notEqual(nums[j], '1', q.text); assert.notEqual(nums[j + 1], '1', q.text); } if (o === '÷') assert.notEqual(nums[j], nums[j + 1], q.text); });
    nums.forEach(x => assert.ok(/^\d+$/.test(x) && +x >= 1 && +x <= 10, q.text));
    ops.forEach(o => assert.ok('+−×÷'.includes(o), q.text));
    assert.ok(ops.some(o => o === '×' || o === '÷'), q.text);
    const js = t.map(x => ({ '−': '-', '×': '*', '÷': '/' }[x] || x)).join(' ');
    assert.equal(Function(`return ${js}`)(), q.answer, q.text);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0, q.text);
    // gộp × ÷ trước, rồi + − từ trái sang phải
    const v = [+nums[0]], o2 = [];
    ops.forEach((o, j) => {
      const b = +nums[j + 1];
      if (o === '×') v[v.length - 1] *= b;
      else if (o === '÷') { assert.equal(v[v.length - 1] % b, 0, q.text); v[v.length - 1] /= b; }
      else { v.push(b); o2.push(o); }
    });
    let acc = v[0];
    o2.forEach((o, j) => { acc = o === '+' ? acc + v[j + 1] : acc - v[j + 1]; assert.ok(acc >= 0, q.text); });
    assert.equal(acc, q.answer, q.text);
  }
  /* tần suất đáp án: 20000 mẫu cho ổn định (đỉnh thật ~2.5%) */
  const freq = {}, N = 20000;
  for (let i = 0; i < N; i++) { const a = g.get('lockQuestion().answer'); freq[a] = (freq[a] || 0) + 1; }
  assert.ok(Math.max(...Object.values(freq)) <= N * 0.03, JSON.stringify(freq));
});

test('chế độ bố mẹ tự khoá sau 5 phút', () => {
  const g = setup();
  assert.equal(g.get('PARENT_IDLE_MS'), 300000);
  assert.equal(g.get('parentOn(0)'), false);
  g.run('parentOpen(0)');
  assert.equal(g.get('parentOn(299999)'), true);
  assert.equal(g.get('parentOn(300000)'), false);
  g.run('parentOpen(0);parentTouch(200000)');
  assert.equal(g.get('parentOn(450000)'), true);
  g.run('parentLock()');
  assert.equal(g.get('parentOn(1)'), false);
});

/* ---- Task 4: hộp quà, dọn lịch sử ---- */
const withBox = (g, n = 1) => g.run(`S.chore.cnt.A={boxIn:${n}}`);
test('choreBoxPrize: ngưỡng cộng dồn 35/60/80/100', () => {
  const g = setup();
  for (const [r, k] of [[0.10, 'sticker'], [0.40, 'talk'], [0.65, 'song'], [0.90, 'dress']]) assert.equal(g.get(`choreBoxPrize(()=>${r}).kind`), k);
});
test('choreBoxPrize: loại hết món thì chọn lại, chỉ còn talk thì luôn talk', () => {
  const g = setup();
  g.run('S.stickers=[...STICKERS]');
  assert.notEqual(g.get('choreBoxPrize(()=>0.10).kind'), 'sticker');
  g.run('SHOP_ITEMS.forEach(x=>S.owned.push(x.id));RADIO_ITEMS.filter(x=>x.price>0).forEach(x=>S.songs.push(x.id))');
  for (const r of [0.1, 0.5, 0.9]) assert.equal(g.get(`choreBoxPrize(()=>${r}).kind`), 'talk');
});
test('choreBoxPrize: hết sạch thì +5 sao', () => {
  const g = setup();
  g.run(`S.stickers=[...STICKERS];SHOP_ITEMS.forEach(x=>S.owned.push(x.id));RADIO_ITEMS.filter(x=>x.price>0).forEach(x=>S.songs.push(x.id));CHORE_BOX_ODDS=[['sticker',1]]`);
  assert.deepEqual(g.get('JSON.parse(JSON.stringify(choreBoxPrize()))'), { kind: 'stars', value: 5 });
});
test('choreBoxOpen: bài hát là quà, không trừ sao', () => {
  const g = setup(); withBox(g, 2); g.run('S.stars=7');
  const b = g.get('balance()');
  const p = g.get('JSON.parse(JSON.stringify(choreBoxOpen(()=>0.65)))');
  assert.equal(p.kind, 'song');
  assert.ok(g.get(`S.songs.includes('${p.value}')&&S.giftSongs.includes('${p.value}')`));
  assert.equal(g.get('balance()'), b); assert.equal(g.get('choreBoxes()'), 1);
});
test('choreBoxOpen: váy vào owned và giftOwned, balance không đổi', () => {
  const g = setup(); withBox(g); g.run('S.stars=7');
  const p = g.get('JSON.parse(JSON.stringify(choreBoxOpen(()=>0.9)))');
  assert.equal(p.kind, 'dress');
  assert.ok(g.get(`owns('${p.value}')&&S.giftOwned.includes('${p.value}')`));
  assert.equal(g.get('balance()'), 7);
});
test('choreBoxOpen: talk +5 và không hết hạn; hết hộp thì null', () => {
  const g = setup(); withBox(g);
  assert.equal(g.get('choreBoxOpen(()=>0.4).kind'), 'talk');
  assert.equal(g.get('talkLeft()'), 15);
  g.run(`S.talk.day='2000-1-1'`);
  assert.equal(g.get('talkLeft()'), g.get('TALK_FREE+5'));
  assert.equal(g.get('choreBoxOpen()'), null);
});
test('chorePrune: bỏ done cũ, giữ wait và done mới, cnt không đổi', () => {
  const g = setup();
  g.run(`const D=n=>choreDay(new Date(2026,10,5-n));
    S.chore.log[choreKey('mac_do',D(15))]={st:'done',t:1};S.chore.log[choreKey('an_sang',D(30))]={st:'wait',t:1};
    S.chore.log[choreKey('rua_tay',D(13))]={st:'done',t:1};S.chore.log[choreKey('cat_cap',D(20))]={st:'closed',t:1};
    S.chore.log[choreKey('tuan_doc_truyen','2026-9-21')]={st:'done',t:1};S.chore.log[choreKey('tuan_hoc_tho','2026-10-5')]={st:'done',t:1};
    S.chore.extra=[{id:'a',task:'diem10',st:'done',t:new Date(2026,10,5-15).getTime()},{id:'b',task:'diem10',st:'done',t:new Date(2026,10,5-13).getTime()},{id:'c',task:'diem10',st:'wait',t:1}];
    S.chore.cnt.A={done:3}`);
  g.run(`chorePrune(${NOW})`);
  assert.deepEqual(g.get('Object.keys(S.chore.log).sort()').map(String), ['an_sang@' + g.get('choreDay(new Date(2026,10,5-30))'), 'rua_tay@' + g.get('choreDay(new Date(2026,10,5-13))'), 'tuan_hoc_tho@2026-10-5'].sort());
  assert.deepEqual(plain(g.get('S.chore.extra.map(x=>x.id)')), ['b', 'c']);
  assert.equal(g.get(`choreCount('done')`), 3);
});

/* ---- Task 5: huy hiệu ---- */
const DAYS7 = [2, 3, 4, 5, 6, 7, 8];
const doneDay = (g, d, skip) => g.run(`{const dt=new Date(2026,10,${d}),p=choreDay(dt);choresFor(dt).forEach(c=>{if(c.id!=='${skip||''}')S.chore.log[choreKey(c.id,p)]={st:'done',n:3,t:1}})}`);
test('BADGES có đủ 16 huy hiệu chăm ngoan', () => {
  const g = setup();
  for (const id of ['c_first','c_five','c_20','c_100','c_300','c_day','c_day3','c_day7','c_box','c_week','c_morning','c_sleep','c_dinner','c_ten1','c_ten10','c_exam'])
    assert.ok(g.get(`BADGES.some(b=>b.id==='${id}')`), id);
});
test('7 ngày liên tiếp chấm hết: choreGreatRun=7 và có c_day7', () => {
  const g = setup(); DAYS7.forEach(d => doneDay(g, d));
  assert.equal(g.get('choreGreatRun()'), 7);
  assert.ok(g.get(`checkBadges().some(b=>b.id==='c_day7')`));
});
test('bỏ một việc ở ngày giữa thì chuỗi còn 3', () => {
  const g = setup(); DAYS7.forEach(d => doneDay(g, d, d === 5 ? 'mac_do' : ''));
  assert.equal(g.get('choreGreatRun()'), 3);
});
test('c_week: 4 việc tuần 5 sao có, chỉ 3 thì không', () => {
  const g = setup();
  g.run(`CHORES_WEEK.slice(0,3).forEach(c=>S.chore.log[choreKey(c.id,'2026-11-2')]={st:'done',n:5,t:1})`);
  assert.equal(g.get('chorePerfectWeek()'), false);
  assert.ok(!g.get(`checkBadges().some(b=>b.id==='c_week')`));
  g.run(`S.chore.log[choreKey(CHORES_WEEK[3].id,'2026-11-2')]={st:'done',n:5,t:1}`);
  assert.equal(g.get('chorePerfectWeek()'), true);
  assert.ok(g.get(`checkBadges().some(b=>b.id==='c_week')`));
});
test('lần chấm đầu tiên cho c_first', () => {
  const g = setup(); g.run(`choreReport('mac_do',${P});choreRate(choreKey('mac_do',${P}),3)`);
  assert.ok(g.get(`checkBadges().some(b=>b.id==='c_first')`));
});
