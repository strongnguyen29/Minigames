# Làng Giáng Sinh 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm trò "🎄 Làng Giáng Sinh". Bé chọn bộ đồ, vào một làng tuyết 3D, đi lại bằng cách chạm, gặp 4 nhân vật. Mỗi nhân vật đố 3 câu hoặc nhờ tìm 3 món đồ. Mỗi ngày có tối đa 15 sao và việc được reset theo ngày.

**Architecture:** Phần logic thuần nằm trong `js/xmas.js` và test được bằng `node --test`. Phần này gồm kế hoạch ngày lấy từ hạt giống là ngày, trạng thái `S.xmas`, tính sao, phiên đố, danh sách bộ đồ. Kho câu đố nằm trong `js/xmas-quiz.js`. Lõi 3D dùng chung cho mọi bản đồ nằm trong `js/world3d.js`: nạp Three.js qua import map, dựng scene, chạm để đi, va chạm, búp bê giấy, nhân vật, đồ nhặt. Riêng hàm di chuyển `w3Move` là hàm thuần nên test được. Màn chọn đồ, màn làng và hộp thoại nằm trong `js/xmas-ui.js`. `S.xmas` được gộp giữa các máy bằng `mergeXmas` trong `js/merge.js`.

**Tech Stack:** JS thuần, nạp bằng thẻ `<script>` cổ điển. Three.js `0.170.0` lấy từ jsDelivr, nạp bằng `import()` động qua import map. Model GLB lấy từ Kenney Holiday Kit (CC0). Test dùng `node:test`, e2e dùng Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-lang-giang-sinh-3d-design.md`

## Global Constraints

- 4 nhân vật, id cố định: `santa` (Ông già Noel), `snowman` (Người tuyết), `reindeer` (Tuần lộc), `nutcracker` (Lính chì).
- Mỗi ngày có 3 nhân vật đố và 1 nhân vật nhờ tìm đồ.
- Đố: mỗi nhân vật hỏi 3 câu liên tiếp, mỗi câu có 3–4 đáp án. Sao theo tổng số lần sai: 0 lần sai được 3 sao, 1 lần sai được 2 sao, từ 2 lần sai được 1 sao. Sai 2 lần ở cùng một câu thì nhấp nháy đáp án đúng.
- Tìm đồ: 3 món giống nhau ở 3 chỗ giấu khác nhau, đủ 3 món thì quay lại nhận 3 sao.
- Xong cả 4 việc thì thưởng thêm 3 sao. Một ngày tối đa 15 sao. Cộng sao vào `S.stars`, không tăng `rounds` hay `perfect`, và gọi `touchStreak()`.
- Ngày tính theo `dayStr(new Date())` (giờ máy, dạng `2026-11-6`). Số ngày dùng `dayNum` có sẵn trong `js/merge.js`.
- Kế hoạch ngày (câu đố, thứ tự đáp án, nhân vật nhờ tìm, món đồ, chỗ giấu) chỉ phụ thuộc vào ngày, mọi máy ra giống nhau. Câu đố không lặp cho đến khi dùng hết kho.
- Kho câu đố có ít nhất 80 câu. Chủ đề: Giáng sinh, mùa đông và tuyết, con vật, màu sắc, đồ vật trong nhà, đố mẹo nhẹ nhàng, đếm và cộng trừ trong phạm vi 10. Mỗi câu dưới khoảng 15 từ, không có nội dung gây sợ hãi.
- Câu hỏi được đọc to bằng `voice.text(q)`. Hàm này đã tự dùng giọng máy và đã tôn trọng `S.voice===false`.
- Bộ đồ mặc định là `white-dress` (`images/shop-items/fashion/characters-cutout/white-dress.webp`). Bộ đang mặc lưu theo từng máy ở localStorage key `be_vui_xmas_outfit_v1`.
- Giọng ông già Noel là ElevenLabs voice id `1wg2wOjdEWKA7yQD8Kca`. Các nhân vật khác và Kuromi dùng giọng mặc định (Kuromi).
- Three.js ghim đúng `0.170.0`. Import map: `"three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js"`, `"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"`.
- Model nằm ở `models/holiday/*.glb` cùng `models/holiday/Textures/colormap.png`, vì GLB của kit trỏ tới `Textures/colormap.png` theo đường dẫn tương đối. Kèm `models/holiday/License.txt`. Tổng dung lượng dưới 3 MB.
- Chữ hiển thị và comment viết tiếng Việt. Commit theo kiểu conventional commit, viết tiếng Anh, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Thêm file mới vào `index.html` theo thứ tự sau, ngay sau `js/pattern.js` và trước `js/splash.js`: `js/xmas-quiz.js`, `js/xmas.js`, `js/world3d.js`, `js/xmas-ui.js`.

## Review Focus

1. **Không có WebGL, hoặc CDN/GLB không tải được:** màn làng hiện thông báo nhẹ nhàng "Làng đang ngủ, mình quay lại sau nha" và có nút về trang chủ, không lỗi console, không treo màn chờ. Test nằm ở Task 7 (e2e ép hỏng WebGL) và Task 5 (`w3Load` bị từ chối).
2. **Bé bấm đáp án hoặc nhân vật hai lần liền tay:** không cộng sao hai lần. `xmasComplete` phải idempotent. Test nằm ở Task 2.
3. **Qua 0 giờ khi đang ở trong làng:** việc làm xong với kế hoạch của hôm qua không ghi vào ngày mới. Màn làng báo "Sang ngày mới rồi!" rồi dựng lại. Test nằm ở Task 2.
4. **Bộ đồ đã lưu không còn trong `S.owned`** (do gộp máy, hoặc tiệm bỏ món): quay về `white-dress`. Test nằm ở Task 4.
5. **Điện thoại 360×740:** nút đáp án và nút "Vào làng" không bị Kuromi hay thanh việc che, không cuộn ngang. Test nằm ở Task 7.

---

### Task 1: Kho câu đố

**Files:**
- Create: `js/xmas-quiz.js`
- Modify: `index.html` (thêm script, xem Global Constraints)
- Test: `tests/xmas-quiz.test.js`

**Interfaces:**
- Produces: `XMAS_QUIZ: Array<{id:string, t:'xmas'|'winter'|'animal'|'color'|'home'|'riddle'|'math', q:string, c:string[], a:number}>`. `a` là chỉ số đáp án đúng trong `c`. Mỗi id có dạng `xq001`, `xq002`… và **không bao giờ được đổi**, vì kế hoạch ngày được tính theo thứ tự trong mảng.

- [ ] **Step 1: Viết test kiểm tra kho** trong `tests/xmas-quiz.test.js` với `FILES=['js/xmas-quiz.js']`:
  - `'kho có ít nhất 80 câu, id không trùng'`: `XMAS_QUIZ.length>=80`, và `new Set(ids).size===length`.
  - `'mỗi câu 3–4 đáp án không trùng, a hợp lệ'`: `c.length` là 3 hoặc 4, `new Set(c).size===c.length`, `Number.isInteger(a) && a>=0 && a<c.length`.
  - `'câu ngắn để máy đọc rõ'`: `q.split(/\s+/).length<=15`, mỗi đáp án ≤ 25 ký tự.
  - `'đủ chủ đề'`: mỗi giá trị `t` trong 7 chủ đề có ít nhất 5 câu.
  - `'câu toán đúng'`: với `t==='math'`, đáp án đúng là một số nguyên từ 0 đến 10.
- [ ] **Step 2:** Chạy `node --test tests/xmas-quiz.test.js`. Kỳ vọng FAIL (`XMAS_QUIZ is not defined`).
- [ ] **Step 3:** Viết `js/xmas-quiz.js` với `const XMAS_QUIZ=[...]`, khoảng 90 câu. Ví dụ đúng tinh thần: `{id:'xq001',t:'xmas',q:'Ông già Noel đi xe gì để phát quà?',c:['Xe trượt tuyết 🛷','Xe đạp 🚲','Thuyền ⛵'],a:0}`. Emoji trong đáp án được phép dùng, vì `voice` sẽ bỏ emoji khi đọc.
- [ ] **Step 4:** Chạy `node --test tests/xmas-quiz.test.js`. Kỳ vọng PASS.
- [ ] **Step 5:** Commit: `feat: add Christmas village quiz bank`.

---

### Task 2: Logic ngày, trạng thái `S.xmas`, sao và phiên đố

**Files:**
- Create: `js/xmas.js`
- Modify: `js/core.js`: thêm `xmas:{day:'',done:[],found:[],bonus:false}` vào `DEF` và `freshSave()` (dùng object mới, không dùng chung với DEF). Trong `load()`, bù thêm `s.xmas=Object.assign({day:'',done:[],found:[],bonus:false},s.xmas)`.
- Modify: `index.html`
- Test: `tests/xmas.test.js` với `FILES=['js/core.js','js/merge.js','js/xmas-quiz.js','js/xmas.js']`

**Interfaces:**
- Consumes: `XMAS_QUIZ` (Task 1); `S`, `save`, `dayStr`, `touchStreak` (core.js); `dayNum` (merge.js).
- Produces:
  - `XMAS_NPCS: Array<{id, name, model}>`, theo đúng thứ tự `santa, snowman, reindeer, nutcracker`. `name` lần lượt là `'Ông già Noel','Người tuyết','Tuần lộc','Lính chì'`. `model` của santa là `null` (dựng tay), còn lại là `'snowman-hat'`, `'reindeer'`, `'nutcracker'`.
  - `XMAS_ITEMS: Array<{id, model, name, icon}>` gồm `present/'present-a-cube'/'hộp quà'/🎁`, `sock/'sock-red'/'chiếc tất Noel'/🧦`, `candy/'candy-cane-red'/'cây kẹo gậy'/🍬`, `cookie/'gingerbread-man'/'bánh gừng'/🍪`, `flake/'snowflake-a'/'bông tuyết'/❄️`, `wreath/'wreath-decorated'/'vòng nguyệt quế'/🎀`.
  - `XMAS_SPOTS: Array<{x,z}>`: 14 chỗ giấu trên mặt đất làng. Toạ độ chốt ở Task 6. Ở task này đặt tạm 14 điểm trên vòng tròn bán kính 8.
  - `xmasRng(seed:number) → () => number` trong [0,1). Dùng mulberry32.
  - `xmasPlan(day:string) → {day, quest:npcId, item:itemId, spots:number[3], quiz:{[npcId]:Array<{id,q,choices:string[],correct:number}>}}`. Có 3 nhân vật trong `quiz`, mỗi bạn 3 câu.
  - `xmasState() → S.xmas`. Nếu `S.xmas.day!==dayStr(new Date())` thì reset về `{day:today,done:[],found:[],bonus:false}` rồi `save()`.
  - `xmasStatus(npcId) → 'done'|'quiz'|'quest'|'return'`. `return` nghĩa là nhân vật nhờ tìm đồ và đã nhặt đủ 3 món.
  - `xmasPickup(spot:number, day:string) → boolean`. Trả `true` nếu vừa nhặt mới một chỗ thuộc `plan.spots`.
  - `xmasComplete(npcId, stars:number, day:string) → null | {stars:number, bonus:number}`. Trả `null` nếu `day` không phải hôm nay hoặc nhân vật đã xong.
  - `xmasProgress() → {done:number, total:4}`.
  - `xmasQuizStars(mistakes) → 3|2|1`.
  - `xmasQuizNew(npcId, plan) → sess` với `sess={npc, qs, i:0, mistakes:0, wrongHere:0, day:plan.day}`.
  - `xmasQuizAnswer(sess, idx) → {ok:boolean, hint:boolean, next:boolean, done:boolean, stars?:number}`. Trả lời đúng thì `i++`, và `done` là true khi đã hết 3 câu. Trả lời sai thì `mistakes++`, `wrongHere++`, và `hint` là true khi `wrongHere>=2`.

- [ ] **Step 1: Viết test**:
  - `'kế hoạch tất định theo ngày'`: `xmasPlan('2026-12-24')` giống hệt (so bằng JSON) khi gọi lại trong một lần `loadGame` khác. `xmasPlan('2026-12-25')` khác hôm trước.
  - `'kế hoạch đúng cấu trúc'`: `quest` thuộc 4 id, `quiz` có đúng 3 key và không chứa `quest`, mỗi key có 3 câu. `spots` gồm 3 số khác nhau trong `[0,13]`. Với mọi câu, `choices[correct]` bằng đáp án đúng của câu gốc trong `XMAS_QUIZ`.
  - `'không lặp câu trong các ngày đầu'`: gom id câu đố của `floor(XMAS_QUIZ.length/9)` ngày liên tiếp bắt đầu từ `2026-11-6`, không có id nào trùng.
  - `'reset khi sang ngày'`: gán `S.xmas={day:'2020-1-1',done:['santa'],found:[1],bonus:true}`, gọi `xmasState()` thì nhận `{day:dayStr(new Date()),done:[],found:[],bonus:false}`.
  - `'sao theo số lần sai'`: `xmasQuizStars(0)===3`, `(1)===2`, `(2)===1`, `(5)===1`.
  - `'phiên đố: sai hai lần thì gợi ý, đủ 3 câu thì xong'`: dựng plan, lấy `npc=Object.keys(plan.quiz)[0]`. Chọn sai thì `{ok:false,hint:false}`, sai lần nữa thì `hint:true`. Chọn đúng câu 1 rồi đúng câu 2, 3 thì lần cuối trả `{ok:true,done:true,stars:1}` (vì có 2 lần sai).
  - `'xong việc cộng sao một lần; đủ 4 việc thêm 3'`: lấy `today=dayStr(new Date())`, `S.stars=0`. Gọi `xmasComplete('santa',3,today)` thì nhận `{stars:3,bonus:0}`. Gọi lại thì nhận `null` và `S.stars===3`. Xong 3 bạn còn lại với 3 sao mỗi bạn thì lần cuối có `bonus:3` và `S.stars===15`.
  - `'việc của ngày cũ không ghi vào hôm nay'`: `xmasComplete('santa',3,'2020-1-1')===null`, và `S.stars` không đổi.
  - `'nhặt đồ và trạng thái quay lại'`: với `plan=xmasPlan(today)`, nhặt lần lượt `plan.spots` thì nhận `true`. Nhặt lại một chỗ thì `false`. Nhặt một chỗ không thuộc plan thì `false`. Sau khi nhặt đủ thì `xmasStatus(plan.quest)==='return'`. Trước khi nhặt đủ thì là `'quest'`.
- [ ] **Step 2:** Chạy `node --test tests/xmas.test.js`. Kỳ vọng FAIL.
- [ ] **Step 3:** Cài đặt trong `js/xmas.js` theo Interfaces. Thuật toán chọn câu (không lặp cho đến khi hết kho):
  ```js
  /* xáo kho một lần bằng hạt cố định, mỗi ngày lấy 9 câu kế tiếp theo số ngày */
  const order=xáo(XMAS_QUIZ chỉ số, xmasRng(20261224));
  const n=dayNum(day), start=(n*9)%order.length; // lấy order[(start+k)%len], k=0..8
  ```
  Các lựa chọn khác (nhân vật nhờ tìm đồ, món đồ, 3 chỗ giấu, xáo thứ tự đáp án) dùng `xmasRng(n)`. `xmasComplete` cộng sao, gọi `touchStreak()` rồi `save()`.
- [ ] **Step 4:** Chạy `node --test tests/xmas.test.js` rồi `npm test`. Kỳ vọng tất cả PASS. Các test cũ của core và merge vẫn xanh.
- [ ] **Step 5:** Commit: `feat: add Christmas village daily plan, state and quiz logic`.

---

### Task 3: Gộp `S.xmas` giữa các máy

**Files:**
- Modify: `js/merge.js`: thêm `mergeXmas(a,b)`, và gọi `out.xmas=mergeXmas(local.xmas,remote.xmas)` trong `mergeSave`.
- Test: `tests/merge.test.js`

**Interfaces:**
- Produces: `mergeXmas(a,b) → {day,done,found,bonus}`. Nếu cùng `day` thì `done` và `found` lấy `union`, còn `bonus` là `a.bonus||b.bonus`. Nếu khác `day` thì lấy bản có `dayNum` lớn hơn. Thiếu một bên, hoặc thiếu cả hai, thì trả bản rỗng `{day:'',done:[],found:[],bonus:false}`.

- [ ] **Step 1: Viết test** trong `tests/merge.test.js`:
  - `'xmas cùng ngày hợp việc và đồ'`: `{day:'2026-12-24',done:['santa'],found:[1],bonus:false}` gộp với `{day:'2026-12-24',done:['snowman'],found:[1,4],bonus:true}` thì ra `done:['santa','snowman']`, `found:[1,4]`, `bonus:true`.
  - `'xmas khác ngày lấy ngày mới hơn'`: `'2026-12-9'` gộp với `'2026-12-10'` thì ra bản `'2026-12-10'`.
  - `'bản lưu cũ không có xmas'`: `merge({}, {})` cho `r.xmas` bằng `{day:'',done:[],found:[],bonus:false}`.
- [ ] **Step 2:** Chạy `node --test tests/merge.test.js`. Kỳ vọng FAIL.
- [ ] **Step 3:** Cài `mergeXmas` và gọi nó trong `mergeSave`.
- [ ] **Step 4:** Chạy `npm test`. Kỳ vọng PASS.
- [ ] **Step 5:** Commit: `feat: merge Christmas village progress across devices`.

---

### Task 4: Lời thoại, giọng theo nhóm, thẻ trang chủ và màn chọn đồ

**Files:**
- Modify: `js/lines.js`: thêm nhóm lời và `LINE_VOICES`.
- Modify: `tools/voice-export.mjs`: thêm cột `voice` vào `script.csv`.
- Modify: `tools/voice-generate.mjs`: dùng `r.voice||VOICE` cho từng dòng.
- Modify: `js/xmas.js`: thêm `xmasOutfits()`, `xmasOutfit()`, `xmasSetOutfit(id)`.
- Create: `js/xmas-ui.js`: viết `xmasHome()` (màn chọn đồ). `xmasVillage()` để tạm, chỉ hiện "Đang dựng làng…" kèm nút về, Task 6 sẽ thay.
- Modify: `js/ui.js` `home()`: thêm thẻ ngay sau Cờ caro.
- Modify: `css/style.css`: style cho màn chọn đồ (lưới ảnh, ô đang chọn).
- Modify: `index.html`
- Test: `tests/xmas.test.js`, `tests/xmas-lines.test.js`

**Interfaces:**
- Consumes: `SHOP_ITEMS` (shop.js, gọi lúc chạy, không phải lúc nạp file), `xmasProgress` (Task 2).
- Produces:
  - Nhóm lời của **Kuromi**, mỗi nhóm 2–3 câu, cảm xúc và cách đọc dùng chuỗi tone đã có trong `TAGS` của `voice-export.mjs`:
    - `xmas_outfit`: "Bạn mặc bộ nào đi chơi làng nè?"
    - `xmas_enter`: "Làng Giáng Sinh nè! Đi chào mọi người thôi!"
    - `xmas_quiz`: "Có câu đố kìa!"
    - `xmas_quest`: "Có nhiệm vụ kìa!"
    - `xmas_found`: "Tìm thấy rồi!"
    - `xmas_all_done`: "Xong hết rồi! Mai quay lại nha!"
  - Nhóm lời của **nhân vật**, mỗi nhóm 1–2 câu: `xmas_<npc>_hi` và `xmas_<npc>_thanks` cho `santa, snowman, reindeer, nutcracker`. Tính cách: người tuyết sợ nóng, tuần lộc thích chạy, lính chì nghiêm trang mà vui, ông già Noel hiền hậu cười "hô hô".
  - `LINE_VOICES={xmas_santa_hi:'1wg2wOjdEWKA7yQD8Kca', xmas_santa_thanks:'1wg2wOjdEWKA7yQD8Kca'}`, key là tên nhóm.
  - `xmasOutfits() → Array<{id, name, src}>`. Phần tử đầu là `{id:'default', name:'Váy Trắng', src:'images/shop-items/fashion/characters-cutout/white-dress.webp'}`, sau đó là các `SHOP_ITEMS` có id nằm trong `S.owned`.
  - `xmasOutfit() → {id,name,src}`: bộ đã lưu nếu còn trong `xmasOutfits()`, không thì bộ mặc định.
  - `xmasSetOutfit(id)`: ghi vào localStorage `be_vui_xmas_outfit_v1`, bọc trong try/catch.
  - `xmasHome()`: màn chọn đồ (`cls:'xmas-pick'`) gồm lưới ảnh, ô đang chọn có viền, nút `#xgo` "🎄 Vào làng" chạy `goTap(this,xmasVillage)`. Có nút ⬅️ về `home`. Kuromi nói `xmas_outfit`.
  - Thẻ trang chủ: `card(i,'p-green','🎄','Làng Giáng Sinh', sub,'xmasHome')`. `sub` là `✅` nếu `xmasProgress().done===4`, không thì `${done}/4`.

- [ ] **Step 1: Viết test**:
  - Trong `tests/xmas.test.js`, thêm `js/shop.js` vào `FILES`, đặt trước `js/xmas.js`:
    - `'bộ đồ: mặc định đứng đầu, thêm đồ đã mua'`: đặt `S.owned=['fashion/pink-dress']` thì `xmasOutfits().map(o=>o.id)` ra `['default','fashion/pink-dress']`.
    - `'bộ đồ đã lưu không còn thì về mặc định'`: gọi `xmasSetOutfit('fashion/pink-dress')`, rồi đặt `S.owned=[]`, thì `xmasOutfit().id==='default'`.
    - `'localStorage hỏng vẫn chạy'`: chạy `localStorage.getItem=()=>{throw 1}` thì `xmasOutfit().id==='default'`.
  - Trong `tests/xmas-lines.test.js`, `FILES=['js/lines.js']`:
    - `'đủ nhóm lời làng'`: có đủ 6 nhóm Kuromi và 8 nhóm nhân vật kể trên, mỗi nhóm có ≥1 câu.
    - `'giọng Noel đúng id và trỏ tới nhóm có thật'`: mọi key trong `LINE_VOICES` có trong `LINES`. `LINE_VOICES.xmas_santa_hi==='1wg2wOjdEWKA7yQD8Kca'`.
- [ ] **Step 2:** Chạy cả hai file test. Kỳ vọng FAIL.
- [ ] **Step 3:** Cài đặt theo Interfaces.
  - `voice-export.mjs`: nạp thêm `LINE_VOICES` từ ctx (mặc định `{}`). Đặt `voice: LINE_VOICES[group]||''` cho mọi dòng, header thành `file,text,group,emotion,tone,elevenlabs,voice`.
  - `voice-generate.mjs`: đổi `gen` sang `text-to-speech/${r.voice||VOICE}`.
  - Trong `voice-export.mjs`, nếu có dòng nào dùng giọng khác Kuromi thì thêm vào `script.md` ghi chú "(giọng Noel)".
- [ ] **Step 4:** Chạy `npm test` rồi `npm run voice:export`. Kỳ vọng test PASS, và `audio/voice/script.csv` có các dòng `xmas_santa_hi_1.mp3,...,1wg2wOjdEWKA7yQD8Kca`. Chạy `npm run voice:generate -- --dry xmas`: kỳ vọng liệt kê các file xmas còn thiếu và không gọi API. Chạy `voice:generate` thật là việc của người dùng, cần `.env`.
- [ ] **Step 5:** Mở app (`node -e "import('./tests/e2e/serve.mjs').then(m=>m.serve(8080).then(r=>console.log(r.url)))"`) và kiểm tra: trang chủ có thẻ 🎄 với `0/4`, bấm vào thì thấy màn chọn đồ có Váy Trắng, chọn một bộ khác rồi quay lại thì bộ đó vẫn được chọn.
- [ ] **Step 6:** Commit: `feat: add Christmas village lines, Santa voice and outfit picker`.

---

### Task 5: Lõi 3D `js/world3d.js`

**Files:**
- Create: `js/world3d.js`
- Modify: `index.html`: thêm `<script type="importmap">` (giá trị lấy ở Global Constraints) trong `<head>`, **trước mọi script**, và thêm `js/world3d.js`.
- Create: `models/holiday/`: chép từ `/private/tmp/claude-501/-Users-vtvlive-Me-T-o-games-Minigames/f629cb52-0a1f-4c93-887c-cfa7d8a2a4c9/scratchpad/kit/x/Models/GLB format/` mọi file `.glb` **trừ** `hanukkah-*`, `kwanzaa-*`, `festivus-pole`. Chép cả thư mục `Textures/` và `kit/x/License.txt`. Nếu thư mục nguồn không còn thì tải bộ kit ở https://kenney.nl/assets/holiday-kit (Download → "Continue without donating").
- Test: `tests/world3d.test.js` với `FILES=['js/world3d.js']`

**Interfaces:**
- Produces (lõi dùng chung cho mọi bản đồ; nạp file vào node **không** được chạm tới Three hay `import()`):
  - `w3Move(pos:{x,z}, target:{x,z}, step:number, obstacles:Array<{x,z,r}>, bound:{rx,rz}, radius:number) → {x, z, arrived:boolean}`. Đi một bước dài tối đa `step` về phía `target`. Nếu bước đó lấn vào vật cản (hình tròn nở thêm `radius`) thì trượt dọc theo tiếp tuyến. Nếu vẫn kẹt thì đứng yên. Không ra ngoài elip `bound` (thu vào thêm `radius`). `arrived` là true khi khoảng cách tới đích ≤ 0.05, hoặc khi bị kẹt 0 bước.
  - `w3Load() → Promise<{THREE, GLTFLoader}>`. Nạp một lần rồi lưu cache. Khi lỗi thì reject.
  - `w3Supported() → boolean`: thử `canvas.getContext('webgl2')||getContext('webgl')`.
  - `w3Create(canvas:HTMLCanvasElement, opts:{bound:{rx,rz}, base:string}) → Promise<world>`, với `world`:
    - `model(name, {x,z,rotY=0,scale=1,solid=0}) → Promise<Object3D>`: nạp `${base}${name}.glb`, lưu cache rồi clone. `solid>0` thì thêm vật cản `{x,z,r:solid}`.
    - `instances(name, list:Array<{x,z,rotY,scale,solid}>)`: dùng cho cây và đá lặp lại.
    - `group(obj3d, {x,z,solid})`: thêm một vật dựng tay (dùng cho ông già Noel).
    - `npc(id, obj3d, {x,z,r})`: nhân vật có nhún nhẹ khi đứng yên, quay mặt về phía bé khi bé ở gần (< 4), và có `setMark(text|null)` để hiện nhãn nổi trên đầu (`'❗'`, `'✅'`, emoji món đồ). Nhãn là sprite vẽ bằng canvas 2D.
    - `pickup(id, obj3d, {x,z})`: đồ vật xoay và lấp lánh, có `remove()`.
    - `player(src:string, {x,z})`: búp bê giấy. Mặt phẳng cao khoảng 1.6 lần người tuyết, tỉ lệ ảnh 484:900, `transparent:true, alphaTest:.5`, luôn quay về phía camera. Khi đi thì nhún theo sin, `scale.x` đổi dấu theo hướng đi. Có bóng tròn mờ dưới chân.
    - `onTap(cb({kind:'ground'|'npc'|'pickup', id?, x, z}))`: dùng raycast. Chạm vào npc hoặc pickup được ưu tiên hơn chạm mặt đất.
    - `walkTo(x, z, stopDist=0, onArrive?)`: dùng `w3Move` mỗi frame, tốc độ 3 đơn vị/giây. Trong lúc đi, nếu tới gần một pickup (< 0.9) thì gọi `onPickup(id)`.
    - `onPickup(cb(id))`.
    - `dispose()`: dừng vòng render, gỡ listener, giải phóng geometry, material, texture, renderer (`forceContextLoss`).
  - `w3Santa(THREE) → Group`: ông già Noel chibi dựng bằng khối cơ bản (thân trụ đỏ, thắt lưng đen, đầu cầu da, râu trắng, mũ nón đỏ có quả bông trắng), cao bằng người tuyết.
  - Camera là `PerspectiveCamera` fov 40, nhìn chéo từ trên xuống, góc khoảng 50°, đi theo bé với lerp, người chơi không xoay được. Có ánh sáng `HemisphereLight` cộng `DirectionalLight` ấm. Có tuyết rơi bằng `Points` khoảng 300 hạt. `setPixelRatio(Math.min(devicePixelRatio,2))`. Không bật shadow map. Tạm dừng render khi `document.hidden`. Canvas tự đổi kích thước theo `ResizeObserver`.

- [ ] **Step 1: Viết test `w3Move`**:
  - `'đi thẳng tới đích'`: đi từ `{0,0}` tới `{1,0}` với `step=.4` thì sau 3 lần ra `x≈1`, `arrived:true`.
  - `'không xuyên vật cản'`: có vật cản `{x:2,z:0,r:1}`, `radius=.3`, đi từ `{0,0}` tới `{4,0}`. Trong 50 bước, không điểm nào có khoảng cách tới tâm vật cản `<1.3-1e-6`.
  - `'trượt quanh vật cản khi đích lệch'`: đi từ `{0,0.5}` tới `{4,0.5}`, sau 100 bước thì `x>3`, tức là đã vòng qua được.
  - `'không ra ngoài biên'`: `bound={rx:5,rz:3}`, đi tới `{20,0}` thì `x<=5-radius+1e-6`.
  - `'nạp file không cần Three'`: `typeof w3Move==='function'` khi nạp trong vm, không có lỗi.
- [ ] **Step 2:** Chạy `node --test tests/world3d.test.js`. Kỳ vọng FAIL.
- [ ] **Step 3:** Cài `w3Move` và các hàm 3D theo Interfaces. `w3Load` dùng `Promise.all([import('three'), import('three/addons/loaders/GLTFLoader.js')])`.
- [ ] **Step 4:** Chạy `npm test`. Kỳ vọng PASS. Kiểm tra dung lượng bằng `du -sh models/holiday`, kỳ vọng < 3 MB.
- [ ] **Step 5:** Commit: `feat: add shared 3D world core and Kenney Holiday Kit models`.

---

### Task 6: Màn làng: bản đồ, nhân vật, hộp thoại, tìm đồ, ăn mừng

**Files:**
- Modify: `js/xmas-ui.js`: viết `xmasVillage()`, `xmasTalk(npcId)`, `XMAS_MAP`.
- Modify: `js/xmas.js`: thay 14 toạ độ tạm trong `XMAS_SPOTS` bằng toạ độ thật, khớp với bố cục.
- Modify: `css/style.css`: style cho canvas toàn màn, thanh việc, hộp thoại, màn chờ, thông báo lỗi.
- Test: `tests/xmas-ui.test.js` với FILES gồm `js/core.js`, `js/merge.js`, `js/questions.js`, `js/lines.js`, `audio/voice/manifest.js`, `js/voice.js`, `js/music.js`, `js/scene.js`, `js/mascot.js`, `js/shop.js`, `js/xmas-quiz.js`, `js/xmas.js`, `js/world3d.js`, `js/ui.js`, `js/xmas-ui.js`. Danh sách cuối cùng chỉnh theo những gì `ui.js` cần, giống các test UI hiện có.

**Interfaces:**
- Consumes: mọi thứ ở Task 2, 4, 5. Ngoài ra dùng `voice.line`, `voice.text`, `mascotSay`, `burst`, `sfx`, `go`, `goTap`, `screenHTML`, `home`.
- Produces:
  - `XMAS_MAP = {bound:{rx,rz}, start:{x,z}, props:[{model,x,z,rotY,scale,solid}], npcs:{santa:{x,z,rotY}, ...}}`. Bố cục:
    - Đất tuyết hình elip, đi từ đầu này sang đầu kia mất 15–20 giây ở tốc độ 3.
    - `tree-decorated-snow` lớn ở giữa, có đoàn tàu (`train-locomotive`, `train-wagon`) chạy vòng trên `trainset-rail-*`.
    - 2–3 nhà gỗ ghép từ các mảnh `cabin-*`.
    - Rìa làng có `tree`, `tree-snow-a/b/c`, `rocks-*`, `lantern`, `bench`, `sled`, `snow-pile`.
    - Mỗi nhân vật đứng ở một khu khác nhau.
    - 14 chỗ giấu trong `XMAS_SPOTS` phải nhìn thấy được và không nằm trong vật cản.
  - `xmasVillage()`: màn `cls:'xmas'`, gồm:
    - Canvas toàn màn.
    - Topbar có ⬅️ về `home`, ⭐ `balance()`, và thanh việc `#xbar` gồm 4 icon nhân vật, cái nào xong thì có ✓.
    - Mascot nhỏ (`size:'sm'`).
    - Lớp chờ "Kuromi đang dẫn đường…" trong khi `w3Load` và nạp model.
    - Gặp lỗi hoặc `!w3Supported()` thì hiện `.xfail` "Làng đang ngủ, mình quay lại sau nha 💤" kèm nút về trang chủ, không throw.
    - Nạp xong thì Kuromi nói `xmas_enter` (hoặc `xmas_all_done` nếu đã xong cả 4), rồi đặt nhãn: `'❗'` cho `quiz`/`quest`, emoji món đồ cho `return`, `'✅'` cho `done`.
    - Tạo pickup cho những chỗ trong `plan.spots` chưa có trong `found`, nhưng chỉ khi nhân vật nhờ tìm đồ đã giao việc. Nếu bé đã nhặt ít nhất 1 món thì coi như đã giao.
    - Chạm mặt đất thì `walkTo`. Chạm nhân vật thì `walkTo(npc, 1.4, ()=>xmasTalk(id))`. Chạm pickup thì `walkTo` tới đó.
    - `go()` phải gọi `world.dispose()`: bọc `go` hoặc kiểm tra trong vòng render, sao cho rời màn làng bằng bất kỳ đường nào cũng giải phóng.
  - `xmasTalk(npcId)`: mở hộp thoại HTML `#xdlg` phủ lên canvas, gồm icon và tên nhân vật cùng lời thoại.
    - `done`: phát `xmas_<npc>_thanks`, có nút "Tạm biệt".
    - `quiz`: Kuromi nói `xmas_quiz`, nhân vật phát `xmas_<npc>_hi`, rồi chạy phiên `xmasQuizNew`. Mỗi câu hiện `q`, các nút `.ch.btn` cho đáp án, nút 🔊 gọi `voice.text(q)`, và tự đọc khi hiện câu. Đúng thì `sfx.ok` và Kuromi nói `correct`. Sai thì nút rung, Kuromi nói `wrong`. Khi `hint` thì nút đúng nhấp nháy (class `hint` giống game cũ). Khi `done` thì gọi `xmasComplete`.
    - `quest`: nhân vật phát `xmas_<npc>_hi`, Kuromi nói `xmas_quest`. Hộp thoại hiện "Tìm giúp tớ 3 {item.name} {icon} nha!" và nút "Đi tìm!". Bấm nút thì sinh pickup (nếu chưa có), và thanh việc hiện bộ đếm `🧦 0/3`.
    - `return`: gọi `xmasComplete(id,3,plan.day)`.
    - Mọi lần gọi `xmasComplete`: nếu trả `null` mà `plan.day` khác hôm nay thì toast "Sang ngày mới rồi!" rồi `go(xmasVillage)`. Nếu có kết quả thì hiện "+N ⭐" bằng `burst`, phát `xmas_<npc>_thanks`, cập nhật nhãn và thanh việc. Nếu `bonus>0` thì có màn ăn mừng (`burst` nhiều hạt, toast "+3 ⭐ thưởng hoàn thành!") và Kuromi nói `xmas_all_done`.
    - Khi đang mở hộp thoại, mọi chạm vào canvas đều bị bỏ qua. Nút đáp án bị khoá trong lúc xử lý một lần bấm, để bấm hai lần không chấm hai lần.
  - Nhặt đồ (`onPickup`): gọi `xmasPickup(spot, plan.day)`. Nếu nhặt được thì `remove()` pickup, `sfx.ok`, Kuromi nói `xmas_found`, bộ đếm tăng, và khi đủ 3 món thì đổi nhãn nhân vật sang emoji món đồ.

- [ ] **Step 1: Viết test** (không cần WebGL; ép `w3Supported=()=>false` hoặc giả `world`):
  - `'không có WebGL thì hiện thông báo, không lỗi'`: gán `w3Supported=()=>false`, chạy `xmasVillage()`, thì `app.innerHTML` có chứa `xfail`.
  - `'trò chuyện đố: đúng đủ 3 câu thì cộng 3 sao'`: giả `world` bằng một object có `setMark` và các hàm rỗng, gán `xmasWorld` = object giả, lấy `plan`. Chọn một npc đố, gọi `xmasTalk(npc)` rồi gọi `xmasChoose(i)` đúng 3 lần với chỉ số đúng. Kỳ vọng `S.stars===3` và `xmasStatus(npc)==='done'`.
  - `'bấm đáp án hai lần liền chỉ tính một'`: gọi `xmasChoose(correct)` hai lần đồng bộ thì `sess.i` chỉ tăng 1.
  - Để test được, `xmas-ui.js` expose các global `xmasWorld`, `xmasSess` và `xmasChoose(idx)`. Nút đáp án gọi `xmasChoose`.
- [ ] **Step 2:** Chạy `node --test tests/xmas-ui.test.js`. Kỳ vọng FAIL.
- [ ] **Step 3:** Cài đặt theo Interfaces.
- [ ] **Step 4:** Chạy `npm test`. Kỳ vọng PASS.
- [ ] **Step 5: Thử bằng tay** trên server local, ở khổ 1024×768 và 360×740 của Chrome devtools:
  - Vào làng, nạp xong.
  - Đi lại, không xuyên nhà hay cây, không ra ngoài biên.
  - Đố đủ 3 bạn.
  - Nhận việc tìm đồ, nhặt đủ 3 món, quay lại nhận sao.
  - Kiểm tra thưởng hoàn thành và tổng sao tăng 15.
  - Quay về trang chủ thì thẻ hiện `✅`. Vào lại làng thì mọi nhân vật có ✅.
  - Mở devtools Performance, kiểm tra không có vòng render nào chạy sau khi đã về trang chủ.
  - Nếu vướng chỗ nào thì sửa trước khi commit.
- [ ] **Step 6:** Commit: `feat: add Christmas village 3D screen with quizzes and find quests`.

---

### Task 7: E2E và hoàn thiện

**Files:**
- Modify: `tests/e2e/smoke.mjs`
- Modify: `CLAUDE.md`: thêm 2–3 dòng về `world3d.js`, `xmas*.js`, `models/holiday/` và import map.

- [ ] **Step 1: Thêm bước e2e** `'làng giáng sinh'` vào `run()`, sau phần trang chủ:
  - Bấm thẻ có chữ "Làng Giáng Sinh", chờ `#xgo`, gọi `notCovered(pg,'#xgo')` và `noHScroll`, chụp ảnh `-xmas-pick`.
  - Bấm `#xgo`. Chờ `.xmas canvas` hoặc `.xfail` (timeout 20 giây). Chụp ảnh `-xmas-village`.
  - Nếu đã có canvas: chạy `xmasTalk(Object.keys(xmasPlan(dayStr(new Date())).quiz)[0])` bằng evaluate, chờ `#xdlg .ch`, gọi `notCovered(pg,'#xdlg .ch')` và `noHScroll`, chụp ảnh `-xmas-quiz`.
  - Bấm ⬅️ để về trang chủ. Kiểm tra `errs` không có lỗi mới.
- [ ] **Step 2: Thêm một lần chạy riêng ép hỏng WebGL** (chỉ khung 1024×768): dùng `pre` là `HTMLCanvasElement.prototype.getContext=function(){return null}`. Vào làng thì phải thấy `.xfail`, không có lỗi console, và nút về trang chủ hoạt động.
- [ ] **Step 3:** Chạy `npm run e2e`. Kỳ vọng không có dòng lỗi nào, và ảnh nằm trong `tests/e2e/shots/`. Xem ảnh `-xmas-village` và `-xmas-quiz` ở cả 3 khổ màn hình.
- [ ] **Step 4:** Chạy `npm test` một lần cuối. Kỳ vọng PASS.
- [ ] **Step 5:** Commit: `test: cover Christmas village in e2e smoke` (cùng với thay đổi `CLAUDE.md`).
