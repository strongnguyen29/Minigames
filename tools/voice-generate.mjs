/* Gọi API ElevenLabs tạo mp3 cho từng dòng audio/voice/script.csv, rồi cập nhật manifest.js.
   Cần ELEVENLABS_API_KEY trong .env; giọng lấy theo ELEVENLABS_VOICE_ID, hoặc tìm theo tên ELEVENLABS_VOICE_NAME (mặc định "Kuromi").
   Cách dùng:
     npm run voice:generate                     tạo các file còn thiếu
     npm run voice:generate -- splash hint_1    chỉ các file có tên bắt đầu bằng splash hoặc hint_1
     npm run voice:generate -- --force home     tạo lại kể cả file đã có
     npm run voice:generate -- --dry            chỉ liệt kê, không gọi API */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'audio/voice');
if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));

const API = 'https://api.elevenlabs.io/v1';
const KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_v3';
const TAGGED = MODEL.startsWith('eleven_v3') || MODEL.startsWith('eleven_v4'); // model hiểu thẻ [excited]…
const args = process.argv.slice(2);
const force = args.includes('--force'), dry = args.includes('--dry');
const prefixes = args.filter(a => !a.startsWith('--'));

function parseCsv(src) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const rows = parseCsv(fs.readFileSync(path.join(DIR, 'script.csv'), 'utf8'))
  .filter(r => !prefixes.length || prefixes.some(p => r.file.startsWith(p)))
  .filter(r => force || !fs.existsSync(path.join(DIR, r.file)));
console.log(`${rows.length} file cần tạo (model ${MODEL})`);
if (dry) { for (const r of rows) console.log(`  ${r.file}  ${TAGGED ? r.elevenlabs : r.text}`); process.exit(0); }
if (!rows.length) process.exit(0);
if (!KEY) { console.error('Thiếu ELEVENLABS_API_KEY trong .env'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(url, opts = {}, tries = 5) {
  for (let i = 1; ; i++) {
    const res = await fetch(url, { ...opts, headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', ...opts.headers } });
    if (res.ok) return res;
    const body = await res.text();
    if ((res.status === 429 || res.status >= 500) && i < tries) { await sleep(2000 * i); continue; }
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function voiceId() {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const name = (process.env.ELEVENLABS_VOICE_NAME || 'Kuromi').toLowerCase();
  const { voices } = await (await api(`${API}/voices`)).json();
  const v = voices.find(v => v.name.toLowerCase().includes(name));
  if (!v) throw new Error(`Không thấy giọng nào tên chứa "${name}". Đặt ELEVENLABS_VOICE_ID trong .env`);
  console.log(`Giọng: ${v.name} (${v.voice_id})`);
  return v.voice_id;
}

const VOICE = await voiceId();
let ok = 0, fail = 0;
async function gen(r) {
  const body = { text: TAGGED ? r.elevenlabs : r.text, model_id: MODEL };
  if (MODEL !== 'eleven_multilingual_v2') body.language_code = 'vi';
  try {
    const res = await api(`${API}/text-to-speech/${r.voice || VOICE}?output_format=mp3_44100_128`, { method: 'POST', body: JSON.stringify(body) });
    fs.writeFileSync(path.join(DIR, r.file), Buffer.from(await res.arrayBuffer()));
    console.log(`✓ ${r.file}`); ok++;
  } catch (e) { console.error(`✗ ${r.file}: ${e.message}`); fail++; }
}

// Chạy song song vài yêu cầu một lúc; gói thấp có giới hạn số yêu cầu đồng thời
const queue = [...rows], N = Number(process.env.ELEVENLABS_CONCURRENCY || 2);
await Promise.all(Array.from({ length: N }, async () => { while (queue.length) await gen(queue.shift()); }));
console.log(`Xong: ${ok} thành công, ${fail} lỗi`);
if (ok) execFileSync('node', [path.join(ROOT, 'tools/voice-manifest.mjs')], { stdio: 'inherit' });
process.exit(fail ? 1 : 0);
