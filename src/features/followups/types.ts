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
  | 'Ready for Booking'
  | 'Not Answering / Busy'
  | 'Price Too High'
  | 'Bought Competitor Car'
  | 'Showroom Visit Done';

export interface FollowUpItem {
  id: number;
  lead_id?: number | null;
  customer_name: string;
  phone: string;
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
