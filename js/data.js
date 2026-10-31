'use strict';
/* Popping Lollipop VJ · data.js: danh sách effect, chế độ trộn, tỉ lệ khung, mẫu chữ */
const ASPECTS = { '16:9': [16, 9], '4:3': [4, 3], '16:10': [16, 10], '9:16': [9, 16], '1:1': [1, 1] };
const DIVS = [[0.25, '1/4'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4']];
const FITS = [{ id: 'contain', name: 'Vừa khung' }, { id: 'cover', name: 'Lấp đầy' }, { id: 'stretch', name: 'Kéo giãn' }];
const TXT_PRESETS = [{ id: 'title', name: 'Rabbit Hole' }, { id: 'queens', name: 'Hai nữ hoàng' }, { id: 'aura', name: 'Aura Battle' }, { id: 'count', name: 'Đếm ngược' }, { id: 'custom', name: 'Chữ riêng' }];
const TXT_STYLES = [{ id: 'royal', name: 'Hoàng gia' }, { id: 'pop', name: 'Kẹo Y2K' }];
const TXT_MOTIONS = [{ id: 'pulse', name: 'Nhấp nhô' }, { id: 'swap', name: 'Đổi màu theo nhịp' }, { id: 'scroll', name: 'Chạy ngang' }, { id: 'still', name: 'Đứng yên' }];
const TXT_POS = [{ id: 'top', name: 'Trên' }, { id: 'center', name: 'Giữa' }, { id: 'bottom', name: 'Dưới' }];
/* bàn trộn: cách lồng deck B lên deck A */
const BLENDS = [
  { id: 'normal', name: 'Mờ dần', op: 'source-over' },
  { id: 'screen', name: 'Lồng sáng', op: 'screen' },
  { id: 'lighter', name: 'Cộng sáng', op: 'lighter' },
  { id: 'multiply', name: 'Lồng tối', op: 'multiply' },
  { id: 'overlay', name: 'Phủ', op: 'overlay' },
  { id: 'difference', name: 'Lệch màu', op: 'difference' }
];
const BLEND_OP = Object.fromEntries(BLENDS.map(b => [b.id, b.op]));
const XF_LENS = [[0, 'Ngay'], [1, '1 nhịp'], [2, '2 nhịp'], [4, '4 nhịp'], [8, '8 nhịp']];
const CUT_EVERY = [[0, 'Tắt'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4']];
const pct = v => Math.round(v * 100) + '%';
const FX = [
  { id: 'zoom', name: 'Zoom nhịp', desc: 'Hình phóng to rồi thu lại theo mỗi nhịp.', c: '--pink', params: [
    { k: 'amt', label: 'Cường độ', min: 0, max: 1, val: 0.5 }, { k: 'decay', label: 'Tốc độ hồi', min: 0, max: 1, val: 0.5 }, { k: 'rot', label: 'Xoay nhẹ', min: 0, max: 1, val: 0 }] },
  { id: 'flash', name: 'Chớp trắng', desc: 'Màn hình chớp sáng ở nhịp nhấn. Có giới hạn an toàn.', c: '--sun', params: [
    { k: 'amt', label: 'Cường độ', min: 0, max: 1, val: 0.6 }, { k: 'every', label: 'Chia nhịp', min: 1, max: 4, step: 1, val: 1, fmt: v => 'mỗi ' + v }, { k: 'tint', label: 'Sắc đỏ', min: 0, max: 1, val: 0 }] },
  { id: 'rgb', name: 'Tách màu RGB', desc: 'Ba kênh màu lệch nhau và lắc theo nhịp.', c: '--aqua', params: [
    { k: 'amt', label: 'Độ lệch', min: 0, max: 1, val: 0.45 }, { k: 'ang', label: 'Hướng', min: 0, max: 360, step: 15, val: 0, fmt: v => v + '°' }, { k: 'wob', label: 'Lắc theo nhịp', min: 0, max: 1, val: 0.6 }] },
  { id: 'glitch', name: 'Glitch', desc: 'Hình vỡ thành các dải, nhiễu ngắn.', c: '--lilac', params: [
    { k: 'amt', label: 'Cường độ', min: 0, max: 1, val: 0.5 }, { k: 'band', label: 'Độ dày dải', min: 0.1, max: 1, val: 0.4 }, { k: 'rate', label: 'Tần suất', min: 0.1, max: 1, val: 0.5 }] },
  { id: 'kaleido', name: 'Kaleidoscope', desc: 'Hình phản chiếu thành hoa văn đối xứng.', c: '--lime', params: [
    { k: 'seg', label: 'Số cánh', min: 3, max: 12, step: 1, val: 6, fmt: v => v }, { k: 'spin', label: 'Tốc độ xoay', min: 0, max: 1, val: 0.3 }, { k: 'zoom', label: 'Phóng', min: 0.6, max: 2, val: 1, fmt: v => v.toFixed(1) + 'x' }] },
  { id: 'trails', name: 'Vệt mờ', desc: 'Hình cũ mờ dần, để lại vệt phía sau.', c: '--pink', params: [
    { k: 'len', label: 'Độ dài vệt', min: 0, max: 0.95, val: 0.7 }, { k: 'drift', label: 'Trôi', min: 0, max: 1, val: 0.3 }, { k: 'fresh', label: 'Độ đậm hình mới', min: 0.2, max: 1, val: 0.6 }] },
  { id: 'hue', name: 'Đổi màu', desc: 'Phủ màu xoay vòng, nhảy màu theo nhịp. Chạy được cả trên iPad.', c: '--sun', params: [
    { k: 'speed', label: 'Tốc độ', min: 0, max: 1, val: 0.4 }, { k: 'mix', label: 'Độ phủ', min: 0.1, max: 1, val: 0.6 }, { k: 'jump', label: 'Nhảy theo nhịp', min: 0, max: 1, val: 0.5 }] },
  { id: 'stutter', name: 'Nhảy cắt', desc: 'Hình lặp lại một đoạn ngắn như đĩa bị nhảy.', c: '--aqua', params: [
    { k: 'len', label: 'Độ dài đoạn', min: 0.1, max: 1, val: 0.5 }, { k: 'rate', label: 'Nhịp cắt', min: 1, max: 4, step: 1, val: 2, fmt: v => ['1 nhịp', '1/2', '1/4', '1/8'][v - 1] }, { k: 'scale', label: 'Phóng khi cắt', min: 0, max: 0.3, val: 0.06 }] },
  { id: 'tunnel', name: 'Hang thỏ', desc: 'Hình lồng vào nhau, rơi xoáy vào trong như rơi xuống hang thỏ.', c: '--violet', ink: true, params: [
    { k: 'depth', label: 'Độ sâu', min: 0.3, max: 0.95, val: 0.8 }, { k: 'spin', label: 'Xoáy', min: 0, max: 1, val: 0.4 }, { k: 'size', label: 'Độ co', min: 0, max: 1, val: 0.4 }] },
  { id: 'drink', name: 'Drink Me / Eat Me', desc: 'Nhịp lẻ co nhỏ, nhịp chẵn phóng to, như Alice uống thuốc rồi ăn bánh.', c: '--red', ink: true, params: [
    { k: 'amt', label: 'Cường độ', min: 0, max: 1, val: 0.55 }, { k: 'speed', label: 'Độ gắt', min: 0, max: 1, val: 0.5 }, { k: 'bg', label: 'Hình nền mờ', min: 0, max: 1, val: 0.35 }] },
  { id: 'mirror', name: 'Gương soi', desc: 'Đối xứng trái phải, trên dưới hoặc 4 góc.', c: '--aqua', params: [
    { k: 'mode', label: 'Kiểu', min: 1, max: 3, step: 1, val: 1, fmt: v => ['Trái phải', 'Trên dưới', '4 góc'][v - 1] }, { k: 'flip', label: 'Đảo theo nhịp', min: 0, max: 1, step: 1, val: 1, fmt: v => v ? 'Bật' : 'Tắt' }] },
  { id: 'shake', name: 'Rung nhịp', desc: 'Màn hình rung giật ở mỗi nhịp.', c: '--pink', params: [
    { k: 'amt', label: 'Cường độ', min: 0, max: 1, val: 0.5 }, { k: 'decay', label: 'Tắt nhanh', min: 0, max: 1, val: 0.5 }, { k: 'rot', label: 'Nghiêng', min: 0, max: 1, val: 0.4 }] },
  { id: 'invert', name: 'Âm bản', desc: 'Đảo màu theo nhịp. Có giới hạn an toàn chớp sáng.', c: '--lilac', params: [
    { k: 'every', label: 'Chia nhịp', min: 1, max: 4, step: 1, val: 2, fmt: v => 'mỗi ' + v }, { k: 'len', label: 'Thời lượng', min: 0.1, max: 0.9, val: 0.4 }] },
  { id: 'pixel', name: 'Vỡ điểm ảnh', desc: 'Hình vỡ thành ô vuông lớn, đập theo nhịp.', c: '--lime', params: [
    { k: 'size', label: 'Cỡ ô', min: 0, max: 1, val: 0.35 }, { k: 'beat', label: 'Đập theo nhịp', min: 0, max: 1, val: 0.6 }] },
  { id: 'wave', name: 'Sóng méo', desc: 'Hình uốn lượn như nhìn qua mặt nước.', c: '--aqua', params: [
    { k: 'amp', label: 'Độ méo', min: 0, max: 1, val: 0.45 }, { k: 'freq', label: 'Mật độ sóng', min: 0, max: 1, val: 0.4 }, { k: 'speed', label: 'Tốc độ', min: 0, max: 1, val: 0.5 }] },
  { id: 'cards', name: 'Bài Đỏ Đen', desc: 'Hình chỉ còn đỏ, đen, trắng như in trên lá bài. Đảo phe Đỏ Trắng theo nhịp.', c: '--red', ink: true, params: [
    { k: 'thr', label: 'Ngưỡng', min: 0, max: 1, val: 0.45 }, { k: 'detail', label: 'Độ nét', min: 0, max: 1, val: 0.6 }, { k: 'swap', label: 'Đảo theo nhịp', min: 0, max: 1, step: 1, val: 1, fmt: v => v ? 'Bật' : 'Tắt' }] }
];
const FXD = Object.fromEntries(FX.map(f => [f.id, f]));
const FX_ORDER = ['cards', 'hue', 'drink', 'zoom', 'shake', 'mirror', 'kaleido', 'wave', 'tunnel', 'pixel', 'rgb', 'glitch', 'stutter', 'trails', 'invert', 'flash'];
const DROP_SET = new Set(['zoom', 'rgb', 'shake', 'flash']);
const KEYS = ['1', '2', '3', '4', 'q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];
