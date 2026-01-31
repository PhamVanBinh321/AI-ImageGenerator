import client from './client';
import { Transaction } from '../types';

export interface CreatePaymentResponse {
    checkoutUrl: string;
    formFields: Record<string, string>;
    orderId: string;
    invoiceNumber: string;
    transactionId: string;
}

export const createPayment = async (packageId: string): Promise<CreatePaymentResponse> => {
    const response = await client.post<CreatePaymentResponse>('/payment/create', {
        packageId,
    }) as unknown as CreatePaymentResponse;

    if (!response || !response.checkoutUrl || !response.formFields) {
        throw new Error('Invalid response from server');
    }

    return response;
};

export const checkTransaction = async (invoiceNumber: string): Promise<{ status: string; credits: number | null }> => {
    const response = await client.get<{ status: string; credits: number | null }>(`/payment/check-transaction/${invoiceNumber}`);
    return response as unknown as { status: string; credits: number | null };
};

export const getTransactions = async (): Promise<Transaction[]> => {
    return client.get<Transaction[]>('/payment/transactions') as unknown as Transaction[];
};
