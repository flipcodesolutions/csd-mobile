import api, { setAuthToken } from './axios';

// --------------------------------------------------------------------------
// 1. Authentication API
// --------------------------------------------------------------------------
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data && response.data.status) {
      const token =
        response.data.data?.token ||
        response.data.token ||
        response.data.data?.access_token ||
        response.data.access_token;
      if (token) {
        setAuthToken(token);
      }
    }
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.log('Logout API error (ignored):', e);
    } finally {
      setAuthToken(null);
    }
  },
  getProfile: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 2. Lead Status Master API
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
// 3. Lead Source Master API
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
// 4. Brand Master API
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
// 5. Vehicle Model Master API
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
// 6. Vehicle Variant Master API
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
// 7. User Master API
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

// --------------------------------------------------------------------------
// 8. Customer Leads API
// --------------------------------------------------------------------------
export const leadApi = {
  getAll: async (params?: { search?: string; priority?: string; vehicle_segment?: string; status?: string }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },
  create: async (data: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    vehicle_segment: '2 Wheeler' | '4 Wheeler';
    brand_id?: number;
    brand_name?: string;
    model_variant: string;
    priority: 'Hot' | 'Warm' | 'Cold';
    purchase_timeline?: string;
    source_id?: number;
    source_name?: string;
    status_id?: number;
    status_name?: string;
    assigned_user_name?: string;
  }) => {
    const response = await api.post('/leads', data);
    return response.data;
  },
  update: async (id: number, data: Partial<{
    name: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    vehicle_segment: '2 Wheeler' | '4 Wheeler';
    brand_id: number;
    brand_name: string;
    model_variant: string;
    priority: 'Hot' | 'Warm' | 'Cold';
    purchase_timeline: string;
    source_id: number;
    source_name: string;
    status_id: number;
    status_name: string;
    assigned_user_name: string;
  }>) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
};

// --------------------------------------------------------------------------
// 9. Sales Executive Dedicated API (Assigned Leads & Follow-Ups)
// --------------------------------------------------------------------------
export const salesExecutiveApi = {
  getAssignedLeads: async (params?: {
    search?: string;
    status?: string;
    priority?: string;
    date?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get('/sales-executive/leads', { params });
    return response.data;
  },
  getLeadDetails: async (id: number) => {
    const response = await api.get(`/sales-executive/leads/${id}`);
    return response.data;
  },
  getFollowUps: async (leadId: number) => {
    const response = await api.get(`/sales-executive/leads/${leadId}/follow-ups`);
    return response.data;
  },
  createFollowUp: async (
    leadId: number,
    data: {
      follow_up_date: string;
      follow_up_time?: string;
      type: string;
      notes?: string;
      next_follow_up_date?: string;
      next_follow_up_time?: string;
      status: string;
      lead_status_name?: string;
    }
  ) => {
    const response = await api.post(`/sales-executive/leads/${leadId}/follow-ups`, data);
    return response.data;
  },
};


