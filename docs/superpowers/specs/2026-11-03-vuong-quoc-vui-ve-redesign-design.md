# Thiết kế: "Vương Quốc Vui Vẻ": giao diện chibi 3D fantasy, mascot Kuromi và giọng nói

Ngày: 2026-11-03 · Áp dụng cho repo hiện tại (`index.html`, `css/style.css`, `js/*.js`).
Bản phác đã được duyệt nằm ở `.superpowers/brainstorm/44358-1793703712/content/`. Đây là mốc hình ảnh và chuyển động; khi mâu thuẫn với tài liệu này thì tài liệu thắng.
- `E-home-game.html`: trang chủ và màn chơi
- `splash-v5.html`: màn mở đầu (dùng kiểu **B**)
- `other-screens.html`: chọn mức, kết quả, mở quà
- `remaining-screens.html`: bộ sưu tập, tiệm, caro, nhập tên, cài đặt

## 1. Mục đích và lý do

App hiện là "Bé Vui Học Toán", một minigame toán cho bé lớp 1. Giao diện hiện tại khá phẳng và chưa có nhân vật đồng hành. Phụ huynh muốn:
- Làm lại toàn bộ giao diện theo phong cách **chibi Kuromi dễ thương pha 3D fantasy**.
- Có **mascot Kuromi** dẫn dắt bé trên mọi màn, với giọng nói dễ thương. Mascot đọc cả đề bài, để bé ít phải tự đọc chữ.
- Đổi tên app thành **"Vương Quốc Vui Vẻ"**, vì sau này app không chỉ có môn Toán.

Bé chơi chủ yếu trên **tablet cầm ngang**.

## 2. Mục tiêu, không làm, và những điều cần tránh

**Mục tiêu**
- Mọi màn (mở đầu, trang chủ, chọn mức, màn chơi, kết quả, mở quà, bộ sưu tập, tiệm công chúa, cờ caro, nhập tên, cài đặt) theo cùng phong cách mới.
- Kuromi xuất hiện trên mọi màn, có 4 cảm xúc gắn với đúng thời điểm (mục 5).
- Giọng Kuromi đọc mọi đề bài và các câu dẫn dắt, dùng file âm thanh do phụ huynh tạo bằng ElevenLabs.
- Chuyển động sinh động nhưng không làm rối khi bé đang làm bài.

**Không làm**
- Không đổi luật chơi, cách sinh câu hỏi, cách tính sao, điều kiện mở khoá, huy hiệu hay giá váy.
- Không thêm trò hay môn học mới. Tên mới chỉ để dành chỗ cho sau này.
- Không thêm tài khoản hay đồng bộ qua mạng.

**Cần tránh (dù chạy được vẫn coi là hỏng)**
- **Mất tiến độ của bé.** Giữ nguyên khoá `localStorage` `be_vui_hoc_toan_v1` và mọi trường dữ liệu. Chỉ được thêm trường mới.
- Chữ hoặc nút quá nhỏ trên tablet, hoặc bị chuyển động che hay làm lệch khi bé đang bấm.
- Giật hoặc lag trên tablet tầm trung vì hiệu ứng nặng.
- Game im lặng hoặc báo lỗi khi thiếu file âm thanh. Khi thiếu file, game phải chuyển sang giọng máy (mục 6.4).
- Kuromi nói chồng lên nhau, hoặc nói lại câu cũ khi đã sang màn khác.

## 3. Ràng buộc

- Giữ cấu trúc hiện có: HTML, CSS và JS thuần, nhiều file như bây giờ, không framework và không bước build. Chạy được trên GitHub Pages và khi mở file trực tiếp.
- Không gọi mạng lúc chạy, không dùng font ngoài. Ảnh và âm thanh là file tĩnh trong repo.
- **Tablet ngang là ưu tiên số 1.** Thiết kế theo tỉ lệ 4:3 (iPad 1024×768 đến 1366×1024), và cũng phải ổn ở 16:10 (tablet Android).
  - Kích thước co giãn theo khung màn hình, như bản phác dùng `cqw`; builder chọn cách làm cụ thể.
  - Màn dọc hoặc điện thoại 360px chỉ cần **chơi được, không vỡ, không cuộn ngang**: Kuromi thu nhỏ lên trên, nội dung xếp xuống dưới.
- Nút đáp án vẫn phải to và dễ bấm bằng ngón tay (spec cũ yêu cầu tối thiểu 80px). Trong bản phác, nút đáp án cao khoảng 13% chiều rộng khung.
- Trình duyệt trên tablet chặn âm thanh cho tới lần chạm đầu tiên. Nút ở màn mở đầu dùng chính lần chạm đó để mở khoá âm thanh (mục 4.1).
- Kuromi là nhân vật có bản quyền của Sanrio. App chỉ dùng trong gia đình. Tên nhân vật hiển thị là **"Kuromi"**.

## 4. Phong cách hình ảnh (bản E · "Vương quốc mây kẹo")

### 4.1 Nền tảng chung
- **Cảnh nền**: bầu trời pastel chuyển màu từ trên xuống (`#bfe0ff` → `#e7d4ff` → `#ffd9ec`), mây trắng phồng trôi chậm, sao vàng lấp lánh, bóng lâu đài tím nhạt ở phía xa. Cảnh nền vẽ bằng CSS như bản phác *(lựa chọn của mình: nhẹ và chạy được khi không có mạng; sau này có thể thay bằng ảnh AI)*.
- **Màu chữ chính**: `#3a2350`.
- **Nút kẹo dẻo 3D**: tô chuyển màu từ trên xuống, có vệt bóng trắng ở nửa trên, viền đậm bên trong ở đáy và một lớp bóng đổ đặc phía dưới (xem các lớp `.p1/.p2/.p3/.p4/.pg/.pw/.pgray` trong bản phác). Các tông màu:
  - tím `#c79bff→#8a4fe0`
  - hồng `#ffa6d2→#f0609f`
  - xanh `#9fe3ff→#4aa8f0`
  - đen tím `#5d5370→#2c2238`
  - xanh lá (đúng hoặc tiếp tục) `#b7f5c9→#36c76b`
  - trắng tím `#fff→#f3e9ff`
  - xám (bị khoá)
- **Khung và thẻ**: trắng chuyển sang tím rất nhạt, bo góc lớn, bóng đổ tím `#cdb5ef`.
- **Ô số sao và hộp quà**: kiểu đồng tiền vàng (`#fff3b0→#ffc93c`).
- **Icon trò chơi** vẫn là emoji như hiện tại, nhưng to: khoảng 7% chiều rộng khung ở trang chủ.

### 4.2 Bộ chuyển động (dùng chung mọi màn)
- **Khi vào màn**: các nút và thẻ bật nảy hiện ra lần lượt, trễ dần khoảng 50ms mỗi cái. Bong bóng lời nói phồng lên.
- **Lúc đứng yên**:
  - Kuromi nhún nhẹ như đang thở, bục dưới chân phát sáng nhịp nhàng.
  - Mây trôi, sao lấp lánh.
  - Nút và ô ⭐/🎁 bồng bềnh nhẹ, lệch pha nhau.
- **Khi chạm**:
  - Nút nảy kiểu thạch. Rê chuột vào nút thì icon lắc lư.
  - Đáp án đúng: nút chuyển xanh và nảy. Đáp án sai: nút chuyển đỏ, rung, rồi mờ đi và không bấm được nữa.
- **Khi có thưởng**: pháo giấy màu rơi, tim, sao và lấp lánh bay lên từ chỗ Kuromi đứng, tia sáng xoay phía sau (ở màn kết quả, mở quà và màn mở đầu).
- **Trong lúc bé làm bài**: chuyển động lúc đứng yên phải nhẹ. Thẻ đề và nút đáp án không được trôi làm lệch chỗ bấm. Bản phác cho nút đáp án đứng yên, chỉ nút 🔊 bồng bềnh.
- *(Lựa chọn của mình)* Tôn trọng cài đặt `prefers-reduced-motion`: khi bật thì tắt các chuyển động lặp lại.

## 5. Mascot Kuromi

### 5.1 Ảnh
Có sẵn trong `images/mascot/`, đều là PNG nền trong suốt:

| Cảm xúc | File |
|---|---|
| Trung tính | `kuromi_girl_style_ref.png` (683×1024) |
| Vui sướng | `kuromi_exact_vui.png` (1280×1952) |
| Suy nghĩ | `kuromi_exact_thinking.png` |
| Vỗ tay | `kuromi_exact_clap.png` |

Mỗi file nặng 1–2,3MB. *(Để builder quyết định)* Nên thu nhỏ hoặc chuyển sang WebP và tải trước cả 4 ảnh trong màn mở đầu, để khi đổi cảm xúc không bị nháy trắng.

### 5.2 Khi nào dùng cảm xúc nào
- **Trung tính**: trang chủ, chọn mức, lúc đang làm bài (mặc định), nhập tên, cài đặt, tiệm công chúa, cờ caro (khi đang chơi).
- **Suy nghĩ**:
  - khi bé chọn sai, và khi gợi ý;
  - khi bấm vào mức bị khoá;
  - khi bấm mua váy mà chưa đủ sao;
  - kết quả 1 sao *(lựa chọn của mình: động viên chơi lại)*.
- **Vỗ tay**:
  - khi trả lời đúng;
  - kết thúc màn với 2 hoặc 3 sao;
  - khi đạt huy hiệu mới;
  - khi có người thắng ván caro.
- **Vui sướng**:
  - màn mở đầu (Kuromi nhảy ra khỏi hộp quà);
  - mở quà, nhận hình dán;
  - mua được váy;
  - màn Bộ sưu tập.

Mỗi cảm xúc có chuyển động riêng: Suy nghĩ thì nghiêng đầu, Vỗ tay thì nhún nhảy, Vui sướng thì nhảy cao, Trung tính thì nhún nhẹ. Cảm xúc phản ứng (Suy nghĩ hoặc Vỗ tay trong màn chơi, tiệm, chọn mức) tự quay về Trung tính sau khoảng 2,6 giây, hoặc khi sang câu mới. Trên màn kết quả và màn mở quà, Kuromi giữ nguyên cảm xúc.

### 5.3 Vị trí
- Cột trái, chiếm khoảng 24–30% chiều rộng, đứng trên bục phát sáng. Bong bóng lời nói nằm phía trên đầu.
- Ở Tiệm công chúa, Kuromi đứng nhỏ ở góc dưới bên trái, vì giữa màn đã có sân khấu với nhân vật mặc váy.
- Ở Cài đặt, Kuromi đứng nhỏ ở góc bảng.
- Bấm vào Kuromi thì tim và lấp lánh bay lên, và Kuromi nói một câu ngẫu nhiên (thuộc nhóm `poke`).
- Bong bóng luôn hiện chữ của câu đang nói. Nếu chưa có âm thanh thì bé vẫn đọc được chữ.

## 6. Giọng nói

### 6.1 Cách làm
Phụ huynh tạo giọng bằng **ElevenLabs**. Builder **viết sẵn** 2 thứ, để phụ huynh chỉ việc dán vào và tải về:
1. **Prompt mô tả giọng** cho ElevenLabs Voice Design. Nội dung: giọng bé gái chibi khoảng 7–8 tuổi, nói tiếng Việt giọng miền Bắc, trong trẻo, hơi tinh nghịch, ngọt ngào, nói chậm và rõ cho trẻ 6–7 tuổi, nhiều cảm xúc. **Không** ghi "giọng giống diễn viên lồng tiếng Kuromi". Kèm cài đặt gợi ý: model đa ngôn ngữ có hỗ trợ tiếng Việt, độ ổn định vừa phải, và **dùng một giọng duy nhất cho mọi file** để các mẩu ghép nghe liền mạch.
2. **Danh sách lời thoại** ở dạng dễ dán và dễ đọc lại (ví dụ CSV hoặc JSON, kèm bản Markdown để đọc). Mỗi dòng gồm: tên file, câu nói, nhóm hoặc điểm chạm, cảm xúc hay giọng điệu (để phụ huynh chọn cách đọc), và ghi chú cách đọc nếu cần.

File âm thanh đặt ở `audio/voice/<tên>.mp3`. Builder chọn quy ước đặt tên (ví dụ `praise_03.mp3`, `num_17.mp3`).

### 6.2 Câu cố định theo điểm chạm
Mỗi điểm chạm có **3–5 câu khác nhau**, chọn ngẫu nhiên và không lặp lại câu vừa nói. Câu gọi bé là "bé" hoặc "bạn nhỏ", **không đọc tên bé** (vì tên do bé tự nhập). Bong bóng chữ có thể chèn tên bé.

Các điểm chạm tối thiểu:
- Màn mở đầu và chào khi vào trang chủ.
- Giới thiệu khi vào chọn mức của từng trò (một nhóm câu cho mỗi trò).
- Bắt đầu màn chơi.
- Trả lời đúng, và đúng liên tiếp (combo 3 câu trở lên).
- Sai lần 1 (động viên), sai lần 2 (gợi ý, kèm nút đúng nhấp nháy).
- Kết quả 3 sao, 2 sao, 1 sao.
- Có huy hiệu mới.
- Mở quà, nhận hình dán mới, đã đủ bộ hình dán (+3 ⭐).
- Bấm vào mức bị khoá.
- Tiệm: lời chào, mua được váy, chưa đủ sao, nhắc kéo váy vào nhân vật, khi thay váy.
- Bộ sưu tập: một câu cho mỗi tab.
- Caro: đến lượt ❌, đến lượt ⭕, ❌ thắng, ⭕ thắng.
- Nhập tên: lời giới thiệu và hỏi tên, sau khi bấm "Bắt đầu!".
- Khi bé bấm vào Kuromi (`poke`).

Câu có số liệu (như "Bé có 12 hình dán rồi!") chỉ hiện con số trong bong bóng chữ. Giọng đọc dùng câu không có số, hoặc ghép mẩu số nếu builder thấy hợp.

### 6.3 Đọc đề bài bằng cách ghép mẩu
Đề bài sinh ngẫu nhiên nhưng theo khuôn cố định (xem `say`/`prompt` trong `js/questions.js` và `js/pattern.js`). Giọng đọc được ghép từ các mẩu thu sẵn, phát nối tiếp nhau.
- **Mẩu khuôn câu**:
  - "Có bao nhiêu …?" và "… trong hình này?"
  - "Hình này có mấy cạnh / đỉnh?"
  - "Đây là hình gì?", "Chọn …", "Chọn hình có … cạnh", "Chọn hình không có cạnh"
  - "… cộng … bằng mấy?", "Số … gồm … và mấy?", "So sánh … và …"
  - "Số nào / Hình nào / Nhóm nào đi tiếp?"
- **Mẩu tên hình**: tên theo `shapeName()` (hình tròn, hình vuông, hình tam giác, hình chữ nhật, ngôi sao, bầu dục, thoi, ngũ giác, lục giác, hình thang…). Builder liệt kê đủ từ bảng `SHAPES`.
- **Mẩu tên đồ vật** đếm trong `OBJ`/`PEM` (🍎🐟⭐🌸🐞🎈🍓🐥): quả táo, con cá, ngôi sao, bông hoa… Hiện đề đang hiển thị emoji trong chữ; giọng thì đọc tên đồ vật.
- **Mẩu số 0–100**, vì các mức có phạm vi tới 100.

**Dòng giải thích 💡 cũng được đọc** (phụ huynh đã quyết định). Các dòng này sinh lúc chạy (xem `explain` trong `js/questions.js` và `js/pattern.js`, ví dụ "2 nhỏ + 1 lớn", "Mỗi số tăng thêm 3", "Các hình lặp lại: …"). Builder liệt kê đủ mọi khuôn giải thích, rồi đưa vào danh sách lời thoại dưới dạng câu trọn vẹn hoặc mẩu ghép. Giải thích được đọc sau câu khen. Game chờ đọc xong mới sang câu sau, thay cho mốc 2,8 giây cố định.

**Không đọc nút đáp án dạng chữ** (phụ huynh đã quyết định), ví dụ "Hình tròn", "Ngôi sao" trong câu "Đây là hình gì?". Các nút này giữ nguyên như hiện tại.

Builder có thể tách mẩu theo cách khác (ví dụ thu cả cụm "hình tam giác trong hình này"), miễn là phủ hết mọi đề có thể sinh ra. Viết kèm một bài kiểm tra: với mỗi mức, sinh nhiều câu hỏi và chắc chắn mọi câu đều ghép được từ danh sách mẩu. Chỗ nối giữa các mẩu có thể hơi khựng; với trẻ nhỏ thì chấp nhận được. Nút 🔊 đọc lại đề.

### 6.4 Khi thiếu file, và quy tắc phát
- Thiếu file hoặc tải lỗi: dùng giọng máy (`speechSynthesis` `vi-VN`) với cao độ cao hơn và tốc độ chậm hơn hiện tại. Nếu ghép đề mà thiếu bất kỳ mẩu nào thì đọc cả câu bằng giọng máy, không ghép nửa giọng AI nửa giọng máy.
- Mỗi lúc chỉ một câu được phát. Câu mới, hoặc chuyển màn, sẽ dừng câu đang phát.
- Thứ tự trong màn chơi: Kuromi đọc đề. Khi bé trả lời đúng, câu khen ngắn được phát, rồi đọc dòng giải thích 💡 (nếu có), rồi sang câu mới và đọc đề mới.
- *(Lựa chọn của mình)* **Nhịp chuyển câu**: chờ Kuromi nói xong rồi mới chuyển, nhưng có mức chờ tối đa (khoảng 3 giây cho câu khen, khoảng 6 giây cho câu khen cộng giải thích), để file lỗi hoặc quá dài không làm treo game. Giữ khoảng nghỉ tối thiểu như hiện tại (khoảng 950ms). Câu dẫn đầu màn được phát xong rồi mới đọc đề.
- *(Lựa chọn của mình)* Bé được trả lời ngay cả khi Kuromi đang đọc đề. Khi bé bấm đáp án, giọng đang đọc dừng lại và chuyển sang câu phản ứng.
- Âm hiệu ứng WebAudio (`sfx`) giữ như cũ, phát song song với giọng nói.

### 6.5 Cài đặt âm thanh
Tách nút 🔊 hiện tại (`S.sound`) thành 2 công tắc trong Cài đặt: **Giọng Kuromi** và **Âm thanh hiệu ứng**. Thêm 2 trường mới vào dữ liệu lưu, lấy giá trị ban đầu từ `S.sound` để không đổi trải nghiệm của bé. Nút 🔊 trên thanh trên cùng *(lựa chọn của mình)* vẫn là nút tắt hoặc bật nhanh cả hai.

## 7. Các màn hình

Mọi màn trừ màn mở đầu đều có Kuromi ở cột trái (trừ tiệm và cài đặt, xem 5.3), nội dung ở bên phải, và một hàng trên gồm nút ⬅️ to, tiêu đề, ô số sao.

1. **Màn mở đầu** (`splash-v5.html`, kiểu B):
   - Một hộp quà tím có nơ lắc lư 2 lần rồi bung nắp. Luồng sáng trắng và tia nắng xoay toả ra.
   - Kuromi (Vui sướng) nhảy vọt ra khỏi hộp, kèm pháo giấy và lấp lánh.
   - Tên **"Vương Quốc Vui Vẻ"** rơi xuống từng chữ cái, dòng phụ "học mà chơi cùng Kuromi 💜".
   - Trong lúc đó, ngôi sao chạy theo thanh tải. Đây là lúc tải trước ảnh mascot và các file âm thanh hay dùng.
   - Cuối cùng nút **"Vào ngay thôi !!"** bật ra và nhấp nháy. Bé chạm nút: mở khoá âm thanh, Kuromi nói câu chào, rồi chuyển vào trang chủ (hoặc vào màn nhập tên nếu chưa có tên).
   - Hiệu ứng dài khoảng 3 giây. Màn này hiện mỗi khi mở app.
2. **Trang chủ**:
   - Thanh trên: avatar và tên bé (bấm để mở Cài đặt), ⭐, 🎁, 🔊.
   - Lưới 3×3 nút kẹo dẻo, mỗi nút có icon to, tên và số sao đã đạt: 6 trò học, Cờ caro, Tiệm công chúa, Bộ sưu tập.
   - Bong bóng chào bé, có chèn tên bé. Giữ dòng chuỗi ngày 🔥 nếu chuỗi lớn hơn 1, đặt ở bong bóng hoặc thanh trên.
   - Khi sau này có thêm trò, lưới được phép có thêm hàng.
3. **Chọn mức**:
   - 6 mức nằm trên một **con đường chấm trắng uốn lượn trên mây**, mỗi mức là một nút tròn có số, sao đã đạt và tên mức. Màu: đã qua (xanh lá), đang chơi (hồng, nhịp đập, có cờ 🚩), bị khoá (xám, 🔒).
   - Bấm vào mức bị khoá: nút rung, Kuromi Suy nghĩ và nói "Đạt 2 sao ở mức trước để mở khoá nha".
4. **Màn chơi**:
   - Bên phải từ trên xuống: ⬅️ và thanh tiến độ 8 đoạn (xong thì xanh lá, đang làm thì vàng); thẻ đề với chữ to và nút 🔊 tròn tím; hàng nút đáp án to (3–4 nút).
   - Dòng giải thích 💡 vẫn hiện như cũ.
   - Kuromi đọc đề, phản ứng khi đúng hoặc sai như mục 5.2. Sai lần 2 thì gợi ý, và nút đúng nhấp nháy như luật hiện tại.
5. **Kết quả**:
   - Thẻ lớn có lời khen; 3 ngôi sao bay vào từng ngôi một (ngôi giữa cao hơn), tia sáng xoay phía sau khi đạt 2 sao trở lên.
   - Các ô "+N ⭐" và "+1 🎁" bật lên, rồi tới dải "Huy hiệu mới" (icon xoay).
   - Nút: 🎁 Mở quà, 🔁 Chơi lại, ➡️ Mức tiếp (khi đã mở khoá), 🏠 Về nhà.
   - Đạt 2–3 sao: Kuromi Vỗ tay, pháo giấy rơi. Đạt 1 sao: Kuromi Suy nghĩ và động viên, không có pháo giấy.
6. **Mở quà** (lớp phủ):
   - Nền mờ tím, hộp 🎁 to lắc lư, dòng chữ "Chạm vào hộp quà nào!", Kuromi Vui sướng nhảy bên cạnh.
   - Chạm vào hộp: hình dán bung ra, có vầng sáng và pháo giấy, kèm tên hình dán. Nút "🎁 Mở tiếp (n)" và "Tuyệt!".
   - Cách mở quà giữ như cũ. Hình dán vẫn là emoji như hiện tại *(lựa chọn của mình)*.
7. **Bộ sưu tập**:
   - Dải trên cùng báo số hộp quà chưa mở, có nút Mở quà.
   - 3 tab kiểu kẹo: **🐶 Hình dán x/y**, **👗 Tủ váy x/y**, **🏅 Huy hiệu x/y**. Hình dán xếp lưới 8 cột, chưa có thì hiện ❓ mờ; tủ váy hiện ảnh váy đã mua; huy hiệu xếp lưới 3 cột, chưa đạt thì mờ.
   - Kuromi Vui sướng, câu nói đổi theo tab.
8. **Tiệm công chúa**:
   - **Giữ** ảnh nền toàn trang theo phong cách, 5 tab, bố cục 3 cột (👗 Kéo để mặc / sân khấu / 🔒 Chưa có) và cách kéo váy vào sân khấu như hiện tại.
   - Đổi khung, tab, nút và ô giá sang kiểu mới: khung trắng mờ để thấy nền, ô giá vàng.
   - Kuromi nhỏ ở góc. Mua được váy: Kuromi Vui sướng, sao bay lên. Chưa đủ sao: Kuromi Suy nghĩ.
9. **Cờ caro**:
   - Bàn cờ lưới tím nhạt chiếm gần hết màn hình. Ở trên là ô báo lượt "❌ Bạn 1" và "⭕ Bạn 2"; ô đang đến lượt thì nhấp nháy. Các nút ↩️ Đi lại, 🎯 Về giữa, 🔄 Ván mới.
   - Kuromi nhỏ ở cột trái (khoảng 20% chiều rộng) báo lượt. Khi thắng: hàng 5 quân phát sáng, Kuromi Vỗ tay.
   - Cách chơi (kéo, phóng to, bàn cờ vô hạn) giữ như cũ.
10. **Nhập tên** (lần đầu, hoặc khi đổi tên):
    - Kuromi tự giới thiệu và hỏi tên. Tiêu đề "Chào mừng bé!".
    - Ô nhập tên to, tối đa 14 ký tự. 8 avatar tròn; avatar được chọn thì phóng to và có viền sáng. Nút "Bắt đầu!".
11. **Cài đặt** (bảng nổi):
    - 3 ô số liệu: số màn đã học, chuỗi ngày 🔥, số lần không sai.
    - 2 công tắc (mục 6.5), nút ✏️ Đổi tên / hình, nút Xoá dữ liệu (có hỏi lại), nút Đóng.
    - Kuromi nhỏ ở góc bảng.

Thông báo nhỏ (`toast`) và nút chung (`.btn`) cũng đổi sang kiểu mới.

## 8. Đổi tên app
- Đổi `<title>`, `apple-mobile-web-app-title`, và `name`/`short_name` trong `manifest.webmanifest` thành "Vương Quốc Vui Vẻ" (tên ngắn do builder chọn cho vừa màn hình chính).
- Có thể đổi `theme-color` cho hợp màu nền mới.
- Đổi tiêu đề ở màn nhập tên và các chữ "Bé Vui Học Toán" khác.
- **Giữ nguyên khoá dữ liệu `be_vui_hoc_toan_v1`** để không mất tiến độ.
- *(Để builder quyết định)* Có làm lại icon app theo phong cách mới không.

## 9. Để builder quyết định
- Cách tổ chức CSS và JS: tách file, đặt tên lớp, tạo hàm dùng chung cho mascot và giọng nói (ví dụ `mascot(emotion, line)`).
- Cách co giãn kích thước (`cqw`, `vmin`, `clamp`…), miễn là đạt ràng buộc ở mục 3.
- Tối ưu ảnh mascot và chiến lược tải trước âm thanh.
- Quy ước tên file âm thanh, định dạng danh sách lời thoại, và cách chia mẩu ghép đề.
- Nội dung cụ thể của từng câu thoại, theo giọng: ngắn, vui, động viên, xưng "mình", gọi "bé". Ví dụ đã dùng trong bản phác: "Chào bé! Hôm nay mình chơi trò nào nè? 💜", "Hmm… mình đếm lại từng quả nha 🤔", "Đúng rồi! Bé giỏi quá 👏", "Yeah! Quà của bé nè 🎁".
- Thời gian chi tiết của từng hiệu ứng, miễn là giữ đúng cảm giác của bản phác.

## 10. Nghiệm thu
1. Không có lỗi console. Chơi trọn mỗi trò ít nhất 1 màn trên khung 1024×768 ngang. Không cuộn ngang ở 360×740.
2. Dữ liệu cũ trong `localStorage` vẫn còn nguyên sau khi cập nhật (sao, hình dán, váy đã mua, huy hiệu).
3. Kuromi hiện đúng cảm xúc ở mọi điểm chạm trong mục 5.2.
4. Bài kiểm tra ghép đề: mọi đề và mọi dòng giải thích 💡 sinh ra ở mọi mức đều ghép đủ từ danh sách mẩu.
5. Khi chưa có file âm thanh nào, game chạy bằng giọng máy, không lỗi. Khi có đủ file, đề và câu thoại dùng giọng ElevenLabs.
6. Tắt Giọng Kuromi thì không còn giọng nói nhưng vẫn có âm hiệu ứng, và ngược lại.
7. Chụp ảnh màn hình mọi màn ở mục 7 trên khung tablet ngang để đối chiếu với bản phác.
