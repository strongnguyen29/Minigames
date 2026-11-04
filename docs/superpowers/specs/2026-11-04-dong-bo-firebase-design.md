# Thiết kế: Sao lưu và đồng bộ tiến độ chơi qua Firebase

Ngày: 2026-11-04 · Áp dụng cho repo hiện tại (`index.html`, `js/*.js`), game chạy ở `https://strongnguyen29.github.io/Minigames`.

## 1. Mục đích và lý do

Toàn bộ tiến độ của bé (sao, hình dán, huy hiệu, váy đã có, kỷ lục từng mức, tên, avatar...) hiện chỉ nằm trong `localStorage` (khoá `be_vui_hoc_toan_v1`, xem `js/core.js`). Phụ huynh đã gặp chuyện thật: **xoá dữ liệu trình duyệt là bé mất sạch tiến độ.**

Phụ huynh muốn hai điều:
1. **Không bao giờ mất tiến độ nữa**, kể cả khi xoá dữ liệu web.
2. **Chơi tiếp được trên thiết bị khác** (vd từ iPad sang điện thoại).

Phụ huynh sẽ là người đăng nhập giúp bé.

Lúc đầu phụ huynh nghĩ tới Google Drive. Ta đã cân nhắc và chọn **Firebase** (Auth + Firestore) thay thế. Lý do: game là web tĩnh, không có server. Nếu gọi Drive trực tiếp từ trình duyệt, quyền truy cập chỉ sống khoảng 1 giờ, sau đó phải chạm và mở cửa sổ Google để xin lại. Firebase Auth thì nhớ đăng nhập lâu dài, nên game tự đồng bộ được mà không làm phiền. Phụ huynh đã đồng ý.

## 2. Mục tiêu, không làm, và những điều cần tránh

**Mục tiêu**
- Phụ huynh đăng nhập bằng tài khoản Google **một lần trên mỗi thiết bị**. Từ đó tiến độ tự đẩy lên mây, không cần bấm gì thêm.
- Trên thiết bị mới, hoặc sau khi xoá dữ liệu web, chỉ cần đăng nhập lại là tiến độ quay về.
- Hai thiết bị cùng chơi (kể cả lúc không có mạng) thì khi đồng bộ sẽ **gộp lại**, và bé không mất thứ gì đã đạt được.

**Không làm (lần này)**
- **Nhiều hồ sơ / nhiều bé.** Sau này sẽ có thêm bé, mỗi bé một hồ sơ. Lần này chưa làm màn "Ai đang chơi?". Tuy vậy, **dữ liệu trên mây phải lưu sẵn theo dạng nhiều hồ sơ** (mục 5), để sau này thêm bé thì không phải chuyển dữ liệu.
- Không có cách đăng nhập nào khác ngoài Google.
- Không xoá dữ liệu trên mây từ trong game.
- Không đổi luật chơi, giao diện các màn khác, hay cấu trúc dữ liệu hiện có. Chỉ được **thêm** trường mới.

**Cần tránh (dù chạy được vẫn coi là hỏng)**
- **Mất tiến độ của bé** ở bất kỳ tình huống nào: lần đầu đăng nhập trên máy đã có tiến độ, máy mới đăng nhập ghi đè dữ liệu trên mây bằng dữ liệu trống, hai máy ghi chồng lên nhau, mất mạng giữa chừng.
- Game bị chậm, treo, hoặc không chơi được khi **không có mạng** hoặc **chưa đăng nhập**. Người chưa đăng nhập phải chơi y như bây giờ.
- Bé thấy thông báo lỗi kỹ thuật, hoặc bị bật cửa sổ đăng nhập trong lúc chơi.
- Âm thanh, giọng Kuromi hay hiệu ứng bị giật vì đồng bộ chạy cùng lúc.

## 3. Ràng buộc

- Giữ cấu trúc hiện có: HTML, CSS, JS thuần, nhiều file, không framework, không bước build. Chạy trên GitHub Pages.
- Spec trước (`2026-11-03-vuong-quoc-vui-ve-redesign-design.md`) ghi "không gọi mạng lúc chạy" và "không thêm tài khoản hay đồng bộ qua mạng". **Tài liệu này thay thế hai điều đó, nhưng chỉ cho phần đồng bộ.** Firebase SDK được tải từ CDN chính thức của Google (`www.gstatic.com/firebasejs/...`, ghim phiên bản cụ thể).
  - *Lựa chọn của mình:* chỉ tải SDK khi cần, tức là khi phụ huynh bấm đăng nhập, hoặc khi máy đã từng đăng nhập (lưu một cờ nhỏ trong `localStorage`). Người chưa từng đăng nhập sẽ không phát sinh lần gọi mạng nào. SDK tải hỏng (mất mạng) thì game im lặng chơi tiếp.
- `localStorage` vẫn là nơi lưu chính, và game luôn đọc/ghi ở đó như bây giờ. Mây chỉ là bản sao lưu và đồng bộ.
- Thông tin cấu hình Firebase (apiKey, projectId...) là công khai và được phép commit. An toàn dựa vào Security Rules (mục 5).
- Thiết bị chính là **tablet cầm ngang** (iPad và Android), có thể mở trong trình duyệt hoặc ở chế độ "Thêm vào màn hình chính" (PWA, `display: standalone`).

## 4. Trải nghiệm

### 4.1 Nơi đặt: màn Cài đặt
Thêm một mục **"☁️ Sao lưu"** vào modal Cài đặt (`js/ui.js`, cạnh các nút "Đổi tên / hình" và "Xoá dữ liệu"). Bé không cần thấy chỗ này. Ngoài Cài đặt, game không hiện gì về đồng bộ.

Mục này có ba trạng thái:
- **Chưa đăng nhập:** nút "Đăng nhập Google để sao lưu" và một dòng nhỏ: "Giữ sao và quà của bé, chơi tiếp trên máy khác".
- **Đã đăng nhập:** email đang dùng, thời điểm sao lưu gần nhất ("Đã sao lưu lúc 14:32"), nút "Đồng bộ ngay" và nút "Đăng xuất".
- **Đang lỗi hoặc mất mạng:** dòng chữ nhẹ nhàng, vd "Chưa sao lưu được, sẽ thử lại khi có mạng". Không dùng `alert`.

### 4.2 Lần đầu đăng nhập trên một thiết bị
1. Phụ huynh bấm nút, cửa sổ Google hiện ra, phụ huynh chọn tài khoản.
2. Game đọc hồ sơ trên mây:
   - **Trên mây chưa có gì:** đẩy dữ liệu của máy này lên.
   - **Máy này chưa có tiến độ** (chưa đặt tên, tức đang ở màn nhập tên hoặc vừa xoá dữ liệu): lấy nguyên dữ liệu trên mây về, rồi chuyển thẳng tới trang chủ, không bắt nhập tên lại.
   - **Cả hai đều có:** gộp lại theo mục 6, lưu kết quả ở cả hai nơi.
3. Màn hiện tại vẽ lại để thấy số sao và quà mới.

Vì máy vừa xoá dữ liệu sẽ mở vào màn nhập tên, màn nhập tên (welcome) cần thêm một lối nhỏ cho phụ huynh: **"Đã có tiến độ? Đăng nhập để lấy lại"**. Lối này mở đúng luồng đăng nhập ở trên.

### 4.3 Khi đang chơi
- Mỗi lần `save()` chạy, game đặt lịch đẩy lên mây sau vài giây. Gộp nhiều lần lưu sát nhau thành một lần đẩy. Ngoài ra, game đẩy ngay khi ứng dụng bị ẩn hoặc chuyển tab (`visibilitychange`).
- Mỗi lần mở game (đã đăng nhập, có mạng), game kéo dữ liệu trên mây về và gộp một lần.
- Mọi việc chạy nền. Lỗi chỉ ghi lại để hiện trong Cài đặt, rồi thử lại lần sau.

### 4.4 Đăng nhập bằng tài khoản Google khác
Máy lưu lại `uid` của tài khoản đồng bộ gần nhất. Nếu lần sau đăng nhập bằng một tài khoản khác, mà máy đang có tiến độ, game **không tự gộp**. Thay vào đó, game hỏi phụ huynh: "Máy này đang có tiến độ của tài khoản khác. Dùng dữ liệu của tài khoản mới (tiến độ trên máy sẽ được thay)?"
- **Đồng ý:** lấy dữ liệu trên mây của tài khoản mới về. Nếu tài khoản mới chưa có gì trên mây thì đẩy tiến độ của máy lên.
- **Huỷ:** đăng xuất, giữ nguyên máy.

Tiến độ cũ không mất, vì nó vẫn nằm trên mây của tài khoản cũ. *(Lựa chọn của mình: tránh trộn lẫn tiến độ của hai bé, việc rất khó gỡ.)*

### 4.5 Đăng xuất và "Xoá dữ liệu"
- **Đăng xuất:** máy này dừng đồng bộ. Dữ liệu trên máy và trên mây giữ nguyên.
- **"Xoá dữ liệu"** khi đang đăng nhập: xoá dữ liệu trên máy **và đăng xuất**. Dữ liệu trên mây giữ nguyên làm bản sao lưu, đăng nhập lại là có lại. Câu hỏi xác nhận đổi thành: "Xoá tiến độ trên máy này? (Bản sao lưu trên mây vẫn còn)". *(Lựa chọn của mình: nhờ vậy nút này không bao giờ làm mất tiến độ thật.)*

## 5. Lưu trữ trên Firebase

- **Đăng nhập:** Firebase Auth, nhà cung cấp Google. Phiên đăng nhập được nhớ lâu dài (persistence mặc định của trình duyệt).
- **Dữ liệu:** Cloud Firestore, đường dẫn `users/{uid}/profiles/{profileId}`.
  - Lần này chỉ có một hồ sơ, `profileId = "main"`.
  - Mỗi document gồm toàn bộ object `S` (trừ các cài đặt thuộc riêng từng máy, xem mục 6), cộng thêm `updatedAt` (thời gian máy chủ), `schema: 1` và `deviceId` của máy ghi gần nhất.
- **Security Rules:** chỉ người dùng đã đăng nhập, có `uid` trùng với `{uid}`, mới được đọc và ghi `users/{uid}/**`. Mọi đường dẫn khác bị từ chối.
- Gói miễn phí (Spark) là đủ. Mỗi lần đẩy chỉ ghi một document nhỏ.

## 6. Quy tắc gộp

Hàm gộp là **hàm thuần** `merge(local, remote) → kết quả`, có test đơn vị (`node --test`, theo kiểu `tests/storage.test.js`). Nguyên tắc chung: **khi nghi ngờ thì nghiêng về phía bé được giữ nhiều hơn.** Bé dư một hộp quà thì chấp nhận được, mất hình dán thì không.

**Bộ đếm cộng dồn theo từng máy.** `stars` là tổng số sao bé từng kiếm được (số dư = `stars - spent`, xem `js/shop.js`). Nếu iPad kiếm 10 sao và điện thoại kiếm 8 sao trong lúc cả hai mất mạng, bé phải có 18 sao, chứ không phải 10. Vì vậy `stars`, `rounds`, `perfect` được lưu thêm dạng **bộ đếm theo máy**, vd `earned: { [deviceId]: { stars, rounds, perfect } }`:
- Mỗi máy chỉ tăng phần của chính mình. Gộp hai bên thì lấy giá trị lớn hơn **cho từng máy**.
- `S.stars`, `S.rounds`, `S.perfect` bằng tổng các máy. Phần code còn lại vẫn đọc ba trường này như cũ.
- Lần đầu chuyển sang cách lưu mới, số hiện có của máy được gán cho `deviceId` của máy đó. Như vậy phải có `deviceId` trước lần đồng bộ đầu tiên.
- `+3 ⭐` khi mở quà lúc đã đủ hình dán (`js/ui.js`) cũng tính vào phần của máy đang chơi.

*(Lựa chọn của mình, theo đúng điều phụ huynh nhấn mạnh là bé không mất gì đã đạt được.)*

| Trường | Cách gộp |
|---|---|
| `stars`, `rounds`, `perfect` | tổng các bộ đếm theo máy (như trên) |
| `best` | theo từng khoá, lấy số sao lớn hơn |
| `stickers`, `badges`, `owned`, `giftOwned` | hợp hai tập, không trùng lặp |
| `spent` | tính lại từ `owned` sau khi gộp, giống logic có sẵn ở `js/shop.js` (khoảng dòng 57–60) |
| `gifts`, `luckyGifts` (hộp quà chưa mở) | lấy bên có nhiều hơn |
| `streak`, `lastDay` | lấy cặp của bên có `lastDay` mới hơn; bằng nhau thì lấy `streak` lớn hơn |
| `name`, `avatar` | lấy bên được sửa gần nhất (cần thêm trường mốc thời gian, vd `profileUpdatedAt`) |
| `sound`, `voice`, `sfx`, `music` | **không đồng bộ**, mỗi máy giữ cài đặt riêng |

Trường nào lạ hoặc được thêm sau này mà bảng trên chưa nhắc thì lấy theo bên mới hơn (`updatedAt`). Builder kiểm tra lại từng trường trong `DEF` (`js/core.js`) xem đã được bảng phủ hết chưa.

## 7. Cài đặt một lần (dành cho phụ huynh)

Viết kèm file `docs/firebase-setup.md` bằng tiếng Việt, hướng dẫn từng bước:
1. Tạo dự án Firebase, thêm Web app, lấy đoạn cấu hình.
2. Bật Authentication và nhà cung cấp Google.
3. Thêm `strongnguyen29.github.io` vào Authorized domains (`localhost` đã có sẵn, dùng khi chạy thử).
4. Tạo Firestore và dán Security Rules ở mục 5.
5. Dán cấu hình vào file cấu hình của game (vd `js/firebase-config.js`).

Nếu file cấu hình chưa điền, mục "☁️ Sao lưu" sẽ ẩn đi và game chạy như bây giờ.

## 8. Rủi ro cần builder kiểm chứng

- **Đăng nhập bằng popup trên iPad và ở chế độ PWA standalone.** Popup có thể bị chặn hoặc không quay về được. Còn redirect thì trên một số trình duyệt có thể hỏng khi `authDomain` (`*.firebaseapp.com`) khác tên miền của game, do trình duyệt chặn lưu trữ bên thứ ba. Builder thử thật trên Safari iPad (cả tab thường lẫn PWA) và Chrome Android, rồi chọn cách chạy được, có thể là popup kèm redirect dự phòng. Phải ghi lại kết quả thử.
- **Ai thử, thử ở đâu** *(lựa chọn của mình)*:
  - Phụ huynh tạo dự án Firebase theo `docs/firebase-setup.md` **trước khi** builder làm phần đăng nhập, rồi điền `js/firebase-config.js`.
  - Builder làm mặc định là popup, có redirect dự phòng, và thử trên Chrome máy tính (`localhost` và bản GitHub Pages).
  - Builder viết sẵn một danh sách việc cần kiểm tra trên iPad (Safari và PWA) và Android. Phụ huynh tự chạy danh sách đó.
  - Nếu redirect hỏng trên Safari, cách sửa dự phòng là đặt các trang hỗ trợ đăng nhập của Firebase ngay trên `strongnguyen29.github.io` và trỏ `authDomain` vào đó. Ghi cách này vào hướng dẫn như một bước tuỳ chọn.
- **Bộ nhớ của PWA trên iOS tách riêng với Safari.** Mở game bằng icon trên màn hình chính là một "máy" riêng, cần đăng nhập riêng. Điều này chấp nhận được, chỉ cần ghi vào hướng dẫn.

## 9. Để builder tự quyết

- Tách code thành file nào (vd `js/sync.js`), dùng Firebase bản modular hay compat, khoảng chờ trước khi đẩy là bao nhiêu giây.
- Cách sinh `deviceId`, kiểu hiển thị thời gian sao lưu.
- Cách giả lập Firebase trong test e2e (`tests/e2e/smoke.mjs`). Tối thiểu cần test: chơi khi chưa đăng nhập vẫn như cũ, và game không lỗi khi SDK không tải được.
- Giao diện cụ thể của mục "☁️ Sao lưu", theo đúng phong cách nút kẹo dẻo hiện có trong Cài đặt.
