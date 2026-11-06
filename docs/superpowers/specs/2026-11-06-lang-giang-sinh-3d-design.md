# Làng Giáng Sinh 3D — thiết kế

Ngày: 2026-11-06

## Ý tưởng và lý do

Thêm vào Vương Quốc Vui Vẻ trò chơi 3D đầu tiên: một **bản đồ** để bé (5–8 tuổi) tự đi lại, gặp các **nhân vật (NPC)**. Mỗi nhân vật đố câu hỏi vui hoặc nhờ bé **đi tìm đồ vật** trong bản đồ. Làm xong thì bé được **sao**, và sao này tiêu được ở tiệm công chúa, tiệm âm thanh như mọi nguồn sao khác.

Về lâu dài sẽ có nhiều bản đồ, mỗi bản đồ có một hoặc vài nhân vật (người dùng có nhắc tới Kuromi, Melody, công chúa băng giá). **Lần này chỉ làm một bản đồ: Làng Giáng Sinh**, dựng từ bộ [Kenney Holiday Kit](https://kenney.nl/assets/holiday-kit) (CC0). Không có sẵn model 3D miễn phí cho Kuromi, Melody hay Elsa. Riêng Holiday Kit thì có sẵn đủ thứ để dựng một làng tuyết.

Thành công nghĩa là: bé tự vào làng mỗi ngày, đi gặp từng bạn, làm hết việc, nhận sao, và hôm sau muốn quay lại vì có việc mới.

## Mục tiêu

- Một màn hình mới mở từ thẻ trên trang chủ, dẫn vào một làng Giáng sinh 3D đi lại được.
- Bé hiện trong làng dưới dạng **búp bê giấy**: ảnh 2D bé mặc bộ đồ đã mua ở tiệm, đứng trong thế giới 3D.
- Trước khi vào làng, bé **chọn bộ đồ** để mặc.
- 4 nhân vật Giáng sinh, mỗi bạn giao một việc mỗi ngày: câu đố hoặc nhiệm vụ tìm đồ.
- **Reset mỗi ngày**: mỗi ngày có câu đố mới và đồ được giấu ở chỗ mới. Làm xong hết thì hôm đó không kiếm thêm sao.
- Lời nhân vật và lời nhắc của Kuromi được ghi âm sẵn. Câu hỏi hiện bằng chữ và **máy đọc to** (speechSynthesis vi-VN).

## Không làm lần này

- Các bản đồ khác (Kuromi, Melody, công chúa băng giá…). Tuy vậy code phải tách phần dữ liệu bản đồ để sau này thêm bản đồ mà không phải viết lại phần lõi (xem "Cấu trúc").
- Nhân vật 3D có khung xương hay hoạt hình phức tạp. Bé không phải model 3D.
- Chơi offline. App hiện chưa có service worker, nên game này cũng cần mạng như các phần khác.
- Ghi âm câu hỏi và đáp án.

## Những điều không được xảy ra

- Bé đi lạc, không biết làm gì tiếp. Lúc nào cũng phải thấy rõ còn việc ở đâu (dấu "!" trên đầu nhân vật) và việc nào đã xong.
- Điều khiển khó với tay bé: không cần gạt ảo, không vuốt xoay camera phức tạp.
- Làm lệch kinh tế sao: một ngày không kiếm được nhiều hơn khoảng 4–5 lượt chơi game toán.
- Máy tính bảng hay điện thoại bị giật, nóng, hoặc phải tải hàng chục MB mới chơi được.
- Phá vỡ cách lưu và đồng bộ hiện có (sao bị cộng hai lần khi gộp, mất tiến độ…).

## Ràng buộc từ dự án

Đọc `CLAUDE.md` trước. Tóm tắt những điều liên quan:

- JS thuần, các `<script>` cổ điển dùng chung một phạm vi toàn cục, không có bundler hay bước build. File mới phải được thêm vào `index.html` đúng thứ tự, **và** vào mảng `FILES` trong các test cần nó.
- Màn hình được dựng bằng `screenHTML({mascot,top,body,cls})` + `topbar()`. Chuyển màn qua `go(fn)` / `goTap(el,fn)`.
- Trạng thái nằm trong `S` (`js/core.js`). Mỗi field mới cần `DEF`, `freshSave()`, migration trong `load()` nếu cần, **và** `mergeSave` trong `js/merge.js`.
- Cộng sao bằng `S.stars+=n; save()`. `S.stars` là bộ đếm theo từng máy (`S.earned[deviceId]`) được cộng dồn khi gộp. Số sao hiển thị là `balance()`.
- Giọng nói: lời cố định khai báo trong `LINES` (`js/lines.js`), chạy qua `mascotSay`/`voice.line`. Sinh mp3 bằng `npm run voice:export` → `voice:generate` → `voice:manifest`. `voice.js` đã có fallback speechSynthesis.
- UI, chú thích, tài liệu, tên test bằng tiếng Việt. Commit theo kiểu conventional commit, viết tiếng Anh.
- Test: `node:test` + `tests/helpers/load.js` (DOM giả, không có WebGL). E2E: `tests/e2e/smoke.mjs` chạy trên 3 khổ màn hình.
- Thiết bị chính là iPad và iPhone (PWA trên iOS), ngoài ra có máy tính.

## Những gì người dùng đã quyết định

1. **Bản đồ đầu tiên: Làng Giáng Sinh**, dùng Kenney Holiday Kit.
2. **Nhân vật Giáng sinh** đứng trong làng, giao câu đố hoặc nhiệm vụ tìm đồ. Hoàn thành thì nhận sao.
3. **Bé là búp bê giấy 2D** trong thế giới 3D (thử phương án này trước).
4. **Chọn bộ đồ trước khi vào làng.**
5. **Reset mỗi ngày.** Làng **mở quanh năm**, không giới hạn theo mùa. Vì vậy kho câu đố không chỉ xoay quanh Giáng sinh (xem chủ đề bên dưới).
6. **Giọng nói:**
   - Mỗi nhân vật chỉ có 1–2 câu thoại cố định, được ghi âm.
   - **Ông già Noel dùng giọng ElevenLabs `1wg2wOjdEWKA7yQD8Kca`.**
   - Các nhân vật còn lại (người tuyết, tuần lộc, lính chì) **dùng giọng Kuromi**.
   - Kuromi có thêm vài câu nhắc ("Có câu đố kìa!", "Có nhiệm vụ kìa!"…).
   - **Câu hỏi và đáp án hiện bằng chữ và được máy đọc to** (speechSynthesis), không ghi âm.

## Thiết kế chi tiết

Những mục ghi *(mình quyết)* là lựa chọn của người viết tài liệu, chưa được người dùng duyệt riêng. Cứ theo đó mà làm, trừ khi có lý do rõ ràng để đổi.

### Luồng màn hình

1. **Trang chủ:** thêm thẻ `🎄 Làng Giáng Sinh`, đặt cạnh thẻ Cờ caro trong `home()`. Dòng phụ hiện tiến độ hôm nay (`2/4`, hoặc `✅` khi đã xong) *(mình quyết)*.
2. **Màn chọn đồ (2D, HTML):** lưới các bộ đồ bé đã có trong `S.owned`, gồm cả đồ mua và đồ được tặng. Mỗi ô dùng ảnh `src` (cutout) của `SHOP_ITEMS`.
   - Lúc nào cũng có thêm bộ mặc định `white-dress`. Ảnh này có trong `characters-cutout/` nhưng không bán ở tiệm *(mình quyết)*.
   - Bộ chọn lần trước được chọn sẵn, lưu theo từng máy *(mình quyết)*.
   - Nút "Vào làng".
3. **Màn làng (3D):** một canvas WebGL chiếm gần hết màn hình, nút ⬅️ về trang chủ, ô sao, và thanh việc hôm nay (4 biểu tượng nhân vật, cái nào xong thì có dấu ✓). Kuromi xuất hiện dưới dạng mascot nhỏ ở góc, nói các câu nhắc.
4. **Hộp thoại:** lớp HTML phủ lên canvas, không vẽ trong 3D. Gồm ảnh hoặc biểu tượng nhân vật, lời thoại, câu hỏi, các nút đáp án. Đáp án dùng kiểu nút `.btn` sẵn có để to và dễ chạm.

Rời màn làng (qua `go`) thì phải dừng vòng render, giải phóng renderer/geometry/texture và gỡ các listener.

### Thế giới 3D

- **Thư viện:** Three.js, nạp bằng `import()` động từ CDN với phiên bản ghim cứng (giống cách `js/sync.js` nạp Firebase), cùng `GLTFLoader`. Các script khác vẫn là script cổ điển *(mình quyết)*. Nạp lần đầu thì hiện màn chờ ("Kuromi đang dẫn đường…"). Nạp lỗi thì báo nhẹ nhàng và cho quay về.
- **Nội dung kit** (đã xem ảnh preview của Kenney): có người tuyết (2 kiểu), tuần lộc, lính chì kẹp hạt dẻ, cây thông Noel đã trang trí, thông thường và thông phủ tuyết, đá phủ tuyết, các mảnh nhà gỗ (tường, mái tuyết, cửa sổ, cửa), đèn đường, ghế băng, đường ray với đoàn tàu, xe trượt, hộp quà, tất Noel, kẹo gậy, bánh gừng, bông tuyết, vòng nguyệt quế, dây đèn, nền tuyết. **Không có ông già Noel.** Model nào lệch so với danh sách này thì thay bằng model gần nhất trong kit.
- **Tài nguyên:** chỉ chép những model GLB cần dùng từ Holiday Kit vào `models/holiday/`, kèm `License.txt` của Kenney. Không commit cả bộ kit. Ghi tổng dung lượng thực tế vào PR. Mục tiêu dưới khoảng 3 MB.
- **Bố cục làng** *(mình quyết)*: một khoảng đất tuyết hình tròn hoặc bầu dục, đi từ đầu này sang đầu kia mất khoảng 15–20 giây.
  - Giữa làng là cây thông Noel lớn, có đoàn tàu chạy vòng quanh.
  - Có 2–3 ngôi nhà gỗ ghép từ các mảnh của kit.
  - Rìa làng là thông, đá phủ tuyết và đèn đường, tạo thành ranh giới tự nhiên. Bé không đi ra ngoài được.
  - Bố cục cố định, viết bằng dữ liệu (danh sách `{model, x, z, rotY, scale}`), giống trong ảnh mẫu của kit.
- **Camera:** góc nhìn từ trên xuống chéo (kiểu đồ chơi thu nhỏ), đi theo bé một cách mượt mà. Bé không xoay hay zoom được *(mình quyết)*. Có ánh sáng ấm và tuyết rơi nhẹ bằng hạt (có thể tắt nếu máy yếu).
- **Di chuyển:** **chạm hoặc bấm vào mặt đất thì bé đi tới đó.** Bé đi theo đường thẳng, gặp vật cản thì dừng hoặc trượt dọc theo vật cản. Chỉ cần va chạm đơn giản bằng hình tròn hay hộp trên mặt phẳng, không cần thuật toán tìm đường. Chạm vào nhân vật thì bé đi tới đứng cạnh rồi mở hộp thoại. Chạm vào đồ vật cần tìm thì đi tới nhặt.
- **Búp bê giấy (bé):** một mặt phẳng có texture là ảnh cutout (tỉ lệ khoảng 484×900, nền trong suốt), luôn quay về phía camera.
  - Khi đi thì nhún lên xuống nhẹ.
  - Lật ngang theo hướng đi.
  - Có bóng tròn mờ dưới chân.
  - Cao gần bằng người tuyết, thấp hơn cửa nhà.
- **Nhân vật:**
  - **Người tuyết**, **tuần lộc**, **lính chì** dùng model trong kit.
  - **Ông già Noel** không có trong kit, phải tự dựng bằng khối cơ bản của Three.js (thân đỏ, râu trắng, mũ đỏ có quả bông). Cùng phong cách low-poly với kit.
  - Mọi nhân vật đều có hoạt động nhỏ khi đứng yên (nhún hoặc lắc nhẹ) và quay mặt về phía bé khi bé đến gần.
  - Trên đầu có dấu `!` nhấp nháy khi còn việc, dấu `✓` khi đã xong. Nhân vật đang chờ bé mang đồ về thì hiện biểu tượng món đồ.
- **Đồ vật để tìm:** hộp quà, tất Noel, kẹo gậy, bánh gừng, bông tuyết, vòng nguyệt quế (model trong kit). Đồ vật xoay nhẹ và lấp lánh để dễ thấy. Mỗi làng có sẵn khoảng 12–15 chỗ giấu viết tay, mỗi ngày chọn ngẫu nhiên trong số đó. Chỗ giấu phải nhìn thấy được từ camera, không bị nhà che mất.
- **Hiệu năng:**
  - Giới hạn pixel ratio (tối đa khoảng 2).
  - Bóng đổ chỉ dùng bóng tròn giả, không dùng shadow map.
  - Dùng chung material, gộp hoặc instance các cây giống nhau.
  - Tạm dừng render khi tab bị ẩn.
  - Mục tiêu chạy mượt trên một chiếc iPad phổ thông vài năm tuổi.

### Việc trong ngày

Mỗi ngày, 4 nhân vật được giao việc như sau *(mình quyết)*:

- **3 nhân vật đố**, 1 **nhân vật nhờ tìm đồ**. Nhân vật nào nhờ tìm đồ thì đổi theo ngày.
- **Câu đố:** nhân vật hỏi **3 câu liên tiếp**. Mỗi câu chọn 1 trong 3–4 đáp án.
  - Trả lời sai: nhân vật động viên, nút sai rung lên, bé chọn lại. Sai 2 lần ở cùng một câu thì đáp án đúng nhấp nháy để gợi ý, giống `hint` ở các game hiện có.
  - Sao: 0 lần sai được **3 sao**, 1 lần sai được **2 sao**, từ 2 lần sai trở lên được **1 sao**.
  - Đáp án có thể là chữ, emoji, hoặc chữ kèm emoji.
- **Tìm đồ:** "Tìm giúp tớ 3 [món]". Ba món giống nhau được rải ở 3 chỗ giấu.
  - Nhặt được món nào thì có tiếng vui, món đồ bay lên thanh việc và bộ đếm tăng `1/3`.
  - Đủ 3 món thì quay về nhân vật nhận **3 sao**.
- **Thưởng hoàn thành:** làm xong cả 4 việc thì được **+3 sao**, có màn ăn mừng nhỏ (pháo giấy, Kuromi reo).
- **Tổng một ngày tối đa: 4×3+3 = 15 sao.**
- **Sau khi xong:** hôm đó làng vẫn vào đi dạo được, nhân vật chỉ nói câu thoại chúc mừng, không kiếm thêm sao. Kuromi nói "Mai quay lại nha!".
- **Bỏ dở:** thoát giữa chừng một bộ câu đố thì lần sau nhân vật hỏi lại từ đầu (cùng 3 câu đó). Đồ đã nhặt thì vẫn giữ.

### Kho câu đố và cách chọn mỗi ngày

- **File mới** `js/xmas-quiz.js` (hoặc tên tương tự) chứa **khoảng 80–100 câu** đố vui viết sẵn bằng tiếng Việt, hợp với trẻ 5–8 tuổi. Mỗi câu có dạng `{id, q, choices:[...], a}`.
  - Chủ đề *(mình quyết)*: Giáng sinh, mùa đông và tuyết, con vật, màu sắc, đồ vật quanh nhà, câu đố mẹo nhẹ nhàng, đếm và cộng trừ trong phạm vi 10.
  - Câu ngắn, mỗi câu dưới khoảng 15 từ để máy đọc rõ. Không có câu có thể gây sợ hãi.
  - Mỗi nhân vật có thể có nhóm câu hợp với mình (tuần lộc hỏi về con vật…), nhưng chỉ là gợi ý, không bắt buộc.
- **Chọn theo ngày, giống nhau trên mọi máy:** xáo kho câu bằng một hạt giống cố định, rồi lấy lần lượt theo số ngày (`dayNum`). Như vậy không lặp câu cho đến khi hết kho, và hai máy cùng một ngày thấy cùng câu hỏi. Chỗ giấu đồ, món đồ và nhân vật nhận việc tìm đồ cũng chọn từ hạt giống là ngày. Thứ tự đáp án có thể xáo theo hạt giống.
- **Đọc to:** khi câu hỏi hiện ra thì đọc câu hỏi bằng speechSynthesis vi-VN, dùng lại cơ chế fallback trong `voice.js` nếu được. Có nút 🔊 để nghe lại. Tôn trọng cài đặt tắt giọng (`S.voice`).

### Giọng nói

- **Lời nhân vật:** thêm vào `LINES` các nhóm như `xmas_santa_hi`, `xmas_santa_done`, `xmas_snowman_hi`, `xmas_reindeer_hi`, `xmas_nutcracker_hi`…
  - Mỗi nhân vật có 1–2 câu chào hoặc nhờ việc và 1 câu cảm ơn khi xong.
  - Câu thoại hợp với tính cách: người tuyết sợ nóng, tuần lộc thích chạy, lính chì nghiêm trang mà vui, ông già Noel hiền hậu cười "hô hô".
- **Kuromi:** thêm các nhóm `xmas_enter` ("Làng Giáng Sinh nè! Đi chào mọi người thôi!"), `xmas_quiz` ("Có câu đố kìa!"), `xmas_quest` ("Có nhiệm vụ kìa!"), `xmas_found` ("Tìm thấy rồi!"), `xmas_all_done` ("Xong hết rồi! Mai quay lại nha!"). Lời đúng hoặc sai thì dùng lại `correct`/`wrong`.
- **Giọng ông già Noel:** `tools/voice-generate.mjs` hiện chỉ dùng một giọng cho mọi dòng. Cần mở rộng để mỗi nhóm lời có thể khai báo giọng riêng, ví dụ thêm thuộc tính `voice` cho nhóm trong `LINES`, hoặc dùng một bảng ánh xạ tiền tố `xmas_santa_` sang voice id `1wg2wOjdEWKA7yQD8Kca`. Cách làm do người viết code chọn. Các nhóm khác vẫn dùng giọng Kuromi như cũ.
- Việc chạy `voice:generate` thật cần `.env` có API key, do người dùng làm. Code phải chạy được khi chưa có mp3, vì `voice.js` sẽ đọc bằng máy.

### Lưu trữ và đồng bộ

- **Field mới** `S.xmas`, đồng bộ qua mây *(mình quyết)*:
  ```
  { day: 'YYYY-MM-DD',          // ngày của tiến độ này
    done: ['santa', ...],       // nhân vật đã xong việc hôm nay
    found: [0, 2],              // chỉ số chỗ giấu đã nhặt hôm nay
    bonus: false }              // đã nhận thưởng hoàn thành chưa
  ```
  Khi vào làng mà `day` khác hôm nay thì reset về rỗng.
- **Gộp (`mergeSave`):** cùng `day` thì hợp (union) `done` và `found`, `bonus` lấy OR. Khác `day` thì lấy bản có ngày mới hơn. Viết test cho `mergeSave`.
- **Sao:** cộng vào `S.stars`, không tăng `S.rounds` hay `S.perfect` *(mình quyết)*. Gọi `touchStreak()` khi bé hoàn thành một việc, để tính chuỗi ngày.
  - Chấp nhận rủi ro nhỏ: nếu hai máy làm cùng một việc trong cùng một ngày trước khi đồng bộ, sao có thể bị cộng hai lần, vì bộ đếm sao tính theo từng máy.
- **Bộ đồ đang mặc trong làng:** lưu theo từng máy (ví dụ thêm vào `LOCAL_ONLY` hoặc lưu `localStorage` riêng) *(mình quyết)*. Nếu bộ đã lưu không còn trong `S.owned` thì quay về `white-dress`.

### Cấu trúc code *(mình quyết; người viết code có thể chỉnh)*

- `js/world3d.js`: lõi dùng chung cho mọi bản đồ. Gồm nạp Three.js và model, scene, camera đi theo, chạm để đi, va chạm, búp bê giấy, nhân vật và dấu `!`, đồ vật để nhặt, vòng render và dọn dẹp.
- `js/xmas.js`: dữ liệu bản đồ Làng Giáng Sinh (bố cục, nhân vật, chỗ giấu), luật việc trong ngày, chọn câu theo ngày, cộng sao, các màn chọn đồ, làng, hộp thoại.
- `js/xmas-quiz.js`: kho câu đố.
- Phần logic thuần (chọn việc trong ngày từ hạt giống, tính sao, reset theo ngày, gộp `S.xmas`) **không được phụ thuộc Three.js hay WebGL**, để test được bằng `node:test`.
- Nếu cần thì thêm CSS vào file CSS hiện có.

### Kiểm thử

- **Unit test:**
  - Chọn việc theo ngày là tất định: cùng ngày thì ra cùng kết quả, ngày khác thì khác, không lặp câu trong N ngày đầu.
  - Tính sao theo số lần sai, thưởng hoàn thành, giới hạn 15 sao/ngày.
  - Reset khi sang ngày.
  - `mergeSave` với `S.xmas`.
  - Kiểm tra kho câu đố: mỗi câu có đáp án nằm trong `choices`, không trùng `id`, độ dài hợp lý.
- **E2E:** thêm vào smoke test việc mở màn chọn đồ và vào làng trên 3 khổ màn hình. Kiểm tra không lỗi console, không cuộn ngang, nút không bị che. Nếu Chrome headless không có WebGL thì phải xử lý được (báo lỗi nhẹ nhàng, không văng app), và test kiểm tra đường đó.
- **Tự thử bằng tay:** chơi trọn một ngày trên khổ iPad và iPhone. Chụp ảnh màn hình đính kèm.

## Để người viết code tự quyết

- Phiên bản Three.js cụ thể (ghim cứng) và cách nạp `GLTFLoader` (import map hay `import()` theo URL đầy đủ).
- Chọn model nào trong kit và bố cục làng chính xác, miễn đúng tinh thần ở trên.
- Thuật toán va chạm và cách đi tới mục tiêu, miễn bé không kẹt.
- Chi tiết giao diện hộp thoại, thanh việc, hiệu ứng ăn mừng (dùng lại style sẵn có của app).
- Cách mở rộng `voice-generate` để hỗ trợ giọng theo nhóm lời.
- Viết nội dung cụ thể của kho câu đố và lời thoại theo các hướng dẫn trên.
