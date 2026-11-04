# Cài đặt sao lưu tiến độ lên Firebase

Hướng dẫn này dành cho phụ huynh, không cần biết lập trình. Làm một lần là xong. Gói miễn phí (Spark) của Firebase là đủ, không cần nhập thẻ thanh toán.

Nếu bạn chưa điền cấu hình (bước 5), mục "☁️ Sao lưu" trong game sẽ tự ẩn và game chạy như bình thường, chỉ lưu trên máy.

## Năm bước cài đặt

### Bước 1. Tạo dự án Firebase và lấy đoạn cấu hình

1. Mở https://console.firebase.google.com và đăng nhập bằng tài khoản Google của bạn.
2. Bấm **Create a project** (Tạo dự án), đặt tên tuỳ ý (ví dụ `be-vui-hoc`). Có thể tắt Google Analytics. Bấm tiếp cho đến khi tạo xong.
3. Ở trang chủ dự án, bấm biểu tượng **`</>`** (Web) để thêm một Web app. Đặt tên tuỳ ý, **không** cần bật Firebase Hosting. Bấm **Register app**.
4. Màn hình sẽ hiện một đoạn mã có `const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... }`. Giữ nguyên trang này, hoặc chép đoạn `{ ... }` ra để dùng ở bước 5. Sau này có thể xem lại ở **Project settings** (biểu tượng bánh răng) > **Your apps**.

### Bước 2. Bật đăng nhập bằng Google

1. Ở menu bên trái chọn **Build** > **Authentication**, bấm **Get started**.
2. Mở thẻ **Sign-in method**, chọn **Google**.
3. Bật công tắc **Enable**, chọn email hỗ trợ của bạn, bấm **Save**.

### Bước 3. Cho phép trang web của game đăng nhập

1. Trong **Authentication**, mở thẻ **Settings** > **Authorized domains**.
2. Bấm **Add domain** và nhập đúng: `strongnguyen29.github.io` (chỉ tên miền, không có `https://`, không có `/Minigames`).
3. `localhost` đã có sẵn, dùng khi chạy thử trên máy tính.

### Bước 4. Tạo Firestore và dán luật bảo mật

1. Chọn **Build** > **Firestore Database**, bấm **Create database**.
2. Chọn vị trí máy chủ gần bạn (ví dụ `asia-southeast1`), chọn chế độ **Production mode**, bấm **Create**.
3. Mở thẻ **Rules**, xoá hết nội dung cũ, dán toàn bộ nội dung file `firestore.rules` trong kho mã (cùng nội dung bên dưới), rồi bấm **Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{path=**} {
      allow read, write: if false;
    }
  }
}
```

Luật này chỉ cho mỗi người đọc và ghi dữ liệu của chính mình. Mọi đường dẫn khác bị chặn.

### Bước 5. Dán cấu hình vào game

1. Mở file `js/firebase-config.js` trong kho mã của game.
2. Thay dòng `const FIREBASE_CONFIG=null;` bằng cấu hình đã lấy ở bước 1, đúng dạng này:

```js
const FIREBASE_CONFIG={
  apiKey:"...",
  authDomain:"...",
  projectId:"...",
  storageBucket:"...",
  messagingSenderId:"...",
  appId:"..."
};
```

3. Lưu file, đưa lên GitHub như các thay đổi khác và đợi GitHub Pages cập nhật (vài phút).

Các giá trị này không phải mật khẩu. Người khác thấy cũng không sao, vì dữ liệu đã được luật bảo mật ở bước 4 bảo vệ.

## PWA trên iPhone/iPad là một máy riêng, cần đăng nhập riêng

Khi thêm game ra màn hình chính (PWA), iPhone/iPad lưu dữ liệu tách riêng với Safari. Vì vậy:

- Mở game bằng Safari và mở bằng icon trên màn hình chính là **hai máy khác nhau**.
- Mỗi nơi cần đăng nhập Google riêng một lần. Sau khi đăng nhập, tiến độ sẽ được kéo về từ mây.
- Đây là hành vi bình thường của iOS, không phải lỗi.

## Tuỳ chọn: nếu đăng nhập trên Safari không quay lại được

Chỉ làm khi trên Safari iPad bấm đăng nhập xong mà không quay về game, hoặc báo lỗi. Nguyên nhân là Safari chặn lưu trữ giữa hai tên miền khác nhau (`*.firebaseapp.com` và `strongnguyen29.github.io`). Cách sửa: đặt các trang hỗ trợ đăng nhập của Firebase ngay trên `strongnguyen29.github.io`, rồi đổi `authDomain`.

1. Tải các file hỗ trợ đăng nhập của Firebase về, giữ đúng tên:
   - `https://<authDomain-cũ>/__/auth/handler`
   - `https://<authDomain-cũ>/__/auth/handler.js`
   - `https://<authDomain-cũ>/__/auth/experiments.js`
   - `https://<authDomain-cũ>/__/auth/iframe`
   - `https://<authDomain-cũ>/__/auth/iframe.js`

   (`<authDomain-cũ>` là giá trị `authDomain` hiện tại, dạng `ten-du-an.firebaseapp.com`.) Thêm đuôi `.html` khi lưu hai file `handler` và `iframe`, rồi đặt cả năm file vào thư mục `__/auth/` ở gốc của kho mã game.
2. Đảm bảo GitHub Pages phục vụ thư mục bắt đầu bằng gạch dưới `__`. Nếu không, thêm một file rỗng tên `.nojekyll` ở gốc kho mã.
3. Trong `js/firebase-config.js` đổi `authDomain` thành `strongnguyen29.github.io`.
4. Vì game nằm ở `/Minigames/`, đường dẫn thực tế sẽ là `strongnguyen29.github.io/Minigames/__/auth/...`. Firebase cần `/__/auth/` ở **gốc tên miền**. Nếu bạn không có kho `strongnguyen29.github.io` riêng để đặt thư mục này ở gốc, cách này không dùng được. Khi đó hãy nhờ người biết lập trình xem xét.
5. Trong Google Cloud Console > **APIs & Services** > **Credentials**, mở OAuth client của Web app và thêm `https://strongnguyen29.github.io/__/auth/handler` vào **Authorized redirect URIs**.
6. Lưu, đưa lên GitHub, đợi cập nhật rồi thử lại danh sách kiểm tra bên dưới.

## Danh sách kiểm tra trên thiết bị

Chạy từng mục trên **từng** nơi sau: Safari iPad (tab thường), Safari iPad (PWA mở từ màn hình chính), Chrome Android. Ghi lại mục nào đạt, mục nào không.

1. **Đăng nhập.** Vào Cài đặt > "☁️ Sao lưu", bấm đăng nhập bằng Google. Chọn tài khoản. Quay lại game và thấy đã đăng nhập (hiện email hoặc trạng thái đã sao lưu).
2. **Chơi một màn.** Chơi xong một màn để có thêm sao. Đợi vài giây, kiểm tra trạng thái sao lưu báo đã lưu.
3. **Xoá dữ liệu web.** Xoá dữ liệu trang web của game (iPad: Cài đặt > Safari > Nâng cao > Dữ liệu trang web; Android: Chrome > Cài đặt trang > Xoá dữ liệu). Với PWA, xoá icon rồi thêm lại.
4. **Đăng nhập lại và thấy đủ sao.** Mở game, đăng nhập cùng tài khoản. Số sao và vật phẩm phải trở lại đầy đủ như trước khi xoá.
5. **Máy thứ hai thấy tiến độ.** Trên một thiết bị khác, đăng nhập cùng tài khoản và thấy tiến độ từ máy thứ nhất. Chơi thêm một màn ở máy này, rồi mở lại máy thứ nhất và thấy sao đã cộng.
6. **Tắt mạng vẫn chơi được.** Tắt Wi-Fi và dữ liệu di động, mở game và chơi một màn. Game vẫn chạy bình thường, không báo lỗi chặn chơi. Bật mạng lại, đợi vài giây, tiến độ được đẩy lên.

Nếu một mục không đạt, ghi lại thiết bị, trình duyệt (tab hay PWA) và thông báo lỗi nhìn thấy để người phát triển xem xét.
