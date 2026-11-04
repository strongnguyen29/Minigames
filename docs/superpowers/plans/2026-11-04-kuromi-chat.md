# Nói chuyện với Kuromi: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bé nhấn giữ vào Kuromi ở trang chủ và nói, thả tay thì âm thanh được gửi cho Gemini, Kuromi trả lời bằng chữ (bong bóng), nét mặt và giọng Gemini TTS; mỗi ngày 10 câu miễn phí, thêm câu bằng sao.

**Architecture:** Hai file mới: `js/chat.js` (trạng thái hạn mức, ví sao, máy khách Gemini, mã hoá WAV: logic thuần, chạy được trong test vm) và `js/chat-ui.js` (cử chỉ giữ, thu âm, modal, nối vào trang chủ và Cài đặt). Các file cũ chỉ sửa tối thiểu: `core.js`/`merge.js` (dữ liệu), `shop.js` (`balance()`), `voice.js` (phát âm thanh Gemini), `lines.js` (câu thoại), `ui.js`/`mascot`-liên quan (nối dây), `index.html`, `css/style.css`. Game là JS tĩnh dùng `<script>` toàn cục, không bundler: giữ nguyên kiểu đó.

**Tech Stack:** JS thuần (global scope), Web Audio API (thu PCM, mã hoá WAV tự làm), `fetch` tới Gemini REST, `node --test` + helper `tests/helpers/load.js`.

**Spec:** `docs/superpowers/specs/2026-11-04-kuromi-chat-design.md`

## Global Constraints

- Hạn mức: **10 câu miễn phí/ngày**; gói đổi sao: **+5 câu = 5 ⭐, +15 câu = 12 ⭐**; câu mua thêm chỉ dùng trong ngày; ngày tính bằng `dayStr(new Date())` theo giờ máy.
- Một "câu hỏi" chỉ bị trừ khi Gemini hội thoại trả lời thành công (kể cả khi TTS lỗi); lỗi hội thoại, thu âm quá ngắn, nghe không rõ thì không trừ.
- Nhấn giữ ở **trang chủ**, thẳng vào ảnh Kuromi (`#mimg`), không thêm nút; chạm nhanh vẫn là `mascotPoke()`.
- JSON Gemini trả về: `{"heard":"...","reply":"...","emotion":"neutral|happy|think|clap"}`; `emotion` lạ thì `neutral`; `reply` cắt tối đa **300 ký tự**; bộ nhớ hội thoại **6 lượt gần nhất**, chỉ trong RAM.
- Key Gemini **không** nằm trong `S`, không vào cloud sync, không vào repo: lưu ở `localStorage` khoá riêng `be_vui_gemini_key_v1`; chỉ gửi tới `generativelanguage.googleapis.com`.
- Thiết bị đích: iPhone Safari và tablet Android Chrome. Không dùng `webkitSpeechRecognition`; thu PCM bằng Web Audio, gửi **WAV** (Gemini nhận WAV).
- Không hiện lỗi kỹ thuật cho bé: mọi lỗi thành một câu Kuromi nhẹ nhàng (nhóm câu `talk_*`).
- Tên model/giọng Gemini là hằng số trong `js/chat.js`; **trước khi code Task 3 phải đọc tài liệu Gemini hiện hành** (models free tier, định dạng `inlineData` âm thanh, TTS trả PCM 24 kHz) và báo lại nếu TTS không dùng được với key miễn phí.
- Phong cách code: giống file xung quanh (JS thuần, comment tiếng Việt ngắn, hàm global, `const` arrow gọn). Mỗi file < 800 dòng.

## Review Focus

1. Chạm nhanh vào Kuromi (dưới ngưỡng giữ) vẫn là "poke", không xin micro, không thu âm, không trừ câu (Task 5, 6).
2. Gemini trả JSON hỏng, thiếu trường, `emotion` lạ, `reply` rỗng hoặc rất dài: không trừ câu nếu hỏng; `reply` dài bị cắt; `emotion` lạ thành `neutral` (Task 2, 3).
3. Bé từ chối quyền micro hoặc máy không có micro: Kuromi nói nhờ ba mẹ bật quyền, không trừ câu, không treo hiệu ứng "đang nghe" (Task 6).
4. Rời trang chủ (`go()`) khi đang thu âm hoặc chờ Gemini: huỷ thu, bỏ kết quả về sau, không đọc, không trừ (Task 6).
5. Sang ngày mới: 10 câu miễn phí đặt lại và câu đã đổi từ hôm trước mất; TTS lỗi nhưng chat thành công vẫn trừ một câu và vẫn hiện chữ (Task 1, 3).

---

### Task 1: Hạn mức câu hỏi, sao đã tiêu, gộp dữ liệu

**Files:**
- Create: `js/chat.js` (phần trạng thái; các task sau thêm vào cùng file)
- Modify: `js/core.js:10-12,20` (thêm `talkSpent:{}` vào `DEF`, `freshSave`, `load`), `js/merge.js:5,45-48` (`LOCAL_ONLY` thêm `'talk'`; gộp `talkSpent` max từng máy), `js/shop.js:63` (`balance()` trừ thêm `talkSpent()`), `index.html` (thêm `<script src="js/chat.js"></script>` sau `js/radio.js`)
- Test: `tests/chat-quota.test.js`

**Interfaces:**
- Produces (global, trong `js/chat.js`):
  - `const TALK_FREE=10`, `const TALK_PACKS=[{n:5,price:5},{n:15,price:12}]`
  - `talkState(): {day:string,used:number,paid:number}` — lưu ở `S.talk`; ngày mới thì đặt `used=0` **và** `paid=0`
  - `talkLeft(): number` = `max(0,TALK_FREE-used)+paid`
  - `talkUse(): void` — trừ miễn phí trước rồi tới `paid`, gọi `save()`
  - `talkBuy(pack:{n:number,price:number}): boolean` — thiếu sao thì `false` và không đổi gì; đủ thì `S.talkSpent[deviceId()]+=price`, `paid+=n`, `save()`, `true`
  - `talkSpent(): number` — tổng `S.talkSpent` mọi máy

- [ ] **Step 1: Viết test (RED)** trong `tests/chat-quota.test.js`, dùng `loadGame(['js/core.js','js/merge.js','js/shop.js','js/chat.js'], {storage})` như `tests/radio.test.js` (cần thêm `js/questions.js`,`js/rewards.js` nếu `shop.js` đòi). Các test: `'mỗi ngày 10 câu miễn phí'` (`talkLeft()===10`); `'trừ miễn phí trước rồi tới câu đã đổi'` (`used=9,paid=3` → `talkUse()` hai lần → `used===10, paid===2`); `'sang ngày mới đặt lại cả miễn phí lẫn câu đã đổi'` (`S.talk={day:'2000-1-1',used:10,paid:7}` → `talkLeft()===10` và `S.talk.paid===0`); `'đổi câu: thiếu sao thì không đổi'` (stars 4, `talkBuy(TALK_PACKS[0])===false`, `S.talkSpent` rỗng); `'đổi câu: đủ sao thì cộng câu và trừ sao'` (stars 20 → `true`, `paid===5`, `S.talkSpent.A===5`, `balance()===15`); `'balance() trừ cả sao đã đổi câu'`; `'gộp hai máy: talkSpent lấy max từng máy, talk chỉ của máy này'` (như test gộp ở `tests/radio.test.js:131`).
- [ ] **Step 2: Chạy** `node --test tests/chat-quota.test.js` → FAIL (`talkLeft is not defined`).
- [ ] **Step 3: Cài đặt** các hàm ở trên; `balance()` dùng mẫu `typeof talkSpent==='function'?talkSpent():0` giống `radioSpent`. `talkSpent` theo mẫu `listenSpent` trong `radio.js:173-175` và `merge.js:45-48`.
- [ ] **Step 4: Chạy** `npm test` → toàn bộ PASS.
- [ ] **Step 5: Commit** `feat: add Kuromi chat daily quota and star purchase state`

### Task 2: Phân tích JSON và mã hoá WAV

**Files:**
- Modify: `js/chat.js`
- Test: `tests/chat-audio.test.js`

**Interfaces:**
- Produces:
  - `chatParse(raw:string): {heard:string,reply:string,emotion:'neutral'|'happy'|'think'|'clap'}|null` — `null` nếu không parse được JSON hoặc `reply` rỗng (sau trim); `heard` thiếu thì `''`; `emotion` ngoài 4 giá trị thì `'neutral'`; `reply` cắt còn tối đa `TALK_MAX_REPLY=300` ký tự
  - `chatEncodeWav(samples:Float32Array, rate:number): Uint8Array` — WAV 16-bit mono PCM, header 44 byte chuẩn
  - `chatPcmToWav(pcm:Uint8Array, rate:number): Uint8Array` — bọc PCM 16-bit mono little-endian có sẵn
  - `chatB64(bytes:Uint8Array): string` — base64; và `chatFromB64(s:string): Uint8Array`

- [ ] **Step 1: Test (RED):** `chatParse` — JSON đúng; JSON bọc trong ```json ``` vẫn parse được; hỏng → `null`; `reply:''` → `null`; `emotion:'angry'` → `'neutral'`; `reply` 500 ký tự → đúng 300; thiếu `heard` → `''`. WAV — mẫu `[0,1,-1]` ở 16000 Hz cho 44+6 byte, `RIFF`/`WAVE`/`data` đúng chỗ, sample rate đọc lại bằng `DataView` là 16000, giá trị 1 → 32767, -1 → -32768; `chatPcmToWav` giữ nguyên phần data; `chatFromB64(chatB64(x))` bằng `x`.
- [ ] **Step 2: Chạy** `node --test tests/chat-audio.test.js` → FAIL.
- [ ] **Step 3: Cài đặt.** `chatB64` dùng `btoa` theo khối (tránh tràn stack với mảng lớn); trong test vm không có `btoa`/`atob` thì thêm vào `loadGame` ctx (sửa `tests/helpers/load.js` thêm `btoa`, `atob`, `Uint8Array`, `Float32Array`, `DataView` nếu thiếu).
- [ ] **Step 4: Chạy** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: add chat reply parser and WAV encoder`

### Task 3: Máy khách Gemini và `chatAsk`

**Files:**
- Modify: `js/chat.js`
- Test: `tests/chat-gemini.test.js`

**Interfaces:**
- Consumes: `chatParse`, `chatPcmToWav`, `chatB64`, `chatFromB64`, `talkLeft`, `talkUse` (Task 1, 2).
- Produces:
  - Hằng: `CHAT_MODEL`, `TTS_MODEL`, `TTS_VOICE`, `CHAT_PROMPT` (prompt của chủ dự án, nguyên văn các quy tắc trong spec + thêm: nghe âm thanh của bé, trả `heard` là chữ bé vừa nói, `""` nếu không nghe rõ), `TALK_HISTORY=6`
  - `geminiKey(): string`, `setGeminiKey(k:string): void` (chuỗi rỗng = xoá); localStorage khoá `be_vui_gemini_key_v1`, bọc `try/catch`
  - `class ChatError extends Error` với `kind: 'nokey'|'key'|'quota'|'net'|'format'|'limit'|'mic'`
  - `geminiChat({key,wavB64,history,fetch}): Promise<{heard,reply,emotion}>` — `history` là `[{role:'user'|'model',text}]` tối đa 6 lượt (12 mục); gửi `systemInstruction`, lịch sử dạng text, rồi lượt hiện tại với `inlineData{mimeType:'audio/wav',data}`; `generationConfig` ép JSON theo schema 3 trường; HTTP 400/401/403 → `ChatError('key')`, 429 → `'quota'`, lỗi mạng/HTTP khác → `'net'`, `chatParse` null → `'format'`
  - `geminiTts({key,text,fetch}): Promise<Uint8Array>` — trả WAV (đã `chatPcmToWav(pcm,24000)`); lỗi → `ChatError` tương ứng
  - `chatAsk({wavB64,history,fetch=window.fetch}): Promise<{heard,reply,emotion,wav:Uint8Array|null}>` — `nokey` nếu chưa có key; `limit` nếu `talkLeft()===0`; gọi `geminiChat`; **chỉ sau khi thành công** gọi `talkUse()`; rồi `geminiTts` bọc `try/catch` (lỗi → `wav:null`); `heard` rỗng thì ném `ChatError('format')` **trước** `talkUse()` (UI sẽ nói "chưa nghe rõ")

- [ ] **Step 1: Đọc tài liệu Gemini hiện hành** (WebFetch `ai.google.dev`): xác nhận tên model free tier cho hội thoại có nhận âm thanh, model TTS và giọng, định dạng body `generateContent`, header khoá (`x-goog-api-key`), `responseSchema`, và PCM trả về của TTS. Ghi các giá trị chọn vào hằng số, kèm comment ngày kiểm tra.
- [ ] **Step 2: Test (RED)** bằng `fetch` giả ghi lại request: body chat chứa `systemInstruction`, đúng 12 mục lịch sử khi truyền 20 mục, phần cuối có `inlineData.mimeType==='audio/wav'`; khoá nằm trong header, **không** trong URL; chat thành công + TTS thành công → `{reply, wav}` và `talkLeft()` giảm 1; chat thành công + TTS ném lỗi → `wav===null`, vẫn giảm 1; HTTP 429 → `kind==='quota'`, không giảm; 403 → `'key'`; fetch ném → `'net'`; thân trả JSON hỏng → `'format'`, không giảm; `heard===''` → `'format'`, không giảm; không key → `'nokey'`; `talkLeft()===0` → `'limit'` và **không gọi fetch**; `setGeminiKey('x')`/`geminiKey()` vòng đúng, và `JSON.stringify(S)` không chứa key.
- [ ] **Step 3: Chạy** `node --test tests/chat-gemini.test.js` → FAIL.
- [ ] **Step 4: Cài đặt** theo Interfaces.
- [ ] **Step 5: Chạy** `npm test` → PASS.
- [ ] **Step 6: Commit** `feat: add Gemini chat and TTS client`

### Task 4: Câu thoại Kuromi mới và phát âm thanh Gemini

**Files:**
- Modify: `js/lines.js` (thêm 5 nhóm trước `poke`), `js/voice.js` (thêm `clip` vào đối tượng `voice`), `tests/voice-play.test.js:26` (đổi 41 → 46 nhóm)
- Run: `npm run voice:export` để cập nhật `audio/voice/script.md`, `script.csv`, `voice-prompt.md`
- Test: `tests/voice-play.test.js`

**Interfaces:**
- Produces:
  - Nhóm `LINES` mới (mỗi nhóm 3 câu, `emo` hợp lệ, tone `'ấm áp, thân thiện'` trừ khi ghi khác): `talk_hint` (hướng dẫn nhấn giữ vào Kuromi, ví dụ "Nhấn giữ vào mình rồi nói chuyện nha!"), `talk_unheard` (chưa nghe rõ, bé nói lại nha), `talk_limit` (hết lượt hôm nay, đổi sao để nói thêm), `talk_error` (mạng/key/quota: "Mình đang mệt chút, bé thử lại sau nha"), `talk_nomic` (nhờ ba mẹ bật quyền micro)
  - `voice.clip(wav:Uint8Array|null, text:string): Promise<boolean>` — `wav` có thì phát qua phần tử Audio dùng chung (`audio()`) bằng blob URL, `true` khi hết, `false` khi bị `stop()`; lỗi phát hoặc `wav===null` thì rơi về `tts(text,done)` giống `play()`; tôn trọng `S.voice===false`; thu hồi blob URL khi xong

- [ ] **Step 1: Test (RED):** đổi số nhóm thành 46 (test cũ sẽ FAIL cho tới khi thêm nhóm); thêm `'voice.clip phát blob khi có wav'` (FakeAudio ghi `src` bắt đầu bằng `blob:`; vm test cần `URL.createObjectURL`/`Blob` giả trong `loadGame` ctx), `'voice.clip rơi về giọng máy khi wav null'` (`tts.length===1`), `'voice.clip rơi về giọng máy khi phát lỗi'`, `'stop() cắt clip và resolve false'`, `'tắt giọng thì clip resolve ngay, không phát'`.
- [ ] **Step 2: Chạy** `node --test tests/voice-play.test.js` → FAIL.
- [ ] **Step 3: Cài đặt** nhóm câu và `voice.clip`.
- [ ] **Step 4: Chạy** `npm test` → PASS, rồi `npm run voice:export` và kiểm `git diff --stat audio/voice` chỉ thêm 15 dòng kịch bản mới (+ cập nhật tổng số file).
- [ ] **Step 5: Commit** `feat: add Kuromi chat voice lines and Gemini clip playback`

### Task 5: Cử chỉ nhấn giữ và thu âm

**Files:**
- Create: `js/chat-ui.js` (phần cử chỉ + thu âm), thêm `<script src="js/chat-ui.js"></script>` sau `js/chat.js` trong `index.html`
- Modify: `css/style.css` (trên `.scr.home .kuromi img`: `touch-action:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none`; `.kuromi.listening` có vòng sáng/nghiêng đầu theo phong cách `.ped` hiện có)
- Test: `tests/chat-ui.test.js`

**Interfaces:**
- Produces:
  - `holdGesture({holdMs=350,onHold,onRelease,onTap,setT=setTimeout,clearT=clearTimeout}): {down():void,up():void,cancel():void}` — `up` trước `holdMs` gọi `onTap`; giữ qua `holdMs` gọi `onHold` đúng một lần, rồi `up` gọi `onRelease` (không gọi `onTap`); `cancel` gọi `onRelease` nếu đang giữ, huỷ hẹn giờ
  - `chatRecStart(): Promise<void>` — `getUserMedia({audio:true})`, thu PCM mono bằng `AudioContext` + `ScriptProcessorNode` (chạy được cả iOS Safari và Chrome); lỗi hoặc từ chối → `ChatError('mic')`
  - `chatRecStop(): {samples:Float32Array,rate:number,ms:number}|null` — dừng micro (`track.stop()`), `null` nếu chưa thu; `ms` = thời lượng thu
  - `chatRecCancel(): void` — dừng và bỏ dữ liệu
  - `const TALK_MIN_MS=600` — thu ngắn hơn thì coi như không nói
- Consumes: `ChatError` (Task 3).

- [ ] **Step 1: Test (RED)** `holdGesture` với hẹn giờ giả (mảng hàm, kích hoạt tay): chạm nhanh → chỉ `onTap`; giữ → `onHold` một lần, `up` → `onRelease`, không `onTap`; `cancel` giữa chừng → `onRelease` một lần; `down` hai lần liên tiếp không tạo hai hẹn giờ.
- [ ] **Step 2: Chạy** `node --test tests/chat-ui.test.js` → FAIL.
- [ ] **Step 3: Cài đặt** `holdGesture` (thuần) và các hàm thu âm (khó test tự động: để kiểm thử tay ở Task 7). Chỉ downsample/giữ `rate` thực của `AudioContext`, mã hoá bằng `chatEncodeWav` ở Task 6.
- [ ] **Step 4: Chạy** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: add hold gesture and PCM recorder for Kuromi chat`

### Task 6: Luồng nói chuyện, modal, Cài đặt, nối vào trang chủ

**Files:**
- Modify: `js/chat-ui.js`, `js/ui.js` (`home()` ở dòng ~85-96, `go()` ở dòng 6, `settings()` ở dòng ~56-80), `css/style.css`
- Test: `tests/chat-ui.test.js`

**Interfaces:**
- Consumes: Task 1-5; `mascot(emo,text,{hold})`, `mascotSay(group,opts)`, `mascotPoke()`, `voice.clip`, `voice.stop`, `modalBox(html)` (`js/shop.js:70`), `balance()`, `sfx`, `confetti`.
- Produces:
  - `chatAttach(): void` — gắn `pointerdown/up/cancel/leave` và chặn `contextmenu` trên `#mimg` của trang chủ qua `holdGesture`; **thay** `onclick` mặc định bằng handler gọi `mascotPoke()` chỉ khi là chạm nhanh; không gắn nếu `navigator.mediaDevices` không có
  - `chatHintDue(): boolean` — đếm lần vào trang chủ trong `S.talk.hints` (local); `true` ở lần 1, rồi mỗi 5 lần; `home()` dùng để nói `talk_hint` thay cho câu `home` ở lần đó
  - `chatBegin(): Promise<void>` — thứ tự: chưa có key → `chatKeyModal()` và dừng; `talkLeft()===0` → nói `talk_limit` + `chatBuyModal()` và dừng; rồi `chatRecStart()` (lỗi `mic` → nói `talk_nomic`, tắt hiệu ứng), bật `.kuromi.listening`
  - `chatEnd(): Promise<void>` — `chatRecStop()`; `null` hoặc `ms<TALK_MIN_MS` → thôi, không gửi; ngược lại `mascot('think','…')`, `chatAsk(...)`, rồi hiện `heard` tạm trong bong bóng, sau đó `reply` với `emotion` (kết quả bị bỏ nếu `chatEpoch` đã đổi); `voice.clip(wav, reply)`; cập nhật `chatHist` (tối đa 12 mục, chỉ trong RAM); lỗi → câu `talk_*` tương ứng (`format`→`talk_unheard`, `key`→mở lại `chatKeyModal`, `quota`/`net`→`talk_error`, `limit`→`talk_limit` + buy modal)
  - `chatCancel(): void` — tăng `chatEpoch`, `chatRecCancel()`, bỏ hiệu ứng; `go()` gọi nó (theo mẫu `typeof radioStop==='function'`)
  - `chatKeyModal(onSaved?): void` — modal hướng tới phụ huynh ("Nhờ ba mẹ nhập khoá Gemini giúp bé", ô nhập, nút Lưu/Xoá/Để sau, gợi ý nơi lấy key); lưu bằng `setGeminiKey`, không hiện lại key đầy đủ (chỉ 4 ký tự cuối)
  - `chatBuyModal(): void` — như `radioMinutes` (`js/radio.js:162`): hiện số câu còn, `TALK_PACKS` với giá, nút đổi gọi `talkBuy` (`sfx.win()`/`confetti` khi được, `sfx.bad()` khi thiếu sao)
  - Cài đặt: thêm một dòng "🔑 Khoá Gemini" (mở `chatKeyModal`) và "💬 Còn N câu hôm nay" (mở `chatBuyModal`)

- [ ] **Step 1: Test (RED)** (vm, `fetch` giả, `chatRecStart/Stop` giả bằng gán lại hàm global): chưa có key → `chatBegin()` mở modal chứa "ba mẹ", không thu âm; hết câu → nói `talk_limit` và mở modal đổi; chạm nhanh (qua `holdGesture` `onTap`) gọi `mascotPoke` và **không** gọi `chatRecStart`; thu `ms<600` → không gọi `fetch`, `talkLeft()` không đổi; luồng thành công: bong bóng ra `reply`, `talkLeft()` giảm 1, `chatHist.length===2`, `voice.clip` nhận `wav`; mic từ chối (`chatRecStart` ném `ChatError('mic')`) → câu `talk_nomic`, không `fetch`, không trừ, class `listening` đã gỡ; `chatCancel()` (hoặc `go(...)`) giữa lúc chờ `fetch` → kết quả về sau không đổi bong bóng, không `voice.clip`, `talkLeft()` không đổi; lỗi `key` mở lại modal key; `home()` lần đầu nói `talk_hint`, lần 2 nói nhóm `home`; `settings()` có dòng "Khoá Gemini".
- [ ] **Step 2: Chạy** `node --test tests/chat-ui.test.js` → FAIL.
- [ ] **Step 3: Cài đặt** theo Interfaces; sửa `home()` gọi `chatAttach()` sau khi vẽ; sửa `go()` gọi `chatCancel`; thêm 2 dòng vào `settings()`; CSS cho modal key/đổi theo `.modal .box` hiện có.
- [ ] **Step 4: Chạy** `npm test` → PASS toàn bộ.
- [ ] **Step 5: Commit** `feat: wire Kuromi hold-to-talk chat into home screen and settings`

### Task 7: Kiểm tra thật trên thiết bị và rà soát cuối

**Files:**
- Modify (nếu cần): `js/chat.js`, `js/chat-ui.js`, `css/style.css`
- Test: kiểm thử tay + `npm test`

- [ ] **Step 1: Chạy game cục bộ** (dùng skill `run` hoặc máy chủ tĩnh) và thử bằng key thật trên **Chrome desktop**: giữ vào Kuromi, nói câu tiếng Việt → thấy `heard`, `reply`, nét mặt, nghe giọng Gemini; chạm nhanh vẫn "nhột quá".
- [ ] **Step 2: Thử trên iPhone Safari và tablet Android Chrome** (mở bằng địa chỉ HTTPS hoặc `localhost` qua mạng nội bộ, vì micro cần ngữ cảnh an toàn): quyền micro, giữ không bật menu lưu ảnh/chọn chữ, thu âm không bị ngắt, WAV được Gemini nhận, giọng đọc phát được sau lần chạm đầu (iOS cần `voice.unlock()` đã gọi ở cử chỉ giữ). Ghi lại kết quả; nếu iOS chặn phát vì không phải từ thao tác trực tiếp, gọi `voice.unlock()` ở `onHold`.
- [ ] **Step 3: Thử các đường lỗi:** key sai (mở lại modal key), tắt mạng (câu `talk_error`), hết 10 câu (modal đổi sao, đổi được, trừ sao), đổi ngày giả (sửa `S.talk.day`).
- [ ] **Step 4: Chạy** `npm test` và `npm run e2e` (nếu cấu hình chạy được trên máy) → PASS.
- [ ] **Step 5: Rà soát bảo mật** (key không vào `S`/cloud/log; không có `console.log`; prompt/`heard` được `esc()` trước khi chèn vào bong bóng nếu dùng `innerHTML`), rồi commit `fix: ...` cho các sửa thu được từ bước thử thật.
