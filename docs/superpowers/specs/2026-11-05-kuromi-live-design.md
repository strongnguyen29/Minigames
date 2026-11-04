# Kuromi nói chuyện bằng Gemini Live API: thiết kế

Ngày: 2026-11-05. Bổ sung cho `2026-11-04-kuromi-chat-design.md` (phần nào không nói ở đây thì giữ nguyên). Chủ dự án duyệt trong chat.

## Ý định

Bản hiện tại gọi Gemini hai lần (chat nhận âm thanh, rồi TTS đọc), hay gặp 503/429 và phải rơi về giọng máy (giọng nam trên Windows). Gemini Live API với model native audio nghe và nói trực tiếp trong một kết nối WebSocket: ít bước hơn, giọng chọn ngay lúc mở phiên, nhanh hơn.

## Đã kiểm chứng (spike 2026-11-05, key thật)

- `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=KEY`; thông điệp đầu `setup`; gửi âm thanh `realtimeInput.audio` (`audio/pcm;rate=16000`, base64); nhận `serverContent.modelTurn.parts[].inlineData` (`audio/pcm;rate=24000`), `inputTranscription`, `outputTranscription`, `turnComplete`.
- Server tự phát hiện bé ngừng nói. Độ trễ ~4 giây từ lúc bé nói xong đến khi có tiếng; cả lượt ~7 giây.
- `gemini-2.5-flash-native-audio-latest` không nhận khai báo hàm (đóng kết nối mã 1007), nên **không có nét mặt theo cảm xúc**.
- Chép lời đầu vào kém chính xác ("Kuromi ơi" → "Không ơi… hả mi").

## Mục tiêu

- Bé chạm nút → mở phiên Live, game thu âm 16 kHz truyền liên tục; Kuromi trả lời bằng giọng Live, chữ trả lời hiện trong bong bóng theo bản chép lời đầu ra.
- Giọng và System Instructions đặt ngay trong thông điệp `setup`: giọng `Leda` (nữ trẻ; đổi được bằng một hằng số), prompt ngắn ép trả lời **tối đa 2 câu, dưới 25 từ**.
- Nếu Live không kết nối được hoặc chưa có tiếng trả lời thì **tự rơi về đường chat + TTS hiện có** bằng chính đoạn âm thanh vừa thu.
- Giữ nguyên: nút trò chuyện, tự dừng khi im 1,5 giây (phía game vẫn dùng để gửi `audioStreamEnd` sớm), hạn mức 10 câu/ngày và đổi sao, hộp nhập key, tắt khi rời trang chủ.

## Không phải mục tiêu

Không có nét mặt theo cảm xúc ở đường Live (Kuromi "vui" khi nói rồi về nét nền); không nhớ câu trước (mỗi câu hỏi một phiên mới); không hiện chữ bé vừa nói (bản chép lời có thể sai, dễ làm bé khó hiểu); không dùng hàm/ công cụ; không máy chủ trung gian.

## Quyết định của mình (chủ dự án duyệt chung "ok, triển khai")

- Một phiên Live cho mỗi lần chạm nút (mở khoảng 0,3 giây), đóng khi xong lượt: tránh quản lý phiên nhàn rỗi và giới hạn phiên đồng thời.
- Một câu hỏi tính khi lượt Live hoàn tất (`turnComplete`) và bé còn ở trang chủ; đường dự phòng tính như cũ.
- **Ngoại lệ bảo mật đã báo chủ dự án:** WebSocket trình duyệt không gửi được header nên khoá nằm trong địa chỉ kết nối (`?key=`); chỉ đi tới Google qua TLS, không ghi log.
- Không đặt giới hạn `maxOutputTokens` (chưa chắc model native audio nhận; sợ bị đóng kết nối); độ ngắn do System Instructions.
- Nếu không có tiếng trả lời trong 15 giây sau khi bé nói xong thì coi là lỗi và rơi về đường cũ.
- Khoá bị từ chối (đóng kết nối có lý do nói về API key) thì mở hộp nhập key, không rơi về đường cũ.
- Hạn mức miễn phí của Live chưa xác minh được: chủ dự án xem trong AI Studio.
