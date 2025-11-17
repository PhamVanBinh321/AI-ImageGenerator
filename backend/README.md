# AI Image Generator - Backend

Đây là máy chủ API cho ứng dụng AI Image Generator, được xây dựng bằng Node.js và Express.

## Chức năng

- Cung cấp các API endpoint để:
  - Tối ưu hóa prompt của người dùng.
  - Tạo tiêu đề cho cuộc trò chuyện.
  - Gọi đến Gemini API để tạo ảnh.

## Cài đặt và Chạy

1.  **Yêu cầu:** Cần có Node.js (v18 trở lên).

2.  **Cài đặt thư viện:**
    ```bash
    npm install
    ```

3.  **Cấu hình biến môi trường:**
    Tạo một file tên là `.env` trong thư mục `backend` này. Thêm API Key của bạn vào file đó:
    ```
    API_KEY=your_gemini_api_key_here
    ```
    Thay `your_gemini_api_key_here` bằng key thật của bạn.

4.  **Khởi động Server:**
    ```bash
    npm start
    ```
    Server sẽ khởi động và lắng nghe tại `http://localhost:3001`.