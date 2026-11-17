import { api, getApiBaseUrl, getAuthToken } from '../../core/api/client';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import {
  CreateDealPaymentPayload,
  Deal,
  DealFilterParams,
  DealStats,
  UpdateDealPayload,
} from './types';

export interface ConvertLeadDealPayload {
  lead_id: number;
  total_amount: number;
  discount_amount?: number;
  color?: string;
  vin_chassis_number?: string;
  expected_delivery_date?: string;
  quotation_id?: number;
  sales_executive_id?: number;
  has_insurance?: boolean | string;
  insurance?: string;
  insurance_company?: string;
  policy_number?: string;
  insurance_type?: string;
  policy_start_date?: string;
  policy_expiry_date?: string;
  premium_amount?: number;
  reminder_days_before?: number;
  reminder_date?: string;
  vehicle_number?: string;
  insurance_notes?: string;
  initial_payment?: {
    amount: number;
    payment_type: string;
    payment_mode: string;
    transaction_reference?: string;
    bank_name?: string;
    received_by?: string;
    notes?: string;
  };
  deal_title?: string;
  deal_stage?: string;
  advance_amount?: number;
  balance_amount?: number;
  notes?: string;
}

export const dealApi = {
  getStats: async (): Promise<{ status: boolean; data: DealStats }> => {
    try {
      const response = await api.get('/deals/stats');
      return response.data;
    } catch (err) {
      console.log('dealApi.getStats error:', err);
      return {
        status: false,
        data: {
          total_deals: 0,
          total_gross_value: 0,
          total_collected: 0,
          total_pending_balance: 0,
        },
      };
    }
  },

  getAll: async (params?: DealFilterParams): Promise<{ status: boolean; data: any }> => {
    try {
      const cleanParams: Record<string, any> = {};
      if (params?.page) cleanParams.page = params.page;
      if (params?.per_page) cleanParams.per_page = params.per_page;
      if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
      if (params?.deal_status && params.deal_status !== 'all') {
        cleanParams.deal_status = params.deal_status;
      }
      if (params?.stage && params.stage !== 'all') {
        cleanParams.stage = params.stage;
      }
      if (params?.payment_status && params.payment_status !== 'all') {
        cleanParams.payment_status = params.payment_status;
      }
      if (params?.from_date) cleanParams.from_date = params.from_date;
      if (params?.to_date) cleanParams.to_date = params.to_date;
      if (params?.trash) cleanParams.trash = 1;

      const response = await api.get('/deals', { params: cleanParams });
      return response.data;
    } catch (error: any) {
      console.log('dealApi.getAll error:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<{ status: boolean; data: Deal }> => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },

  create: async (data: ConvertLeadDealPayload) => {
    const response = await api.post('/deals/convert-lead', data);
    return response.data;
  },

  convertLead: async (data: ConvertLeadDealPayload) => {
    const response = await api.post('/deals/convert-lead', data);
    return response.data;
  },

  update: async (id: number, data: UpdateDealPayload): Promise<{ status: boolean; data: Deal; message?: string }> => {
    const response = await api.put(`/deals/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ status: boolean; message?: string }> => {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  },

  restore: async (id: number): Promise<{ status: boolean; message?: string }> => {
    const response = await api.post(`/deals/${id}/restore`);
    return response.data;
  },

  getPayments: async (dealId: number): Promise<{ status: boolean; data: any }> => {
    try {
      const response = await api.get('/payments', { params: { deal_id: dealId } });
      return response.data;
    } catch (err) {
      console.log('dealApi.getPayments error fallback:', err);
      const res = await api.get(`/deals/${dealId}`);
      return { status: true, data: res.data?.data?.payments || res.data?.payments || [] };
    }
  },

  addPayment: async (data: CreateDealPaymentPayload): Promise<{ status: boolean; data?: any; message?: string }> => {
    // 1. Normalize payment_mode into standard slug: 'cash' | 'cheque' | 'upi' | 'neft_rtgs'
    let mode = 'upi';
    const lowerMode = (data.payment_mode || '').toLowerCase();
    if (lowerMode.includes('cash')) mode = 'cash';
    else if (lowerMode.includes('cheque')) mode = 'cheque';
    else if (lowerMode.includes('neft') || lowerMode.includes('rtgs')) mode = 'neft_rtgs';
    else mode = 'upi';

    // 2. Normalize payment_type into standard slug: 'token_advance' | 'down_payment' | 'part_payment' | 'refund'
    let type = 'part_payment';
    const lowerType = (data.payment_type || '').toLowerCase();
    if (lowerType.includes('token') || lowerType.includes('advance')) type = 'token_advance';
    else if (lowerType.includes('down') || lowerType.includes('margin')) type = 'down_payment';
    else if (lowerType.includes('refund')) type = 'refund';
    else type = 'part_payment';

    // 3. Normalize payment_date to YYYY-MM-DD
    let dateStr = data.payment_date || new Date().toISOString().split('T')[0];
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD/MM/YYYY -> YYYY-MM-DD
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    const refStr = (data.transaction_reference || data.payment_reference || '').trim() ||
      (mode === 'cash' ? 'CASH-RECEIPT' : `UTR-${Date.now().toString().slice(-8)}`);

    const bankStr = (data.bank_name || '').trim() || (mode === 'cash' ? 'Cash Counter' : 'HDFC Bank');
    const receivedBy = (data.received_by || '').trim() || 'Admin User';

    const now = new Date();
    const fallbackInvNo = `DAL-/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;
    const invNo = (data.invoice_number || (data as any).invoice_no || '').trim() || fallbackInvNo;

    const metaParts = [];
    if (invNo) metaParts.push(`Invoice: ${invNo}`);
    if (refStr) metaParts.push(`UTR: ${refStr}`);
    if (bankStr) metaParts.push(`Bank: ${bankStr}`);
    if (receivedBy) metaParts.push(`Received By: ${receivedBy}`);
    const metaStr = metaParts.length > 0 ? ` [${metaParts.join(' • ')}]` : '';
    const fullNotes = `${data.notes || data.remarks || 'Payment recorded'}${metaStr}`;

    const apiPayload: any = {
      deal_id: Number(data.deal_id),
      amount: Number(data.amount),
      payment_type: type,
      payment_mode: mode,
      status: 'cleared',
      payment_status: 'cleared',
      is_cleared: 1,
      payment_date: dateStr,
      invoice_no: invNo,
      invoice_number: invNo,
      transaction_reference: refStr,
      reference_no: refStr,
      reference_number: refStr,
      reference: refStr,
      utr: refStr,
      bank_name: bankStr,
      bank: bankStr,
      received_by: receivedBy,
      received_by_name: receivedBy,
      recorded_by: receivedBy,
      notes: fullNotes,
      remarks: fullNotes,
    };

    console.log('[dealService.addPayment] Submitting payment to /payments:', apiPayload);

    try {
      const response = await api.post('/payments', apiPayload);
      console.log('[dealService.addPayment] /payments success:', response.data);
      const pid = response?.data?.id || response?.data?.data?.id;
      if (pid) {
        try {
          await api.post(`/payments/${pid}/verify`, { action: 'clear' });
        } catch (_) {}
      }
      return response.data;
    } catch (err: any) {
      console.log('[dealService.addPayment] /payments error, attempting fallback /deals/:id/payments:', err?.response?.data || err?.message);
      try {
        const fallback = await api.post(`/deals/${data.deal_id}/payments`, apiPayload);
        console.log('[dealService.addPayment] fallback success:', fallback.data);
        return fallback.data;
      } catch (fallbackErr: any) {
        console.log('[dealService.addPayment] both endpoints failed:', fallbackErr?.response?.data || fallbackErr?.message);
        throw fallbackErr;
      }
    }
  },

  downloadReceiptPdf: async (dealId: number, receiptNo?: string): Promise<string> => {
    const token = getAuthToken();
    const baseUrl = getApiBaseUrl();
    const downloadUrl = `${baseUrl}/deals/${dealId}/receipt`;
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const fileName = `${receiptNo || `Receipt-${dealId}`}.pdf`;
    const destPath =
      Platform.OS === 'android'
        ? `${dirs.DownloadDir}/${fileName}`
        : `${dirs.DocumentDir}/${fileName}`;

    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: destPath,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: fileName,
        description: 'Downloading Vehicle Deal Order Receipt',
        mime: 'application/pdf',
        mediaScannable: true,
      },
    }).fetch('GET', downloadUrl, {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    });

    return res.path();
  },
};

export const dealService = dealApi;
export default dealService;
