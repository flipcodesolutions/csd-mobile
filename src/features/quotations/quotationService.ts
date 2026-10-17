import { api } from '../../core/api/client';

export interface QuotationCalculationPayload {
  variant_id: number;
  state?: string;
  rto_type?: string;
  insurance_type?: string;
  accessories?: number[];
  extended_warranty?: boolean;
}

export const quotationApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/quotations', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },
  calculateOnRoad: async (payload: QuotationCalculationPayload) => {
    const response = await api.post('/quotations/calculate', payload);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/quotations', data);
    return response.data;
  },
  downloadPdf: async (id: number) => {
    const response = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },
};

export const quotationService = quotationApi;
export default quotationService;
