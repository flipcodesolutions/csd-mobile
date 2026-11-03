import { api, getApiBaseUrl, getAuthToken } from '../../core/api/client';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import {
  EmailQuotationPayload,
  Quotation,
  QuotationFilterParams,
  QuotationFormData,
} from './types';

export const quotationApi = {
  getAll: async (params?: QuotationFilterParams): Promise<{ status: boolean; data: any }> => {
    try {
      const cleanParams: Record<string, any> = {};
      if (params?.page) cleanParams.page = params.page;
      if (params?.per_page) cleanParams.per_page = params.per_page;
      if (params?.search && params.search.trim()) cleanParams.search = params.search.trim();
      if (params?.status && params.status !== 'all') cleanParams.status = params.status;
      if (params?.from_date) cleanParams.from_date = params.from_date;
      if (params?.to_date) cleanParams.to_date = params.to_date;
      if (params?.trash) cleanParams.trash = 1;
      if (params?.lead_id) cleanParams.lead_id = params.lead_id;

      const response = await api.get('/quotations', { params: cleanParams });
      return response.data;
    } catch (error: any) {
      console.log('quotationApi.getAll error:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<{ status: boolean; data: Quotation }> => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<{ status: boolean; data: Quotation; message?: string }> => {
    const response = await api.post('/quotations', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<{ status: boolean; data: Quotation; message?: string }> => {
    const response = await api.put(`/quotations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ status: boolean; message?: string }> => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  restore: async (id: number): Promise<{ status: boolean; message?: string }> => {
    const response = await api.post(`/quotations/${id}/restore`);
    return response.data;
  },

  forceDelete: async (id: number): Promise<{ status: boolean; message?: string }> => {
    const response = await api.delete(`/quotations/${id}/force`);
    return response.data;
  },

  sendEmail: async (id: number, payload: EmailQuotationPayload): Promise<{ status: boolean; message?: string }> => {
    const response = await api.post(`/quotations/${id}/send`, payload);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<{ status: boolean; message?: string }> => {
    const response = await api.patch(`/quotations/${id}/status`, { status });
    return response.data;
  },

  getLeadQuotation: async (leadId: number): Promise<{ status: boolean; data: any }> => {
    try {
      const response = await api.get(`/leads/${leadId}/quotation`);
      return response.data;
    } catch {
      // Fallback: fetch lead details directly
      const leadRes = await api.get(`/leads/${leadId}`);
      return leadRes.data;
    }
  },

  downloadPdf: async (id: number, quotationNo?: string): Promise<string> => {
    const token = getAuthToken();
    const baseUrl = getApiBaseUrl();
    const downloadUrl = `${baseUrl}/quotations/${id}/pdf`;
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const fileName = `${quotationNo || `Quotation-${id}`}.pdf`;
    const destPath =
      Platform.OS === 'android'
        ? `${dirs.DownloadDir}/${fileName}`
        : `${dirs.DocumentDir}/${fileName}`;

    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: destPath,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: fileName,
        description: 'Downloading Official Vehicle Quotation PDF...',
        mime: 'application/pdf',
        mediaScannable: true,
      },
    }).fetch('GET', downloadUrl, {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    });

    return res.path();
  },

  /**
   * Generates clean printable HTML matching the official Defence Autolink layout
   */
  generateHtmlSheet: (data: QuotationFormData): string => {
    const parseAmount = (val: string | number) => {
      const num = parseFloat(String(val || 0).replace(/[^0-9.-]+/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const formatInr = (val: number | string) => {
      const num = typeof val === 'number' ? val : parseAmount(val);
      return '₹ ' + num.toLocaleString('en-IN') + '/-';
    };

    const b = data.breakdown;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
          body { background: #fff; color: #1e293b; padding: 24px; font-size: 13px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .logo-box { display: flex; align-items: center; gap: 10px; }
          .logo-badge { background: #1e3a8a; color: #fff; font-weight: bold; font-size: 18px; padding: 8px 12px; border-radius: 4px; }
          .logo-text { font-size: 16px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; }
          .company-info { text-align: right; max-width: 360px; font-size: 11px; color: #475569; }
          .company-name { font-size: 18px; font-weight: 800; color: #b91c1c; margin-bottom: 4px; }
          .meta-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 12px; font-weight: 600; }
          .quote-tag { border: 1.5px solid #b91c1c; color: #b91c1c; padding: 3px 14px; font-weight: 700; font-size: 11px; letter-spacing: 1px; border-radius: 2px; }
          .table-box { width: 100%; border: 1.5px solid #334155; border-collapse: collapse; margin-bottom: 16px; }
          .table-box td, .table-box th { border: 1px solid #64748b; padding: 7px 12px; font-size: 12px; }
          .col-label { font-weight: 700; color: #0f172a; width: 45%; text-transform: uppercase; }
          .col-value { font-weight: 600; text-align: left; }
          .highlight-row { background: #f8fafc; font-weight: 800; font-size: 14px; color: #b91c1c; }
          .footer-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; font-size: 11px; }
          .exec-info { color: #334155; }
          .exec-info strong { color: #0284c7; }
          .disclaimer { font-size: 10px; color: #64748b; margin-top: 6px; font-style: italic; }
          .signatory { text-align: right; color: #0f172a; font-weight: 700; }
          .signatory-sub { font-size: 10px; color: #64748b; font-weight: normal; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            <div class="logo-badge">DA</div>
            <div class="logo-text">DEFENCE<br>AUTOLINK</div>
          </div>
          <div class="company-info">
            <div class="company-name">DEFENCE AUTOLINK</div>
            <div>D-601, S G BUSINESS HUB, S G HIGHWAY,</div>
            <div>Ahmedabad, Gujarat - 382470</div>
          </div>
        </div>

        <div class="meta-row">
          <div>DATE : ${data.quotationDate || new Date().toLocaleDateString('en-GB')}</div>
          <div class="quote-tag">QUOTATION</div>
        </div>

        <table class="table-box">
          <tr>
            <td class="col-label">CAR: ${data.sheetCarTitle || data.brandName || '-'}</td>
            <td class="col-value"><strong>MODEL:</strong> ${data.sheetModelTitle || data.variantName || '-'}</td>
          </tr>
          <tr>
            <td class="col-label">CSD PRICE</td>
            <td class="col-value">${formatInr(b.csdPrice)}</td>
          </tr>
          <tr>
            <td class="col-label">GJ RTO</td>
            <td class="col-value">${formatInr(b.gjRto)}</td>
          </tr>
          <tr>
            <td class="col-label">BH RTO * APPOROX</td>
            <td class="col-value">${b.bhRto ? formatInr(b.bhRto) : '-'}</td>
          </tr>
          <tr>
            <td class="col-label">CRTM</td>
            <td class="col-value">${formatInr(b.crtm)}</td>
          </tr>
          <tr>
            <td class="col-label">INSURANCE</td>
            <td class="col-value">${formatInr(b.insurance)}</td>
          </tr>
          <tr>
            <td class="col-label">ACCESSORIES</td>
            <td class="col-value">${b.accessories ? formatInr(b.accessories) : '-'}</td>
          </tr>
          <tr>
            <td class="col-label">WARRANTY</td>
            <td class="col-value">${b.warranty ? formatInr(b.warranty) : '-'}</td>
          </tr>
          <tr>
            <td class="col-label">M.S REWORD (DISCOUNT)</td>
            <td class="col-value">${b.msReward ? '-' + formatInr(b.msReward) : '-'}</td>
          </tr>
          <tr>
            <td class="col-label">DIFFERENCE AMT CASH</td>
            <td class="col-value">${formatInr(b.diffAmtCash)}</td>
          </tr>
          <tr class="highlight-row">
            <td class="col-label" style="color: #b91c1c;">ESTIMATED ON-ROAD PRICE</td>
            <td class="col-value" style="color: #b91c1c; font-size: 15px;">${formatInr(data.grandTotal)}</td>
          </tr>
        </table>

        <div class="footer-section">
          <div class="exec-info">
            <div>Executive: <strong>${data.executiveName || 'ADMIN USER'}</strong></div>
            <div>Contact: ${data.executivePhone || '+91 98000 11112'}</div>
            <div class="disclaimer">* Prices prevailing at the time of delivery will be applicable. Road tax as per RTO norms.</div>
          </div>
          <div class="signatory">
            <div>For DEFENCE AUTOLINK</div>
            <div class="signatory-sub">(Authorized Multi-Brand Dealership Signatory)</div>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};

export const quotationService = quotationApi;
export default quotationService;
