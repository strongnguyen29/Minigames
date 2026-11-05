# Công chúa chăm ngoan: thiết kế

Ngày: 2026-11-05. Trạng thái: chờ chủ dự án duyệt.

## Ý định và lý do

"Vương Quốc Vui Vẻ" là game học cho bé nhà chủ dự án (5–8 tuổi, tiếng Việt). Bé đã kiếm sao bằng các trò toán và tiêu sao ở Tiệm công chúa, Tiệm âm thanh và để hỏi Kuromi. Chủ dự án muốn có thêm một phần chơi tên **"Công chúa chăm ngoan"**, gắn sao với các việc tốt ngoài đời: dậy đúng giờ, tự đánh răng, ăn hết cơm... Khi làm xong một việc, bé tự báo trong app. Bố mẹ chấm từ 1 đến 5 sao, và bé nhận đúng số sao đó.

Bé và bố mẹ dùng **chung một máy**. Vì vậy, khi chấm, bố mẹ phải trả lời đúng một **câu tính nhẩm** để mở khoá. Bé chưa giải được câu này, nên không tự chấm cho mình được.

## Mục tiêu

- Có danh sách **nhiệm vụ ngày**, **nhiệm vụ tuần** và **nhiệm vụ đột xuất** (cố định, xem bên dưới).
- Làm xong việc nào, bé bấm **"Con xong rồi!"**. Việc đó chuyển sang trạng thái *Chờ bố mẹ*.
- Bố mẹ bấm vào việc đang chờ và chọn 1–5 sao. Bố mẹ cũng có thể bấm **"Chưa được, con làm lại nhé"** để trả việc về cho bé, và bé không nhận sao.
- Bố mẹ phải giải đúng **câu khoá** thì mới chấm sao được. Một câu mở khoá cả lượt chấm (xem Luồng báo xong và chấm). Sao chấm xong được cộng vào sao chung của bé. Sao này tiêu ở Tiệm công chúa, Tiệm âm thanh và Kuromi như sao kiếm từ trò chơi.
- Mỗi **nhiệm vụ tuần được chấm 5 sao** cho bé thêm **1 hộp quà**. Mở hộp ra ngẫu nhiên một trong các phần thưởng: sticker, váy, nhạc, hoặc câu hỏi với Kuromi.
- Có thêm **bộ huy hiệu** riêng cho phần này.

## Không phải mục tiêu

- Bố mẹ **không** sửa, thêm hay xoá nhiệm vụ trong app. Danh sách được viết sẵn trong code.
- Không có thiết bị riêng cho bố mẹ, không có tài khoản bố mẹ, không gửi thông báo.
- Không chống gian lận chặt. Câu khoá chỉ cần đủ để bé 5–8 tuổi không vượt qua được.

## Điều không được xảy ra (anti-goals)

- Bé tự chấm sao được mà không cần bố mẹ.
- Việc bé đã báo xong bị mất khi sang ngày hoặc tuần mới, hoặc khi đồng bộ giữa các máy.
- Một lần chấm bị cộng sao hai lần, hoặc hộp quà bị nhân đôi.
- Phần thưởng nhận từ hộp quà (váy, bài hát) lại bị trừ vào số sao như hàng đã mua.

## Các quyết định của chủ dự án

### Danh sách nhiệm vụ

**Nhiệm vụ ngày** (chia theo buổi):

- 🌅 **Buổi sáng:** Dậy đúng giờ · Tự giác đánh răng, rửa mặt · Tự mặc đồ · Tự ăn sáng · Tự đeo cặp, đi giày dép · Chào ông bà, bố mẹ trước khi đi học · Đi học đúng giờ
- 🏫 **Ở trường:** Ở trường ngoan · Ăn hết phần ăn trưa
- 🏠 **Chiều tối:** Chào ông bà, bố mẹ khi đi học về · Tự cất cặp, giày dép đúng chỗ · Rửa tay trước khi ăn · Giúp bố mẹ việc nhỏ (dọn bát, lau bàn, nhặt rau) · Ăn hết cơm tối, ăn đủ rau thịt trong 30 phút · Học bài / đọc sách / tập viết · Dọn đồ chơi sau khi chơi
- 🌙 **Trước khi ngủ:** Đánh răng buổi tối · Tự soạn sách vở, quần áo cho ngày mai · Đi ngủ trước 10 giờ 15

Tổng cộng 19 việc. Biểu tượng cho từng việc do người xây chọn.

**Ngày đi học và ngày nghỉ:** các việc chỉ có khi đi học là *Đi học đúng giờ*, *Ở trường ngoan*, *Ăn hết phần ăn trưa*, *Chào ông bà, bố mẹ khi đi học về* và *Tự soạn sách vở, quần áo cho ngày mai*. Năm việc này **ẩn vào thứ Bảy và Chủ nhật**, nên ngày cuối tuần có 14 việc. Mọi điều kiện dựa trên "mọi việc trong ngày" hoặc "hết việc buổi sáng" (huy hiệu *Một ngày tuyệt vời*, *Chim sơn ca*) chỉ tính những việc có trong ngày đó. Nhờ vậy, chuỗi ngày tuyệt vời vẫn liên tục qua cuối tuần. Ngày lễ không xử lý riêng.

**Nhiệm vụ tuần:** Cả tuần không đi học muộn · Tự dọn góc học tập / kệ đồ chơi · Đọc xong 1 cuốn truyện · Học thuộc 1 bài thơ / bài hát

**Nhiệm vụ đột xuất** (không định kỳ): Đạt điểm 10 · Vượt qua 1 kỳ thi

### Luồng báo xong và chấm

1. Bé bấm "Con xong rồi!", và việc chuyển sang trạng thái *Chờ bố mẹ*.
2. Việc đã báo xong mà bố mẹ chưa chấm **vẫn đợi** qua ngày hoặc tuần mới, không bị bỏ.
3. Bố mẹ chấm **trên chính máy bé đang dùng**.
4. **Một câu khoá cho cả lượt chấm**, không phải mỗi việc một câu. Lần đầu bố mẹ bấm chấm một việc, app hỏi câu khoá trước. Giải đúng thì vào **chế độ bố mẹ**: chọn sao là ghi nhận ngay cho từng việc, chấm liền được nhiều việc mà không phải giải lại. Chế độ bố mẹ tự khoá lại khi rời màn Công chúa chăm ngoan, hoặc sau **5 phút** không bấm gì. Nút **"Chưa được"** không cần câu khoá, vì bé không nhận được gì.
5. Câu khoá là phép tính **hỗn hợp cộng, trừ, nhân, chia với các số trong phạm vi 10**, ví dụ `7 × 8 − 6`, `9 + 6 × 4`, `6 × 8 ÷ 4 + 3`. Mỗi câu có 2–3 số, mỗi số từ 1 đến 10, và luôn có ít nhất một phép nhân hoặc chia. Phép chia luôn ra số tròn, kết quả không âm, và nhân chia tính trước cộng trừ. Bố mẹ nhập đáp án bằng bàn phím số trên màn hình.

### Giao diện

Chủ dự án chọn bố cục **A, gồm ba thẻ: Hôm nay / Tuần này / Đột xuất** (bản phác lưu ở `.superpowers/brainstorm/…/content/task-screen.html`). Thẻ "Hôm nay" chia nhóm theo buổi như danh sách ở trên. Mỗi dòng có biểu tượng, tên việc và một nút/nhãn trạng thái ở bên phải:

- chưa làm: nút hồng **"Con xong rồi!"**
- đang chờ: nhãn vàng **"⏳ Chờ bố mẹ"**
- đã chấm: số sao đã nhận, ví dụ ⭐⭐⭐⭐

Thanh trên cùng có tên phần chơi và số sao hiện có, giống các tiệm.

Màn chấm (bản phác ở cùng file) có tên việc, dòng "Bố mẹ chấm cho con mấy sao?", 5 ngôi sao để chọn, nút "Chấm N sao" và nút "↩︎ Chưa được, con làm lại nhé". Nếu chế độ bố mẹ chưa mở, bấm "Chấm N sao" sẽ hiện màn **"🔒 Câu hỏi của bố mẹ"** trước. Màn này hiện phép tính, ô đáp án và bàn phím số 0–9, ⌫, ✓. Giải đúng thì ghi nhận việc vừa chấm và mở chế độ bố mẹ. Trong chế độ bố mẹ, nên có dấu hiệu dễ thấy (ví dụ biểu tượng 🔓 trên thanh trên cùng) và nút để khoá lại ngay.

### Hộp quà và huy hiệu

- Mỗi nhiệm vụ tuần **được chấm 5 sao** thì cho 1 hộp quà. Như vậy mỗi tuần có tối đa 4 hộp. Nhiệm vụ ngày và nhiệm vụ đột xuất chỉ cho sao.
- Hộp quà có thể ra: **sticker**, **váy**, **nhạc**, hoặc **câu hỏi với Kuromi**.
- Huy hiệu (chủ dự án đã duyệt danh sách):

| | Tên | Điều kiện |
|---|---|---|
| 🌷 | Công chúa nhỏ | Được bố mẹ chấm sao lần đầu |
| 💖 | Năm sao đầu tiên | Một nhiệm vụ được chấm 5 sao |
| 🎀 | Bé chăm làm | Hoàn thành 20 nhiệm vụ |
| 👸 | Công chúa chăm ngoan | Hoàn thành 100 nhiệm vụ |
| 💎 | Công chúa kim cương | Hoàn thành 300 nhiệm vụ |
| ☀️ | Một ngày tuyệt vời | Mọi nhiệm vụ ngày của một ngày đều được chấm sao |
| 🌈 | Ba ngày chăm ngoan | 3 "ngày tuyệt vời" liên tiếp |
| 🏰 | Tuần lễ công chúa | 7 "ngày tuyệt vời" liên tiếp |
| 🎁 | Hộp quà đầu tiên | Mở hộp quà chăm ngoan đầu tiên |
| 👑 | Tuần hoàn hảo | Cả 4 nhiệm vụ tuần đều được 5 sao trong cùng một tuần |
| 🌅 | Chim sơn ca | Hoàn thành hết nhiệm vụ buổi sáng 7 lần |
| 🌙 | Ngủ ngoan | "Đi ngủ trước 10 giờ 15" được chấm 10 lần |
| 🍚 | Bé ăn giỏi | "Ăn hết cơm tối, ăn đủ rau thịt trong 30 phút" được chấm 10 lần |
| 💯 | Điểm 10 đầu tiên | Đạt điểm 10 lần đầu |
| 📝 | Mưa điểm 10 | Đạt điểm 10 tổng cộng 10 lần |
| 🎓 | Vượt vũ môn | Vượt qua 1 kỳ thi |

"Hoàn thành" nghĩa là được bố mẹ chấm sao. Việc chỉ mới báo xong, hoặc bị "Chưa được", thì không tính.

## Các quyết định của mình (chủ dự án chưa nói rõ, cần duyệt)

- **Chu kỳ:** ngày mới bắt đầu lúc 0 giờ theo giờ máy (dùng `dayStr` như các phần khác). Tuần tính từ **thứ Hai đến Chủ nhật**. Mỗi việc ngày chỉ báo xong được 1 lần mỗi ngày, mỗi việc tuần 1 lần mỗi tuần. Việc đột xuất báo được nhiều lần, và mỗi lần là một mục riêng để chấm riêng.
- **Việc đang chờ từ hôm trước:** vẫn hiện để bố mẹ chấm. Sao được tính cho đúng ngày hoặc tuần bé đã báo, và việc đó của ngày mới vẫn mở bình thường để bé báo lại. Cách hiển thị (ví dụ một nhóm "Hôm qua còn chờ" ở đầu thẻ) do người xây chọn.
- **Ít nhất 1 sao.** Không có nút "từ chối". Với việc của chu kỳ hiện tại, "Chưa được" trả việc về trạng thái chưa làm, và bé báo lại được. Với việc còn chờ từ ngày hoặc tuần **đã qua**, "Chưa được" đóng luôn việc đó, không cho báo lại. Việc đột xuất bị "Chưa được" thì bị xoá khỏi danh sách chờ.
- **Chấm trùng trên hai máy:** nếu cùng một việc bị chấm trên hai máy trước khi kịp đồng bộ, sao có thể bị cộng hai lần. Nhà chủ dự án chấm trên một máy, nên trường hợp hiếm này được chấp nhận. Sao chăm ngoan cứ cộng thẳng vào `S.stars`. Trạng thái việc và hộp quà vẫn phải gộp đúng (xem phần Ràng buộc).
- **Trả lời sai câu khoá:** app báo sai nhẹ nhàng, đổi sang câu mới, chưa mở khoá. Bố mẹ có thể đóng màn chấm, và việc vẫn ở trạng thái chờ. Không giới hạn số lần thử.
- **Lối vào:** một thẻ mới trên trang chủ, "👸 Công chúa chăm ngoan", đặt cạnh các tiệm. Dòng phụ trên thẻ hiện số việc đang chờ chấm (ví dụ "⏳ 3"), để bố mẹ nhìn là biết.
- **Hộp quà chăm ngoan** là loại hộp riêng, không dùng chung bộ đếm `S.gifts` của hộp quà sau mỗi màn chơi, vì tỷ lệ và phần thưởng khác nhau. Hộp chưa mở được để dành. Hiệu ứng mở hộp dùng lại `openGift` hiện có (lớp phủ, hộp lắc, Kuromi).
- **Tỷ lệ phần thưởng (tạm đặt):** sticker 35%, câu hỏi Kuromi 25%, nhạc 20%, váy 20%.
  - Sticker: một hình dán bé chưa có.
  - Câu hỏi Kuromi: **+5 câu**, không hết hạn khi sang ngày mới. Khác với câu mua bằng sao, vốn chỉ dùng được trong ngày.
  - Nhạc: mở khoá một bài hát hoặc câu chuyện **có giá > 0** mà bé chưa có trong Tiệm âm thanh.
  - Váy: một bộ trong Tiệm công chúa mà bé chưa có.
  - Nếu loại được chọn đã hết món, quay lại chọn trong các loại còn món. Nếu bé đã có hết mọi thứ thì cho **+5 ⭐**.
- **Giọng Kuromi:** thêm câu thoại cho các khoảnh khắc chính: vào phần chơi, bé báo xong ("Giỏi quá, chờ bố mẹ chấm nha!"), nhận sao, nhận hộp quà, bị "chưa được". Các câu này ghi vào `audio/voice/script.md`. Khi chưa có file thu thì dùng giọng máy như các câu khác.
- Sau khi chấm thành công: hiện số sao bay vào, có pháo giấy (`confetti`), và hiện huy hiệu mới nếu có. Màn kết quả màn chơi đã làm tương tự.

## Ràng buộc và điểm cần lưu ý từ code hiện có

- Game là web tĩnh nhiều file JS (không có bundler), nạp bằng thẻ `<script>` trong `index.html`. Trạng thái nằm trong `S` (`js/core.js`: `DEF`, `freshSave()`, `load()`, `save()`). Thêm trường mới thì phải thêm vào cả ba chỗ đó, và `load()` phải tự bù trường cho bản lưu cũ.
- **Đồng bộ cloud** (`js/sync.js`, `js/merge.js`): `mergeSave` gộp dữ liệu hai máy. Phần dữ liệu nhiệm vụ cần luật gộp riêng, đáp ứng các yêu cầu sau:
  - Một việc đã chấm hoặc đã đóng ở một bên thì thắng trạng thái chờ hoặc chưa làm ở bên kia.
  - Một máy gộp lại dữ liệu từ máy khác thì không được cộng lại sao, trừ trường hợp chấm trùng đã chấp nhận ở trên.
  - Việc đang chờ không bị mất.
  - Số hộp quà chăm ngoan chưa mở không bị nhân đôi, giống cách gộp `gifts` theo `base`.
  - Bộ đếm cho huy hiệu không bị nhân đôi.

  Sao chăm ngoan cộng vào `S.stars`, nên tự động đi qua cơ chế `earned` theo từng máy. Cách lưu cụ thể do người xây quyết, nhưng phải có test trong `tests/merge.test.js`.
- **Kích thước bản lưu:** mỗi ngày phát sinh khoảng 20 bản ghi. Không giữ lịch sử vô hạn. Chỉ cần giữ các chu kỳ còn liên quan: ngày và tuần hiện tại, những việc còn chờ, và đủ ngày gần đây để tính chuỗi "ngày tuyệt vời". Các con số mà huy hiệu cần (tổng việc đã chấm, số lần điểm 10...) phải giữ bằng bộ đếm riêng, không mất khi dọn lịch sử.
- **Số dư sao:** `balance()` (`js/shop.js`) bằng `S.stars` trừ `S.spent`, `radioSpent()` và `talkSpent()`.
  - Váy nhận từ hộp phải được thêm vào cả `S.owned` và `S.giftOwned`, như `openGift` đang làm, để không bị tính vào `spent`.
  - Bài hát nhận từ hộp: hiện `radioSpent()` cộng giá của **mọi** bài trong `S.songs`. Vì vậy cần một danh sách bài được tặng (tương tự `giftOwned`) mà `radioSpent()` bỏ qua, và `mergeSave` phải gộp danh sách đó bằng hợp.
- **Câu hỏi Kuromi:** `S.talk` (`js/chat.js`) là dữ liệu chỉ của từng máy (`LOCAL_ONLY` trong `merge.js`), và `paid` bị xoá về 0 mỗi ngày. Câu được tặng cần một chỗ lưu không bị xoá theo ngày. `talkLeft()` và `talkUse()` phải tính phần này, và nên trừ câu tặng trước câu đã mua. Câu tặng có đồng bộ qua máy hay không là quyết định của người xây.
- **Huy hiệu:** thêm vào mảng `BADGES` trong `js/rewards.js`. Màn Bộ sưu tập đã hiện tất cả huy hiệu. `checkBadges()` cần được gọi sau mỗi lần chấm và mỗi lần mở hộp.
- **Điều hướng:** dùng `go(fn)` và `screenHTML({...})` như các màn khác. Trang chủ được dựng trong `home()` (`js/ui.js`).
- Thiết bị chính là iPhone Safari và tablet Android Chrome, chạy dạng PWA. Bàn phím số tự vẽ trên màn hình, không dùng bàn phím hệ thống, để bé không thấy đáp án gợi ý và cũng để dễ bấm.

## Để người xây quyết

- Chia file/module (ví dụ `js/chores.js`), tên hàm, cách lưu dữ liệu nhiệm vụ trong `S`.
- Biểu tượng từng nhiệm vụ, màu sắc, hiệu ứng và chi tiết hình ảnh, theo phong cách các tiệm hiện có.
- Thuật toán sinh câu khoá, miễn là đúng các ràng buộc ở trên.
- Cách hiện việc còn chờ từ chu kỳ trước.
- Kiểm thử theo cách repo đang làm (`node --test`, thư mục `tests/`). Tối thiểu phải có test cho: sinh câu khoá, chế độ bố mẹ tự khoá lại, chuyển trạng thái nhiệm vụ, sang ngày/tuần, ẩn việc đi học vào cuối tuần, hộp quà không trừ sao, và gộp dữ liệu giữa hai máy.
