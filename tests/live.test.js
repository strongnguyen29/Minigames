const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const plain = x => JSON.parse(JSON.stringify(x));
const game = () => loadGame(['js/core.js', 'js/chat.js', 'js/live.js']);

test('liveSetup: model native audio, giọng và System Instructions đặt ngay lúc mở phiên, có chép lời, không khai báo hàm', () => {
  const s = plain(game().get('liveSetup()')).setup;
  assert.equal(s.model, 'models/gemini-2.5-flash-native-audio-latest');
  assert.deepEqual(s.generationConfig.responseModalities, ['AUDIO']);
  assert.equal(s.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Leda');
  assert.deepEqual(s.inputAudioTranscription, {}); assert.deepEqual(s.outputAudioTranscription, {});
  assert.equal(s.tools, undefined);
});
test('System Instructions của Live: ngắn gọn, ép trả lời tối đa 2 câu dưới 25 từ, đúng chủ đề cho bé', () => {
  const t = plain(game().get('liveSetup()')).setup.systemInstruction.parts[0].text;
  assert.ok(t.includes('Kuromi') && t.includes('tối đa 2 câu') && t.includes('dưới 25 từ'));
  assert.ok(t.includes('tiếng Việt') && t.includes('thông tin cá nhân'));
  assert.ok(t.length < 900, 'prompt phải ngắn: ' + t.length);
});
test('liveUrl: khoá nằm trong query (WebSocket trình duyệt không gửi được header), có mã hoá', () => {
  const g = game();
  const u = g.get('liveUrl("a b&c")');
  assert.ok(u.startsWith('wss://generativelanguage.googleapis.com/ws/'));
  assert.ok(u.endsWith('?key=a%20b%26c'));
});
test('liveDownsample: 48 kHz → 16 kHz giữ biên độ, đúng độ dài, chặn ở ±1', () => {
  const g = game();
  g.ctx.__a = new Float32Array(4800).fill(0.5);
  const r = g.get('liveDownsample(__a,48000)');
  assert.equal(r.length, 1600);
  assert.ok(Math.abs(r[100] - 16383) <= 1);
  g.ctx.__b = new Float32Array([2, -2, 0.25]);
  const c = Array.from(g.get('liveDownsample(__b,16000)'));
  assert.deepEqual(c, [32767, -32768, 8191]);
});
test('liveDownsample: 44,1 kHz cũng ra 16 kHz (tỉ lệ không nguyên)', () => {
  const g = game();
  g.ctx.__a = new Float32Array(4410).fill(0.1);
  assert.equal(g.get('liveDownsample(__a,44100).length'), 1600);
});
test('liveCloseKind: lý do nói về API key thì là key, còn lại là live', () => {
  const g = game();
  assert.equal(g.get('liveCloseKind(1007,"API key not valid. Please pass a valid API key.")'), 'key');
  assert.equal(g.get('liveCloseKind(1008,"Requested entity was not found.")'), 'live');
  assert.equal(g.get('liveCloseKind(1011,"")'), 'live');
});
