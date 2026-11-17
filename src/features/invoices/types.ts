import { Deal, DealPaymentReceipt } from '../deals/types';

export interface InvoiceItem {
  id?: number;
  description: string;
  hsn?: string;
  hsn_code?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceRecord {
  id: number | string;
  payment_id?: number;
  deal_id: number;
  deal_number: string;
  invoice_no: string;
  payment_date: string;
  time?: string;
  created_at?: string;
  payment_type: string;
  payment_mode: string;
  transaction_reference?: string;
  bank_name?: string;
  received_by?: string;
  amount: number;
  status: string;
  notes?: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_city?: string;
  vehicle_model?: string;
  color?: string;
  vin?: string;
  registration_number?: string;
  has_insurance?: boolean | string;
  deal_status?: string;
  deal_total_amount: number;
  deal_paid_amount: number;
  deal_balance_due: number;
  items?: InvoiceItem[];
  parent_deal?: Deal;
}

export interface InvoiceStats {
  total_deal_volume: number;
  total_collected: number;
  total_pending: number;
  total_invoices_count: number;
  total_deals_count: number;
}

export interface EnrichedDeal extends Deal {
  computedTotalPaid: number;
  computedBalanceDue: number;
  computedPercentPaid: number;
  invoices: InvoiceRecord[];
  invoicesCount: number;
}

export interface CreateInvoicePayload {
  deal_id: number;
  amount: number;
  payment_type: string;
  payment_mode: string;
  payment_date: string;
  invoice_no: string;
  transaction_reference?: string;
  bank_name?: string;
  received_by?: string;
  remarks?: string;
  notes?: string;
  items?: InvoiceItem[];
}

