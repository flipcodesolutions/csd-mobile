import { api } from '../../core/api/client';
import {
  ContactInquiry,
  ContactInquiryDetailResponse,
  ContactInquiryFilterParams,
  ContactInquiryListResponse,
  ContactInquiryPagination,
  ContactInquiryStats,
} from './types';

/**
 * Service for Contact Inquiries API operations
 */
export const contactInquiryService = {
  /**
   * Fetch paginated list of inquiries and summary stats
   * GET /api/contact-inquiries
   */
  getAll: async (
    params?: ContactInquiryFilterParams
  ): Promise<ContactInquiryListResponse> => {
    const cleanParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 15,
    };

    if (params?.search && params.search.trim()) {
      cleanParams.search = params.search.trim();
    }
    if (params?.status && params.status !== 'all') {
      cleanParams.status = params.status;
    }

    try {
      let raw: any;
      try {
        const response = await api.get('/contact-inquiries', { params: cleanParams });
        raw = response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Fallback to alternative endpoint /contacts if /contact-inquiries is 404
          const fallbackRes = await api.get('/contacts', { params: cleanParams });
          raw = fallbackRes.data;
        } else {
          throw err;
        }
      }

      let list: ContactInquiry[] = [];
      if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      } else if (raw && Array.isArray(raw.data?.data)) {
        list = raw.data.data;
      } else if (raw && Array.isArray(raw.inquiries)) {
        list = raw.inquiries;
      } else if (Array.isArray(raw)) {
        list = raw;
      }

      // Extract stats if returned by API or compute fallback
      const todayIso = new Date().toISOString().split('T')[0];
      const fallbackTodayCount = list.filter((item) =>
        (item.created_at || '').startsWith(todayIso)
      ).length;

      const stats: ContactInquiryStats = {
        total:
          typeof raw?.stats?.total === 'number'
            ? raw.stats.total
            : typeof raw?.total === 'number'
              ? raw.total
              : list.length,
        today:
          typeof raw?.stats?.today === 'number'
            ? raw.stats.today
            : typeof raw?.today === 'number'
              ? raw.today
              : fallbackTodayCount,
        unread:
          typeof raw?.stats?.unread === 'number'
            ? raw.stats.unread
            : list.filter((i) => (i.status || '').toLowerCase() === 'new').length,
      };

      const pagination: ContactInquiryPagination = raw?.pagination ||
        raw?.data?.pagination || {
          current_page: cleanParams.page,
          last_page:
            raw?.data?.last_page ||
            Math.max(1, Math.ceil(stats.total / cleanParams.per_page)),
          per_page: cleanParams.per_page,
          total: stats.total,
        };

      return {
        status: true,
        data: list,
        pagination,
        stats,
        message: raw?.message,
      };
    } catch (err: any) {
      console.warn('contactInquiryService.getAll error:', err);
      return {
        status: false,
        data: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: cleanParams.per_page,
          total: 0,
        },
        stats: {
          total: 0,
          today: 0,
          unread: 0,
        },
        message: err?.response?.data?.message || err?.message || 'Failed to fetch inquiries',
      };
    }
  },

  /**
   * Fetch single inquiry details (server marks as 'read')
   * GET /api/contact-inquiries/{id}
   */
  getById: async (id: number): Promise<ContactInquiryDetailResponse> => {
    try {
      let raw: any;
      try {
        const response = await api.get(`/contact-inquiries/${id}`);
        raw = response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallbackRes = await api.get(`/contacts/${id}`);
          raw = fallbackRes.data;
        } else {
          throw err;
        }
      }

      const item: ContactInquiry = raw?.data || raw?.inquiry || raw;
      return {
        status: true,
        data: item,
        message: raw?.message,
      };
    } catch (err: any) {
      console.warn(`contactInquiryService.getById(${id}) error:`, err);
      throw err;
    }
  },

  /**
   * Delete inquiry permanently
   * DELETE /api/contact-inquiries/{id}
   */
  delete: async (id: number): Promise<{ status: boolean; message?: string }> => {
    try {
      let raw: any;
      try {
        const response = await api.delete(`/contact-inquiries/${id}`);
        raw = response.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const fallbackRes = await api.delete(`/contacts/${id}`);
          raw = fallbackRes.data;
        } else {
          throw err;
        }
      }

      return {
        status: true,
        message: raw?.message || 'Contact inquiry deleted successfully',
      };
    } catch (err: any) {
      console.warn(`contactInquiryService.delete(${id}) error:`, err);
      throw err;
    }
  },
};

