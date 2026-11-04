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
