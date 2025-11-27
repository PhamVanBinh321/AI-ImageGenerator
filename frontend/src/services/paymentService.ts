import apiClient from './apiClient';

export interface CreatePaymentResponse {
  checkoutUrl: string;
  formFields: Record<string, string>;
  orderId: string;
  invoiceNumber: string;
  transactionId: string;
}

export interface Transaction {
  _id: string;
  orderId: string;
  invoiceNumber: string;
  packageId: string;
  amount: number;
  credits: number;
  bonusCredits: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/**
 * Tạo payment link với SePay
 */
export const createPayment = async (packageId: string): Promise<CreatePaymentResponse> => {
  try {
    // apiClient interceptor đã trả về response.data rồi, không cần .data nữa
    const response = await apiClient.post<CreatePaymentResponse>('/payment/create', {
      packageId,
    });
    
    // Kiểm tra response có data không
    if (!response) {
      throw new Error('Không nhận được dữ liệu từ server');
    }
    
    // Kiểm tra các field bắt buộc
    if (!response.checkoutUrl) {
      console.error('Response:', response);
      throw new Error('Không nhận được checkoutUrl từ server');
    }
    
    if (!response.formFields) {
      console.error('Response:', response);
      throw new Error('Không nhận được formFields từ server');
    }
    
    return response;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

/**
 * Kiểm tra trạng thái transaction
 */
export const checkTransaction = async (invoiceNumber: string): Promise<{ status: string; credits: number | null }> => {
  const response = await apiClient.get<{ status: string; credits: number | null }>(`/payment/check-transaction/${invoiceNumber}`);
  return response;
};

/**
 * Lấy lịch sử giao dịch
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await apiClient.get<Transaction[]>('/payment/transactions');
  return response;
};


