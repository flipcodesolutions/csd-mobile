export interface InsuranceHistoryItem {
  id?: number;
  insurance_company?: string;
  policy_number?: string;
  insurance_type?: string;
  policy_start_date?: string;
  policy_expiry_date?: string;
  premium_amount?: number;
  renewed_at?: string;
  created_at?: string;
  notes?: string;
}

export interface InsuranceRecord {
  id: number;
  deal_id?: number | null;
  deal?: {
    id: number;
    deal_number?: string;
    total_amount?: number;
    net_amount?: number;
    color?: string;
  } | null;
  customer_name: string;
  customer_phone?: string;
  customer_number?: string;
  customer_email?: string | null;
  customer_city?: string | null;
  customer_address?: string | null;
  model_variant?: string | null;
  vehicle_name?: string | null;
  color?: string;
  delivery_date?: string | null;
  vehicle_number?: string | null;
  registration_number?: string | null;
  vin_chassis_number?: string | null;
  engine_number?: string | null;
  insurance_company?: string | null;
  policy_number?: string | null;
  insurance_type?: string | null;
  policy_start_date?: string | null;
  policy_expiry_date?: string | null;
  insurance_expire_date?: string | null;
  reminder_days_before?: number;
  reminder_date?: string | null;
  premium_amount?: number | null;
  idv_amount?: number | null;
  renewal_status?: 'Pending' | 'Renewed' | 'Expired' | string;
  status?: string;
  notes?: string | null;
  renewal_history?: InsuranceHistoryItem[];
  created_at?: string;
  updated_at?: string;
}

export interface PendingInsuranceDeal {
  id: number;
  deal_number: string;
  lead_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_city?: string;
  brand_name?: string;
  model_variant: string;
  color: string;
  vin_chassis_number?: string;
  engine_number?: string;
  registration_number?: string;
  total_amount: number;
  net_amount: number;
  paid_amount: number;
  deal_status: string;
  payment_status: string;
  has_insurance: string | boolean;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  created_at: string;
  notes?: string;
}

export interface CreateInsurancePayload {
  deal_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_number?: string;
  customer_email?: string | null;
  customer_city?: string | null;
  customer_address?: string | null;
  model_variant?: string | null;
  vehicle_name?: string | null;
  color?: string;
  delivery_date?: string;
  insurance_company: string;
  policy_number: string;
  insurance_type: string;
  vehicle_number?: string;
  registration_number?: string;
  vin_chassis_number?: string;
  engine_number?: string;
  policy_start_date: string;
  policy_expiry_date: string;
  reminder_days_before: number;
  reminder_date?: string;
  premium_amount?: number;
  idv_amount?: number;
  renewal_status?: string;
  notes?: string;
}

export interface RenewInsurancePayload {
  customer_name?: string;
  vehicle_number?: string;
  insurance_company: string;
  policy_number: string;
  insurance_type: string;
  policy_start_date: string;
  policy_expiry_date: string;
  premium_amount?: number;
  reminder_days_before: number;
  reminder_date?: string;
  notes?: string;
}

export interface UpdateInsurancePayload {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_city?: string;
  model_variant?: string;
  vehicle_number?: string;
  insurance_company?: string;
  policy_number?: string;
  insurance_type?: string;
  policy_start_date?: string;
  policy_expiry_date?: string;
  premium_amount?: number;
  reminder_days_before?: number;
  reminder_date?: string;
  renewal_status?: string;
  notes?: string;
}

export interface InsuranceFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  days?: number;
}

export interface InsurancePagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

