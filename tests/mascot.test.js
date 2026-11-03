const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame, fakeEl } = require('./helpers/load');
const FILES = ['js/core.js','js/lines.js','audio/voice/manifest.js','js/voice.js','js/scene.js','js/mascot.js'];

/* Hẹn giờ giả để tua thời gian; DOM giả chỉ có #mimg và #mbub (có thể gỡ đi) */
function setup() {
  let now = 0, timers = [], seq = 0;
  const st = (f, ms = 0) => { const id = ++seq; timers.push({ id, at: now + ms, f }); return id; };
  const ct = id => { timers = timers.filter(t => t.id !== id); };
  const tick = ms => { const end = now + ms; for (;;) { timers.sort((a, b) => a.at - b.at); const t = timers[0]; if (!t || t.at > end) break; timers.shift(); now = t.at; t.f(); } now = end; };
  const dom = { img: fakeEl('img'), bub: fakeEl(), on: true };
  const g = loadGame(FILES, { setTimeout: st, clearTimeout: ct, query: s => dom.on ? ({ '#mimg': dom.img, '#mbub': dom.bub })[s] : null });
  g.run('S.voice=false');
  return { g, tick, dom, mascot: g.get('mascot') };
}

test('think không hold thì về neutral sau 2600ms', () => {
  const { mascot, tick, dom } = setup();
  mascot('think', 'Hmm'); assert.match(dom.img.src, /think/); assert.equal(dom.bub.textContent, 'Hmm');
  tick(2599); assert.match(dom.img.src, /think/); tick(1); assert.match(dom.img.src, /neutral/);
});
test('hold thì giữ nguyên', () => {
  const { mascot, tick, dom } = setup();
  mascot('clap', '', { hold: true }); tick(5000); assert.match(dom.img.src, /clap/);
});
test('cảm xúc mới huỷ hẹn giờ cũ', () => {
  const { mascot, tick, dom } = setup();
  mascot('think'); tick(2000); mascot('clap'); tick(1000); assert.match(dom.img.src, /clap/);
  tick(1600); assert.match(dom.img.src, /neutral/);
});
test('mascotReset rồi #mimg bị gỡ khỏi DOM: hẹn giờ không ném lỗi, không đổi gì', () => {
  const { g, mascot, tick, dom } = setup();
  mascot('think'); g.run('mascotReset()'); tick(3000); assert.match(dom.img.src, /think/);
  mascot('clap'); dom.on = false; assert.doesNotThrow(() => tick(3000));
  assert.doesNotThrow(() => mascot('happy', 'x'));
});
test('mascotSay dùng emo của câu thoại và đặt bong bóng theo text; bubble ghi đè được', async () => {
  const { g, dom } = setup();
  await g.run("mascotSay('wrong')");
  assert.match(dom.img.src, /think/); assert.ok(g.get('LINES.wrong').some(x => x.text === dom.bub.textContent));
  await g.run("mascotSay('home',{bubble:'Chào Mai!'})");
  assert.match(dom.img.src, /neutral/); assert.equal(dom.bub.textContent, 'Chào Mai!');
  await g.run("mascotSay('home',{emo:'happy'})"); assert.match(dom.img.src, /happy/);
});
test('mascotHTML có đủ ảnh, bong bóng và cỡ', () => {
  const { g } = setup();
  const h = g.run("mascotHTML({emo:'clap',text:'Giỏi',size:'md'})");
  assert.match(h, /id="mimg"[^>]*kuromi-clap\.png|kuromi-clap\.png[^>]*id="mimg"/); assert.match(h, /id="mbub"[^>]*>Giỏi</); assert.match(h, /kuromi md/);
});
test('screenHTML: có mascot thì có cột trái, không có thì không', () => {
  const { g } = setup();
  assert.match(g.run("screenHTML({mascot:{emo:'neutral'},top:'T',body:'B',cls:'x'})"), /class="scr x"[\s\S]*class="mcol[ "][^>]*>[\s\S]*class="mainc">TB/);
  assert.doesNotMatch(g.run("screenHTML({top:'T',body:'B'})"), /mcol/);
});
test('withName thay chữ "bạn" đầu tiên bằng tên bé, giữ nguyên phần còn lại', () => {
  const { g } = setup(); g.run("S.name='Mai'"); const w = g.get('withName');
  assert.equal(w('Chào bạn! Hôm nay mình chơi trò nào nè? 💜'), 'Chào Mai! Hôm nay mình chơi trò nào nè? 💜');
  assert.equal(w('Bạn ơi, chọn một trò đi nào!'), 'Mai ơi, chọn một trò đi nào!');
  assert.equal(w('Mình nhớ bạn quá! bạn ơi'), 'Mình nhớ Mai quá! bạn ơi');
  assert.equal(w('Không có chữ đó'), 'Không có chữ đó');
  assert.equal(w('Bánh bạnh'), 'Bánh bạnh');
});
test('mascotSay format: bong bóng dùng chữ đã định dạng', async () => {
  const { g, dom } = setup(); g.run("S.name='Mai'");
  await g.run("mascotSay('home',{format:t=>'['+t+']'})");
  assert.match(dom.bub.textContent, /^\[.+\]$/);
});
test('mascotSay ifIdle: đang có câu khác phát thì chỉ đổi bong bóng, không phát giọng', async () => {
  const { g, dom } = setup();
  g.run("voice.busy=()=>true;__said=[];const _l=voice.line;voice.line=grp=>{__said.push(grp);return _l(grp)}");
  await g.run("mascotSay('home',{ifIdle:true})");
  assert.equal(g.get('__said.length'), 0);
  assert.ok(g.get('LINES.home').some(x => x.text === dom.bub.textContent));
});
