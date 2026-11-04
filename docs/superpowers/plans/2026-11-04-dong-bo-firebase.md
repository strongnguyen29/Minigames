# Sao lưu và đồng bộ qua Firebase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phụ huynh đăng nhập Google một lần, tiến độ của bé tự sao lưu lên Firestore và quay về khi xoá dữ liệu web hoặc sang máy khác.

**Architecture:** `localStorage` vẫn là nơi lưu chính. Ba lớp mới:
- `js/merge.js`: các hàm thuần (gộp dữ liệu, bộ đếm sao theo máy).
- `js/sync.js`: đối tượng `cloud` lo luồng đăng nhập, kéo, gộp, đẩy. Nó nói chuyện với Firebase qua một *adapter* nhỏ, nên test thay adapter giả được.
- Adapter thật: tải Firebase SDK modular từ gstatic bằng `import()` động, và chỉ tải khi cần.

**Tech Stack:** JS thuần (script cổ điển, biến toàn cục như hiện tại), Firebase JS SDK `10.14.1` (app, auth, firestore), `node --test` với `tests/helpers/load.js`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-11-04-dong-bo-firebase-design.md`

## Global Constraints

- Không framework, không bước build; file mới là script cổ điển nạp bằng `<script src>` trong `index.html`, viết theo kiểu code hiện có (gọn, comment tiếng Việt).
- Khoá `localStorage` cũ `be_vui_hoc_toan_v1` và mọi trường hiện có giữ nguyên; chỉ thêm trường.
- Firebase SDK chỉ từ `https://www.gstatic.com/firebasejs/10.14.1/` (ghim đúng phiên bản), chỉ tải khi phụ huynh bấm đăng nhập hoặc máy đã từng đăng nhập.
- Firestore: `users/{uid}/profiles/main`. Rules: chỉ `request.auth.uid == uid` được đọc/ghi `users/{uid}/**`.
- Không đồng bộ `sound`, `voice`, `sfx`, `music`.
- Bé không bao giờ thấy lỗi đồng bộ; trạng thái chỉ hiện trong Cài đặt. Không `alert`. `confirm()` chỉ dùng cho câu hỏi đổi tài khoản và "Xoá dữ liệu" (giống nút Xoá hiện có).
- `FIREBASE_CONFIG` để `null` thì mục "☁️ Sao lưu" ẩn và game chạy như trước.
- Chữ hiển thị đúng như spec: "Đăng nhập Google để sao lưu", "Giữ sao và quà của bé, chơi tiếp trên máy khác", "Đã sao lưu lúc HH:MM", "Đồng bộ ngay", "Đăng xuất", "Chưa sao lưu được, sẽ thử lại khi có mạng", "Đã có tiến độ? Đăng nhập để lấy lại", "Xoá tiến độ trên máy này? (Bản sao lưu trên mây vẫn còn)", "Máy này đang có tiến độ của tài khoản khác. Dùng dữ liệu của tài khoản mới (tiến độ trên máy sẽ được thay)?".

## Review Focus

1. **Máy vừa xoá dữ liệu đăng nhập lại** → lấy nguyên dữ liệu mây, bỏ qua màn nhập tên, mây không bị ghi đè bằng dữ liệu trống (Task 2: `máy trống thì lấy mây, không đẩy dữ liệu trống`; Task 4 e2e).
2. **Hai máy cùng kiếm sao lúc mất mạng** → tổng sao cộng dồn, váy mua ở hai máy đều trừ đúng giá (Task 1: `sao hai máy cộng dồn`, `spent tính lại từ owned`).
3. **Mất mạng / SDK tải hỏng / Firestore lỗi** → game chơi tiếp, không lỗi console, Cài đặt hiện câu "Chưa sao lưu được…" (Task 2: `đẩy lỗi thì ghi trạng thái lỗi`; Task 4 e2e `SDK hỏng`).
4. **Chưa từng đăng nhập** → không có request nào tới gstatic/firebase (Task 2: `chưa từng đăng nhập thì không tải adapter`; Task 4 e2e đếm request).
5. **Lưu liên tục khi đang chơi** (mỗi câu trả lời có thể gọi `save()`) → gom thành một lần đẩy, không chặn giọng/hiệu ứng (Task 2: `nhiều lần save gom một lần đẩy`).

---

### Task 1: Hàm gộp và bộ đếm theo máy (`js/merge.js`, `js/core.js`)

**Files:**
- Create: `js/merge.js`
- Modify: `js/core.js` (khối Lưu trữ, dòng 8–21), `js/ui.js:25` (nút "Bắt đầu!" của `welcome`), `index.html` (thêm `<script src="js/merge.js">` ngay sau `core.js`)
- Test: `tests/merge.test.js`

**Interfaces:**
- Produces (toàn cục):
  - `DEVICE_KEY='be_vui_device_v1'`; `deviceId()` → chuỗi id ngẫu nhiên, sinh một lần rồi lưu ở `DEVICE_KEY` (bọc try/catch, lỗi thì giữ trong bộ nhớ).
  - `COUNTERS=['stars','rounds','perfect']`, `LOCAL_ONLY=['sound','voice','sfx','music']`.
  - `foldEarned(s, dev)` → trả `s` sau khi đặt `s.earned[dev][k] = s[k] - tổng các máy khác` cho mỗi `k` trong `COUNTERS` (không âm). Code cũ vẫn chỉ cộng `S.stars`, không phải sửa chỗ cộng sao.
  - `mergeSave(local, remote, priceOf)` → object mới; `priceOf(id)` trả giá món (0 nếu không biết). Cả hai đầu vào đã được `foldEarned`.
  - `isEmptySave(s)` → `!s || !s.name`.
  - Trường mới trong `S`: `earned:{}`, `profileUpdatedAt:0`, `savedAt:0` (thêm vào `DEF`).
- `save()` đặt `S.savedAt=Date.now()` trước khi ghi; nút "Bắt đầu!" đặt thêm `S.profileUpdatedAt=Date.now()`.

Bảng gộp (từ spec mục 6):
| Trường | Luật |
|---|---|
| `earned` | từng máy, từng bộ đếm: max; rồi `stars/rounds/perfect` = tổng |
| `best` | từng khoá: max |
| `stickers`, `badges`, `owned`, `giftOwned` | hợp, giữ thứ tự bên local trước |
| `spent` | `owned` không nằm trong `giftOwned`, cộng `priceOf` |
| `gifts`+`luckyGifts` | lấy cặp của bên có `gifts` lớn hơn (bằng thì local) |
| `streak`,`lastDay` | cặp của bên có `lastDay` mới hơn (parse `Y-M-D` không đệm số 0, so sánh theo ngày); bằng thì `streak` max |
| `name`,`avatar`,`profileUpdatedAt` | bên có `profileUpdatedAt` lớn hơn (bằng thì local) |
| `LOCAL_ONLY` | luôn của local |
| trường khác | bên có `savedAt` lớn hơn |

- [ ] **Step 1: Viết test hỏng** trong `tests/merge.test.js`, nạp `['js/core.js','js/merge.js']` bằng `loadGame`:
```js
test('sao hai máy cộng dồn', () => {
  // A: earned {A:{stars:10,rounds:2,perfect:1}}, B: earned {B:{stars:8,rounds:1,perfect:0}}
  // → stars 18, rounds 3, perfect 1, earned có cả A và B
});
test('foldEarned gán phần chênh cho máy hiện tại', () => {
  // s={stars:30,earned:{X:{stars:12}}} , foldEarned(s,'Y') → earned.Y.stars===18
  // dữ liệu cũ không có earned: foldEarned({stars:40},'Y') → earned.Y.stars===40
});
test('spent tính lại từ owned', () => {
  // local owned ['a'], remote owned ['b'], giftOwned ['b'], priceOf a=15 b=20 → spent 15, owned ['a','b']
});
test('best lấy max từng khoá, stickers hợp không trùng', () => {
  // {count-0:3, add-2:1} + {add-2:2, cmp-1:1} → {count-0:3, add-2:2, cmp-1:1}
});
test('streak theo lastDay mới hơn, so sánh đúng 2026-11-10 > 2026-11-9', () => {});
test('tên theo profileUpdatedAt mới hơn; cài đặt âm thanh luôn của local', () => {});
test('gifts và luckyGifts đi theo cặp của bên nhiều quà hơn', () => {});
test('trường lạ lấy theo savedAt mới hơn', () => {});
test('deviceId giữ nguyên qua hai lần gọi và lưu ở be_vui_device_v1', () => {});
test('save() đặt savedAt; dữ liệu cũ nạp vào có earned={} và không mất trường nào', () => {});
```
Mỗi test viết đầy đủ assert với đúng các giá trị trong comment.

- [ ] **Step 2: Chạy** `npm test` → các test mới FAIL (`foldEarned is not defined`…), test cũ vẫn PASS.
- [ ] **Step 3: Viết `js/merge.js` và sửa `js/core.js`, `js/ui.js:25`, `index.html`** theo Interfaces và bảng trên.
- [ ] **Step 4: Chạy** `npm test` → tất cả PASS.
- [ ] **Step 5: Commit** `feat(sync): hàm gộp tiến độ và bộ đếm sao theo máy`

---

### Task 2: Luồng đồng bộ `cloud` với adapter (`js/sync.js`)

**Files:**
- Create: `js/sync.js`, `js/firebase-config.js` (chỉ `const FIREBASE_CONFIG=null;` kèm comment trỏ tới `docs/firebase-setup.md`)
- Modify: `js/core.js` `save()` (cuối hàm: `if(typeof cloud!=='undefined')cloud.pushSoon()`), `index.html` (thêm `firebase-config.js`, `sync.js` ngay sau `shop.js`)
- Test: `tests/sync.test.js`

**Interfaces:**
- Consumes: `foldEarned`, `mergeSave`, `isEmptySave`, `deviceId`, `LOCAL_ONLY` (Task 1); `SHOP_ITEMS` (`js/shop.js`) để làm `priceOf`; `S`, `save`, `KEY`.
- Adapter (đối tượng, mọi hàm trả Promise trừ `onAuth`):
  - `onAuth(cb)`: gọi `cb(user|null)` với `user={uid,email}` mỗi khi trạng thái đăng nhập đổi (kể cả lần đầu).
  - `signIn()`, `signOut()`
  - `get(uid)` → object hoặc `null`; `set(uid, data)`
- `cloud.loadAdapter`: `() => Promise<adapter>`. Mặc định là adapter thật ở Task 3. Nếu có `window.CLOUD_ADAPTER` (test/e2e đặt trước khi nạp) thì dùng nó.
- `CLOUD_KEY='be_vui_cloud_v1'` lưu `{used:true, uid, email, lastSync, error}`.
- Produces `cloud`:
  - `cloud.available`: `!!FIREBASE_CONFIG || !!window.CLOUD_ADAPTER`.
  - `cloud.state()` → `{signedIn, email, lastSync, error}`.
  - `cloud.init()`: chỉ khi `available` và `CLOUD_KEY.used`. Nạp adapter, `onAuth` → nếu có user thì `pull()`. Lỗi nạp thì ghi `error`, không ném ra.
  - `cloud.signIn()`: nạp adapter nếu chưa có, đặt `used:true`, gọi `adapter.signIn()`. Luồng sau đăng nhập do `onAuth` xử lý.
  - `cloud.signOut()`: `adapter.signOut()`, xoá `uid/email/lastSync`, đặt `used:false`.
  - `cloud.pull()`, theo spec mục 4.2 và 4.4:
    1. `remote=get(uid)`.
    2. Nếu `CLOUD_KEY.uid` khác `uid` hiện tại, đã có `CLOUD_KEY.uid`, và `!isEmptySave(S)`: hỏi bằng `confirm` câu đổi tài khoản. Huỷ → `signOut()`. Đồng ý → nếu có `remote` thì thay `S` bằng `remote` (giữ `LOCAL_ONLY` của máy), nếu không thì đẩy `S` lên.
    3. Nếu không ở trường hợp 2: `remote==null` → đẩy `S`. `isEmptySave(S)` → lấy `remote` (giữ `LOCAL_ONLY`), **không** đẩy dữ liệu trống. Còn lại → `mergeSave(foldEarned(S),remote,priceOf)`, ghi local, rồi `set`.
    4. Ghi `uid,email,lastSync`, xoá `error`, gọi `cloud.onChange(hadName)`.
  - `cloud.pushSoon()`: nếu đã đăng nhập thì hẹn giờ `PUSH_DELAY=3000` ms (gom các lần gọi). Khi đến giờ: `get` → gộp → ghi local → `set`. Ngoài ra đẩy ngay khi `visibilitychange` sang `hidden`.
  - Mọi lỗi: ghi `error=true` vào `CLOUD_KEY`, lần `pushSoon` hoặc `pull` sau thử lại. Không `console.error` (e2e coi console error là hỏng); dùng `console.warn`.
  - `cloud.onChange(hadName)`: hook giao diện, mặc định không làm gì; Task 4 gán.
- Dữ liệu ghi lên mây: `S` bỏ `LOCAL_ONLY`, thêm `schema:1`, `deviceId`.

- [ ] **Step 1: Viết test hỏng** `tests/sync.test.js`, nạp core/merge/shop phụ thuộc cần thiết + `js/firebase-config.js` + `js/sync.js`. Dùng `pre` để đặt `window.CLOUD_ADAPTER` giả (Map lưu theo uid, đếm số lần `set`, có thể bật cờ lỗi) và `setTimeout` giả để điều khiển giờ:
```js
test('chưa từng đăng nhập thì không tải adapter', ...);           // init() khi CLOUD_KEY trống → loader không được gọi
test('mây trống thì đẩy dữ liệu máy lên', ...);
test('máy trống thì lấy mây, không đẩy dữ liệu trống', ...);    // S.name='' , mây {name:'Mai',stars:40} → S.name==='Mai', set chưa được gọi với name rỗng, onChange(false)
test('cả hai có dữ liệu thì gộp và ghi cả hai nơi', ...);       // sao cộng dồn qua earned khác deviceId
test('đổi tài khoản: huỷ thì đăng xuất, đồng ý thì thay bằng dữ liệu mới', ...); // confirm giả trả false/true
test('nhiều lần save gom một lần đẩy', ...);                      // 5 lần save() trong 1s → 1 lần set sau 3000ms
test('đẩy lỗi thì ghi trạng thái lỗi, lần sau thử lại được', ...);
test('cài đặt âm thanh không lên mây và không bị mây ghi đè', ...);
```
- [ ] **Step 2: Chạy** `npm test` → test mới FAIL.
- [ ] **Step 3: Viết `js/sync.js`, `js/firebase-config.js`, sửa `save()`, `index.html`.** `loadGame` hiện không có `confirm` hay `document.visibilityState`; thêm qua `pre`, không sửa `load.js` trừ khi cần.
- [ ] **Step 4: Chạy** `npm test` → tất cả PASS.
- [ ] **Step 5: Commit** `feat(sync): luồng kéo, gộp, đẩy tiến độ lên mây`

---

### Task 3: Adapter Firebase thật, rules và hướng dẫn cài đặt

**Files:**
- Modify: `js/sync.js` (adapter mặc định của `cloud.loadAdapter`)
- Create: `firestore.rules`, `docs/firebase-setup.md`
- Test: kiểm tra tay trên Chrome máy tính (bước 3)

**Interfaces:**
- Consumes: hợp đồng adapter ở Task 2; `FIREBASE_CONFIG`.
- Adapter thật:
  - `Promise.all` ba lệnh `import()` từ `https://www.gstatic.com/firebasejs/10.14.1/` cho `firebase-app.js`, `firebase-auth.js`, `firebase-firestore.js`.
  - Gọi `initializeApp(FIREBASE_CONFIG)`, `getAuth`, `getFirestore`.
  - `signIn`: `signInWithPopup(auth, new GoogleAuthProvider())`. Nếu lỗi `auth/popup-blocked`, `auth/operation-not-supported-in-this-environment` hoặc `auth/popup-closed-by-user` khi đang ở PWA standalone (`matchMedia('(display-mode: standalone)')`), thì chuyển sang `signInWithRedirect`. Lúc khởi tạo, gọi `getRedirectResult(auth)` và bỏ qua lỗi.
  - `get`/`set`: `getDoc`/`setDoc` trên `doc(db,'users',uid,'profiles','main')`; thêm `updatedAt: serverTimestamp()` khi `set`.
  - `onAuth`: `onAuthStateChanged`.

- [ ] **Step 1: Viết `firestore.rules`** đúng luật ở Global Constraints (`rules_version = '2'`, match `/users/{uid}/{document=**}`, mọi đường dẫn khác bị chặn).
- [ ] **Step 2: Viết adapter thật trong `js/sync.js`.**
- [ ] **Step 3: Viết `docs/firebase-setup.md`** bằng tiếng Việt, đúng 5 bước ở spec mục 7. Đường dẫn Authorized domain là `strongnguyen29.github.io`. Thêm vào hướng dẫn:
  - Mục "PWA trên iPhone/iPad là một máy riêng, cần đăng nhập riêng".
  - Mục tuỳ chọn "Nếu đăng nhập trên Safari không quay lại được", ghi cách tự host trang `/__/auth/` trên GitHub Pages rồi đổi `authDomain`.
  - **Danh sách kiểm tra trên thiết bị** cho phụ huynh tự chạy trên Safari iPad (tab và PWA) và Chrome Android: đăng nhập, chơi một màn, xoá dữ liệu web, đăng nhập lại và thấy đủ sao, máy thứ hai thấy tiến độ, tắt mạng vẫn chơi được.
- [ ] **Step 4: Kiểm tra tay.** Việc này chờ phụ huynh điền `js/firebase-config.js`. Nếu chưa có cấu hình thì ghi "chưa kiểm tra" vào báo cáo task, không được bỏ qua mà im lặng. Chạy `npx http-server`, hoặc `node -e` dùng `tests/e2e/serve.mjs`, ở `localhost`. Đăng nhập, chơi một màn, rồi xem document `users/<uid>/profiles/main` trên Firebase Console có `stars` và `earned`.
- [ ] **Step 5: Chạy** `npm test` → PASS (adapter thật không ảnh hưởng test).
- [ ] **Step 6: Commit** `feat(sync): adapter Firebase, rules và hướng dẫn cài đặt`

---

### Task 4: Giao diện Sao lưu, lối lấy lại ở màn nhập tên, nút Xoá dữ liệu, e2e

**Files:**
- Modify: `js/ui.js` (`settings()` dòng 27–46, `welcome()` dòng 16–26), `js/main.js` (gọi `cloud.init()` trước `splash`), `css/style.css` (khối `.cloudbox` nhỏ theo kiểu `.sw` sẵn có)
- Modify: `tests/e2e/smoke.mjs`
- Test: `tests/ui-sync.test.js` (node) và e2e

**Interfaces:**
- Consumes: `cloud.available`, `cloud.state()`, `cloud.signIn()`, `cloud.signOut()`, `cloud.pull()`, `cloud.onChange` (Task 2).
- Hành vi:
  - `settings()`: nếu `cloud.available`, thêm khối `☁️ Sao lưu` với ba trạng thái và đúng chữ trong Global Constraints. "Đồng bộ ngay" gọi `cloud.pull()`. Khối tự vẽ lại khi trạng thái đổi.
  - Nút `#rst`: khi đang đăng nhập thì dùng câu xác nhận mới, `cloud.signOut()`, rồi xoá local như cũ. Khi chưa đăng nhập thì giữ câu cũ.
  - `welcome()`: nếu `cloud.available`, thêm nút phụ (kiểu `btn p-gray small`) "Đã có tiến độ? Đăng nhập để lấy lại", bấm gọi `cloud.signIn()`.
  - `cloud.onChange=hadName=>{...}`:
    - Nếu `!hadName && S.name`: `touchStreak(); go(home)`.
    - Nếu đang ở trang chủ: `go(home)` để cập nhật số sao.
    - Nếu modal Cài đặt đang mở: vẽ lại khối Sao lưu.

- [ ] **Step 1: Viết test hỏng** `tests/ui-sync.test.js` (adapter giả như Task 2):
```js
test('FIREBASE_CONFIG null và không có adapter thì Cài đặt không có khối Sao lưu', ...);
test('Xoá dữ liệu khi đang đăng nhập: đăng xuất và câu hỏi nhắc bản sao lưu', ...);
test('màn nhập tên + đăng nhập lấy được dữ liệu thì chuyển thẳng trang chủ', ...);
```
- [ ] **Step 2: Chạy** `npm test` → FAIL.
- [ ] **Step 3: Sửa `js/ui.js`, `js/main.js`, `css/style.css`.**
- [ ] **Step 4: Chạy** `npm test` → PASS.
- [ ] **Step 5: Mở rộng `tests/e2e/smoke.mjs`:**
  - (a) Luồng hiện có, không đặt adapter: khẳng định **không có request** nào tới `gstatic.com` hay `googleapis.com` (dùng `pg.on('request')`).
  - (b) Bối cảnh mới: `addInitScript` đặt `window.CLOUD_ADAPTER` giả, đăng nhập sẵn, mây có `{name:'Mai',stars:40,...}`, localStorage trống. Bấm qua splash, rồi bấm "Đã có tiến độ? Đăng nhập để lấy lại". Khẳng định vào thẳng `.hgrid` và thanh trên có 40 ⭐. Chụp `…-09-settings-cloud`.
  - (c) Adapter giả có `get/set` luôn reject: chơi một màn, không có `pageerror` hay console error, Cài đặt hiện "Chưa sao lưu được, sẽ thử lại khi có mạng".
- [ ] **Step 6: Chạy** `npm run e2e` → không có lỗi nào trong `fails`. Xem ảnh `tests/e2e/shots/*settings-cloud*.png` ở 1024×768 và 360×740: không cuộn ngang, nút không bị Kuromi che.
- [ ] **Step 7: Commit** `feat(sync): mục Sao lưu trong Cài đặt và lối lấy lại tiến độ`
