const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js',
  'js/music.js','js/scene.js','js/mascot.js','js/shop.js','js/radio.js','js/chat.js','js/chat-ui.js','js/chores.js','js/chores-ui.js',
  'js/sync.js','js/ui.js','js/xmas-quiz.js','js/village.js','js/xmas.js','js/world3d.js','js/xmas-ui.js'];
const PRE = 'var setInterval=()=>1,clearInterval=()=>{};var FIREBASE_CONFIG=null;';
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));

function setup() {
  const g = loadGame(FILES, { pre: PRE, storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', voice: false, sfx: false, music: false }) } });
  /* world giả: không cần WebGL; ghi lại nhãn đặt lên đầu nhân vật */
  g.run(`var __marks={};xmasWorld={dispose(){},walkTo(){},onTap(){},onPickup(){},onFrame(){},
    setMark(id,t){__marks[id]=t}};XMAS_NEXT_MS=0;`);
  return g;
}
/* nhân vật đố đầu tiên của hôm nay */
const quizNpc = g => g.get("Object.keys(xmasPlan(xmasState().day).quiz)[0]");

test('không có WebGL thì hiện thông báo, không lỗi', () => {
  const g = loadGame(FILES, { pre: PRE, storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', voice: false }) } });
  g.run('w3Supported=()=>false;xmasVillage()');
  assert.match(g.get('app.innerHTML'), /xfail/);
  assert.match(g.get('app.innerHTML'), /Làng đang ngủ/);
});

test('trò chuyện đố: đúng đủ 3 câu thì cộng 3 sao', async () => {
  const g = setup();
  const npc = quizNpc(g);
  g.run(`xmasTalk('${npc}')`);
  assert.ok(g.get('xmasSess'), 'phải mở phiên đố');
  assert.match(g.get("document.querySelector('#xdlg').innerHTML"), /class="ch btn/);
  for (let k = 0; k < 3; k++) {
    g.run('xmasChoose(xmasSess.qs[xmasSess.i].correct)');
    await tick();
  }
  assert.equal(g.get('S.stars'), 3);
  assert.equal(g.get(`xmasStatus('${npc}')`), 'done');
});

test('sai một lần thì được 2 sao, sai lại cùng nút không tính thêm', async () => {
  const g = setup();
  const npc = quizNpc(g);
  g.run(`xmasTalk('${npc}')`);
  g.run('var __w=(xmasSess.qs[0].correct+1)%xmasSess.qs[0].choices.length;xmasChoose(__w);xmasChoose(__w)');
  assert.equal(g.get('xmasSess.mistakes'), 1);
  for (let k = 0; k < 3; k++) { g.run('xmasChoose(xmasSess.qs[xmasSess.i].correct)'); await tick(); }
  assert.equal(g.get('S.stars'), 2);
});

test('bấm đáp án hai lần liền chỉ tính một', () => {
  const g = setup();
  g.run(`xmasTalk('${quizNpc(g)}')`);
  g.run('xmasChoose(xmasSess.qs[0].correct);xmasChoose(xmasSess.qs[0].correct)');
  assert.equal(g.get('xmasSess.i'), 1);
});

test('xong rồi thì nói cảm ơn, không cộng thêm sao', async () => {
  const g = setup();
  const npc = quizNpc(g);
  g.run(`xmasTalk('${npc}')`);
  for (let k = 0; k < 3; k++) { g.run('xmasChoose(xmasSess.qs[xmasSess.i].correct)'); await tick(); }
  g.run('xmasClose()');
  g.run(`xmasTalk('${npc}')`);
  assert.equal(g.get('xmasSess'), null);
  assert.match(g.get("document.querySelector('#xdlg').innerHTML"), /Tạm biệt/);
  assert.equal(g.get('S.stars'), 3);
});

test('tìm đồ: nhận việc, nhặt đủ 3 món, quay lại nhận sao; xong cả 4 việc thì thưởng', async () => {
  const g = setup();
  const plan = JSON.parse(g.get('JSON.stringify(xmasPlan(xmasState().day))'));
  /* đố xong 3 bạn */
  for (const npc of Object.keys(plan.quiz)) {
    g.run(`xmasTalk('${npc}')`);
    for (let k = 0; k < 3; k++) { g.run('xmasChoose(xmasSess.qs[xmasSess.i].correct)'); await tick(); }
    g.run('xmasClose()');
  }
  assert.equal(g.get('S.stars'), 9);
  g.run(`xmasTalk('${plan.quest}')`);
  assert.match(g.get("document.querySelector('#xdlg').innerHTML"), /Tìm giúp tớ 3/);
  g.run('xmasAccept()');
  assert.equal(g.get('xmasQuestOn()'), true);
  for (const s of plan.spots) g.run(`xmasFound(${s})`);
  g.run(`xmasFound(${plan.spots[0]})`);   // nhặt lại cùng chỗ: không tính
  assert.equal(g.get(`xmasStatus('${plan.quest}')`), 'return');
  g.run(`xmasTalk('${plan.quest}')`);
  assert.equal(g.get('S.stars'), 15);
  assert.equal(g.get(`xmasStatus('${plan.quest}')`), 'done');
  assert.equal(g.get('S.xmas.bonus'), true);
});

test('rời làng bằng go() thì giải phóng thế giới', () => {
  const g = setup();
  g.run('var __disposed=0;xmasWorld.dispose=()=>{__disposed++};go(home)');
  assert.equal(g.get('__disposed'), 1);
  assert.equal(g.get('xmasWorld'), null);
});

test('bản đồ: chỗ giấu và nhân vật ở chỗ trống, trong biên, không bị nhà che', () => {
  const g = loadGame(FILES, { pre: PRE });
  const M = JSON.parse(g.get('JSON.stringify(XMAS_MAP)'));
  const spots = JSON.parse(g.get('JSON.stringify(XMAS_SPOTS)'));
  assert.equal(spots.length, 14);
  const solids = M.props.filter(p => p.solid > 0).map(p => ({ x: p.x, z: p.z, r: p.solid }))
    .concat(...M.cabins.map(c => JSON.parse(g.get(`JSON.stringify(xmasCabinSolids(${JSON.stringify(c)}))`))));
  const npcs = Object.entries(M.npcs).map(([id, n]) => ({ id, ...n }));
  const inBound = (p, m) => (p.x / (M.bound.rx - m)) ** 2 + (p.z / (M.bound.rz - m)) ** 2 <= 1;
  /* nhà cao ~4,6: camera nghiêng 50° nên phần đất phía bắc nhà (z nhỏ hơn) bị che khoảng 4 đơn vị */
  const hidden = p => M.cabins.some(c => Math.abs(p.x - c.x) < 3 && p.z < c.z && p.z > c.z - 6);
  for (const p of spots.concat(npcs)) {
    const tag = JSON.stringify(p);
    assert.ok(inBound(p, 1), 'ngoài biên ' + tag);
    for (const o of solids) assert.ok(Math.hypot(p.x - o.x, p.z - o.z) > o.r + .9, `trong vật cản ${JSON.stringify(o)}: ${tag}`);
    assert.ok(!hidden(p), 'bị nhà che ' + tag);
  }
  /* chỗ búp bê xuất hiện khi vào làng: trong biên, ở chỗ trống, cách nhân vật đủ xa để không đè lên */
  for (const n of npcs) {
    const m = n.meet, tag = n.id + ' meet ' + JSON.stringify(m);
    assert.ok(inBound(m, 1), tag);
    for (const o of solids) assert.ok(Math.hypot(m.x - o.x, m.z - o.z) > o.r + .5, tag);
    for (const k of npcs) assert.ok(Math.hypot(m.x - k.x, m.z - k.z) > k.r + .9, tag);
  }
  /* chỗ giấu không trùng chỗ đứng của nhân vật và cách nhau đủ xa */
  for (const s of spots) for (const n of npcs) assert.ok(Math.hypot(s.x - n.x, s.z - n.z) > 2.5, `gần ${n.id}: ${JSON.stringify(s)}`);
  for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++)
    assert.ok(Math.hypot(spots[i].x - spots[j].x, spots[i].z - spots[j].z) > 3);
  /* đi từ đầu này sang đầu kia mất 15–20 giây ở tốc độ 3 */
  const secs = 2 * M.bound.rx / g.get('W3_SPEED');
  assert.ok(secs >= 15 && secs <= 20, String(secs));
});

test('đóng hộp thoại ngay sau câu đúng thứ 3 vẫn giữ sao', () => {
  const g = setup();
  g.run('XMAS_NEXT_MS=5000');
  const npc = quizNpc(g);
  g.run(`xmasTalk('${npc}')`);
  for (let k = 0; k < 3; k++) g.run('xmasSess.lock=false;xmasChoose(xmasSess.qs[xmasSess.i].correct)');
  g.run('xmasClose()');
  assert.equal(g.get('S.stars'), 3);
  assert.equal(g.get(`xmasStatus('${npc}')`), 'done');
});

/* world giả ghi lại các lần walkTo, có búp bê ở chỗ xuất phát */
function walker(g, x, z) {
  g.run(`var __walks=[];xmasReady=true;xmasPlayer={x:${x},z:${z}};
    xmasWorld.walkTo=(x,z,stop,cb)=>{__walks.push({x,z,stop,cb})};`);
}
test('đường thẳng cắt cây thông giữa làng thì đi vòng qua một điểm', () => {
  const g = setup();
  walker(g, 0, 6);
  g.run("xmasGoNpc('santa')");
  const w1 = g.get('__walks[0]');
  assert.ok(Math.hypot(w1.x - g.get('XMAS_TREE.x'), w1.z - g.get('XMAS_TREE.z')) > 4.5, 'điểm vòng nằm ngoài vòng cây');
  assert.ok(Math.abs(w1.x) > 4, 'điểm vòng ở bên cạnh cây');
  g.run('xmasPlayer.x=__walks[0].x;xmasPlayer.z=__walks[0].z;__walks[0].cb(true)');
  const w2 = g.get('__walks[1]');
  assert.ok(Math.hypot(w2.x - 0, w2.z + 10) < 1.6, 'chặng 2 tới cạnh ông già Noel');
  /* không cắt cây thì đi thẳng */
  walker(g, -15, 3);
  g.run("xmasGoNpc('snowman')");
  assert.equal(g.get('__walks.length'), 1);
});
test('kẹt xa nhân vật thì Kuromi nhắc, không im lặng', () => {
  const g = setup();
  walker(g, -15, 3);
  g.run("xmasGoNpc('snowman');xmasPlayer.x=-10;__walks[0].cb(false)");
  assert.equal(g.get('xmasDlgOn'), false);
  assert.match(g.get("document.querySelector('#mbub').textContent"), /thanh trên/);
});
test('thanh việc có nút đi tới từng nhân vật; vào làng đứng gần nhân vật còn việc', () => {
  const g = setup();
  g.run('xmasBar()');
  assert.match(g.get("document.querySelector('#xbar').innerHTML"), /<button[^>]*onclick="xmasGoNpc\('santa'\)"/);
  const p = JSON.parse(g.get('JSON.stringify(xmasStartPos())'));
  const near = Object.values(JSON.parse(g.get('JSON.stringify(XMAS_MAP.npcs)'))).some(n => Math.hypot(n.x - p.x, n.z - p.z) < 5);
  assert.ok(near, JSON.stringify(p));
});

test('dựng làng quá lâu thì báo "Làng đang ngủ", bản dựng về muộn tự giải phóng', async () => {
  const g = loadGame(FILES, { pre: PRE, storage: { be_vui_device_v1: 'A', be_vui_hoc_toan_v1: JSON.stringify({ name: 'Mai', voice: false, sfx: false, music: false }) } });
  g.run(`var __late,__disposed=0;XMAS_BUILD_MS=20;w3Supported=()=>true;
    w3Create=()=>new Promise(r=>{__late=r});xmasVillage()`);
  assert.match(g.get('app.innerHTML'), /xwait/);
  assert.match(g.get('app.innerHTML'), /class="back"/, 'nút ⬅️ có ngay trong lúc chờ');
  await tick(60);
  assert.match(g.get('app.innerHTML'), /xfail/);
  g.run('__late({dispose(){__disposed++}})');
  await tick();
  assert.equal(g.get('__disposed'), 1);
  assert.equal(g.get('xmasWorld'), null);
});

test('đồ lỗi nạp: bỏ chỗ giữ để sinh lại, không lỗi chưa bắt', async () => {
  const g = setup();
  const plan = JSON.parse(g.get('JSON.stringify(xmasPlan(xmasState().day))'));
  g.run(`var __warn=0;console={warn(){__warn++}};xmasReady=true;xmasQuestDay=xmasCurPlan().day;
    xmasWorld.pickup=()=>({remove(){}});xmasWorld.model=()=>Promise.reject(new Error('404'));xmasSpawn()`);
  assert.equal(g.get('Object.keys(xmasPicks).length'), 3);
  await tick();
  assert.equal(g.get('Object.keys(xmasPicks).length'), 0);
  assert.equal(g.get('__warn'), 3);
  /* lần sau sinh lại được */
  g.run(`xmasWorld.model=()=>Promise.resolve({});xmasSpawn()`);
  await tick();
  assert.equal(g.get('Object.keys(xmasPicks).length'), 3);
  assert.ok(plan.spots.length === 3);
});

test('nhãn nhân vật giao việc: ❗ khi chưa nhận, món đồ khi đang đi tìm; đủ 3 món Kuromi nhắc quay lại', async () => {
  const g = setup();
  const plan = JSON.parse(g.get('JSON.stringify(xmasPlan(xmasState().day))'));
  for (const npc of Object.keys(plan.quiz)) {
    g.run(`xmasTalk('${npc}')`);
    for (let k = 0; k < 3; k++) { g.run('xmasChoose(xmasSess.qs[xmasSess.i].correct)'); await tick(); }
    g.run('xmasClose()');
  }
  const icon = g.get('xmasItem().icon');
  g.run(`xmasNpcH={};XMAS_NPCS.forEach(p=>xmasNpcH[p.id]={setMark(t){__marks[p.id]=t}});xmasMarks()`);
  assert.equal(g.get(`__marks['${plan.quest}']`), '❗');
  g.run('xmasTalk(' + JSON.stringify(plan.quest) + ');xmasAccept()');
  assert.equal(g.get(`__marks['${plan.quest}']`), icon, 'đang tìm: hiện món đồ');
  g.run(`document.querySelector('#mbub').textContent='';var __emo=null;xmasFound(${plan.spots[0]});xmasFound(${plan.spots[1]})`);
  assert.equal(g.get(`__marks['${plan.quest}']`), icon);
  assert.doesNotMatch(g.get("document.querySelector('#mbub').textContent"), /Đủ rồi/);
  g.run(`xmasFound(${plan.spots[2]})`);
  const name = g.get(`xmasNpc('${plan.quest}').name`);
  assert.equal(g.get("document.querySelector('#mbub').textContent"), `Đủ rồi! Mang về cho ${name} nha!`);
  assert.equal(g.get(`__marks['${plan.quest}']`), icon);
});
