export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export type QuotationStatus = 'sent' | 'pending' | 'print' | 'accepted' | 'rejected' | 'draft';

export interface Quotation {
  id: number;
  lead_id?: number | null;
  quotation_number?: string;
  quotation_date: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  subject?: string;
  description?: string;
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  status: QuotationStatus | string;
  subtotal: number;
  grand_total: number;
  total_amount?: number;
  total?: number;
  items?: QuotationItem[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  // Metadata for vehicle and parameters if present
  brand_name?: string;
  model_name?: string;
  variant_name?: string;
  executive_name?: string;
  executive_phone?: string;
}

export interface QuotationPriceBreakdown {
  csdPrice: string;
  gjRto: string;
  bhRto: string;
  crtm: string;
  insurance: string;
  accessories: string;
  warranty: string;
  diffAmtCash: string;
  msReward: string;
}

export interface QuotationFormData {
  leadId: number | null;
  clientName: string;
  clientMobile: string;
  clientEmail: string;
  cityJurisdiction: string;
  quotationDate: string; // e.g. 03.11.26 or DD-MM-YYYY

  // Vehicle
  brandId: number | null;
  brandName: string;
  modelId: number | null;
  modelName: string;
  variantId: number | null;
  variantName: string;
  sheetCarTitle: string;
  sheetModelTitle: string;
  fuelType: string;

  // Executive
  executiveName: string;
  executivePhone: string;

  // Breakdown
  breakdown: QuotationPriceBreakdown;
  grandTotal: number;
}

export interface EmailQuotationPayload {
  recipient_email: string;
  custom_subject?: string;
  custom_message?: string;
}

export interface QuotationFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  trash?: boolean;
  lead_id?: number | string;
  [key: string]: any;
}
