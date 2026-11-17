import { api } from '../../core/api/client';
import { dealService } from '../deals/dealService';
import { CreateDealPaymentPayload, Deal } from '../deals/types';
import { CreateInvoicePayload, InvoiceRecord, InvoiceStats } from './types';

export const invoiceService = {
  /**
   * Fetch invoice statistics from backend analytics endpoint with fallback
   */
  getStats: async (): Promise<{ status: boolean; data?: InvoiceStats }> => {
    try {
      const response = await api.get('/invoices/stats');
      if (response?.data?.data || response?.data) {
        return {
          status: true,
          data: response.data.data || response.data,
        };
      }
      return { status: false };
    } catch (err) {
      console.log('Error fetching invoice stats from /invoices/stats, fallback to local compute:', err);
      return { status: false };
    }
  },

  /**
   * Fetch deals with payments list
   */
  getDeals: async (params: any = {}): Promise<{ status: boolean; data: Deal[] }> => {
    const res = await dealService.getAll({ per_page: 200, ...params });
    const items = res?.data?.data || res?.data || [];
    return {
      status: true,
      data: Array.isArray(items) ? items : [],
    };
  },

  /**
   * Record payment and generate official invoice
   */
  createInvoice: async (payload: CreateInvoicePayload) => {
    const dealPaymentPayload: CreateDealPaymentPayload = {
      deal_id: payload.deal_id,
      amount: payload.amount,
      payment_type: payload.payment_type,
      payment_mode: payload.payment_mode,
      payment_date: payload.payment_date,
      invoice_number: payload.invoice_no,
      transaction_reference: payload.transaction_reference,
      bank_name: payload.bank_name,
      received_by: payload.received_by || 'Admin User',
      remarks: payload.remarks || payload.notes,
      notes: payload.notes || payload.remarks,
      items: (payload.items || []).map((it) => ({
        description: it.description,
        hsn: it.hsn || it.hsn_code || '998313',
        quantity: it.quantity || 1,
        rate: it.rate || payload.amount,
        amount: it.amount || payload.amount,
      })),
    };

    return await dealService.addPayment(dealPaymentPayload);
  },

  /**
   * Download Invoice / Receipt PDF
   */
  downloadInvoicePdf: async (dealId: number, invoiceNo?: string) => {
    return await dealService.downloadReceiptPdf(dealId, invoiceNo);
  },
};

