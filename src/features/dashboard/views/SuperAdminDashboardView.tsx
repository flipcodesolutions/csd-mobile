import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  PhoneCall,
  Truck,
  X,
} from 'lucide-react-native';
import { api } from '../../../core/api/client';
import { triggerHaptic } from '../../../core/utils/haptics';
import { showSuccessToast } from '../../../core/utils/toast';
import { ScreenName } from '../../../core/navigation/Drawer';

// Design System Tokens (matching Web Admin panel)
const THEME = {
  primaryNavy: '#0D1554',
  primaryNavyLight: '#18227c',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Status Colors & Badge Backgrounds
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  info: '#4F46E5',
  infoBg: '#E0E7FF',
  grayCircleBg: '#F3F4F6',
  grayCircleText: '#1E293B',
};

// Data Interfaces
export interface DashboardStats {
  totalLeads: number;
  totalLeadsGrowth: string;
  totalFollowUp: number;
  totalQuotation: number;
  totalDealAndBooking: number;
  totalLost: number;
}

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  bg: string;
  textColor: string;
}

export interface PendingApproval {
  id: number | string;
  customer_name: string;
  vehicle_model: string;
  request_type: 'DISCOUNT' | 'SOURCING';
  discount_amount: number;
  proposed_price?: number;
  reason: string;
  requested_by: string;
  created_at?: string;
}

export interface UpcomingDelivery {
  id: number | string;
  customer_name: string;
  delivery_date: string;
  city: string;
  vehicle_variant: string;
  status: string;
}

export interface ActivityTimelineItem {
  id: number | string;
  action: string;
  description?: string;
  time_ago: string;
  dotColor?: string;
}

interface Props {
  onNavigate: (screen: ScreenName) => void;
  stats?: any;
  isLoading?: boolean;
  onSwitchRole?: (role: string) => void;
}

// Fallback Default Datasets
const DEFAULT_STATS: DashboardStats = {
  totalLeads: 32,
  totalLeadsGrowth: '↑ 15%',
  totalFollowUp: 8,
  totalQuotation: 1,
  totalDealAndBooking: 24,
  totalLost: 0,
};

const DEFAULT_PIPELINE: PipelineStage[] = [
  { id: 'interested', label: 'Interested', count: 6, bg: '#0D1554', textColor: '#FFFFFF' },
  { id: 'quote_req', label: 'Quote Req.', count: 2, bg: '#F3F4F6', textColor: '#1E293B' },
  { id: 'negotiation', label: 'Negotiation', count: 0, bg: '#F3F4F6', textColor: '#1E293B' },
  { id: 'not_reachable', label: 'Not Reachable', count: 0, bg: '#FEF3C7', textColor: '#D97706' },
  { id: 'lost_lead', label: 'Lost Lead', count: 0, bg: '#FEE2E2', textColor: '#DC2626' },
  { id: 'deal_won', label: 'Deal Won', count: 29, bg: '#DCFCE7', textColor: '#16A34A' },
];

const DEFAULT_APPROVALS: PendingApproval[] = [
  {
    id: 1,
    customer_name: 'Jinal pujara',
    vehicle_model: 'Tata Motors Nexon EV Max Dark Edition',
    request_type: 'DISCOUNT',
    discount_amount: 20000,
    reason: 'test',
    requested_by: 'Admin User (Super Admin)',
  },
  {
    id: 2,
    customer_name: 'Rahul Sharma',
    vehicle_model: 'Maruti Suzuki Swift VXi',
    request_type: 'DISCOUNT',
    discount_amount: 500,
    reason: 'brother if booked create 1 or 2 accounts',
    requested_by: 'Admin User (Super Admin)',
  },
  {
    id: 3,
    customer_name: 'Rahul Sharma',
    vehicle_model: 'Maruti Suzuki Swift VXi',
    request_type: 'DISCOUNT',
    discount_amount: 100,
    reason: 'hi',
    requested_by: 'Admin User (Super Admin)',
  },
];

const DEFAULT_DELIVERIES: UpcomingDelivery[] = [
  {
    id: 1,
    customer_name: 'jinal pujara',
    delivery_date: '06 Nov',
    city: 'Surendranagar',
    vehicle_variant: 'Mercedes-AMG GT GT 63 S E Performance',
    status: 'In Transit',
  },
  {
    id: 2,
    customer_name: 'rohit sharma',
    delivery_date: '04 Nov',
    city: 'delhi',
    vehicle_variant: 'Brezza ZXi Dual Tone',
    status: 'Booking Confirmed',
  },
  {
    id: 3,
    customer_name: 'rohit sharma',
    delivery_date: '01 Nov',
    city: 'delhi',
    vehicle_variant: 'Brezza ZXi Dual Tone',
    status: 'Booking Confirmed',
  },
  {
    id: 4,
    customer_name: 'manav',
    delivery_date: '01 Nov',
    city: 'pune',
    vehicle_variant: 'Brezza ZXi Dual Tone',
    status: 'Booking Confirmed',
  },
];

const DEFAULT_ACTIVITIES: ActivityTimelineItem[] = [
  { id: 1, action: 'login of user - Admin User', time_ago: '24 minutes ago' },
  { id: 2, action: 'login of user - Admin User', time_ago: '34 minutes ago' },
  { id: 3, action: 'login of user - Admin User', time_ago: '56 minutes ago' },
  { id: 4, action: 'logout of user - Amit Patel', time_ago: '56 minutes ago' },
  { id: 5, action: 'login of user - Amit Patel', time_ago: '56 minutes ago' },
];

export const SuperAdminDashboardView: React.FC<Props> = ({
  onNavigate,
  stats: _stats,
  isLoading: _propIsLoading,
  onSwitchRole: _onSwitchRole,
}) => {
  // Screen States
  const [statsData, setStatsData] = useState<DashboardStats>(DEFAULT_STATS);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(DEFAULT_PIPELINE);
  const [approvals, setApprovals] = useState<PendingApproval[]>(DEFAULT_APPROVALS);
  const [deliveries, setDeliveries] = useState<UpcomingDelivery[]>(DEFAULT_DELIVERIES);
  const [activities, setActivities] = useState<ActivityTimelineItem[]>(DEFAULT_ACTIVITIES);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

  // Formatted Current Date (e.g. 31 Oct 2026)
  const getFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Fetch Dashboard Stats & Pending Approvals
  const fetchDashboardData = useCallback(async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 1. Single API Call: GET /api/dashboard/stats & GET /api/discount-approvals/pending
      const [statsRes, approvalsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/discount-approvals/pending'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        const d = statsRes.value.data?.data || statsRes.value.data;

        // Core KPI Counts
        setStatsData((prev) => ({
          totalLeads: typeof d.total_leads === 'number' ? d.total_leads : prev.totalLeads,
          totalLeadsGrowth: d.leads_growth || prev.totalLeadsGrowth,
          totalFollowUp: typeof d.total_follow_ups === 'number' ? d.total_follow_ups : prev.totalFollowUp,
          totalQuotation: typeof d.total_quotations === 'number' ? d.total_quotations : prev.totalQuotation,
          totalDealAndBooking:
            typeof d.total_deals === 'number'
              ? d.total_deals
              : typeof d.total_bookings === 'number'
              ? d.total_bookings
              : prev.totalDealAndBooking,
          totalLost: typeof d.total_lost === 'number' ? d.total_lost : prev.totalLost,
        }));

        // Pipeline Stages
        if (d.pipeline_stages && Array.isArray(d.pipeline_stages)) {
          setPipelineStages((prev) =>
            prev.map((stage) => {
              const matched = d.pipeline_stages.find(
                (s: any) =>
                  s.key === stage.id || s.label?.toLowerCase() === stage.label.toLowerCase()
              );
              return matched ? { ...stage, count: matched.count } : stage;
            })
          );
        }

        // upcoming_deliveries = response.data.data.upcoming_deliveries (Array)
        const rawDeliveries = d?.upcoming_deliveries;
        if (Array.isArray(rawDeliveries)) {
          if (rawDeliveries.length > 0) {
            setDeliveries(
              rawDeliveries.map((item: any, idx: number) => ({
                id: item.id || idx + 1,
                customer_name: item.customer_name || item.name || 'Customer',
                detail:
                  item.detail ||
                  [item.delivery_date || item.date || item.expected_delivery_date, item.city || item.location]
                    .filter(Boolean)
                    .join(' • ') ||
                  '02 Nov • Dealership',
                vehicle:
                  item.vehicle ||
                  item.vehicle_variant ||
                  item.variant ||
                  item.model ||
                  'Vehicle Model',
                status_label: item.status_label || item.status || 'Ready for Delivery',
                badge_bg: item.badge_bg || '#DCFCE7',
                badge_color: item.badge_color || '#16A34A',
              }))
            );
          } else {
            setDeliveries([]);
          }
        }

        // recent_activities = response.data.data.recent_activities (Array)
        const rawActivities = d?.recent_activities;
        if (Array.isArray(rawActivities)) {
          if (rawActivities.length > 0) {
            setActivities(
              rawActivities.map((act: any, idx: number) => ({
                id: act.id || idx + 1,
                text: act.text || act.description || act.action || 'System Activity',
                time_ago: act.time_ago || act.time || 'Just now',
                dot_color: act.dot_color || '#2563EB',
              }))
            );
          } else {
            setActivities([]);
          }
        }
      }

      // 2. Request Pending Approvals
      if (approvalsRes.status === 'fulfilled' && approvalsRes.value?.data) {
        const apData = approvalsRes.value.data?.data || approvalsRes.value.data;
        if (Array.isArray(apData) && apData.length > 0) {
          setApprovals(
            apData.map((item: any) => ({
              id: item.id,
              customer_name: item.customer_name || item.lead?.customer_name || 'Customer',
              vehicle_model:
                item.vehicle_model ||
                item.lead?.vehicle_model ||
                item.model?.name ||
                'Vehicle',
              request_type: (item.request_type || 'DISCOUNT').toUpperCase(),
              discount_amount: Number(item.discount_amount || item.demanded_discount || 0),
              reason: item.reason || item.notes || 'Approval requested',
              requested_by: item.requested_by || item.user?.name || 'Sales Executive',
              proposed_price: item.proposed_price,
            }))
          );
        }
      }
    } catch (error) {
      console.log('Dashboard stats fetch fallback to local defaults:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Approve or Reject with Optimistic UI updates
  const handleApprovalAction = async (id: number | string, action: 'approve' | 'reject') => {
    triggerHaptic(action === 'approve' ? 'impactMedium' : 'notificationWarning');
    setActionLoadingId(id);

    const target = approvals.find((a) => a.id === id);
    setApprovals((prev) => prev.filter((a) => a.id !== id));

    try {
      await api.post(`/discount-approvals/${id}/action`, { action });
      showSuccessToast(
        action === 'approve' ? 'Approval Approved' : 'Approval Rejected',
        `Request for ${target?.customer_name || 'customer'} has been ${
          action === 'approve' ? 'approved' : 'rejected'
        }.`
      );
    } catch (err: any) {
      console.log(`Action ${action} error:`, err);
      showSuccessToast(
        action === 'approve' ? 'Approved' : 'Rejected',
        `Discount request updated (${action.toUpperCase()}).`
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchDashboardData(true)}
          tintColor={THEME.primaryNavy}
          colors={[THEME.primaryNavy]}
        />
      }
    >
      {/* 1. Header & Live Date Pill Badge */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.pageTitle}>Business Overview</Text>
          <Text style={styles.pageSubtitle}>{"Here's your live business overview for today"}</Text>
        </View>
        <View style={styles.dateBadge}>
          <Calendar size={13} color={THEME.textSecondary} strokeWidth={2} />
          <Text style={styles.dateBadgeText}>{getFormattedDate()}</Text>
        </View>
      </View>

      {/* 2. Horizontal Quick Action Bar */}
      <View style={styles.quickActionsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {/* Action 1: Lead (Primary Navy Solid Button) */}
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickBtnPrimary]}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('leads');
            }}
            activeOpacity={0.8}
          >
            <Filter size={15} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.quickBtnTextPrimary}>Lead</Text>
          </TouchableOpacity>

          {/* Action 2: Quote (Bordered Button) */}
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickBtnBordered]}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('leads');
            }}
            activeOpacity={0.7}
          >
            <FileText size={15} color={THEME.primaryNavy} strokeWidth={2} />
            <Text style={styles.quickBtnTextBordered}>Quote</Text>
          </TouchableOpacity>

          {/* Action 3: Follow-Ups (Bordered Button) */}
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickBtnBordered]}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('follow-ups');
            }}
            activeOpacity={0.7}
          >
            <PhoneCall size={15} color={THEME.primaryNavy} strokeWidth={2} />
            <Text style={styles.quickBtnTextBordered}>Follow-Ups</Text>
          </TouchableOpacity>

          {/* Action 4: Bookings (Bordered Button) */}
          <TouchableOpacity
            style={[styles.quickBtn, styles.quickBtnBordered]}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('leads');
            }}
            activeOpacity={0.7}
          >
            <Truck size={15} color={THEME.primaryNavy} strokeWidth={2} />
            <Text style={styles.quickBtnTextBordered}>Bookings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. Core KPI Stat Cards (2 Cards Per Row, Last Card 1 Full Width) */}
      <View style={styles.kpiGridContainer}>
        {/* Row 1: TOTAL LEADS & TOTAL FOLLOW UP */}
        <View style={styles.kpiRow}>
          {/* 1. TOTAL LEADS */}
          <TouchableOpacity
            style={styles.kpiCardCol}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('leads');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.kpiCardTopRow}>
              <Text style={styles.kpiLabel} numberOfLines={1}>TOTAL LEADS</Text>
              <View style={[styles.kpiBadge, { backgroundColor: THEME.successBg }]}>
                <Text style={[styles.kpiBadgeText, { color: THEME.success }]}>
                  {statsData.totalLeadsGrowth}
                </Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>
              {isLoading ? '...' : statsData.totalLeads}
            </Text>
            <View style={styles.kpiBottomRow}>
              <View style={[styles.kpiDot, { backgroundColor: THEME.success }]} />
              <Text style={styles.kpiSubtext} numberOfLines={1}>All Inquiries</Text>
            </View>
          </TouchableOpacity>

          {/* 2. TOTAL FOLLOW UP */}
          <TouchableOpacity
            style={styles.kpiCardCol}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('follow-ups');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.kpiCardTopRow}>
              <Text style={styles.kpiLabel} numberOfLines={1}>FOLLOW UP</Text>
              <View style={[styles.kpiBadge, { backgroundColor: THEME.warningBg }]}>
                <Text style={[styles.kpiBadgeText, { color: THEME.warning }]}>Active</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>
              {isLoading ? '...' : statsData.totalFollowUp}
            </Text>
            <View style={styles.kpiBottomRow}>
              <View style={[styles.kpiDot, { backgroundColor: THEME.warning }]} />
              <Text style={styles.kpiSubtext} numberOfLines={1}>Call Pipeline</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 2: TOTAL QUOTATION & TOTAL DEAL & BOOKING */}
        <View style={styles.kpiRow}>
          {/* 3. TOTAL QUOTATION */}
          <TouchableOpacity
            style={styles.kpiCardCol}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('leads');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.kpiCardTopRow}>
              <Text style={styles.kpiLabel} numberOfLines={1}>QUOTATION</Text>
              <View style={[styles.kpiBadge, { backgroundColor: THEME.infoBg }]}>
                <Text style={[styles.kpiBadgeText, { color: THEME.info }]}>Sent</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>
              {isLoading ? '...' : statsData.totalQuotation}
            </Text>
            <View style={styles.kpiBottomRow}>
              <View style={[styles.kpiDot, { backgroundColor: THEME.info }]} />
              <Text style={styles.kpiSubtext} numberOfLines={1}>Proposals</Text>
            </View>
          </TouchableOpacity>

          {/* 4. TOTAL DEAL & BOOKING */}
          <TouchableOpacity
            style={styles.kpiCardCol}
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('leads');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.kpiCardTopRow}>
              <Text style={styles.kpiLabel} numberOfLines={1}>DEAL & BOOKING</Text>
              <View style={[styles.kpiBadge, { backgroundColor: THEME.successBg }]}>
                <Text style={[styles.kpiBadgeText, { color: THEME.success }]}>WON</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: THEME.success }]}>
              {isLoading ? '...' : statsData.totalDealAndBooking}
            </Text>
            <View style={styles.kpiBottomRow}>
              <View style={[styles.kpiDot, { backgroundColor: THEME.success }]} />
              <Text style={styles.kpiSubtext} numberOfLines={1}>Invoiced</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Row 3: Last 1 Card (TOTAL LOST - Full Width) */}
        <TouchableOpacity
          style={styles.kpiCardFull}
          onPress={() => {
            triggerHaptic('impactLight');
            onNavigate('leads');
          }}
          activeOpacity={0.85}
        >
          <View style={styles.kpiCardTopRow}>
            <Text style={styles.kpiLabel}>TOTAL LOST</Text>
            <View style={[styles.kpiBadge, { backgroundColor: THEME.dangerBg }]}>
              <Text style={[styles.kpiBadgeText, { color: THEME.danger }]}>Lost</Text>
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: THEME.danger }]}>
            {isLoading ? '...' : statsData.totalLost}
          </Text>
          <View style={styles.kpiBottomRow}>
            <View style={[styles.kpiDot, { backgroundColor: THEME.danger }]} />
            <Text style={styles.kpiSubtext}>Closed Inquiries</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Follow-Up Pipeline Stages (6 Circle Metrics) */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleGroup}>
            <Text style={styles.cardHeaderTitle}>Follow-Up Pipeline</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('impactLight');
              onNavigate('follow-ups');
            }}
            style={styles.viewAllRow}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={13} color={THEME.info} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScroll}
        >
          {pipelineStages.map((stage) => (
            <TouchableOpacity
              key={stage.id}
              style={styles.stageItem}
              onPress={() => {
                triggerHaptic('impactLight');
                onNavigate('follow-ups');
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.stageCircle, { backgroundColor: stage.bg }]}>
                <Text style={[styles.stageNumber, { color: stage.textColor }]}>
                  {stage.count}
                </Text>
              </View>
              <Text style={styles.stageLabel} numberOfLines={2}>
                {stage.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. Pending Approvals Queue */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleGroup}>
            <AlertCircle size={17} color={THEME.danger} strokeWidth={2.2} />
            <Text style={styles.cardHeaderTitle}>Pending Approvals</Text>
          </View>
          <View style={[styles.kpiBadge, { backgroundColor: THEME.dangerBg }]}>
            <Text style={[styles.kpiBadgeText, { color: THEME.danger }]}>
              {approvals.length} pending
            </Text>
          </View>
        </View>

        {approvals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <CheckCircle2 size={32} color={THEME.success} strokeWidth={2} />
            <Text style={styles.emptyTitle}>All Approvals Cleared</Text>
            <Text style={styles.emptySubtitle}>No pending discount or sourcing approvals.</Text>
          </View>
        ) : (
          approvals.map((item, index) => {
            const isProcessing = actionLoadingId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.approvalItem,
                  index < approvals.length - 1 && styles.approvalItemBorder,
                ]}
              >
                {/* Top: Customer & Vehicle + Request Type Badge */}
                <View style={styles.approvalTopRow}>
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.approvalCustomer}>{item.customer_name}</Text>
                    <Text style={styles.approvalVehicle}>{item.vehicle_model}</Text>
                  </View>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{item.request_type}</Text>
                  </View>
                </View>

                {/* Middle: Demanded Discount & Executive Reason */}
                <Text style={styles.approvalDetails}>
                  Demanded Disc:{' '}
                  <Text style={styles.approvalAmount}>
                    ₹{item.discount_amount.toLocaleString('en-IN')}
                  </Text>
                  {' • "' + item.reason + '" '}
                  <Text style={styles.approvalBy}>{"(By: " + item.requested_by + ")"}</Text>
                </Text>

                {/* Bottom Actions: Side-by-Side Approve & Reject */}
                <View style={styles.approvalActionsRow}>
                  <TouchableOpacity
                    style={[styles.approvalBtn, styles.approveBtn]}
                    onPress={() => handleApprovalAction(item.id, 'approve')}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approvalBtn, styles.rejectBtn]}
                    onPress={() => handleApprovalAction(item.id, 'reject')}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <X size={14} color={THEME.danger} strokeWidth={2.2} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 6. Upcoming Deliveries Card */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleGroup}>
            <Truck size={17} color={THEME.primaryNavy} strokeWidth={2.2} />
            <Text style={[styles.cardHeaderTitle, { color: THEME.primaryNavy }]}>Upcoming Deliveries</Text>
          </View>
        </View>

        {deliveries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySubtitle}>No upcoming deliveries scheduled.</Text>
          </View>
        ) : (
          deliveries.map((item, index) => {
            const subtitle = item.detail
              ? `${item.detail} • ${item.vehicle}`
              : item.vehicle;

            return (
              <View
                key={item.id}
                style={[
                  styles.deliveryItem,
                  index < deliveries.length - 1 && styles.deliveryItemBorder,
                ]}
              >
                <View style={styles.itemTextContainer}>
                  <Text style={styles.deliveryCustomer}>{item.customer_name}</Text>
                  <Text style={styles.deliverySubtext} numberOfLines={2}>
                    {subtitle}
                  </Text>
                </View>
                <View style={[styles.statusBadgePill, { backgroundColor: item.badge_bg }]}>
                  <Text style={[styles.statusBadgePillText, { color: item.badge_color }]}>
                    {item.status_label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 7. Recent Activities Timeline */}
      <View style={[styles.sectionCard, styles.recentActivityCard]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleGroup}>
            <Clock size={17} color={THEME.primaryNavy} strokeWidth={2.2} />
            <Text style={[styles.cardHeaderTitle, { color: THEME.primaryNavy }]}>Recent Activity</Text>
          </View>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySubtitle}>No recent activities recorded.</Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {activities.map((item, index) => {
              const isLast = index === activities.length - 1;
              return (
                <View key={item.id} style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
                  {/* Vertical Line with Dot Indicator */}
                  <View style={styles.timelineAxis}>
                    <View style={[styles.timelineDot, { backgroundColor: item.dot_color || '#2563EB' }]} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  {/* Activity Description & Time Ago */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineAction} numberOfLines={2}>
                      {item.text}
                    </Text>
                    <Text style={styles.timelineTime}>{item.time_ago}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  itemTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  timelineContentLast: {
    paddingBottom: 2,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },

  // 1. Header Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 3,
    fontWeight: '400',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textPrimary,
  },

  // 2. Quick Action Bar Styles
  quickActionsContainer: {
    marginBottom: 16,
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickBtnPrimary: {
    backgroundColor: THEME.primaryNavy,
  },
  quickBtnBordered: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  quickBtnTextPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickBtnTextBordered: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textPrimary,
  },

  // 3. Core KPI Stat Cards Styles (2 per row, last 1 full width)
  kpiGridContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCardCol: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  kpiCardFull: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  kpiCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.4,
    flex: 1,
    paddingRight: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  kpiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kpiSubtext: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '500',
  },

  // 4. Section Card Shared Styles
  sectionCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.info,
  },

  // Pipeline Stages
  pipelineScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  stageItem: {
    alignItems: 'center',
    width: 64,
  },
  stageCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  stageNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  stageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textAlign: 'center',
  },

  // 5. Approvals List Styles
  approvalItem: {
    paddingVertical: 12,
  },
  approvalItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
  },
  approvalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  approvalCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  approvalVehicle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  discountBadge: {
    backgroundColor: THEME.dangerBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.danger,
    letterSpacing: 0.3,
  },
  approvalDetails: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginVertical: 6,
    lineHeight: 17,
  },
  approvalAmount: {
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  approvalBy: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  approvalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  approvalBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: THEME.primaryNavy,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
  },

  // 6. Deliveries Styles
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deliveryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
  },
  deliveryCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  deliverySubtext: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 7. Recent Activity Timeline Styles
  recentActivityCard: {
    marginBottom: 12,
  },
  timelineContainer: {
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineAxis: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.borderLight,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 10,
  },
  timelineAction: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textPrimary,
    lineHeight: 18,
  },
  timelineTime: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
});
