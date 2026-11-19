export interface ActivityLogUser {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_phone?: string;
  user?: ActivityLogUser;
  module: string;
  action: string;
  detail: string;
  ip_address: string;
  created_at: string;
  raw_time?: string;
}

export interface ActivityLogPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface ActivityLogFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  user_id?: string | number;
  module?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  from_date?: string;
  to_date?: string;
}

export interface ActivityLogFilterOptions {
  modules: string[];
  actions: string[];
  users: ActivityLogUser[];
}

