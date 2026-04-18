/** Mẹo / hướng dẫn ngắn — dùng trong sidebar “Mẹo & hướng dẫn” (gợi ý nhanh, xáo trộn ngẫu nhiên). */
export const NEWS_GUIDE_TIPS: string[] = [
  'Trên bảng tin Home, bạn có thể thích và bình luận bài viết như mạng xã hội; tin “Tin tức” là kênh riêng cho bản tin AI.',
  'Bật “Auto post” trong AI Auto Post để cron định kỳ tạo bài; nút “Lưu cài đặt” chỉ lưu cấu hình, không gọi AI.',
  '“Chạy ngay” gửi yêu cầu tới dịch vụ Project (LLM). Nếu RabbitMQ hoặc API key lỗi, sẽ không lưu bài mẫu thay cho nội dung AI.',
  'Mẫu nội dung (template) là hướng dẫn cho AI, không phải bài đăng thành phẩm — đừng nhầm với nội dung hiển thị cho người đọc.',
  'Ưu tiên câu mẫu có biến {{topic}} để AI luôn có ngữ cảnh rõ khi sinh bài.',
  'Với dự án Kanban: kéo thả thẻ giữa cột để cập nhật trạng thái; mô tả thẻ có thể gợi ý bằng AI trong chi tiết thẻ.',
  'Tin tức lưu ở collection NewsArticle — tách biệt Post trên feed, tránh trộn hai luồng nội dung.',
  'Khi chỉnh sửa bài tin trong trang admin, thay đổi áp dụng ngay cho người xem trang Tin tức.',
  'Đặt “Chu kỳ phút” hợp lý (ví dụ 60+) để tránh gọi LLM quá dày và tốn quota.',
  'Nếu bài gen ra quá ngắn hoặc lặp mẫu, thử đổi template sang yêu cầu cụ thể hơn (độ dài, giọng văn, đối tượng đọc).',
  'Theo dõi người dùng trong cột phải Home dựa trên tương tác trên feed hiện tại — khác với danh sách tin AI.',
  'Đăng xuất và đăng nhập lại nếu thông báo 401 khi tải tin; cookie refresh có thể hết hạn.',
  'Profile có đường dẫn /profile/[id] — dùng để chia sẻ trang cá nhân nhanh.',
  'Làm mới trang Home để sidebar chọn thêm gợi ý ngẫu nhiên khác.',
];

export function pickRandomNewsTips(count: number): string[] {
  const pool = [...NEWS_GUIDE_TIPS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = Math.max(1, Math.min(count, pool.length));
  return pool.slice(0, n);
}
