const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const load = () => loadGame(['js/lines.js']);

test('đủ nhóm lời làng', () => {
  const g = load();
  const groups = ['xmas_outfit', 'xmas_enter', 'xmas_quiz', 'xmas_quest', 'xmas_found', 'xmas_all_done'];
  for (const n of ['santa', 'snowman', 'reindeer', 'nutcracker']) groups.push(`xmas_${n}_hi`, `xmas_${n}_thanks`);
  assert.equal(groups.length, 14);
  for (const k of groups) assert.ok(g.get(`LINES['${k}']`) && g.get(`LINES['${k}'].length`) >= 1, k);
});
test('giọng Noel đúng id và trỏ tới nhóm có thật', () => {
  const g = load();
  for (const k of g.get('Object.keys(LINE_VOICES)')) assert.ok(g.get(`LINES['${k}']`), k);
  assert.equal(g.get('LINE_VOICES.xmas_santa_hi'), '1wg2wOjdEWKA7yQD8Kca');
  assert.equal(g.get('LINE_VOICES.xmas_santa_thanks'), '1wg2wOjdEWKA7yQD8Kca');
});
