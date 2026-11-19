export interface ExpenseCategory {
  id: number;
  name: string;
  title?: string;
  description?: string;
  status: number | string;
  expenses_count?: number;
  total_expenses_amount?: string | number;
}

export interface ExpenseRecord {
  id: number;
  expense_date: string;
  category_id: number;
  title: string;
  description?: string;
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | string;
  reference_no?: string;
  attachment?: string | null;
  status: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  category?: {
    id: number;
    name: string;
    status?: number;
  };
  creator?: {
    id: number;
    name: string;
    role?: string;
  };

  // Normalized properties for consistent UI consumption
  invoice_no: string;
  party_name: string;
  pay_by: string;
  payment_type: 'Online' | 'Offline';
  remark?: string;
  date: string;
  category_name: string;
}

export interface ExpenseFilterParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number;
  payment_method?: 'Cash' | 'Bank Transfer';
  from_date?: string;
  to_date?: string;
}

export interface ExpensePagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreateExpensePayload {
  expense_date: string;
  category_id: number;
  title: string;
  description: string;
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer';
  reference_no?: string;
  status?: string;
  attachment?: string | null;
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export interface ExpenseApiResponse {
  status: boolean;
  message?: string;
  data: ExpenseRecord[];
  pagination?: ExpensePagination;
  total?: number;
  total_amount?: number;
}

