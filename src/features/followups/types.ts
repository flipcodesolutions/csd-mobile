import { CustomerLead } from '../leads/types';

export type FollowUpTab = 'all' | 'overdue' | 'today' | 'upcoming';

export type InteractionType =
  | 'Phone Call'
  | 'Showroom Visit'
  | 'WhatsApp'
  | 'Email';

export type OutcomeStatus =
  | 'Interested / Call Back'
  | 'Quotation Requested'
  | 'Quotation Sent'
  | 'Negotiation / Price Discussion'
  | 'Not Reachable / Busy'
  | 'Deal Won'
  | 'Deal Won / Booking'
  | 'Lost to Competitor'
  | 'Lost to Competitor / Lost of Lead';

export const CANONICAL_CALL_OUTCOMES = [
  'Interested / Call Back',
  'Quotation Requested',
  'Quotation Sent',
  'Negotiation / Price Discussion',
  'Not Reachable / Busy',
  'Deal Won',
  'Lost to Competitor',
] as const;

export type CanonicalOutcome = (typeof CANONICAL_CALL_OUTCOMES)[number];

export const OUTCOME_SUBTITLES: Record<CanonicalOutcome, string> = {
  'Interested / Call Back': 'Positive prospect calls',
  'Quotation Requested': 'Awaiting quotation',
  'Quotation Sent': 'Delivered to client',
  'Negotiation / Price Discussion': 'Discussion / Discount pending',
  'Not Reachable / Busy': 'Callback retries needed',
  'Deal Won': 'Won conversions',
  'Lost to Competitor': 'Closed / Lost leads',
};

export const normalizeOutcome = (raw?: string | null): CanonicalOutcome | null => {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.toLowerCase().trim();
  if (s.includes('quotation sent') || s === 'quotation send' || s.includes('quote sent')) {
    return 'Quotation Sent';
  }
  if (s.includes('quotation req') || s.includes('quote req')) {
    return 'Quotation Requested';
  }
  if (s.includes('interested') || s.includes('call back') || s.includes('callback')) {
    return 'Interested / Call Back';
  }
  if (s.includes('negotiat') || s.includes('price')) {
    return 'Negotiation / Price Discussion';
  }
  if (s.includes('not reachable') || s.includes('busy') || s.includes('not answering')) {
    return 'Not Reachable / Busy';
  }
  if (s.includes('deal won') || s.includes('won') || s.includes('booking') || s.includes('deal converted')) {
    return 'Deal Won';
  }
  if (s.includes('lost') || s.includes('competitor')) {
    return 'Lost to Competitor';
  }
  return null;
};

export const isValidFollowUpOutcome = (raw?: string | null): boolean => {
  return normalizeOutcome(raw) !== null;
};

export interface FollowUpItem {
  id: number;
  lead_id?: number | null;
  customer_name: string;
  phone: string;
  calls_count?: number;
  city?: string;
  vehicle?: string;
  variant?: string;
  brand_name?: string;
  type: InteractionType;
  status: OutcomeStatus | string;
  notes: string;
  follow_up_date: string;
  follow_up_time: string;
  next_follow_up_date?: string;
  next_follow_up_time?: string;
  is_discount_requested?: boolean;
  discount_amount?: number;
  discount_reason?: string;
  discount_status?: 'pending' | 'approved' | 'rejected';
  proposed_price?: number | null;
  user_name?: string;
  rep?: string;
  priority?: 'Hot' | 'Warm' | 'Cold';
  lead?: CustomerLead;
  created_at?: string;
}

export interface FollowUpStats {
  overdue: number;
  due_today: number;
  upcoming: number;
  total: number;
}

export interface CreateFollowUpPayload {
  lead_id?: number | null;
  customer_name: string;
  phone: string;
  follow_up_date: string;
  follow_up_time: string;
  type: InteractionType;
  notes: string;
  next_follow_up_date?: string;
  next_follow_up_time?: string;
  status: string;
  lead_status_name?: string;
  is_discount_requested?: boolean;
  discount_amount?: number;
  proposed_price?: number | null;
  reason?: string;
}
