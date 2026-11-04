/* Sinh kịch bản cho ElevenLabs từ js/lines.js:
   audio/voice/script.csv, audio/voice/script.md, audio/voice/voice-prompt.md */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { S: {}, VOICE_FILES: [] }; vm.createContext(ctx);
for (const f of ['js/lines.js', 'js/voice.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const { LINES, PHRASES, numberWords } = vm.runInContext('({LINES,PHRASES,numberWords})', ctx);

const plain = t => String(t).replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\s+/g, ' ').trim();
const rows = [];
for (const [group, arr] of Object.entries(LINES)) for (const x of arr) rows.push({ file: x.id + '.mp3', text: plain(x.text), group, emotion: x.emo, tone: x.tone });
for (const p of PHRASES) rows.push({ file: p.id + '.mp3', text: p.text, group: 'ghep_de', emotion: 'neutral', tone: 'đọc trung tính, đều giọng, không lên giọng cuối' });
for (let n = 0; n <= 100; n++) rows.push({ file: `num_${n}.mp3`, text: numberWords(n), group: 'so', emotion: 'neutral', tone: 'đọc rõ, trung tính, không lên giọng cuối' });

/* Thẻ cảm xúc (audio tag) của ElevenLabs v3 cho từng cách đọc; cột "elevenlabs" = thẻ + câu nói, dán thẳng vào ô nhập */
const TAGS = {
  'đọc rõ, trung tính, không lên giọng cuối': '[calm]',
  'đọc trung tính, đều giọng, không lên giọng cuối': '[calm]',
  'hào hứng, rõ ràng': '[excited]',
  'reo vui': '[cheerfully]',
  'reo vui, ngắn gọn': '[cheerfully]',
  'reo vui, phấn khích': '[excited]',
  'reo vui, tự hào': '[proudly]',
  'reo vui, bất ngờ': '[surprised]',
  'vui, rõ ràng': '[cheerfully]',
  'hướng dẫn, vui': '[cheerfully]',
  'trầm trồ': '[amazed]',
  'tự hào': '[proudly]',
  'ấm áp, thân thiện': '[warmly]',
  'vui vẻ, khích lệ': '[encouragingly]',
  'nhẹ nhàng, khích lệ': '[encouragingly]',
  'nhẹ nhàng, an ủi': '[gently]',
  'dịu dàng, động viên': '[gently]',
  'nhẹ nhàng, giải thích': '[gently]',
  'tinh nghịch, cười khúc khích': '[playfully] [giggles]',
  'hào hứng, bí ẩn': '[mysteriously]',
  'phấn khích': '[excited]',
  'phấn khích, reo to': '[excited]',
  'phấn khích, bất ngờ': '[surprised]',
  'thì thầm gợi ý': '[whispers]',
  'háo hức, tò mò': '[curious]',
  'thân thiện, tò mò': '[curious]',
  'thích thú, mơ mộng': '[dreamy]',
};
const EMO_TAG = { neutral: '[calm]', happy: '[cheerfully]', think: '[gently]', clap: '[excited]' };
for (const r of rows) r.elevenlabs = `${TAGS[r.tone] || EMO_TAG[r.emotion] || ''} ${r.text}`.trim();

const csv = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
const out = path.join(ROOT, 'audio/voice');
fs.writeFileSync(path.join(out, 'script.csv'), ['file,text,group,emotion,tone,elevenlabs', ...rows.map(r => [r.file, r.text, r.group, r.emotion, r.tone, r.elevenlabs].map(csv).join(','))].join('\n') + '\n');

const EMO = { neutral: 'Trung tính', happy: 'Vui sướng', think: 'Suy nghĩ', clap: 'Vỗ tay' };
let md = `# Kịch bản giọng Kuromi\n\nTổng cộng **${rows.length} file**. Đặt tên file đúng cột "File", bỏ vào \`audio/voice/\`, rồi chạy \`npm run voice:manifest\`.\n`;
let lastGroup = '';
for (const r of rows) {
  if (r.group !== lastGroup) {
    lastGroup = r.group;
    const title = r.group === 'ghep_de' ? 'Mẩu ghép đề bài' : r.group === 'so' ? 'Mẩu số 0–100' : `Điểm chạm: ${r.group}`;
    md += `\n## ${title}\n\n| File | Câu nói | Cảm xúc | Cách đọc |\n|---|---|---|---|\n`;
  }
  md += `| \`${r.file}\` | ${r.text} | ${EMO[r.emotion]} | ${r.tone} |\n`;
}
fs.writeFileSync(path.join(out, 'script.md'), md);

fs.writeFileSync(path.join(out, 'voice-prompt.md'), `# Tạo giọng Kuromi trên ElevenLabs

## 1. Tạo giọng (Voice Design)

Dán đoạn mô tả này vào ô mô tả giọng:

> A cute chibi girl voice, around 7–8 years old, speaking Vietnamese with a Northern (Hanoi) accent. Bright, clear and sweet, a little playful and mischievous, warm and very expressive. Speaks slowly and clearly so that 6–7 year old children can follow easily. Friendly cartoon-companion energy, gentle and encouraging, never shouting.

Câu mẫu để nghe thử: "Xin chào! Mình là Kuromi. Hôm nay mình cùng học thật vui nha!"

Không ghi tên diễn viên lồng tiếng hay nhân vật có bản quyền vào mô tả.

## 2. Cài đặt khi tạo file

- Model: model đa ngôn ngữ có hỗ trợ tiếng Việt (ví dụ Eleven Multilingual v2 hoặc v3).
- **Chỉ dùng một giọng đã lưu cho tất cả các file**, để các mẩu ghép nghe liền mạch.
- Stability khoảng 0,5; Similarity khoảng 0,75; Style thấp với mẩu ghép, cao hơn với câu cảm xúc.
- Câu cố định: đọc theo cột "Cách đọc" và "Cảm xúc".
- **Cột \`elevenlabs\` trong \`script.csv\`** là câu đã ghép sẵn thẻ cảm xúc (ví dụ \`[excited] Yeah! Mình là Kuromi…\`): copy cả ô dán thẳng vào ô nhập. Thẻ chỉ có tác dụng với model **Eleven v3**.
- **Mẩu ghép đề và mẩu số**: đọc trung tính, đều giọng, không lên giọng hay xuống giọng ở cuối, không ngừng dài ở đầu hoặc cuối file.
- Xuất mp3 (44,1kHz, 128kbps là đủ).

## 3. Đưa file vào game

1. Đặt tên file đúng như cột "File" trong \`script.md\` hoặc \`script.csv\`.
2. Bỏ tất cả vào thư mục \`audio/voice/\`.
3. Chạy \`npm run voice:manifest\` để game nhận các file mới.

Có thể làm dần: file nào chưa có thì game tự dùng giọng máy cho câu đó.
`);
console.log(`Đã ghi ${rows.length} dòng vào audio/voice/script.csv, script.md và voice-prompt.md`);
