const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const { loadGame, ROOT } = require('./helpers/load');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

test('index.html đã đóng dấu đúng phiên bản hiện tại (chạy npm run stamp nếu lỗi)', async () => {
  const { computeVersion } = await import('../tools/stamp-version.mjs');
  const v = computeVersion(html, ROOT);
  assert.match(html, new RegExp(`<meta name="app-version" content="${v}">`));
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8')).v, v);
  const refs = [...html.matchAll(/(?:src|href)="((?:js|css|audio)\/[^"?]+)(\?v=[^"]*)?"/g)];
  assert.ok(refs.length > 20);
  for (const [, p, q] of refs) if (/\.(js|css)$/.test(p)) assert.equal(q, `?v=${v}`, p);
});

test('stampHtml idempotent', async () => {
  const { stampHtml } = await import('../tools/stamp-version.mjs');
  assert.equal(stampHtml(stampHtml(html, 'abc'), 'abc'), stampHtml(html, 'abc'));
});

function game(remote, local = 'v1') {
  const g = loadGame(['js/update.js'], {
    query: s => (s === 'meta[name="app-version"]' ? { content: local } : null)
  });
  const added = [];
  g.ctx.document.body.appendChild = el => added.push(el);
  g.ctx.location = { pathname: '/Minigames/', replace(u) { added.replaceUrl = u; } };
  g.ctx.encodeURIComponent = encodeURIComponent;
  g.ctx.fetch = async () => remote === 'offline' ? Promise.reject(new Error('x')) : ({ ok: true, json: async () => ({ v: remote }) });
  return { g, added };
}

test('version.json khác meta → hiện banner, bấm thì tải URL mới', async () => {
  const { g, added } = game('v2');
  await g.run('checkUpdate()');
  assert.equal(added.length, 1);
  added[0].onclick();
  assert.equal(added.replaceUrl, '/Minigames/?v=v2');
});

test('cùng phiên bản hoặc offline → không hiện banner', async () => {
  for (const remote of ['v1', 'offline']) {
    const { g, added } = game(remote);
    await g.run('checkUpdate()');
    assert.equal(added.length, 0, remote);
  }
});

test('chỉ hiện banner một lần', async () => {
  const { g, added } = game('v2');
  await g.run('checkUpdate()');
  await g.run('checkUpdate()');
  assert.equal(added.length, 1);
});
