const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/scene.js','js/mascot.js','js/shop.js','js/firebase-config.js','js/sync.js','js/ui.js'];
const KEY = 'be_vui_hoc_toan_v1';
const flush = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); };

const ADAPTER = `
var __db={}, __user=null, __authCb=null, __asked=[], __confirm=true, __signedOut=0, __fail=false;
/* __confirm là mảng thì trả lời lần lượt */
var confirm=m=>{__asked.push(m);return Array.isArray(__confirm)?__confirm.shift():__confirm};
window.CLOUD_ADAPTER={
  onAuth(cb){__authCb=cb;cb(__user)},
  signIn(){__user={uid:'u1',email:'mai@mail.com'};__authCb&&__authCb(__user);return Promise.resolve()},
  signOut(){__signedOut++;__user=null;__authCb&&__authCb(null);return Promise.resolve()},
  get(uid){return Promise.resolve(__db[uid]?JSON.parse(JSON.stringify(__db[uid])):null)},
  set(uid,d){if(__fail)return Promise.reject(new Error('mất mạng'));__db[uid]=JSON.parse(JSON.stringify(d));return Promise.resolve()}
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
  g.run("$('#rst').onclick()"); await flush();
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

const RESET_MSG = 'Xoá tiến độ trên máy này? (Bản sao lưu trên mây vẫn còn)';
const UNSYNCED_MSG = 'Chưa sao lưu được tiến độ mới nhất. Vẫn xoá? (Phần chưa sao lưu sẽ mất)';
test('Xoá dữ liệu khi đang đăng nhập: đẩy phần chưa sao lưu lên mây trước khi xoá', async () => {
  const g = setup({ local: { name: 'Mai', stars: 5 } });
  await g.get('cloud.signIn()'); await flush();
  g.run('S.stars=7;save()');
  g.run('settings()');
  g.run("$('#rst').onclick()"); await flush();
  assert.equal(g.ctx.__db.u1.stars, 7);
  assert.equal(g.get('JSON.stringify(__asked)'), JSON.stringify([RESET_MSG]));
  assert.equal(g.get('S.name'), '');
  assert.equal(g.get('cloud.state().signedIn'), false);
});

test('Xoá dữ liệu khi đẩy lỗi: hỏi lần hai; huỷ thì không xoá, đồng ý thì xoá', async () => {
  const warn = console.warn; console.warn = () => {};
  try {
    const no = setup({ local: { name: 'Mai', stars: 5 } });
    await no.get('cloud.signIn()'); await flush();
    no.run('__fail=true;S.stars=7;save();__confirm=[true,false]');
    no.run('settings()');
    no.run("$('#rst').onclick()"); await flush();
    assert.equal(no.get('JSON.stringify(__asked)'), JSON.stringify([RESET_MSG, UNSYNCED_MSG]));
    assert.equal(no.get('S.name'), 'Mai'); assert.equal(no.get('S.stars'), 7);
    assert.equal(no.get('cloud.state().signedIn'), true);
    assert.equal(no.get('__signedOut'), 0);

    const yes = setup({ local: { name: 'Mai', stars: 5 } });
    await yes.get('cloud.signIn()'); await flush();
    yes.run('__fail=true;S.stars=7;save();__confirm=[true,true]');
    yes.run('settings()');
    yes.run("$('#rst').onclick()"); await flush();
    assert.equal(yes.get('JSON.stringify(__asked)'), JSON.stringify([RESET_MSG, UNSYNCED_MSG]));
    assert.equal(yes.get('S.name'), '');
    assert.equal(yes.get('cloud.state().signedIn'), false);
  } finally { console.warn = warn; }
});

test('Xoá dữ liệu đổi deviceId: sao kiếm sau khi xoá được cộng thêm khi đồng bộ lại', async () => {
  const g = setup({ local: { name: 'Mai', stars: 100 } });
  const dev0 = g.get('deviceId()');
  await g.get('cloud.signIn()'); await flush();
  assert.equal(g.ctx.__db.u1.earned[dev0].stars, 100);
  g.run('settings()');
  g.run("$('#rst').onclick()"); await flush();
  assert.notEqual(g.get('deviceId()'), dev0);
  g.run("S.name='Mai';S.stars=5;save()");
  await g.get('cloud.signIn()'); await flush();
  assert.equal(g.get('S.stars'), 105);
  assert.equal(g.ctx.__db.u1.stars, 105);
});

test('lối "Đăng nhập để lấy lại" chỉ hiện khi chưa có tên và chưa đăng nhập', async () => {
  const named = setup({ local: { name: 'Mai' } });
  named.run('welcome()');
  assert.ok(!named.get('app.innerHTML').includes('Đăng nhập để lấy lại'), 'vào từ Đổi tên / hình');
  const inn = setup({ db: {} });
  await inn.get('cloud.signIn()'); await flush();
  inn.run('welcome()');
  assert.ok(!inn.get('app.innerHTML').includes('Đăng nhập để lấy lại'), 'đã đăng nhập');
  const fresh = setup({});
  fresh.run('welcome()');
  assert.ok(fresh.get('app.innerHTML').includes('Đăng nhập để lấy lại'));
});
