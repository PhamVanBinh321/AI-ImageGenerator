# PROMPT: Xây dựng Admin Panel cho AI Image Generator

## 📋 PHÂN TÍCH DỰ ÁN HIỆN TẠI

### Tech Stack
- **Backend**: Node.js + Express, MongoDB + Mongoose, JWT authentication
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Axios
- **AI**: Google Gemini API (Imagen) cho image generation
- **Payment**: SePay integration

### Database Models
1. **User**: email, password, credits, timestamps
2. **ChatSession**: user, title, messages[], timestamps
3. **Transaction**: user, orderId, invoiceNumber, packageId, amount, credits, bonusCredits, status, sepayOrderId, sepayTransactionId, paymentMethod, ipnData, timestamps
4. **Message** (embedded in ChatSession): id, sender, text, isOptimizing, originalPrompt, optimizedPrompt, explanation, imageConfig, imageUrls, imagePrompt, imageStatus, feedback (type, reported, reportedAt)

### Tính năng hiện tại
- User authentication (register/login)
- Chat sessions với AI để optimize prompts
- Image generation với config (aspect ratio, số lượng)
- Credit system (10 credits ban đầu, 1 credit/ảnh)
- Payment system (SePay) với 3 gói credit
- Feedback system (like/dislike/report)

---

## 🎯 YÊU CẦU ADMIN PANEL

### 1. Authentication & Authorization
- Thêm field `role: { type: String, enum: ['user', 'admin'], default: 'user' }` vào User model
- Tạo middleware `adminMiddleware` để kiểm tra role === 'admin'
- Admin login sử dụng cùng endpoint `/api/auth/login` nhưng kiểm tra role
- Route `/admin` trong frontend, protected bằng role check

### 2. Dashboard Overview
Hiển thị thống kê tổng quan:
- **Tổng số users**: Tổng, mới trong ngày/tuần/tháng
- **Tổng số sessions**: Tổng, mới trong ngày/tuần/tháng
- **Tổng số transactions**: Tổng, theo status (pending/completed/failed/cancelled)
- **Tổng doanh thu**: Tổng amount từ transactions completed
- **Tổng credits đã phát hành**: Tổng credits + bonusCredits từ transactions completed
- **Tổng credits đã sử dụng**: Tính từ số ảnh đã tạo (cần thêm field hoặc tính từ messages có imageUrls)
- **Feedback statistics**: Tổng like/dislike/report
- **Biểu đồ**: Doanh thu theo thời gian, Users mới theo thời gian, Transactions theo status

### 3. User Management (`/admin/users`)
- **Danh sách users**: Table với pagination, search, filter
  - Columns: Email, Credits, Total Sessions, Total Transactions, Total Spent, Created At, Actions
  - Search: Theo email
  - Filter: Theo credits range, date range
  - Sort: Theo credits, created date, total spent
- **Chi tiết user**: Modal hoặc page riêng
  - Thông tin cơ bản: Email, Credits, Created At, Last Login (nếu có)
  - Lịch sử sessions: Danh sách sessions của user
  - Lịch sử transactions: Danh sách transactions của user
  - Actions: 
    - Cộng/trừ credits thủ công
    - Xóa user (với confirmation)
    - Reset password (gửi email hoặc tạo password mới)
- **Bulk actions**: Select multiple users để:
  - Cộng/trừ credits hàng loạt
  - Xóa hàng loạt (với confirmation)

### 4. Session Management (`/admin/sessions`)
- **Danh sách sessions**: Table với pagination, search, filter
  - Columns: User Email, Title, Messages Count, Has Images, Created At, Updated At, Actions
  - Search: Theo title, user email
  - Filter: Theo user, date range, has images
  - Sort: Theo created date, updated date, messages count
- **Chi tiết session**: Modal hoặc page riêng
  - Thông tin: User, Title, Created At, Updated At
  - Messages: Hiển thị toàn bộ messages trong session
    - User messages: Text
    - AI messages: Optimizing prompt (nếu có), Image results (nếu có), Feedback
  - Actions:
    - Xóa session (với confirmation)
    - Export session (JSON hoặc text)

### 5. Transaction Management (`/admin/transactions`)
- **Danh sách transactions**: Table với pagination, search, filter
  - Columns: User Email, Invoice Number, Package, Amount, Credits, Bonus Credits, Status, Payment Method, Created At, Actions
  - Search: Theo invoice number, order ID, user email
  - Filter: Theo status, date range, amount range, package
  - Sort: Theo created date, amount, status
- **Chi tiết transaction**: Modal hoặc page riêng
  - Thông tin đầy đủ: Tất cả fields từ Transaction model
  - IPN Data: Hiển thị raw IPN data (nếu có)
  - Actions:
    - Cập nhật status thủ công (nếu pending/failed)
    - Resend IPN (nếu cần)
    - Refund (nếu cần, có thể chỉ là mark status)
- **Statistics**:
  - Doanh thu theo package
  - Doanh thu theo ngày/tuần/tháng
  - Success rate (completed/total)
  - Average transaction value

### 6. Feedback & Reports Management (`/admin/feedback`)
- **Danh sách reported messages**: Table với pagination
  - Columns: User Email, Session Title, Message Preview, Reported At, Actions
  - Filter: Theo date range
  - Sort: Theo reported date
- **Chi tiết report**: Modal hoặc page riêng
  - Full message context (cả session)
  - User info
  - Actions:
    - Dismiss report (xóa reported flag)
    - Xóa message (với confirmation)
    - Xóa session (với confirmation)
    - Ban user (nếu cần)
- **Feedback statistics**:
  - Tổng like/dislike/report
  - Like/Dislike ratio
  - Top reported messages

### 7. Credit Management (`/admin/credits`)
- **Credit operations**:
  - Cộng/trừ credits cho user cụ thể
  - Bulk operations: Cộng/trừ credits cho nhiều users
  - Credit history: Log tất cả thay đổi credits (cần tạo CreditLog model)
- **Credit statistics**:
  - Tổng credits đã phát hành
  - Tổng credits đã sử dụng
  - Credits còn lại trong hệ thống
  - Top users by credits

### 8. System Settings (`/admin/settings`)
- **Credit packages**: Quản lý các gói credit
  - Package 1: 10 credits - 10,000 VND
  - Package 2: 35 credits - 30,000 VND (bonus 5)
  - Package 3: 130 credits - 100,000 VND (bonus 30)
  - Có thể thêm/sửa/xóa packages
- **Default credits**: Credits mới user nhận được khi đăng ký
- **API Keys**: Quản lý API keys (chỉ hiển thị, không cho edit)
- **System info**: Version, uptime, database stats

---

## 🎨 UI/UX GUIDELINES

### Design System
- **Theme**: Dark mode (giống frontend hiện tại)
- **Color scheme**: 
  - Primary: Purple/Blue gradient (giống frontend)
  - Success: Green
  - Warning: Yellow
  - Danger: Red
  - Info: Blue
- **Typography**: Poppins/Inter (giống frontend)
- **Components**: Sử dụng Tailwind CSS, giữ consistency với frontend

### Layout Structure
```
/admin
├── Dashboard (/) - Overview statistics
├── /users - User management
├── /sessions - Session management
├── /transactions - Transaction management
├── /feedback - Feedback & reports
├── /credits - Credit management
└── /settings - System settings
```

### Components cần tạo
1. **AdminLayout**: Layout wrapper với sidebar navigation
2. **AdminSidebar**: Navigation menu
3. **AdminHeader**: Header với user info, logout
4. **StatsCard**: Card hiển thị statistics
5. **DataTable**: Reusable table component với pagination, search, filter, sort
6. **UserDetailModal**: Modal chi tiết user
7. **SessionDetailModal**: Modal chi tiết session
8. **TransactionDetailModal**: Modal chi tiết transaction
9. **CreditOperationModal**: Modal cộng/trừ credits
10. **ConfirmDialog**: Reusable confirmation dialog

### Responsive Design
- Desktop-first approach
- Sidebar collapse trên mobile
- Tables scrollable trên mobile
- Modals fullscreen trên mobile

---

## 🔌 API ENDPOINTS CẦN TẠO

### Admin Authentication
- `GET /api/admin/me` - Lấy thông tin admin hiện tại (với role check)
- Middleware: `adminMiddleware` - Kiểm tra role === 'admin'

### Dashboard
- `GET /api/admin/dashboard/stats` - Lấy tổng quan statistics
- `GET /api/admin/dashboard/charts` - Lấy dữ liệu cho charts

### Users
- `GET /api/admin/users` - Lấy danh sách users (với pagination, search, filter)
- `GET /api/admin/users/:id` - Lấy chi tiết user
- `PATCH /api/admin/users/:id` - Cập nhật user (chủ yếu là credits)
- `DELETE /api/admin/users/:id` - Xóa user
- `POST /api/admin/users/bulk` - Bulk operations (cộng/trừ credits, xóa)

### Sessions
- `GET /api/admin/sessions` - Lấy danh sách sessions (với pagination, search, filter)
- `GET /api/admin/sessions/:id` - Lấy chi tiết session
- `DELETE /api/admin/sessions/:id` - Xóa session

### Transactions
- `GET /api/admin/transactions` - Lấy danh sách transactions (với pagination, search, filter)
- `GET /api/admin/transactions/:id` - Lấy chi tiết transaction
- `PATCH /api/admin/transactions/:id` - Cập nhật transaction (chủ yếu là status)

### Feedback
- `GET /api/admin/feedback/reports` - Lấy danh sách reported messages
- `PATCH /api/admin/feedback/reports/:messageId` - Dismiss report
- `GET /api/admin/feedback/stats` - Lấy feedback statistics

### Credits
- `POST /api/admin/credits/add` - Cộng credits cho user
- `POST /api/admin/credits/subtract` - Trừ credits cho user
- `POST /api/admin/credits/bulk` - Bulk credit operations
- `GET /api/admin/credits/stats` - Credit statistics

### Settings
- `GET /api/admin/settings` - Lấy settings
- `PATCH /api/admin/settings` - Cập nhật settings

---

## 🔒 SECURITY CONSIDERATIONS

1. **Role-based access control**:
   - Tất cả admin routes phải có `adminMiddleware`
   - Frontend check role trước khi render admin routes
   - Redirect về home nếu không phải admin

2. **Input validation**:
   - Validate tất cả inputs từ admin
   - Sanitize user inputs
   - Rate limiting cho admin endpoints

3. **Audit logging**:
   - Log tất cả admin actions (cộng/trừ credits, xóa users, etc.)
   - Tạo AdminLog model để track

4. **Sensitive data**:
   - Không hiển thị password (dù đã hash)
   - Mask sensitive data trong IPN data
   - Secure API keys display

---

## 📝 IMPLEMENTATION STEPS

### Phase 1: Backend Setup
1. Thêm `role` field vào User model
2. Tạo `adminMiddleware`
3. Tạo admin routes (`/api/admin/*`)
4. Implement các endpoints cơ bản

### Phase 2: Frontend Setup
1. Tạo AdminLayout component
2. Tạo AdminSidebar component
3. Tạo routing cho `/admin/*`
4. Implement role check trong frontend

### Phase 3: Dashboard
1. Tạo Dashboard page
2. Implement stats cards
3. Implement charts (có thể dùng Chart.js hoặc Recharts)

### Phase 4: User Management
1. Tạo Users page với DataTable
2. Implement search, filter, pagination
3. Tạo UserDetailModal
4. Implement credit operations

### Phase 5: Session & Transaction Management
1. Tạo Sessions page
2. Tạo Transactions page
3. Implement detail modals

### Phase 6: Feedback & Settings
1. Tạo Feedback page
2. Tạo Settings page
3. Implement các tính năng còn lại

---

## 🎯 PRIORITY FEATURES

### Must Have (MVP)
1. Admin authentication với role check
2. Dashboard với basic statistics
3. User management (list, detail, credit operations)
4. Transaction management (list, detail, status update)

### Should Have
5. Session management
6. Feedback/Reports management
7. Credit statistics

### Nice to Have
8. Advanced charts và analytics
9. Export data (CSV, JSON)
10. Email notifications
11. Audit logging

---

## 📚 REFERENCES

### Frontend Structure
- Components location: `frontend/src/components/`
- Services location: `frontend/src/services/`
- Types location: `frontend/src/types.ts`
- Main app: `frontend/src/App.tsx`

### Backend Structure
- Models: `backend/models/`
- Routes: `backend/routes/`
- Middleware: `backend/middleware/`
- Main server: `backend/server.js`

### Existing Patterns
- Authentication: JWT với `authMiddleware`
- API calls: Axios với `apiClient`
- Styling: Tailwind CSS với dark theme
- Components: React functional components với TypeScript

---

## ✅ CHECKLIST KHI HOÀN THÀNH

- [ ] User model có field `role`
- [ ] `adminMiddleware` hoạt động đúng
- [ ] Tất cả admin routes được protect
- [ ] Frontend có role check
- [ ] Dashboard hiển thị đúng statistics
- [ ] User management đầy đủ tính năng
- [ ] Transaction management đầy đủ tính năng
- [ ] Session management đầy đủ tính năng
- [ ] Feedback management đầy đủ tính năng
- [ ] Credit operations hoạt động đúng
- [ ] UI/UX consistent với frontend hiện tại
- [ ] Responsive trên mobile
- [ ] Security best practices được áp dụng

---

**Lưu ý**: Prompt này là guideline chi tiết. Khi implement, có thể điều chỉnh theo nhu cầu thực tế và thêm các tính năng khác nếu cần.


