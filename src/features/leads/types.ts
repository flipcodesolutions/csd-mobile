export interface CustomerLead {
  id: number;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  home_town?: string;
  posting?: string;
  state?: string;
  birth_date?: string;
  birthday?: string;
  anniversary_date?: string;
  vehicle_segment: '2 Wheeler' | '4 Wheeler';
  brand_id?: number;
  brand_name?: string;
  model_id?: number;
  model_name?: string;
  variant_id?: number;
  variant_name?: string;
  model_variant: string;
  priority: 'Hot' | 'Warm' | 'Cold';
  purchase_timeline?: string;
  budget?: string | number;
  source_id?: number;
  source_name?: string;
  source?: { id?: number; title?: string; name?: string };
  lead_source?: string;
  status_id?: number;
  status_name?: string;
  lead_status?: string;
  assigned_to?: number;
  assigned_user_name?: string;
  discount_approval_status?: string;
  requested_discount?: number | string;
  notes?: string;
  is_converted?: boolean;
  created_at?: string;
  follow_ups?: Array<{
    id: number;
    follow_up_date: string;
    notes: string;
    status: string;
    created_at?: string;
  }>;
}

export const LEAD_STATUS_OPTIONS = [
  'New',
  'Follow-up',
  'Quotation Sent',
  'Deal & Booking',
  'Lost',
] as const;

export const PURCHASE_TIMELINE_OPTIONS = [
  'Immediate (< 7 Days)',
  '15-30 Days',
  'Exploring / Later',
] as const;

export const INSURANCE_TYPE_OPTIONS = [
  'Comprehensive (1+3 Years)',
  'Third Party',
  'Own Damage (OD)',
  'Zero Depreciation (Bumper to Bumper)',
] as const;

export const REMINDER_DAYS_OPTIONS = [
  '15 Days Before Expiry',
  '30 Days Before Expiry',
  '45 Days Before Expiry',
  '60 Days Before Expiry',
] as const;

export interface BrandItem {
  id: number;
  name: string;
}

export interface ModelItem {
  id: number;
  brand_id: number;
  name: string;
}

export interface VariantItem {
  id: number;
  model_id: number;
  name: string;
  price?: string;
}

export interface SourceItem {
  id: number;
  title?: string;
  name?: string;
}

export interface StatusItem {
  id: number;
  name: string;
}

export interface UserItem {
  id: number;
  name: string;
  role?: string;
  role_name?: string;
}
