const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/shop.js','js/village.js'];
const plain = x => JSON.parse(JSON.stringify(x));
/* làng giả: 4 nhân vật, 2 món đồ, 5 chỗ giấu, kho 12 câu */
const MAKE = `var VQ=Array.from({length:12},(_,i)=>({id:'v'+i,q:'Câu '+i,c:['x','y','z'],a:i%3}));
  var V=makeVillage({id:'vtest',field:'vtest',npcs:[{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'},{id:'d',name:'D'}],
    items:[{id:'i1',name:'một'},{id:'i2',name:'hai'}],spots:[{x:0,z:0},{x:1,z:1},{x:2,z:2},{x:3,z:3},{x:4,z:4}],
    quiz:()=>VQ,field:'vtest',seed:7});var today=dayStr(new Date());`;
const load = () => { const g = loadGame(FILES); g.run(MAKE); return g; };

test('kế hoạch tất định, 3 nhân vật đố mỗi người 3 câu', () => {
  const g = load();
  const a = plain(g.get("V.plan('2027-1-1')")), b = plain(g.get("V.plan('2027-1-1')"));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const keys = Object.keys(a.quiz);
  assert.equal(keys.length, 3);
  assert.ok(!keys.includes(a.quest));
  const bank = plain(g.get('VQ'));
  for (const k of keys) {
    assert.equal(a.quiz[k].length, 3);
    for (const q of a.quiz[k]) {
      const o = bank.find(x => x.id === q.id);
      assert.equal(q.choices[q.correct], o.c[o.a]);
    }
  }
});
test('mỗi làng một field riêng', () => {
  const g = load();
  g.run("V.complete('a',3,today)");
  assert.deepEqual(plain(g.get('S.vtest.done')), ['a']);
  assert.deepEqual(plain(g.get('S.xmas')), { day: '', done: [], found: [], bonus: false });
});
test('thưởng khi đủ 4 việc, tối đa 15 sao', () => {
  const g = load();
  const before = g.get('S.stars');
  const r = ['a','b','c','d'].map(n => plain(g.get(`V.complete('${n}',3,today)`)));
  assert.equal(r[3].bonus, 3);
  assert.equal(g.get('S.stars') - before, 15);
  assert.equal(g.get("V.complete('a',3,today)"), null);
  assert.equal(g.get('S.stars') - before, 15);
});
test('sang ngày mới thì reset', () => {
  const g = load();
  g.run("S.vtest={day:'2000-1-1',done:['a'],found:[1],bonus:true}");
  assert.deepEqual(plain(g.get('V.state()')), plain(g.get('({day:today,done:[],found:[],bonus:false})')));
});
test('status theo việc', () => {
  const g = load();
  const plan = plain(g.get('V.plan(today)'));
  const other = ['a','b','c','d'].find(n => n !== plan.quest);
  assert.equal(g.get(`V.status('${other}')`), 'quiz');
  assert.equal(g.get(`V.status('${plan.quest}')`), 'quest');
  plan.spots.forEach(s => g.run(`V.pickup(${s},today)`));
  assert.equal(g.get(`V.status('${plan.quest}')`), 'return');
  g.run(`V.complete('${plan.quest}',3,today)`);
  assert.equal(g.get(`V.status('${plan.quest}')`), 'done');
});
