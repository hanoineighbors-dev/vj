# Popping Lollipop VJ

Bàn VJ cho Party DJ, tập trung vào media của bạn: 2 deck A/B có thanh trượt như bàn DJ, 16 effect theo nhịp, chữ trên màn và màn chiếu điều khiển từ xa. Chạy trong trình duyệt, không cần cài đặt.

## Cấu trúc thư mục

```
index.html            Giao diện (bàn điều khiển và màn chiếu dùng chung một trang)
css/app.css           Toàn bộ giao diện, màu, nút
js/util.js            Hàm tiện ích, nhận biết vai trò máy (điều khiển hay màn chiếu)
js/data.js            Danh sách effect, kiểu lồng A/B, tỉ lệ khung, mẫu chữ
js/state.js           Trạng thái app, lưu cài đặt, kho lưu media trong trình duyệt
js/draw.js            Khung hình và các canvas dùng để vẽ
js/media.js           Ảnh, video, thư mục media, bàn trộn 2 deck A/B
js/text.js            Lớp chữ và đồng hồ đếm ngược
js/beat.js            Nhịp: BPM, Tap, mic, chế độ Tự động
js/effects.js         16 effect và quy trình vẽ mỗi khung hình
js/output.js          Cửa sổ Output trên cùng máy, toàn màn hình, giữ màn sáng
js/remote.js          Màn chiếu từ xa: ghép mã, đồng bộ, gửi media
js/ui.js              Giao diện 3 cột (Media, Xem và trộn, Effect), cài đặt, phím tắt
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

## Bàn trộn A/B

- Bấm một media: media vào deck đang ẩn rồi tự trượt sang trong thời gian đã chọn (Ngay, 1, 2, 4, 8 nhịp).
- Giữ Shift khi bấm: thay ngay vào deck đang chiếu.
- Tắt "Bấm media là tự chuyển sang" để tự kéo thanh trượt như DJ.
- Kiểu lồng: Mờ dần, Lồng sáng, Cộng sáng, Lồng tối, Phủ, Lệch màu. Để thanh trượt ở giữa là thấy cả hai lớp.
- Cắt A B theo nhịp: hai deck thay nhau mỗi 1/2, 1, 2 hoặc 4 nhịp.

## Phím tắt

| Phím | Việc |
|---|---|
| 1 2 3 4, Q W E R, A S D F, Z X C V | 16 effect |
| ← → | Media trước, sau |
| Enter | Chuyển A ⇄ B |
| [ ] | Trang media trước, sau |
| Space (giữ) | DROP |
| T | Tap nhịp |
| P | Đóng băng hình |
| B | Blackout |
| H | Về hình an toàn (tắt effect, chữ, blackout) |
| Esc | Đóng cài đặt |
