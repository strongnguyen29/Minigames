const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/sync.js','js/ui.js'];
const KEY = 'be_vui_hoc_toan_v1', DEVICE_KEY = 'be_vui_device_v1';
const plain = x => JSON.parse(JSON.stringify(x));
function setup(local = {}) {
  const storage = { [DEVICE_KEY]: 'A', [KEY]: JSON.stringify(Object.assign({ name: 'Mai', voice: false }, local)) };
  return loadGame(FILES, { storage, pre: 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;' });
}

test('mỗi ngày 10 câu miễn phí', () => {
  assert.equal(setup().get('talkLeft()'), 10);
});

test('trừ miễn phí trước rồi tới câu đã đổi', () => {
  const g = setup();
  g.run(`talkState().used=9;talkState().paid=3`);
  g.run('talkUse();talkUse()');
  assert.equal(g.get('S.talk.used'), 10);
  assert.equal(g.get('S.talk.paid'), 2);
  assert.equal(g.get('talkLeft()'), 2);
});

test('sang ngày mới đặt lại cả miễn phí lẫn câu đã đổi', () => {
  const g = setup({ talk: { day: '2000-1-1', used: 10, paid: 7 } });
  assert.equal(g.get('talkLeft()'), 10);
  assert.equal(g.get('S.talk.paid'), 0);
});

test('đổi câu: thiếu sao thì không đổi', () => {
  const g = setup({ stars: 4 });
  assert.equal(g.get('talkBuy(TALK_PACKS[0])'), false);
  assert.deepEqual(plain(g.get('S.talkSpent')), {});
  assert.equal(g.get('talkLeft()'), 10);
});

test('đổi câu: đủ sao thì cộng câu và trừ sao', () => {
  const g = setup({ stars: 20 });
  assert.equal(g.get('talkBuy(TALK_PACKS[0])'), true);
  assert.equal(g.get('S.talk.paid'), 5);
  assert.deepEqual(plain(g.get('S.talkSpent')), { A: 5 });
  assert.equal(g.get('balance()'), 15);
  assert.equal(JSON.parse(g.ctx.__store.get(KEY)).talkSpent.A, 5);
});

test('gói đổi sao đúng giá: 5 câu = 5 sao, 15 câu = 12 sao', () => {
  assert.deepEqual(plain(setup().get('TALK_PACKS')), [{ n: 5, price: 5 }, { n: 15, price: 12 }]);
});

test('balance() trừ cả sao đã đổi câu hỏi', () => {
  const g = setup({ stars: 30, spent: 10, listenSpent: { A: 2 }, talkSpent: { A: 3, B: 4 } });
  assert.equal(g.get('balance()'), 30 - 10 - 2 - 7);
});

test('gộp hai máy: talkSpent lấy max từng máy, talk chỉ của máy này', () => {
  const g = loadGame(['js/core.js', 'js/merge.js']);
  g.ctx.__a = { talkSpent: { A: 10, B: 2 }, talk: { day: 'x', used: 3, paid: 0 } };
  g.ctx.__b = { talkSpent: { A: 5, B: 7, C: 3 }, talk: { day: 'y', used: 9, paid: 99 }, savedAt: 9 };
  const r = plain(g.get('mergeSave(__a,__b,()=>0)'));
  assert.deepEqual(r.talkSpent, { A: 10, B: 7, C: 3 });
  assert.equal(r.talk.used, 3); assert.equal(r.talk.paid, 0);
});

test('trừ theo thứ tự miễn phí, đã đổi, quà tặng; quà tặng giữ qua ngày', () => {
  const g = setup();
  g.run(`talkState().used=9;talkState().paid=1;talkState().gift=2`);
  g.run('talkUse();talkUse();talkUse()');
  assert.equal(g.get('S.talk.paid'), 0); assert.equal(g.get('S.talk.gift'), 1);
  g.run(`S.talk.day='2000-1-1'`);
  assert.equal(g.get('talkLeft()'), 11);
});
