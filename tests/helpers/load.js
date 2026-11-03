/* Tải các file js/*.js vào một context vm với DOM, Audio và speechSynthesis giả */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');

function fakeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(), innerHTML: '', textContent: '', style: {}, dataset: {}, children: [], src: '',
    className: '', parentNode: null, isConnected: true,
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, on) { if (on === undefined) on = !this._s.has(c); on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); }
    },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    prepend(c) { this.children.unshift(c); c.parentNode = this; },
    insertAdjacentHTML() {}, remove() { el.isConnected = false; }, before() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
    get offsetWidth() { return 0; }
  };
  return el;
}

function loadGame(files, opts = {}) {
  const store = new Map(Object.entries(opts.storage || {}));
  const tts = [];
  const byId = {};
  const document = {
    body: fakeEl('body'), documentElement: fakeEl('html'),
    querySelector: s => (opts.query && opts.query(s)) || (s[0] === '#' ? (byId[s] = byId[s] || fakeEl()) : null),
    querySelectorAll: s => (opts.queryAll && opts.queryAll(s)) || [],
    getElementById: id => document.querySelector('#' + id),
    createElement: t => fakeEl(t), addEventListener() {}
  };
  class SpeechSynthesisUtterance { constructor(text) { this.text = text; } }
  const ctx = {
    console, Math, Date, JSON, Promise, Object, Array, Set, Map, String, Number, Error,
    setTimeout: opts.setTimeout || setTimeout, clearTimeout: opts.clearTimeout || clearTimeout,
    setInterval, clearInterval, document, fakeEl,
    localStorage: {
      getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)
    },
    Audio: opts.Audio || class { constructor(src) { this.src = src; } play() { return Promise.resolve(); } pause() {} addEventListener() {} },
    SpeechSynthesisUtterance,
    speechSynthesis: opts.noTTS ? undefined : {
      speak(u) { tts.push(u); setTimeout(() => u.onend && u.onend(), 1); }, cancel() {}
    },
    navigator: { userAgent: 'node' }, matchMedia: () => ({ matches: false }),
    addEventListener() {}, removeEventListener() {}, innerWidth: 1024, innerHeight: 768,
    __tts: tts, __store: store
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  if (opts.pre) vm.runInContext(opts.pre, ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return { ctx, get: expr => vm.runInContext(expr, ctx), run: code => vm.runInContext(code, ctx) };
}
module.exports = { loadGame, fakeEl, ROOT };
