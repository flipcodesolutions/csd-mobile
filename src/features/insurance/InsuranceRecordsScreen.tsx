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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Filter,
  IndianRupee,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { EditInsuranceModal } from './components/EditInsuranceModal';
import { InsuranceDetailModal } from './components/InsuranceDetailModal';
import { InsuranceFilterModal } from './components/InsuranceFilterModal';
import { RenewPolicyModal } from './components/RenewPolicyModal';
import {
  formatIndianCurrency,
  insuranceService,
} from './insuranceService';
import { InsurancePagination, InsuranceRecord } from './types';

export const InsuranceRecordsScreen: React.FC = () => {
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

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

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
      status: string = statusFilter,
      from: string = fromDate,
      to: string = toDate
    ) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else if (!isRefreshing) {
          setIsLoading(true);
        }

        const res = await insuranceService.getRecords({
          page: pageNumber,
          per_page: 10,
          search: search.trim() || undefined,
          status: status !== 'all' ? status : undefined,
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
        console.error('loadRecords error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [searchTerm, statusFilter, fromDate, toDate, isRefreshing]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, false, searchTerm, statusFilter, fromDate, toDate);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, fromDate, toDate]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(1, false, searchTerm, statusFilter, fromDate, toDate);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      loadData(page + 1, true, searchTerm, statusFilter, fromDate, toDate);
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter && statusFilter !== 'all') count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  };

  const activeFiltersCount = getActiveFilterCount();

  const getRecordStatusBadge = (item: InsuranceRecord) => {
    const expStr = item.policy_expiry_date || item.insurance_expire_date;
    if (expStr) {
      const expDate = new Date(expStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diff < 0) {
        return { label: 'Expired', bg: '#FEE2E2', text: '#DC2626' };
      }
      if (diff <= 15) {
        return {
          label: diff === 0 ? 'Due Today' : `Due in ${diff}d`,
          bg: '#FEF3C7',
          text: '#D97706',
        };
      }
    }

    if (item.renewal_status === 'Renewed') {
      return { label: 'Renewed', bg: '#DBEAFE', text: '#2563EB' };
    }

    return { label: 'Active', bg: '#DCFCE7', text: '#16A34A' };
  };

  const renderRecordCard = ({ item }: { item: InsuranceRecord }) => {
    const statusMeta = getRecordStatusBadge(item);

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
        {/* Card Header: Policy # & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.policyBadge}>
            <Text style={styles.policyBadgeText}>
              #{item.policy_number || 'POL-UNASSIGNED'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
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

          {/* Quick Contact Icons */}
          {(item.customer_phone || item.customer_number) && (
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={[styles.quickContactBtn, { backgroundColor: '#DCFCE7' }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  Linking.openURL(`tel:${item.customer_phone || item.customer_number}`);
                }}
              >
                <Phone size={13} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickContactBtn, { backgroundColor: '#D1FAE5' }]}
                onPress={() => {
                  triggerHaptic('impactLight');
                  const p = (item.customer_phone || item.customer_number || '').replace(/[^0-9]/g, '');
                  const expDate = toDisplayDate(item.policy_expiry_date || item.insurance_expire_date);
                  const text = encodeURIComponent(
                    `Dear ${item.customer_name},\nRegarding your insurance policy (#${item.policy_number || ''}) for ${item.model_variant || 'your vehicle'} expiring on ${expDate}.\n- Defence Autolink`
                  );
                  Linking.openURL(`https://wa.me/91${p.slice(-10)}?text=${text}`);
                }}
              >
                <MessageCircle size={13} color="#059669" />
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
            {item.vehicle_number ? (
              <Text style={styles.detailSubVal}>{item.vehicle_number}</Text>
            ) : null}
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Insurance Company</Text>
            <Text
              style={[
                styles.detailVal,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.insurance_company || '—'}
            </Text>
            <Text style={styles.detailSubVal}>
              {item.insurance_type || 'Comprehensive'}
            </Text>
          </View>
        </View>

        {/* Policy Period & Premium */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Policy Period</Text>
            <Text
              style={[
                styles.metaVal,
                { color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: '600' },
              ]}
            >
              {toDisplayDate(item.policy_start_date || item.delivery_date)} -{' '}
              {toDisplayDate(item.policy_expiry_date || item.insurance_expire_date)}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Premium Amount</Text>
            <Text
              style={[
                styles.metaVal,
                { color: '#16A34A', fontWeight: '800', fontSize: 14 },
              ]}
            >
              ₹{formatIndianCurrency(item.premium_amount || 0)}
            </Text>
          </View>
        </View>

        {/* Action Buttons: View Details, Edit Record, Renew Policy */}
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
        renderItem={renderRecordCard}
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
            {/* Title & Total Badge */}
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.pageTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Insurance Records
              </Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>
                  {totalCount} Total Records
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.pageSubtitle,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Master vehicle insurance register, policy archives, and renewal histories.
            </Text>

            {/* Search and Filter Button Row */}
            <View style={styles.searchAndFilterRow}>
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
                  placeholder="Search policy #, customer, VIN..."
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

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      activeFiltersCount > 0
                        ? colors.primary
                        : isDark
                        ? '#131C27'
                        : '#FFFFFF',
                    borderColor:
                      activeFiltersCount > 0
                        ? colors.primary
                        : isDark
                        ? 'rgba(217, 221, 204, 0.2)'
                        : colors.border,
                  },
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Filter
                  size={16}
                  color={
                    activeFiltersCount > 0
                      ? '#FFFFFF'
                      : isDark
                      ? '#F1F5F9'
                      : '#0F172A'
                  }
                />
                {activeFiltersCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {activeFiltersCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <View style={styles.activeFiltersRow}>
                {statusFilter !== 'all' && (
                  <View style={styles.activeFilterPill}>
                    <Text style={styles.activeFilterPillText}>
                      Status: {statusFilter}
                    </Text>
                    <TouchableOpacity onPress={() => setStatusFilter('all')}>
                      <X size={12} color="#475569" />
                    </TouchableOpacity>
                  </View>
                )}
                {fromDate && (
                  <View style={styles.activeFilterPill}>
                    <Text style={styles.activeFilterPillText}>
                      From: {fromDate}
                    </Text>
                    <TouchableOpacity onPress={() => setFromDate('')}>
                      <X size={12} color="#475569" />
                    </TouchableOpacity>
                  </View>
                )}
                {toDate && (
                  <View style={styles.activeFilterPill}>
                    <Text style={styles.activeFilterPillText}>
                      To: {toDate}
                    </Text>
                    <TouchableOpacity onPress={() => setToDate('')}>
                      <X size={12} color="#475569" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
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
                Loading insurance register...
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
              <Shield size={46} color={colors.primary} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                No Insurance Records Found
              </Text>
              <Text
                style={[
                  styles.emptySub,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                No historical policies match the current search or filters.
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

      {/* Filter Bottom Sheet Modal */}
      <InsuranceFilterModal
        visible={showFilterModal}
        status={statusFilter}
        fromDate={fromDate}
        toDate={toDate}
        onClose={() => setShowFilterModal(false)}
        onApply={(f) => {
          setStatusFilter(f.status);
          setFromDate(f.fromDate);
          setToDate(f.toDate);
        }}
        onReset={() => {
          setStatusFilter('all');
          setFromDate('');
          setToDate('');
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
          loadData(1, false, searchTerm, statusFilter, fromDate, toDate);
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
          loadData(1, false, searchTerm, statusFilter, fromDate, toDate);
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
  totalBadge: {
    backgroundColor: '#EFF3DF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  totalBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  searchAndFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeFilterPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
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
  contactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickContactBtn: {
    width: 30,
    height: 30,
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
  detailSubVal: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
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
    fontSize: 12,
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
