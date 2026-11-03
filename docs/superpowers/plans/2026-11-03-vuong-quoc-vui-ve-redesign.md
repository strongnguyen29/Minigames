# Vương Quốc Vui Vẻ: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mục tiêu:** Làm lại toàn bộ giao diện app theo phong cách "Vương quốc mây kẹo" (chibi, 3D fantasy, ưu tiên tablet ngang). Thêm mascot Kuromi có 4 cảm xúc và giọng nói ElevenLabs (đọc ghép mẩu, giọng máy dự phòng). Thêm màn mở đầu và đổi tên app thành "Vương Quốc Vui Vẻ".

**Kiến trúc:**
- Giữ kiểu script thuần, nạp theo thứ tự trong `index.html`.
- Thêm các module mới:
  - `voice.js`: chuẩn hoá chữ, ghép mẩu và phát âm thanh.
  - `lines.js`: dữ liệu lời thoại.
  - `mascot.js`: ảnh, cảm xúc và bong bóng lời nói.
  - `scene.js`: cảnh nền và khung màn hình hai cột.
  - `splash.js`: màn mở đầu.
- `ui.js`, `shop.js` và `caro.js` chỉ thay phần HTML hiển thị và gọi các module mới. Luật chơi giữ nguyên.
- Mọi kích thước dựa trên đơn vị `--u`, với `1u = min(1vw, 100dvh/75)`, tức 100u bằng chiều rộng màn 4:3. Nhờ vậy màn 16:10 không bị tràn.

**Công nghệ:** HTML, CSS và JS thuần. Test bằng `node --test` (Node 22), tải các file JS vào `vm`. Test giao diện bằng Playwright (chỉ là devDependency, app không phụ thuộc vào nó).

**Spec:** `docs/superpowers/specs/2026-11-03-vuong-quoc-vui-ve-redesign-design.md`. Bản phác ở `.superpowers/brainstorm/44358-1793703712/content/`: `E-home-game.html`, `splash-v5.html`, `other-screens.html`, `remaining-screens.html`. Lấy giá trị màu, kích thước (đổi `cqw` thành `u`) và keyframe trực tiếp từ các file này.

## Ràng buộc chung

- Không framework, không bước build, không gọi mạng lúc chạy, không font ngoài. Phải chạy được cả khi mở `index.html` trực tiếp (`file://`) lẫn trên GitHub Pages.
- **Giữ nguyên khoá `localStorage` `be_vui_hoc_toan_v1`** và mọi trường cũ. Chỉ thêm trường mới.
- Không đổi luật chơi, cách sinh câu hỏi, cách tính sao, điều kiện mở khoá, huy hiệu hay giá váy.
- Tablet ngang (1024×768, 1366×1024, 1280×800) là ưu tiên. Màn 360×740 chỉ cần chơi được, không cuộn ngang. Nút đáp án cao ít nhất 80px.
- Tên hiển thị: app là **"Vương Quốc Vui Vẻ"**, mascot là **"Kuromi"**, nút ở màn mở đầu là **"Vào ngay thôi !!"**, dòng phụ là **"học mà chơi cùng Kuromi 💜"**.
- Câu thoại gọi "bé" hoặc "bạn nhỏ", xưng "mình", **không đọc tên bé**. Bong bóng chữ được phép chèn tên bé.
- Mỗi lúc chỉ một câu được phát. Câu mới hoặc chuyển màn sẽ dừng câu cũ. Ghép đề mà thiếu bất kỳ mẩu nào thì đọc cả câu bằng giọng máy.
- Cảm xúc phản ứng (`think`, `clap`) tự về `neutral` sau **2600ms**. Màn kết quả và màn mở quà thì giữ nguyên cảm xúc (`hold`).
- Màu chính: chữ `#3a2350`; nền `#bfe0ff → #e7d4ff → #ffd9ec`. Các tông nút kẹo: tím `#c79bff→#8a4fe0`, hồng `#ffa6d2→#f0609f`, xanh `#9fe3ff→#4aa8f0`, đen tím `#5d5370→#2c2238`, xanh lá `#b7f5c9→#36c76b`, trắng tím `#fff→#f3e9ff`. Ô vàng `#fff3b0→#ffc93c`.
- Có `prefers-reduced-motion: reduce` thì tắt mọi animation lặp vô hạn.

## Trọng tâm kiểm tra

1. **Dữ liệu cũ có `sound:false`** thì sau khi cập nhật phải có `voice:false` và `sfx:false`; `owned`, `spent`, `stickers` còn nguyên. Test ở Task 3.
2. **Chỉ có một phần file âm thanh**, ví dụ phụ huynh mới tạo xong câu cố định mà chưa có mẩu số: đề ghép thiếu mẩu phải đọc cả câu bằng giọng máy, không ghép nửa nọ nửa kia, không lỗi. Test ở Task 2.
3. **Bé bấm liên tục**: bấm đáp án đúng hai lần, hoặc bấm trong lúc đang chuyển câu. Không được cộng sai tiến độ, giọng cũ phải dừng. Test ở Task 8.
4. **Rời màn khi Kuromi đang nói** (bấm ⬅️): giọng dừng, và hẹn giờ cảm xúc của màn cũ không được đổi Kuromi ở màn mới. Test ở Task 4 và Task 8.
5. **Tablet 16:10, màn dọc và 360px**: không cuộn ngang, nút đáp án ≥ 80px, Kuromi không che nút. Test ở Task 13.

---

## Cấu trúc file

| File | Trách nhiệm |
|---|---|
| `package.json` *(mới)* | `devDependencies: { "playwright": "1.64.1" }`; script `test`, `e2e`, `voice:export`, `voice:manifest` |
| `tests/helpers/load.js` *(mới)* | Tải các file `js/*.js` vào `vm` với DOM, Audio và speechSynthesis giả |
| `js/voice.js` *(mới)* | `numberWords`, `normalizeSpeech`, `segment`, phát và xếp hàng âm thanh, giọng máy dự phòng, mở khoá âm thanh |
| `js/lines.js` *(mới)* | `PHRASES` (mẩu ghép đề) và `LINES` (câu cố định theo điểm chạm) |
| `audio/voice/manifest.js` *(sinh ra)* | `const VOICE_FILES=[...]`: danh sách id đang có file mp3 |
| `tools/voice-export.mjs` *(mới)* | Sinh `audio/voice/script.csv`, `script.md`, `voice-prompt.md` từ `lines.js` |
| `tools/voice-manifest.mjs` *(mới)* | Quét `audio/voice/*.mp3` rồi ghi `manifest.js` |
| `js/core.js` | Thêm và chuyển đổi trường `voice`/`sfx`; `tone` kiểm tra `S.sfx`; `say()` chuyển sang `voice` |
| `js/mascot.js` *(mới)* | `MASCOT_IMG`, `mascotHTML`, `mascot()`, `mascotSay()`, `mascotPoke()` |
| `js/scene.js` *(mới)* | `sceneHTML()`, `screenHTML()`, `topbar()` (chuyển từ `ui.js` sang) |
| `js/splash.js` *(mới)* | `splash(next)` |
| `css/style.css` | Viết lại: biến màu, `--u`, cảnh nền, nút kẹo, khung, bố cục từng màn |
| `css/fx.css` *(mới)* | Mọi `@keyframes`, các lớp hiệu ứng, khối reduced-motion |
| `images/mascot/kuromi-{neutral,happy,think,clap}.png` *(mới)* | Bản thu nhỏ của 4 ảnh gốc (giữ nguyên file gốc) |
| `js/ui.js` | `welcome`, `settings`, `home`, `levels`, `nextQ`, `answer`, `finish`, `openGift`, `album`, `toast` |
| `js/shop.js`, `js/caro.js` | Đổi HTML và lớp CSS, gọi mascot |
| `js/main.js`, `index.html`, `manifest.webmanifest` | Màn mở đầu, thứ tự script, tên app |
| `tests/e2e/smoke.mjs` *(mới)* | Playwright: chạy qua mọi màn ở 3 khung màn hình và chụp ảnh |

Thứ tự script trong `index.html`: `core, questions, rewards, lines, audio/voice/manifest, voice, scene, mascot, shop, ui, caro, pattern, splash, main`.

---

### Task 1: Bộ test, chuẩn hoá chữ và ghép mẩu đề bài

**Files:**
- Create: `package.json`, `tests/helpers/load.js`, `js/voice.js` (chỉ phần thuần logic), `js/lines.js` (chỉ `PHRASES`), `tests/voice-segment.test.js`
- Modify: `.gitignore` (thêm `node_modules/`, `tests/e2e/shots/`)

**Interfaces:**
- Produces:
  - `loadGame(files: string[], opts?) -> { get(expr: string): any, ctx }`: chạy các file theo thứ tự trong cùng một context `vm`. `get` dùng để đọc các `const` cấp cao nhất.
  - `numberWords(n: number) -> string`
  - `normalizeSpeech(text: string) -> string`: chữ thường, các từ cách nhau một dấu cách.
  - `segment(text: string) -> string[] | null`: trả về danh sách id mẩu, hoặc `null` nếu còn từ không khớp được.
  - `PHRASES: {id: string, text: string}[]`
  - `EMOJI_WORDS: Record<string,string>`

- [ ] **Step 1: Tạo `package.json` và `tests/helpers/load.js`.** Stub cần có:
  - `localStorage` dựa trên Map, có tuỳ chọn `opts.storage` để nạp dữ liệu sẵn.
  - `document.querySelector` / `createElement` / `body` trả về phần tử giả (có `innerHTML`, `classList`, `appendChild`, `remove`, `querySelectorAll` → `[]`).
  - `window = ctx`, `setTimeout` thật, `Audio` giả (lớp do `opts.Audio` truyền vào, mặc định là lớp không làm gì).
  - `speechSynthesis` giả, ghi lại các lần `speak` vào `ctx.__tts`.

  Script `"test": "node --test tests/"`.

- [ ] **Step 2: Viết test thất bại trong `tests/voice-segment.test.js`**

```js
const g = loadGame(['js/core.js','js/questions.js','js/rewards.js','js/pattern.js','js/lines.js','js/voice.js']);
test('numberWords', () => {
  const w = g.get('numberWords');
  assert.deepEqual([0,1,4,5,10,11,14,15,20,21,24,25,30,55,99,100].map(w),
   ['không','một','bốn','năm','mười','mười một','mười bốn','mười lăm','hai mươi','hai mươi mốt',
    'hai mươi tư','hai mươi lăm','ba mươi','năm mươi lăm','chín mươi chín','một trăm']);
});
test('normalizeSpeech', () => {
  const n = g.get('normalizeSpeech');
  assert.equal(n('Có bao nhiêu 🍎 ?'), 'có bao nhiêu quả táo');
  assert.equal(n('Gộp lại: 3 + 4 = ?'), 'gộp lại ba cộng bốn bằng');
  assert.equal(n('9 hình nhỏ + 4 hình vuông 2×2'), 'chín hình nhỏ cộng bốn hình vuông hai nhân hai');
});
test('segment: khớp dài nhất và trả null khi thiếu', () => {
  const s = g.get('segment');
  assert.deepEqual(s('5 cộng 7 bằng mấy?'), ['num_5','p_cong','num_7','p_bang_may']);
  assert.equal(s('con khủng long bay'), null);
});
test('mọi đề và mọi giải thích ở mọi mức đều ghép được', () => {
  const GAMES = g.get('GAMES'), s = g.get('segment'), miss = new Set();
  for (const [k, G] of Object.entries(GAMES)) for (let l = 0; l < G.levels.length; l++)
    for (let i = 0; i < 400; i++) { const q = G.gen(l);
      for (const t of [q.say || q.prompt, q.explain].filter(Boolean)) if (!s(t)) miss.add(`${k}-${l}: ${t}`); }
  assert.deepEqual([...miss], []);
});
```

- [ ] **Step 3: Chạy `npm test`.** Kết quả mong đợi: FAIL, `numberWords is not defined`.

- [ ] **Step 4: Viết `numberWords`, `normalizeSpeech`, `segment` trong `js/voice.js`, và `PHRASES` + `EMOJI_WORDS` trong `js/lines.js`.**
  - `numberWords` đọc theo giọng miền Bắc: "mốt" cho hàng đơn vị 1 khi số ≥ 21; "tư" cho hàng đơn vị 4 khi số ≥ 24; "lăm" cho hàng đơn vị 5 khi số ≥ 15. Phạm vi 0–100, số ngoài phạm vi trả về chuỗi chữ số.
  - `normalizeSpeech`: đổi emoji thành chữ theo `EMOJI_WORDS` (gồm mọi emoji trong `OBJ`, `PEM` và các emoji khác xuất hiện trong `explain`); đổi `+` thành "cộng", `=` thành "bằng", `×` thành "nhân"; đổi dãy chữ số thành `numberWords`; bỏ dấu câu và "?"; chuyển thành chữ thường; gộp khoảng trắng.
  - `segment`: chạy `normalizeSpeech`, rồi so khớp tham lam cụm dài nhất theo từ, dựa trên một chỉ mục gồm `PHRASES` cộng các mẩu số `num_0…num_100` (chữ của mẩu số lấy từ `numberWords`).
  - `PHRASES`: thêm dần cho đến khi test bao phủ đạt. Ưu tiên cụm dài và tự nhiên, ví dụ `p_trong_hinh_nay` "trong hình này", `p_co_bao_nhieu` "có bao nhiêu", `p_hinh_tam_giac` "hình tam giác". Id có dạng `p_<chữ không dấu nối bằng _>`.

- [ ] **Step 5: Chạy `npm test`.** Kết quả mong đợi: PASS cả 4 test. Nếu test bao phủ in ra danh sách câu còn thiếu, bổ sung `PHRASES` hoặc `EMOJI_WORDS` rồi chạy lại cho tới khi rỗng.

- [ ] **Step 6: Commit** `feat(voice): text normalization and clip segmentation with coverage test`

---

### Task 2: Lời thoại, xuất kịch bản cho ElevenLabs, và bộ phát âm thanh

**Files:**
- Modify: `js/lines.js` (thêm `LINES`), `js/voice.js` (phần phát âm thanh)
- Create: `tools/voice-export.mjs`, `tools/voice-manifest.mjs`, `audio/voice/manifest.js` (bản rỗng `const VOICE_FILES=[];`), `tests/voice-play.test.js`

**Interfaces:**
- Consumes: `segment`, `normalizeSpeech`, `PHRASES` (Task 1)
- Produces:
  - `LINES: Record<Group, {id, text, emo, tone}[]>`. `emo` thuộc `'neutral'|'happy'|'think'|'clap'`. `text` có thể chứa emoji để hiển thị; giọng đọc theo `normalizeSpeech(text)`.
  - `VOICE_FILES: string[]`
  - `voice.unlock(): void`: gọi trong lần chạm đầu tiên; tạo hoặc resume `AudioContext` dùng chung với `tone`.
  - `voice.line(group: string) -> {line, done: Promise<void>}`: chọn ngẫu nhiên, không lặp câu vừa nói của cùng nhóm.
  - `voice.text(text: string) -> Promise<void>`: ghép mẩu nếu đủ file, ngược lại dùng giọng máy.
  - `voice.stop(): void`: dừng câu đang phát và resolve promise của nó.
  - `voiceWait(p: Promise, min: number, max: number) -> Promise<void>`: chờ ít nhất `min` ms, nhiều nhất `max` ms.
  - Nhóm `Group` (mỗi nhóm 3–5 câu): `splash, home, levels_count, levels_shape, levels_add, levels_split, levels_cmp, levels_pattern, round_start, correct, combo, wrong, hint, result3, result2, result1, badge, gift_open, sticker_new, sticker_all, locked, shop_hello, shop_buy, shop_poor, shop_drag, shop_wear, album_stickers, album_wardrobe, album_badges, caro_turn_x, caro_turn_o, caro_win_x, caro_win_o, welcome_ask, welcome_done, poke`.

- [ ] **Step 1: Viết test thất bại trong `tests/voice-play.test.js`.** Dùng lớp `FakeAudio`: ghi lại `src` khi `play()`, tự phát sự kiện `ended` sau 1ms, và phát `error` nếu `src` nằm trong tập `bad`.

```js
test('LINES: mỗi nhóm 3–5 câu, id duy nhất, emo hợp lệ, đủ 36 nhóm', () => {
  const L = g.get('LINES'); const ids = new Set();
  for (const [grp, arr] of Object.entries(L)) {
    assert.ok(arr.length >= 3 && arr.length <= 5, grp);
    for (const x of arr) { assert.ok(!ids.has(x.id)); ids.add(x.id);
      assert.ok(['neutral','happy','think','clap'].includes(x.emo)); }
  }
  assert.equal(Object.keys(L).length, 36);
});
test('voice.text phát đủ mẩu khi có file', async () => { /* VOICE_FILES=['num_5','p_cong','num_7','p_bang_may'] */
  await v.text('5 cộng 7 bằng mấy?');
  assert.deepEqual(played, ['audio/voice/num_5.mp3','audio/voice/p_cong.mp3','audio/voice/num_7.mp3','audio/voice/p_bang_may.mp3']);
  assert.equal(tts.length, 0);
});
test('thiếu một mẩu thì đọc cả câu bằng giọng máy', async () => { /* VOICE_FILES thiếu 'num_7' */
  await v.text('5 cộng 7 bằng mấy?');
  assert.deepEqual(played, []); assert.equal(tts[0].text, '5 cộng 7 bằng mấy?');
  assert.ok(tts[0].pitch > 1 && tts[0].rate < .85 && tts[0].lang === 'vi-VN');
});
test('file lỗi giữa chừng thì dừng phát mẩu và đọc cả câu bằng giọng máy', async () => { /* bad={'.../p_cong.mp3'} */ });
test('câu mới dừng câu cũ, promise cũ vẫn resolve', async () => {
  const a = v.text('5 cộng 7 bằng mấy?'); const b = v.line('correct').done;
  await a; await b; /* không treo */
});
test('S.voice=false thì không phát gì, promise resolve ngay', async () => {});
test('không có speechSynthesis thì vẫn resolve, không ném lỗi', async () => {});
test('voiceWait tôn trọng min và max', async () => {
  const t0 = Date.now(); await voiceWait(new Promise(()=>{}), 10, 60); assert.ok(Date.now()-t0 >= 55);
  const t1 = Date.now(); await voiceWait(Promise.resolve(), 40, 1000); assert.ok(Date.now()-t1 >= 35);
});
```

- [ ] **Step 2: Chạy `npm test`.** Kết quả mong đợi: FAIL, `LINES is not defined`.

- [ ] **Step 3: Viết `LINES` trong `js/lines.js`.**
  - Câu ngắn, vui, động viên.
  - `tone` là ghi chú cách đọc cho phụ huynh, ví dụ "reo vui", "thì thầm gợi ý".
  - `emo` khớp với cảm xúc của điểm chạm theo spec mục 5.2.
  - Có thể dùng làm mẫu các câu đã có trong spec mục 9.
  - Nhóm `hint` phải nhắc bé nhìn nút đang nhấp nháy.

- [ ] **Step 4: Viết bộ phát âm thanh trong `js/voice.js`.**
  - Một phần tử `Audio` cho mỗi lượt phát; các mẩu phát nối tiếp nhau.
  - Đường dẫn: `audio/voice/<id>.mp3`.
  - Trước khi phát, kiểm tra **mọi** id có trong `VOICE_FILES`. Thiếu bất kỳ id nào thì dùng giọng máy: `pitch 1.4`, `rate .8`, `lang 'vi-VN'`.
  - Câu cố định ở `LINES` dùng id riêng của câu; nếu id đó không có file thì đọc giọng máy theo `text` (bỏ emoji).
  - Giữ một mã lượt phát (token) tăng dần. Câu mới hoặc `stop()` thì tăng token, các lượt cũ resolve ngay.
  - `say(text)` trong `core.js` trở thành `voice.text(text)`.

- [ ] **Step 5: Viết `tools/voice-export.mjs`.**
  - Tải `js/lines.js` bằng `vm`, rồi ghi các file sau:
    - `audio/voice/script.csv` với cột `file,text,group,emotion,tone`: mỗi câu trong `LINES` một dòng, mỗi `PHRASES` một dòng, và các mẩu số `num_0…num_100`. Chữ đọc là chữ đã bỏ emoji; với mẩu số là `numberWords`.
    - `audio/voice/script.md`: cùng nội dung, nhóm theo điểm chạm, để phụ huynh dễ đọc.
    - `audio/voice/voice-prompt.md`.
  - Nội dung `voice-prompt.md`:
    - Prompt Voice Design: giọng bé gái chibi khoảng 7–8 tuổi, tiếng Việt giọng miền Bắc, trong trẻo, hơi tinh nghịch, ngọt ngào, nói chậm và rõ cho trẻ 6–7 tuổi, nhiều cảm xúc. Không ghi tên diễn viên lồng tiếng hay nhân vật có bản quyền.
    - Hướng dẫn: dùng model đa ngôn ngữ có hỗ trợ tiếng Việt, độ ổn định khoảng 0,5, **chỉ dùng một giọng** cho mọi file. Mẩu ghép đọc trung tính, không lên giọng cuối câu. Xuất mp3, đặt tên đúng cột `file`, bỏ vào `audio/voice/`, rồi chạy `npm run voice:manifest`.
  - `tools/voice-manifest.mjs` quét `audio/voice/*.mp3` và ghi `audio/voice/manifest.js`.

- [ ] **Step 6: Chạy `npm test && npm run voice:export && npm run voice:manifest`.** Kết quả mong đợi:
  - Test PASS.
  - `script.csv` có `1 + (tổng câu LINES) + PHRASES.length + 101` dòng.
  - `manifest.js` là `const VOICE_FILES=[];`.

- [ ] **Step 7: Commit** `feat(voice): Kuromi lines, ElevenLabs script export, playback with TTS fallback`. Sau đó báo phụ huynh: mở `audio/voice/voice-prompt.md` và `script.md` để bắt đầu tạo giọng.

---

### Task 3: Tách cài đặt âm thanh (`voice`, `sfx`) và chuyển dữ liệu cũ

**Files:**
- Modify: `js/core.js` (`DEF`, `load`, `tone`)
- Test: `tests/storage.test.js`

**Interfaces:**
- Produces:
  - Trường `S.voice: boolean` và `S.sfx: boolean`. `S.sound` vẫn được giữ, nhưng không còn được đọc ở đâu nữa.
  - `toggleAllSound(): void`: nếu cả hai đang tắt thì bật cả hai, ngược lại tắt cả hai. Gọi `voice.stop()` và `save()`. Đây là nút 🔊 trên thanh trên cùng.

- [ ] **Step 1: Viết test thất bại**

```js
test('dữ liệu cũ sound:false thì voice và sfx cùng tắt, dữ liệu khác giữ nguyên', () => {
  const old = {name:'Mai',stars:40,spent:15,owned:['fashion/pink-dress'],stickers:['🐶'],sound:false};
  const g = loadGame(['js/core.js'], {storage:{be_vui_hoc_toan_v1: JSON.stringify(old)}});
  const S = g.get('S');
  assert.equal(S.voice, false); assert.equal(S.sfx, false);
  assert.deepEqual(S.owned, ['fashion/pink-dress']); assert.equal(S.spent, 15); assert.equal(S.stars, 40);
});
test('dữ liệu cũ không có trường sound thì voice và sfx cùng bật', () => {});
test('đã có voice:true, sfx:false thì giữ nguyên, không lấy lại từ sound', () => {});
test('toggleAllSound: đang bật một trong hai thì tắt cả hai; đang tắt cả hai thì bật cả hai', () => {});
```

- [ ] **Step 2: Chạy `npm test`.** Kết quả mong đợi: FAIL ở `S.voice`.
- [ ] **Step 3: Sửa code.** Trong `load()`, nếu dữ liệu đã lưu không có khoá `voice` thì `voice = sfx = (s.sound !== false)`. Trong `tone()`, kiểm tra `S.sfx` thay cho `S.sound`. Thêm `toggleAllSound`.
- [ ] **Step 4: Chạy `npm test`.** Kết quả mong đợi: PASS.
- [ ] **Step 5: Commit** `feat(settings): split voice and sfx toggles with migration`

---

### Task 4: Giao diện nền: biến CSS, cảnh nền, khung màn hình và mascot

**Files:**
- Create: `css/fx.css`, `js/scene.js`, `js/mascot.js`, `images/mascot/kuromi-{neutral,happy,think,clap}.png`, `tests/mascot.test.js`
- Modify: `css/style.css` (viết lại phần nền và thành phần chung), `index.html` (thêm `fx.css` và các script mới), `js/ui.js` (bỏ `topbar` cũ)

**Interfaces:**
- Consumes: `voice.line`, `voice.stop` (Task 2)
- Produces:
  - `MASCOT_IMG = {neutral:'images/mascot/kuromi-neutral.png', happy:'…-happy.png', think:'…-think.png', clap:'…-clap.png'}`
  - `mascotHTML({emo='neutral', text='', size='lg'|'md'|'sm'|'corner'}) -> string`: một khối `.kuromi` gồm `#mbub`, `img#mimg`, `.ped`. Bấm vào ảnh thì gọi `mascotPoke()`.
  - `mascot(emo, text?, {hold=false}={}) -> void`:
    - đổi `src`;
    - xoá lớp animation rồi gắn lại lớp `emo-<emo>`;
    - nếu có `text` thì cập nhật bong bóng (và chạy lại hiệu ứng phồng).
    - Với `think`/`clap` mà không có `hold`, hẹn giờ 2600ms về `neutral`, đồng thời huỷ hẹn giờ cũ.
    - Nếu `#mimg` không còn trong DOM thì không làm gì.
  - `mascotSay(group, opts?) -> Promise<void>`:
    - gọi `voice.line(group)`;
    - gọi `mascot(opts.emo ?? line.emo, opts.bubble ?? line.text, opts)`;
    - trả về `done`.
  - `mascotPoke()`: tim và lấp lánh bay lên (`.heart`), rồi gọi `mascotSay('poke')`.
  - `mascotReset()`: huỷ hẹn giờ cảm xúc. Gọi khi chuyển màn.
  - `burst(el, n, emojis)`: tạo hạt bay lên từ một phần tử.
  - `confetti(n)` (sửa trong `core.js` hoặc chuyển sang `mascot.js`): giấy màu hình chữ nhật theo bảng `['#ffa6d2','#c79bff','#9fe3ff','#ffd54f','#b7f5c9']`.
  - `sceneHTML(opts?) -> string`: mây (3 đám, trôi), lâu đài CSS, sao lấp lánh.
  - `screenHTML({mascot, top, body, cls}) -> string`:
    - `<div class="scr ${cls}">${sceneHTML()}<aside class="mcol">${mascotHTML(mascot)}</aside><main class="mainc">${top}${body}</main></div>`;
    - khi không có `mascot` thì không có cột trái.
  - `topbar(back?) -> string`: giữ chữ ký hàm cũ. Gồm nút ⬅️ (nếu có `back`), avatar, tên (bấm để mở cài đặt), ⭐ `balance()`, 🎁 `S.gifts`, và nút 🔊/🔇 gọi `toggleAllSound()` rồi vẽ lại màn hiện tại.
  - Lớp CSS dùng chung: `.btn` + biến thể `.p-purple .p-pink .p-blue .p-dark .p-green .p-white .p-gray`, `.card3d`, `.coin`, `.back`, `.bub`, `.heart`, `.cf`.

- [ ] **Step 1: Thu nhỏ ảnh** bằng lệnh `sips -Z 900 <gốc> --out images/mascot/kuromi-<emo>.png` cho cả 4 ảnh. Ánh xạ: `style_ref`→neutral, `vui`→happy, `thinking`→think, `clap`→clap. Kết quả mong đợi: mỗi file dưới 1MB, nền vẫn trong suốt.
- [ ] **Step 2: Viết test thất bại trong `tests/mascot.test.js`.** Dùng DOM giả có `#mimg`/`#mbub`, và hẹn giờ có thể kiểm soát (truyền `setTimeout` giả qua opts).

```js
test('think không hold thì về neutral sau 2600ms', () => { mascot('think','Hmm'); tick(2599); assert.match(img.src,/think/); tick(1); assert.match(img.src,/neutral/); });
test('hold thì giữ nguyên', () => { mascot('clap','',{hold:true}); tick(5000); assert.match(img.src,/clap/); });
test('cảm xúc mới huỷ hẹn giờ cũ', () => { mascot('think'); tick(2000); mascot('clap'); tick(1000); assert.match(img.src,/clap/); });
test('mascotReset rồi #mimg bị gỡ khỏi DOM: hẹn giờ không ném lỗi, không đổi gì', () => {});
test('mascotSay dùng emo của câu thoại và đặt bong bóng theo text', () => {});
```

- [ ] **Step 3: Chạy `npm test`.** Kết quả mong đợi: FAIL.
- [ ] **Step 4: Viết `js/mascot.js` và `js/scene.js`.** Viết lại phần chung của `css/style.css`:
  - `:root` chứa các biến màu ở phần Ràng buộc chung, và `--u: min(1vw, calc(100dvh / 75))`.
  - `html, body` có nền chuyển màu và `height: 100dvh`, `overflow: hidden` khi tablet ngang.
  - `.scr` là flex hàng ngang cao `100dvh`; `.mcol` rộng `calc(var(--u) * 28)`.
  - Kích thước lấy từ bản phác, đổi `Ncqw` thành `calc(var(--u) * N)`.

  Chuyển mọi `@keyframes` của bản phác vào `css/fx.css`: `bob, twinkle, drift, pedglow, popin, floaty, jelly, wiggle, clapb, jump, tilt, shake, rise, fall, spin, wob, pop, beat, starin, letter`. Gán `.emo-neutral → bob`, `.emo-think → tilt`, `.emo-clap → clapb`, `.emo-happy → jump`.
- [ ] **Step 5: Chạy `npm test`.** Kết quả mong đợi: PASS.
- [ ] **Step 6: Commit** `feat(ui): candy-cloud theme, scene shell and Kuromi mascot component`

---

### Task 5: Màn mở đầu

**Files:**
- Create: `js/splash.js`
- Modify: `js/main.js`, `index.html`, `css/style.css`, `css/fx.css`

**Interfaces:**
- Consumes: `MASCOT_IMG`, `confetti`, `voice.unlock`, `mascotSay` (hoặc `voice.line('splash')`)
- Produces: `splash(next: () => void) -> void`

- [ ] **Step 1: Viết `splash(next)`** theo `splash-v5.html` (kiểu B).
  - Thứ tự: hộp quà lắc 2 lần từ 0,3s; nắp bung ở 1,3s; luồng sáng và tia nắng xoay; Kuromi `happy` bật ra ở 1,4s; tên "Vương Quốc Vui Vẻ" rơi từng chữ từ 1,6s, mỗi chữ cách 0,06s; dòng phụ ở 2,6s; ngôi sao chạy theo thanh tải từ 0,4s đến 2,6s; nút **"Vào ngay thôi !!"** bật ra ở 2,9s rồi nhấp nháy.
  - Trong lúc đó, tải trước 4 ảnh `MASCOT_IMG` và các file `LINES` có trong `VOICE_FILES`.
  - Nút chỉ hiện khi đã hết mốc 2,9s **và** đã tải xong ảnh mascot, hoặc quá 8s thì hiện luôn.
  - Bấm nút: gọi `voice.unlock()`, phát câu nhóm `splash`, rồi gọi `next()`. Nút bị khoá sau lần bấm đầu tiên.
- [ ] **Step 2: Sửa `js/main.js`** thành `splash(() => { if(!S.name) welcome(); else { touchStreak(); home(); } })`.
- [ ] **Step 3: Kiểm tra thủ công** bằng `npx playwright` hoặc trình duyệt ở 1024×768: hiệu ứng chạy hết, bấm nút thì vào trang chủ, console không lỗi.
- [ ] **Step 4: Commit** `feat(ui): gift-box splash screen`

---

### Task 6: Trang chủ, màn nhập tên và Cài đặt

**Files:**
- Modify: `js/ui.js` (`home`, `welcome`, `settings`, `toast`), `css/style.css`

**Interfaces:**
- Consumes: `screenHTML`, `topbar`, `mascotHTML`, `mascotSay`, `toggleAllSound`
- Produces: chữ ký các hàm màn hình giữ nguyên như cũ.

- [ ] **Step 1: Viết lại `home()`.**
  - Gồm Kuromi `neutral` (cỡ `lg`) và `mascotSay('home', {bubble: \`Chào ${S.name}! …\`})`. Bong bóng có tên bé, giọng đọc thì không.
  - Lưới 3 cột:
    - các trò trong `GAMES` theo thứ tự `count, shape, add, split, cmp, pattern`, xoay vòng màu tím, hồng, xanh;
    - tiếp theo là Cờ caro (đen tím), Tiệm công chúa (hồng), Bộ sưu tập (tím, ghi `${S.stickers.length}/${STICKERS.length}`).
  - Icon cỡ `7u`, chữ `2.5u`, dòng sao `⭐ tot/max`.
  - Chuỗi ngày 🔥 khi `S.streak > 1` đặt trong bong bóng.
  - Mỗi nút trễ hiện dần 50ms. Bấm nút thì chạy hiệu ứng `jelly` rồi chuyển màn.
  - Mọi lần chuyển màn đều gọi `voice.stop()` và `mascotReset()`. Gom vào một hàm `go(fn)` trong `ui.js`, và dùng `go` cho mọi `onclick` điều hướng ở các Task 6–12.
- [ ] **Step 2: Viết lại `welcome()`** theo bản phác số 4.
  - Kuromi `neutral` cỡ `lg`, nói nhóm `welcome_ask`.
  - Tiêu đề "Chào mừng bé!", ô nhập tên to (`maxlength 14`), 8 avatar tròn; avatar được chọn có lớp `.sel` (phóng to 1,15 lần, có viền).
  - Nút "Bắt đầu!" phát nhóm `welcome_done` rồi vào `home()`.
- [ ] **Step 3: Viết lại `settings()`** theo bản phác số 5.
  - Gồm 3 ô số liệu: `S.rounds`, `S.streak 🔥`, `S.perfect`.
  - 2 công tắc `.tg` gắn với `S.voice` và `S.sfx`. Tắt giọng thì gọi `voice.stop()`. Mỗi lần đổi đều `save()`.
  - Các nút Đổi tên / hình, Xoá dữ liệu (giữ nguyên `confirm` như cũ), Đóng.
  - Kuromi nhỏ ở góc bảng. `toast()` đổi sang kiểu kẹo dẻo.
- [ ] **Step 4: Kiểm tra trên trình duyệt ở 1024×768.** Kết quả mong đợi: bố cục khớp `E-home-game.html` mục 1 và `remaining-screens.html` mục 4–5; console không lỗi.
- [ ] **Step 5: Commit** `feat(ui): home, welcome and settings in candy-cloud style`

---

### Task 7: Màn chọn mức (con đường trên mây)

**Files:**
- Modify: `js/ui.js` (`levels`), `css/style.css`

**Interfaces:**
- Consumes: `screenHTML`, `mascotSay`, `mascot`
- Produces: `LEVEL_PATH: [x%, y%][]` gồm 6 điểm: `[[12,85],[30,55],[60,45],[85,38],[62,14],[38,16]]`

- [ ] **Step 1: Viết lại `levels(g)`.**
  - Đường SVG chấm trắng nối các điểm trong `LEVEL_PATH`.
  - Mỗi mức là nút tròn `13u`, gồm số mức, sao đã đạt và tên mức. Lớp: `.done` khi đạt ≥ 1 sao (xanh lá); `.cur` cho mức đầu tiên chưa đạt 2 sao mà không bị khoá (hồng, nhịp đập, có 🚩); `.lock` (xám, 🔒).
  - Điều kiện khoá giữ nguyên.
  - Khi vào màn: `mascotSay('levels_' + g)`.
  - Bấm mức bị khoá: nút rung, gọi `mascotSay('locked')` (`emo` là `think`), `sfx.bad()`.
  - Nếu một trò sau này có nhiều hơn 6 mức, các mức thừa xếp thành hàng nút phía dưới. Chưa cần làm ngay; ghi chú trong code là đủ.
- [ ] **Step 2: Kiểm tra trên trình duyệt.** Kết quả mong đợi: khớp `other-screens.html` mục 1; bấm mức khoá thì Kuromi chuyển sang think rồi về neutral sau 2,6s.
- [ ] **Step 3: Commit** `feat(ui): cloud-path level select`

---

### Task 8: Màn chơi và nhịp giọng nói

**Files:**
- Modify: `js/ui.js` (`start`, `nextQ`, `answer`), `css/style.css`
- Test: `tests/round-flow.test.js`

**Interfaces:**
- Consumes: `voice.text`, `voice.stop`, `voiceWait`, `mascotSay`, `mascot`
- Produces: `P.token: number`. Mỗi lần `nextQ` và mỗi lần rời màn sẽ tăng token; mọi lệnh chạy sau `await` phải so lại token rồi mới thao tác.

- [ ] **Step 1: Viết test thất bại trong `tests/round-flow.test.js`.**
  - Tải `core, questions, rewards, pattern, lines, voice, scene, mascot, ui` với DOM giả.
  - `app.querySelectorAll('.ch')` trả về các nút giả có `dataset.i`, `classList` và `onclick` được gán.
  - `voice` được thay bằng bản giả, `done` resolve sau `opts.voiceMs`.

```js
test('bấm đáp án đúng hai lần chỉ tăng P.i một lần', async () => { start('add',0); const b = correctBtn(); b.onclick(); b.onclick(); assert.equal(get('P.i'), 1); });
test('đúng thì Kuromi chuyển clap; sau đó nextQ chạy sau khi câu khen xong, nhưng chờ ít nhất 950ms', async () => {});
test('có explain thì đọc explain sau câu khen; nếu giọng treo thì tự sang câu sau tối đa 6000ms', async () => {});
test('sai lần 1: think + nhóm wrong; sai lần 2: nhóm hint + nút đúng có lớp hint', () => {});
test('bấm đáp án khi đang đọc đề thì gọi voice.stop trước khi phản ứng', () => {});
test('rời màn (P=null) trong lúc chờ thì nextQ cũ không vẽ lại màn chơi', async () => {});
```

- [ ] **Step 2: Chạy `npm test`.** Kết quả mong đợi: FAIL.
- [ ] **Step 3: Sửa `nextQ` và `answer`.**
  - **Bố cục** theo `E-home-game.html` mục 2:
    - Kuromi cỡ `md`;
    - nút ⬅️ và thanh tiến độ 8 đoạn (`.d` xanh lá, `.cur` vàng bồng bềnh);
    - thẻ đề có chữ `3.8u` và nút 🔊 tròn tím (bấm thì `voice.text(q.say || q.prompt)`);
    - hàng nút đáp án cao `max(80px, 13u)`, chữ `7u`, nút đứng yên (không có `floaty`).
  - **Câu đầu tiên của màn**: `await voiceWait(mascotSay('round_start'), 0, 3000)`, rồi đọc đề. Các câu sau đọc đề sau 300ms.
  - **Đúng**:
    - `voice.stop()`, `P.locked = true`;
    - `mascotSay(combo >= 3 ? 'combo' : 'correct')` (emo `clap`) và `burst`;
    - nếu có `explain`: hiện dòng 💡, rồi `voice.text(explain)` sau câu khen; nếu không có thì bỏ qua;
    - `await voiceWait(chuỗi giọng nói, 950, explain ? 6000 : 3000)`, kiểm tra lại token, rồi gọi `nextQ`.
  - **Sai**: `voice.stop()`; nếu `P.wrong === 1` thì `mascotSay('wrong')`, nếu `P.wrong >= 2` thì `mascotSay('hint')` (emo `think`); nút đúng nhấp nháy như cũ.
  - **Nút ⬅️** đi qua `go()`, nên luôn dừng giọng và tăng token.
- [ ] **Step 4: Chạy `npm test`.** Kết quả mong đợi: PASS. Tiếp tục chạy `npm test` để chắc test bao phủ ở Task 1 vẫn PASS.
- [ ] **Step 5: Commit** `feat(ui): game screen with Kuromi reactions and voice-paced flow`

---

### Task 9: Màn kết quả và mở quà

**Files:**
- Modify: `js/ui.js` (`finish`, `openGift`), `css/style.css`, `css/fx.css`

**Interfaces:**
- Consumes: `mascotSay(..., {hold:true})`, `confetti`, `burst`
- Produces: chữ ký `finish()` và `openGift(done)` giữ nguyên.

- [ ] **Step 1: Viết lại `finish()`** theo `other-screens.html` mục 2. Phần tính sao, lưu dữ liệu và huy hiệu giữ nguyên.
  - Kuromi: 2–3 sao thì `clap` (hold), nhóm `result3` hoặc `result2`; 1 sao thì `think` (hold), nhóm `result1`.
  - 3 ngôi sao bay vào lần lượt ở 0,4s, 0,9s, 1,4s; mỗi ngôi kèm `sfx.click()`.
  - Tia sáng xoay và pháo giấy (30 mảnh, ở 1,5s) chỉ có khi đạt ≥ 2 sao.
  - Các ô `+N ⭐` và `+1 🎁` bật lên ở 1,9s và 2,1s.
  - Dải huy hiệu mới ở 2,4s. Nếu có huy hiệu mới thì sau câu kết quả phát thêm nhóm `badge`.
  - Nút: 🎁 Mở quà (hồng), 🔁 Chơi lại (xanh), ➡️ Mức tiếp (xanh lá, chỉ khi đã mở khoá), 🏠 (trắng).
- [ ] **Step 2: Viết lại `openGift(done)`** theo `other-screens.html` mục 3.
  - Lớp phủ tím mờ, 🎁 cỡ `22u` lắc lư, dòng "Chạm vào hộp quà nào!".
  - Kuromi `happy` nhảy bên trái hộp và nói nhóm `gift_open`.
  - Chạm vào hộp: vầng sáng, hình dán `20u` bật ra, tên hình dán, pháo giấy 40 mảnh, nhóm `sticker_new` (hoặc `sticker_all` khi đã đủ bộ).
  - Nút "🎁 Mở tiếp (n)" và "Tuyệt!". Cách mở quà giữ nguyên.
- [ ] **Step 3: Kiểm tra trên trình duyệt.** Chạy thử một màn với 0 lỗi, 2 lỗi và 4 lỗi. Kết quả mong đợi: lần lượt 3 sao (`clap`, có pháo giấy), 2 sao (`clap`), 1 sao (`think`, không pháo giấy). Mở quà chạy đúng.
- [ ] **Step 4: Commit** `feat(ui): animated result and gift screens`

---

### Task 10: Bộ sưu tập

**Files:**
- Modify: `js/ui.js` (`album`), `js/shop.js` (`wardrobe` trả về phần thân của tab), `css/style.css`

**Interfaces:**
- Produces: `albumTab: 'stickers'|'wardrobe'|'badges'` (biến ở cấp module, nhớ tab đang chọn); `album(tab?)`.

- [ ] **Step 1: Viết lại `album()`** theo `remaining-screens.html` mục 1.
  - Kuromi `happy`, nói nhóm `album_<tab>`, bong bóng có số liệu.
  - Dải trên cùng: "Bé có N hộp quà chưa mở!" và nút Mở quà, hoặc dòng nhắc "Đạt từ 2 ⭐…" khi không có quà.
  - 3 tab kiểu kẹo, mỗi tab ghi `x/y`.
  - Nội dung tab:
    - Hình dán: lưới 8 cột, chưa có thì hiện ❓ mờ.
    - Tủ váy: lưới 6 cột ảnh thumb, bấm thì `viewItem`.
    - Huy hiệu: lưới 3 cột, chưa đạt thì mờ.
  - Khung nội dung tự cuộn dọc bên trong, trang không cuộn.
- [ ] **Step 2: Kiểm tra trên trình duyệt.** Kết quả mong đợi: đổi tab thì đổi nội dung và câu nói; 46 hình dán vừa khung và cuộn được bên trong.
- [ ] **Step 3: Commit** `feat(ui): tabbed collection screen`

---

### Task 11: Tiệm công chúa

**Files:**
- Modify: `js/shop.js` (`shop`, `shopStage`, `lockedItem` / mua, `wearItem`, `dragHint`), phần CSS của shop trong `css/style.css`

**Interfaces:**
- Consumes: `mascotHTML({size:'corner'})`, `mascotSay`, `burst`
- Produces: không có gì mới. Giữ nguyên `dragDress`, `shopBackdrop` và dữ liệu `SHOP`.

- [ ] **Step 1: Đổi HTML và CSS** theo `remaining-screens.html` mục 2.
  - Giữ ảnh nền `.shopbg` toàn trang, thêm một lớp phủ pastel mỏng.
  - Thanh trên kiểu mới; 5 tab kiểu kẹo.
  - 3 cột `1fr 1.25fr 1fr`. Hai cột bên là khung trắng mờ (`backdrop-filter: blur`), thumb bồng bềnh, ô giá vàng, 🔒 ở góc thumb.
  - Sân khấu có vầng sáng, tên váy trong ô tím.
  - Kuromi cỡ `corner` ở góc dưới bên trái, nói nhóm `shop_hello` khi vào tiệm.
- [ ] **Step 2: Gắn câu thoại.**
  - Mua thành công: `shop_buy` (`happy`) và `burst`.
  - Không đủ sao: `shop_poor` (`think`); bong bóng ghi "Cần N ⭐ nha…".
  - `dragHint`: `shop_drag`.
  - `wearItem`: `shop_wear` (`happy`).
  - Thay dòng chữ tĩnh `.stage-tip` hiện tại bằng bong bóng của Kuromi.
- [ ] **Step 3: Kiểm tra trên trình duyệt, cả bằng cảm ứng** (Playwright `hasTouch: true`). Kéo váy vào sân khấu vẫn mặc được; mua váy vẫn trừ sao đúng (`balance()`).
- [ ] **Step 4: Commit** `feat(shop): candy-cloud restyle with Kuromi corner guide`

---

### Task 12: Cờ caro

**Files:**
- Modify: `js/caro.js` (`caro`, phần cập nhật trạng thái lượt, phần xử lý khi thắng), phần CSS của caro

**Interfaces:**
- Consumes: `screenHTML({mascot:{size:'sm'}})`, `mascotSay`
- Produces: không có gì mới. Luật chơi, canvas, kéo và phóng to giữ nguyên.

- [ ] **Step 1: Đổi bố cục** theo `remaining-screens.html` mục 3.
  - Kuromi cỡ `sm` (khoảng `20u`).
  - Hàng trên: ⬅️ và 2 ô "❌ Bạn 1" / "⭕ Bạn 2". Ô đang đến lượt có lớp `.on` (nhịp đập).
  - Canvas chiếm phần còn lại, nền trắng kẻ lưới `#efe4ff`. Giữ cách vẽ hiện có; đổi màu X thành `#f0609f`, O thành `#4aa8f0`.
  - Hàng nút: ↩️ (xám), 🎯 (xanh), 🔄 (hồng).
  - Bỏ dòng hướng dẫn nhỏ; chuyển nội dung đó vào bong bóng lúc mới vào màn.
- [ ] **Step 2: Gắn câu thoại.**
  - Mỗi lượt đổi: `caro_turn_x` / `caro_turn_o`. Chỉ có bong bóng; chỉ phát giọng ở lượt đầu tiên và sau khi bấm Ván mới, để khỏi nói liên tục.
  - Khi thắng: `caro_win_x` / `caro_win_o` (`clap`, hold), kèm `burst`. Hàng 5 quân giữ cách tô sáng hiện có.
- [ ] **Step 3: Kiểm tra trên trình duyệt.** Chơi một ván đến khi thắng. Kết quả mong đợi: Kuromi vỗ tay; Đi lại và Ván mới vẫn chạy đúng.
- [ ] **Step 4: Commit** `feat(caro): candy-cloud restyle with Kuromi turn guide`

---

### Task 13: Đổi tên app, bố cục dự phòng, reduced-motion và test giao diện tổng thể

**Files:**
- Modify: `index.html` (`<title>`, `apple-mobile-web-app-title`, `theme-color` `#e7d4ff`), `manifest.webmanifest` (`name` "Vương Quốc Vui Vẻ", `short_name` "Vui Vẻ", `theme_color`/`background_color`), `css/style.css` (media query dọc và hẹp), `css/fx.css` (reduced-motion)
- Create: `tests/e2e/smoke.mjs`; script `"e2e": "node tests/e2e/smoke.mjs"`

- [ ] **Step 1: Viết `tests/e2e/smoke.mjs`.**
  - Chạy một server tĩnh trong script (`node:http`, phục vụ thư mục gốc repo).
  - Lặp qua 3 khung màn hình: `{1024×768}`, `{1280×800}`, `{360×740}`; cả 3 đều dùng `hasTouch: true`.
  - Với mỗi khung:
    - Gom mọi `pageerror` và `console.error`; kết thúc phải bằng 0.
    - Màn mở đầu: chờ nút "Vào ngay thôi !!", bấm nút.
    - Nhập tên: điền "Mai", chọn avatar, bấm "Bắt đầu!".
    - Trang chủ: kiểm tra `document.documentElement.scrollWidth <= innerWidth`.
    - Vào "Gộp số" rồi mức 1. Bấm một đáp án sai (đọc `P.q.correct` qua `page.evaluate`) và kiểm tra `#mimg` có `src` chứa `think`. Bấm đáp án đúng và kiểm tra `src` chứa `clap`. Mọi nút `.ch` có `getBoundingClientRect().height >= 80`.
    - Trả lời đúng cả 8 câu để tới màn kết quả; kiểm tra `src` chứa `clap`. Mở quà; kiểm tra `src` chứa `happy`.
    - Lần lượt vào Bộ sưu tập (cả 3 tab), Tiệm, Cờ caro, Cài đặt, và chọn mức (bấm một mức bị khoá thì `src` chứa `think`).
    - Mỗi màn đều kiểm tra không cuộn ngang và chụp ảnh vào `tests/e2e/shots/<khung>-<màn>.png`.
  - Thêm một lượt ở 1024×768 với `localStorage` nạp sẵn dữ liệu cũ có `{sound:false, owned:[…], stars:40}`: không lỗi, Cài đặt hiện cả hai công tắc ở trạng thái tắt.
- [ ] **Step 2: Chạy `npm install && npm run e2e`.** Kết quả mong đợi lúc này: FAIL ở khung 360×740 (chưa có bố cục dọc) hoặc ở tên app.
- [ ] **Step 3: Sửa phần còn thiếu.**
  - Đổi tên theo danh sách ở mục Files.
  - Thêm `@media (orientation: portrait), (max-width: 700px)`: `.scr` chuyển thành cột; `.mcol` thành một dải ngang cao khoảng 22% chiều cao, gồm ảnh Kuromi nhỏ và bong bóng nằm bên cạnh; `--u` chuyển thành `min(1.6vw, …)` để chữ và nút không quá nhỏ; nội dung cuộn dọc bên trong `.mainc`.
  - Thêm `@media (prefers-reduced-motion: reduce)`: tắt mọi animation có `infinite`, và `* { animation-duration: .01ms; }` cho các hiệu ứng xuất hiện (vẫn hiện kết quả cuối).
- [ ] **Step 4: Chạy `npm test && npm run e2e`.** Kết quả mong đợi: PASS cả hai; 0 lỗi console; ảnh chụp có đủ ở `tests/e2e/shots/`. Mở các ảnh 1024×768 ra so với bản phác.
- [ ] **Step 5: Commit** `feat: rename to Vương Quốc Vui Vẻ, portrait fallback, reduced motion, e2e smoke`
