import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  AudioLines,
  Calendar,
  Check,
  CheckCircle2,
  Flag,
  Headphones,
  Mic,
  PhoneOutgoing,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import {
  callRecordingService,
  formatBytes,
  getRoleBadgeColors,
  getTodayDate,
} from './callRecordingService';
import {
  AdminSummaryKpis,
  AuditFollowUpItem,
  CallRecordingItem,
  StaffAuditSummaryRow,
  StaffOption,
} from './types';
import { ComplianceBadge, ReviewStatusBadge } from './components/CallRecordingBadges';
import { CallRecordingAudioPlayer } from './components/CallRecordingAudioPlayer';
import { CallRecordingDetailModal } from './components/CallRecordingDetailModal';
import { CallRecordingsFilterModal } from './components/CallRecordingsFilterModal';
import { CleanupOldRecordingsModal } from './components/CleanupOldRecordingsModal';
import { FlagRecordingModal } from './components/FlagRecordingModal';

const SUMMARY_PER_PAGE = 10;
const RECORDINGS_PER_PAGE = 15;

export const AdminCallRecordingsAuditView: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'summary' | 'recordings'>('summary');

  // Filters
  const [fromDate, setFromDate] = useState<string>(getTodayDate());
  const [toDate, setToDate] = useState<string>(getTodayDate());
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Summary data
  const [summaryRows, setSummaryRows] = useState<StaffAuditSummaryRow[]>([]);
  const [summaryVisibleCount, setSummaryVisibleCount] = useState<number>(SUMMARY_PER_PAGE);
  const [kpis, setKpis] = useState<AdminSummaryKpis>({
    total_staff: 0,
    total_follow_ups: 0,
    total_call_follow_ups: 0,
    total_recordings: 0,
    total_missing: 0,
    staff_with_missing: 0,
    pending_review: 0,
    verified_count: 0,
    flagged_count: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // All recordings data
  const [recordings, setRecordings] = useState<CallRecordingItem[]>([]);
  const [recordingsPage, setRecordingsPage] = useState<number>(1);
  const [hasMoreRecordings, setHasMoreRecordings] = useState<boolean>(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Staff Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [staffDetail, setStaffDetail] = useState<{
    staff: Partial<StaffAuditSummaryRow> | null;
    date: string | null;
    follow_ups: AuditFollowUpItem[];
    recordings: CallRecordingItem[];
  }>({
    staff: null,
    date: null,
    follow_ups: [],
    recordings: [],
  });

  // Flag modal
  const [flagTarget, setFlagTarget] = useState<CallRecordingItem | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Delete Older Than 1 Month Modal
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanupLoadingPreview, setCleanupLoadingPreview] = useState(false);
  const [cleanupDeleting, setCleanupDeleting] = useState(false);
  const [cleanupInfo, setCleanupInfo] = useState({ cutoffDate: '', count: 0 });

  const buildDateParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (fromDate) p.from_date = fromDate;
    if (toDate) p.to_date = toDate;
    return p;
  }, [fromDate, toDate]);

  const loadSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const params: Record<string, any> = {
        ...buildDateParams(),
        role: roleFilter || 'all',
      };
      if (roleFilter && staffFilter && staffFilter !== 'all') {
        params.user_id = staffFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await callRecordingService.getSummary(params);
      if (res?.status) {
        setSummaryRows(Array.isArray(res.data) ? res.data : []);
        setSummaryVisibleCount(SUMMARY_PER_PAGE);
        if (Array.isArray(res.staff_options)) {
          setStaffOptions(res.staff_options);
        }
        if (res.kpis) setKpis(res.kpis);
      }
    } catch (err: any) {
      showErrorToast(
        'Summary Failed',
        err?.response?.data?.message || 'Failed to load daily audit summary.'
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }, [buildDateParams, roleFilter, staffFilter, searchTerm]);

  const loadRecordings = useCallback(
    async (pageNumber = 1, isLoadMore = false) => {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else if (pageNumber === 1) {
        setIsLoadingRecordings(true);
      }
      try {
        const params: Record<string, any> = {
          ...buildDateParams(),
          role: roleFilter || 'all',
          review_status: reviewStatusFilter,
          page: pageNumber,
          per_page: RECORDINGS_PER_PAGE,
        };
        if (roleFilter && staffFilter && staffFilter !== 'all') {
          params.user_id = staffFilter;
        }
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const res = await callRecordingService.getRecordings(params);
        if (res?.status) {
          const list: CallRecordingItem[] = Array.isArray(res.data)
            ? res.data
            : [];
          if (pageNumber === 1) {
            setRecordings(list);
          } else {
            setRecordings((prev) => {
              const existingIds = new Set(prev.map((r) => r.id));
              const newItems = list.filter((r) => !existingIds.has(r.id));
              return [...prev, ...newItems];
            });
          }
          setRecordingsPage(pageNumber);
          const pag = res.pagination || {};
          setHasMoreRecordings(
            (pag.current_page || pageNumber) < (pag.last_page || 1)
          );
        }
      } catch (err: any) {
        showErrorToast(
          'Load Failed',
          err?.response?.data?.message || 'Failed to load recordings.'
        );
      } finally {
        setIsLoadingRecordings(false);
        setIsLoadingMore(false);
      }
    },
    [buildDateParams, roleFilter, staffFilter, reviewStatusFilter, searchTerm]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (activeTab === 'recordings') {
      loadRecordings(1, false);
    }
  }, [loadRecordings, activeTab]);

  // Debounce live search
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== searchTerm) {
        setSearchTerm(trimmed);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, searchTerm]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSummary();
    if (activeTab === 'recordings') {
      await loadRecordings(1, false);
    }
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (activeTab === 'summary') {
      if (
        !isLoadingSummary &&
        !isRefreshing &&
        summaryVisibleCount < summaryRows.length
      ) {
        setSummaryVisibleCount((prev) => prev + SUMMARY_PER_PAGE);
      }
      return;
    }

    if (
      !isLoadingMore &&
      hasMoreRecordings &&
      !isLoadingRecordings &&
      !isRefreshing
    ) {
      loadRecordings(recordingsPage + 1, true);
    }
  };

  const handleOpenStaffDetail = useCallback(
    async (row: StaffAuditSummaryRow) => {
      triggerHaptic('selection');
      setDetailModalOpen(true);
      setDetailLoading(true);
      setStaffDetail({
        staff: row,
        date: row.date || null,
        follow_ups: [],
        recordings: [],
      });
      try {
        const detailParams = row.date ? { date: row.date } : buildDateParams();
        const res = await callRecordingService.getStaffDetail(
          row.user_id,
          detailParams
        );
        if (res?.status) {
          setStaffDetail({
            staff: res.staff || row,
            date: row.date || null,
            follow_ups: Array.isArray(res.follow_ups) ? res.follow_ups : [],
            recordings: Array.isArray(res.recordings) ? res.recordings : [],
          });
        }
      } catch (err: any) {
        showErrorToast(
          'Load Failed',
          err?.response?.data?.message || 'Failed to load staff detail.'
        );
      } finally {
        setDetailLoading(false);
      }
    },
    [buildDateParams]
  );

  const handleQuickReview = useCallback(
    async (
      rec: CallRecordingItem,
      nextStatus: 'verified' | 'flagged',
      remark = ''
    ) => {
      try {
        const res = await callRecordingService.reviewRecording(rec.id, {
          review_status: nextStatus,
          review_remark: remark,
        });
        if (res?.status) {
          showSuccessToast('Updated', `Recording marked as ${nextStatus}.`);
          const updated: CallRecordingItem = res.data || {
            ...rec,
            review_status: nextStatus,
            review_remark: remark,
          };
          setRecordings((prev) =>
            prev.map((r) => (r.id === rec.id ? updated : r))
          );
          setStaffDetail((prev) => ({
            ...prev,
            recordings: prev.recordings.map((r) =>
              r.id === rec.id ? updated : r
            ),
          }));
          loadSummary();
        }
      } catch (err: any) {
        showErrorToast(
          'Update Failed',
          err?.response?.data?.message || 'Failed to update status.'
        );
      }
    },
    [loadSummary]
  );

  const handleFlagSubmit = async (remark: string) => {
    if (!flagTarget) return;
    setIsSubmittingReview(true);
    await handleQuickReview(flagTarget, 'flagged', remark);
    setIsSubmittingReview(false);
    setFlagTarget(null);
  };

  const handleOpenCleanupModal = async () => {
    triggerHaptic('selection');
    setCleanupModalOpen(true);
    setCleanupLoadingPreview(true);
    setCleanupInfo({ cutoffDate: '', count: 0 });
    try {
      const res = await callRecordingService.deleteOlderThanMonth(true);
      if (res?.status) {
        setCleanupInfo({
          cutoffDate: res.cutoff_date || '',
          count: Number(res.count || 0),
        });
      }
    } catch (err: any) {
      showErrorToast(
        'Check Failed',
        err?.response?.data?.message || 'Failed to check old recordings.'
      );
      setCleanupModalOpen(false);
    } finally {
      setCleanupLoadingPreview(false);
    }
  };

  const handleConfirmCleanup = async () => {
    setCleanupDeleting(true);
    try {
      const res = await callRecordingService.deleteOlderThanMonth(false);
      if (res?.status) {
        showSuccessToast(
          'Cleanup Complete',
          res.message ||
            `Deleted ${res.deleted_count || 0} recording(s) before ${res.cutoff_date}.`
        );
        setCleanupModalOpen(false);
        loadSummary();
        if (activeTab === 'recordings') {
          loadRecordings(1, false);
        }
      }
    } catch (err: any) {
      showErrorToast(
        'Cleanup Failed',
        err?.response?.data?.message || 'Failed to delete old recordings.'
      );
    } finally {
      setCleanupDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setRoleFilter('');
    setStaffFilter('all');
    setReviewStatusFilter('all');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (fromDate || toDate) count++;
    if (roleFilter) count++;
    if (staffFilter && staffFilter !== 'all') count++;
    if (activeTab === 'recordings' && reviewStatusFilter !== 'all') count++;
    return count;
  }, [fromDate, toDate, roleFilter, staffFilter, activeTab, reviewStatusFilter]);

  const visibleSummaryRows = useMemo(
    () => summaryRows.slice(0, summaryVisibleCount),
    [summaryRows, summaryVisibleCount]
  );

  const cardSurface = isDark ? '#131B2E' : '#FFFFFF';
  const cardBorder = isDark ? '#1E293B' : '#E2E8F0';
  const missingAccent = kpis.total_missing > 0 ? '#DC2626' : '#059669';

  const dateSubtitle =
    !fromDate && !toDate
      ? 'All Dates'
      : fromDate === toDate
        ? fromDate
        : `${fromDate || '...'} to ${toDate || '...'}`;

  const renderAuditItem = useCallback(
    ({ item }: { item: StaffAuditSummaryRow | CallRecordingItem }) => {
      if (activeTab === 'summary') {
        const row = item as StaffAuditSummaryRow;
        const roleBadge = getRoleBadgeColors(row.role, isDark);
        return (
          <View
            style={[
              styles.auditCard,
              styles.listCardMargin,
              {
                backgroundColor: cardSurface,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={styles.auditTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.staffName, { color: colors.textPrimary }]}>
                  {row.name}
                </Text>
                <Text
                  style={[styles.staffSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {row.phone || row.email || '-'}
                </Text>
                {row.date ? (
                  <View style={styles.dateBadgeRow}>
                    <Calendar size={12} color={colors.primary} />
                    <Text
                      style={[styles.dateBadgeText, { color: colors.textPrimary }]}
                    >
                      {row.date}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View
                style={[
                  styles.rolePill,
                  {
                    backgroundColor: roleBadge.bg,
                    borderColor: roleBadge.border,
                  },
                ]}
              >
                <Text style={[styles.rolePillText, { color: roleBadge.text }]}>
                  {row.role}
                </Text>
              </View>
            </View>

            <View style={styles.dayMetricsRow}>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Call Follow-Ups
                </Text>
                <Text style={[styles.metricVal, { color: colors.textPrimary }]}>
                  {row.call_follow_ups}
                  {row.total_follow_ups !== row.call_follow_ups ? (
                    <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                      {' '}
                      ({row.total_follow_ups} total)
                    </Text>
                  ) : null}
                </Text>
              </View>

              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: isDark ? '#0D131F' : '#F8FAFC',
                    borderColor: cardBorder,
                  },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                  Uploaded
                </Text>
                <Text style={[styles.metricVal, { color: colors.primary }]}>
                  {row.recordings_uploaded}
                </Text>
              </View>
            </View>

            <ComplianceBadge
              compliance_status={row.compliance_status}
              recordings_uploaded={row.recordings_uploaded}
              call_follow_ups={row.call_follow_ups}
              missing_count={row.missing_count}
            />

            <View style={styles.auditBottomRow}>
              <View style={styles.verificationPills}>
                {row.verified_count > 0 ? (
                  <Text style={[styles.verifPill, { color: colors.success }]}>
                    {row.verified_count} Verified
                  </Text>
                ) : null}
                {row.pending_count > 0 ? (
                  <Text style={[styles.verifPill, { color: colors.warning }]}>
                    {row.pending_count} Pending
                  </Text>
                ) : null}
                {row.flagged_count > 0 ? (
                  <Text style={[styles.verifPill, { color: colors.danger }]}>
                    {row.flagged_count} Flagged
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => handleOpenStaffDetail(row)}
                activeOpacity={0.8}
                style={[
                  styles.viewListenBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Headphones
                  size={14}
                  color={isDark ? '#0B111A' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.viewListenText,
                    { color: isDark ? '#0B111A' : '#FFFFFF' },
                  ]}
                >
                  View & Listen ({row.recordings_uploaded})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      const rec = item as CallRecordingItem;
      const roleBadge = getRoleBadgeColors(rec.user?.role, isDark);
      return (
        <View
          style={[
            styles.auditCard,
            styles.listCardMargin,
            {
              backgroundColor: cardSurface,
              borderColor: cardBorder,
            },
          ]}
        >
          <View style={styles.auditTop}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.recStaffRow}>
                <Text style={[styles.staffName, { color: colors.textPrimary }]}>
                  {rec.user?.name || 'Unknown'}
                </Text>
                {rec.user?.role ? (
                  <View
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: roleBadge.bg,
                        borderColor: roleBadge.border,
                      },
                    ]}
                  >
                    <Text style={[styles.rolePillText, { color: roleBadge.text }]}>
                      {rec.user.role}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[styles.recFileTitle, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {rec.original_name}
              </Text>
              <Text style={[styles.staffSub, { color: colors.textSecondary }]}>
                {rec.recording_date} • {formatBytes(rec.file_size)}
                {rec.phone_number ? ` • ${rec.phone_number}` : ''}
              </Text>
            </View>
            <ReviewStatusBadge status={rec.review_status} />
          </View>

          {rec.notes ? (
            <Text style={[styles.recNote, { color: colors.textSecondary }]}>
              Note: {rec.notes}
            </Text>
          ) : null}

          {rec.review_remark ? (
            <Text style={[styles.recRemark, { color: colors.danger }]}>
              Remark: {rec.review_remark}
            </Text>
          ) : null}

          <CallRecordingAudioPlayer
            recordingId={rec.id}
            fileName={rec.original_name}
          />

          <View style={styles.recActionRow}>
            <TouchableOpacity
              disabled={rec.review_status === 'verified'}
              onPress={() => {
                triggerHaptic('selection');
                handleQuickReview(rec, 'verified');
              }}
              style={[
                styles.auditActionBtn,
                {
                  borderColor: isDark
                    ? 'rgba(16, 185, 129, 0.4)'
                    : '#A7F3D0',
                  backgroundColor: isDark
                    ? 'rgba(16, 185, 129, 0.14)'
                    : '#ECFDF5',
                  opacity: rec.review_status === 'verified' ? 0.45 : 1,
                },
              ]}
            >
              <Check size={14} color={isDark ? '#34D399' : '#059669'} />
              <Text
                style={[
                  styles.auditActionText,
                  { color: isDark ? '#34D399' : '#059669' },
                ]}
              >
                Verify
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setFlagTarget(rec);
              }}
              style={[
                styles.auditActionBtn,
                {
                  borderColor: isDark
                    ? 'rgba(239, 68, 68, 0.4)'
                    : '#FECACA',
                  backgroundColor: isDark
                    ? 'rgba(239, 68, 68, 0.14)'
                    : '#FEF2F2',
                },
              ]}
            >
              <Flag size={14} color={isDark ? '#F87171' : '#DC2626'} />
              <Text
                style={[
                  styles.auditActionText,
                  { color: isDark ? '#F87171' : '#DC2626' },
                ]}
              >
                Flag
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      activeTab,
      cardBorder,
      cardSurface,
      colors,
      handleOpenStaffDetail,
      handleQuickReview,
      isDark,
    ]
  );

  const listData: (StaffAuditSummaryRow | CallRecordingItem)[] =
    activeTab === 'summary'
      ? isLoadingSummary
        ? []
        : visibleSummaryRows
      : isLoadingRecordings
        ? []
        : recordings;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={listData}
        keyExtractor={(item) =>
          activeTab === 'summary'
            ? `summary_${(item as StaffAuditSummaryRow).user_id}_${(item as StaffAuditSummaryRow).date || 'none'}`
            : `rec_${(item as CallRecordingItem).id}`
        }
        renderItem={renderAuditItem}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeaderStack}>
      {/* 1. Single-Line Horizontal KPI Deck (Matching LeadsScreen) */}
      <View style={styles.kpiDeckWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiDeckScroll}
        >
          {/* Card 1: Call Follow-Ups */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: cardBorder,
                borderTopColor: '#2563EB',
              },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: isDark ? '#2563EB25' : '#2563EB15' },
                ]}
              >
                <PhoneOutgoing size={14} color="#2563EB" strokeWidth={2.4} />
              </View>
              <Text style={styles.kpiCardLabel}>FOLLOW-UPS</Text>
            </View>
            <Text style={[styles.kpiCountText, { color: colors.textPrimary }]}>
              {kpis.total_call_follow_ups}
            </Text>
            <Text
              style={[styles.kpiSubText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              All Follow-ups: {kpis.total_follow_ups}
            </Text>
          </View>

          {/* Card 2: Recordings Uploaded */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: cardBorder,
                borderTopColor: '#059669',
              },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: isDark ? '#05966925' : '#05966915' },
                ]}
              >
                <Mic size={14} color="#059669" strokeWidth={2.4} />
              </View>
              <Text style={styles.kpiCardLabel}>RECORDINGS</Text>
            </View>
            <Text style={[styles.kpiCountText, { color: colors.textPrimary }]}>
              {kpis.total_recordings}
            </Text>
            <Text
              style={[styles.kpiSubText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              Across {kpis.total_staff} staff
            </Text>
          </View>

          {/* Card 3: Missing Recordings */}
          <View
            style={[
              styles.kpiCard,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor:
                  kpis.total_missing > 0
                    ? isDark
                      ? '#2D1B22'
                      : '#FEE2E2'
                    : cardBorder,
                borderTopColor: missingAccent,
              },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View
                style={[
                  styles.kpiIconBox,
                  {
                    backgroundColor: isDark
                      ? `${missingAccent}25`
                      : `${missingAccent}15`,
                  },
                ]}
              >
                {kpis.total_missing > 0 ? (
                  <AlertTriangle
                    size={14}
                    color={missingAccent}
                    strokeWidth={2.4}
                  />
                ) : (
                  <CheckCircle2
                    size={14}
                    color={missingAccent}
                    strokeWidth={2.4}
                  />
                )}
              </View>
              <Text style={[styles.kpiCardLabel, { color: missingAccent }]}>
                MISSING
              </Text>
            </View>
            <Text style={[styles.kpiCountText, { color: missingAccent }]}>
              {kpis.total_missing}
            </Text>
            <Text
              style={[styles.kpiSubText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {kpis.staff_with_missing} staff with gap
            </Text>
          </View>

          {/* Card 4: Audit Progress */}
          <View
            style={[
              styles.kpiCard,
              styles.kpiCardWide,
              {
                backgroundColor: isDark ? '#101726' : '#FFFFFF',
                borderColor: cardBorder,
                borderTopColor: '#D97706',
              },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <View
                style={[
                  styles.kpiIconBox,
                  { backgroundColor: isDark ? '#D9770625' : '#D9770615' },
                ]}
              >
                <ShieldCheck size={14} color="#D97706" strokeWidth={2.4} />
              </View>
              <Text style={styles.kpiCardLabel}>AUDIT PROGRESS</Text>
            </View>
            <View style={styles.kpiAuditPillsRow}>
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.16)'
                      : '#FFFBEB',
                  },
                ]}
              >
                <Text style={[styles.miniBadgeText, { color: colors.warning }]}>
                  {kpis.pending_review} Pending
                </Text>
              </View>
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.16)'
                      : '#ECFDF5',
                  },
                ]}
              >
                <Text style={[styles.miniBadgeText, { color: colors.success }]}>
                  {kpis.verified_count} Verified
                </Text>
              </View>
              <View
                style={[
                  styles.miniBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.16)'
                      : '#FEF2F2',
                  },
                ]}
              >
                <Text style={[styles.miniBadgeText, { color: colors.danger }]}>
                  {kpis.flagged_count} Flagged
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 2. Compact Action Bar: Search Input + Filter Button (Matching LeadsScreen) */}
      <View style={styles.actionBarRow}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#CBD5E1',
            },
          ]}
        >
          <Search size={14} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search staff, file, phone..."
            placeholderTextColor={colors.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={() => {
              setSearchTerm(searchInput.trim());
            }}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('impactLight');
                setSearchInput('');
                setSearchTerm('');
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterModalTriggerBtn,
            {
              backgroundColor:
                activeFiltersCount > 0
                  ? colors.primary
                  : isDark
                    ? '#131B2E'
                    : '#FFFFFF',
              borderColor:
                activeFiltersCount > 0
                  ? colors.primaryDark
                  : isDark
                    ? '#1E293B'
                    : '#CBD5E1',
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setFilterModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={14}
            color={
              activeFiltersCount > 0
                ? isDark
                  ? '#0B111A'
                  : '#FFFFFF'
                : colors.textPrimary
            }
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.filterTriggerText,
              {
                color:
                  activeFiltersCount > 0
                    ? isDark
                      ? '#0B111A'
                      : '#FFFFFF'
                    : colors.textPrimary,
                marginLeft: 5,
              },
            ]}
          >
            {activeFiltersCount > 0
              ? `Filters (${activeFiltersCount})`
              : 'Filter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cleanupTriggerBtn,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FECACA',
            },
          ]}
          onPress={handleOpenCleanupModal}
          activeOpacity={0.8}
        >
          <Trash2 size={14} color={colors.danger} strokeWidth={2.2} />
          <Text style={[styles.cleanupTriggerText, { color: colors.danger }]}>
            &gt;1M
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main Tabs */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: cardSurface, borderColor: cardBorder },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('summary');
          }}
          style={[
            styles.tabBtn,
            activeTab === 'summary' && { backgroundColor: colors.primary },
          ]}
        >
          <Users
            size={15}
            color={
              activeTab === 'summary'
                ? isDark
                  ? '#0B111A'
                  : '#FFFFFF'
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'summary'
                    ? isDark
                      ? '#0B111A'
                      : '#FFFFFF'
                    : colors.textSecondary,
              },
            ]}
          >
            Staff Summary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('recordings');
          }}
          style={[
            styles.tabBtn,
            activeTab === 'recordings' && { backgroundColor: colors.primary },
          ]}
        >
          <AudioLines
            size={15}
            color={
              activeTab === 'recordings'
                ? isDark
                  ? '#0B111A'
                  : '#FFFFFF'
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === 'recordings'
                    ? isDark
                      ? '#0B111A'
                      : '#FFFFFF'
                    : colors.textSecondary,
              },
            ]}
          >
            All Recordings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
        }
        ListEmptyComponent={
          (activeTab === 'summary' ? isLoadingSummary : isLoadingRecordings) ? (
            <View
              style={[
                styles.sectionCard,
                styles.centerBox,
                { backgroundColor: cardSurface, borderColor: cardBorder },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'summary'
                  ? 'Loading staff audit summary...'
                  : 'Loading uploaded recordings...'}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.sectionCard,
                styles.centerBox,
                { backgroundColor: cardSurface, borderColor: cardBorder },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'summary'
                  ? 'No Sales Executive or Receptionist records found for the selected filters.'
                  : 'No call recordings found for the selected filters.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          activeTab === 'recordings' && isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
      />

      {/* Filter Bottom-Sheet Modal */}
      <CallRecordingsFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        activeTab={activeTab}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        staffFilter={staffFilter}
        setStaffFilter={setStaffFilter}
        staffOptions={staffOptions}
        reviewStatusFilter={reviewStatusFilter}
        setReviewStatusFilter={setReviewStatusFilter}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
        onApply={() => setFilterModalVisible(false)}
      />

      {/* Staff Detail Modal */}
      <CallRecordingDetailModal
        visible={detailModalOpen}
        mode="audit"
        title={`${staffDetail.staff?.name || 'Staff'} — Call Audit`}
        subtitle={`${staffDetail.staff?.role || ''} • ${
          staffDetail.date ? staffDetail.date : dateSubtitle
        }`}
        loading={detailLoading}
        followUps={staffDetail.follow_ups}
        recordings={staffDetail.recordings}
        onClose={() => setDetailModalOpen(false)}
        onVerify={(rec) => handleQuickReview(rec, 'verified')}
        onFlag={(rec) => setFlagTarget(rec)}
      />

      {/* Flag Remark Modal */}
      <FlagRecordingModal
        visible={flagTarget !== null}
        recording={flagTarget}
        submitting={isSubmittingReview}
        onClose={() => setFlagTarget(null)}
        onSubmit={handleFlagSubmit}
      />

      {/* Delete Recordings Older Than 1 Month Confirmation Modal */}
      <CleanupOldRecordingsModal
        visible={cleanupModalOpen}
        loadingPreview={cleanupLoadingPreview}
        deleting={cleanupDeleting}
        cutoffDate={cleanupInfo.cutoffDate}
        count={cleanupInfo.count}
        onClose={() => setCleanupModalOpen(false)}
        onConfirm={handleConfirmCleanup}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 10, paddingBottom: 24, gap: 10 },
  listHeaderStack: { gap: 10, marginBottom: 2 },
  listCardMargin: { marginHorizontal: 14 },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  kpiDeckWrapper: {
    paddingVertical: 2,
  },
  kpiDeckScroll: {
    paddingHorizontal: 14,
    gap: 10,
  },
  kpiCard: {
    width: 154,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 3,
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  kpiCardWide: {
    width: 184,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  kpiCountText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiSubText: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 1,
  },
  kpiAuditPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  miniBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterModalTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterTriggerText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  cleanupTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  cleanupTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 14,
    padding: 5,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionCard: {
    marginHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  centerBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  cardsStack: {
    gap: 10,
  },
  auditCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  auditTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  staffName: {
    fontSize: 14,
    fontWeight: '800',
  },
  staffSub: {
    fontSize: 11,
    marginTop: 2,
  },
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  dateBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dayMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  auditBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  verificationPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  verifPill: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  viewListenText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recStaffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  recFileTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recNote: {
    fontSize: 12,
  },
  recRemark: {
    fontSize: 12,
    fontWeight: '600',
  },
  recActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  auditActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  auditActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
