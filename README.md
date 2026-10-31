# Popping Lollipop VJ

Bộ đồ chơi visual cho Party DJ. Chạy trong trình duyệt, không cần cài đặt.

## Cấu trúc thư mục

```
index.html            Giao diện (bàn điều khiển và màn chiếu dùng chung một trang)
css/app.css           Toàn bộ giao diện, màu, nút
js/util.js            Hàm tiện ích, nhận biết vai trò máy (điều khiển hay màn chiếu)
js/data.js            Danh sách effect, hình, bảng màu, sticker, công thức pad
js/state.js           Trạng thái app, lưu cài đặt, kho lưu media trong trình duyệt
js/draw.js            Vẽ hình khối, sticker, Generator Studio
js/media.js           Ảnh, video, thư mục media, sticker riêng
js/text.js            Lớp chữ và đồng hồ đếm ngược
js/beat.js            Nhịp: BPM, Tap, mic, chế độ Tự động
js/effects.js         16 effect và quy trình vẽ mỗi khung hình
js/output.js          Cửa sổ Output trên cùng máy, toàn màn hình, giữ màn sáng
js/remote.js          Màn chiếu từ xa: ghép mã, đồng bộ, gửi media
js/ui.js              Núm vặn, pad, các tab, phím tắt
js/main.js            Vòng lặp vẽ và khởi động
vendor/               Thư viện kết nối (PeerJS) và mã QR
icons/, manifest.webmanifest   Biểu tượng khi thêm vào Màn hình chính
```

## Chạy

- **Trên web (khuyên dùng):** mở địa chỉ GitHub Pages của repo.
- **Trên máy:** mở `index.html` bằng Chrome. Màn chiếu từ xa vẫn cần internet để ghép mã.

## Hai vai trò

- **Bàn điều khiển:** mở địa chỉ bình thường.
- **Màn chiếu:** thêm `#man-chieu` vào cuối địa chỉ, hoặc quét mã QR ở tab Màn chiếu.

## Media

- **Thêm từng file:** được lưu trong trình duyệt của máy đó. Mở lại app vẫn còn, miễn là cùng trình duyệt và cùng địa chỉ.
- **Chọn thư mục media (Chrome trên Mac):** app đọc thẳng từ thư mục, nhớ thư mục cho lần sau. Đặt tên file 01, 02, 03... để xếp thứ tự pad.
- Màn chiếu tự nhận media từ bàn điều khiển và lưu lại, lần sau không phải gửi lại.

## Phím tắt

| Phím | Việc |
|---|---|
| 1 2 3 4, Q W E R, A S D F, Z X C V | 16 pad |
| ` | Đổi bàn pad: Effect, Cảnh, Media |
| [ ] | Trang media trước, sau |
| Space (giữ) | DROP |
| T | Tap nhịp |
| P | Đóng băng hình |
| B | Blackout |
| H | Về hình an toàn |
