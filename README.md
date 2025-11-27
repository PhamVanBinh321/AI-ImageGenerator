# AI Image Generator - Ứng dụng LLM tạo hình ảnh từ văn bản

Ứng dụng web hiện đại sử dụng Google Gemini LLM để tối ưu hóa prompt và tạo hình ảnh từ văn bản. Giao diện chat thân thiện, tương tự ChatGPT, cho phép người dùng mô tả ý tưởng và nhận được hình ảnh được tạo bởi AI.

## 🚀 Tính năng

- **Tối ưu hóa Prompt tự động**: LLM phân tích và tối ưu hóa prompt của người dùng để tạo ra kết quả tốt nhất
- **Tạo hình ảnh AI**: Sử dụng Google Imagen API để tạo hình ảnh từ prompt đã tối ưu
- **Quản lý phiên chat**: Lưu trữ và quản lý nhiều cuộc trò chuyện
- **Hệ thống Credit**: Mỗi user có 10 credits ban đầu, mỗi ảnh tốn 1 credit
- **Tùy chỉnh ảnh**: Hỗ trợ nhiều tỷ lệ khung hình (1:1, 3:4, 4:3, 9:16, 16:9) và số lượng ảnh (1-4)
- **Giao diện hiện đại**: Dark mode với hiệu ứng glassmorphism, responsive design

## 📁 Cấu trúc dự án

```
Thuctaptotnghiep/
├── backend/          # Backend API (Node.js/Express)
│   ├── models/      # MongoDB schemas
│   ├── routes/      # API routes
│   ├── middleware/  # Authentication middleware
│   ├── db.js        # MongoDB connection
│   └── server.js    # Main server file
├── frontend/        # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API clients & services
│   │   ├── types.ts     # TypeScript types
│   │   └── App.tsx      # Main app component
│   └── package.json
└── README.md
```

## 🛠️ Yêu cầu hệ thống

- **Node.js** v18 trở lên
- **MongoDB** (local hoặc cloud)
- **Google Gemini API Key** (với quyền truy cập Imagen API)

## 📦 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd Thuctaptotnghiep
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/ai-image-generator
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
API_KEY=your_gemini_api_key_here
PORT=3001

# SePay Configuration (Thanh toán quét mã QR)
SEPAY_MERCHANT_ID=your_sepay_merchant_id
SEPAY_SECRET_KEY=your_sepay_secret_key
SEPAY_ENV=sandbox
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

**Lưu ý về SePay:**
- Đăng ký tài khoản tại: https://my.sepay.vn/register
- Lấy `MERCHANT_ID` và `SECRET_KEY` từ dashboard SePay
- `SEPAY_ENV`: `sandbox` hoặc `production`
- **Sandbox**: Dùng MERCHANT_ID và SECRET_KEY từ màn hình tích hợp Sandbox
- **Production**: Dùng MERCHANT_ID và SECRET_KEY từ màn hình tích hợp Production
- Sử dụng SDK `sepay-pg-node` để tích hợp thanh toán

**Cấu hình ngrok cho testing local:**
- **IPN URL**: Dán link ngrok vào mục IPN trên SePay dashboard (ví dụ: `https://abc123.ngrok.io/api/payment/ipn`)
- **BASE_URL**: Khi test local, nên dùng ngrok cho BASE_URL để callbacks hoạt động:
  ```env
  BASE_URL=https://abc123.ngrok.io
  ```
- **Lưu ý**: IPN URL và BASE_URL có thể dùng cùng một ngrok tunnel (cùng domain)

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `.env.local` trong thư mục `frontend/` (tùy chọn, mặc định là `http://localhost:3001/api`):

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🚀 Chạy ứng dụng

### Chạy Backend

```bash
cd backend
npm start
```

Backend sẽ chạy tại `http://localhost:3001`

### Chạy Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/user` - Lấy thông tin user hiện tại

### Sessions
- `GET /api/sessions` - Lấy tất cả sessions của user
- `POST /api/sessions/new` - Tạo session mới
- `DELETE /api/sessions/:id` - Xóa session

### AI Generation
- `POST /api/optimize-prompt` - Tối ưu hóa prompt từ lịch sử chat
- `POST /api/generate-title` - Tạo tiêu đề cho session
- `POST /api/generate-image` - Tạo hình ảnh từ prompt

### Payment (SePay)
- `POST /api/payment/create` - Tạo payment link với SePay
- `POST /api/payment/ipn` - Nhận IPN từ SePay (webhook)
- `GET /api/payment/success` - Callback khi thanh toán thành công
- `GET /api/payment/error` - Callback khi thanh toán thất bại
- `GET /api/payment/cancel` - Callback khi hủy thanh toán
- `GET /api/payment/transactions` - Lấy lịch sử giao dịch

## 🎨 Công nghệ sử dụng

### Backend
- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **@google/genai** - Google Gemini API SDK

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## 📄 License

MIT
