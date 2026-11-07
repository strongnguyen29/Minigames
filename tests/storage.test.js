const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const KEY = 'be_vui_hoc_toan_v1';
const FILES = ['js/core.js','js/lines.js','audio/voice/manifest.js','js/voice.js'];
const withSaved = obj => loadGame(FILES, { storage: { [KEY]: JSON.stringify(obj) } });

test('dữ liệu cũ sound:false thì voice và sfx cùng tắt, dữ liệu khác giữ nguyên', () => {
  const g = withSaved({ name:'Mai', stars:40, spent:15, owned:['fashion/pink-dress'], stickers:['🐶'], sound:false });
  const S = g.get('S');
  assert.equal(S.voice, false); assert.equal(S.sfx, false);
  assert.deepEqual([...S.owned], ['fashion/pink-dress']); assert.deepEqual([...S.stickers], ['🐶']);
  assert.equal(S.spent, 15); assert.equal(S.stars, 40); assert.equal(S.name, 'Mai');
});
test('dữ liệu cũ không có trường sound thì voice và sfx cùng bật', () => {
  const S = withSaved({ name:'Mai' }).get('S');
  assert.equal(S.voice, true); assert.equal(S.sfx, true);
});
test('đã có voice:true, sfx:false thì giữ nguyên, không lấy lại từ sound', () => {
  const S = withSaved({ name:'Mai', sound:false, voice:true, sfx:false }).get('S');
  assert.equal(S.voice, true); assert.equal(S.sfx, false);
});
test('máy mới (chưa có dữ liệu) thì voice và sfx cùng bật', () => {
  const S = loadGame(FILES).get('S');
  assert.equal(S.voice, true); assert.equal(S.sfx, true);
});
test('toggleAllSound: đang bật một trong hai thì tắt cả hai; đang tắt cả hai thì bật cả hai, và được lưu', () => {
  const g = withSaved({ name:'Mai', voice:true, sfx:false });
  g.run('toggleAllSound()');
  assert.equal(g.get('S.voice'), false); assert.equal(g.get('S.sfx'), false);
  g.run('toggleAllSound()');
  assert.equal(g.get('S.voice'), true); assert.equal(g.get('S.sfx'), true);
  assert.equal(JSON.parse(g.ctx.__store.get(KEY)).voice, true);
});

test('bản lưu cũ không có tet thì được bù', () => {
  const g = withSaved({ name:'Mai' });
  const empty = { day:'', done:[], found:[], bonus:false };
  assert.deepEqual(JSON.parse(JSON.stringify(g.get('S.tet'))), empty);
  assert.deepEqual(JSON.parse(JSON.stringify(g.get('freshSave().tet'))), empty);
  assert.equal(g.get('freshSave().tet===DEF.tet'), false);
});
