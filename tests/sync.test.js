const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/shop.js','js/firebase-config.js','js/sync.js'];
const KEY = 'be_vui_hoc_toan_v1', CLOUD_KEY = 'be_vui_cloud_v1', DEVICE_KEY = 'be_vui_device_v1';
const plain = x => JSON.parse(JSON.stringify(x));
const flush = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); };

/* adapter giả: lưu theo uid, đếm set, bật cờ lỗi; confirm và visibilitychange giả */
const PRE = `
var __db={}, __sets=[], __fail=false, __user=null, __authCb=null, __signedOut=0, __confirm=true, __asked=0, __vis=[], __changes=[];
var __uid='u1';
var confirm=()=>{__asked++;return __confirm};
document.visibilityState='visible';
document.addEventListener=(t,f)=>{if(t==='visibilitychange')__vis.push(f)};
const __copy=x=>x==null?null:JSON.parse(JSON.stringify(x));
window.CLOUD_ADAPTER={
  onAuth(cb){__authCb=cb;cb(__user)},
  signIn(){__user={uid:__uid,email:__uid+'@mail.com'};__authCb&&__authCb(__user);return Promise.resolve()},
  signOut(){__signedOut++;__user=null;__authCb&&__authCb(null);return Promise.resolve()},
  get(uid){return __fail?Promise.reject(new Error('mất mạng')):Promise.resolve(__copy(__db[uid]))},
  set(uid,d){if(__fail)return Promise.reject(new Error('mất mạng'));__sets.push(__copy(d));__db[uid]=__copy(d);return Promise.resolve()}
};`;

function setup({ local, cloudKey, db = {}, confirm = true } = {}) {
  const timers = [];
  const st = (f, ms) => { timers.push({ f, ms }); return timers.length; };
  const ct = id => { if (id && timers[id - 1]) timers[id - 1].f = null; };
  const storage = { [DEVICE_KEY]: 'A' };
  if (local) storage[KEY] = JSON.stringify(local);
  if (cloudKey) storage[CLOUD_KEY] = JSON.stringify(cloudKey);
  const g = loadGame(FILES, { storage, setTimeout: st, clearTimeout: ct, pre: PRE });
  g.ctx.__db = plain(db); g.ctx.__confirm = confirm;
  g.run('cloud.onChange=h=>__changes.push(h)');
  g.pending = () => timers.filter(t => t.f);
  g.tick = async () => { const p = g.pending(); p.forEach(t => { const f = t.f; t.f = null; f(); }); await flush(); return p; };
  g.sets = () => plain(g.ctx.__sets);
  g.cloudKey = () => JSON.parse(g.ctx.__store.get(CLOUD_KEY) || '{}');
  g.saved = () => JSON.parse(g.ctx.__store.get(KEY));
  g.signIn = async () => { await g.get('cloud.signIn()'); await flush(); };
  return g;
}

test('chưa từng đăng nhập thì không tải adapter', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  g.run('var __loads=0; cloud.loadAdapter=()=>{__loads++;return Promise.resolve(CLOUD_ADAPTER)}');
  assert.equal(g.get('cloud.available'), true);
  await g.get('cloud.init()'); await flush();
  assert.equal(g.get('__loads'), 0);
  assert.equal(g.get('cloud.state().signedIn'), false);
  /* đã dùng trước đó thì init nạp adapter và kéo về */
  const h = setup({ local: { name: 'Mai', stars: 10 }, cloudKey: { used: true, uid: 'u1' }, db: { u1: { name: 'Mai', stars: 5, earned: { B: { stars: 5 } }, deviceId: 'B', schema: 1 } } });
  h.run("var __loads=0; __user={uid:'u1',email:'u1@mail.com'}; cloud.loadAdapter=()=>{__loads++;return Promise.resolve(CLOUD_ADAPTER)}");
  await h.get('cloud.init()'); await flush();
  assert.equal(h.get('__loads'), 1);
  assert.equal(h.get('S.stars'), 15);
  assert.equal(h.get('cloud.state().signedIn'), true);
});

test('nạp adapter lỗi thì ghi lỗi, không ném ra', async () => {
  const g = setup({ local: { name: 'Mai' }, cloudKey: { used: true, uid: 'u1' } });
  g.run("cloud.loadAdapter=()=>Promise.reject(new Error('không tải được'))");
  await g.get('cloud.init()'); await flush();
  assert.equal(g.get('cloud.state().error'), true);
});

test('mây trống thì đẩy dữ liệu máy lên', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10, rounds: 2 } });
  await g.signIn();
  const sets = g.sets();
  assert.equal(sets.length, 1);
  assert.equal(sets[0].name, 'Mai'); assert.equal(sets[0].stars, 10);
  assert.equal(sets[0].schema, 1); assert.equal(sets[0].deviceId, 'A');
  assert.equal(sets[0].earned.A.stars, 10);
  const c = g.cloudKey();
  assert.equal(c.used, true); assert.equal(c.uid, 'u1'); assert.equal(c.email, 'u1@mail.com'); assert.ok(c.lastSync > 0);
  const st = plain(g.get('cloud.state()'));
  assert.equal(st.signedIn, true); assert.equal(st.email, 'u1@mail.com'); assert.equal(st.error, false);
  assert.deepEqual(plain(g.ctx.__changes), [true]);
});

test('máy trống thì lấy mây, không đẩy dữ liệu trống', async () => {
  const g = setup({ db: { u1: { name: 'Mai', avatar: '🐶', stars: 40, earned: { B: { stars: 40, rounds: 0, perfect: 0 } }, deviceId: 'B', schema: 1 } } });
  assert.equal(g.get('S.name'), '');
  await g.signIn();
  assert.equal(g.get('S.name'), 'Mai'); assert.equal(g.get('S.stars'), 40); assert.equal(g.get('S.avatar'), '🐶');
  assert.equal(g.saved().name, 'Mai');
  assert.ok(g.sets().every(s => s.name), 'không đẩy bản trống');
  assert.deepEqual(plain(g.ctx.__changes), [false]);
  assert.equal(g.get("'schema' in S||'deviceId' in S"), false);
});

test('cả hai có dữ liệu thì gộp và ghi cả hai nơi', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10, earned: {} },
    db: { u1: { name: 'Mai', stars: 8, earned: { B: { stars: 8, rounds: 0, perfect: 0 } }, deviceId: 'B', schema: 1 } } });
  await g.signIn();
  assert.equal(g.get('S.stars'), 18);
  assert.equal(g.saved().stars, 18);
  assert.equal(g.ctx.__db.u1.stars, 18);
  assert.equal(g.ctx.__db.u1.earned.A.stars, 10); assert.equal(g.ctx.__db.u1.earned.B.stars, 8);
  assert.deepEqual(plain(g.ctx.__changes), [true]);
});

test('đổi tài khoản: huỷ thì đăng xuất, đồng ý thì thay bằng dữ liệu mới', async () => {
  const local = { name: 'Mai', stars: 10 }, cloudKey = { used: true, uid: 'old' };
  const db = { u1: { name: 'Lan', stars: 50, earned: { B: { stars: 50 } }, deviceId: 'B', schema: 1 } };
  const no = setup({ local, cloudKey, db, confirm: false });
  await no.signIn();
  assert.equal(no.get('__asked'), 1);
  assert.equal(no.get('__signedOut'), 1);
  assert.equal(no.get('cloud.state().signedIn'), false);
  assert.equal(no.get('S.name'), 'Mai'); assert.equal(no.get('S.stars'), 10);
  assert.equal(no.sets().length, 0);
  assert.equal(no.cloudKey().used, false);
  /* thử lại với cùng tài khoản mới thì vẫn phải hỏi */
  await no.signIn();
  assert.equal(no.get('__asked'), 2);
  assert.equal(no.get('S.name'), 'Mai');

  const yes = setup({ local: Object.assign({ sound: false }, local), cloudKey, db, confirm: true });
  await yes.signIn();
  assert.equal(yes.get('S.name'), 'Lan'); assert.equal(yes.get('S.stars'), 50);
  assert.equal(yes.get('S.sound'), false);
  assert.equal(yes.saved().name, 'Lan');
  assert.equal(yes.cloudKey().uid, 'u1');

  const empty = setup({ local, cloudKey, confirm: true });
  await empty.signIn();
  assert.equal(empty.get('S.name'), 'Mai');
  assert.equal(empty.ctx.__db.u1.name, 'Mai');
});

test('nhiều lần save gom một lần đẩy', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  await g.signIn();
  await g.tick();
  const n0 = g.sets().length;
  for (let i = 0; i < 5; i++) g.run('S.stars++;save()');
  const p = g.pending();
  assert.equal(p.length, 1); assert.equal(p[0].ms, 3000);
  assert.equal(g.sets().length, n0);
  await g.tick();
  assert.equal(g.sets().length, n0 + 1);
  assert.equal(g.ctx.__db.u1.stars, 15);
  assert.equal(g.pending().length, 0, 'ghi local sau khi đẩy không hẹn thêm lần đẩy');
});

test('chưa đăng nhập thì save không hẹn đẩy', () => {
  const g = setup({ local: { name: 'Mai' } });
  g.run('save()');
  assert.equal(g.pending().length, 0);
});

test('ẩn ứng dụng thì đẩy ngay', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  await g.signIn();
  const n0 = g.sets().length;
  g.run('S.stars=12;save()');
  g.run("document.visibilityState='hidden';__vis.forEach(f=>f())");
  await flush();
  assert.equal(g.sets().length, n0 + 1);
  assert.equal(g.ctx.__db.u1.stars, 12);
  assert.equal(g.pending().length, 0);
});

test('đẩy lỗi thì ghi trạng thái lỗi, lần sau thử lại được', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  await g.signIn();
  const n0 = g.sets().length;
  const warn = console.warn, err = console.error; let warned = 0, errored = 0;
  console.warn = () => { warned++; }; console.error = () => { errored++; };
  try {
    g.run('__fail=true;S.stars=11;save()');
    await g.tick();
    assert.equal(g.get('cloud.state().error'), true);
    assert.equal(g.cloudKey().error, true);
    assert.ok(warned > 0); assert.equal(errored, 0);
    g.run('__fail=false;S.stars=12;save()');
    await g.tick();
  } finally { console.warn = warn; console.error = err; }
  assert.equal(g.get('cloud.state().error'), false);
  assert.equal(g.sets().length, n0 + 1);
  assert.equal(g.ctx.__db.u1.stars, 12);
});

test('cài đặt âm thanh không lên mây và không bị mây ghi đè', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10, sound: false, voice: false, sfx: true, music: false },
    db: { u1: { name: 'Mai', stars: 8, sound: true, voice: true, sfx: false, music: true, earned: { B: { stars: 8 } }, deviceId: 'B', schema: 1 } } });
  await g.signIn();
  g.run('save()'); await g.tick();
  assert.equal(g.get('S.sound'), false); assert.equal(g.get('S.voice'), false);
  assert.equal(g.get('S.sfx'), true); assert.equal(g.get('S.music'), false);
  const sets = g.sets();
  assert.ok(sets.length > 0);
  for (const s of sets) for (const k of ['sound','voice','sfx','music']) assert.ok(!(k in s), k + ' không lên mây');
});

test('đăng xuất thì dừng đồng bộ, xoá uid/email/lastSync', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  await g.signIn();
  await g.get('cloud.signOut()'); await flush();
  const c = g.cloudKey();
  assert.equal(c.used, false); assert.ok(!c.uid); assert.ok(!c.email); assert.ok(!c.lastSync);
  assert.equal(g.get('cloud.state().signedIn'), false);
  g.run('save()');
  assert.equal(g.pending().length, 0);
});

test('kéo lỗi khi đổi tài khoản thì không đẩy vào tài khoản mới cho tới khi đã hỏi', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 }, cloudKey: { used: true, uid: 'A' }, confirm: false,
    db: { u1: { name: 'Lan', stars: 50, earned: { B: { stars: 50 } }, deviceId: 'B', schema: 1 } } });
  const warn = console.warn; console.warn = () => {};
  try {
    g.run('__fail=true');
    await g.signIn();
    assert.equal(g.get('cloud.state().error'), true);
    g.run('__fail=false;S.stars=11;save()');
    await g.tick();
    g.run("document.visibilityState='hidden';__vis.forEach(f=>f())");
    await flush();
  } finally { console.warn = warn; }
  assert.equal(g.sets().length, 0, 'không ghi gì vào tài khoản mới');
  assert.equal(g.ctx.__db.u1.name, 'Lan');
  assert.equal(g.get('__asked'), 1, 'lần thử lại chạy bước hỏi đổi tài khoản');
  assert.equal(g.get('cloud.state().signedIn'), false);
  assert.equal(g.get('S.name'), 'Mai'); assert.equal(g.get('S.stars'), 11);
});

test('prepare nạp sẵn adapter; signIn sau đó gọi adapter.signIn đồng bộ (không bị chặn popup)', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  g.run('var __called=false; var __orig=CLOUD_ADAPTER.signIn; CLOUD_ADAPTER.signIn=function(){__called=true;return __orig.apply(this,arguments)}');
  await g.get('cloud.prepare()'); await flush();
  const p = g.get('(()=>{const p=cloud.signIn();return [__called,p]})()');
  assert.equal(p[0], true);
  await p[1]; await flush();
  assert.equal(g.get('cloud.state().signedIn'), true);
});

test('prepare nuốt lỗi nạp adapter', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  g.run('cloud.loadAdapter=()=>Promise.reject(new Error("offline"));var console={warn(){}}');
  await g.get('cloud.prepare()');
});

test('một máy mở quà: lần đẩy sau không trả lại quà (cả máy lẫn mây)', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10, gifts: 2, luckyGifts: [1, 2] } });
  await g.signIn();
  assert.equal(g.ctx.__db.u1.gifts, 2);
  g.run('S.gifts--;S.luckyGifts.shift();save()');
  await g.tick();
  assert.equal(g.get('S.gifts'), 1); assert.deepEqual(plain(g.get('S.luckyGifts')), [2]);
  assert.equal(g.ctx.__db.u1.gifts, 1); assert.deepEqual(plain(g.ctx.__db.u1.luckyGifts), [2]);
  /* mở tiếp hộp cuối, đẩy lần nữa */
  g.run('S.gifts--;S.luckyGifts.shift();save()');
  await g.tick();
  assert.equal(g.get('S.gifts'), 0); assert.equal(g.ctx.__db.u1.gifts, 0);
});

test('hai máy: chỉ máy kia mở quà thì số quà ít hơn của mây thắng', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10, gifts: 2, luckyGifts: [1, 2] } });
  await g.signIn();
  /* máy B mở cả hai hộp */
  g.run('__db.u1.gifts=0;__db.u1.luckyGifts=[]');
  g.run('S.stars=11;save()');
  await g.tick();
  assert.equal(g.get('S.gifts'), 0); assert.deepEqual(plain(g.get('S.luckyGifts')), []);
  assert.equal(g.ctx.__db.u1.gifts, 0);
});

test('đổi tài khoản lúc đang chờ ghi: không đánh dấu tài khoản mới đã đồng bộ, không ghi vào đó khi chưa hỏi', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 }, cloudKey: { used: true, uid: 'u1' }, confirm: false });
  /* set treo cho tới khi gọi __release() */
  g.run(`var __pend=[];CLOUD_ADAPTER.set=(uid,d)=>new Promise(r=>__pend.push(()=>{__sets.push(Object.assign({uid},__copy(d)));__db[uid]=__copy(d);r()}));
    var __release=()=>{const p=__pend;__pend=[];p.forEach(f=>f())}`);
  const warn = console.warn; console.warn = () => {};
  try {
    await g.signIn();
    assert.equal(g.get('__pend.length'), 1, 'đang chờ ghi cho u1');
    /* chuyển sang u2 trong lúc chờ; lần kéo của u2 sẽ lỗi mạng */
    g.run("__fail=true;__uid='u2';__user={uid:'u2',email:'u2@mail.com'};__authCb(__user)");
    g.run('__release()'); await flush();
    assert.equal(g.get('cloud.state().error'), true);
    g.run('__fail=false;S.stars=11;save()');
    await g.tick(); g.run('__release()'); await flush();
    g.run('cloud.push()'); await flush(); g.run('__release()'); await flush();
  } finally { console.warn = warn; }
  assert.ok(!g.sets().some(s => s.uid === 'u2'), 'không ghi gì vào u2');
  assert.ok(!('u2' in g.ctx.__db));
  assert.equal(g.get('__asked'), 1, 'lần thử lại vẫn hỏi đổi tài khoản');
  assert.notEqual(g.cloudKey().uid, 'u2');
});

test('ẩn ứng dụng khi chưa kéo xong thì không kéo (không bật confirm lúc trang bị ẩn)', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 }, cloudKey: { used: true, uid: 'old' }, confirm: false,
    db: { u1: { name: 'Lan', stars: 50, earned: { B: { stars: 50 } }, deviceId: 'B', schema: 1 } } });
  const warn = console.warn; console.warn = () => {};
  try {
    g.run('__fail=true'); await g.signIn();
    g.run('__fail=false');
    g.run("document.visibilityState='hidden';__vis.forEach(f=>f())");
    await flush();
  } finally { console.warn = warn; }
  assert.equal(g.get('__asked'), 0);
  assert.equal(g.sets().length, 0);
  assert.equal(g.get('cloud.state().signedIn'), true);
});

test('firebase-config.js không tải được thì sync.js vẫn nạp, cloud.available=false', () => {
  const g = loadGame(['js/core.js','js/merge.js','js/shop.js','js/sync.js']);
  assert.equal(g.get('cloud.available'), false);
});

test('flushNow: đẩy được thì true; ghi treo quá lâu thì false (không chặn mãi nút Xoá dữ liệu)', async () => {
  const g = setup({ local: { name: 'Mai', stars: 10 } });
  await g.signIn();
  g.run('S.stars=12;save()');
  assert.equal(await g.get('cloud.flushNow()'), true);
  assert.equal(g.ctx.__db.u1.stars, 12);
  g.run('CLOUD_ADAPTER.set=()=>new Promise(()=>{});S.stars=13;save()');
  const p = g.get('cloud.flushNow()'); await flush();
  const w = g.pending().find(t => t.ms === 8000);
  assert.ok(w, 'có hẹn giờ chờ 8 giây');
  w.f(); w.f = null;
  assert.equal(await p, false);
});
