const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame, fakeEl } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/pattern.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/chat-ui.js','js/chores.js','js/chores-ui.js','js/sync.js','js/ui.js'];
const PRE = 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;';
function setup(local = {}) {
  const g = loadGame(FILES, { pre: PRE, storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify(Object.assign({ name: 'Mai', voice: false }, local)) } });
  g.modals = () => g.ctx.document.body.children.filter(m => m.className === 'modal' && m.isConnected).map(m => m.innerHTML);
  g.run("var __lines=[];const __vl=voice.line;voice.line=(k,...a)=>{__lines.push(k);return __vl.call(voice,k,...a)}");
  return g;
}
/* báo xong việc đầu tiên hôm nay, trả về ref */
const waitOne = g => g.get("(()=>{const r=choreKey('day_dung_gio',choreDay());choreDone(r);return r})()");
const solve = g => g.run("[...String(lockS.q.answer)].forEach(choreLockPress);choreLockPress('✓')");

test('màn chính: thẻ Hôm nay có việc và nút "Con xong rồi!"; thẻ Thành tích có nút báo điểm 10', () => {
  const g = setup();
  g.run('chores()');
  const h = g.get('app.innerHTML');
  assert.match(h, /Con xong rồi!/); assert.match(h, /Dậy đúng giờ/);
  assert.match(h, /Công chúa chăm ngoan/);
  g.run("choreTab='extra';chores(true)");
  assert.match(g.get('app.innerHTML'), /Con đạt điểm 10/);
  g.run("choreTab='week';chores(true)");
  assert.match(g.get('app.innerHTML'), /5 sao = 1 hộp quà/);
});

test('báo xong: việc chuyển sang chờ bố mẹ và Kuromi khen', () => {
  const g = setup();
  g.run('chores()');
  const ref = waitOne(g);
  assert.equal(g.get(`choreLog()['${ref}'].st`), 'wait');
  assert.match(g.get('app.innerHTML'), /Chờ bố mẹ/);
  assert.ok(g.get('__lines').includes('chore_done'));
});

test('chấm khi chưa mở chế độ bố mẹ: hỏi câu khoá trước, giải đúng mới cộng sao', () => {
  const g = setup();
  g.run('chores()');
  const ref = waitOne(g);
  g.run(`choreRateModal('${ref}')`);
  assert.ok(g.modals().some(h => h.includes('Bố mẹ chấm cho con mấy sao?')));
  g.run(`choreSubmit('${ref}',3)`);
  assert.ok(g.modals().some(h => h.includes('Câu hỏi của bố mẹ')));
  assert.equal(g.get('S.stars'), 0);
  /* sai: đổi câu mới, chưa cộng sao */
  g.run("lockS.q={text:'2 × 3',answer:6};choreLockPress('9');choreLockPress('✓')");
  assert.equal(g.get('S.stars'), 0); assert.equal(g.get('parentOn()'), false);
  assert.ok(g.get('__lines').includes('parent_wrong'));
  g.run('lockS.until=0');
  solve(g);
  assert.equal(g.get('S.stars'), 3); assert.equal(g.get('parentOn()'), true);
  assert.ok(g.get('__lines').includes('chore_rated'));
  assert.ok(g.get('S.badges').includes('c_first'));
});

test('trong chế độ bố mẹ thì chấm luôn; hết hạn thì hỏi lại câu khoá', () => {
  const g = setup();
  g.run('chores();parentOpen()');
  const ref = waitOne(g);
  g.run(`choreSubmit('${ref}',4)`);
  assert.equal(g.get('S.stars'), 4);
  assert.equal(g.modals().filter(h => h.includes('Câu hỏi của bố mẹ')).length, 0);
  g.run(`choreReport('mac_do',choreDay());parentOpen(Date.now()-PARENT_IDLE_MS-1);choreSubmit(choreKey('mac_do',choreDay()),2)`);
  assert.equal(g.get('S.stars'), 4);
  assert.ok(g.modals().some(h => h.includes('Câu hỏi của bố mẹ')));
});

test('bàn phím khoá: tối đa 4 chữ số, ⌫ xoá một số', () => {
  const g = setup();
  g.run("choreLockModal(()=>{});['1','2','3','4','5'].forEach(choreLockPress)");
  assert.equal(g.get('lockS.val'), '1234');
  g.run("choreLockPress('⌫')");
  assert.equal(g.get('lockS.val'), '123');
});

test('"Chưa được" không cần câu khoá: việc hôm nay quay về chưa làm', () => {
  const g = setup();
  g.run('chores()');
  const ref = waitOne(g);
  g.run(`choreRedoTap('${ref}')`);
  assert.equal(g.get(`choreStatus('day_dung_gio',choreDay())`), 'todo');
  assert.ok(g.get('__lines').includes('chore_redo'));
  assert.equal(g.modals().filter(h => h.includes('Câu hỏi của bố mẹ')).length, 0);
});

test('rời màn (go) thì khoá chế độ bố mẹ', () => {
  const g = setup();
  g.run('parentOpen()');
  assert.equal(g.get('parentOn()'), true);
  g.run('go(home)');
  assert.equal(g.get('parentOn()'), false);
});

test('trang chủ có thẻ Công chúa chăm ngoan, dòng phụ đếm việc đang chờ', () => {
  const g = setup();
  g.run('home()');
  assert.match(g.get('app.innerHTML'), /Công chúa chăm ngoan/);
  assert.doesNotMatch(g.get('app.innerHTML'), /⏳ \d/);
  g.run("choreReport('mac_do',choreDay());home()");
  assert.match(g.get('app.innerHTML'), /⏳ 1/);
});

test('mở hộp quà chăm ngoan: dùng lớp phủ hộp quà, quà là bài hát thì Kuromi nói gift_song', () => {
  const g = setup();
  g.run("document.createElement=t=>{const e=fakeEl(t);e.querySelector=()=>fakeEl();return e}");
  g.run("S.chore.cnt.A={boxIn:1};CHORE_BOX_ODDS=[['song',1]];openChoreBox(()=>{});$('#gb').onclick()");
  assert.equal(g.get('choreBoxes()'), 0);
  assert.equal(g.get('S.giftSongs.length'), 1);
  assert.ok(g.get('__lines').includes('gift_song'));
  assert.ok(g.get('S.badges').includes('c_box'));
});

test('khoá: ✓ khi chưa nhập là không làm gì; sai thì chờ 2 giây', () => {
  const g = setup();
  g.run("choreLockModal(()=>{});__lines.length=0;lockS.q={text:'2 × 3',answer:6};choreLockPress('✓')");
  assert.ok(!g.get('__lines').includes('parent_wrong'));
  assert.equal(g.get('lockS.q.text'), '2 × 3');
  assert.equal(g.get('LOCK_WRONG_COOLDOWN_MS'), 2000);
  g.run("var __now=Date.now;Date.now=()=>1000;choreLockPress('9');choreLockPress('✓')");
  assert.ok(g.get('__lines').includes('parent_wrong'));
  /* trong 2 giây: gõ được số nhưng ✓ bị bỏ qua, kể cả đáp án đúng */
  g.run("lockS.q={text:'2 × 3',answer:6};Date.now=()=>2999;choreLockPress('6');choreLockPress('✓')");
  assert.equal(g.get('lockS.val'), '6'); assert.equal(g.get('lockS!==null'), true);
  g.run("Date.now=()=>3000;choreLockPress('✓')");
  assert.equal(g.get('lockS'), null);
  g.run('Date.now=__now');
});

test('hộp quà hết món: +5 sao dùng lời chore_box_stars', () => {
  const g = setup();
  g.run("choreBoxOpen=()=>({kind:'stars',value:5})");
  assert.equal(g.get('choreBoxGift().line'), 'chore_box_stars');
  assert.equal(g.get('LINES.chore_box_stars.length'), 3);
});
