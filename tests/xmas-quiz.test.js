const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/xmas-quiz.js'];
const quiz = () => JSON.parse(JSON.stringify(loadGame(FILES).get('XMAS_QUIZ')));
const TOPICS = ['xmas','winter','animal','color','home','riddle','math'];

test('kho có ít nhất 80 câu, id không trùng', () => {
  const q = quiz(), ids = q.map(x => x.id);
  assert.ok(q.length >= 80);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id, i) => assert.equal(id, 'xq' + String(i + 1).padStart(3, '0')));
});
test('mỗi câu 3–4 đáp án không trùng, a hợp lệ', () => {
  for (const x of quiz()) {
    assert.ok(x.c.length === 3 || x.c.length === 4, x.id);
    assert.equal(new Set(x.c).size, x.c.length, x.id);
    assert.ok(Number.isInteger(x.a) && x.a >= 0 && x.a < x.c.length, x.id);
  }
});
test('câu ngắn để máy đọc rõ', () => {
  for (const x of quiz()) {
    assert.ok(x.q.split(/\s+/).length <= 15, x.id);
    x.c.forEach(c => assert.ok(c.length <= 25, x.id + ' ' + c));
  }
});
test('đủ chủ đề', () => {
  const q = quiz();
  for (const t of TOPICS) assert.ok(q.filter(x => x.t === t).length >= 5, t);
  q.forEach(x => assert.ok(TOPICS.includes(x.t), x.id));
});
test('câu toán đúng', () => {
  for (const x of quiz().filter(x => x.t === 'math')) {
    const n = Number(x.c[x.a]);
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 10, x.id);
  }
});
