import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { api } from '../../core/api/client';
import {
  CreateExpensePayload,
  ExpenseCategory,
  ExpenseFilterParams,
  ExpensePagination,
  ExpenseRecord,
  UpdateExpensePayload,
} from './types';

export const DEFAULT_FALLBACK_CATEGORIES: ExpenseCategory[] = [
  { id: 1, name: 'Office Rent', title: 'Office Rent', description: 'Showroom and office rent', status: 1 },
  { id: 2, name: 'Electricity Bill', title: 'Electricity Bill', description: 'Power and lighting bill', status: 1 },
  { id: 3, name: 'Staff Welfare & Food', title: 'Staff Welfare & Food', description: 'Tea and refreshments', status: 1 },
  { id: 4, name: 'Showroom Maintenance', title: 'Showroom Maintenance', description: 'Facility maintenance & repairs', status: 1 },
  { id: 5, name: 'Internet & Telephony', title: 'Internet & Telephony', description: 'Broadband & calling desk', status: 1 },
  { id: 6, name: 'Printing & Stationary', title: 'Printing & Stationary', description: 'Quotation pads & stationery', status: 1 },
];

/**
 * Normalizes backend expense entity to match UI layout requirements
 */
export function normalizeExpense(item: any): ExpenseRecord {
  const isOnline = item.payment_method !== 'Cash';
  const rawDate =
    item.expense_date ||
    item.date ||
    (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);

  // Extract party name and remark from description if combined as "Party - Remark"
  const rawDesc = item.description || item.party_name || item.title || '—';
  let partyName = rawDesc;
  let remark = item.remark || '';
  if (rawDesc.includes(' - ')) {
    const parts = rawDesc.split(' - ');
    partyName = parts[0]?.trim() || rawDesc;
    if (!remark && parts.length > 1) {
      remark = parts.slice(1).join(' - ').trim();
    }
  }

  return {
    ...item,
    id: item.id,
    expense_date: rawDate,
    date: rawDate,
    category_id: item.category_id || item.category?.id || 1,
    category_name: item.category?.name || item.title || 'Expense',
    title: item.title || item.category?.name || 'Expense',
    amount: Number(item.amount) || 0,
    invoice_no: item.reference_no || item.invoice_no || `EXP-${item.id}`,
    party_name: partyName,
    remark: remark,
    pay_by: item.creator?.name || item.pay_by || 'Admin User',
    payment_type: isOnline ? 'Online' : 'Offline',
    payment_method: item.payment_method || (isOnline ? 'Bank Transfer' : 'Cash'),
    reference_no: item.reference_no || '',
    status: item.status || 'Paid',
    attachment: item.attachment || null,
  };
}

export const expenseService = {
  /**
   * Fetch active expense categories:
   * GET /api/expense-categories
   */
  getCategories: async (status?: number): Promise<ExpenseCategory[]> => {
    try {
      const params: any = {};
      if (status !== undefined) {
        params.status = status;
      }
      const response = await api.get('/expense-categories', { params });
      const raw = response.data;
      const list =
        raw && Array.isArray(raw.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw)
          ? raw
          : [];

      const parsed: ExpenseCategory[] = list.map((c: any) => ({
        id: Number(c.id),
        name: c.name || c.title || 'Category',
        title: c.name || c.title || 'Category',
        description: c.description || '',
        status: c.status,
        expenses_count: c.expenses_count,
        total_expenses_amount: c.total_expenses_amount,
      }));

      // Filter active if requested
      const activeOnly =
        status !== undefined
          ? parsed.filter(
              (c) =>
                c.status === 1 ||
                (c.status as any) === '1' ||
                (c.status as any) === 'Active' ||
                c.status === undefined ||
                c.status === null
            )
          : parsed;

      if (activeOnly.length > 0) {
        return activeOnly;
      }

      // If backend returned empty list, fallback to standard seed categories
      return DEFAULT_FALLBACK_CATEGORIES;
    } catch (err) {
      console.warn('Failed to load expense categories from API, using fallback:', err);
      return DEFAULT_FALLBACK_CATEGORIES;
    }
  },

  /**
   * Fetch paginated and filtered expenses:
   * GET /api/expenses
   */
  getExpenses: async (
    params?: ExpenseFilterParams
  ): Promise<{
    data: ExpenseRecord[];
    pagination: ExpensePagination;
    totalAmount: number;
  }> => {
    const cleanParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 15,
    };

    if (params?.search && params.search.trim()) {
      cleanParams.search = params.search.trim();
    }
    if (params?.category_id) {
      cleanParams.category_id = params.category_id;
    }
    if (params?.payment_method) {
      cleanParams.payment_method = params.payment_method;
    }
    if (params?.from_date) {
      cleanParams.from_date = params.from_date;
    }
    if (params?.to_date) {
      cleanParams.to_date = params.to_date;
    }

    const response = await api.get('/expenses', { params: cleanParams });
    const raw = response.data;
    const list = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw)
        ? raw
        : [];

    const normalized = list.map(normalizeExpense);

    const pagination: ExpensePagination = raw?.pagination || {
      current_page: cleanParams.page,
      last_page: raw?.last_page || Math.max(1, Math.ceil((raw?.total || list.length) / cleanParams.per_page)),
      per_page: cleanParams.per_page,
      total: raw?.total ?? list.length,
    };

    const totalAmount =
      Number(raw?.total_amount) ||
      normalized.reduce((acc: number, curr: ExpenseRecord) => acc + curr.amount, 0);

    return {
      data: normalized,
      pagination,
      totalAmount,
    };
  },

  /**
   * Create new expense record:
   * POST /api/expenses
   */
  createExpense: async (payload: CreateExpensePayload): Promise<any> => {
    const response = await api.post('/expenses', payload);
    return response.data;
  },

  /**
   * Update existing expense record:
   * PUT /api/expenses/:id
   */
  updateExpense: async (id: number, payload: UpdateExpensePayload): Promise<any> => {
    try {
      const response = await api.put(`/expenses/${id}`, payload);
      return response.data;
    } catch (err: any) {
      // Fallback for servers rejecting PUT with form data / method spoofing
      if (err?.response?.status === 405) {
        const response = await api.post(`/expenses/${id}`, {
          ...payload,
          _method: 'PUT',
        });
        return response.data;
      }
      throw err;
    }
  },

  /**
   * HARD DELETE expense record permanently:
   * DELETE /api/expenses/:id
   */
  deleteExpense: async (id: number): Promise<any> => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Generates formatted printable HTML for an Expense Voucher
   */
  generateVoucherHtml: (item: ExpenseRecord): string => {
    const formattedDate = item.date || item.expense_date
      ? new Date(item.date || item.expense_date!).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN');

    const formattedAmount = (item.amount || 0).toLocaleString('en-IN');
    const isOnline = item.payment_type === 'Online' || item.payment_method !== 'Cash';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense Voucher - ${item.invoice_no || `EXP-${item.id}`}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f8fafc; color: #0f172a; padding: 24px; font-size: 13px; line-height: 1.5; }
    .voucher-card { max-width: 650px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #58632a; margin-bottom: 20px; }
    .brand-title { font-size: 20px; font-weight: 800; color: #58632a; letter-spacing: 0.5px; }
    .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .voucher-badge-box { text-align: right; }
    .voucher-badge { display: inline-block; background: #eff3df; color: #58632a; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 6px; letter-spacing: 1px; border: 1px solid #dce9a2; }
    .voucher-inv { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 6px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 22px; }
    .meta-item-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .meta-item-value { font-size: 13.5px; font-weight: 700; color: #0f172a; }
    .table-box { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
    .table-box th { background: #58632a; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 700; }
    .table-box td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .amount-highlight { font-size: 18px; font-weight: 800; color: #58632a; }
    .total-row { background: #f8fafc; font-weight: 800; }
    .note-box { background: #f1f5f9; border-left: 3px solid #58632a; padding: 10px 14px; border-radius: 4px; font-size: 11.5px; color: #475569; margin-bottom: 28px; }
    .signatures-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 18px; border-top: 1px dashed #cbd5e1; }
    .sig-col { text-align: center; width: 180px; }
    .sig-line { border-bottom: 1px solid #0f172a; margin-bottom: 6px; }
    .sig-name { font-size: 11px; font-weight: 700; color: #0f172a; }
    .sig-role { font-size: 10px; color: #64748b; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .voucher-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header-row">
      <div>
        <div class="brand-title">DEFENCE AUTOLINK</div>
        <div class="brand-sub">Multi-Brand Automobile Dealership & CSD Procurement</div>
        <div class="brand-sub">Showroom Operational Expense Disbursement</div>
      </div>
      <div class="voucher-badge-box">
        <span class="voucher-badge">EXPENSE VOUCHER</span>
        <div class="voucher-inv">#${item.invoice_no || `EXP-${item.id}`}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-item-label">Expense Category</div>
        <div class="meta-item-value">${item.title || item.category_name || 'General Expense'}</div>
      </div>
      <div>
        <div class="meta-item-label">Disbursement Date</div>
        <div class="meta-item-value">${formattedDate}</div>
      </div>
      <div>
        <div class="meta-item-label">Party / Vendor Name</div>
        <div class="meta-item-value">${item.party_name || '—'}</div>
      </div>
      <div>
        <div class="meta-item-label">Payment Mode</div>
        <div class="meta-item-value">${isOnline ? 'Online (Bank / UPI)' : 'Offline (Cash)'}</div>
      </div>
    </div>

    <table class="table-box">
      <thead>
        <tr>
          <th>Particulars / Description</th>
          <th style="width: 180px; text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${item.title || 'Showroom Expenditure'}</strong>
            ${item.party_name ? `<br/><span style="color:#64748b; font-size:11.5px;">Paid to: ${item.party_name}</span>` : ''}
            ${item.reference_no ? `<br/><span style="color:#64748b; font-size:11px;">Ref/UTR: ${item.reference_no}</span>` : ''}
            ${item.remark ? `<br/><span style="color:#64748b; font-size:11px;">Note: ${item.remark}</span>` : ''}
          </td>
          <td style="text-align: right; vertical-align: top;" class="amount-highlight">
            ₹ ${formattedAmount}/-
          </td>
        </tr>
        <tr class="total-row">
          <td style="text-align: right; text-transform: uppercase;">Total Disbursed:</td>
          <td style="text-align: right; font-size: 16px; color: #58632a;">₹ ${formattedAmount}/-</td>
        </tr>
      </tbody>
    </table>

    <div class="note-box">
      <strong>Payment Status:</strong> ${item.status || 'Paid'} &bull;
      <strong>Paid By:</strong> ${item.pay_by || 'Admin User'} &bull;
      This is a computer-generated voucher and digital transaction proof.
    </div>

    <div class="signatures-row">
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">${item.pay_by || 'Officer In-charge'}</div>
        <div class="sig-role">Disbursed / Paid By</div>
      </div>
      <div class="sig-col">
        <div class="sig-line"></div>
        <div class="sig-name">Authorized Signatory</div>
        <div class="sig-role">Defence Autolink</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Downloads and saves the official Expense Voucher file to device storage
   */
  downloadVoucher: async (item: ExpenseRecord): Promise<string> => {
    const html = expenseService.generateVoucherHtml(item);
    const cleanInvoice = (item.invoice_no || `EXP-${item.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Expense-Voucher-${cleanInvoice}.html`;
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const destPath =
      Platform.OS === 'android'
        ? `${dirs.DownloadDir}/${fileName}`
        : `${dirs.DocumentDir}/${fileName}`;

    await ReactNativeBlobUtil.fs.writeFile(destPath, html, 'utf8');

    if (Platform.OS === 'android') {
      try {
        ReactNativeBlobUtil.android.addCompleteDownload({
          title: fileName,
          description: `Expense Voucher #${item.invoice_no || item.id} for ${item.party_name}`,
          mime: 'text/html',
          path: destPath,
          showNotification: true,
        });
      } catch (e) {
        console.warn('Android addCompleteDownload error:', e);
      }
    }

    return destPath;
  },
};
