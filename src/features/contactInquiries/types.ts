export type InquiryStatus = 'new' | 'read' | string;

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
  updated_at?: string;
  is_read?: boolean;
}

export interface ContactInquiryStats {
  total: number;
  today: number;
  unread?: number;
}

export interface ContactInquiryPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ContactInquiryFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: 'all' | 'new' | 'read';
}

export interface ContactInquiryListResponse {
  status: boolean;
  data: ContactInquiry[];
  pagination?: ContactInquiryPagination;
  stats?: ContactInquiryStats;
  message?: string;
}

export interface ContactInquiryDetailResponse {
  status: boolean;
  data: ContactInquiry;
  message?: string;
}

