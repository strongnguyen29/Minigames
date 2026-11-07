# Làng Tết Đinh Mùi 2027 (3D): thiết kế

Ngày: 2026-11-07

## Ý tưởng và lý do

Thêm **bản đồ 3D thứ hai** vào Vương Quốc Vui Vẻ: **Làng Tết Đinh Mùi 2027**, chủ đề Tết cổ truyền Việt Nam. Cách chơi **giống hệt Làng Giáng Sinh** (xem `docs/superpowers/specs/2026-11-06-lang-giang-sinh-3d-design.md`): bé chọn bộ đồ, vào làng, chạm đất để đi, gặp nhân vật, giải đố hoặc đi tìm đồ, được sao, hôm sau có việc mới. Khác biệt nằm ở cảnh và nội dung: **chợ Tết là cảnh chính**, câu đố xoay quanh Tết cổ truyền.

Đây cũng là lần đầu thử điều mà bản thiết kế làng Noel đã chuẩn bị sẵn: thêm bản đồ mới mà không phải viết lại phần lõi.

Ảnh tham khảo người dùng đưa (ảnh 1): một làng Tết chibi gồm cổng chào, chợ Tết, góc gói bánh chưng, đền thờ, vườn hoa đào, sân khấu múa lân. Ảnh 2 (núi Kim Ngân, ao, nông trại) **không làm lần này**.

Thành công nghĩa là: bé có thêm một làng thứ hai muốn vào mỗi ngày, nhìn là nhận ra ngay "đây là chợ Tết", và qua câu đố biết thêm về phong tục Tết.

## Mục tiêu

- Thẻ mới trên trang chủ, mở vào **Làng Tết** 3D đi lại được.
- **Phong cách chibi low-poly**, cùng tông với làng Noel.
- **Chợ Tết nằm giữa làng**, là cảnh nổi bật nhất. Xung quanh có vài góc nhỏ lấy ý từ ảnh 1.
- **4 nhân vật**, mỗi bạn giao một việc mỗi ngày (đố 3 câu hoặc tìm đồ), luật y như làng Noel.
- **Kho câu đố về Tết cổ truyền**.
- Lời nhân vật và lời nhắc của Kuromi được ghi âm, câu hỏi do máy đọc to, giống làng Noel.

## Không làm lần này

- Nội dung ảnh 2: núi, mỏ vàng, ao cầu may, bến thuyền, nông trại.
- Giới hạn theo mùa hay đếm ngược tới Tết. Làng mở quanh năm.
- Cơ chế chơi mới (mua sắm ở chợ, đốt pháo, gói bánh tương tác…). Chỉ có đố và tìm đồ như làng Noel.
- Đổi cách chơi hay giao diện của làng Noel.

## Những điều không được xảy ra

- **Làm hỏng làng Noel.** Nếu tách code dùng chung thì mọi test hiện có của làng Noel phải vẫn qua, dữ liệu `S.xmas` giữ nguyên dạng, và hành vi trong game không đổi.
- Các điều cấm của làng Noel vẫn áp dụng: bé không bị lạc (luôn có dấu `!`/`✓`), không có điều khiển khó, máy không giật hay nóng, không phá cách lưu và đồng bộ.
- **Nội dung sai lệch hoặc gây sợ hãi.** Câu đố về phong tục phải đúng với Tết miền Bắc/miền Nam phổ biến. Câu nào có đáp án khác nhau tùy vùng (ví dụ mâm ngũ quả gồm những quả gì) thì không đố, hoặc chỉ đố phần ai cũng đồng ý. Không có ma quỷ hay chuyện đáng sợ. Đền thờ, bàn thờ (nếu có) chỉ để trang trí, không đố nghi lễ.
- **Lẫn với Tết Trung Quốc.** Ưu tiên chi tiết Việt Nam: bánh chưng/bánh tét, hoa đào, hoa mai, cây quất, câu đối đỏ, ông đồ, áo dài, năm con **Dê** (Việt Nam là Mùi = Dê, không phải Cừu).

## Ràng buộc từ dự án

Như bản thiết kế làng Noel (đọc `CLAUDE.md` trước). Những điểm chính:

- JS thuần, script cổ điển chung một phạm vi toàn cục. File mới phải thêm vào `index.html` đúng thứ tự **và** vào `FILES` của các test cần nó.
- Field mới của `S`: cập nhật `DEF`, `freshSave()`, `load()` và `mergeSave` (`js/merge.js`).
- Lõi 3D là `js/world3d.js` (three.js 0.170.0 qua import map). Logic thuần không phụ thuộc WebGL để test bằng `node:test`.
- Giọng: `LINES` trong `js/lines.js`. Giọng riêng cho từng nhóm qua `LINE_VOICES`. Sinh mp3: `voice:export` → `voice:generate` → `voice:manifest` (người dùng tự chạy, cần `.env`).
- UI, chú thích, tài liệu, tên test bằng tiếng Việt. Commit tiếng Anh theo kiểu conventional commit.

## Những gì người dùng đã quyết định

1. Bản đồ 3D mới chủ đề **Tết cổ truyền 2027**, **phong cách chibi**.
2. **Hoạt động giống làng Noel.**
3. **Chợ Tết là cảnh chủ đạo.**
4. Câu đố về **Tết cổ truyền**.
5. **4 nhân vật: Ông đồ, Cô bán hàng chợ Tết, Chú Lân, Dê con** (linh vật năm Đinh Mùi).
6. **Sao giống làng Noel:** tối đa 15 sao/ngày (4 việc × 3 sao + 3 sao thưởng), **cộng thêm** vào 15 sao của làng Noel.
7. Tham khảo ảnh 1. Ảnh 2 không làm.
8. **Nhạc nền theo chủ đề:** vào làng Tết thì phát bài **"Xuân Sum Vầy"** (đã có trong tiệm âm thanh, miễn phí, nằm trên R2: `songs/xuan-sum-vay.mp3`). **Nhạc riêng cho làng Noel để sau.** Lần này làng Noel vẫn phát nhạc nền chung như cũ.

## Thiết kế chi tiết

Những mục ghi *(mình quyết)* là lựa chọn của người viết tài liệu, người dùng chưa duyệt riêng. Cứ theo đó mà làm, trừ khi có lý do rõ ràng để đổi.

### Luồng màn hình

Giống làng Noel, chỉ đổi chữ, màu và biểu tượng:

1. **Trang chủ:** thẻ `🧧 Làng Tết` đặt ngay sau thẻ Làng Giáng Sinh, dòng phụ hiện tiến độ (`2/4` hoặc `✅`).
2. **Màn chọn đồ:** cùng danh sách bộ đồ như làng Noel. **Dùng chung bộ đồ đã chọn với làng Noel** (cùng khoá localStorage) *(mình quyết)*. Nút "🧧 Vào làng".
3. **Màn làng 3D:** canvas, nút ⬅️, thanh việc (4 biểu tượng nhân vật), ô sao, Kuromi ở góc. Màn chờ: "Kuromi đang dẫn đường…" với biểu tượng 🏮.
4. **Hộp thoại:** dùng lại hộp thoại của làng Noel.
5. **Lỗi WebGL hoặc CDN:** màn "Làng đang ngủ" như làng Noel.

### Thế giới 3D

- **Model:** không có bộ model Tết miễn phí, nên **dựng gần như toàn bộ bằng khối cơ bản của Three.js** (hộp, trụ, nón, cầu, `flatShading`), giống cách `w3Santa` đang làm *(mình quyết)*. Ưu điểm: không phải tải thêm file, kiểm soát được phong cách chibi Việt Nam. Được dùng lại các model có sẵn trong `models/holiday/` nếu hợp, ví dụ `rocks-*`, `bench`, `floor-stone`, `tree` (không phủ tuyết). Không dùng model nào có tuyết.
- **Nền:** đất cỏ xanh, đường đất hoặc đường lát gạch màu be nối các khu. Trời quang, nắng ấm, không có tuyết. Thay hạt tuyết bằng **cánh hoa đào bay nhẹ** (có thể tắt khi máy yếu) *(mình quyết)*.
- **Bố cục** *(mình quyết, người viết code chỉnh được)*: cùng cỡ và hình bầu dục như làng Noel (`bound` khoảng 24×16), camera nhìn từ phía nam.
  - **Giữa làng: chợ Tết.** 4–6 sạp hàng mái ngói đỏ hoặc mái bạt đỏ, xếp thành dãy hoặc hình chữ U. Trên sạp có hàng hoá bằng khối nhỏ: dưa hấu, bánh chưng, quất, hoa, đèn lồng, câu đối. Có dây đèn lồng đỏ căng giữa các sạp. Đây là chỗ đẹp và đông nhất, đứng ở đâu cũng nhìn thấy.
  - **Phía nam (gần camera, chỗ bé vào làng):** **cổng chào Tết** mái ngói, có bảng "Làng Tết 2027" (chữ vẽ bằng canvas texture).
  - **Phía bắc:** **nhà mái ngói đỏ** (1–2 căn), trước nhà có **góc gói bánh chưng**: nồi bánh trên bếp lửa, chồng bánh chưng vuông xanh.
  - **Một bên:** **vườn hoa đào** (vài cây đào hồng), xen vài cây mai vàng.
  - **Bên còn lại:** **sân khấu múa lân** nhỏ: bục đỏ, trống, phông nền.
  - **Rìa làng:** cây xanh, tre, cây quất trong chậu, đá, tạo ranh giới tự nhiên.
  - Trang trí rải rác: chậu quất, chậu mai, đèn lồng treo cột, câu đối đỏ.
  - Đền thờ trong ảnh 1 thì có thể bỏ, hoặc thay bằng một **bàn thờ gia tiên nhỏ trong nhà** chỉ để trang trí *(mình quyết)*.
  - Như làng Noel: nhà và vật to đặt sát rìa bắc để không che đường đi. Chỗ giấu đồ phải nhìn thấy được từ camera.
- **Nhân vật** (dựng bằng khối cơ bản, cao bằng nhân vật làng Noel, cùng hiệu ứng nhún, quay về phía bé, dấu `!`/`✓`):
  - **Ông đồ:** áo dài the màu nâu hoặc xanh đậm, khăn xếp, râu bạc, ngồi hoặc đứng cạnh bàn thấp có giấy đỏ. Đứng gần cổng chào hoặc đầu chợ.
  - **Cô bán hàng chợ Tết:** áo bà ba hoặc áo dài đỏ, nón lá, cạnh một sạp hàng. Đứng trong chợ.
  - **Chú Lân:** đầu lân to tròn nhiều màu (đỏ, vàng), mắt to, thân phủ vải. Đứng trên hoặc cạnh sân khấu múa lân.
  - **Dê con:** dê trắng chibi, sừng nhỏ, có thể đeo khăn hoặc nơ đỏ. Đứng ở vườn hoa đào.
- **Đồ để tìm** (dựng bằng khối, xoay nhẹ và lấp lánh như làng Noel): **bao lì xì** 🧧, **bánh chưng** 🟩, **quả quất** 🍊, **đèn lồng** 🏮, **cành mai** 🌼. Khoảng 12–15 chỗ giấu viết tay *(mình quyết)*.
- **Hiệu năng:** như làng Noel. Dùng chung material, vật lặp nhiều (cây, chậu quất, đèn lồng) thì gộp hoặc vẽ bằng `InstancedMesh`.

### Việc trong ngày, sao, chọn câu

**Y hệt làng Noel**:

- 3 nhân vật đố 3 câu, 1 nhân vật nhờ tìm 3 món. Nhân vật tìm đồ đổi theo ngày.
- Sao đố: 0 sai được 3 sao, 1 sai được 2, từ 2 sai trở lên được 1. Sai 2 lần một câu thì gợi ý.
- Tìm đủ 3 món thì về nhận 3 sao. Xong cả 4 việc thì thưởng +3. **Tối đa 15 sao/ngày**, tính riêng với làng Noel.
- Kế hoạch ngày tất định theo `dayNum`, giống nhau trên mọi máy. Kho câu xáo bằng một hạt cố định **khác với hạt của làng Noel**.
- Bỏ dở bộ đố thì lần sau hỏi lại. Đồ đã nhặt vẫn giữ.
- Xong hết thì vẫn vào đi dạo được. Kuromi nói "Mai quay lại nha!".

### Kho câu đố

- **File mới** `js/tet-quiz.js`, khoảng **80–100 câu**, cùng dạng với `XMAS_QUIZ`: `{id:'tq001', t, q, c:[...], a}`. Cùng quy tắc: id và thứ tự không bao giờ đổi, chỉ thêm vào cuối.
- **Chủ đề** *(mình quyết)*, phần lớn về Tết:
  - Món ăn ngày Tết: bánh chưng, bánh tét, mứt, dưa hấu, hạt dưa, thịt kho…
  - Hoa và cây ngày Tết: hoa đào (miền Bắc), hoa mai (miền Nam), cây quất, cây nêu.
  - Phong tục: lì xì, chúc Tết, mặc quần áo mới, dọn nhà, xông đất, đi chúc Tết ông bà, ông đồ cho chữ, câu đối đỏ, đèn lồng, múa lân, pháo hoa đêm giao thừa.
  - Lời chúc và cách cư xử dễ thương: nhận lì xì bằng hai tay, nói lời cảm ơn, chúc ông bà sống lâu…
  - Con giáp và năm **Đinh Mùi** (con Dê): có bao nhiêu con giáp, năm 2027 là năm con gì, dê kêu thế nào…
  - Ông Công ông Táo và cá chép: chỉ ở mức đơn giản, vui vẻ.
  - Một ít đếm và cộng trừ trong phạm vi 10, theo chủ đề Tết (bao lì xì, bánh chưng, quả quất…), khoảng 10–15 câu.
- Câu ngắn (dưới khoảng 15 từ), 3 đáp án, đáp án có thể kèm emoji. Tuân thủ các điều cấm về nội dung ở trên.
- **Người dùng không duyệt kho câu**, người viết code tự kiểm. Vì câu đã phát hành không xoá hay đổi thứ tự được, trước khi gộp phải tự soát lại từng câu và từng lời thoại theo các điều cấm ở trên. Có thể nhờ một agent review riêng chỉ để soát nội dung.
- **Không viết "năm nay"**, luôn viết rõ "năm 2027", vì làng mở quanh năm và còn dùng sang năm sau *(mình quyết)*.
- **Những phần gắn với năm 2027** (năm, chữ trên cổng chào, linh vật Dê con) để thành dữ liệu trong đối tượng mô tả làng, không viết cứng rải rác. Như vậy năm sau đổi chủ đề dễ dàng *(mình quyết)*.

### Giọng nói

- Thêm vào `LINES` các nhóm lời theo mẫu làng Noel, tiền tố `tet_`:
  - Kuromi: `tet_outfit`, `tet_enter` ("Chợ Tết đông vui quá! Đi chào mọi người thôi!"), `tet_quiz`, `tet_quest`, `tet_found`, `tet_all_done`.
  - Nhân vật: `tet_ongdo_hi/thanks`, `tet_seller_hi/thanks`, `tet_lion_hi/thanks`, `tet_goat_hi/thanks`. Mỗi nhóm 2 câu, hợp tính cách: ông đồ hiền, chậm rãi, hay nói về chữ; cô bán hàng niềm nở mời mua; chú Lân sôi nổi "tùng tùng cắc"; dê con hồn nhiên "be be".
- **Giọng** *(mình quyết)*: Ông đồ dùng giọng ông già `1wg2wOjdEWKA7yQD8Kca` (đang dùng cho ông già Noel) qua `LINE_VOICES`. Ba nhân vật còn lại và Kuromi dùng giọng Kuromi.
- Code phải chạy được khi chưa có mp3 (đọc bằng giọng máy). Người dùng tự chạy `voice:generate`.

### Nhạc nền

- Hiện cả app phát một bản nhạc nền chung (`audio/music/kuromi-lofi.m4a`, `js/music.js`). Thêm khả năng **mỗi màn có thể khai báo bản nhạc riêng** theo lớp CSS của màn (ví dụ `vil-tet`).
- **Làng Tết** (cả màn chọn đồ lẫn màn làng 3D) phát "Xuân Sum Vầy", lấy từ R2 qua `AUDIO_CDN` giống tiệm âm thanh, phát lặp lại. Về trang chủ thì trở lại nhạc nền chung.
- Giữ nguyên các hành vi hiện có: nhạc **nhỏ lại khi Kuromi hoặc nhân vật nói** (bài có lời, nên phải chắc giọng đọc câu đố vẫn nghe rõ), tôn trọng nút tắt nhạc `S.music`, dừng khi tab bị ẩn.
- R2 có trả CORS cho GitHub Pages và localhost. Thẻ audio phải đặt `crossOrigin='anonymous'`, nếu không Web Audio (dùng để chỉnh âm lượng trên iOS) sẽ chỉ nhận được im lặng *(mình quyết)*.
- Nếu tải bài Tết lỗi (mất mạng, CDN lỗi) thì quay về nhạc nền chung, không để im lặng hay báo lỗi *(mình quyết)*.
- Nghe nhạc nền trong làng **không tính vào phút nghe miễn phí** của tiệm âm thanh *(mình quyết)*.

### Lưu trữ và đồng bộ

- **Field mới `S.tet`**, cùng dạng với `S.xmas`: `{day:'', done:[], found:[], bonus:false}`. Cập nhật `DEF`, `freshSave()`, `load()`.
- **Gộp:** cùng luật với `mergeXmas` (cùng ngày thì hợp, khác ngày thì lấy ngày mới hơn). Nên dùng chung một hàm gộp cho cả hai field. Viết test.
- Sao cộng vào `S.stars`, gọi `touchStreak()`, không tăng `rounds`/`perfect`, như làng Noel.

### Cấu trúc code

Mục tiêu: **phần chung của hai làng chỉ viết một lần.** Hiện `js/xmas.js` và `js/xmas-ui.js` gắn chặt với làng Noel (`XMAS_*`, `S.xmas`, id phần tử `#x...`).

Hướng đề xuất *(mình quyết, người viết code chỉnh được)*:

- Tách phần logic và giao diện chung (kế hoạch ngày, trạng thái theo ngày, nhận việc, phiên đố, tính sao, chọn đồ, màn làng, hộp thoại, thanh việc, nhặt đồ, ăn mừng) thành code nhận vào **một đối tượng mô tả làng**: id, tên, biểu tượng, field trong `S`, danh sách nhân vật, đồ để tìm, chỗ giấu, kho câu, hạt xáo, tiền tố nhóm lời, bản đồ, hàm dựng cảnh và nhân vật.
- Làng Noel và làng Tết chỉ còn là dữ liệu cộng hàm dựng cảnh riêng. Ví dụ `js/xmas*.js` giữ phần riêng của Noel, thêm `js/tet.js` (dữ liệu, bố cục, dựng model khối) và `js/tet-quiz.js`.
- Giữ các tên toàn cục mà test và e2e đang dùng (`xmasPlan`, `xmasTalk`, `xmasState`…) hoặc cập nhật test cho khớp, miễn hành vi làng Noel không đổi.
- Nếu tách chung quá rủi ro thì được phép làm theo cách nhân bản file của làng Noel cho làng Tết. Phải ghi rõ lý do trong PR.
- Hàm dựng model khối cho làng Tết (nhà mái ngói, sạp chợ, đèn lồng, cây đào, nhân vật…) nên để trong một file riêng, không nhét vào `world3d.js`. `world3d.js` chỉ thêm những gì dùng chung cho mọi bản đồ (ví dụ cho phép thay hạt tuyết bằng hạt khác, đổi màu nền và trời).

### Kiểm thử

- **Unit test:** như làng Noel, áp cho làng Tết: kế hoạch ngày tất định, không lặp câu trong N ngày đầu, tính sao và giới hạn 15 sao/ngày, reset khi sang ngày, gộp `S.tet`, kiểm tra kho câu (đáp án hợp lệ, không trùng id, độ dài hợp lý), các nhóm lời `tet_*` có đủ. **Toàn bộ test làng Noel hiện có vẫn qua.**
- Kế hoạch ngày của hai làng độc lập: cùng ngày nhưng hai làng ra câu hỏi khác nhau.
- **E2E:** thêm bước mở Làng Tết vào `tests/e2e/smoke.mjs` giống bước làng Noel (chọn đồ, vào làng, mở một câu đố) trên 3 khổ màn hình. Bước làng Noel vẫn qua.
- **Tự thử bằng tay:** chơi trọn một ngày ở làng Tết trên khổ iPad và iPhone, chụp ảnh màn hình, xem đi xem lại để chắc nhìn ra chợ Tết và phong cách chibi.

## Để người viết code tự quyết

- Bố cục chính xác, số sạp, màu sắc và chi tiết từng model khối, miễn đúng tinh thần ở trên và nhìn ra chợ Tết.
- Cách tách code chung giữa hai làng.
- Nội dung cụ thể của kho câu đố và lời thoại, theo các hướng dẫn trên.
- Biểu tượng emoji cho từng nhân vật trên thanh việc (gợi ý: 👴 Ông đồ, 👩 Cô bán hàng, 🦁 Chú Lân, 🐐 Dê con).
