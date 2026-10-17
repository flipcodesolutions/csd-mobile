import { api } from '../../core/api/client';
import { CreateFollowUpPayload, FollowUpItem, FollowUpStats } from './types';

export const MOCK_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: 101,
    lead_id: 42,
    customer_name: 'Maj. Rohit Sharma',
    phone: '8555555555',
    city: 'Pune Cantonment',
    vehicle: 'Brezza ZXi Dual Tone',
    variant: 'Dual Tone Hybrid',
    brand_name: 'Maruti Suzuki',
    type: 'Phone Call',
    status: 'Interested / Call Back',
    notes: 'Discussed CSD loan sanction documents. Officer requested delivery before Diwali.',
    follow_up_date: '2026-10-15',
    follow_up_time: '11:30 AM',
    next_follow_up_date: new Date().toISOString().split('T')[0], // Today
    next_follow_up_time: '10:00 AM',
    is_discount_requested: true,
    discount_amount: 25000,
    discount_reason: 'Officer comparing quote with competing dealer; ready to book immediately.',
    discount_status: 'pending',
    rep: 'Alexander Vance',
    priority: 'Hot',
  },
  {
    id: 102,
    lead_id: 43,
    customer_name: 'Col. Arvind Rathore',
    phone: '9822012345',
    city: 'Delhi Military HQ',
    vehicle: 'Grand Vitara Alpha Plus AllGrip',
    variant: 'Alpha+ AWD',
    brand_name: 'Maruti Suzuki',
    type: 'Showroom Visit',
    status: 'Quotation Requested',
    notes: 'Visited showroom with family. Impressed with hybrid mileage. Sent revised CSD quote.',
    follow_up_date: '2026-10-14',
    follow_up_time: '04:15 PM',
    next_follow_up_date: '2026-10-16', // Overdue
    next_follow_up_time: '02:30 PM',
    is_discount_requested: true,
    discount_amount: 30000,
    discount_reason: 'Corporate army bulk group enquiry.',
    discount_status: 'approved',
    rep: 'Rohan Sharma',
    priority: 'Hot',
  },
  {
    id: 103,
    lead_id: 44,
    customer_name: 'Capt. Vikram Batra',
    phone: '9876543210',
    city: 'Chandigarh Station',
    vehicle: 'Scorpio-N Z8L 4x4',
    variant: 'Z8 Luxury Diesel 4WD',
    brand_name: 'Mahindra',
    type: 'WhatsApp',
    status: 'Ready for Booking',
    notes: 'CSD purchase authority letter verified. Token advance of ₹50,000 agreed.',
    follow_up_date: '2026-10-16',
    follow_up_time: '01:00 PM',
    next_follow_up_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // Upcoming
    next_follow_up_time: '11:00 AM',
    is_discount_requested: false,
    rep: 'Alexander Vance',
    priority: 'Hot',
  },
  {
    id: 104,
    lead_id: 45,
    customer_name: 'Sub. Rajesh Gurung',
    phone: '9765432109',
    city: 'Dehradun',
    vehicle: 'Swift ZXi Plus AMT',
    variant: 'ZXi+ AMT Dual Tone',
    brand_name: 'Maruti Suzuki',
    type: 'Phone Call',
    status: 'Price Too High',
    notes: 'Demanded additional dealer accessories kit for CSD purchase.',
    follow_up_date: '2026-10-12',
    follow_up_time: '10:45 AM',
    next_follow_up_date: '2026-10-14', // Overdue
    next_follow_up_time: '03:00 PM',
    is_discount_requested: true,
    discount_amount: 15000,
    discount_reason: 'Local dealer offering free mats and coating.',
    discount_status: 'rejected',
    rep: 'Vikram Singh',
    priority: 'Warm',
  },
  {
    id: 105,
    lead_id: 46,
    customer_name: 'Lt. Karan Thapar',
    phone: '9811223344',
    city: 'Jaipur Command',
    vehicle: 'Thar AX Opt Hard Top',
    variant: 'AX Opt Diesel MT',
    brand_name: 'Mahindra',
    type: 'Showroom Visit',
    status: 'Showroom Visit Done',
    notes: 'Test drive completed. Waiting for month-end CSD allocation window.',
    follow_up_date: '2026-10-16',
    follow_up_time: '05:00 PM',
    next_follow_up_date: new Date().toISOString().split('T')[0], // Today
    next_follow_up_time: '04:30 PM',
    is_discount_requested: false,
    rep: 'Alexander Vance',
    priority: 'Hot',
  },
  {
    id: 106,
    lead_id: 47,
    customer_name: 'Hav. Manoj Tiwari',
    phone: '9455667788',
    city: 'Lucknow',
    vehicle: 'Baleno Alpha MT',
    variant: 'Alpha 1.2 DualJet',
    brand_name: 'Maruti Suzuki',
    type: 'Email',
    status: 'Interested / Call Back',
    notes: 'Sent brochure and CSD base price calculation sheet.',
    follow_up_date: '2026-10-15',
    follow_up_time: '02:00 PM',
    next_follow_up_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // Upcoming
    next_follow_up_time: '10:00 AM',
    is_discount_requested: false,
    rep: 'Rohan Sharma',
    priority: 'Cold',
  },
];

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
    } catch (err) {
      console.log('Using calculated stats fallback:', err);
    }

    // Default calculated stats fallback
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
      if (response.data?.status && Array.isArray(response.data?.data)) {
        return {
          data: response.data.data,
          kpis: response.data.kpis || {
            overdue: 0,
            due_today: 0,
            upcoming: 0,
            total: response.data.data.length,
          },
          pagination: response.data.pagination || {
            current_page: 1,
            last_page: 1,
            per_page: params?.per_page || 10,
            total: response.data.data.length,
          },
        };
      }
    } catch (err) {
      console.log('Using MOCK_FOLLOW_UPS fallback:', err);
    }

    // Client-side filtering fallback
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
