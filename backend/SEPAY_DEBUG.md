# Hướng dẫn Debug SePay API 404 Error

## Các nguyên nhân có thể gây lỗi 404:

### 1. URL API không đúng
- **Sandbox**: Kiểm tra xem SePay có URL sandbox riêng không
- **Production**: Đảm bảo URL là `https://pay.sepay.vn/v1/checkout/init`
- Kiểm tra trong SePay dashboard xem URL chính xác là gì

### 2. Kiểm tra biến môi trường
Đảm bảo file `.env` có đầy đủ:
```env
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_API_URL=https://pay.sepay.vn/v1/checkout/init
```

### 3. Kiểm tra logs
Khi gặp lỗi, xem console log để biết:
- URL đang gọi
- Data đang gửi
- Response từ SePay

### 4. Test với curl
Thử gọi API trực tiếp bằng curl để kiểm tra:
```bash
curl -X POST https://pay.sepay.vn/v1/checkout/init \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "YOUR_MERCHANT_ID",
    "order_id": "TEST-123",
    "order_amount": "10000",
    "order_currency": "VND",
    "order_description": "Test",
    "order_invoice_number": "INV-123",
    "success_url": "https://your-domain.com/success",
    "error_url": "https://your-domain.com/error",
    "cancel_url": "https://your-domain.com/cancel",
    "signature": "YOUR_SIGNATURE"
  }'
```

### 5. Kiểm tra SePay Dashboard
- Đảm bảo đã kích hoạt cổng thanh toán
- Kiểm tra xem có đang ở chế độ Sandbox hay Production
- Xem lại tài liệu tích hợp trong dashboard

### 6. Liên hệ SePay Support
Nếu vẫn gặp lỗi, liên hệ SePay support với:
- MERCHANT_ID của bạn
- Error message đầy đủ
- Request data (đã ẩn SECRET_KEY)

