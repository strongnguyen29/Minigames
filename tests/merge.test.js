const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js'];
const load = opts => loadGame(FILES, opts);
const plain = x => JSON.parse(JSON.stringify(x));
const merge = (a, b, price = () => 0) => { const g = load(); g.ctx.__a = a; g.ctx.__b = b; g.ctx.__p = price; return plain(g.get('mergeSave(__a,__b,__p)')); };

test('sao hai máy cộng dồn', () => {
  const r = merge({ stars:10, earned:{ A:{ stars:10, rounds:2, perfect:1 } } }, { stars:8, earned:{ B:{ stars:8, rounds:1, perfect:0 } } });
  assert.equal(r.stars, 18); assert.equal(r.rounds, 3); assert.equal(r.perfect, 1);
  assert.ok(r.earned.A && r.earned.B);
});
test('foldEarned gán phần chênh cho máy hiện tại', () => {
  const g = load();
  g.ctx.__s = { stars:30, earned:{ X:{ stars:12 } } };
  assert.equal(g.get("foldEarned(__s,'Y').earned.Y.stars"), 18);
  g.ctx.__o = { stars:40 };
  assert.equal(g.get("foldEarned(__o,'Y').earned.Y.stars"), 40);
});
test('spent tính lại từ owned', () => {
  const price = id => ({ a:15, b:20 })[id] || 0;
  const r = merge({ owned:['a'], giftOwned:[] }, { owned:['b'], giftOwned:['b'] }, price);
  assert.equal(r.spent, 15); assert.deepEqual(r.owned, ['a','b']);
});
test('best lấy max từng khoá, stickers hợp không trùng', () => {
  const r = merge({ best:{ 'count-0':3, 'add-2':1 }, stickers:['🐶','🐱'] }, { best:{ 'add-2':2, 'cmp-1':1 }, stickers:['🐱','🐰'] });
  assert.deepEqual(r.best, { 'count-0':3, 'add-2':2, 'cmp-1':1 });
  assert.deepEqual(r.stickers, ['🐶','🐱','🐰']);
});
test('streak theo lastDay mới hơn, so sánh đúng 2026-11-10 > 2026-11-9', () => {
  const r = merge({ streak:5, lastDay:'2026-11-9' }, { streak:2, lastDay:'2026-11-10' });
  assert.equal(r.lastDay, '2026-11-10'); assert.equal(r.streak, 2);
  const e = merge({ streak:5, lastDay:'2026-11-9' }, { streak:7, lastDay:'2026-11-9' });
  assert.equal(e.streak, 7);
});
test('tên theo profileUpdatedAt mới hơn; cài đặt âm thanh luôn của local', () => {
  const r = merge({ name:'Mai', avatar:'🐱', profileUpdatedAt:1, sound:false, voice:false, sfx:false, music:false },
                  { name:'Lan', avatar:'🐶', profileUpdatedAt:2, sound:true, voice:true, sfx:true, music:true });
  assert.equal(r.name, 'Lan'); assert.equal(r.avatar, '🐶'); assert.equal(r.profileUpdatedAt, 2);
  assert.equal(r.sound, false); assert.equal(r.voice, false); assert.equal(r.sfx, false); assert.equal(r.music, false);
});
test('gifts và luckyGifts đi theo cặp của bên nhiều quà hơn', () => {
  const r = merge({ gifts:2, luckyGifts:[1,2] }, { gifts:5, luckyGifts:[3] });
  assert.equal(r.gifts, 5); assert.deepEqual(r.luckyGifts, [3]);
  const e = merge({ gifts:3, luckyGifts:[1] }, { gifts:3, luckyGifts:[9] });
  assert.deepEqual(e.luckyGifts, [1]);
});
test('trường lạ lấy theo savedAt mới hơn', () => {
  const r = merge({ x:'cũ', savedAt:1 }, { x:'mới', savedAt:2 });
  assert.equal(r.x, 'mới'); assert.equal(r.savedAt, 2);
  assert.equal(merge({ x:'cũ', savedAt:3 }, { x:'mới', savedAt:2 }).x, 'cũ');
});
test('deviceId giữ nguyên qua hai lần gọi và lưu ở be_vui_device_v1', () => {
  const g = load();
  const a = g.get('deviceId()'), b = g.get('deviceId()');
  assert.ok(a && a === b);
  assert.equal(g.ctx.__store.get('be_vui_device_v1'), a);
  assert.equal(g.get('DEVICE_KEY'), 'be_vui_device_v1');
});
test('save() đặt savedAt; dữ liệu cũ nạp vào có earned={} và không mất trường nào', () => {
  const g = load({ storage:{ be_vui_hoc_toan_v1: JSON.stringify({ name:'Mai', stars:40, owned:['a'] }) } });
  assert.deepEqual(plain(g.get('S.earned')), {});
  assert.equal(g.get('S.name'), 'Mai'); assert.equal(g.get('S.stars'), 40); assert.deepEqual(plain(g.get('S.owned')), ['a']);
  assert.equal(g.get('S.savedAt'), 0);
  g.run('save()');
  assert.ok(JSON.parse(g.ctx.__store.get('be_vui_hoc_toan_v1')).savedAt > 0);
});
test('máy mới (tên rỗng) gộp với bản có tên thì giữ tên, dù profileUpdatedAt bằng nhau', () => {
  const r = merge({ name:'', avatar:'🐱', profileUpdatedAt:0 }, { name:'Mai', avatar:'🐶', profileUpdatedAt:0 });
  assert.equal(r.name, 'Mai'); assert.equal(r.avatar, '🐶');
  const r2 = merge({ name:'Mai', avatar:'🐶', profileUpdatedAt:0 }, { name:'', avatar:'🐱', profileUpdatedAt:9 });
  assert.equal(r2.name, 'Mai');
});
test('reset: freshSave có earned riêng, foldEarned không làm bẩn DEF', () => {
  const g = load();
  g.run("S=freshSave();S.stars=5;foldEarned(S,'Y')");
  assert.deepEqual(plain(g.get('DEF.earned')), {});
  assert.equal(g.get('S.earned.Y.stars'), 5);
});
const merge4 = (a, b, base) => { const g = load(); g.ctx.__a = a; g.ctx.__b = b; g.ctx.__c = base; return plain(g.get('mergeSave(__a,__b,()=>0,__c)')); };
test('gộp 3 chiều cho quà: chỉ local đổi thì lấy local (mở quà không bị trả lại)', () => {
  const r = merge4({ gifts:1, luckyGifts:[2] }, { gifts:2, luckyGifts:[1,2] }, { gifts:2, luckyGifts:[1,2] });
  assert.equal(r.gifts, 1); assert.deepEqual(r.luckyGifts, [2]);
});
test('gộp 3 chiều cho quà: chỉ remote đổi thì lấy remote, dù ít hơn', () => {
  const r = merge4({ gifts:2, luckyGifts:[1,2] }, { gifts:0, luckyGifts:[] }, { gifts:2, luckyGifts:[1,2] });
  assert.equal(r.gifts, 0); assert.deepEqual(r.luckyGifts, []);
});
test('gộp 3 chiều cho quà: cả hai đổi hoặc không có base thì bên nhiều hơn thắng', () => {
  const r = merge4({ gifts:1, luckyGifts:[2] }, { gifts:3, luckyGifts:[1,2,5] }, { gifts:2, luckyGifts:[1,2] });
  assert.equal(r.gifts, 3); assert.deepEqual(r.luckyGifts, [1,2,5]);
  const n = merge4({ gifts:1, luckyGifts:[2] }, { gifts:2, luckyGifts:[1,2] }, null);
  assert.equal(n.gifts, 2);
});
test('earned trên mây có mục null thì không ném lỗi', () => {
  const r = merge({ stars:3, earned:{ A:{ stars:3 } } }, { earned:{ B:null } });
  assert.equal(r.stars, 3);
});

/* ---- gộp nhiệm vụ chăm ngoan ---- */
test('chore rỗng và giftSongs rỗng khi cả hai bên thiếu', () => {
  const r = merge({}, {});
  assert.deepEqual(r.chore, { log:{}, extra:[], cnt:{} }); assert.deepEqual(r.giftSongs, []);
});
test('chore log: trạng thái cuối thắng, hai chiều', () => {
  const d = { log:{ k:{ st:'done', n:4, t:7 } } }, w = { log:{ k:{ st:'wait', t:9 } } };
  [[d, w], [w, d]].forEach(([a, b]) => { const k = merge({ chore:a }, { chore:b }).chore.log.k; assert.equal(k.st, 'done'); assert.equal(k.n, 4) });
  assert.equal(merge({ chore:{ log:{ k:{ st:'closed', t:1 } } } }, { chore:w }).chore.log.k.st, 'closed');
});
test('chore log: hai trạng thái không cuối lấy t lớn hơn', () => {
  const redo = t => ({ log:{ k:{ st:'redo', t } } }), wait = t => ({ log:{ k:{ st:'wait', t } } });
  assert.equal(merge({ chore:redo(5) }, { chore:wait(9) }).chore.log.k.st, 'wait');
  assert.equal(merge({ chore:redo(9) }, { chore:wait(5) }).chore.log.k.st, 'redo');
});
test('chore log: hai trạng thái cuối lấy t nhỏ hơn', () => {
  const r = merge({ chore:{ log:{ k:{ st:'done', n:2, t:8 } } } }, { chore:{ log:{ k:{ st:'closed', t:3 } } } });
  assert.equal(r.chore.log.k.st, 'closed');
});
test('chore extra: hợp theo id, trùng thì giữ một', () => {
  const r = merge({ chore:{ extra:[{ id:'a', task:'x', st:'wait', t:1 }] } }, { chore:{ extra:[{ id:'a', task:'x', st:'done', n:3, t:2 }, { id:'b', task:'y', st:'wait', t:2 }] } });
  assert.equal(r.chore.extra.length, 2); assert.equal(r.chore.extra.find(e => e.id === 'a').st, 'done');
});
test('chore cnt: max từng máy, từng bộ đếm', () => {
  const r = merge({ chore:{ cnt:{ A:{ done:3 } } } }, { chore:{ cnt:{ A:{ done:5 }, B:{ done:1 } } } });
  assert.deepEqual(r.chore.cnt, { A:{ done:5 }, B:{ done:1 } });
});
test('giftSongs là hợp hai bên', () => {
  assert.deepEqual(merge({ giftSongs:['a','b'] }, { giftSongs:['b','c'] }).giftSongs, ['a','b','c']);
});

test('chore: bỏ qua mục extra/log hỏng thay vì ném lỗi', () => {
  const bad = { log:{ a:null, b:{ st:'done', t:1 } }, extra:[null, 5, { st:'wait' }, { id:'x', st:'wait', t:1 }], cnt:{} };
  const r = merge({ chore:bad }, { chore:{ log:{}, extra:[], cnt:{} } }).chore;
  assert.deepEqual(Object.keys(r.log), ['b']); assert.deepEqual(r.extra.map(e => e.id), ['x']);
});

test('xmas cùng ngày hợp việc và đồ', () => {
  const r = merge({ xmas:{ day:'2026-12-24', done:['santa'], found:[1], bonus:false } },
                  { xmas:{ day:'2026-12-24', done:['snowman'], found:[1,4], bonus:true } });
  assert.deepEqual(r.xmas, { day:'2026-12-24', done:['santa','snowman'], found:[1,4], bonus:true });
});
test('xmas khác ngày lấy ngày mới hơn', () => {
  const r = merge({ xmas:{ day:'2026-12-9', done:['santa'], found:[1], bonus:true } },
                  { xmas:{ day:'2026-12-10', done:['reindeer'], found:[2], bonus:false } });
  assert.equal(r.xmas.day, '2026-12-10'); assert.deepEqual(r.xmas.done, ['reindeer']); assert.equal(r.xmas.bonus, false);
});
test('bản lưu cũ không có xmas', () => {
  assert.deepEqual(merge({}, {}).xmas, { day:'', done:[], found:[], bonus:false });
});
