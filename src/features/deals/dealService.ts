import { api } from '../../core/api/client';

export interface ConvertLeadDealPayload {
  lead_id: number;
  total_amount: number;
  discount_amount?: number;
  color?: string;
  vin_chassis_number?: string;
  expected_delivery_date?: string;
  quotation_id?: number;
  initial_payment?: {
    amount: number;
    payment_type: string;
    payment_mode: string;
    transaction_reference?: string;
    bank_name?: string;
    notes?: string;
  };
  has_insurance?: string;
  insurance?: {
    company?: string;
    policy_number?: string;
    insurance_type?: string;
    premium_amount?: number;
    idv?: number;
    start_date?: string;
    expiry_date?: string;
    notes?: string;
  };
  deal_title?: string;
  deal_stage?: string;
  advance_amount?: number;
  balance_amount?: number;
  notes?: string;
}

export const dealApi = {
  create: async (data: ConvertLeadDealPayload) => {
    const response = await api.post('/deals/convert-lead', data);
    return response.data;
  },
  convertLead: async (data: ConvertLeadDealPayload) => {
    const response = await api.post('/deals/convert-lead', data);
    return response.data;
  },
  getAll: async (params?: any) => {
    const response = await api.get('/deals', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },
};

export const dealService = dealApi;
export default dealService;
