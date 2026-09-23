# Quyết Định & Quy Tắc Dành Cho AI (Agent Rules)

## ⛔ NGUYÊN TẮC BẮT BUỘC: KHÔNG TỰ Ý CHẠY LỆNH BUILD, TEST, HOẶC CHẠY LẠI DỰ ÁN

1. **Tuyệt đối KHÔNG tự động chạy lệnh:**
   - AI KHÔNG ĐƯỢC tự ý thực thi hoặc đề xuất chạy các lệnh build, test, tsc, dev server (ví dụ: `npm run build`, `pnpm build`, `tsc`, `npm test`, `pnpm test`, `npm run dev`, `pnpm start`, v.v.) sau khi thực hiện sửa code.
   - Trừ trường hợp người dùng ra lệnh cụ thể bằng văn bản yêu cầu thực hiện chạy lệnh terminal nào đó.

2. **Người dùng tự kiểm tra (User-Verified Testing):**
   - Quá trình chạy build, chạy dev server, kiểm thử và verify kết quả do NGƯỜI DÙNG TỰ THỰC HIỆN trực tiếp trên terminal của họ.

3. **Phạm vi trách nhiệm của AI:**
   - AI CHỈ tập trung vào việc đọc hiểu code, phân tích và sửa mã nguồn (Code editing) theo đúng yêu cầu.
   - Sau khi hoàn thành việc sửa đổi file, AI chỉ cần thông báo ngắn gọn các file đã thay đổi và tóm tắt nội dung chỉnh sửa để người dùng tự kiểm tra.
