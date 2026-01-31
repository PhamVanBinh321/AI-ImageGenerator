# Hướng dẫn Setup Admin Panel

## Bước 1: Tạo tài khoản Admin

Chạy script để tạo admin user:

```bash
cd backend
npm run create-admin
```

Hoặc chỉ định email và password:

```bash
npm run create-admin admin@example.com your_password
```

**Mặc định:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Lưu ý**: Đổi mật khẩu sau lần đăng nhập đầu tiên!

## Bước 2: Đăng nhập vào Admin Panel

1. Mở trình duyệt và truy cập: `http://localhost:5173/admin`
2. Đăng nhập với email và password admin vừa tạo
3. Nếu đăng nhập thành công, bạn sẽ thấy Admin Dashboard

## Cấu trúc đã tạo

### Backend:
- ✅ `backend/models/User.js` - Thêm field `role`
- ✅ `backend/middleware/adminMiddleware.js` - Middleware kiểm tra admin
- ✅ `backend/routes/auth.js` - Trả về role trong response
- ✅ `backend/scripts/createAdmin.js` - Script tạo admin

### Frontend:
- ✅ `frontend/src/types.ts` - Thêm role vào CurrentUser
- ✅ `frontend/src/components/AdminLogin.tsx` - Component đăng nhập admin
- ✅ `frontend/src/components/AdminLayout.tsx` - Layout cho admin panel
- ✅ `frontend/src/App.tsx` - Routing cho `/admin`

## Tính năng hiện tại

- ✅ Tạo admin user qua script
- ✅ Đăng nhập admin với role check
- ✅ Admin Dashboard cơ bản (chưa có tính năng chi tiết)
- ✅ Logout admin

## Bước tiếp theo

Theo prompt trong `ADMIN_PANEL_PROMPT.md` để thêm các tính năng quản trị chi tiết.






