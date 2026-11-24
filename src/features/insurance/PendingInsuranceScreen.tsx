import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  ShieldPlus,
  User,
  X,
} from 'lucide-react-native';
import { colors } from '../../core/theme/colors';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { AddInsuranceModal } from './components/AddInsuranceModal';
import { formatIndianCurrency, insuranceService } from './insuranceService';
import { InsurancePagination, PendingInsuranceDeal } from './types';

export const PendingInsuranceScreen: React.FC = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [deals, setDeals] = useState<PendingInsuranceDeal[]>([]);
  const [metrics, setMetrics] = useState({
    pendingCount: 0,
    portfolioExposure: 0,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected deal for Add Insurance Modal
  const [selectedDeal, setSelectedDeal] = useState<PendingInsuranceDeal | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(
    async (
      pageNumber: number = 1,
      isLoadMore: boolean = false,
      search: string = searchTerm,
    ) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else if (!isRefreshing) {
          setIsLoading(true);
        }

        const res = await insuranceService.getPendingDeals({
          page: pageNumber,
          per_page: 10,
          search,
        });

        if (res && res.status) {
          if (isLoadMore) {
            setDeals(prev => [...prev, ...res.data]);
          } else {
            setDeals(res.data);
            setMetrics(res.metrics);
            setTotalCount(res.pagination.total);
          }
          setPage(pageNumber);
          setHasMore(!!res.hasMore);
        }
      } catch (err) {
        console.error('loadPendingDeals error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [searchTerm, isRefreshing],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(1, false, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(1, false, searchTerm);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading && !isRefreshing) {
      loadData(page + 1, true, searchTerm);
    }
  };

  const toDisplayDate = (isoStr?: string): string => {
    if (!isoStr) return '—';
    if (isoStr.includes('-')) {
      const parts = isoStr.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const renderDealCard = ({ item }: { item: PendingInsuranceDeal }) => {
    return (
      <View
        style={[
          styles.dealCard,
          {
            backgroundColor: isDark ? '#131C27' : '#FFFFFF',
            borderColor: isDark ? 'rgba(217, 221, 204, 0.18)' : colors.border,
          },
        ]}
      >
        {/* Card Header: Deal # & Booking Date */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.dealBadge}>
            <Text style={styles.dealBadgeText}>{item.deal_number}</Text>
          </View>
          <View style={styles.dateRow}>
            <Calendar size={13} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text
              style={[
                styles.dateText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Booking Date: {toDisplayDate(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.cardBody}>
          <View style={styles.customerNameRow}>
            <User size={15} color={colors.primary} />
            <Text
              style={[
                styles.customerName,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.customer_name}
            </Text>
          </View>

          <View style={styles.contactDetailsRow}>
            {item.customer_phone ? (
              <View style={styles.subMetaItem}>
                <Phone size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text
                  style={[
                    styles.subMetaText,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {item.customer_phone}
                </Text>
              </View>
            ) : null}

            {item.customer_city ? (
              <View style={styles.subMetaItem}>
                <MapPin size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text
                  style={[
                    styles.subMetaText,
                    { color: isDark ? '#CBD5E1' : '#475569' },
                  ]}
                >
                  {item.customer_city}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Vehicle Model & Variant */}
          <View
            style={[
              styles.vehicleInfoBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.vehicleTitle,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
              numberOfLines={1}
            >
              {item.model_variant}
            </Text>
            {item.brand_name ? (
              <View
                style={[
                  styles.brandBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(88, 99, 42, 0.25)'
                      : '#EFF3DF',
                    borderColor: isDark ? 'rgba(88, 99, 42, 0.4)' : '#DCE9A2',
                  },
                ]}
              >
                <Text style={styles.brandBadgeText}>{item.brand_name}</Text>
              </View>
            ) : null}
            <View style={styles.vehicleMetaRow}>
              <Text
                style={[
                  styles.vehicleMetaText,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                Color: {item.color || 'Standard'}
              </Text>
              {item.registration_number ? (
                <Text
                  style={[
                    styles.vehicleMetaText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Reg: {item.registration_number}
                </Text>
              ) : null}
              {item.vin_chassis_number ? (
                <Text
                  style={[
                    styles.vehicleMetaText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  VIN: {item.vin_chassis_number}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Financials & Status Row */}
          <View style={styles.financialsRow}>
            <View>
              <Text style={styles.finLabel}>Deal Total</Text>
              <Text
                style={[
                  styles.finAmount,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                ₹{formatIndianCurrency(item.net_amount || item.total_amount)}
              </Text>
            </View>

            <View style={styles.noInsuranceBadge}>
              <ShieldAlert size={12} color="#DC2626" />
              <Text style={styles.noInsuranceText}>No Insurance</Text>
            </View>
          </View>

          {/* Action Button: + Add Insurance */}
          <TouchableOpacity
            style={[
              styles.addInsuranceBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              triggerHaptic('impactMedium');
              setSelectedDeal(item);
              setShowAddModal(true);
            }}
          >
            <ShieldPlus size={16} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.addInsuranceBtnText}>+ Add Insurance</Text>
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
        data={deals}
        keyExtractor={item => String(item.id)}
        renderItem={renderDealCard}
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
            {/* Title & Subtitle (Strictly omitting top buttons as requested) */}
            <View style={styles.titleWrapper}>
              <Text
                style={[
                  styles.pageTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                Pending Insurance Deals
              </Text>
            </View>

            {/* Horizontal KPI Deck */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiScrollContainer}
            >
              {/* Card 1: PENDING INSURANCE */}
              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                    borderTopColor: '#EF4444',
                    borderColor: isDark
                      ? 'rgba(217, 221, 204, 0.15)'
                      : colors.border,
                  },
                ]}
              >
                <View style={styles.kpiHeaderRow}>
                  <Text style={styles.kpiTitle}>PENDING INSURANCE</Text>
                  <View
                    style={[styles.kpiIconBox, { backgroundColor: '#FEE2E2' }]}
                  >
                    <ShieldAlert size={14} color="#DC2626" />
                  </View>
                </View>
                <Text
                  style={[
                    styles.kpiValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  {metrics.pendingCount} Deals
                </Text>
                <Text style={[styles.kpiSub, { color: '#DC2626' }]}>
                  Action Required (Uninsured)
                </Text>
              </View>

              {/* Card 2: PORTFOLIO EXPOSURE */}
              <View
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                    borderTopColor: colors.primary,
                    borderColor: isDark
                      ? 'rgba(217, 221, 204, 0.15)'
                      : colors.border,
                  },
                ]}
              >
                <View style={styles.kpiHeaderRow}>
                  <Text style={styles.kpiTitle}>PORTFOLIO EXPOSURE</Text>
                  <View
                    style={[styles.kpiIconBox, { backgroundColor: '#EFF3DF' }]}
                  >
                    <IndianRupee size={14} color={colors.primary} />
                  </View>
                </View>
                <Text
                  style={[
                    styles.kpiValue,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                  numberOfLines={1}
                >
                  ₹{formatIndianCurrency(metrics.portfolioExposure)}
                </Text>
                <Text
                  style={[
                    styles.kpiSub,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Uninsured Vehicles Value
                </Text>
              </View>
            </ScrollView>

            {/* Section Subheader & Search Row */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionBadgeRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Deals Awaiting Insurance
                </Text>
                <View
                  style={[
                    styles.countPill,
                    { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                  ]}
                >
                  <Text
                    style={[
                      styles.countPillText,
                      { color: isDark ? '#CBD5E1' : '#334155' },
                    ]}
                  >
                    {metrics.pendingCount} Deals
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? '#131C27' : '#FFFFFF',
                  borderColor: isDark
                    ? 'rgba(217, 221, 204, 0.2)'
                    : colors.border,
                },
              ]}
            >
              <Search size={16} color={isDark ? '#94A3B8' : '#64748B'} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
                placeholder="Search customer, phone ... "
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
                Loading pending insurance deals...
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
              <ShieldAlert size={44} color="#16A34A" />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDark ? '#F1F5F9' : '#0F172A' },
                ]}
              >
                No Pending Insurance Deals!
              </Text>
              <Text
                style={[
                  styles.emptySub,
                  { color: isDark ? '#94A3B8' : '#64748B' },
                ]}
              >
                All booked vehicle deals currently have insurance policies
                linked.
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

      {/* Add Insurance Modal */}
      <AddInsuranceModal
        visible={showAddModal}
        deal={selectedDeal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedDeal(null);
        }}
        onSuccess={() => {
          loadData(1, false, searchTerm);
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
  titleWrapper: {
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  kpiScrollContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
    marginBottom: 14,
  },
  kpiCard: {
    width: 160,
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderTopWidth: 3,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  dealCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dealBadge: {
    backgroundColor: '#EFF3DF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  cardBody: {
    paddingTop: 10,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  subMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subMetaText: {
    fontSize: 12,
  },
  vehicleInfoBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 2,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  vehicleMetaText: {
    fontSize: 11,
  },
  financialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  finLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  finAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  noInsuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noInsuranceText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  addInsuranceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 8,
  },
  addInsuranceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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
