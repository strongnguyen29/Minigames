# Công chúa chăm ngoan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm phần chơi "Công chúa chăm ngoan": bé báo xong việc hằng ngày/tuần/đột xuất, bố mẹ mở khoá bằng câu tính nhẩm rồi chấm 1–5 sao, nhiệm vụ tuần 5 sao cho hộp quà, kèm bộ huy hiệu.

**Architecture:** Logic thuần (danh sách việc, chu kỳ, trạng thái, câu khoá, chế độ bố mẹ, hộp quà, huy hiệu) nằm trong `js/chores.js` và test được bằng `node --test` qua `tests/helpers/load.js`. Giao diện nằm trong `js/chores-ui.js`. Dữ liệu ở `S.chore` và được gộp giữa các máy bằng `mergeChore` trong `js/merge.js`. Bộ đếm theo từng máy (lấy max từng máy rồi cộng lại) giống `earned`, nên số hộp quà và bộ đếm huy hiệu không cần gộp 3 chiều.

**Tech Stack:** JS thuần, không có bundler, nạp bằng thẻ `<script>`. Test bằng `node:test`. E2E dùng Playwright (`npm run e2e`).

**Spec:** `docs/superpowers/specs/2026-11-05-cong-chua-cham-ngoan-design.md`

## Global Constraints

- Danh sách việc cố định trong code, bố mẹ không sửa được. Có 19 việc ngày, 4 việc tuần và 2 việc đột xuất, dùng đúng tên trong spec.
- Năm việc chỉ có khi đi học được ẩn vào thứ Bảy và Chủ nhật: `di_hoc`, `o_truong`, `an_trua`, `chao_ve`, `soan_sach`.
- Ngày mới bắt đầu lúc 0 giờ theo giờ máy (`dayStr`). Tuần tính từ thứ Hai đến Chủ nhật.
- Câu khoá có 2–3 số, mỗi số từ 1 đến 10, có ít nhất một phép × hoặc ÷. Phép chia luôn ra số tròn, kết quả cuối và mọi bước trung gian đều không âm, nhân chia làm trước cộng trừ. Hiển thị bằng ký hiệu `×`, `÷`, `+`, `−`.
- Một câu khoá đúng mở **chế độ bố mẹ**. Chế độ này tự khoá sau **5 phút** không bấm gì, hoặc khi rời màn. Nút "Chưa được" không cần khoá.
- Ít nhất 1 sao. Nhiệm vụ tuần được 5 sao thì cho 1 hộp quà.
- Tỷ lệ hộp quà: sticker 35%, câu hỏi Kuromi 25% (+5 câu, không hết hạn), nhạc 20% (bài có giá > 0 chưa có), váy 20% (bộ chưa có). Loại đã hết món thì chọn lại trong các loại còn món. Hết sạch thì cho +5 ⭐.
- Quà nhận từ hộp không bị trừ sao: váy vào `owned` và `giftOwned`, bài hát vào `songs` và `giftSongs`.
- Chữ hiển thị và lời thoại viết bằng tiếng Việt. Comment trong code cũng viết tiếng Việt, ngắn gọn như các file hiện có.

## Review Focus

1. **Chấm việc của hôm qua sau 0 giờ:** sao vẫn được cộng, và việc đó của hôm nay vẫn mở để bé báo. Test nằm ở Task 1.
2. **Bé bấm "Con xong rồi!" hai lần liền tay:** chỉ có một mục chờ. Với việc đột xuất, lần bấm thứ hai trong vòng 2 giây bị bỏ qua. Test nằm ở Task 1.
3. **Bản lưu cũ không có `chore`, `giftSongs` hoặc `talk.gift`, và gộp với bên kia cũng chưa có:** không lỗi, ra cấu trúc rỗng. Test nằm ở Task 3.
4. **Chế độ bố mẹ hết hạn khi màn chấm đang mở:** bấm "Chấm" lúc đó phải hỏi lại câu khoá, không được ghi sao. Test nằm ở Task 2 (`parentOn`) và Task 6 (luồng màn).
5. **Bài hát tặng bị tính tiền:** `balance()` không trừ giá bài trong `giftSongs`, kể cả sau khi gộp. Test nằm ở Task 4.

---

### Task 1: Dữ liệu nhiệm vụ, chu kỳ và trạng thái

**Files:**
- Create: `js/chores.js`
- Modify: `js/core.js`: thêm `chore` vào `DEF`, `freshSave()` và phần bù trường trong `load()`
- Modify: `index.html`: thêm `<script src="js/chores.js"></script>` ngay sau `js/chat-ui.js`
- Test: `tests/chores.test.js`

**Interfaces:**
- Consumes: `S`, `save()`, `dayStr(d)` (`js/core.js`); `deviceId()` (`js/merge.js`)
- Produces:
  - Hằng số `CHORE_GROUPS: [{id,icon,name}]` với id `sang`, `truong`, `chieu`, `toi`; `CHORES` (việc ngày `{id,name,icon,grp,school?:true}`); `CHORES_WEEK` (`{id,name,icon}`); `CHORES_EXTRA` (`{id,name,icon}`)
  - `choreDay(d?:Date):string`, `choreWeek(d?:Date):string` (trả `dayStr` của thứ Hai), `isSchoolDay(d?:Date):boolean`, `choresFor(d?:Date):Array` (các việc ngày hiện trong ngày đó)
  - `choreKey(id,period):string` (dạng `id+'@'+period`), `choreStatus(id,period):'todo'|'wait'|'done'|'closed'`
  - `choreReport(id,period):boolean`, `choreReportExtra(task,now?:number):string|null` (trả uid của mục mới)
  - `choreRate(ref,n):{stars:number,box:boolean}|null` (`ref` là log key hoặc uid đột xuất), `choreRedo(ref,now?:Date):void`
  - `chorePending(now?:Date):Array<{ref,task,period,past:boolean}>`
  - `choreCount(k):number`, `choreBump(k,by?:number):void`
  - Cấu trúc `S.chore = {log:{}, extra:[], cnt:{}}`:
    - `log[key] = {st:'wait'|'redo'|'done'|'closed', n?, t}`
    - `extra = [{id, task, st, n?, t}]`
    - `cnt[deviceId] = {done, five, ten, exam, sleep, dinner, morning, boxIn, boxOut}`

ID của việc (giữ nguyên, vì được lưu trong dữ liệu của bé):
- sáng: `day_dung_gio`, `danh_rang_sang`, `mac_do`, `an_sang`, `deo_cap`, `chao_di`, `di_hoc`*
- trường: `o_truong`*, `an_trua`*
- chiều: `chao_ve`*, `cat_cap`, `rua_tay`, `giup_viec`, `an_toi`, `hoc_bai`, `don_do_choi`
- tối: `danh_rang_toi`, `soan_sach`*, `di_ngu`
- tuần: `tuan_dung_gio`, `tuan_don_goc`, `tuan_doc_truyen`, `tuan_hoc_tho`
- đột xuất: `diem10`, `vuot_thi`

(* = `school:true`)

- [ ] **Step 1: Write the failing tests** trong `tests/chores.test.js`. Nạp các file theo thứ tự của `index.html` cho tới `js/chores.js`, giống `FILES` trong `tests/radio.test.js` nhưng có thêm `js/chat.js` và `js/chores.js`. Dùng `deviceId` = `'A'`. Các test cần có:
  - `CHORES.length===19`, `CHORES_WEEK.length===4`, `CHORES_EXTRA.length===2`; có đúng 5 việc `school`.
  - `choreWeek(new Date(2026,10,8))` (Chủ nhật) `=== '2026-11-2'`; `choreWeek(new Date(2026,10,9)) === '2026-11-9'`.
  - `choresFor(new Date(2026,10,7)).length===14` (thứ Bảy); `choresFor(new Date(2026,10,5)).length===19`.
  - Báo rồi chấm:
    - `choreReport('mac_do',P)` trả `true`, và trạng thái thành `'wait'`. Gọi lần hai thì trả `false` và vẫn chỉ có một khoá.
    - `choreRate(choreKey('mac_do',P),4)` trả `{stars:4,box:false}`. Sau đó `S.stars` tăng 4, `choreCount('done')===1` và trạng thái thành `'done'`.
    - Chấm lại cùng việc thì trả `null`.
  - Chấm việc của hôm qua: báo với period hôm qua, chấm hôm nay. Sao vẫn được cộng, `choreStatus('mac_do', hômNay)==='todo'`, và `chorePending()` không còn mục đó.
  - `chorePending()` trả việc chờ của hôm qua với `past:true`, và việc chờ của hôm nay với `past:false`.
  - `choreRedo` với việc hôm nay đưa về `'todo'`, rồi báo lại được. Với việc của hôm qua thì thành `'closed'`, `chorePending()` không còn nó, và `choreReport` của hôm qua trả `false`.
  - Việc tuần được 5 sao trả `box:true` và `choreCount('boxIn')===1`. Được 4 sao trả `box:false`.
  - Việc đột xuất:
    - Gọi `choreReportExtra('diem10',1000)` hai lần, lần hai với `now=2500`. Lần hai trả `null`.
    - Gọi lần ba với `now=4000` thì tạo mục mới.
    - Chấm 5 sao cho mục `diem10` làm `choreCount('ten')` tăng 1.
    - `choreRedo` mục đột xuất thì thành `closed`.
  - Chấm `di_ngu` làm `sleep` tăng 1, chấm `an_toi` làm `dinner` tăng 1, chấm `vuot_thi` làm `exam` tăng 1, và mọi lần chấm 5 sao làm `five` tăng 1.
  - Buổi sáng trọn vẹn: chấm hết các việc nhóm `sang` có trong `choresFor(ngày)` thì `morning` tăng đúng 1. Kiểm tra cho cả ngày thứ Bảy (6 việc sáng, không có `di_hoc`).

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/chores.test.js`
Expected: FAIL. `chores.js` chưa tồn tại, nên test báo lỗi ENOENT hoặc ReferenceError.

- [ ] **Step 3: Implement `js/chores.js` (phần dữ liệu và trạng thái) và sửa `js/core.js`**
  - Trong `core.js`: `DEF.chore={log:{},extra:[],cnt:{}}`. `freshSave()` phải tạo object mới cho trường này. `load()` bù `chore` khi thiếu, và bù từng trường con khi thiếu.
  - `choreRate` chỉ nhận mục đang ở trạng thái `wait` và `n` là số nguyên 1–5. Nó cộng `S.stars+=n`, gán `st:'done',n,t:Date.now()`, rồi gọi `choreBump` cho các bộ đếm ở trên. Với việc tuần được 5 sao thì `choreBump('boxIn')`. Cuối cùng `save()`.
  - Kỳ của một khoá suy ra từ phần sau `@`. Việc tuần dùng `choreWeek`, việc ngày dùng `choreDay`. "past" nghĩa là kỳ đó khác kỳ hiện tại.
  - `morning` được tăng khi lần chấm vừa xong làm đủ các việc `sang` của ngày đó (theo `choresFor(ngày)`) đều `done`.
  - Đặt chống bấm đúp cho việc đột xuất là `EXTRA_DEBOUNCE_MS=2000`. uid tạo bằng `Date.now().toString(36)+Math.random().toString(36).slice(2,6)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/chores.test.js && npm test`
Expected: PASS. Toàn bộ test cũ vẫn xanh.

- [ ] **Step 5: Commit**

```bash
git add js/chores.js js/core.js index.html tests/chores.test.js
git commit -m "feat: add chore list, periods and report/rate state"
```

---

### Task 2: Câu khoá và chế độ bố mẹ

**Files:**
- Modify: `js/chores.js`
- Test: `tests/chores.test.js`

**Interfaces:**
- Produces:
  - `lockQuestion(rnd?:()=>number):{text:string,answer:number}`
  - `PARENT_IDLE_MS=300000`
  - `parentOpen(now?:number):void`, `parentOn(now?:number):boolean`, `parentTouch(now?:number):void`, `parentLock():void`. Trạng thái chỉ nằm trong bộ nhớ, không lưu vào `S`.

- [ ] **Step 1: Write the failing tests**
  - Sinh 2000 câu bằng `lockQuestion()`. Với mỗi câu, tách `text` theo dấu cách thành số và phép tính, rồi kiểm tra:
    - có 2–3 số, mỗi số là số nguyên 1–10
    - có ít nhất một `×` hoặc `÷`
    - chỉ dùng các phép `+ − × ÷`
    - đổi ký hiệu sang `+ - * /` rồi tính bằng `Function` thì ra đúng `answer`
    - `answer` là số nguyên không âm
    - tính theo thứ tự ưu tiên, mọi bước chia đều ra số nguyên, và mọi giá trị trung gian không âm
  - Có cả câu 2 số và câu 3 số trong 2000 lần (dùng một `rnd` cố định đủ để thấy cả hai, hoặc chỉ đếm lại).
  - `parentOn(0)===false`. Sau `parentOpen(0)`: `parentOn(299999)===true`, `parentOn(300000)===false`.
  - `parentTouch(200000)` thì `parentOn(450000)===true`.
  - `parentLock()` thì `parentOn(1)===false`.

- [ ] **Step 2: Run** `node --test tests/chores.test.js`. Expected: FAIL (`lockQuestion is not defined`).

- [ ] **Step 3: Implement.** Chọn ngẫu nhiên một khuôn trong các dạng `a○b` và `a○b○c`, sinh số 1–10, rồi kiểm tra theo các ràng buộc. Không đạt thì sinh lại, tối đa 200 lần. Nếu không có câu nào đạt thì trả `{text:'6 × 7',answer:42}`. Tính có thứ tự ưu tiên bằng cách gộp `×`/`÷` trước rồi tới `+`/`−`. Không dùng `eval`.

- [ ] **Step 4: Run** `node --test tests/chores.test.js`. Expected: PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat: add parent lock question and parent mode timer"`

---

### Task 3: Gộp dữ liệu nhiệm vụ giữa các máy

**Files:**
- Modify: `js/merge.js`: thêm `mergeChore(a,b)` và gọi nó trong `mergeSave`. Gộp `giftSongs` bằng hợp. `talk` vẫn để nguyên trong `LOCAL_ONLY`.
- Test: `tests/merge.test.js`

**Interfaces:**
- Produces: `mergeChore(a:object|undefined, b:object|undefined):{log,extra,cnt}`
- Luật gộp:
  - `log`: hợp các khoá. Nếu cả hai bên có cùng khoá thì trạng thái cuối (`done`, `closed`) thắng `wait` và `redo`. Hai trạng thái cuối thì lấy `t` nhỏ hơn. Hai trạng thái không cuối thì lấy `t` lớn hơn.
  - `extra`: hợp theo `id`, cùng luật như `log`.
  - `cnt`: lấy max từng máy, từng bộ đếm.

- [ ] **Step 1: Write the failing tests**
  - `merge({},{})` cho ra `chore` dạng `{log:{},extra:[],cnt:{}}` và `giftSongs:[]`.
  - Một bên `done` (n=4) và bên kia `wait`: ra `done` với n=4, ở cả hai chiều gộp.
  - Một bên `redo` (t=5) và bên kia `wait` (t=9): ra `wait`. Ngược lại `redo` (t=9) và `wait` (t=5): ra `redo`.
  - `closed` thắng `wait`.
  - `extra` có id trùng thì chỉ giữ một mục. Id khác nhau thì giữ cả hai.
  - `cnt`: `{A:{done:3}}` gộp với `{A:{done:5},B:{done:1}}` ra `{A:{done:5},B:{done:1}}`.
  - `giftSongs` là hợp của hai bên.

- [ ] **Step 2: Run** `node --test tests/merge.test.js`. Expected: FAIL.

- [ ] **Step 3: Implement** `mergeChore`. Gọi `out.chore=mergeChore(local.chore,remote.chore)` và `out.giftSongs=union(...)` trong `mergeSave`.

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat: merge chore log, extras, counters and gifted songs across devices"`

---

### Task 4: Hộp quà chăm ngoan, bài hát tặng, câu hỏi tặng, dọn lịch sử

**Files:**
- Modify: `js/chores.js`
- Modify: `js/radio.js`: `radioSpent()` bỏ qua id có trong `S.giftSongs`
- Modify: `js/chat.js`:
  - `talkState()` giữ nguyên `t.gift` khi sang ngày mới
  - `talkLeft()` cộng thêm `gift`
  - `talkUse()` trừ theo thứ tự: miễn phí → `paid` → `gift`. Lý do: `paid` hết hạn lúc 0 giờ, còn `gift` thì không, nên dùng `paid` trước để bé không bị phí.
- Modify: `js/core.js`: thêm `giftSongs:[]` vào `DEF`, `freshSave()` và phần bù trường trong `load()`
- Test: `tests/chores.test.js`, `tests/radio.test.js`, `tests/chat-quota.test.js`

**Interfaces:**
- Consumes: `STICKERS`; `SHOP_ITEMS`, `owns(id)`; `RADIO_ITEMS`, `hasSong(id)`; `talkState()`
- Produces:
  - `CHORE_BOX_ODDS=[['sticker',35],['talk',25],['song',20],['dress',20]]`
  - `CHORE_BOX_TALK=5`, `CHORE_BOX_STARS=5`
  - `choreBoxes():number` (bằng `boxIn` trừ `boxOut`)
  - `choreBoxPrize(rnd?):{kind:'sticker'|'talk'|'song'|'dress'|'stars',value}`. Hàm này chỉ chọn quà, không ghi gì vào `S`.
  - `choreBoxOpen(rnd?):{kind,value}|null`. Hàm này áp dụng quà vào `S`, gọi `choreBump('boxOut')` rồi `save()`. Trả `null` khi không còn hộp.
  - `chorePrune(now?:Date):void`. Bỏ các mục `done`/`closed` của việc ngày và việc đột xuất cũ hơn 14 ngày, và của việc tuần cũ hơn 5 tuần. Giữ lại mọi mục `wait`.

- [ ] **Step 1: Write the failing tests**
  - `choreBoxPrize` với `rnd` trả lần lượt các giá trị khác nhau: `0.10` ra sticker, `0.40` ra talk, `0.65` ra song, `0.90` ra dress. Ngưỡng cộng dồn là 35, 60, 80, 100.
  - Khi bé đã có hết sticker, `rnd=0.10` ra một trong ba loại còn lại. Khi chỉ còn talk thì luôn ra talk.
  - Khi `STICKERS`, `SHOP_ITEMS` và `RADIO_ITEMS` có giá đều đã có hết, và gán tạm `CHORE_BOX_ODDS=[['sticker',1]]`, thì ra `{kind:'stars',value:5}`.
  - `choreBoxOpen` với một bài hát:
    - id bài được thêm vào cả `S.songs` và `S.giftSongs`
    - `balance()` không đổi
    - `choreBoxes()` giảm 1
  - `choreBoxOpen` với váy: id váy có trong `owned` và `giftOwned`, `balance()` không đổi.
  - `choreBoxOpen` với talk: `talkLeft()` tăng 5. Đổi ngày giả lập sang hôm sau thì `talkLeft()` bằng `TALK_FREE+5`.
  - `choreBoxOpen` khi `choreBoxes()===0` thì trả `null`.
  - `talkUse` trừ theo thứ tự miễn phí → paid → gift.
  - `chorePrune`:
    - mục `done` 15 ngày trước bị xoá
    - mục `wait` 30 ngày trước vẫn còn
    - mục `done` 13 ngày trước vẫn còn
    - `cnt` không đổi

- [ ] **Step 2: Run** `npm test`. Expected: FAIL ở các test mới.

- [ ] **Step 3: Implement** theo các Interfaces ở trên. Chỉ chọn bài nhạc có `price>0` và `!hasSong(id)`.

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat: chore gift box with sticker, Kuromi questions, songs and dresses"`

---

### Task 5: Huy hiệu chăm ngoan

**Files:**
- Modify: `js/chores.js`: `BADGES.push(...CHORE_BADGES)`, chạy lúc nạp file. `rewards.js` đã nạp trước file này.
- Test: `tests/chores.test.js`

**Interfaces:**
- Consumes: `BADGES`, `checkBadges()` (`js/rewards.js`)
- Produces:
  - `CHORE_BADGES`: 16 huy hiệu theo bảng trong spec, với id `c_first`, `c_five`, `c_20`, `c_100`, `c_300`, `c_day`, `c_day3`, `c_day7`, `c_box`, `c_week`, `c_morning`, `c_sleep`, `c_dinner`, `c_ten1`, `c_ten10`, `c_exam`. Tên, biểu tượng và mô tả lấy nguyên văn từ spec.
  - `choreGreatRun():number`: chuỗi dài nhất các ngày liên tiếp trong log còn giữ mà mọi việc trong `choresFor(ngày)` đều `done`. Hàm này phải chạy trước khi `chorePrune` xoá log.
  - `chorePerfectWeek():boolean`: có một tuần mà cả 4 việc tuần đều `done` với `n===5`.
- Điều kiện:
  - `c_first`: done≥1
  - `c_five`: five≥1
  - `c_20` / `c_100` / `c_300`: done≥20 / 100 / 300
  - `c_day` / `c_day3` / `c_day7`: `choreGreatRun()` ≥1 / 3 / 7
  - `c_box`: boxOut≥1
  - `c_week`: `chorePerfectWeek()`
  - `c_morning`: morning≥7
  - `c_sleep`: sleep≥10
  - `c_dinner`: dinner≥10
  - `c_ten1` / `c_ten10`: ten≥1 / 10
  - `c_exam`: exam≥1

- [ ] **Step 1: Write the failing tests**
  - `BADGES` có đủ 16 id ở trên.
  - Chấm hết việc của 7 ngày liên tiếp, từ thứ Hai 2026-11-2 tới Chủ nhật 2026-11-8 (cuối tuần chỉ 14 việc). Sau đó `choreGreatRun()===7` và `checkBadges()` trả về có `c_day7`.
  - Bỏ một việc ở ngày giữa thì `choreGreatRun()===3`.
  - Cả 4 việc tuần được 5 sao thì `c_week` có, và chỉ 3 việc 5 sao thì không có.
  - Lần chấm đầu tiên cho ra `c_first`.

- [ ] **Step 2: Run** `node --test tests/chores.test.js`. Expected: FAIL.

- [ ] **Step 3: Implement.** Lịch sử phải giữ ít nhất 14 ngày (đã có ở Task 4), đủ để tính chuỗi 7 ngày. Huy hiệu đã đạt nằm trong `S.badges` nên không mất khi dọn log.

- [ ] **Step 4: Run** `npm test`. Expected: PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat: add chore badges"`

---

### Task 6: Màn Công chúa chăm ngoan, màn chấm, câu khoá, mở hộp, lối vào

**Files:**
- Create: `js/chores-ui.js` (thêm `<script>` ngay sau `js/chores.js` trong `index.html`)
- Modify: `js/ui.js`:
  - `home()`: thêm thẻ `card(n+?, 'p-pink', '👸', 'Công chúa chăm ngoan', sub, 'chores')`, đặt trước thẻ Tiệm công chúa. `sub` là `⏳ ${chorePending().length}` khi lớn hơn 0, ngược lại là `''`. Dùng `typeof chorePending==='function'` để các test cũ không nạp file này vẫn chạy.
  - `go(fn)`: thêm `if(typeof parentLock==='function')parentLock()`.
  - Tách `openGift`: phần lớp phủ và hộp lắc thành `giftOverlay({count:()=>number, take:()=>({pic,title,line}), done})`. `openGift` gọi lại nó với cách chọn quà hiện tại, không đổi hành vi.
- Modify: `js/lines.js`: thêm các nhóm `chore_home`, `chore_done`, `chore_rated`, `chore_redo`, `chore_box`, `gift_song`, `gift_talk`, `parent_wrong`. Mỗi nhóm 2–3 câu, theo giọng và `L_(...)` như các nhóm có sẵn.
- Modify: `css/style.css`: thêm khối CSS cho `.chores` (thẻ tab, dòng việc, nhãn trạng thái, bàn phím số). Dùng lại biến màu và lớp `btn`, `p-pink`... có sẵn.
- Regenerate: `npm run voice:export` để cập nhật `audio/voice/script.md`, `script.csv` và `voice-prompt.md`.
- Test: `tests/chores-ui.test.js`; `tests/e2e/smoke.mjs`

**Interfaces:**
- Consumes: mọi thứ từ Task 1–5; `go`, `goTap`, `screenHTML`, `topbar`, `mascotSay`, `confetti`, `sfx`, `checkBadges`
- Produces:
  - `chores()`: màn chính
  - `let choreTab='day'|'week'|'extra'`
  - `choreRateModal(ref)`
  - `choreLockModal(onOk:()=>void)`
  - `openChoreBox(done?)`

Hành vi (theo spec, bố cục A, bản phác `task-screen.html`):
- Thanh trên có nút ⬅️ về nhà, tiêu đề "👸 Công chúa chăm ngoan" và `⭐ balance()`. Khi `parentOn()` thì có thêm nút `🔓` để khoá ngay.
- Ba thẻ: Hôm nay / Tuần này / Đột xuất.
  - Đầu mỗi thẻ có nhóm "⏳ Còn chờ từ trước" khi `chorePending()` có mục `past` thuộc loại của thẻ đó.
  - Thẻ Hôm nay chia nhóm theo `CHORE_GROUPS`, chỉ hiện các việc trong `choresFor()`.
  - Thẻ Tuần này có dòng "🎁 Việc tuần được 5 sao = 1 hộp quà". Khi `choreBoxes()>0` thì có nút "🎁 Mở quà (n)".
  - Thẻ Đột xuất có nút báo cho từng việc ("💯 Con đạt điểm 10!", "🎓 Con vượt qua kỳ thi!"), và danh sách các mục còn chờ hoặc đã chấm trong 14 ngày.
- Nhãn trạng thái trên mỗi dòng việc:
  - `todo`: nút "Con xong rồi!". Bấm thì `choreReport` và `mascotSay('chore_done')`.
  - `wait`: nhãn "⏳ Chờ bố mẹ". Bấm thì `choreRateModal`.
  - `done`: hiện các ⭐ đã nhận.
  - `closed`: ẩn đi.
- `choreRateModal(ref)` gồm:
  - tên việc và dòng "Bố mẹ chấm cho con mấy sao?"
  - 5 ngôi sao để chọn
  - nút "Chấm N sao", bị tắt khi chưa chọn sao
  - nút "↩︎ Chưa được, con làm lại nhé", gọi `choreRedo` và `mascotSay('chore_redo')`

  Bấm "Chấm N sao":
  - Nếu `parentOn()` thì gọi `parentTouch()` rồi `choreRate`.
  - Nếu không thì gọi `choreLockModal(()=>{parentOpen();choreRate(...)})`.

  Sau khi chấm: confetti, `mascotSay('chore_rated')`, hiện huy hiệu mới từ `checkBadges()`, rồi vẽ lại màn. Nếu `box` thì báo "+1 🎁".
- `choreLockModal`:
  - tiêu đề "🔒 Câu hỏi của bố mẹ" và phép tính lấy từ `lockQuestion()`
  - ô đáp án chỉ hiển thị, không phải `<input>`, nên không bật bàn phím hệ thống
  - bàn phím 0–9, ⌫, ✓, tối đa 3 chữ số
  - sai thì `mascotSay('parent_wrong')`, rung nhẹ và đổi sang câu mới
  - có nút đóng
- `openChoreBox` dùng `giftOverlay`, với `take` gọi `choreBoxOpen()`. Lời thoại theo loại quà:
  - sticker: `sticker_new`
  - váy: `gift_dress`
  - bài hát: `gift_song`
  - câu hỏi: `gift_talk`
  - +5 ⭐: `sticker_all`
- Khi vào màn `chores()`: gọi `chorePrune()` rồi `mascotSay('chore_home',{ifIdle:true})`.

- [ ] **Step 1: Write the failing tests** trong `tests/chores-ui.test.js`. Nạp file như `tests/radio.test.js` và thêm `js/chat.js`, `js/chores.js`, `js/chores-ui.js`.
  - Gọi `chores()`. `app.innerHTML` có "Con xong rồi!" và tên "Dậy đúng giờ".
  - Thẻ `extra` có "Con đạt điểm 10".
  - Chấm khi chưa mở chế độ bố mẹ: gọi `choreRateModal(ref)` rồi bấm chấm 3 sao qua hàm xử lý. Phải mở modal khoá, và `S.stars` chưa đổi. Gọi callback đúng thì `S.stars` tăng 3 và `parentOn()===true`.
  - Chế độ bố mẹ hết hạn: `parentOpen(Date.now()-PARENT_IDLE_MS-1)`, sau đó chấm phải mở lại modal khoá.
  - `go(home)` làm `parentOn()===false`.
  - `home()` có thẻ "Công chúa chăm ngoan" và "⏳ 1" khi có một việc chờ.

  Nếu các hàm xử lý gắn vào DOM giả khó kích hoạt trong test, thì tách phần quyết định ra hàm thuần, ví dụ `choreSubmit(ref,n,onLock)`, và test hàm đó.

- [ ] **Step 2: Run** `node --test tests/chores-ui.test.js`. Expected: FAIL.

- [ ] **Step 3: Implement** `js/chores-ui.js`, các thay đổi trong `ui.js`, `lines.js` và CSS, rồi chạy `npm run voice:export`.

- [ ] **Step 4: Run** `npm test`. Expected: PASS, gồm cả `round-flow` (`openGift` sau khi tách vẫn chạy đúng).

- [ ] **Step 5: E2E.** Trong `tests/e2e/smoke.mjs`, thêm một đoạn chạy trên cả 3 khung màn hình:
  1. Từ trang chủ bấm thẻ "Công chúa chăm ngoan".
  2. Bấm "Con xong rồi!" ở việc đầu tiên, rồi bấm "⏳ Chờ bố mẹ" và chọn 5 sao.
  3. Ở màn khoá, đọc phép tính trong DOM, tính đáp án trong test, bấm các phím rồi bấm ✓.
  4. Kiểm tra số ⭐ trên thanh trên đã tăng 5.
  5. Kiểm tra không có cuộn ngang (`noHScroll`), và chụp ảnh `chores-*.png`.

  Run: `npm run e2e`. Expected: không có lỗi nào trong `fails`.

- [ ] **Step 6: Commit**

```bash
git add js/chores-ui.js js/ui.js js/lines.js css/style.css index.html audio/voice tests
git commit -m "feat: Công chúa chăm ngoan screen, parent rating, lock keypad and gift box"
```
