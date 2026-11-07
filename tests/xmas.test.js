const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/shop.js','js/xmas-quiz.js','js/village.js','js/xmas.js'];
const load = opts => loadGame(FILES, opts);
const plain = x => JSON.parse(JSON.stringify(x));
const NPCS = ['santa','snowman','reindeer','nutcracker'];

test('kế hoạch tất định theo ngày', () => {
  const a = plain(load().get("xmasPlan('2026-12-24')"));
  const b = plain(load().get("xmasPlan('2026-12-24')"));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const c = plain(load().get("xmasPlan('2026-12-25')"));
  assert.notEqual(JSON.stringify(a), JSON.stringify(c));
});
test('kế hoạch đúng cấu trúc', () => {
  const g = load();
  const p = plain(g.get("xmasPlan('2026-12-24')"));
  assert.ok(NPCS.includes(p.quest));
  const keys = Object.keys(p.quiz);
  assert.equal(keys.length, 3);
  assert.ok(!keys.includes(p.quest));
  for (const k of keys) assert.equal(p.quiz[k].length, 3);
  assert.equal(p.spots.length, 3);
  assert.equal(new Set(p.spots).size, 3);
  for (const s of p.spots) assert.ok(Number.isInteger(s) && s >= 0 && s <= 13);
  const bank = plain(g.get('XMAS_QUIZ'));
  for (const k of keys) for (const q of p.quiz[k]) {
    const o = bank.find(x => x.id === q.id);
    assert.equal(q.choices[q.correct], o.c[o.a]);
  }
});
test('không lặp câu trong các ngày đầu', () => {
  const g = load();
  const days = Math.floor(g.get('XMAS_QUIZ.length') / 9);
  const ids = [];
  for (let i = 0; i < days; i++) {
    const p = plain(g.get(`xmasPlan(dayStr(new Date(Date.UTC(2026,10,${6 + i}))))`));
    for (const k of Object.keys(p.quiz)) for (const q of p.quiz[k]) ids.push(q.id);
  }
  assert.equal(ids.length, days * 9);
  assert.equal(new Set(ids).size, ids.length);
});
test('đáp án đúng không dồn một vị trí', () => {
  const g = load();
  const cnt = {}; let total = 0;
  for (let i = 0; i < 30; i++) {
    const p = plain(g.get(`xmasPlan(dayStr(new Date(Date.UTC(2026,10,${6 + i}))))`));
    for (const k of Object.keys(p.quiz)) for (const q of p.quiz[k]) { cnt[q.correct] = (cnt[q.correct] || 0) + 1; total++; }
  }
  assert.ok(Math.max(...Object.values(cnt)) / total <= 0.6, JSON.stringify(cnt));
});
test('reset khi sang ngày', () => {
  const g = load();
  g.run("S.xmas={day:'2020-1-1',done:['santa'],found:[1],bonus:true}");
  assert.deepEqual(plain(g.get('xmasState()')), { day: g.get('dayStr(new Date())'), done: [], found: [], bonus: false });
});
test('sao theo số lần sai', () => {
  const g = load();
  assert.equal(g.get('xmasQuizStars(0)'), 3);
  assert.equal(g.get('xmasQuizStars(1)'), 2);
  assert.equal(g.get('xmasQuizStars(2)'), 1);
  assert.equal(g.get('xmasQuizStars(5)'), 1);
});
test('phiên đố: sai hai lần thì gợi ý, đủ 3 câu thì xong', () => {
  const g = load();
  g.run("var plan=xmasPlan(dayStr(new Date())); var npc=Object.keys(plan.quiz)[0]; var sess=xmasQuizNew(npc,plan);");
  const wrong = () => g.get('(()=>{const q=sess.qs[sess.i];return xmasQuizAnswer(sess,(q.correct+1)%q.choices.length)})()');
  const right = () => g.get('xmasQuizAnswer(sess,sess.qs[sess.i].correct)');
  let r = plain(wrong()); assert.equal(r.ok, false); assert.equal(r.hint, false);
  r = plain(wrong()); assert.equal(r.ok, false); assert.equal(r.hint, true);
  r = plain(right()); assert.equal(r.ok, true); assert.equal(r.done, false);
  r = plain(right()); assert.equal(r.ok, true); assert.equal(r.done, false);
  r = plain(right()); assert.equal(r.ok, true); assert.equal(r.done, true); assert.equal(r.stars, 1);
});
test('xong việc cộng sao một lần; đủ 4 việc thêm 3', () => {
  const g = load();
  g.run('var today=dayStr(new Date()); S.stars=0;');
  assert.deepEqual(plain(g.get("xmasComplete('santa',3,today)")), { stars: 3, bonus: 0 });
  assert.equal(g.get("xmasComplete('santa',3,today)"), null);
  assert.equal(g.get('S.stars'), 3);
  g.run("xmasComplete('snowman',3,today);xmasComplete('reindeer',3,today);");
  assert.deepEqual(plain(g.get("xmasComplete('nutcracker',3,today)")), { stars: 3, bonus: 3 });
  assert.equal(g.get('S.stars'), 15);
  assert.deepEqual(plain(g.get('xmasProgress()')), { done: 4, total: 4 });
});
test('việc của ngày cũ không ghi vào hôm nay', () => {
  const g = load();
  g.run('S.stars=0');
  assert.equal(g.get("xmasComplete('santa',3,'2020-1-1')"), null);
  assert.equal(g.get('S.stars'), 0);
});
test('nhặt đồ và trạng thái quay lại', () => {
  const g = load();
  g.run('var today=dayStr(new Date()); var plan=xmasPlan(today);');
  const spots = plain(g.get('plan.spots'));
  const other = [0,1,2,3,4,5,6,7,8,9,10,11,12,13].find(i => !spots.includes(i));
  assert.equal(g.get(`xmasPickup(${other},today)`), false);
  assert.equal(g.get('xmasStatus(plan.quest)'), 'quest');
  for (const s of spots) {
    assert.equal(g.get(`xmasPickup(${s},today)`), true);
    if (s !== spots[2]) assert.equal(g.get('xmasStatus(plan.quest)'), 'quest');
  }
  assert.equal(g.get(`xmasPickup(${spots[0]},today)`), false);
  assert.equal(g.get('xmasStatus(plan.quest)'), 'return');
});
test('bộ đồ: mặc định đứng đầu, thêm đồ đã mua', () => {
  const g = load();
  g.run("S.owned=['fashion/pink-dress']");
  assert.deepEqual(plain(g.get('xmasOutfits().map(o=>o.id)')), ['default', 'fashion/pink-dress']);
  assert.equal(g.get('xmasOutfits()[0].src'), 'images/shop-items/fashion/characters-cutout/white-dress.webp');
});
test('bộ đồ đã lưu không còn thì về mặc định', () => {
  const g = load();
  g.run("S.owned=['fashion/pink-dress']; xmasSetOutfit('fashion/pink-dress')");
  assert.equal(g.get('xmasOutfit().id'), 'fashion/pink-dress');
  g.run('S.owned=[]');
  assert.equal(g.get('xmasOutfit().id'), 'default');
});
test('localStorage hỏng vẫn chạy', () => {
  const g = load();
  g.run('localStorage.getItem=()=>{throw 1}; localStorage.setItem=()=>{throw 1}');
  assert.equal(g.get('xmasOutfit().id'), 'default');
  g.run("xmasSetOutfit('fashion/pink-dress')");
});

test('kế hoạch Noel không đổi sau khi tách code chung', () => {
  const g = load();
  const s = JSON.stringify(['2026-12-24','2027-2-6','2027-7-1'].map(d => g.get(`xmasPlan('${d}')`)));
  assert.equal(require('crypto').createHash('sha1').update(s).digest('hex'), '5602fffe08c8c9302805609f800f2105c3b9c799');
});
