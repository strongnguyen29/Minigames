const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const g = loadGame(['js/core.js', 'js/chat.js']);
const plain = x => JSON.parse(JSON.stringify(x));
const parse = raw => { g.ctx.__raw = raw; return plain(g.get('chatParse(__raw)')); };

test('chatParse: JSON đúng', () => {
  assert.deepEqual(parse('{"heard":"một cộng một","reply":"Bằng hai nha!","emotion":"happy"}'),
    { heard: 'một cộng một', reply: 'Bằng hai nha!', emotion: 'happy' });
});
test('chatParse: JSON bọc trong khối ```json vẫn đọc được', () => {
  assert.equal(parse('```json\n{"heard":"a","reply":"b","emotion":"clap"}\n```').emotion, 'clap');
});
test('chatParse: JSON hỏng hoặc reply rỗng thì null', () => {
  assert.equal(parse('không phải json'), null);
  assert.equal(parse('{"heard":"a","reply":"   ","emotion":"happy"}'), null);
  assert.equal(parse('{"heard":"a"}'), null);
});
test('chatParse: emotion lạ thành neutral, thiếu heard thành rỗng', () => {
  const r = parse('{"reply":"Chào bé!","emotion":"angry"}');
  assert.equal(r.emotion, 'neutral'); assert.equal(r.heard, '');
});
test('chatParse: reply quá dài bị cắt còn 300 ký tự', () => {
  assert.equal(parse(JSON.stringify({ heard: 'a', reply: 'x'.repeat(500), emotion: 'happy' })).reply.length, 300);
});

test('chatEncodeWav: header chuẩn và mẫu 16-bit', () => {
  g.ctx.__s = new Float32Array([0, 1, -1]);
  const w = Array.from(g.get('chatEncodeWav(__s,16000)'));
  assert.equal(w.length, 44 + 6);
  const dv = new DataView(Uint8Array.from(w).buffer), tag = o => String.fromCharCode(...w.slice(o, o + 4));
  assert.equal(tag(0), 'RIFF'); assert.equal(tag(8), 'WAVE'); assert.equal(tag(36), 'data');
  assert.equal(dv.getUint32(24, true), 16000);
  assert.equal(dv.getUint32(40, true), 6);
  assert.equal(dv.getInt16(44, true), 0); assert.equal(dv.getInt16(46, true), 32767); assert.equal(dv.getInt16(48, true), -32768);
});
test('chatPcmToWav: giữ nguyên phần PCM', () => {
  g.ctx.__p = new Uint8Array([1, 2, 3, 4]);
  const w = Array.from(g.get('chatPcmToWav(__p,24000)'));
  assert.deepEqual(w.slice(44), [1, 2, 3, 4]);
  assert.equal(new DataView(Uint8Array.from(w).buffer).getUint32(24, true), 24000);
});
test('base64: chatFromB64(chatB64(x)) trả lại x, kể cả mảng lớn', () => {
  const big = Uint8Array.from({ length: 200000 }, (_, i) => i % 251);
  g.ctx.__b = big;
  assert.deepEqual(Array.from(g.get('chatFromB64(chatB64(__b))')), Array.from(big));
});
