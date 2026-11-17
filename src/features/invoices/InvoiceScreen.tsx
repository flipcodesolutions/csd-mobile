import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useTheme } from '../../core/theme/ThemeContext';
import { triggerHaptic } from '../../core/utils/haptics';
import { showErrorToast, showSuccessToast } from '../../core/utils/toast';
import { Deal } from '../deals/types';
import {
  DEAL_PAYMENT_OPTIONS,
  DEAL_STAGE_OPTIONS,
  DealsFilterModal,
} from '../deals/components/DealsFilterModal';
import { invoiceService } from './invoiceService';
import { EnrichedDeal, InvoiceRecord, InvoiceStats } from './types';
import { DealInvoiceCard } from './components/DealInvoiceCard';
import { MasterInvoiceCard } from './components/MasterInvoiceCard';
import { GenerateInvoiceModal } from './components/GenerateInvoiceModal';
import { DealInvoicesLedgerModal } from './components/DealInvoicesLedgerModal';
import { PrintableInvoiceModal } from './components/PrintableInvoiceModal';

export const InvoiceScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Active Tab: 'deals' (Customer & Deal Invoices Register) or 'invoices' (All Invoices Date-wise Master)
  const [activeTab, setActiveTab] = useState<'deals' | 'invoices'>('deals');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState('all');
  const [activePayment, setActivePayment] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Raw Deals & Backend Stats State
  const [rawDeals, setRawDeals] = useState<Deal[]>([]);
  const [backendStats, setBackendStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Modal States
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [selectedDealForInvoice, setSelectedDealForInvoice] = useState<Deal | null>(null);

  const [ledgerModalVisible, setLedgerModalVisible] = useState(false);
  const [selectedDealForLedger, setSelectedDealForLedger] = useState<EnrichedDeal | null>(null);

  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<InvoiceRecord | null>(null);

  const formatInr = (val?: number | string) => {
    const num = Number(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeStage !== 'all') count++;
    if (activePayment !== 'all') count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [activeStage, activePayment, fromDate, toDate]);

  // Fetch initial data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [dealsRes, statsRes] = await Promise.allSettled([
        invoiceService.getDeals(),
        invoiceService.getStats(),
      ]);

      if (dealsRes.status === 'fulfilled' && dealsRes.value?.data) {
        setRawDeals(dealsRes.value.data);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.status && statsRes.value.data) {
        setBackendStats(statsRes.value.data);
      }
    } catch (e) {
      console.log('Error loading invoices data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadData(true);
  };

  // Transform Deals to EnrichedDeals with their nested invoices
  const enrichedDeals: EnrichedDeal[] = useMemo(() => {
    return rawDeals.map((d) => {
      const payments = d.payments && Array.isArray(d.payments) ? d.payments : [];

      const dealInvoices: InvoiceRecord[] = payments.map((p, idx) => {
        const invDate =
          p.payment_date ||
          (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
        const invNo =
          p.invoice_no ||
          p.invoice_number ||
          `DAL-/${new Date(invDate).getFullYear()}/${String(new Date(invDate).getMonth() + 1).padStart(2, '0')}/${String(1000 + (p.id || idx + 1))}`;

        let installmentTitle = 'Installment Payment';
        if (p.payment_type) {
          installmentTitle = p.payment_type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
        }

        const amt = Number(p.amount) || 0;

        return {
          id: p.id || `INV-${d.id}-${idx + 1}`,
          payment_id: p.id,
          deal_id: d.id,
          deal_number: d.deal_number || `DEAL-${d.id}`,
          invoice_no: invNo,
          payment_date: invDate,
          time: p.created_at
            ? new Date(p.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '12:00 PM',
          created_at: p.created_at,
          payment_type: installmentTitle,
          payment_mode: (p.payment_mode || 'UPI').toUpperCase(),
          transaction_reference: p.transaction_reference || (p as any).reference_no || 'VERIFIED-REF',
          bank_name: p.bank_name || 'HDFC Bank',
          received_by: p.received_by || 'Admin User',
          amount: amt,
          status: p.status === 'cleared' ? 'Paid' : p.status || 'Paid',
          notes: p.notes,
          customer_name: d.customer_name,
          customer_phone: d.customer_phone,
          customer_email: d.customer_email,
          customer_city: d.customer_city || d.city,
          vehicle_model: d.model_variant || d.model_name || 'Vehicle',
          color: d.color,
          vin: d.vin_chassis_number || d.vin,
          registration_number: d.registration_number,
          has_insurance: d.has_insurance,
          deal_status: d.deal_status,
          deal_total_amount: Number(d.net_amount || d.total_amount || 0),
          deal_paid_amount: Number(d.paid_amount || d.total_paid || 0),
          deal_balance_due: Number(
            d.balance_due !== undefined
              ? d.balance_due
              : Math.max(0, Number(d.net_amount || d.total_amount || 0) - Number(d.paid_amount || d.total_paid || 0))
          ),
          items: [
            {
              description: `${installmentTitle} for ${d.model_variant || 'Vehicle'}`,
              hsn: '998313',
              quantity: 1,
              rate: amt,
              amount: amt,
            },
          ],
          parent_deal: d,
        };
      });

      const totalPaid = Number(d.paid_amount ?? d.total_paid ?? 0);
      const netAmount = Number(d.net_amount ?? d.total_amount ?? 0);
      const balanceDue = Math.max(0, netAmount - totalPaid);
      const pctPaid = Math.min(100, Math.round(((totalPaid || 0) / (netAmount || 1)) * 100));

      return {
        ...d,
        computedTotalPaid: totalPaid,
        computedBalanceDue: balanceDue,
        computedPercentPaid: pctPaid,
        invoices: dealInvoices,
        invoicesCount: dealInvoices.length,
      };
    });
  }, [rawDeals]);

  // Master Flattened List of ALL Invoices across deals (Tab 2)
  const allMasterInvoices: InvoiceRecord[] = useMemo(() => {
    const list: InvoiceRecord[] = [];
    enrichedDeals.forEach((d) => {
      (d.invoices || []).forEach((inv) => {
        list.push(inv);
      });
    });
    // Sort newest date first
    return list.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [enrichedDeals]);

  // Overall KPI Metrics
  const stats: InvoiceStats = useMemo(() => {
    if (backendStats && backendStats.total_deal_volume > 0) {
      return backendStats;
    }
    const vol = enrichedDeals.reduce((sum, d) => sum + Number(d.net_amount || d.total_amount || 0), 0);
    const collected = enrichedDeals.reduce((sum, d) => sum + Number(d.paid_amount || d.total_paid || 0), 0);
    const pending = Math.max(0, vol - collected);
    return {
      total_deal_volume: vol,
      total_collected: collected,
      total_pending: pending,
      total_invoices_count: allMasterInvoices.length,
      total_deals_count: enrichedDeals.length,
    };
  }, [backendStats, enrichedDeals, allMasterInvoices]);

  // Filtered Deals for Tab 1
  const filteredDeals = useMemo(() => {
    return enrichedDeals.filter((d) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (d.customer_name || '').toLowerCase();
        const dealNo = (d.deal_number || '').toLowerCase();
        const phone = (d.customer_phone || '').toLowerCase();
        const vehicle = (d.model_variant || d.model_name || '').toLowerCase();
        const vin = (d.vin_chassis_number || '').toLowerCase();
        const matches =
          name.includes(q) ||
          dealNo.includes(q) ||
          phone.includes(q) ||
          vehicle.includes(q) ||
          vin.includes(q);
        if (!matches) return false;
      }

      // Stage filter
      if (activeStage !== 'all') {
        const s = (d.delivery_stage || d.deal_status || '').toLowerCase().replace(/\s/g, '_');
        if (s !== activeStage.toLowerCase().replace(/\s/g, '_')) return false;
      }

      // Payment filter
      if (activePayment !== 'all') {
        const pStatus = (d.payment_status || '').toLowerCase();
        const isPaid = d.computedBalanceDue <= 0 || pStatus === 'fully_paid';
        if (activePayment === 'fully_paid' && !isPaid) return false;
        if (activePayment === 'partial' && (isPaid || d.computedTotalPaid <= 0)) return false;
        if (activePayment === 'pending' && d.computedTotalPaid > 0) return false;
      }

      // Date range filter
      if (fromDate) {
        const rawDate = d.booking_date || d.created_at || '';
        const dDate = rawDate ? rawDate.split('T')[0] : '';
        if (dDate && dDate < fromDate) return false;
      }
      if (toDate) {
        const rawDate = d.booking_date || d.created_at || '';
        const dDate = rawDate ? rawDate.split('T')[0] : '';
        if (dDate && dDate > toDate) return false;
      }

      return true;
    });
  }, [enrichedDeals, searchQuery, activeStage, activePayment, fromDate, toDate]);

  // Filtered Master Invoices for Tab 2
  const filteredMasterInvoices = useMemo(() => {
    return allMasterInvoices.filter((inv) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invNo = (inv.invoice_no || '').toLowerCase();
        const dealNo = (inv.deal_number || '').toLowerCase();
        const name = (inv.customer_name || '').toLowerCase();
        const phone = (inv.customer_phone || '').toLowerCase();
        const vehicle = (inv.vehicle_model || '').toLowerCase();
        const utr = (inv.transaction_reference || '').toLowerCase();
        const matches =
          invNo.includes(q) ||
          dealNo.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          vehicle.includes(q) ||
          utr.includes(q);
        if (!matches) return false;
      }

      // Payment mode/type filter
      if (activePayment !== 'all') {
        const m = (inv.payment_mode || '').toLowerCase();
        const t = (inv.payment_type || '').toLowerCase();
        if (activePayment === 'fully_paid' && !t.includes('final') && !t.includes('clearance')) {
          // Pass through
        }
      }

      // Date range filter
      if (fromDate && inv.payment_date < fromDate) return false;
      if (toDate && inv.payment_date > toDate) return false;

      return true;
    });
  }, [allMasterInvoices, searchQuery, activePayment, fromDate, toDate]);

  // Paginated Slices
  const paginatedDeals = useMemo(() => {
    return filteredDeals.slice(0, page * PAGE_SIZE);
  }, [filteredDeals, page]);

  const paginatedMasterInvoices = useMemo(() => {
    return filteredMasterInvoices.slice(0, page * PAGE_SIZE);
  }, [filteredMasterInvoices, page]);

  const hasMore =
    activeTab === 'deals'
      ? paginatedDeals.length < filteredDeals.length
      : paginatedMasterInvoices.length < filteredMasterInvoices.length;

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleResetFilters = () => {
    setActiveStage('all');
    setActivePayment('all');
    setFromDate('');
    setToDate('');
  };

  // Customer Profile Navigation
  const handleCustomerPress = (dealOrInv: any) => {
    triggerHaptic();
    const finalLeadId = dealOrInv.lead_id || (dealOrInv.parent_deal && dealOrInv.parent_deal.lead_id);
    if (!finalLeadId) {
      Alert.alert(
        'Lead Information',
        `Customer: ${dealOrInv.customer_name}\nPhone: ${dealOrInv.customer_phone || 'N/A'}\nCity: ${dealOrInv.customer_city || dealOrInv.city || 'N/A'}`
      );
      return;
    }
    try {
      navigation.navigate('LeadDetail', { leadId: finalLeadId });
    } catch (e) {
      navigation.navigate('leads');
    }
  };

  const selectedStageLabel =
    DEAL_STAGE_OPTIONS.find((s) => s.key === activeStage)?.label || 'All Stages';
  const selectedPaymentLabel =
    DEAL_PAYMENT_OPTIONS.find((p) => p.key === activePayment)?.label || 'All Payments';

  // Render Full Header (KPIs, Tabs, Search & Filters, Section Title)
  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Screen Title Bar: Title on left, "+ Generate New Invoice" button on right (NO export or refresh) */}
      <View style={styles.screenTitleRow}>
        <View style={styles.titleLeft}>
          <Text style={[styles.screenHeading, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Vehicle Deals & Invoices Register
          </Text>
        </View>

        <TouchableOpacity
          style={styles.generateNewBtn}
          onPress={() => {
            triggerHaptic('impactLight');
            setSelectedDealForInvoice(null);
            setGenerateModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.generateNewBtnText}>Generate New Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Four KPI Cards - Follow-up style horizontal scrollable single line */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiScrollContent}
        style={styles.kpiContainer}
      >
        {/* KPI 1: TOTAL DEAL PIPELINE */}
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
            <Text style={styles.kpiLabel}>DEAL PIPELINE</Text>
          </View>
          <Text style={[styles.kpiValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {formatInr(stats.total_deal_volume)}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>{stats.total_deals_count} Active Deals</Text>
        </View>

        {/* KPI 2: PAYMENTS COLLECTED */}
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
          <Text style={styles.kpiSub} numberOfLines={1}>Cleared via Invoices</Text>
        </View>

        {/* KPI 3: PENDING RECEIVABLES */}
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
            {formatInr(stats.total_pending)}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Remaining Balance</Text>
        </View>

        {/* KPI 4: SEQUENTIAL INVOICES */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: isDark ? '#101726' : '#FFFFFF',
              borderColor: isDark ? '#1E293B' : '#E2E8F0',
              borderTopColor: '#0284C7',
            },
          ]}
        >
          <View style={styles.kpiTop}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
              <FileSpreadsheet size={14} color="#0284C7" strokeWidth={2.4} />
            </View>
            <Text style={styles.kpiLabel}>INVOICES</Text>
          </View>
          <Text style={[styles.kpiValue, { color: '#0284C7' }]}>
            {stats.total_invoices_count}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>Issued DAL Invoices</Text>
        </View>
      </ScrollView>

      {/* 3. Two View Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'deals' && styles.tabPillActive,
            {
              backgroundColor:
                activeTab === 'deals'
                  ? colors.primary
                  : isDark
                  ? '#101726'
                  : '#FFFFFF',
              borderColor:
                activeTab === 'deals'
                  ? colors.primary
                  : isDark
                  ? '#1E293B'
                  : '#CBD5E1',
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('deals');
            setPage(1);
          }}
          activeOpacity={0.8}
        >
          <Layers
            size={14}
            color={activeTab === 'deals' ? '#FFFFFF' : colors.textPrimary}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.tabPillText,
              { color: activeTab === 'deals' ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            Customer Deals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'invoices' && styles.tabPillActive,
            {
              backgroundColor:
                activeTab === 'invoices'
                  ? colors.primary
                  : isDark
                  ? '#101726'
                  : '#FFFFFF',
              borderColor:
                activeTab === 'invoices'
                  ? colors.primary
                  : isDark
                  ? '#1E293B'
                  : '#CBD5E1',
            },
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setActiveTab('invoices');
            setPage(1);
          }}
          activeOpacity={0.8}
        >
          <FileText
            size={14}
            color={activeTab === 'invoices' ? '#FFFFFF' : colors.textPrimary}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.tabPillText,
              { color: activeTab === 'invoices' ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            All Invoices
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Search & Filter Bar */}
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
            placeholder={
              activeTab === 'deals'
                ? 'Search name, phone, VIN, deal...'
                : 'Search invoice no, deal, customer, UTR...'
            }
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Trigger Button */}
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

      {/* 5. Active Filters Chips (If applied) */}
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
      {/* Main FlatList with full-page smooth scrolling */}
      <FlatList
        data={activeTab === 'deals' ? (paginatedDeals as any[]) : (paginatedMasterInvoices as any[])}
        keyExtractor={(item) =>
          activeTab === 'deals' ? `deal-inv-${item.id}` : `master-inv-${item.id}`
        }
        renderItem={({ item }) => {
          if (activeTab === 'deals') {
            const d = item as EnrichedDeal;
            return (
              <DealInvoiceCard
                deal={d}
                onCustomerPress={handleCustomerPress}
                onAddBill={(dl) => {
                  setSelectedDealForInvoice(dl);
                  setGenerateModalVisible(true);
                }}
                onViewLedger={(dl) => {
                  setSelectedDealForLedger(dl);
                  setLedgerModalVisible(true);
                }}
              />
            );
          } else {
            const inv = item as InvoiceRecord;
            return (
              <MasterInvoiceCard
                invoice={inv}
                onCustomerPress={handleCustomerPress}
                onViewBill={(record) => {
                  setSelectedInvoiceForPrint(record);
                  setPrintModalVisible(true);
                }}
                onViewDealLedger={(record) => {
                  const matched = enrichedDeals.find((d) => d.id === record.deal_id);
                  if (matched) {
                    setSelectedDealForLedger(matched);
                    setLedgerModalVisible(true);
                  }
                }}
              />
            );
          }
        }}
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
          hasMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <FileSpreadsheet size={40} color="#94A3B8" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                {activeTab === 'deals' ? 'No Deals Found' : 'No Invoices Recorded Yet'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || activeFiltersCount > 0
                  ? 'Try clearing search or filters to see more results.'
                  : 'Generate new installment tax invoices to start populating this register.'}
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
              <Text style={styles.loadingText}>Loading vehicle deals & invoices...</Text>
            </View>
          )
        }
      />

      {/* 1. Generate Tax Invoice & Record Payment Modal (Screenshot 2) */}
      <GenerateInvoiceModal
        visible={generateModalVisible}
        deal={selectedDealForInvoice}
        allDeals={rawDeals}
        onClose={() => {
          setGenerateModalVisible(false);
          setSelectedDealForInvoice(null);
        }}
        onSuccess={() => {
          loadData(true);
        }}
      />

      {/* 2. Deal Ledger & Invoices Modal (Screenshot 3) */}
      <DealInvoicesLedgerModal
        visible={ledgerModalVisible}
        deal={selectedDealForLedger}
        onClose={() => {
          setLedgerModalVisible(false);
          setSelectedDealForLedger(null);
        }}
        onViewInvoiceBill={(inv) => {
          setSelectedInvoiceForPrint(inv);
          setPrintModalVisible(true);
        }}
        onAddNextInvoice={(d) => {
          setSelectedDealForInvoice(d);
          setGenerateModalVisible(true);
        }}
      />

      {/* 3. Printable Tax Invoice / Payment Voucher Modal (Specification Section 5) */}
      <PrintableInvoiceModal
        visible={printModalVisible}
        invoice={selectedInvoiceForPrint}
        onClose={() => {
          setPrintModalVisible(false);
          setSelectedInvoiceForPrint(null);
        }}
      />

      {/* 4. Filter Modal (Stage, Payment, From Date, To Date) */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  titleLeft: {
    flex: 1,
    marginRight: 8,
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  generateNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#58632A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  generateNewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: '100%',
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabPillActive: {
    borderColor: 'transparent',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  tabCountPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tabCountPillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
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
    fontSize: 12.5,
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
