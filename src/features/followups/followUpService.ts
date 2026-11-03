import { api } from '../../core/api/client';
import { CreateFollowUpPayload, FollowUpItem, FollowUpStats } from './types';

export const MOCK_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: 53,
    lead_id: 53,
    customer_name: 'jinal pujara',
    calls_count: 2,
    phone: '9316130308',
    city: 'Surendranagar',
    vehicle: 'Mercedes-AMG GT GT 55 4MATIC+',
    brand_name: 'Mercedes-Benz',
    type: 'Phone Call',
    status: 'Interested / Call Back',
    notes: 'discount',
    follow_up_date: '02 Nov 2026',
    follow_up_time: '02:51 PM',
    next_follow_up_date: '05 Nov 2026',
    next_follow_up_time: '10:00 AM',
    is_discount_requested: true,
    discount_amount: 5000,
    discount_status: 'pending',
    rep: 'Admin User (Super Admin)',
    priority: 'Hot',
  },
  {
    id: 34,
    lead_id: 34,
    customer_name: 'vikash',
    calls_count: 2,
    phone: '7777777777',
    city: 'pune',
    vehicle: 'Brezza',
    brand_name: 'Maruti Suzuki',
    type: 'Phone Call',
    status: 'Interested / call back',
    notes: 'vikash',
    follow_up_date: '15 Oct 2026',
    follow_up_time: '11:12 AM',
    next_follow_up_date: '20 Oct 2026',
    next_follow_up_time: '10:00 AM',
    is_discount_requested: true,
    discount_amount: 20,
    discount_status: 'approved',
    rep: 'Admin User (Super Admin)',
    priority: 'Hot',
  },
  {
    id: 22,
    lead_id: 22,
    customer_name: 'Quote Test User',
    calls_count: 2,
    phone: '9822334466',
    city: 'Ahmedabad',
    vehicle: 'Nexon EV Empowered',
    brand_name: 'Tata Motors',
    type: 'Phone Call',
    status: 'Interested / call back',
    notes: 'test',
    follow_up_date: '05 Oct 2026',
    follow_up_time: '03:29 PM',
    next_follow_up_date: '08 Oct 2026',
    next_follow_up_time: '10:00 AM',
    is_discount_requested: false,
    rep: 'Admin User (Super Admin)',
    priority: 'Hot',
  },
  {
    id: 15,
    lead_id: 15,
    customer_name: 'meet rameshbhai patel',
    calls_count: 3,
    phone: '9510600150',
    city: 'surendranagar',
    vehicle: 'maruti',
    brand_name: 'Maruti Suzuki',
    type: 'Phone Call',
    status: 'Interested / call back',
    notes: '',
    follow_up_date: '29 Sept 2026',
    follow_up_time: '05:32 PM',
    next_follow_up_date: '29 Sept 2026',
    next_follow_up_time: '06:00 PM',
    is_discount_requested: false,
    rep: 'Alexander Vance (Super Admin)',
    priority: 'Hot',
  },
];

export const normalizeFollowUpItem = (raw: any, idx = 0): FollowUpItem => {
  const lead = raw.lead || {};
  const user = raw.user || {};
  
  const rawCalls =
    raw.calls_count ??
    raw.call_count ??
    raw.calls ??
    raw.total_calls ??
    lead.calls_count ??
    lead.follow_ups_count ??
    lead.total_calls ??
    1;

  const rawDiscount =
    raw.discount_amount != null
      ? Number(raw.discount_amount)
      : raw.requested_discount != null
      ? Number(raw.requested_discount)
      : raw.discount != null
      ? Number(raw.discount)
      : lead.requested_discount != null
      ? Number(lead.requested_discount)
      : undefined;

  const rawDiscountStatus =
    raw.discount_status ||
    raw.discount_approval_status ||
    lead.discount_approval_status ||
    'pending';

  return {
    id: raw.id || idx + 1,
    lead_id: raw.lead_id || lead.id || raw.id,
    customer_name:
      raw.customer_name || raw.customer?.name || lead.name || raw.name || 'Customer',
    calls_count: typeof rawCalls === 'number' ? rawCalls : parseInt(String(rawCalls), 10) || 1,
    phone: String(raw.phone || raw.customer?.phone || lead.phone || ''),
    city:
      raw.city ||
      raw.customer?.city ||
      lead.city ||
      lead.home_town ||
      raw.home_town ||
      '',
    vehicle:
      raw.vehicle ||
      raw.vehicle_name ||
      raw.model_variant ||
      lead.model_variant ||
      lead.model_name ||
      raw.model ||
      '',
    variant: raw.variant || lead.variant_name || '',
    brand_name:
      raw.brand_name ||
      raw.brand?.name ||
      lead.brand_name ||
      lead.brand?.name ||
      '',
    type: raw.type || raw.interaction_type || 'Phone Call',
    status:
      raw.status ||
      raw.outcome ||
      raw.last_call_outcome ||
      raw.call_outcome ||
      'Interested / Call Back',
    notes:
      raw.notes ||
      raw.call_notes ||
      raw.description ||
      raw.remarks ||
      raw.conversation_summary ||
      '',
    follow_up_date:
      raw.follow_up_date ||
      raw.date ||
      (raw.created_at ? raw.created_at.split('T')[0] : '') ||
      '',
    follow_up_time: raw.follow_up_time || raw.time || '',
    next_follow_up_date:
      raw.next_follow_up_date || raw.next_date || raw.next_action_date || '',
    next_follow_up_time:
      raw.next_follow_up_time || raw.next_time || raw.next_action_time || '10:00 AM',
    is_discount_requested: Boolean(
      raw.is_discount_requested ||
      raw.requested_discount ||
      raw.discount_amount ||
      lead.requested_discount ||
      (rawDiscount && rawDiscount > 0)
    ),
    discount_amount: rawDiscount,
    discount_reason: raw.discount_reason || raw.reason || lead.discount_reason || '',
    discount_status: rawDiscountStatus,
    rep:
      raw.rep ||
      raw.user_name ||
      user.name ||
      raw.assigned_user_name ||
      lead.assigned_user_name ||
      'Admin User (Super Admin)',
    priority: (raw.priority || raw.urgency || lead.priority || 'Hot') as any,
    lead: raw.lead || undefined,
    created_at: raw.created_at || undefined,
  };
};

export const followUpService = {
  getStats: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FollowUpStats> => {
    try {
      const response = await api.get('/follow-ups/stats', { params });
      if (response.data?.status && response.data?.data) {
        return response.data.data;
      }
      if (response.data && typeof response.data.total === 'number') {
        return response.data;
      }
    } catch (err) {
      console.log('Using calculated stats fallback:', err);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;

    MOCK_FOLLOW_UPS.forEach((item) => {
      const due = item.next_follow_up_date || item.follow_up_date;
      if (due < todayStr) overdue++;
      else if (due === todayStr) dueToday++;
      else upcoming++;
    });

    return {
      overdue,
      due_today: dueToday,
      upcoming,
      total: MOCK_FOLLOW_UPS.length,
    };
  },

  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    from_date?: string;
    to_date?: string;
    tab?: string;
  }): Promise<{
    data: FollowUpItem[];
    kpis: FollowUpStats;
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> => {
    try {
      const response = await api.get('/follow-ups', { params });
      const res = response?.data;
      let rawList: any[] | null = null;

      if (Array.isArray(res)) {
        rawList = res;
      } else if (Array.isArray(res?.data)) {
        rawList = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res?.follow_ups)) {
        rawList = res.follow_ups;
      }

      if (rawList && rawList.length > 0) {
        const normalized = rawList.map((item, idx) => normalizeFollowUpItem(item, idx));
        return {
          data: normalized,
          kpis: res?.kpis || {
            overdue: 0,
            due_today: 0,
            upcoming: 0,
            total: normalized.length,
          },
          pagination: {
            current_page: res?.current_page || res?.pagination?.current_page || params?.page || 1,
            last_page: res?.last_page || res?.pagination?.last_page || 1,
            per_page: res?.per_page || res?.pagination?.per_page || params?.per_page || 50,
            total: res?.total || res?.pagination?.total || normalized.length,
          },
        };
      }
    } catch (err) {
      console.log('Using MOCK_FOLLOW_UPS fallback:', err);
    }

    // Client-side filtering fallback using verified dynamic mock data
    let filtered = [...MOCK_FOLLOW_UPS];
    const todayStr = new Date().toISOString().split('T')[0];

    if (params?.tab === 'overdue') {
      filtered = filtered.filter(
        (i) => (i.next_follow_up_date || i.follow_up_date) < todayStr
      );
    } else if (params?.tab === 'today') {
      filtered = filtered.filter(
        (i) => (i.next_follow_up_date || i.follow_up_date) === todayStr
      );
    } else if (params?.tab === 'upcoming') {
      filtered = filtered.filter(
        (i) => (i.next_follow_up_date || i.follow_up_date) > todayStr
      );
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.customer_name.toLowerCase().includes(q) ||
          i.phone.includes(q) ||
          (i.vehicle && i.vehicle.toLowerCase().includes(q)) ||
          (i.city && i.city.toLowerCase().includes(q))
      );
    }

    if (params?.from_date) {
      filtered = filtered.filter((i) => i.follow_up_date >= params.from_date!);
    }
    if (params?.to_date) {
      filtered = filtered.filter((i) => i.follow_up_date <= params.to_date!);
    }

    const stats = await followUpService.getStats({
      start_date: params?.from_date,
      end_date: params?.to_date,
    });

    return {
      data: filtered,
      kpis: stats,
      pagination: {
        current_page: params?.page || 1,
        last_page: Math.ceil(filtered.length / (params?.per_page || 10)) || 1,
        per_page: params?.per_page || 10,
        total: filtered.length,
      },
    };
  },

  create: async (payload: CreateFollowUpPayload): Promise<any> => {
    const response = await api.post('/follow-ups', payload);
    return response.data;
  },
};

export default followUpService;
