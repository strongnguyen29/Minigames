# SPEC: Bé Vui Học Toán (minigame HTML5 cho học sinh lớp 1)

> Dán toàn bộ file này vào Claude Code (VS Code) và yêu cầu: "Đọc SPEC.md và xây dựng game đúng theo spec. Chạy thử bằng Playwright rồi báo kết quả."

## 1. Mục tiêu
Minigame toán cho bé 6–7 tuổi, gồm hình học (đếm hình, nhận biết hình) và số học (gộp, tách, so sánh số theo phạm vi 5/10/20). Hoàn thành màn chơi thì nhận sao, hộp quà, hình dán, huy hiệu. Toàn bộ dữ liệu lưu trong `localStorage`.

## 2. Ràng buộc kỹ thuật
- HTML5 thuần: **một file `index.html`**, CSS và JS viết inline. Không framework, không thư viện ngoài, không font ngoài, không gọi mạng.
- Chạy offline khi mở trực tiếp file; triển khai được lên GitHub Pages (file nằm ở thư mục gốc repo).
- Giao diện tiếng Việt. Responsive, dùng tốt trên điện thoại (rộng 360px) và máy tính bảng. Nút bấm to (tối thiểu 80px chiều cao ở nút đáp án), ít chữ, màu sáng vui.
- Âm thanh bằng WebAudio (không file mp3). Giọng đọc đề bằng `speechSynthesis` với `lang='vi-VN'`; thiếu giọng thì bỏ qua, không báo lỗi.
- Mọi thao tác đọc/ghi `localStorage` bọc `try/catch`; nếu bị chặn thì giữ dữ liệu trong bộ nhớ và game vẫn chạy.
- Không dùng `alert/confirm/prompt` để chơi game (riêng nút "Xoá dữ liệu" được phép dùng `confirm`, hoặc dùng modal tự làm).

## 3. Mô hình dữ liệu (`localStorage`, khoá `be_vui_hoc_toan_v1`)
```json
{
  "name": "Mai", "avatar": "🐱",
  "stars": 0, "gifts": 0,
  "stickers": ["🐶"],
  "best": { "count-0": 3, "add-2": 2 },
  "rounds": 0, "perfect": 0,
  "streak": 0, "lastDay": "2026-11-1",
  "sound": true,
  "badges": ["first"]
}
```
- `best[<game>-<level>]` là số sao cao nhất (1–3) của từng mức.
- `streak` tăng khi chơi ngày liền kề, đặt lại 1 khi bỏ ngày.
- Khi đọc dữ liệu, trộn với giá trị mặc định để không lỗi khi thiếu trường.

## 4. Màn hình và luồng
1. **Chào mừng** (lần đầu hoặc khi đổi tên): nhập tên (tối đa 14 ký tự), chọn 1 trong 8 avatar emoji, nút "Bắt đầu!".
2. **Trang chủ**: thanh trên cùng gồm avatar + tên (bấm vào mở Cài đặt), số sao ⭐, số hộp quà 🎁 (bấm vào mở Phần thưởng), nút bật/tắt âm thanh. Lưới 5 trò chơi + thẻ "Phần thưởng". Mỗi thẻ hiện số sao đã đạt.
3. **Chọn mức** (3 mức/trò): hiện sao cao nhất của từng mức. Mức n+1 **khoá** cho đến khi mức n đạt ≥ 2 sao; bấm vào mức khoá thì rung và hiện thông báo "Đạt 2 sao ở mức trước để mở khoá nhé! 🔒".
4. **Màn chơi**: 8 câu/màn. Thanh tiến độ 8 đoạn. Thẻ câu hỏi gồm nút 🔊 đọc đề, đề bài, phần hình minh hoạ. Dưới là các nút đáp án (3–4 nút, xáo trộn).
5. **Kết quả**: lời khen, 1–3 sao, "+N ⭐", hộp quà nếu ≥ 2 sao, huy hiệu mới (nếu có). Nút: Mở quà (nếu có), Chơi lại, Mức tiếp theo (nếu đã mở khoá), Về nhà.
6. **Mở quà**: modal hộp quà lắc lư, bấm để mở, hiện hình dán mới (hiệu ứng pop + pháo giấy). Còn quà thì có nút "Mở tiếp". Đã đủ bộ hình dán thì mỗi hộp quà cho +3 ⭐.
7. **Phần thưởng**: số hộp quà chưa mở, album hình dán (hình chưa có hiện ❓ mờ), danh sách huy hiệu (chưa đạt thì mờ).
8. **Cài đặt** (modal): đổi tên/avatar, xem số màn đã học và chuỗi ngày, xoá toàn bộ dữ liệu (có xác nhận).

## 5. Quy tắc chơi chung
- Trả lời đúng: nút xanh, âm "ting", pháo giấy nhỏ, sang câu sau sau ~0,95 giây.
- Trả lời sai: nút đỏ + rung, âm trầm, tính 1 lỗi, bé được chọn lại (nút sai bị vô hiệu). Sai từ lần thứ 2 trên cùng một câu thì nút đúng nhấp nháy gợi ý.
- Không lặp lại cùng một câu trong một màn (so sánh theo khoá câu hỏi; thử sinh lại tối đa ~15 lần).
- Tính sao theo tổng số lỗi cả màn: ≤ 1 lỗi → 3 sao; 2–3 lỗi → 2 sao; ≥ 4 lỗi → 1 sao.
- Cuối màn: `stars += sao`, `rounds++`, 0 lỗi thì `perfect++`, cập nhật `best` (lấy max), ≥ 2 sao thì `gifts++`, cập nhật `streak`, kiểm tra huy hiệu, lưu.
- Mỗi câu hỏi sinh ra theo cấu trúc: `{ prompt, visual (HTML), choices:[{html,key}], correct (key), key (khoá chống trùng), say?, explain? }`. Một hàm render chung cho mọi trò.
- Nếu câu có `explain` thì hiện dòng "💡 …" dưới hình sau khi bé trả lời đúng và chờ ~2,8 giây mới sang câu sau.
- Lựa chọn số: gồm đáp án đúng cộng các số gần đó (±3), không trùng, không âm, nằm trong khoảng cho phép của mức.

## 6. Năm trò chơi

### 6.1 Đếm hình (`count`) — 3 mức
Đề: "Có bao nhiêu <hình> (trong hình này)?". Đáp án là số.

**Mức 1: Hình độc lập**
- 75%: các hình SVG rời nhau, xoay nhẹ ±15°, nhiều màu. Hình cần đếm có 1–8 cái, thêm 1–3 hình loại khác (đôi khi thêm loại thứ ba 1–2 cái). Loại hình lấy từ: tròn, vuông, tam giác, chữ nhật, ngôi sao. Đáp án thuộc 1–10, 4 lựa chọn.
- 25%: câu khởi động, đếm 1–6 đồ vật emoji (🍎🐟⭐🌸🐞🎈🍓🐥), 3 lựa chọn.

**Mức 2: Hình trong hình (hình ghép một loại)**
Vẽ SVG viewBox 200×200, nét `#2b3a55` dày 3, nền vàng nhạt. Mỗi hình có đáp án cố định và lời giải thích:
| Hình | Hỏi | Đáp án | Giải thích |
|---|---|---|---|
| Tam giác (100,20)-(20,175)-(180,175), 1 đoạn từ đỉnh xuống giữa đáy | tam giác | 3 | 2 nhỏ + 1 lớn |
| Như trên, 2 đoạn từ đỉnh chia đáy thành 3 phần | tam giác | 6 | 3 nhỏ + 2 ghép đôi + 1 lớn |
| Tam giác cắt bởi k đoạn song song đáy (k=1: y=100; k=2: y=75, 125) | tam giác | k+1 | các tam giác chồng lên nhau tính từ đỉnh |
| Tam giác nối 3 trung điểm (4 tam giác nhỏ) | tam giác | 5 | 4 nhỏ + 1 lớn |
| Hình vuông có 1 đường chéo | tam giác | 2 | |
| Hình vuông có 2 đường chéo | tam giác | 8 | 4 nhỏ + 4 ghép đôi |
| Hình vuông chia lưới 2×2 | vuông | 5 | 4 nhỏ + 1 lớn |
| 2–4 hình tròn/vuông/tam giác lồng chung tâm, cùng loại | loại đó | 2–4 | "Có k hình … nằm trong nhau" |

**Mức 3: Hình lồng nhiều loại**
Hỏi một loại hình có mặt trong hình (ưu tiên loại có số lượng ≥ 2). Giải thích mặc định liệt kê số lượng từng loại.
| Hình | Số lượng |
|---|---|
| Hình vuông to, nối trung điểm 4 cạnh tạo hình thoi/vuông xoay bên trong | tam giác 4, vuông 2 |
| Như trên, thêm hình tròn nội tiếp trong hình vuông xoay | tam giác 4, vuông 2, tròn 1 |
| Tam giác nối 3 trung điểm, hình tròn ở tam giác giữa | tam giác 5, tròn 1 |
| Lưới vuông 2×2, mỗi ô có 1 hình tròn | vuông 5, tròn 4 |
| Ngôi nhà: thân vuông, 2 cửa sổ vuông, mái tam giác, cửa sổ tròn trên mái | vuông 3, tam giác 1, tròn 1 |
| Chuỗi 4–5 hình lồng chung tâm ngẫu nhiên, ít nhất 2 loại | đếm theo loại |

Quy tắc hình lồng chung tâm (để hình sau luôn nằm gọn trong hình trước): bán kính ngoại tiếp ban đầu R=92; nếu hình kế tiếp cùng loại thì R×0,7; nếu khác loại thì R_mới = R × bán_kính_nội_tiếp(loại_trước) × 0,85, với hệ số nội tiếp: tròn 1, vuông 0,7071, tam giác 0,5. Loại bỏ chuỗi nào khiến hình trong cùng nhỏ hơn ~11 đơn vị.
**Không hỏi "hình chữ nhật" trong hình ghép** vì hình vuông cũng là hình chữ nhật, dễ gây nhầm cho lớp 1.

### 6.2 Nhận biết hình (`shape`) — 3 mức
Mức 1: tròn, vuông, tam giác. Mức 2: thêm chữ nhật. Mức 3: thêm bầu dục, thoi, ngôi sao. Hai dạng câu, mỗi dạng 50%:
- "Đây là hình gì?" hiện 1 hình lớn, chọn tên (chữ).
- "Chọn <tên hình>" chọn đúng hình trong 3–4 hình SVG khác màu.

### 6.3 Gộp số (`add`) — phạm vi 5 / 10 / 20
Đề: "Gộp lại: a + b = ?", a,b ≥ 1, tổng ≤ phạm vi. Phạm vi 5 và 10 hiện hai nhóm đồ vật emoji; phạm vi 20 chỉ hiện số, ưu tiên tổng > 10 (có lúc cho a,b ≤ 10). Đọc đề: "a cộng b bằng mấy?".

### 6.4 Tách số (`split`) — phạm vi 5 / 10 / 20
Đề: "Số t gồm a và mấy?". Tổng t: phạm vi 5 → 2–5; phạm vi 10 → 4–10; phạm vi 20 → 11–20. Phạm vi ≤ 10 hiện nhóm đồ vật a và ô ❓; phạm vi 20 hiện "t = a + ❓". Đáp án b = t − a.

### 6.5 So sánh số (`cmp`) — phạm vi 5 / 10 / 20
Hiện "a ? b" với a,b ∈ [0, phạm vi], 20% trường hợp bằng nhau. 3 nút `<`, `=`, `>`.

### 6.6 Mức mở rộng (mức 4–6 của mỗi trò, tổng 6 mức/trò)
- **Đếm hình**: mức 4 đếm 6–12 hình rời; mức 5 hình ghép nâng cao (tam giác 3–4 đường ngang, lưới vuông 3×3 = 14 hình vuông, hàng 3–5 ô vuông); mức 6 hình ghép thử thách (lưới 3×3 có tròn, tam giác 3 tròn, hàng ô vuông có tròn, 5–6 hình lồng nhau).
- **Nhận biết hình**: thêm ngũ giác, lục giác, hình thang. Mức 4 đếm cạnh; mức 5 đếm cạnh/đỉnh (có hình tròn = 0); mức 6 chọn hình theo số cạnh.
- **Gộp / Tách / So sánh số**: thêm phạm vi 30, 50, 100 (so sánh ở các mức này hay cho hai số gần nhau).
- Quy tắc mở khoá, tính sao và dữ liệu `best[<game>-<level>]` giữ nguyên.

## 7. Phần thưởng
- **Hình dán (56):** 🐶🐱🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦆🦉🦄🐝🦋🐢🐙🐬🐳🦒🐘🦖🚀🌈🍭🏆🦕🦈🦜🦩🦔🐿️🦥🦦🐞🦀🐠🦓🐊🐲🛸🎠🍦🍩🧁🍓🎈🎸⚽🌻. Mở hộp quà ra hình ngẫu nhiên chưa có.
- **Huy hiệu (25):** tính từ dữ liệu đã lưu (`best`, `rounds`, `perfect`, `streak`, `stars`, `stickers`).
  - Số màn: 🌱 1 màn, 🎒 10 màn, 📚 30 màn, 🎓 100 màn.
  - Không sai câu nào (`perfect`): 💯 1 lần, 🎯 5 lần, 🧠 20 lần.
  - Chuỗi ngày: 🔥 3 ngày, 🌟 7 ngày, ☄️ 14 ngày.
  - Sao: ⭐ 50, 🌠 150, 🌌 300.
  - Hình dán: 👑 10 hình, 🎨 25 hình, 🏆 đủ hình.
  - Mức 3 sao: 🥉 1 mức, 🥈 10 mức, 🥇 tất cả các mức.
  - Qua hết mọi mức của một trò (≥ 2 sao): 🔢 Đếm hình, 🔺 Nhận biết hình, ➕ Gộp số, ✂️ Tách số, ⚖️ So sánh số.
  - 🌈 Bé giỏi toàn diện: đã chơi đủ cả 5 trò.
- Hiệu ứng: pháo giấy (emoji rơi), âm chiến thắng khi kết thúc màn, thông báo huy hiệu mới ngay trên màn kết quả hoặc màn mở quà.

## 8. Tiêu chí nghiệm thu
1. Mở `index.html` bằng trình duyệt, không có lỗi trong console.
2. Chơi trọn 15 màn (5 trò × 3 mức) bằng cách trả lời đúng: không lỗi JS, `localStorage` có đúng `stars`, `rounds`, `best`.
3. Với mỗi mức, sinh 300 câu hỏi: đáp án đúng luôn có trong danh sách lựa chọn, các lựa chọn không trùng nhau, không có số âm.
4. Kiểm thử đáp án các hình ghép ở mục 6.1 bằng cách đối chiếu bảng (hoặc liệt kê tam giác/vuông thủ công cho từng mẫu).
5. Tải lại trang: tên, sao, hình dán, huy hiệu được giữ nguyên. Xoá dữ liệu thì quay về màn chào mừng.
6. Chặn `localStorage` (ví dụ chế độ ẩn danh nghiêm ngặt): game vẫn chơi được.
7. Ở khung 360×740: không cuộn ngang, nút đáp án bấm dễ bằng ngón tay, hình ghép không bị cắt.
8. Chụp ảnh màn hình ít nhất: trang chủ, một câu ở mỗi mức của Đếm hình, màn kết quả, album phần thưởng.

## 9. Gợi ý cấu trúc mã trong `index.html`
1. Tiện ích (`R`, `pick`, `shuffle`) và lưu trữ (`load`, `save`, `touchStreak`).
2. Âm thanh (`tone`, `sfx`, `say`, `confetti`).
3. Hình học SVG (`SHAPES`, `svg()`, các hàm vẽ cho hình ghép).
4. Bộ sinh câu hỏi (`genCount`, `genShape`, `genAdd`, `genSplit`, `genCmp`) và bảng `GAMES` (tên, icon, màu, tên các mức, hàm sinh).
5. Phần thưởng (`STICKERS`, `BADGES`, `checkBadges`).
6. Giao diện (`welcome`, `home`, `levels`, `start/nextQ/answer/finish`, `openGift`, `album`, `settings`).

## 10. Việc tuỳ chọn cho giai đoạn sau
- Trò mới: đếm cạnh/đỉnh, dãy số, phép trừ, ghép hình.
- Nhiều hồ sơ bé trên cùng một máy.
- Báo cáo tiến độ cho phụ huynh (biểu đồ sao theo ngày).
- Xuất/nhập tiến độ ra file JSON để chuyển máy.
- Cấu hình số câu mỗi màn (hiện cố định 8).
