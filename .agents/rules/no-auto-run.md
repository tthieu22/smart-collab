# Quy định thực thi lệnh và kiểm thử

## Chỉ sửa code - Không tự ý chạy lệnh build, test hay khởi động lại dự án

- **Nguyên tắc**: Khi thực hiện các yêu cầu lập trình, AI tuyệt đối KHÔNG tự ý thực thi các lệnh terminal để build (`pnpm build`, `npm run build`), test (`pnpm test`, `jest`), kiểm tra kiểu (`tsc`), hoặc khởi động lại dev server.
- **Trách nhiệm**: Quá trình chạy thử và test code do người dùng tự chủ động kiểm tra. AI chỉ đảm nhiệm phần đọc, phân tích và sửa đổi code.
- **Ngoại lệ**: Chỉ chạy lệnh terminal khi người dùng chỉ định rõ ràng bằng văn bản.
