import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  IndianRupee,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Trophy,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { Deal, DealStats } from './types';
import { dealService } from './dealService';
import { DealCard } from './components/DealCard';
import { UpdateDealStageModal } from './components/UpdateDealStageModal';
import { DealLedgerModal } from './components/DealLedgerModal';
import { AddDealInvoiceModal } from './components/AddDealInvoiceModal';
import { DealRefundCancelModal } from './components/DealRefundCancelModal';
import {
  DEAL_PAYMENT_OPTIONS,
  DEAL_STAGE_OPTIONS,
  DealsFilterModal,
} from './components/DealsFilterModal';
import { leadApi } from '../leads/leadService';
import { CustomerLead } from '../leads/types';
import { LeadProfileModal } from '../leads/components/LeadProfileModal';

export const DealsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState('all');
  const [activePayment, setActivePayment] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isTrashView, setIsTrashView] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Data States
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>({
    total_deals: 0,
    total_gross_value: 0,
    total_collected: 0,
    total_pending_balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Action Modals State
  const [selectedDealForStage, setSelectedDealForStage] = useState<Deal | null>(null);
  const [selectedDealForLedger, setSelectedDealForLedger] = useState<Deal | null>(null);
  const [selectedDealForInvoice, setSelectedDealForInvoice] = useState<Deal | null>(null);
  const [selectedDealForRefundCancel, setSelectedDealForRefundCancel] = useState<Deal | null>(null);

  // Lead Profile Modal States (Matches 360° Lead Details from Leads Screen)
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeProfileLead, setActiveProfileLead] = useState<CustomerLead | null>(null);

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  // Active filter count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeStage !== 'all') count++;
    if (activePayment !== 'all') count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [activeStage, activePayment, fromDate, toDate]);

  // Fetch KPI Stats
  const fetchStats = async () => {
    try {
      const res = await dealService.getStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.log('Error fetching deal stats:', e);
    }
  };

  // Fetch Deals with Pagination & Filters
  const fetchDeals = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);

        const res = await dealService.getAll({
          page: pageNum,
          per_page: 15,
          search: searchQuery,
          deal_status: activeStage === 'all' ? undefined : activeStage,
          stage: activeStage === 'all' ? undefined : activeStage,
          payment_status: activePayment === 'all' ? undefined : activePayment,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          trash: isTrashView,
        });

        const items = res?.data?.data || res?.data || [];
        const records = Array.isArray(items) ? items : [];

        if (pageNum === 1) {
          setDeals(records);
        } else {
          setDeals((prev) => [...prev, ...records]);
        }

        const currentPage = res?.data?.current_page || pageNum;
        const lastPage = res?.data?.last_page || 1;
        setHasMore(currentPage < lastPage);
        setPage(pageNum);

        // If stats are 0, calculate locally from loaded records as fallback
        if (records.length > 0) {
          setStats((prev) => {
            if (prev.total_deals > 0) return prev;
            const gross = records.reduce((acc, d) => acc + Number(d.net_amount || d.total_amount || 0), 0);
            const collected = records.reduce((acc, d) => acc + Number(d.paid_amount || d.total_paid || 0), 0);
            return {
              total_deals: records.length,
              total_gross_value: gross,
              total_collected: collected,
              total_pending_balance: Math.max(0, gross - collected),
            };
          });
        }
      } catch (err: any) {
        console.log('Error fetching deals:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, activeStage, activePayment, fromDate, toDate, isTrashView]
  );

  useEffect(() => {
    fetchStats();
    fetchDeals(1);
  }, [fetchDeals]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    fetchDeals(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    fetchDeals(page + 1);
  };

  const handleResetFilters = () => {
    setActiveStage('all');
    setActivePayment('all');
    setFromDate('');
    setToDate('');
  };

  const handleCall = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned) {
      Linking.openURL(`tel:${cleaned}`).catch(() => {});
    }
  };

  // Open Lead Detail Screen (360° Profile Modal) on Customer Name Press
  const handleCustomerPress = async (deal: Deal) => {
    triggerHaptic();
    const finalLeadId = deal.lead_id || (deal.lead && (deal.lead as any).id);
    if (finalLeadId) {
      try {
        const res = await leadApi.getById(finalLeadId);
        const fullLead = res?.data || res;
        if (fullLead && (fullLead.name || fullLead.id)) {
          setActiveProfileLead(fullLead);
          setProfileModalVisible(true);
          return;
        }
      } catch (e) {
        console.log('Error fetching lead details for profile modal:', e);
      }
    }

    // Fallback if lead API didn't return or no lead_id, synthesize from deal
    const syntheticLead: CustomerLead = {
      id: finalLeadId || deal.id,
      name: deal.customer_name || 'Customer',
      phone: deal.customer_phone || '',
      email: deal.customer_email || '',
      city: deal.customer_city || deal.city || '',
      vehicle_segment: '4 Wheeler',
      model_variant: deal.model_variant || deal.model_name || '',
      brand_name: deal.brand_name || '',
      priority: 'Hot',
      status_name: deal.delivery_stage || deal.deal_status || 'Deal Confirmed',
      assigned_user_name: deal.sales_executive_name || '',
    };
    setActiveProfileLead(syntheticLead);
    setProfileModalVisible(true);
  };

  // Trash Operations
  const handleDeleteDeal = (deal: Deal) => {
    triggerHaptic();
    Alert.alert(
      'Move to Trash',
      `Are you sure you want to move deal ${deal.deal_number || deal.id} to trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await dealService.delete(deal.id);
              showSuccessToast('Moved to Trash', 'Deal soft-deleted successfully.');
              setDeals((prev) => prev.filter((d) => d.id !== deal.id));
              fetchStats();
            } catch (err: any) {
              showErrorToast('Failed', err?.message || 'Could not delete deal.');
            }
          },
        },
      ]
    );
  };

  const handleRestoreDeal = async (deal: Deal) => {
    triggerHaptic();
    try {
      await dealService.restore(deal.id);
      showSuccessToast('Restored', 'Deal restored from trash.');
      setDeals((prev) => prev.filter((d) => d.id !== deal.id));
      fetchStats();
    } catch (err: any) {
      showErrorToast('Failed', err?.message || 'Could not restore deal.');
    }
  };

  const selectedStageLabel =
    DEAL_STAGE_OPTIONS.find((s) => s.key === activeStage)?.label || 'All Stages';
  const selectedPaymentLabel =
    DEAL_PAYMENT_OPTIONS.find((p) => p.key === activePayment)?.label || 'All Payments';

  // List Header Component (FollowUp-style: scrolls smoothly with cards, zero fixed elements)
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 1. Four KPI Cards - Follow-up style horizontal scrollable single line */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiScrollContent}
        style={styles.kpiContainer}
      >
        {/* KPI 1: Total Active Deals */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#58632A',
            },
          ]}
        >
          <View style={styles.kpiTop}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(88, 99, 42, 0.12)' }]}>
              <Trophy size={14} color="#58632A" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiLabel}>TOTAL ACTIVE</Text>
          </View>
          <Text style={[styles.kpiValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {stats.total_deals || deals.length} Deals
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Booked & In-Progress</Text>
        </View>

        {/* KPI 2: Total Deal Pipeline */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#1E3A8A',
            },
          ]}
        >
          <View style={styles.kpiTop}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(30, 58, 138, 0.12)' }]}>
              <IndianRupee size={14} color="#1E3A8A" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiLabel}>TOTAL PIPELINE</Text>
          </View>
          <Text style={[styles.kpiValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {formatInr(stats.total_gross_value)}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Active Deal Value</Text>
        </View>

        {/* KPI 3: Payments Collected */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#059669',
            },
          ]}
        >
          <View style={styles.kpiTop}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
              <CheckCircle2 size={14} color="#059669" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiLabel}>COLLECTED</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>
            {formatInr(stats.total_collected)}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Cleared Receipts</Text>
        </View>

        {/* KPI 4: Pending Receivables */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#DC2626',
            },
          ]}
        >
          <View style={styles.kpiTop}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(220, 38, 38, 0.12)' }]}>
              <Clock size={14} color="#DC2626" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiLabel}>RECEIVABLES</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#DC2626' }]}>
            {formatInr(stats.total_pending_balance)}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Remaining Balance</Text>
        </View>
      </ScrollView>

      {/* 2. Search & Filter Trigger Bar */}
      <View style={styles.searchFilterBar}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#CBD5E1',
            },
          ]}
        >
          <Search size={14} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search deal, customer, phone, VIN..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Modal Trigger Button */}
        <TouchableOpacity
          style={[
            styles.filterTriggerBtn,
            {
              backgroundColor:
                activeFiltersCount > 0 ? colors.primary : isDark ? '#101726' : '#FFFFFF',
              borderColor:
                activeFiltersCount > 0 ? colors.primaryDark : isDark ? '#1E293B' : '#CBD5E1',
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
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.textPrimary}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.filterTriggerText,
              { color: activeFiltersCount > 0 ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            Filters
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Section Title Bar (Task 1: Active Vehicle Deals + Trash Button & Filter Count) */}
      <View style={styles.sectionHeaderBar}>
        <View style={styles.sectionLeft}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {isTrashView ? 'Trash Folder' : 'Active Vehicle Deals'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{deals.length} Records</Text>
          </View>
        </View>

        {/* Trash / Active View Toggle Button */}
        <TouchableOpacity
          style={[
            styles.trashToggleBtn,
            isTrashView && styles.trashToggleBtnActive,
            { borderColor: isTrashView ? '#EF4444' : isDark ? '#1E293B' : '#CBD5E1' },
          ]}
          onPress={() => {
            triggerHaptic();
            setIsTrashView(!isTrashView);
          }}
          activeOpacity={0.7}
        >
          <Trash2 size={15} color={isTrashView ? '#FFFFFF' : '#EF4444'} />
          <Text
            style={[
              styles.trashToggleText,
              { color: isTrashView ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569' },
            ]}
          >
            {isTrashView ? 'Active Deals' : 'Trash'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Active Filter Chips Row (If any filters applied) */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeChipsRow}>
          {activeStage !== 'all' && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>Stage: {selectedStageLabel}</Text>
              <TouchableOpacity onPress={() => setActiveStage('all')}>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          )}

          {activePayment !== 'all' && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>Payment: {selectedPaymentLabel}</Text>
              <TouchableOpacity onPress={() => setActivePayment('all')}>
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          )}

          {(fromDate || toDate) && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                Date: {fromDate || '...'} to {toDate || '...'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFromDate('');
                  setToDate('');
                }}
              >
                <X size={12} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleResetFilters} style={styles.resetAllBtn}>
            <Text style={styles.resetAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Deals FlatList: Everything inside ListHeaderComponent for full-page smooth scrolling */}
      <FlatList
        data={deals}
        keyExtractor={(item) => `deal-${item.id}`}
        renderItem={({ item }) => (
          <DealCard
            deal={item}
            isTrashView={isTrashView}
            onCustomerPress={handleCustomerPress}
            onUpdateStage={(d) => setSelectedDealForStage(d)}
            onViewLedger={(d) => setSelectedDealForLedger(d)}
            onAddInvoice={(d) => setSelectedDealForInvoice(d)}
            onRefundCancel={(d) => setSelectedDealForRefundCancel(d)}
            onRestore={handleRestoreDeal}
            onDelete={handleDeleteDeal}
          />
        )}
        ListHeaderComponent={renderListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 90, 110),
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Trophy size={42} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {isTrashView ? 'No Deleted Deals in Trash' : 'No Vehicle Deals Found'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || activeFiltersCount > 0
                  ? 'Try clearing search or filters to see more results.'
                  : 'Convert qualified leads from Leads Pipeline to create bookings.'}
              </Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity
                  style={[styles.clearFilterBtn, { backgroundColor: colors.primary }]}
                  onPress={handleResetFilters}
                >
                  <Text style={styles.clearFilterText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading deals and bookings...</Text>
            </View>
          )
        }
      />

      {/* Filter Modal (Stage, Payment, Date Range) */}
      <DealsFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedStage={activeStage}
        setSelectedStage={setActiveStage}
        selectedPayment={activePayment}
        setSelectedPayment={setActivePayment}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        activeFiltersCount={activeFiltersCount}
        onReset={handleResetFilters}
        onApply={() => setFilterModalVisible(false)}
      />

      {/* Action Modals */}
      <UpdateDealStageModal
        visible={selectedDealForStage !== null}
        deal={selectedDealForStage}
        onClose={() => setSelectedDealForStage(null)}
        onSuccess={() => {
          fetchDeals(1, true);
          fetchStats();
        }}
      />

      <DealLedgerModal
        visible={selectedDealForLedger !== null}
        deal={selectedDealForLedger}
        onClose={() => setSelectedDealForLedger(null)}
      />

      <AddDealInvoiceModal
        visible={selectedDealForInvoice !== null}
        deal={selectedDealForInvoice}
        onClose={() => setSelectedDealForInvoice(null)}
        onSuccess={() => {
          fetchDeals(1, true);
          fetchStats();
        }}
      />

      {/* Money Return & Deal Cancellation Modal (Screenshot 2) */}
      <DealRefundCancelModal
        visible={selectedDealForRefundCancel !== null}
        deal={selectedDealForRefundCancel}
        onClose={() => setSelectedDealForRefundCancel(null)}
        onSuccess={() => {
          fetchDeals(1, true);
          fetchStats();
        }}
      />

      {/* Lead Profile Modal (360° Lead Details, matching Leads screen) */}
      <LeadProfileModal
        visible={profileModalVisible}
        lead={activeProfileLead}
        onClose={() => setProfileModalVisible(false)}
        onCall={handleCall}
        onConvertToDeal={() => {
          setProfileModalVisible(false);
        }}
        onSendQuotation={(ld) => {
          setProfileModalVisible(false);
          navigation.navigate('send-quotation', { leadId: ld?.id });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeaderContainer: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  kpiContainer: {
    paddingVertical: 4,
    marginBottom: 6,
  },
  kpiScrollContent: {
    paddingHorizontal: 12,
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
  kpiTop: {
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
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterCountBadge: {
    backgroundColor: '#EE6800',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  trashToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  trashToggleBtnActive: {
    backgroundColor: '#EF4444',
  },
  trashToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeChipText: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  resetAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  resetAllText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
