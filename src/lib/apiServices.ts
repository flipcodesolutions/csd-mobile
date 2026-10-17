// Central re-export of domain-specific feature services for backwards compatibility
export { authApi, authService } from '../features/auth/authService';
export {
  brandApi,
  modelApi,
  variantApi,
  leadSourceApi,
  leadStatusApi,
  userApi,
  masterService,
} from '../features/masters/masterService';
export { leadApi, salesExecutiveApi, leadService } from '../features/leads/leadService';
export { dealApi, dealService } from '../features/deals/dealService';
export { quotationApi, quotationService } from '../features/quotations/quotationService';
