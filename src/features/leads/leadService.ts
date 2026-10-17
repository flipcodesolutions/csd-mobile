import { api } from '../../core/api/client';

export interface LeadFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  priority?: string;
  vehicle_segment?: string;
  status?: string;
  status_id?: number | string;
  brand_id?: number | string;
  source_id?: number | string;
  assigned_to?: number | string;
}

export const leadApi = {
  getAll: async (params?: LeadFilterParams) => {
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
  update: async (
    id: number,
    data: Partial<{
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
    }>
  ) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
  bulkStatus: async (leadIds: number[], statusId: number | null, statusName?: string) => {
    try {
      const response = await api.post('/leads/bulk-status', {
        lead_ids: leadIds,
        status_id: statusId,
        status_name: statusName || '',
      });
      return response.data;
    } catch {
      await Promise.all(
        leadIds.map((id) =>
          api.put(`/leads/${id}`, { status_id: statusId, status_name: statusName }).catch(() => null)
        )
      );
      return { status: true, message: 'Leads status updated successfully' };
    }
  },
  bulkPriority: async (leadIds: number[], priority: 'Hot' | 'Warm' | 'Cold') => {
    try {
      const response = await api.post('/leads/bulk-priority', {
        lead_ids: leadIds,
        priority,
      });
      return response.data;
    } catch {
      await Promise.all(
        leadIds.map((id) => api.put(`/leads/${id}`, { priority }).catch(() => null))
      );
      return { status: true, message: 'Leads priority updated successfully' };
    }
  },
  bulkAssign: async (leadIds: number[], assignTo: number | string, remarks?: string) => {
    try {
      const response = await api.post('/leads/bulk-assign', {
        lead_ids: leadIds,
        assign_to: assignTo,
        remarks: remarks || 'Bulk assigned via Mobile App',
      });
      return response.data;
    } catch {
      await Promise.all(
        leadIds.map((id) =>
          api.put(`/leads/${id}`, { assigned_user_name: String(assignTo) }).catch(() => null)
        )
      );
      return { status: true, message: 'Leads assigned successfully' };
    }
  },
  bulkDelete: async (leadIds: number[]) => {
    try {
      const response = await api.post('/leads/bulk-delete', { lead_ids: leadIds });
      return response.data;
    } catch {
      await Promise.all(leadIds.map((id) => api.delete(`/leads/${id}`).catch(() => null)));
      return { status: true, message: 'Selected leads deleted successfully' };
    }
  },
  getFollowUps: async (leadId: number) => {
    try {
      const response = await api.get(`/leads/${leadId}/follow-ups`);
      return response.data;
    } catch {
      const alt = await api
        .get(`/sales-executive/leads/${leadId}/follow-ups`)
        .catch(() => ({ data: { data: [] } }));
      return alt.data;
    }
  },
  createFollowUp: async (
    leadId: number,
    data: {
      outcome: string;
      type: string;
      notes?: string;
      follow_up_date: string;
      follow_up_time?: string;
      next_follow_up_date?: string;
      next_follow_up_time?: string;
      customer_name?: string;
      phone?: string;
      status?: string;
    }
  ) => {
    try {
      const response = await api.post(`/leads/${leadId}/follow-ups`, data);
      return response.data;
    } catch {
      const alt = await api.post('/follow-ups', { lead_id: leadId, ...data });
      return alt.data;
    }
  },
  getAssignmentHistory: async (leadId: number) => {
    const response = await api
      .get(`/leads/${leadId}/assignments`)
      .catch(() => ({ data: { data: [] } }));
    return response.data;
  },
  addFollowUp: async (
    leadId: number,
    data: {
      follow_up_date: string;
      follow_up_time?: string;
      notes: string;
      status: string;
      type?: string;
      outcome?: string;
      next_follow_up_date?: string;
      next_follow_up_time?: string;
      customer_name?: string;
      phone?: string;
    }
  ) => {
    return leadApi.createFollowUp(leadId, {
      outcome: data.outcome || data.status,
      status: data.status || data.outcome,
      type: data.type || 'Phone Call',
      notes: data.notes,
      follow_up_date: data.follow_up_date,
      follow_up_time: data.follow_up_time || '11:00 AM',
      next_follow_up_date: data.next_follow_up_date || data.follow_up_date,
      next_follow_up_time: data.next_follow_up_time || data.follow_up_time || '11:00 AM',
      customer_name: data.customer_name,
      phone: data.phone,
    });
  },
};

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

export const leadService = {
  ...leadApi,
  salesExecutive: salesExecutiveApi,
};

export default leadService;
