const test = require('node:test'), assert = require('node:assert/strict');
const { loadGame } = require('./helpers/load');
const FILES = ['js/core.js','js/merge.js','js/questions.js','js/rewards.js','js/lines.js','audio/voice/manifest.js','js/voice.js','js/music.js'];
const TET = 'https://cdn.test/songs/xuan-sum-vay.mp3';

function setup(music = true) {
  const log = { plays: 0, pauses: 0, srcSets: 0, crossOrigin: undefined, el: null };
  class FakeAudio {
    constructor() { this._src = ''; this.l = {}; log.el = this; }
    get src() { return this._src; }
    set src(v) { this._src = v; log.srcSets++; log.crossOrigin = this.crossOrigin; }
    play() { log.plays++; return Promise.resolve(); }
    pause() { log.pauses++; }
    addEventListener(t, f) { (this.l[t] = this.l[t] || []).push(f); }
    fire(t) { (this.l[t] || []).forEach(f => f()); }
  }
  const g = loadGame(FILES, {
    Audio: FakeAudio, storage: { be_vui_hoc_toan_v1: JSON.stringify({ voice: true, sfx: true, music }) },
    pre: 'var setInterval=()=>1,clearInterval=()=>{};var location={protocol:"https:"};'
  });
  g.run(`music.theme('vil-tet','${TET}')`);
  return { g, log };
}

test('màn thường phát nhạc chung', () => {
  const { g } = setup();
  g.run(`music.scene('home')`);
  assert.match(g.get('music.src()'), /kuromi-lofi\.m4a$/);
});

test('màn có nhạc riêng phát bài của màn', () => {
  const { g, log } = setup();
  g.run(`music.scene('vil-pick vil-tet')`);
  assert.equal(g.get('music.src()'), TET);
  assert.equal(log.crossOrigin, 'anonymous');
  const n = log.srcSets;
  g.run(`music.scene('vil vil-tet')`);
  assert.equal(g.get('music.src()'), TET);
  assert.equal(log.srcSets, n);
  g.run(`music.scene('home')`);
  assert.match(g.get('music.src()'), /kuromi-lofi\.m4a$/);
});

test('màn chơi vẫn tắt nhạc', () => {
  const { g, log } = setup();
  g.run(`music.scene('play')`);
  assert.ok(log.pauses > 0 || log.plays === 0);
  g.run(`music.scene('home')`);
  const p = log.pauses;
  g.run(`music.scene('play')`);
  assert.ok(log.pauses > p);
});

test('tải bài riêng lỗi thì quay về nhạc chung', () => {
  const { g, log } = setup();
  g.run(`music.scene('vil vil-tet')`);
  log.el.fire('error');
  assert.match(g.get('music.src()'), /kuromi-lofi\.m4a$/);
  g.run(`music.scene('vil-pick vil-tet')`);
  assert.match(g.get('music.src()'), /kuromi-lofi\.m4a$/);
});

test('tắt nhạc thì không phát bài riêng', () => {
  const { g, log } = setup(false);
  g.run(`music.scene('vil vil-tet')`);
  assert.equal(log.plays, 0);
});
