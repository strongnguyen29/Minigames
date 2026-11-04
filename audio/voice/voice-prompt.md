# Tạo giọng Kuromi trên ElevenLabs

## 1. Tạo giọng (Voice Design)

Dán đoạn mô tả này vào ô mô tả giọng:

> A cute chibi girl voice, around 7–8 years old, speaking Vietnamese with a Northern (Hanoi) accent. Bright, clear and sweet, a little playful and mischievous, warm and very expressive. Speaks slowly and clearly so that 6–7 year old children can follow easily. Friendly cartoon-companion energy, gentle and encouraging, never shouting.

Câu mẫu để nghe thử: "Xin chào! Mình là Kuromi. Hôm nay mình cùng học thật vui nha!"

Không ghi tên diễn viên lồng tiếng hay nhân vật có bản quyền vào mô tả.

## 2. Cài đặt khi tạo file

- Model: model đa ngôn ngữ có hỗ trợ tiếng Việt (ví dụ Eleven Multilingual v2 hoặc v3).
- **Chỉ dùng một giọng đã lưu cho tất cả các file**, để các mẩu ghép nghe liền mạch.
- Stability khoảng 0,5; Similarity khoảng 0,75; Style thấp với mẩu ghép, cao hơn với câu cảm xúc.
- Câu cố định: đọc theo cột "Cách đọc" và "Cảm xúc".
- **Cột `elevenlabs` trong `script.csv`** là câu đã ghép sẵn thẻ cảm xúc (ví dụ `[excited] Yeah! Mình là Kuromi…`): copy cả ô dán thẳng vào ô nhập. Thẻ chỉ có tác dụng với model **Eleven v3**.
- **Mẩu ghép đề và mẩu số**: đọc trung tính, đều giọng, không lên giọng hay xuống giọng ở cuối, không ngừng dài ở đầu hoặc cuối file.
- Xuất mp3 (44,1kHz, 128kbps là đủ).

## 3. Đưa file vào game

1. Đặt tên file đúng như cột "File" trong `script.md` hoặc `script.csv`.
2. Bỏ tất cả vào thư mục `audio/voice/`.
3. Chạy `npm run voice:manifest` để game nhận các file mới.

Có thể làm dần: file nào chưa có thì game tự dùng giọng máy cho câu đó.
