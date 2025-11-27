import React, { useEffect, useRef } from 'react';
import CreditIcon from './icons/CreditIcon';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutUrl: string | null;
  formFields: Record<string, string> | null;
  orderId: string;
  invoiceNumber: string;
  onPaymentSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  checkoutUrl,
  formFields,
  orderId,
  invoiceNumber,
  onPaymentSuccess,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Tự động submit form khi modal mở và có form fields
    if (isOpen && formFields && checkoutUrl && formRef.current) {
      // Delay một chút để đảm bảo form đã render
      setTimeout(() => {
        formRef.current?.submit();
      }, 500);
    }
  }, [isOpen, formFields, checkoutUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditIcon className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Đang chuyển đến trang thanh toán...</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading Spinner */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-300 text-center">
              Đang chuyển hướng đến cổng thanh toán SePay
            </p>
          </div>

          {/* Hidden Form để submit */}
          {checkoutUrl && formFields && (
            <form
              ref={formRef}
              action={checkoutUrl}
              method="POST"
              style={{ display: 'none' }}
            >
              {Object.keys(formFields).map((field) => (
                <input
                  key={field}
                  type="hidden"
                  name={field}
                  value={formFields[field]}
                />
              ))}
            </form>
          )}

          {/* Order Info */}
          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 mb-4">
            <div className="text-sm text-gray-400 mb-2">Mã đơn hàng:</div>
            <div className="text-white font-mono text-sm mb-2">{orderId}</div>
            <div className="text-sm text-gray-400 mb-2">Mã hóa đơn:</div>
            <div className="text-white font-mono text-sm">{invoiceNumber}</div>
          </div>

          {/* Manual Submit Button (backup) */}
          {checkoutUrl && formFields && (
            <button
              onClick={() => formRef.current?.submit()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-500/50 mb-4"
            >
              Thanh toán ngay
            </button>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Bạn sẽ được chuyển đến trang thanh toán của SePay</p>
            <p>• Sau khi thanh toán thành công, credit sẽ được cộng tự động</p>
            <p>• Nếu không tự động chuyển, vui lòng nhấn nút "Thanh toán ngay" ở trên</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
