import { api } from '../../core/api/client';
import {
  BrandStats,
  CreateExpenseCategoryPayload,
  CreateModelPayload,
  CreateVariantPayload,
  LeadSourceStats,
  ModelStats,
  UpdateExpenseCategoryPayload,
  UpdateModelPayload,
  UpdateVariantPayload,
  VariantStats,
} from './types';

export interface BrandFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  vehicle_type?: string;
}

export interface ModelFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  vehicle_segment?: string;
  brand_id?: number | string;
}

export interface VariantFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  brand_id?: number | string;
  model_id?: number | string;
}

export interface ExpenseCategoryFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface LeadSourceFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  all?: boolean;
}

// --------------------------------------------------------------------------
// 1. Brand Master API
// --------------------------------------------------------------------------
export const brandApi = {
  getStats: async (): Promise<{ status: boolean; data: BrandStats }> => {
    try {
      const response = await api.get('/brands/stats');
      return response.data;
    } catch (err) {
      console.log('brandApi.getStats error:', err);
      return {
        status: false,
        data: {
          total_brands: 0,
          four_wheeler_brands: 0,
          two_wheeler_brands: 0,
          active_brands: 0,
        },
      };
    }
  },
  getAll: async (params?: BrandFilterParams) => {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.per_page) cleanParams.per_page = params.per_page;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params?.vehicle_type && params.vehicle_type !== 'All') cleanParams.vehicle_type = params.vehicle_type;

    const response = await api.get('/brands', { params: cleanParams });
    return response.data;
  },
  create: async (data: {
    name: string;
    vehicle_type: string[];
    status: 'Active' | 'Inactive';
    logo?: string | null;
  }) => {
    const response = await api.post('/brands', {
      name: data.name,
      vehicle_type: data.vehicle_type,
      status: data.status,
      logo: data.logo,
    });
    return response.data;
  },
  update: async (
    id: number,
    data: {
      name: string;
      vehicle_type: string[];
      status: 'Active' | 'Inactive';
      logo?: string | null;
    }
  ) => {
    const response = await api.put(`/brands/${id}`, {
      name: data.name,
      vehicle_type: data.vehicle_type,
      status: data.status,
      logo: data.logo,
    });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 2. Vehicle Model Master API
// --------------------------------------------------------------------------
export const modelApi = {
  getStats: async (): Promise<{ status: boolean; data: ModelStats }> => {
    try {
      const response = await api.get('/models/stats');
      return response.data;
    } catch (err) {
      console.log('modelApi.getStats error:', err);
      return {
        status: false,
        data: {
          total_models: 0,
          four_wheeler_models: 0,
          two_wheeler_models: 0,
          active_models: 0,
        },
      };
    }
  },
  getAll: async (params?: ModelFilterParams) => {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.per_page) cleanParams.per_page = params.per_page;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params?.vehicle_segment && params.vehicle_segment !== 'All') cleanParams.vehicle_segment = params.vehicle_segment;
    if (params?.brand_id) cleanParams.brand_id = params.brand_id;

    const response = await api.get('/models', { params: cleanParams });
    return response.data;
  },
  create: async (data: CreateModelPayload) => {
    const response = await api.post('/models', data);
    return response.data;
  },
  update: async (id: number, data: UpdateModelPayload) => {
    const response = await api.put(`/models/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/models/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 3. Vehicle Variant Master API
// --------------------------------------------------------------------------
export const variantApi = {
  getStats: async (): Promise<{ status: boolean; data: VariantStats }> => {
    try {
      const response = await api.get('/variants/stats');
      return response.data;
    } catch (err) {
      console.log('variantApi.getStats error:', err);
      return {
        status: false,
        data: {
          total_variants: 0,
          active_trims: 0,
          mapped_models: 0,
          inactive_trims: 0,
        },
      };
    }
  },
  getAll: async (params?: VariantFilterParams) => {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.per_page) cleanParams.per_page = params.per_page;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params?.brand_id) cleanParams.brand_id = params.brand_id;
    if (params?.model_id) cleanParams.model_id = params.model_id;

    const response = await api.get('/variants', { params: cleanParams });
    return response.data;
  },
  create: async (data: CreateVariantPayload) => {
    const response = await api.post('/variants', data);
    return response.data;
  },
  update: async (id: number, data: UpdateVariantPayload) => {
    const response = await api.put(`/variants/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/variants/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 4. Update Price Master API (Inline & Bulk adjustments)
// --------------------------------------------------------------------------
export const priceMasterApi = {
  getVariants: async (params?: VariantFilterParams) => {
    try {
      const res = await variantApi.getAll({ per_page: 100, ...params });
      return res;
    } catch (err) {
      console.log('priceMasterApi.getVariants fallback to /price-master:', err);
      try {
        const fallbackRes = await api.get('/price-master');
        return fallbackRes.data;
      } catch (e) {
        throw e;
      }
    }
  },
  updateSingleVariantPrice: async (
    variantId: number,
    revisedPrice: number,
    additionalData?: any
  ) => {
    try {
      const res = await api.post('/variants/bulk-update-prices', {
        variants: [{ id: variantId, revised_price: revisedPrice }],
      });
      return res.data;
    } catch (err) {
      console.log('Single price bulk update fallback to PUT /variants/:id', err);
      const res = await api.put(`/variants/${variantId}`, {
        price: revisedPrice,
        ex_showroom_price: revisedPrice,
        ...additionalData,
      });
      return res.data;
    }
  },
  bulkUpdatePrices: async (items: { id: number; revised_price: number }[]) => {
    try {
      const res = await api.post('/variants/bulk-update-prices', {
        variants: items,
      });
      return res.data;
    } catch (err) {
      console.log('Bulk price update fallback to parallel PUTs', err);
      const promises = items.map((item) =>
        api.put(`/variants/${item.id}`, {
          price: item.revised_price,
          ex_showroom_price: item.revised_price,
        })
      );
      return await Promise.all(promises);
    }
  },
};

// --------------------------------------------------------------------------
// 5. Expense Master API
// --------------------------------------------------------------------------
export const expenseCategoryApi = {
  getAll: async (params?: ExpenseCategoryFilterParams) => {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.per_page) cleanParams.per_page = params.per_page;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();

    const response = await api.get('/expense-categories', { params: cleanParams });
    return response.data;
  },
  create: async (data: CreateExpenseCategoryPayload) => {
    const rawStatus =
      data.status === 'Active' || data.status === 1 || (data.status as any) === '1'
        ? 1
        : data.status === 'Inactive' || data.status === 0 || (data.status as any) === '0'
        ? 0
        : 1;
    const response = await api.post('/expense-categories', {
      name: data.name,
      description: data.description || 'General dealership expense',
      status: rawStatus,
    });
    return response.data;
  },
  update: async (
    id: number,
    data: UpdateExpenseCategoryPayload
  ) => {
    const rawStatus =
      data.status === 'Active' || data.status === 1 || (data.status as any) === '1'
        ? 1
        : data.status === 'Inactive' || data.status === 0 || (data.status as any) === '0'
        ? 0
        : 1;
    const response = await api.put(`/expense-categories/${id}`, {
      name: data.name,
      description: data.description || 'General dealership expense',
      status: rawStatus,
    });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 6. Lead Source Master API
// --------------------------------------------------------------------------
export const leadSourceApi = {
  getStats: async (): Promise<{ status: boolean; data: LeadSourceStats }> => {
    try {
      const response = await api.get('/lead-sources/stats');
      return response.data;
    } catch (err) {
      console.log('leadSourceApi.getStats error:', err);
      return {
        status: false,
        data: {
          total_channels: 0,
          active_channels: 0,
          top_channel: 'Showroom Walk-in',
        },
      };
    }
  },
  getAll: async (params?: LeadSourceFilterParams) => {
    const cleanParams: Record<string, any> = {};
    if (params?.page) cleanParams.page = params.page;
    if (params?.per_page) cleanParams.per_page = params.per_page;
    if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params?.all) cleanParams.all = true;

    const response = await api.get('/lead-sources', { params: cleanParams });
    return response.data;
  },
  create: async (data: { title: string; status: 'Active' | 'Inactive' }) => {
    const response = await api.post('/lead-sources', data);
    return response.data;
  },
  update: async (id: number, data: { title: string; status: 'Active' | 'Inactive' }) => {
    const response = await api.put(`/lead-sources/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/lead-sources/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 7. Lead Status Master API
// --------------------------------------------------------------------------
export const leadStatusApi = {
  getAll: async () => {
    const response = await api.get('/lead-statuses');
    return response.data;
  },
  create: async (data: { name: string; status: 'Active' | 'Inactive' }) => {
    const response = await api.post('/lead-statuses', data);
    return response.data;
  },
  update: async (id: number, data: { name: string; status: 'Active' | 'Inactive' }) => {
    const response = await api.put(`/lead-statuses/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/lead-statuses/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 8. User Master API
// --------------------------------------------------------------------------
export const userApi = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    status: 'Active' | 'Inactive';
  }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  update: async (
    id: number,
    data: {
      name: string;
      email: string;
      phone: string;
      role: string;
      status: 'Active' | 'Inactive';
    }
  ) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const masterService = {
  brand: brandApi,
  model: modelApi,
  variant: variantApi,
  priceMaster: priceMasterApi,
  expenseCategory: expenseCategoryApi,
  leadSource: leadSourceApi,
  leadStatus: leadStatusApi,
  user: userApi,
};

export default masterService;
