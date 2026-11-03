const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const g = loadGame(['js/core.js','js/questions.js','js/rewards.js','js/pattern.js','js/lines.js','js/voice.js']);

test('numberWords', () => {
  const w = g.get('numberWords');
  assert.deepEqual([0,1,4,5,10,11,14,15,20,21,24,25,30,55,99,100].map(w),
   ['không','một','bốn','năm','mười','mười một','mười bốn','mười lăm','hai mươi','hai mươi mốt',
    'hai mươi tư','hai mươi lăm','ba mươi','năm mươi lăm','chín mươi chín','một trăm']);
});
test('normalizeSpeech', () => {
  const n = g.get('normalizeSpeech');
  assert.equal(n('Có bao nhiêu 🍎 ?'), 'có bao nhiêu quả táo');
  assert.equal(n('Gộp lại: 3 + 4 = ?'), 'gộp lại ba cộng bốn bằng');
  assert.equal(n('9 hình nhỏ + 4 hình vuông 2×2'), 'chín hình nhỏ cộng bốn hình vuông hai nhân hai');
});
test('segment: khớp dài nhất và trả null khi thiếu', () => {
  const s = g.get('segment');
  assert.deepEqual([...s('5 cộng 7 bằng mấy?')], ['num_5','p_cong','num_7','p_bang_may']);
  assert.equal(s('con khủng long bay'), null);
});
test('mọi đề và mọi giải thích ở mọi mức đều ghép được', () => {
  const GAMES = g.get('GAMES'), s = g.get('segment'), miss = new Set();
  for (const [k, G] of Object.entries(GAMES)) for (let l = 0; l < G.levels.length; l++)
    for (let i = 0; i < 400; i++) { const q = G.gen(l);
      for (const t of [q.say || q.prompt, q.explain].filter(Boolean)) if (!s(t)) miss.add(`${k}-${l}: ${t}`); }
  assert.deepEqual([...miss], []);
});
test('segment: các số đứng cạnh nhau không bị đọc dính vào nhau', () => {
  const s = g.get('segment');
  assert.deepEqual([...s('Hai dãy đan xen: 10, 20, 30...')], ['p_hai_day_dan_xen','num_10','num_20','num_30']);
});
