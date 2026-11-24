import { api } from '../../core/api/client';
import { dealApi } from '../deals/dealService';
import {
  CreateInsurancePayload,
  InsuranceFilterParams,
  InsurancePagination,
  InsuranceRecord,
  PendingInsuranceDeal,
  RenewInsurancePayload,
  UpdateInsurancePayload,
} from './types';

/**
 * In-memory set of insured deal IDs to immediately reflect deal insurance updates
 */
const locallyInsuredDealIds = new Set<number>();

export const markDealAsInsured = (dealId: number) => {
  locallyInsuredDealIds.add(Number(dealId));
};

export const isDealInsured = (dealId: number): boolean => {
  return locallyInsuredDealIds.has(Number(dealId));
};

/**
 * Common Indian Insurance Providers for Dropdown
 */
export const INSURANCE_COMPANIES = [
  'HDFC ERGO General Insurance',
  'ICICI Lombard General Insurance',
  'Tata AIG General Insurance',
  'Bajaj Allianz General Insurance',
  'Go Digit General Insurance',
  'Reliance General Insurance',
  'SBI General Insurance',
  'New India Assurance',
  'United India Insurance',
  'Oriental Insurance',
  'National Insurance Company',
  'Royal Sundaram General Insurance',
  'Cholamandalam MS General Insurance',
  'Universal Sompo General Insurance',
  'Iffco Tokio General Insurance',
];

export const INSURANCE_TYPES = [
  'Comprehensive',
  'Zero Depreciation (B2B)',
  'Third Party',
  'Own Damage',
  'Standard',
];

export const REMINDER_DAYS_OPTIONS = [
  { label: '15 Days Before (Default)', value: 15 },
  { label: '30 Days Before', value: 30 },
  { label: '45 Days Before', value: 45 },
  { label: '60 Days Before', value: 60 },
];

/**
 * Business Logic Calculation Helpers
 */
export function calculateExpireDate(deliveryDateStr?: string | null): string {
  if (!deliveryDateStr) {
    const today = new Date();
    today.setDate(today.getDate() + 365);
    return today.toISOString().split('T')[0];
  }
  const d = new Date(deliveryDateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + 365);
  return d.toISOString().split('T')[0];
}

export function calculateReminderDate(expireDateStr?: string | null, daysBefore: number = 15): string {
  if (!expireDateStr) return '';
  const d = new Date(expireDateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() - Number(daysBefore));
  return d.toISOString().split('T')[0];
}

export function calculateRenewalDates(currentExpireDateStr?: string | null, daysBefore: number = 15) {
  const baseDate = currentExpireDateStr ? new Date(currentExpireDateStr) : new Date();
  const d = isNaN(baseDate.getTime()) ? new Date() : baseDate;
  d.setDate(d.getDate() + 365);
  const newExpireDate = d.toISOString().split('T')[0];
  const newReminderDate = calculateReminderDate(newExpireDate, daysBefore);
  return { newExpireDate, newReminderDate };
}

export const formatIndianCurrency = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-IN');
};

export const insuranceService = {
  /**
   * Fetch Pending Insurance Deals (Deals where vehicle is booked but has NO insurance)
   * Cross-references with existing insurance policies to ensure insured deals are strictly excluded.
   */
  getPendingDeals: async (params?: { search?: string; page?: number; per_page?: number }) => {
    try {
      const [dealsRes, recordsRes] = await Promise.allSettled([
        dealApi.getAll({
          per_page: 150,
          search: params?.search,
        }),
        api.get('/insurance-records', { params: { per_page: 500 } }),
      ]);

      const allDeals: any[] =
        dealsRes.status === 'fulfilled' && dealsRes.value
          ? Array.isArray(dealsRes.value?.data)
            ? dealsRes.value.data
            : Array.isArray(dealsRes.value?.data?.data)
              ? dealsRes.value.data.data
              : []
          : [];

      // Collect all deal_ids that already have policies linked
      const existingInsuredDealIds = new Set<number>(locallyInsuredDealIds);
      if (recordsRes.status === 'fulfilled' && recordsRes.value?.data) {
        const rawRecs = recordsRes.value.data;
        const recList = Array.isArray(rawRecs?.data)
          ? rawRecs.data
          : Array.isArray(rawRecs)
            ? rawRecs
            : [];
        recList.forEach((r: any) => {
          if (r.deal_id) {
            existingInsuredDealIds.add(Number(r.deal_id));
          }
        });
      }

      // Filter only uninsured deals
      const pendingDeals: PendingInsuranceDeal[] = allDeals
        .filter((d: any) => {
          // If deal_id has an existing insurance record, exclude
          if (existingInsuredDealIds.has(Number(d.id))) {
            return false;
          }

          const hasIns =
            d.has_insurance === true ||
            d.has_insurance === 1 ||
            d.has_insurance === 'Yes' ||
            d.insurance === 'Yes' ||
            d.insurance === true ||
            !!d.insurance_company ||
            !!d.policy_number ||
            (typeof d.notes === 'string' &&
              (d.notes.toLowerCase().includes('insurance included: yes') ||
                d.notes.toLowerCase().includes('insurance: yes') ||
                d.notes.toLowerCase().includes('insurance:yes') ||
                /insurance.*yes/i.test(d.notes)));
          return !hasIns;
        })
        .map((d: any) => ({
          id: d.id,
          deal_number: d.deal_number || `#DEAL-${d.id}`,
          lead_id: d.lead_id || d.lead?.id || null,
          customer_name: d.customer_name || d.lead?.name || 'Customer',
          customer_phone: d.customer_phone || d.lead?.phone || '',
          customer_email: d.customer_email || d.lead?.email || '',
          customer_city: d.customer_city || d.customer_address || d.lead?.city || '',
          brand_name: d.brand_name || d.brand?.name || d.lead?.brand_name || d.lead?.brand?.name || '',
          model_variant: d.model_variant || d.lead?.model_variant || 'Standard Variant',
          color: d.color || 'Standard',
          vin_chassis_number:
            d.vin_chassis_number ||
            d.vin ||
            d.chassis_number ||
            d.chassis_no ||
            d.lead?.vin_chassis_number ||
            '',
          engine_number:
            d.engine_number ||
            d.engine_no ||
            d.lead?.engine_number ||
            '',
          registration_number:
            d.registration_number ||
            d.vehicle_number ||
            d.rto_no ||
            d.reg_no ||
            d.lead?.registration_number ||
            '',
          total_amount: Number(d.total_amount || 0),
          net_amount: Number(d.net_amount || d.total_amount || 0),
          paid_amount: Number(d.paid_amount || d.total_paid || 0),
          deal_status: d.deal_status || d.raw_status || 'booking_confirmed',
          payment_status: d.payment_status || 'Pending',
          has_insurance: 'No',
          expected_delivery_date: d.expected_delivery_date || '',
          actual_delivery_date: d.actual_delivery_date || '',
          created_at: d.created_at || new Date().toISOString(),
          notes: d.notes || '',
        }));

      // Search filtering client-side if needed
      let filtered = pendingDeals;
      if (params?.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        filtered = pendingDeals.filter(
          (d) =>
            d.customer_name.toLowerCase().includes(q) ||
            d.customer_phone.toLowerCase().includes(q) ||
            d.deal_number.toLowerCase().includes(q) ||
            d.model_variant.toLowerCase().includes(q)
        );
      }

      // Compute live KPI metrics across ALL uninsured deals
      const totalPendingCount = filtered.length;
      const totalPortfolioExposure = filtered.reduce(
        (acc, d) => acc + (d.net_amount || d.total_amount || 0),
        0
      );

      // Pagination slice for infinite scroll
      const page = params?.page || 1;
      const perPage = params?.per_page || 10;
      const startIndex = (page - 1) * perPage;
      const paginatedData = filtered.slice(startIndex, startIndex + perPage);

      const pagination: InsurancePagination = {
        current_page: page,
        last_page: Math.ceil(filtered.length / perPage) || 1,
        per_page: perPage,
        total: totalPendingCount,
        from: filtered.length ? startIndex + 1 : 0,
        to: Math.min(startIndex + perPage, filtered.length),
      };

      return {
        status: true,
        data: paginatedData,
        metrics: {
          pendingCount: totalPendingCount,
          portfolioExposure: totalPortfolioExposure,
        },
        pagination,
        hasMore: startIndex + perPage < filtered.length,
      };
    } catch (err: any) {
      console.error('getPendingDeals error:', err);
      return {
        status: false,
        data: [],
        metrics: { pendingCount: 0, portfolioExposure: 0 },
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
        hasMore: false,
      };
    }
  },

  /**
   * Fetch Insurance & Renewal Reminders (Expiring within next 15 days)
   */
  getReminders: async (params?: InsuranceFilterParams) => {
    try {
      const cleanParams: Record<string, any> = {
        days: params?.days || 15,
        page: params?.page || 1,
        per_page: params?.per_page || 10,
      };
      if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
      if (params?.from_date) cleanParams.from_date = params.from_date;
      if (params?.to_date) cleanParams.to_date = params.to_date;
      if (params?.status && params.status !== 'all') cleanParams.status = params.status;

      const response = await api.get('/insurances', { params: cleanParams });
      const rawData = response.data;

      let records: InsuranceRecord[] = [];
      if (Array.isArray(rawData?.data)) {
        records = rawData.data;
      } else if (Array.isArray(rawData)) {
        records = rawData;
      }

      const pagination: InsurancePagination = rawData?.pagination || {
        current_page: cleanParams.page,
        last_page: Math.ceil(records.length / cleanParams.per_page) || 1,
        per_page: cleanParams.per_page,
        total: records.length,
        from: records.length ? 1 : 0,
        to: records.length,
      };

      const hasMore = pagination.current_page < pagination.last_page;

      return {
        status: true,
        data: records,
        pagination,
        hasMore,
      };
    } catch (err: any) {
      console.error('getReminders error:', err);
      return {
        status: false,
        data: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
        hasMore: false,
      };
    }
  },

  /**
   * Fetch Master Insurance Records
   */
  getRecords: async (params?: InsuranceFilterParams) => {
    try {
      const cleanParams: Record<string, any> = {
        page: params?.page || 1,
        per_page: params?.per_page || 10,
      };
      if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
      if (params?.status && params.status !== 'all') cleanParams.status = params.status;
      if (params?.from_date) cleanParams.from_date = params.from_date;
      if (params?.to_date) cleanParams.to_date = params.to_date;

      const response = await api.get('/insurance-records', { params: cleanParams });
      const rawData = response.data;

      let records: InsuranceRecord[] = [];
      if (Array.isArray(rawData?.data)) {
        records = rawData.data;
      } else if (Array.isArray(rawData)) {
        records = rawData;
      }

      const pagination: InsurancePagination = rawData?.pagination || {
        current_page: cleanParams.page,
        last_page: Math.ceil(records.length / cleanParams.per_page) || 1,
        per_page: cleanParams.per_page,
        total: records.length,
        from: records.length ? 1 : 0,
        to: records.length,
      };

      const hasMore = pagination.current_page < pagination.last_page;

      return {
        status: true,
        data: records,
        pagination,
        hasMore,
      };
    } catch (err: any) {
      console.error('getRecords error:', err);
      return {
        status: false,
        data: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
        hasMore: false,
      };
    }
  },

  /**
   * Create New Insurance Policy & Link with Deal
   */
  createInsurance: async (data: CreateInsurancePayload) => {
    const payload: Record<string, any> = {
      customer_name: data.customer_name?.trim(),
      customer_phone: (data.customer_phone || data.customer_number || '')?.trim(),
      customer_number: (data.customer_number || data.customer_phone || '')?.trim(),
      customer_email: data.customer_email?.trim() || null,
      customer_city: (data.customer_city || data.customer_address || '')?.trim() || null,
      customer_address: (data.customer_address || data.customer_city || '')?.trim() || null,
      model_variant: (data.model_variant || data.vehicle_name || '')?.trim() || null,
      vehicle_name: (data.model_variant || data.vehicle_name || '')?.trim() || null,
      color: data.color?.trim() || 'Standard',
      delivery_date: data.delivery_date || data.policy_start_date || new Date().toISOString().split('T')[0],
      deal_id: data.deal_id ? Number(data.deal_id) : null,
      notes: data.notes || null,
      insurance_company: data.insurance_company?.trim() || 'HDFC ERGO General Insurance',
      policy_number: data.policy_number?.trim() || '',
      insurance_type: data.insurance_type?.trim() || 'Comprehensive',
      policy_start_date: data.policy_start_date || data.delivery_date || new Date().toISOString().split('T')[0],
      policy_expiry_date: data.policy_expiry_date || null,
      reminder_days_before: data.reminder_days_before ? Number(data.reminder_days_before) : 15,
      reminder_date: data.reminder_date || null,
      renewal_status: data.renewal_status || 'Pending',
    };

    if (data.premium_amount !== undefined && data.premium_amount !== null && String(data.premium_amount) !== '') {
      payload.premium_amount = Number(data.premium_amount);
    }
    if (data.idv_amount !== undefined && data.idv_amount !== null && String(data.idv_amount) !== '') {
      payload.idv_amount = Number(data.idv_amount);
    }
    const vNo = data.vehicle_number || data.registration_number;
    if (vNo) {
      payload.vehicle_number = vNo.trim();
      payload.registration_number = vNo.trim();
    }
    if (data.vin_chassis_number) {
      payload.vin_chassis_number = data.vin_chassis_number.trim();
    }
    if (data.engine_number) {
      payload.engine_number = data.engine_number.trim();
    }

    const response = await api.post('/insurances/store', payload);

    // If linked to deal, update deal state both locally and in backend
    if (data.deal_id) {
      markDealAsInsured(Number(data.deal_id));
      try {
        await dealApi.update(Number(data.deal_id), {
          has_insurance: true,
          insurance_company: payload.insurance_company,
          policy_number: payload.policy_number,
          insurance_type: payload.insurance_type,
          policy_start_date: payload.policy_start_date,
          policy_expiry_date: payload.policy_expiry_date,
          insurance_premium: payload.premium_amount,
          notes: `Insurance Included: Yes • Policy: ${payload.policy_number} (${payload.insurance_company})`,
        });
      } catch (e) {
        console.warn('Could not update deal insurance flag directly:', e);
      }
    }

    return response.data;
  },

  /**
   * Update existing insurance policy
   */
  updateInsurance: async (id: number, data: UpdateInsurancePayload) => {
    const response = await api.put(`/insurances/${id}`, data);
    return response.data;
  },

  /**
   * Renew Insurance Policy
   */
  renewInsurance: async (id: number, data: RenewInsurancePayload) => {
    const response = await api.post(`/insurances/${id}/renew`, data);
    return response.data;
  },

  /**
   * Fetch active insurance companies dynamically from backend Master API:
   * GET /api/insurance-companies/active-list
   */
  getCompanies: async (): Promise<string[]> => {
    try {
      // 1. Primary dedicated master endpoint from user
      const response = await api.get('/insurance-companies/active-list');
      if (response?.data) {
        const raw = response.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.companies)
              ? raw.companies
              : null;

        if (list && list.length > 0) {
          const names = list
            .map((c: any) =>
              typeof c === 'string'
                ? c.trim()
                : (c?.name || c?.company_name || c?.title || c?.company || c?.label || '').trim()
            )
            .filter(Boolean);

          if (names.length > 0) {
            // Return ONLY active companies from Master API without static mock additions
            return Array.from(new Set(names));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from /insurance-companies/active-list:', err);
    }

    // 2. Fallback: Check existing insurance records if endpoint returns empty or is restricted
    try {
      const recRes = await api.get('/insurance-records', { params: { per_page: 100 } });
      const rawRecs = recRes.data;
      const list = Array.isArray(rawRecs?.data)
        ? rawRecs.data
        : Array.isArray(rawRecs)
          ? rawRecs
          : [];
      const existingNames = list
        .map((r: any) => r?.insurance_company?.trim())
        .filter(Boolean);
      if (existingNames.length > 0) {
        return Array.from(new Set(existingNames));
      }
    } catch {
      // fallback
    }

    return [];
  },

  /**
   * Get Insurance Stats
   */
  getStats: async () => {
    try {
      const response = await api.get('/insurances/stats');
      return response.data;
    } catch (e) {
      console.warn('getInsuranceStats error:', e);
      return { status: false, data: null };
    }
  },
};
