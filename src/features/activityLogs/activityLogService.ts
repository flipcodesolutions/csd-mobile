import { api } from '../../core/api/client';
import {
  ActivityLog,
  ActivityLogFilterOptions,
  ActivityLogFilterParams,
  ActivityLogPagination,
} from './types';

export const activityLogService = {
  /**
   * Fetch paginated & filtered activity logs
   */
  getLogs: async (
    params?: ActivityLogFilterParams
  ): Promise<{
    status: boolean;
    data: ActivityLog[];
    pagination?: ActivityLogPagination;
    message?: string;
  }> => {
    try {
      const cleanParams: Record<string, any> = {
        page: params?.page || 1,
        per_page: params?.per_page || 15,
      };

      if (params?.search && params.search.trim()) {
        cleanParams.search = params.search.trim();
      }
      if (params?.user_id && params.user_id !== 'all') {
        cleanParams.user_id = params.user_id;
      }
      if (params?.module && params.module !== 'all') {
        cleanParams.module = params.module;
      }
      if (params?.action && params.action !== 'all') {
        cleanParams.action = params.action;
      }
      if (params?.start_date) {
        cleanParams.start_date = params.start_date;
        cleanParams.from_date = params.start_date;
      }
      if (params?.end_date) {
        cleanParams.end_date = params.end_date;
        cleanParams.to_date = params.end_date;
      }

      const response = await api.get('/activity-logs', { params: cleanParams });
      const raw = response.data;

      let list: ActivityLog[] = [];
      if (raw && Array.isArray(raw.data)) {
        list = raw.data;
      } else if (raw && Array.isArray(raw.data?.data)) {
        list = raw.data.data;
      } else if (Array.isArray(raw)) {
        list = raw;
      }

      const pagination: ActivityLogPagination = raw?.pagination ||
        raw?.data?.pagination || {
          current_page: cleanParams.page,
          last_page: Math.ceil(list.length / cleanParams.per_page) || 1,
          per_page: cleanParams.per_page,
          total: list.length,
        };

      return {
        status: true,
        data: list,
        pagination,
        message: raw?.message,
      };
    } catch (err: any) {
      console.warn('activityLogService.getLogs error:', err);
      return {
        status: false,
        data: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 15,
          total: 0,
        },
      };
    }
  },

  /**
   * Fetch filter options (Users, Modules, Actions)
   */
  getFilterOptions: async (): Promise<{
    status: boolean;
    data: ActivityLogFilterOptions;
  }> => {
    try {
      const response = await api.get('/activity-logs/filters');
      const raw = response.data;
      const data = raw?.data || raw || {};

      return {
        status: true,
        data: {
          modules: Array.isArray(data.modules) ? data.modules : [],
          actions: Array.isArray(data.actions) ? data.actions : [],
          users: Array.isArray(data.users) ? data.users : [],
        },
      };
    } catch (err) {
      console.warn('activityLogService.getFilterOptions error:', err);
      return {
        status: false,
        data: {
          modules: ['Leads', 'Deals', 'Quotations', 'Expenses', 'Insurance', 'Lead Source', 'Users', 'Authentication'],
          actions: ['add', 'edit', 'delete', 'trash', 'login', 'logout', 'export'],
          users: [],
        },
      };
    }
  },

  /**
   * Purge activity logs older than 2 months
   */
  cleanOldLogs: async (
    months: number = 2
  ): Promise<{
    status: boolean;
    message?: string;
    deleted_count?: number;
    cutoff_date?: string;
  }> => {
    const response = await api.delete('/activity-logs/clean-old', {
      params: { months },
    });
    return response.data;
  },
};

export default activityLogService;

