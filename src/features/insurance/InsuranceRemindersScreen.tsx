import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { DatePickerModal } from '../leads/components/DatePickerModal';
import { EditInsuranceModal } from './components/EditInsuranceModal';
import { InsuranceDetailModal } from './components/InsuranceDetailModal';
import { RenewPolicyModal } from './components/RenewPolicyModal';
import {
  formatIndianCurrency,
  insuranceService,
} from './insuranceService';
import { InsurancePagination, InsuranceRecord } from './types';

export const InsuranceRemindersScreen: React.FC = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<InsuranceRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const toIsoDate = (displayStr?: string): string => {
    if (!displayStr) return '';
    const parts = displayStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return displayStr;
  };

  const toDisplayDate = (isoStr?: string | null): string => {
    if (!isoStr) return '—';
    if (isoStr.includes('-')) {
      const parts = isoStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const loadData = useCallback(
    async (
      pageNumber: number = 1,
      isLoadMore: boolean = false,
      search: string = searchTerm,
      from: string = fromDate,
      to: string = toDate
    ) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else if (!isRefreshing) {
          setIsLoading(true);
        }

        const res = await insuranceService.getReminders({
          page: pageNumber,
          per_page: 10,
          days: 15,
          search: search.trim() || undefined,
          from_date: toIsoDate(from) || undefined,
          to_date: toIsoDate(to) || undefined,
        });

        if (res && res.status) {
          if (isLoadMore) {
            setRecords((prev) => [...prev, ...res.data]);
          } else {
            setRecords(res.data);
            setTotalCount(res.pagination.total);
          }
          setPage(pageNumber);
          setHasMore(!!res.hasMore);
        }
      } catch (err) {
        console.error('loadReminders error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [searchTerm, fromDate, toDate, isRefreshing]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, false, searchTerm, fromDate, toDate);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, fromDate, toDate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(1, false, searchTerm, fromDate, toDate);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      loadData(page + 1, true, searchTerm, fromDate, toDate);
    }
  };

  const getDaysRemaining = (item: InsuranceRecord) => {
    const expStr = item.policy_expiry_date || item.insurance_expire_date;
    if (!expStr) return null;
    const expDate = new Date(expStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const renderReminderCard = ({ item }: { item: InsuranceRecord }) => {
    const daysLeft = getDaysRemaining(item);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#131C27' : '#FFFFFF',
            borderColor: isDark ? 'rgba(217, 221, 204, 0.18)' : colors.border,
          },
        ]}
      >
        {/* Card Header: Policy # & Expiry Countdown */}
        <View style={styles.cardHeader}>
          <View style={styles.policyBadge}>
            <Text style={styles.policyBadgeText}>
              #{item.policy_number || 'POLICY'}
            </Text>
          </View>

          <View
            style={[
              styles.countdownBadge,
              daysLeft !== null && daysLeft < 0
                ? { backgroundColor: '#FEE2E2' }
                : { backgroundColor: '#FEF3C7' },
            ]}
          >
            <Clock
              size={12}
              color={daysLeft !== null && daysLeft < 0 ? '#DC2626' : '#D97706'}
            />
            <Text
              style={[
                styles.countdownText,
                daysLeft !== null && daysLeft < 0
                  ? { color: '#DC2626' }
                  : { color: '#D97706' },
              ]}
            >
              {daysLeft !== null
                ? daysLeft < 0
                  ? 'Expired'
                  : daysLeft === 0
                  ? 'Due Today'
                  : `Due in ${daysLeft}d`
                : 'Expiring Soon'}
            </Text>
          </View>
        </View>

        {/* Customer & Quick Contact Row */}
        <View style={styles.customerRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.customerName,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.customer_name}
            </Text>
            <Text
              style={[
                styles.customerSub,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              {item.customer_phone || item.customer_number || '—'}
              {item.customer_city ? ` • ${item.customer_city}` : ''}
            </Text>
          </View>

          {/* Quick Call & WhatsApp Buttons */}
          {(item.customer_phone || item.customer_number) && (
            <View style={styles.quickContactGroup}>
              <TouchableOpacity
                style={[styles.quickContactBtn, { backgroundColor: '#DCFCE7' }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  Linking.openURL(`tel:${item.customer_phone || item.customer_number}`);
                }}
              >
                <Phone size={14} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickContactBtn, { backgroundColor: '#D1FAE5' }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  const p = (item.customer_phone || item.customer_number || '').replace(/[^0-9]/g, '');
                  const expDate = toDisplayDate(item.policy_expiry_date || item.insurance_expire_date);
                  const text = encodeURIComponent(
                    `Dear ${item.customer_name},\nThis is a renewal reminder regarding vehicle insurance policy (#${item.policy_number || ''}) which expires on ${expDate}.\nPlease contact us to renew.\n- Defence Autolink`
                  );
                  Linking.openURL(`https://wa.me/91${p.slice(-10)}?text=${text}`);
                }}
              >
                <MessageCircle size={14} color="#059669" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Vehicle & Insurance Details Box */}
        <View
          style={[
            styles.detailsBox,
            {
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text
              style={[
                styles.detailVal,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.model_variant || item.vehicle_name || '—'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Provider</Text>
            <Text
              style={[
                styles.detailVal,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.insurance_company || '—'}
            </Text>
          </View>
        </View>

        {/* Policy Expiry & Premium Row */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Policy Expiry</Text>
            <Text style={[styles.metaVal, { color: '#DC2626', fontWeight: '700' }]}>
              {toDisplayDate(item.policy_expiry_date || item.insurance_expire_date)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Premium Amount</Text>
            <Text
              style={[
                styles.metaVal,
                { color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '700' },
              ]}
            >
              ₹{formatIndianCurrency(item.premium_amount || 0)}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Details, Edit, Renew */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              setSelectedRecord(item);
              setShowDetailModal(true);
            }}
          >
            <Eye size={14} color={isDark ? '#CBD5E1' : '#475569'} />
            <Text
              style={[
                styles.actionBtnText,
                { color: isDark ? '#CBD5E1' : '#475569' },
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
            onPress={() => {
              triggerHaptic('impactLight');
              setSelectedRecord(item);
              setShowEditModal(true);
            }}
          >
            <Edit3 size={14} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.renewBtn, { backgroundColor: colors.orange }]}
            onPress={() => {
              triggerHaptic('impactMedium');
              setSelectedRecord(item);
              setShowRenewModal(true);
            }}
          >
            <RefreshCw size={14} color="#FFFFFF" />
            <Text style={styles.renewBtnText}>Renew Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#0F172A' : '#F7F7F5' },
      ]}
    >
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderReminderCard}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
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
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Title & Badge */}
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.pageTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Insurance & Renewal Reminders
              </Text>
              <View style={styles.windowBadge}>
                <Text style={styles.windowBadgeText}>
                  15 Days Expiry Window ({totalCount})
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.pageSubtitle,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Vehicle policies expiring within the next 15 days requiring customer renewal reminders.
            </Text>

            {/* Filter Row: Search & Date Range */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(217, 221, 204, 0.2)' : colors.border,
                },
              ]}
            >
              <Search size={16} color={isDark ? '#94A3B8' : '#64748B'} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
                placeholder="Search by customer, phone, vehicle, policy #..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm ? (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <X size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Date Pickers Row */}
            <View style={styles.dateFilterRow}>
              <TouchableOpacity
                style={[
                  styles.datePill,
                  {
                    backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                    borderColor: fromDate ? colors.primary : isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                onPress={() => setShowFromPicker(true)}
              >
                <Calendar size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text
                  style={[
                    styles.datePillText,
                    {
                      color: fromDate
                        ? isDark
                          ? '#F1F5F9'
                          : '#0F172A'
                        : isDark
                        ? '#64748B'
                        : '#94A3B8',
                    },
                  ]}
                >
                  {fromDate ? `From: ${fromDate}` : 'From: dd/mm/yyyy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.datePill,
                  {
                    backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                    borderColor: toDate ? colors.primary : isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
                onPress={() => setShowToPicker(true)}
              >
                <Calendar size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text
                  style={[
                    styles.datePillText,
                    {
                      color: toDate
                        ? isDark
                          ? '#F1F5F9'
                          : '#0F172A'
                        : isDark
                        ? '#64748B'
                        : '#94A3B8',
                    },
                  ]}
                >
                  {toDate ? `To: ${toDate}` : 'To: dd/mm/yyyy'}
                </Text>
              </TouchableOpacity>

              {(fromDate || toDate) && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                >
                  <X size={14} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Checking insurance renewal reminders...
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#E2E8F0',
                },
              ]}
            >
              <ShieldCheck size={46} color="#16A34A" />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                No Renewal Reminders Due in Next 15 Days
              </Text>
              <Text
                style={[
                  styles.emptySub,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                All vehicle insurance policies are up to date!
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 18, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
      />

      {/* Date Pickers */}
      <DatePickerModal
        visible={showFromPicker}
        title="Filter From Date"
        initialDate={fromDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowFromPicker(false)}
        onSelectDate={(d) => {
          setFromDate(d);
          setShowFromPicker(false);
        }}
      />
      <DatePickerModal
        visible={showToPicker}
        title="Filter To Date"
        initialDate={toDate}
        allowPast={true}
        allowFuture={true}
        onClose={() => setShowToPicker(false)}
        onSelectDate={(d) => {
          setToDate(d);
          setShowToPicker(false);
        }}
      />

      {/* Detail Modal */}
      <InsuranceDetailModal
        visible={showDetailModal}
        record={selectedRecord}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedRecord(null);
        }}
        onEdit={(rec) => {
          setSelectedRecord(rec);
          setShowEditModal(true);
        }}
        onRenew={(rec) => {
          setSelectedRecord(rec);
          setShowRenewModal(true);
        }}
      />

      {/* Renew Modal */}
      <RenewPolicyModal
        visible={showRenewModal}
        record={selectedRecord}
        onClose={() => {
          setShowRenewModal(false);
          setSelectedRecord(null);
        }}
        onSuccess={() => {
          loadData(1, false, searchTerm, fromDate, toDate);
        }}
      />

      {/* Edit Modal */}
      <EditInsuranceModal
        visible={showEditModal}
        record={selectedRecord}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRecord(null);
        }}
        onSuccess={() => {
          loadData(1, false, searchTerm, fromDate, toDate);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerSection: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  windowBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  windowBadgeText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  datePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  datePillText: {
    fontSize: 12,
  },
  clearBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  policyBadge: {
    backgroundColor: '#EFF3DF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  policyBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  customerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  quickContactGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  quickContactBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 13,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  renewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
  },
  renewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageSummaryText: {
    fontSize: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBadge: {
    paddingHorizontal: 8,
  },
  pageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
