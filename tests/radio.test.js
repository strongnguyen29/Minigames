const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/sync.js','js/ui.js'];
const KEY = 'be_vui_hoc_toan_v1', DEVICE_KEY = 'be_vui_device_v1';
const plain = x => JSON.parse(JSON.stringify(x));

/* Audio giả có trạng thái paused, đếm số lần play và nhớ các listener */
const PRE = `var __plays=[];
var setInterval=()=>1,clearInterval=()=>{};
class __Audio{constructor(){this.paused=true;this.currentTime=0;this.duration=NaN;this.src='';this.l={}}
  play(){this.paused=false;__plays.push(this.src);return Promise.resolve()} pause(){this.paused=true}
  addEventListener(t,f){(this.l[t]=this.l[t]||[]).push(f)} removeEventListener(t,f){this.l[t]=(this.l[t]||[]).filter(x=>x!==f)}
  fire(t){(this.l[t]||[]).slice().forEach(f=>f())}}`;
function setup(local = {}) {
  const storage = { [DEVICE_KEY]: 'A', [KEY]: JSON.stringify(Object.assign({ name: 'Mai', voice: false }, local)) };
  const g = loadGame(FILES, { storage, pre: PRE + 'var FIREBASE_CONFIG=null;' });
  g.run('Audio=__Audio');
  g.modals = () => g.ctx.document.body.children.filter(m => m.className === 'modal' && m.isConnected).map(m => m.innerHTML);
  return g;
}
const STORY = 'stories/ngoi-sao-nho-di-lac', FREE = 'stories/tho-con-va-cu-ca-rot';

test('id món lấy từ đường dẫn file, bỏ tên miền và đuôi; link đầy đủ giữ nguyên, còn lại theo AUDIO_BASE', () => {
  const g = setup();
  assert.ok(g.get(`radioItem('${STORY}')`));
  assert.equal(g.get(`radioUrl(radioItem('${STORY}'))`), 'audio/stories/ngoi-sao-nho-di-lac.m4a');
  g.run(`RADIO_ITEMS.push(...[['https://cdn.x.vn/songs/a-b.mp3','A',0,'🎵']].map(([file,name,price,icon])=>({id:'songs/a-b',cat:'song',file,name,price,icon})))`);
  assert.equal(g.get(`radioUrl(radioItem('songs/a-b'))`), 'https://cdn.x.vn/songs/a-b.mp3');
});

test('bài giá 0 có sẵn, bài có giá phải đổi sao; số dư trừ cả váy, bài và phút nghe', () => {
  const g = setup({ stars: 30, spent: 10, songs: [STORY], listenSpent: { A: 5, B: 2 } });
  assert.equal(g.get(`hasSong('${FREE}')`), true);
  assert.equal(g.get(`hasSong('${STORY}')`), true);
  assert.equal(g.get('balance()'), 30 - 10 - 8 - 7);
});

test('đổi bài: thiếu sao thì không đổi; đủ sao thì thêm vào songs và trừ sao', () => {
  const g = setup({ stars: 5 });
  g.run(`radioBuy('${STORY}')`);
  assert.deepEqual(plain(g.get('S.songs')), []);
  g.run('S.stars=20');
  g.run(`radioBuy('${STORY}')`);
  assert.deepEqual(plain(g.get('S.songs')), [STORY]);
  assert.equal(g.get('balance()'), 12);
  assert.deepEqual(JSON.parse(g.ctx.__store.get(KEY)).songs, [STORY]);
});

test('mỗi ngày 5 phút miễn phí; sang ngày mới thì phần miễn phí đặt lại, phút đã đổi giữ nguyên', () => {
  const g = setup({ listen: { day: '2000-1-1', used: 300, paid: 40, pos: {} } });
  assert.equal(g.get('listenLeft()'), 300 + 40);
  assert.equal(g.get('S.listen.used'), 0);
});

test('nghe thì trừ miễn phí trước rồi mới tới phút đã đổi', () => {
  const g = setup();
  g.run(`listenState().used=298;listenState().paid=60`);
  g.run(`radioLoad(radioItem('${FREE}'),0)`);
  g.run('radioLast=Date.now()-4000;radioCharge()');
  assert.equal(g.get('S.listen.used'), 300);
  assert.ok(Math.abs(g.get('S.listen.paid') - 58) < 0.1);
});

test('hết phút thì không phát và hiện bảng đổi sao lấy phút; đổi xong thì phát tiếp', () => {
  const g = setup({ stars: 20 });
  g.run('listenState().used=300');
  g.run(`radioLoad(radioItem('${FREE}'),0)`);
  assert.equal(g.get('__plays.length'), 0);
  assert.ok(g.modals().some(h => h.includes('Hết giờ nghe')));
  g.run('radioBuyMinutes(LISTEN_PACKS[0],null,true)');
  assert.equal(g.get('S.listen.paid'), 300);
  assert.deepEqual(plain(g.get('S.listenSpent')), { A: 5 });
  assert.equal(g.get('balance()'), 15);
  assert.equal(g.get('__plays.length'), 1);
});

test('đang nghe mà hết phút thì tự dừng và hỏi đổi sao', () => {
  const g = setup();
  g.run('listenState().used=299');
  g.run(`radioLoad(radioItem('${FREE}'),0)`);
  g.run('radioLast=Date.now()-3000;radioTick()');
  assert.equal(g.get('radioEl.paused'), true);
  assert.ok(g.modals().some(h => h.includes('Hết giờ nghe')));
});

test('đổi phút khi thiếu sao thì không trừ gì', () => {
  const g = setup({ stars: 3 });
  g.run('radioBuyMinutes(LISTEN_PACKS[0],null,false)');
  assert.deepEqual(plain(g.get('S.listenSpent')), {});
  assert.equal(g.get('S.listen&&S.listen.paid||0'), 0);
});

test('mở bài có chỗ dừng cũ thì hỏi nghe tiếp hay từ đầu; nghe tiếp thì nhảy tới chỗ cũ', () => {
  const g = setup({ listen: { day: '', used: 0, paid: 0, pos: { [FREE]: [30, 62] } } });
  g.run(`radioOpen('${FREE}')`);
  assert.equal(g.get('__plays.length'), 0);
  assert.ok(g.modals().some(h => h.includes('Nghe tiếp') && h.includes('0:30')));
  g.run(`radioLoad(radioItem('${FREE}'),30)`);
  g.run(`radioEl.duration=62;radioEl.fire('loadedmetadata')`);
  assert.equal(g.get('radioEl.currentTime'), 30);
});

test('chỗ dừng quá ngắn hoặc sát cuối bài thì phát luôn từ đầu', () => {
  for (const pos of [[3, 62], [59, 62]]) {
    const g = setup({ listen: { day: '', used: 0, paid: 0, pos: { [FREE]: pos } } });
    g.run(`radioOpen('${FREE}')`);
    assert.equal(g.get('__plays.length'), 1);
    assert.equal(g.modals().length, 0);
  }
});

test('tạm dừng thì nhớ chỗ dừng; nghe hết bài thì quên chỗ dừng', () => {
  const g = setup();
  g.run(`radioLoad(radioItem('${FREE}'),0)`);
  g.run('radioEl.currentTime=42;radioEl.duration=62;radioPause()');
  assert.deepEqual(plain(g.get(`S.listen.pos['${FREE}']`)), [42, 62]);
  assert.deepEqual(JSON.parse(g.ctx.__store.get(KEY)).listen.pos[FREE], [42, 62]);
  g.run(`radioPlay();radioEl.paused=true;radioEl.fire('ended')`);
  assert.equal(g.get(`S.listen.pos['${FREE}']`), undefined);
});

test('rời tiệm (go) thì dừng bài đang nghe', () => {
  const g = setup();
  g.run(`radioLoad(radioItem('${FREE}'),0)`);
  g.run('radioStop()');
  assert.equal(g.get('radioEl.paused'), true);
  assert.equal(g.get('radioCur'), null);
});

test('gộp hai máy: songs hợp, listenSpent max từng máy, listen chỉ của máy này', () => {
  const g = loadGame(['js/core.js','js/merge.js']);
  g.ctx.__a = { songs: ['x'], listenSpent: { A: 10, B: 2 }, listen: { used: 100, paid: 0, pos: {} } };
  g.ctx.__b = { songs: ['y', 'x'], listenSpent: { A: 5, B: 7, C: 3 }, listen: { used: 5, paid: 999, pos: {} }, savedAt: 9 };
  const r = plain(g.get('mergeSave(__a,__b,()=>0)'));
  assert.deepEqual(r.songs, ['x', 'y']);
  assert.deepEqual(r.listenSpent, { A: 10, B: 7, C: 3 });
  assert.equal(r.listen.used, 100); assert.equal(r.listen.paid, 0);
});

test('màn Tiệm âm thanh vẽ được, tắt nhạc nền', () => {
  const g = setup({ stars: 2 });
  g.run('var __scene=null;music.scene=c=>{__scene=c}');
  g.run('radio()');
  assert.equal(g.get('__scene'), 'radio');
  const html = g.get('app.innerHTML');
  assert.ok(html.includes('Tiệm âm thanh') && html.includes('rbar'));
  g.run(`radioLocked('${STORY}')`);
  assert.ok(g.modals().some(h => h.includes('Bạn cần thêm 6 ⭐')));
});

test('radioSpent bỏ qua bài hát tặng', () => {
  const g = setup();
  const id = g.get('RADIO_ITEMS.find(x=>x.price>0).id'), price = g.get(`radioItem('${id}').price`);
  g.run(`S.songs=['${id}']`);
  assert.equal(g.get('radioSpent()'), price);
  g.run(`S.giftSongs=['${id}']`);
  assert.equal(g.get('radioSpent()'), 0);
});
