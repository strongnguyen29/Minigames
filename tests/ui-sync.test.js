const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/scene.js','js/mascot.js','js/shop.js','js/firebase-config.js','js/sync.js','js/ui.js'];
const KEY = 'be_vui_hoc_toan_v1';
const flush = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); };

const ADAPTER = `
var __db={}, __user=null, __authCb=null, __asked=[], __confirm=true, __signedOut=0;
var confirm=m=>{__asked.push(m);return __confirm};
window.CLOUD_ADAPTER={
  onAuth(cb){__authCb=cb;cb(__user)},
  signIn(){__user={uid:'u1',email:'mai@mail.com'};__authCb&&__authCb(__user);return Promise.resolve()},
  signOut(){__signedOut++;__user=null;__authCb&&__authCb(null);return Promise.resolve()},
  get(uid){return Promise.resolve(__db[uid]?JSON.parse(JSON.stringify(__db[uid])):null)},
  set(uid,d){__db[uid]=JSON.parse(JSON.stringify(d));return Promise.resolve()}
};`;

function setup({ local, withAdapter = true, db } = {}) {
  const storage = {};
  if (local) storage[KEY] = JSON.stringify(local);
  const g = loadGame(FILES, { storage, pre: (withAdapter ? ADAPTER : '') + 'var __h=null;' });
  if (db) g.ctx.__db = db;
  return g;
}

test('FIREBASE_CONFIG null và không có adapter thì Cài đặt không có khối Sao lưu', () => {
  const g = setup({ local: { name: 'Mai' }, withAdapter: false });
  assert.equal(g.get('cloud.available'), false);
  g.run('settings()');
  assert.equal(g.get("$('#cloud').innerHTML"), '');
  assert.ok(!g.get('document.body.children[0].innerHTML').includes('Đăng nhập Google'));
});

test('có adapter: Cài đặt có khối Sao lưu, chưa đăng nhập thì có nút đăng nhập', () => {
  const g = setup({ local: { name: 'Mai' } });
  g.run('settings()');
  const h = g.get("$('#cloud').innerHTML");
  assert.ok(h.includes('☁️ Sao lưu') && h.includes('Đăng nhập Google để sao lưu') && h.includes('Giữ sao và quà của bé, chơi tiếp trên máy khác'));
});

test('đăng nhập xong thì khối Sao lưu hiện email, giờ sao lưu và nút Đồng bộ ngay / Đăng xuất', async () => {
  const g = setup({ local: { name: 'Mai', stars: 5 } });
  g.run('settings()');
  g.run("$('#cin').onclick()"); await flush();
  const h = g.get("$('#cloud').innerHTML");
  assert.ok(h.includes('mai@mail.com') && /Đã sao lưu lúc \d\d:\d\d/.test(h) && h.includes('Đồng bộ ngay') && h.includes('Đăng xuất'), h);
});

test('Xoá dữ liệu khi đang đăng nhập: đăng xuất và câu hỏi nhắc bản sao lưu', async () => {
  const g = setup({ local: { name: 'Mai', stars: 5 } });
  await g.get('cloud.signIn()'); await flush();
  g.run('settings()');
  g.run("$('#rst').onclick()");
  assert.equal(g.get('JSON.stringify(__asked)'), JSON.stringify(['Xoá tiến độ trên máy này? (Bản sao lưu trên mây vẫn còn)']));
  assert.equal(g.get('__signedOut'), 1);
  assert.equal(g.get('S.name'), '');
  assert.equal(g.get('cloud.state().signedIn'), false);
});

test('Xoá dữ liệu khi chưa đăng nhập: câu cũ, không đăng xuất', () => {
  const g = setup({ local: { name: 'Mai' } });
  g.run('settings()');
  g.run("$('#rst').onclick()");
  assert.equal(g.get('JSON.stringify(__asked)'), JSON.stringify(['Xoá hết sao, hình dán và tên của bé?']));
  assert.equal(g.get('__signedOut'), 0);
});

test('màn nhập tên + đăng nhập lấy được dữ liệu thì chuyển thẳng trang chủ', async () => {
  const g = setup({ db: { u1: { name: 'Mai', avatar: '🐱', stars: 40, schema: 1, deviceId: 'B' } } });
  g.run('welcome()');
  assert.ok(g.get('app.innerHTML').includes('Đã có tiến độ? Đăng nhập để lấy lại'));
  g.run("$('#cget').onclick()"); await flush();
  assert.equal(g.get('S.name'), 'Mai');
  assert.ok(g.get('app.innerHTML').includes('hgrid'));
});
