export interface DealPaymentReceipt {
  id: number;
  deal_id: number;
  receipt_number?: string;
  receipt_no?: string;
  invoice_no?: string;
  invoice_number?: string;
  payment_date?: string;
  created_at?: string;
  payment_type: string;
  payment_mode: string;
  transaction_reference?: string;
  payment_reference?: string;
  utr?: string;
  bank_name?: string;
  received_by?: string;
  amount: number;
  status: 'cleared' | 'pending' | 'rejected' | string;
  notes?: string;
}

export interface DealItem {
  id?: number;
  deal_id?: number;
  description: string;
  hsn_code?: string;
  hsn?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Deal {
  id: number;
  deal_number: string;
  lead_id?: number;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_city?: string;
  city?: string;
  state?: string;
  customer_address?: string;
  brand_name?: string;
  model_name?: string;
  variant_name?: string;
  model_variant?: string;
  vehicle_spec?: string;
  color?: string;
  vin_chassis_number?: string;
  vin?: string;
  engine_number?: string;
  registration_number?: string;
  rto_no?: string;
  has_insurance?: boolean | string;
  insurance?: any;
  insurance_company?: string;
  policy_number?: string;
  total_amount: number;
  discount_amount?: number;
  net_amount: number;
  total_paid?: number;
  paid_amount?: number;
  balance_due?: number;
  balance_amount?: number;
  deal_status: string; // 'booking_confirmed' | 'chassis_allocated' | 'payment_received' | 'rto_processing' | 'in_transit' | 'pdi_completed' | 'delivery_ready' | 'delivered' | 'cancelled'
  delivery_stage?: string;
  payment_status: 'fully_paid' | 'partial' | 'partially_paid' | 'pending' | string;
  booking_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  sales_executive_name?: string;
  created_at?: string;
  deleted_at?: string | null;
  payments?: DealPaymentReceipt[];
  items?: DealItem[];
  lead?: any;
}

export interface DealStats {
  total_deals: number;
  total_gross_value: number;
  total_collected: number;
  total_pending_balance: number;
}

export interface DealFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  deal_status?: string;
  stage?: string;
  payment_status?: string;
  from_date?: string;
  to_date?: string;
  trash?: boolean;
}

export interface UpdateDealPayload {
  deal_status?: string;
  color?: string;
  vin_chassis_number?: string;
  engine_number?: string;
  registration_number?: string;
  expected_delivery_date?: string;
  notes?: string;
  has_insurance?: boolean | string;
  insurance_company?: string;
  policy_number?: string;
  insurance_type?: string;
  policy_start_date?: string;
  policy_expiry_date?: string;
  insurance_premium?: number;
}

export interface CreateDealPaymentPayload {
  deal_id: number;
  invoice_number?: string;
  payment_date: string;
  payment_type: string;
  payment_mode: string;
  amount: number;
  received_by: string;
  transaction_reference?: string;
  payment_reference?: string;
  bank_name?: string;
  remarks?: string;
  notes?: string;
  items?: {
    description: string;
    hsn?: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

