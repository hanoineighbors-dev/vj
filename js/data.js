'use strict';
/* Popping Lollipop VJ · data.js */
/* ---------- constants ---------- */
const ASPECTS = { '16:9': [16, 9], '4:3': [4, 3], '16:10': [16, 10], '9:16': [9, 16], '1:1': [1, 1] };
const DIVS = [[0.25, '1/4'], [0.5, '1/2'], [1, '1'], [2, '2'], [4, '4']];
const SHAPES = [{ id: 'circle', name: 'Tròn' }, { id: 'square', name: 'Vuông' }, { id: 'sparkle', name: 'Sao Y2K' }, { id: 'heart', name: 'Tim' }, { id: 'bubble', name: 'Bong bóng' }, { id: 'ring', name: 'Vòng' },
  { id: 'card', name: 'Lá bài' }, { id: 'clock', name: 'Đồng hồ' }, { id: 'rabbit', name: 'Thỏ' }, { id: 'key', name: 'Chìa khoá' }];
const MOTIONS = [{ id: 'rotate', name: 'Xoay' }, { id: 'pulse', name: 'Nhấp nhô' }, { id: 'orbit', name: 'Quay quanh' }, { id: 'bounce', name: 'Nảy' }, { id: 'wave', name: 'Sóng' }, { id: 'spiral', name: 'Xoắn ốc' }];
const MULTIS = [{ id: 'grid', name: 'Lưới' }, { id: 'circle', name: 'Vòng tròn' }, { id: 'tunnel', name: 'Đường hầm' }, { id: 'mirror', name: 'Gương' }];
const CTLS = [{ id: '0.25', name: '1/4 nhịp' }, { id: '0.5', name: '1/2 nhịp' }, { id: '1', name: '1 nhịp' }, { id: '2', name: '2 nhịp' }, { id: '4', name: '4 nhịp' }, { id: 'free', name: 'Trôi tự do' }];
const PALS = [
  { name: 'Kẹo pastel', bg: ['#FFD1EA', '#D6C8FF'], c: ['#FF4FA3', '#FFD447', '#38D6EE', '#8A6BFF', '#B6F23A'] },
  { name: 'Chrome bạc', bg: ['#E4E9F6', '#98A2C0'], c: ['#FFFFFF', '#C5CDE3', '#8892B0', '#F3F6FF', '#6F7AA0'] },
  { name: 'Acid neon', bg: ['#1B1235', '#3A1D6B'], c: ['#B6F23A', '#FF3D9E', '#2DE6FF', '#FFE14D', '#A26BFF'] },
  { name: 'Hồng nóng', bg: ['#FF9BD1', '#FF4FA3'], c: ['#FFFFFF', '#FFE3F1', '#8A0E52', '#FFD447', '#FFB6DD'] },
  { name: 'Xanh nhựa', bg: ['#A8F0FF', '#4FB5FF'], c: ['#FFFFFF', '#0E5DD8', '#B6F23A', '#FF4FA3', '#E4FBFF'] },
  { name: 'Hoàng hôn', bg: ['#FFE29A', '#FF7EB6'], c: ['#FF4F5E', '#FFFFFF', '#8A6BFF', '#FFB13D', '#FF4FA3'] },
  { name: 'Đỏ Đen Trắng', bg: ['#0B0709', '#3A0610'], c: ['#E8173A', '#FFFFFF', '#B30D2B', '#F6EEE3', '#FF4A63'] },
  { name: 'Nữ hoàng Trắng', bg: ['#FBF8F3', '#D8D2CB'], c: ['#141014', '#E8173A', '#FFFFFF', '#8E8780', '#2B2447'] },
  { name: 'Hang thỏ', bg: ['#12081F', '#0B2A2A'], c: ['#9B5CFF', '#2EE6C5', '#FF4FA3', '#FFD447', '#FFFFFF'] },
  { name: 'Tiệc trà', bg: ['#FBE7D9', '#E7D7F7'], c: ['#E07A9A', '#7FB7A5', '#F2C14E', '#8E6CCB', '#FFFFFF'] }
];
const STICKERS = [
  { id: 'rabbit', name: 'Thỏ trắng' }, { id: 'clock', name: 'Đồng hồ' }, { id: 'cardh', name: 'Lá bài cơ' }, { id: 'cards', name: 'Lá bài bích' },
  { id: 'teacup', name: 'Tách trà' }, { id: 'key', name: 'Chìa khoá' }, { id: 'crown', name: 'Vương miện' }, { id: 'drinkme', name: 'Drink Me' },
  { id: 'sparkle', name: 'Sao lấp lánh' }, { id: 'heart', name: 'Tim' }, { id: 'smile', name: 'Mặt cười' }, { id: 'wow', name: 'WOW' },
  { id: 'cd', name: 'Đĩa CD' }, { id: 'lolli', name: 'Kẹo mút' }, { id: 'bubble', name: 'Bong bóng' }];
const SMOTIONS = [{ id: 'bounce', name: 'Nảy' }, { id: 'shake', name: 'Lắc' }, { id: 'spin', name: 'Xoay' }, { id: 'pulse', name: 'Nhấp nhô' }, { id: 'still', name: 'Đứng yên' }];
const FITS = [{ id: 'contain', name: 'Vừa khung' }, { id: 'cover', name: 'Lấp đầy' }, { id: 'stretch', name: 'Kéo giãn' }];
const TXT_PRESETS = [{ id: 'title', name: 'Rabbit Hole' }, { id: 'queens', name: 'Hai nữ hoàng' }, { id: 'aura', name: 'Aura Battle' }, { id: 'count', name: 'Đếm ngược' }, { id: 'custom', name: 'Chữ riêng' }];
const TXT_STYLES = [{ id: 'royal', name: 'Hoàng gia' }, { id: 'pop', name: 'Kẹo Y2K' }];
const TXT_MOTIONS = [{ id: 'pulse', name: 'Nhấp nhô' }, { id: 'swap', name: 'Đổi màu theo nhịp' }, { id: 'scroll', name: 'Chạy ngang' }, { id: 'still', name: 'Đứng yên' }];
const TXT_POS = [{ id: 'top', name: 'Trên' }, { id: 'center', name: 'Giữa' }, { id: 'bottom', name: 'Dưới' }];
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
const BANKS = {
  fx: FX.map(f => ({ t: 'fx', id: f.id })),
  scene: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ t: 'gen', i }))
    .concat([0, 1, 2].map(i => ({ t: 'med', i })), [{ t: 'stk' }], ['title', 'queens', 'aura', 'count'].map(id => ({ t: 'txt', id })))
};
const DEFAULT_GENS = [
  { name: 'Sao xoay', g: { shape: 'sparkle', motion: 'rotate', multi: 'grid', pal: 0, size: 0.8, count: 5, speed: 0.5, ctl: '2' } },
  { name: 'Hầm bong bóng', g: { shape: 'bubble', motion: 'pulse', multi: 'tunnel', pal: 4, size: 0.9, count: 8, speed: 0.5, ctl: '1' } },
  { name: 'Tim nảy', g: { shape: 'heart', motion: 'bounce', multi: 'grid', pal: 3, size: 0.75, count: 4, speed: 0.5, ctl: '1' } },
  { name: 'Gương kẹo', g: { shape: 'circle', motion: 'orbit', multi: 'mirror', pal: 2, size: 0.7, count: 5, speed: 0.5, ctl: '0.5' } },
  { name: 'Nữ hoàng Đỏ', g: { shape: 'card', motion: 'rotate', multi: 'circle', pal: 6, size: 0.8, count: 5, speed: 0.5, ctl: '2' } },
  { name: 'Nữ hoàng Trắng', g: { shape: 'card', motion: 'wave', multi: 'grid', pal: 7, size: 0.7, count: 6, speed: 0.5, ctl: '2' } },
  { name: 'Hang thỏ', g: { shape: 'clock', motion: 'spiral', multi: 'tunnel', pal: 8, size: 0.95, count: 9, speed: 0.5, ctl: '1' } },
  { name: 'Tiệc trà', g: { shape: 'rabbit', motion: 'bounce', multi: 'grid', pal: 9, size: 0.75, count: 5, speed: 0.5, ctl: '1' } }
];
const SAFE_GEN = 6;
