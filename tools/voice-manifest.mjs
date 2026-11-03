/* Quét audio/voice/*.mp3 rồi ghi audio/voice/manifest.js (danh sách id file đang có) */
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'audio/voice');
const ids = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(dir, 'manifest.js'),
  `/* Sinh bởi tools/voice-manifest.mjs: id các file mp3 đang có trong audio/voice/ */\nconst VOICE_FILES=${JSON.stringify(ids)};\n`);
console.log(`manifest.js: ${ids.length} file`);
