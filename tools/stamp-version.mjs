/* Đóng dấu phiên bản để trình duyệt không dùng file cũ trong cache.
   Băm nội dung mọi js/css cục bộ mà index.html nạp → gắn ?v=<hash> vào URL,
   ghi <meta name="app-version"> và version.json. Chạy: npm run stamp (idempotent). */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF_RE = /(<script\s+src="|<link\s+rel="stylesheet"\s+href=")((?:js|css|audio)\/[^"?]+)(?:\?v=[^"]*)?(")/g;
const META_RE = /<meta name="app-version" content="[^"]*">\n?/;

export function assetPaths(html) {
  return [...html.matchAll(REF_RE)].map(m => m[2]);
}

export function computeVersion(html, root = ROOT) {
  const h = crypto.createHash('sha1');
  for (const p of assetPaths(html)) {
    h.update(p).update(fs.readFileSync(path.join(root, p)));
  }
  return h.digest('hex').slice(0, 10);
}

export function stampHtml(html, v) {
  const withRefs = html.replace(REF_RE, (_, a, p, q) => `${a}${p}?v=${v}${q}`);
  const meta = `<meta name="app-version" content="${v}">\n`;
  return META_RE.test(withRefs)
    ? withRefs.replace(META_RE, meta)
    : withRefs.replace('<meta name="viewport"', meta + '<meta name="viewport"');
}

export function stamp(root = ROOT) {
  const file = path.join(root, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const v = computeVersion(html, root);
  const out = stampHtml(html, v);
  if (out !== html) fs.writeFileSync(file, out);
  fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ v }) + '\n');
  return v;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Đã đóng dấu phiên bản:', stamp());
}
