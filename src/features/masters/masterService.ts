import { api } from '../../core/api/client';

// --------------------------------------------------------------------------
// 1. Lead Status Master API
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
// 2. Lead Source Master API
// --------------------------------------------------------------------------
export const leadSourceApi = {
  getAll: async () => {
    const response = await api.get('/lead-sources');
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
// 3. Brand Master API
// --------------------------------------------------------------------------
export const brandApi = {
  getAll: async () => {
    const response = await api.get('/brands');
    return response.data;
  },
  create: async (data: { name: string; vehicle_type: string[]; status: 'Active' | 'Inactive' }) => {
    const response = await api.post('/brands', data);
    return response.data;
  },
  update: async (
    id: number,
    data: { name: string; vehicle_type: string[]; status: 'Active' | 'Inactive' }
  ) => {
    const response = await api.put(`/brands/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 4. Vehicle Model Master API
// --------------------------------------------------------------------------
export const modelApi = {
  getAll: async () => {
    const response = await api.get('/models');
    return response.data;
  },
  create: async (data: {
    brand_id: number;
    name: string;
    vehicle_segment: '4 Wheeler' | '2 Wheeler';
    status: 'Active' | 'Inactive';
  }) => {
    const response = await api.post('/models', data);
    return response.data;
  },
  update: async (
    id: number,
    data: {
      brand_id?: number;
      name: string;
      vehicle_segment?: '4 Wheeler' | '2 Wheeler';
      status: 'Active' | 'Inactive';
    }
  ) => {
    const response = await api.put(`/models/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/models/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 5. Vehicle Variant Master API
// --------------------------------------------------------------------------
export const variantApi = {
  getAll: async () => {
    const response = await api.get('/variants');
    return response.data;
  },
  create: async (data: {
    brand_id: number;
    model_id: number;
    name: string;
    price: string;
    status: 'Active' | 'Inactive';
  }) => {
    const response = await api.post('/variants', data);
    return response.data;
  },
  update: async (
    id: number,
    data: {
      brand_id?: number;
      model_id?: number;
      name: string;
      price: string;
      status: 'Active' | 'Inactive';
    }
  ) => {
    const response = await api.put(`/variants/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/variants/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 6. User Master API
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
  leadSource: leadSourceApi,
  leadStatus: leadStatusApi,
  user: userApi,
};

export default masterService;
