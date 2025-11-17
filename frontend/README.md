# AI Image Generator - Frontend

Đây là giao diện người dùng cho ứng dụng AI Image Generator, được xây dựng bằng React, TypeScript, và Vite.

## Tính năng

- Giao diện chat hiện đại để người dùng nhập ý tưởng.
- Tự động tối ưu hóa prompt để tạo ra kết quả tốt nhất.
- Hiển thị ảnh được tạo bởi AI.
- Quản lý lịch sử các cuộc trò chuyện.
- Hệ thống đăng nhập/đăng ký và credit đơn giản (mô phỏng).

## Cài đặt và Chạy

1.  **Yêu cầu:** Cần có Node.js (v18 trở lên).

2.  **Cài đặt thư viện:**
    Từ thư mục `/frontend`, chạy lệnh:
    ```bash
    npm install
    ```

3.  **Cấu hình Biến môi trường (Tùy chọn):**
    Ứng dụng được cấu hình để kết nối đến backend tại `http://localhost:3001/api`. Nếu bạn thay đổi địa chỉ backend, bạn có thể tạo file `.env.local` trong thư mục `/frontend` và chỉ định URL mới:
    ```
    VITE_API_BASE_URL=http://your_new_backend_url/api
    ```

4.  **Chạy máy chủ phát triển:**
    ```bash
    npm run dev
    ```
    Mở trình duyệt và truy cập vào địa chỉ được cung cấp bởi Vite (thường là `http://localhost:5173`).

## Scripts

- `npm run dev`: Khởi động máy chủ phát triển với hot-reload.
- `npm run build`: Build ứng dụng cho môi trường production.
- `npm run preview`: Xem trước bản build production tại local.