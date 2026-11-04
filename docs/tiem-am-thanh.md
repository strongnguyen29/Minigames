# Tiệm âm thanh

Danh mục và mọi con số nằm ở đầu `js/radio.js`.

## Thêm bài hát / câu chuyện

1. Chép file vào `audio/` (nên dùng `.m4a` AAC hoặc `.mp3`, mono 48–64 kbps là đủ cho giọng kể):
   - bài hát: `audio/songs/<ten-file>.m4a`
   - câu chuyện: `audio/stories/<ten-file>.m4a`
2. Thêm một dòng vào nhóm tương ứng trong `RADIO`:

   ```js
   ['songs/chu-ech-con.m4a','Chú ếch con',10,'🐸']   // [file, tên, giá sao (0 = miễn phí), biểu tượng]
   ```

`audio/songs/` nằm trong `.gitignore` vì repo công khai mà bài hát thường có bản quyền. File trong đó chỉ nghe được trên máy (chạy local), còn bản trên GitHub Pages phải lấy qua R2 (`AUDIO_CDN`, xem bên dưới).

Id của món là đường dẫn bỏ đuôi (`songs/chu-ech-con`). Id này được lưu trong tiến độ của bé, nên **đừng đổi tên file** sau khi đã phát hành, nếu không bé sẽ mất bài đã đổi (sao được hoàn lại).

Muốn thêm loại mới (ví dụ "Nhạc ru ngủ") thì thêm một nhóm vào `RADIO`: `{id:'lullaby',icon:'🌙',name:'Nhạc ru ngủ',items:[...]}`.

## Chuyển file lên Cloudflare R2

1. Tải các file lên bucket R2, **giữ nguyên đường dẫn** tính từ `audio/` (ví dụ `stories/ngoi-sao-nho-di-lac.m4a`). Nếu bài Giai điệu Kuromi vẫn còn trong danh mục thì tải cả `music/kuromi-lofi.m4a`.
2. Bật public access (tên miền `r2.dev` hoặc tên miền riêng) và thêm CORS cho tên miền của game.
3. Điền vào `js/radio.js`: `const AUDIO_CDN='https://<ten-mien-cdn>/';`
4. Có thể xoá file khỏi repo sau khi đã kiểm tra là nghe được.

Một món cũng có thể ghi thẳng link đầy đủ (`'https://…/x.mp3'`) để lấy file từ chỗ khác. Hosting phải hỗ trợ HTTP Range (R2 và GitHub Pages đều có), nếu không thì "Nghe tiếp" sẽ không tua tới chỗ đã dừng được.

## Luật chơi

- Bài giá 0 thì có sẵn. Bài có giá phải đổi sao một lần, sau đó nghe mãi mãi (được đồng bộ qua Sao lưu).
- Mỗi ngày có `LISTEN_FREE_MIN` (5) phút nghe miễn phí. Hết phút thì bài tự dừng và hiện bảng đổi sao lấy phút (`LISTEN_PACKS`). Phút miễn phí trừ trước, phút đã đổi trừ sau và được dồn sang hôm sau.
- Phút nghe và chỗ dừng mỗi bài được lưu **riêng trên từng máy** (`S.listen`, không đẩy lên mây). Còn số sao đã tiêu cho phút nghe (`S.listenSpent`) và các bài đã đổi (`S.songs`) thì được đồng bộ, để số sao khớp nhau giữa các máy.
- Mở lại bài đã nghe dở (từ `RESUME_MIN` = 5 giây trở lên và chưa tới 5 giây cuối) thì Kuromi hỏi muốn nghe tiếp hay nghe từ đầu.
- Ở tiệm này nhạc nền tắt. Rời tiệm hoặc ẩn ứng dụng thì bài tạm dừng và chỗ dừng được nhớ lại.

## Giọng Kuromi

Các câu `radio_*` trong `js/lines.js` chưa có file mp3 nên tạm đọc bằng giọng máy. Muốn tạo giọng thật thì chạy `npm run voice:export`, rồi `npm run voice:generate -- radio` (lệnh này tự cập nhật `manifest.js`).
